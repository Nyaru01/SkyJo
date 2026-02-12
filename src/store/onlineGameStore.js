
import { create } from 'zustand';
import { io } from 'socket.io-client';
import { AVATARS } from '../lib/avatars';
import { useGameStore } from './gameStore';

// Dynamic socket URL: use same origin to work with Vite proxy and local network
const SOCKET_URL = window.location.origin;

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket', 'polling']
});

// Track if listeners have been set up
let listenersInitialized = false;

export const useOnlineGameStore = create((set, get) => ({
    // Connection State
    isConnected: false,
    socketId: null, // Expose ID
    playerName: '',
    playerEmoji: '🐱',
    roomCode: null,
    isHost: false,
    publicRooms: [], // Available public rooms
    error: null,

    // Game State (synced from server)
    gameState: null,
    players: [],
    totalScores: {},
    roundNumber: 1,
    gameStarted: false,
    onlineStarted: false, // Alias for isConnected/inSession
    activeState: null,    // Alias for gameState
    isGameOver: false,
    drawnCardSource: null, // 'pile' or 'discard'
    gameWinner: null,
    readyStatus: { readyCount: 0, totalPlayers: 0 }, // Track ready players for next round
    timeoutExpired: false, // True when 10s timeout has passed and host can force-start
    gameMode: null, // 'classic' or 'bonus' (must be chosen by host)

    // Redirection State (when host leaves)
    redirectionState: { active: false, timer: 5, reason: '' },

    // UI Local State
    selectedCardIndex: null,
    isCreatingRoom: false, // Guard contre les doubles clics

    // Animation feedback state
    lastAction: null,

    // Notification state for toasts
    lastNotification: null,

    // Animation state
    pendingAnimation: null, // { type, sourceId, targetId, card, onComplete }
    setPendingAnimation: (animation) => set({ pendingAnimation: animation }),
    clearPendingAnimation: () => set({ pendingAnimation: null }),


    // Actions
    connect: () => {
        // Set up listeners only once
        if (!listenersInitialized) {
            listenersInitialized = true;

            socket.on('connect', () => {
                console.log('[Socket] Connected:', socket.id);
                set({ isConnected: true, socketId: socket.id, error: null });
            });

            socket.on('disconnect', () => {
                console.log('[Socket] Disconnected');
                set({ isConnected: false, socketId: null });
            });

            socket.on('error', (msg) => {
                console.log('[Socket] Error:', msg);
                set({ error: msg, isCreatingRoom: false });
                // Auto-clear error after 3s
                setTimeout(() => set({ error: null }), 3000);
            });

            socket.on('room_created', (roomCode) => {
                console.log('[Socket] Room created:', roomCode);
                set({ roomCode, isHost: true, error: null, isCreatingRoom: false });
            });

            socket.on('room_list_update', (rooms) => {
                set({ publicRooms: rooms });
            });

            socket.on('mode_changed', (mode) => {
                console.log('[Socket] Mode changed to:', mode, 'My isHost:', get().isHost);
                set({ gameMode: mode });
            });

            socket.on('room_sync', (data) => {
                console.log('[Socket] Room sync received:', data);
                if (data.gameMode) set({ gameMode: data.gameMode });
                if (data.roundNumber) set({ roundNumber: data.roundNumber });
                if (data.isHost !== undefined) set({ isHost: data.isHost });
            });

            socket.on('new_player_joined', ({ playerName, emoji }) => {
                // Convert avatarId to real emoji (emoji field contains the avatar ID like 'cat')
                // Avatar removed from notification text as per user request for cleaner UI

                set({
                    lastNotification: {
                        type: 'info',
                        message: `${playerName} a rejoint la partie !`,
                        sound: 'join', // Custom flag to trigger sound
                        timestamp: Date.now()
                    }
                });
            });

            socket.on('invitation_sent', () => {
                set({
                    lastNotification: {
                        type: 'success',
                        message: "Invitation envoyée !",
                        timestamp: Date.now()
                    }
                });
            });

            socket.on('invitation_failed', ({ reason }) => {
                let message = "Échec de l'invitation";
                if (reason === 'OFFLINE') message = "L'ami est hors ligne";
                if (reason === 'PUSH_DISABLED') message = "Notifications non activées par l'ami";

                set({
                    lastNotification: {
                        type: 'error',
                        message,
                        timestamp: Date.now()
                    }
                });
            });

            socket.on('gameplay_error', (msg) => {
                console.log('[Socket] Gameplay Error:', msg);
                set({
                    lastNotification: {
                        type: 'error',
                        message: msg,
                        timestamp: Date.now()
                    }
                });
            });

            socket.on('player_list_update', (players) => {
                console.log('[Socket] Player list update:', players.length, 'players, my socket.id:', socket.id);
                // Use socket.id directly - more reliable than state.socketId which may be stale
                // Server now sends { id: 'dbId', socketId: 'socketId' } for persistent users
                const me = players.find(p => p.socketId === socket.id || p.id === socket.id);
                console.log('[Socket] Found me:', me?.name, 'isHost:', me?.isHost);
                set({ players, isHost: me?.isHost === true });
            });

            socket.on('game_started', ({ gameState, totalScores, roundNumber, gameMode }) => {
                console.log('[Socket] Game started, round:', roundNumber, 'mode:', gameMode);
                set({
                    gameState,
                    activeState: gameState,
                    totalScores,
                    roundNumber,
                    gameStarted: true,
                    onlineStarted: true,
                    isGameOver: false,
                    gameWinner: null,
                    selectedCardIndex: null,
                    readyStatus: { readyCount: 0, totalPlayers: get().players.length || Object.keys(totalScores).length },
                    timeoutExpired: false,
                    gameMode: gameMode || get().gameMode
                });
            });

            socket.on('game_update', ({ gameState, lastAction }) => {
                // If there's an action to animate, do it first
                if (lastAction) {
                    const { type, playerId, cardIndex, cardValue } = lastAction;
                    // We need to find the player to execute animation 
                    // But wait, the `gameState` received is the NEW state (post-action).
                    // This is tricky. In local, we animate THEN update.
                    // Here we receive the update. If we set it immediately, the card teleports.
                    // So we must: 
                    // 1. NOT set gameState immediately.
                    // 2. Set animation.
                    // 3. On animation complete, set gameState.

                    // Helper to get Source/Target IDs
                    let sourceId = null;
                    let targetId = null;
                    let cardToAnimate = null;

                    if (type === 'draw_pile') {
                        sourceId = 'deck-pile';
                        targetId = 'drawn-card-slot';
                        set({ drawnCardSource: 'pile' });
                        // For draw, we might not know the card if it's hidden, 
                        // but usually if I drew it, I know it? 
                        // Or if opponent drew, I assume it's face down?
                        // The server `lastAction` should probably contain details.
                    } else if (type === 'draw_discard') {
                        sourceId = 'discard-pile';
                        targetId = 'drawn-card-slot';
                        cardToAnimate = { value: cardValue, isRevealed: true }; // We know value if from discard
                        set({ drawnCardSource: 'discard' });
                    } else if (type === 'replace_card') {
                        // From center to slot
                        sourceId = 'drawn-card-slot';
                        targetId = `card-${playerId}-${cardIndex}`;
                        cardToAnimate = { value: cardValue, isRevealed: true };
                        set({ drawnCardSource: null });
                    } else if (type === 'discard_drawn') {
                        // From center to discard
                        sourceId = 'drawn-card-slot';
                        targetId = 'discard-pile';
                        cardToAnimate = { value: cardValue, isRevealed: true };
                        set({ drawnCardSource: null });
                    } else if (type === 'discard_and_reveal') {
                        // This is a complex one: Card goes to discard, AND another card is revealed.
                        // Animation: Drawn card -> Discard.
                        sourceId = 'drawn-card-slot';
                        targetId = 'discard-pile';
                        cardToAnimate = { value: cardValue, isRevealed: true };
                        set({ drawnCardSource: null });
                    } else if (type === 'undo_draw_discard') {
                        // Undo: Drawn card (Center) -> Discard Pile
                        sourceId = 'drawn-card-slot';
                        targetId = 'discard-pile';
                        // For undo, we don't have 'cardValue' in payload usually, 
                        // but we know what the card WAS because it's in the CURRENT gameState.drawnCard
                        // before we apply the update.
                        const currentDrawn = get().gameState?.drawnCard;
                        cardToAnimate = currentDrawn ? { ...currentDrawn, isRevealed: true } : { value: '?', isRevealed: true };
                        set({ drawnCardSource: null });
                    }

                    if (sourceId && targetId) {
                        set({
                            pendingAnimation: {
                                sourceId,
                                targetId,
                                card: cardToAnimate,
                                onComplete: () => {
                                    set({ gameState, lastAction: lastAction || null });
                                }
                            }
                        });
                        return; // Stop here, wait for animation
                    }
                }

                // Default: just update if no animation
                set({
                    gameState,
                    activeState: gameState,
                    lastAction: lastAction || null
                });
            });

            socket.on('game_over', ({ totalScores, winner }) => {
                console.log('[Socket] Game over, winner:', winner);
                set({
                    totalScores,
                    gameWinner: winner,
                    isGameOver: true
                });
            });

            // Handle player leaving
            socket.on('player_left', ({ playerId, playerName, playerEmoji, newHost }) => {
                const { players } = get();
                const updatedPlayers = players.filter(p => p.id !== playerId);

                set({
                    players: updatedPlayers,
                    lastNotification: {
                        type: 'info',
                        message: `${playerName} a quitté la partie`,
                        timestamp: Date.now()
                    }
                });

                // If we became host
                const { socketId } = get();
                const me = updatedPlayers.find(p => p.id === socketId);
                if (me && newHost === me.name) {
                    set({ isHost: true });
                }
            });

            socket.on('game_cancelled', ({ reason }) => {
                console.log('[Socket] Game cancelled:', reason);

                // Set error to trigger HostLeftOverlay (if host left)
                // We DO NOT clear roomCode/onlineStarted yet to allow the Overlay to show
                set({
                    gameStarted: false,
                    gameState: null,
                    // roomCode: null, // REMOVED: Keep roomCode for overlay
                    // players: [],    // REMOVED: Keep players for context
                    isHost: false,
                    error: reason,     // Trigger Overlay
                    lastNotification: {
                        type: 'error',
                        message: reason,
                        timestamp: Date.now()
                    },
                    // onlineStarted: false, // REMOVED: Keep True so VirtualGame stays mounted
                    activeState: null
                });

                // Start countdown to cleanup for ALL cancellation reasons
                // This ensures the HostLeftOverlay is visible for 5 seconds before unmounting
                get().startRedirection(reason);
            });

            // Handle player ready for next round
            socket.on('player_ready_next_round', ({ playerId, playerName, playerEmoji, readyCount, totalPlayers }) => {
                console.log(`[Socket] ${playerName} is ready (${readyCount}/${totalPlayers})`);
                const { socketId } = get();

                // Update ready status
                set({
                    readyStatus: { readyCount, totalPlayers }
                });

                // Only notify if someone else clicked ready
                // Check if it's me (playerId from server might be socketId or dbId)
                const isMe = playerId === socketId || playerId === socket.id;
                if (!isMe) {
                    // Convert avatarId to real emoji
                    const avatar = AVATARS.find(a => a.id === playerEmoji);
                    const displayEmoji = avatar?.emoji || '👤';

                    set({
                        lastNotification: {
                            type: 'info',
                            message: `${displayEmoji} ${playerName} veut continuer (${readyCount}/${totalPlayers})`,
                            timestamp: Date.now()
                        }
                    });
                }
            });

            // Handle timeout expired (host can now force start)
            socket.on('timeout_expired', ({ message }) => {
                console.log(`[Socket] Timeout expired: ${message}`);
                const { isHost } = get();
                set({
                    timeoutExpired: true,
                    lastNotification: isHost ? {
                        type: 'info',
                        message: 'Délai expiré - Vous pouvez lancer la manche suivante',
                        timestamp: Date.now()
                    } : {
                        type: 'info',
                        message: 'Délai expiré - En attente de l\'hôte',
                        timestamp: Date.now()
                    }
                });
            });
        }

        // Connect if not already connected
        if (!socket.connected) {
            socket.connect();
        }
    },

    // Get socket ID (for comparing with player IDs)
    getSocketId: () => socket?.id,

    disconnect: () => {
        // socket.disconnect(); // KEEP CONNECTION ALIVE!
        // We only reset the game state locally.
        // If we need to leave a room explicitly, we should emit 'leave_room'
        if (get().roomCode) {
            socket.emit('leave_room', get().roomCode);
        }

        set({
            isConnected: true, // Remain "Connected" to the server (presence), just not in a game
            roomCode: null,
            gameState: null,
            activeState: null,
            gameStarted: false,
            onlineStarted: false,
            isGameOver: false,
            gameWinner: null,
            players: [],
            roundNumber: 1,
            gameMode: 'classic'
        });
    },

    leaveRoom: () => {
        const { roomCode } = get();
        if (roomCode) {
            socket.emit('leave_room', roomCode);
        }
        set({
            roomCode: null,
            gameState: null,
            activeState: null,
            gameStarted: false,
            onlineStarted: false,
            isGameOver: false,
            gameWinner: null,
            players: [],
            roundNumber: 1
        });
    },

    setPlayerInfo: (name, emoji) => {
        set({ playerName: name, playerEmoji: emoji });
    },

    createRoom: (isPublic = true, autoInviteFriendId = null) => {
        if (get().isCreatingRoom) return;

        const { playerName, playerEmoji } = get();
        if (!playerName) {
            set({ error: "Entrez un pseudo !" });
            return;
        }

        set({ isCreatingRoom: true });
        // CRITICAL: Ensure listeners are set up before emitting
        get().connect();

        const dbId = useGameStore.getState().userProfile.id;
        const payload = { playerName, emoji: playerEmoji, dbId, isPublic, autoInviteFriendId };

        if (!socket.connected) {
            socket.connect();
            socket.once('connect', () => {
                socket.emit('create_room', payload);
                set({ onlineStarted: true }); // We are now in a room session
            });
        } else {
            socket.emit('create_room', payload);
            set({ onlineStarted: true });
        }
    },

    createRoomAndInvite: (friendId) => {
        const { userProfile } = useGameStore.getState();
        set({
            playerName: userProfile.name,
            playerEmoji: userProfile.avatarId
        });

        get().createRoom(false, friendId); // Create as PRIVATE with ATOMIC AUTO-INVITE
    },

    joinRoom: (code) => {
        const { playerName, playerEmoji } = get();
        if (!playerName) {
            set({ error: "Entrez un pseudo !" });
            return;
        }
        if (!code) {
            set({ error: "Entrez un code de salle !" });
            return;
        }

        // CRITICAL: Ensure listeners are set up before emitting
        get().connect();

        const dbId = useGameStore.getState().userProfile.id;

        if (!socket.connected) {
            socket.connect();
            socket.once('connect', () => {
                socket.emit('join_room', { roomCode: code.toUpperCase(), playerName, emoji: playerEmoji, dbId });
                set({ onlineStarted: true });
            });
        } else {
            socket.emit('join_room', { roomCode: code.toUpperCase(), playerName, emoji: playerEmoji, dbId });
            set({ onlineStarted: true });
        }
        set({ roomCode: code.toUpperCase() });
    },

    leaveRoom: () => {
        const { roomCode } = get();
        if (roomCode) {
            console.log('[Store] Leaving room:', roomCode);
            socket.emit('leave_room', roomCode);
        }
        set({
            gameStarted: false,
            gameState: null,
            roomCode: null,
            players: [],
            isHost: false,
            onlineStarted: false,
            activeState: null,
            error: null,
            gameMode: null
        });
    },

    setGameMode: (mode) => {
        const { roomCode, isHost } = get();
        console.log('[Store] Executing setGameMode:', mode, 'isHost:', isHost, 'roomCode:', roomCode);
        if (!isHost || !roomCode) return;

        // Optimistic update
        set({ gameMode: mode });

        const dbId = useGameStore.getState().userProfile.id;
        socket.emit('change_mode', { roomCode: roomCode.toUpperCase(), mode, dbId });
    },

    startGame: () => {
        const { roomCode } = get();
        if (roomCode) socket.emit('start_game', roomCode);
    },

    startNextRound: () => {
        const { roomCode } = get();
        console.log('[Store] Emitting next_round for room:', roomCode);
        if (roomCode) socket.emit('next_round', roomCode);
    },

    rematch: () => {
        const { roomCode } = get();
        if (roomCode) socket.emit('rematch', roomCode);
    },

    forceNextRound: () => {
        const { roomCode } = get();
        if (roomCode) socket.emit('force_next_round', roomCode);
    },

    // In-Game Actions
    emitGameAction: (action, payload = {}) => {
        const { roomCode } = get();
        if (roomCode) {
            socket.emit('game_action', { roomCode, action, payload });
            set({ selectedCardIndex: null });
        }
    },

    undoTakeFromDiscard: () => {
        const { roomCode } = get();
        if (roomCode) {
            socket.emit('game_action', { roomCode, action: 'undo_draw_discard' });
        }
    },

    // UI Helpers
    selectCard: (index) => set({ selectedCardIndex: index }),
    clearError: () => set({ error: null }),

    startRedirection: (reason) => {
        set({ redirectionState: { active: true, timer: 5, reason } });
        const interval = setInterval(() => {
            const currentTimer = get().redirectionState.timer;
            if (currentTimer <= 1) {
                clearInterval(interval);
                get().disconnect();
                set({ redirectionState: { active: false, timer: 5, reason: '' } });
            } else {
                set({ redirectionState: { ...get().redirectionState, timer: currentTimer - 1 } });
            }
        }, 1000);
    },
}));
