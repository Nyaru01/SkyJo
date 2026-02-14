import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Users, ArrowLeft, RotateCcw, RefreshCw, Trophy, Info, HelpCircle, Sparkles, CheckCircle, BookOpen, X, Bot, Lock, Image as ImageIcon, Palette, Copy, Share2, Wifi, Globe, Plus, ChevronRight, WifiOff, Music, Music2, Leaf, Swords, Skull, Gem, SkipForward, Pause, PlayCircle, Star, Zap, Award, QrCode, Flame } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import toast from 'react-hot-toast'; // Import react-hot-toast
// Removed custom Toast import to avoid confusion
import ConfirmModal from './ui/ConfirmModal';
import PlayerHand from './virtual/PlayerHand';
import DrawDiscard from './virtual/DrawDiscard';
import DrawDiscardPopup from './virtual/DrawDiscardPopup';
import DrawDiscardTrigger from './virtual/DrawDiscardTrigger';
import CardAnimationLayer from './virtual/CardAnimationLayer';
import SkyjoCard from './virtual/SkyjoCard';
import HostLeftOverlay from './virtual/HostLeftOverlay';
import ChestRevelationOverlay from './virtual/ChestRevelationOverlay';
import RobotAvatar from './virtual/RobotAvatar';
import GameMessageBanner from './virtual/GameMessageBanner';
import ExperienceBar from './ExperienceBar';
import SkinCarousel from './SkinCarousel';
import { useVirtualGameStore, selectAIMode, selectAIPlayers, selectIsCurrentPlayerAI, selectIsAIThinking } from '../store/virtualGameStore';
import { useOnlineGameStore } from '../store/onlineGameStore';
import { useSocialStore } from '../store/socialStore';
import { useGameStore } from '../store/gameStore';
import { calculateFinalScores } from '../lib/skyjoEngine';
import { AI_DIFFICULTY, chooseInitialCardsToReveal } from '../lib/skyjoAI';
import { useFeedback } from '../hooks/useFeedback';
// import { useBackgroundMusic } from '../hooks/useBackgroundMusic';
import { useNotifications } from '../hooks/useNotifications';
import { cn } from '../lib/utils';

import { AVATARS, getAvatarPath } from '../lib/avatars';
import AvatarSelector from './AvatarSelector';
import BonusTutorial from './BonusTutorial';
import Tutorial from './Tutorial';
import SkyjoLoader from './SkyjoLoader';
import { PremiumTiltButton } from './ui/PremiumTiltButton';

// Player colors for avatars

// Player colors for avatars
const PLAYER_EMOJIS = ['🐱', '🐶', '🦊', '🐻', '🐼', '🦁', '🐸', '🐵', '🦄', '🐲'];
const PLAYER_COLORS = ['🐱', '🐶', '🦊', '🐻', '🐼', '🦁', '🐸', '🐵']; // Backward compat for local

// ChestRevelationOverlay moved to ./virtual/ChestRevelationOverlay.jsx

/**
 * Virtual Skyjo Game Component
 * Main component for playing virtual Skyjo locally
 */
export default function VirtualGame({ initialScreen = 'menu', onBackToMenu }) {
    // 1. Data Stores
    const userProfile = useGameStore(state => state.userProfile);
    const updateUserProfile = useGameStore(state => state.updateUserProfile);
    const setPlayerInfo = useOnlineGameStore(s => s.setPlayerInfo);
    const createRoom = useOnlineGameStore(s => s.createRoom);
    const joinRoom = useOnlineGameStore(s => s.joinRoom);
    const startOnlineGame = useOnlineGameStore(s => s.startGame);
    const startOnlineNextRound = useOnlineGameStore(s => s.startNextRound);
    const forceOnlineNextRound = useOnlineGameStore(s => s.forceNextRound);
    const onlineTimeoutExpired = useOnlineGameStore(s => s.timeoutExpired);
    const emitGameAction = useOnlineGameStore(s => s.emitGameAction);
    const selectOnlineCard = useOnlineGameStore(s => s.selectCard);

    const { friends, fetchFriends, inviteFriend } = useSocialStore();

    // 2. Local State
    const [screen, setScreen] = useState(initialScreen); // menu, setup, game, scores
    const [chestsRevealed, setChestsRevealed] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [players, setPlayers] = useState([
        { name: userProfile?.name || 'Joueur', avatarId: userProfile?.avatarId || 'cat' },
        { name: '', avatarId: 'dog' },
    ]);

    // Fetch friends when entering multiplayer lobby
    useEffect(() => {
        if (screen === 'lobby' && userProfile?.id) {
            fetchFriends(String(userProfile.id));
        }
    }, [screen, userProfile?.id, fetchFriends]);
    const [openAvatarSelector, setOpenAvatarSelector] = useState(null);
    const [localPlayerIndex, setLocalPlayerIndex] = useState(0);
    const [initialReveals, setInitialReveals] = useState({});
    const [isActionPending, setIsActionPending] = useState(false); // For online loading states
    const [showBonusRules, setShowBonusRules] = useState(false);
    const hasArchivedOnlineRef = useRef(false);

    const gameState = useVirtualGameStore((s) => s.gameState);
    const totalScores = useVirtualGameStore((s) => s.totalScores);
    const roundNumber = useVirtualGameStore((s) => s.roundNumber);
    const isGameOver = useVirtualGameStore((s) => s.isGameOver);
    const gameWinner = useVirtualGameStore((s) => s.gameWinner);
    const onlineRedirection = useOnlineGameStore(s => s.redirectionState);
    const startLocalGame = useVirtualGameStore((s) => s.startLocalGame);
    const revealInitial = useVirtualGameStore((s) => s.revealInitial);
    const drawFromDrawPile = useVirtualGameStore((s) => s.drawFromDrawPile);
    const takeFromDiscard = useVirtualGameStore((s) => s.takeFromDiscard);
    const replaceHandCard = useVirtualGameStore((s) => s.replaceHandCard);
    const discardAndRevealCard = useVirtualGameStore((s) => s.discardAndRevealCard);
    const discardDrawnCard = useVirtualGameStore((s) => s.discardDrawnCard);
    const revealHiddenCard = useVirtualGameStore((s) => s.revealHiddenCard);
    const resetGame = useVirtualGameStore((s) => s.resetGame);
    const rematch = useVirtualGameStore((s) => s.rematch);
    const endRound = useVirtualGameStore((s) => s.endRound);
    const startNextRound = useVirtualGameStore((s) => s.startNextRound);
    const getFinalScores = useVirtualGameStore((s) => s.getFinalScores);
    const performSwap = useVirtualGameStore((s) => s.performSwap);
    const setShowingGame = useVirtualGameStore(s => s.setShowingGame);

    // Pause & Persistence state
    const isPaused = useVirtualGameStore(s => s.isPaused);
    const setPaused = useVirtualGameStore(s => s.setPaused);
    const togglePause = useVirtualGameStore(s => s.togglePause);

    // Notifications
    const virtualLastNotification = useVirtualGameStore((s) => s.lastNotification);
    const clearNotification = useVirtualGameStore((s) => s.clearNotification);
    const virtualPendingAnimation = useVirtualGameStore(s => s.pendingAnimation);
    const isDailyChallenge = useVirtualGameStore(s => s.isDailyChallenge);
    const clearVirtualPendingAnimation = useVirtualGameStore(s => s.clearPendingAnimation);
    const instruction = useVirtualGameStore(s => s.instruction);
    const setInstruction = useVirtualGameStore(s => s.setInstruction);

    // AI Store
    const startAIGame = useVirtualGameStore((s) => s.startAIGame);
    const executeAITurn = useVirtualGameStore((s) => s.executeAITurn);
    const setAIThinking = useVirtualGameStore((s) => s.setAIThinking);
    const aiMode = useVirtualGameStore(selectAIMode);
    const aiPlayers = useVirtualGameStore(selectAIPlayers);
    const isCurrentPlayerAI = useVirtualGameStore(selectIsCurrentPlayerAI);
    const isAIThinking = useVirtualGameStore(selectIsAIThinking);
    const aiDifficulty = useVirtualGameStore((s) => s.aiDifficulty);
    const virtualIsBonusMode = useVirtualGameStore((s) => s.isBonusMode);
    const drawnCardSource = useVirtualGameStore(s => s.drawnCardSource);
    const onlineDrawnCardSource = useOnlineGameStore(s => s.drawnCardSource);



    // Online Store
    const isOnlineConnected = useOnlineGameStore(s => s.isConnected);
    const onlineGameState = useOnlineGameStore(s => s.gameState);
    const onlinePlayers = useOnlineGameStore(s => s.players);
    const onlineTotalScores = useOnlineGameStore(s => s.totalScores);
    const onlineRoundNumber = useOnlineGameStore(s => s.roundNumber);
    const onlineGameStarted = useOnlineGameStore(s => s.gameStarted);
    const onlineIsGameOver = useOnlineGameStore(s => s.isGameOver);
    const onlineGameWinner = useOnlineGameStore(s => s.gameWinner);
    const onlineError = useOnlineGameStore(s => s.error);
    const onlineRoomCode = useOnlineGameStore(s => s.roomCode);
    const onlineIsHost = useOnlineGameStore(s => s.isHost);
    const publicRooms = useOnlineGameStore(s => s.publicRooms);
    const socketId = useOnlineGameStore(s => s.socketId);
    const onlineLastNotificationRaw = useOnlineGameStore(s => s.lastNotification);
    const lastAction = useOnlineGameStore(s => s.lastAction);
    const onlinePendingAnimation = useOnlineGameStore(s => s.pendingAnimation);
    const clearOnlinePendingAnimation = useOnlineGameStore(s => s.clearPendingAnimation);
    const onlineReadyStatus = useOnlineGameStore(s => s.readyStatus);
    const getSocketId = useOnlineGameStore(s => s.getSocketId);
    const onlineGameMode = useOnlineGameStore(s => s.gameMode);
    const setOnlineGameMode = useOnlineGameStore(s => s.setGameMode);


    // Main game store for archiving
    const archiveOnlineGame = useGameStore(s => s.archiveOnlineGame);
    const playerLevel = useGameStore(s => s.level);
    const playerCardSkin = useGameStore(s => s.cardSkin);

    // --- GAME LOGIC CONSOLIDATION (PRE-RENDER) ---
    // Moved here to satisfy Rules of Hooks (must be before any early returns)

    // 1. Identify active game state and basic properties
    const activeGameState = onlineGameStarted ? onlineGameState : gameState;
    const isOnlineMode = onlineGameStarted || screen === 'lobby';
    const activeRoundNumber = onlineGameStarted ? onlineRoundNumber : roundNumber;
    const isGameOverState = onlineGameStarted ? onlineIsGameOver : isGameOver;
    const effectiveIsBonusMode = onlineGameStarted ? (onlineGameMode === 'bonus') : virtualIsBonusMode;
    const activeDrawnCardSource = onlineGameStarted ? onlineDrawnCardSource : drawnCardSource;
    const activeTotalScores = onlineGameStarted ? onlineTotalScores : totalScores;

    // 2. Calculate the local player's index in the game state
    // In online mode, try to find by socket.id first, then fallback to dbId (for reconnects)
    const currentSocketId = (getSocketId?.() || socketId);
    let myPlayerIndex = 0;
    let showSyncIssue = false;

    if (isOnlineMode && activeGameState) {
        const playersList = activeGameState.players || [];
        // 1. Try socket ID
        myPlayerIndex = playersList.findIndex(p => p.id === currentSocketId);

        // 2. Fallback to DB ID if available
        if (myPlayerIndex === -1 && userProfile?.id) {
            myPlayerIndex = playersList.findIndex(p => String(p.dbId) === String(userProfile.id));
        }

        if (myPlayerIndex === -1 && screen === 'game') {
            showSyncIssue = true;
        }
    }

    // 3. Derived indices and state flags
    const opponentIndex = myPlayerIndex === 0 ? 1 : 0;
    const currentPlayer = activeGameState?.players?.[activeGameState?.currentPlayerIndex];
    const isInitialReveal = activeGameState?.phase === 'INITIAL_REVEAL';
    const isFinished = activeGameState?.phase === 'FINISHED' || (activeGameState?.phase === 'REVEALING_CHESTS' && chestsRevealed);
    const discardTop = activeGameState?.discardPile?.[activeGameState?.discardPile?.length - 1];
    const isMyTurn = !isInitialReveal && activeGameState?.currentPlayerIndex === myPlayerIndex;
    const isOpponentTurn = !isInitialReveal && activeGameState?.currentPlayerIndex === opponentIndex;

    // Online Actions
    const connectOnline = useOnlineGameStore(s => s.connect);
    const disconnectOnline = useOnlineGameStore(s => s.disconnect);
    const leaveRoom = useOnlineGameStore(s => s.leaveRoom);


    // Enforce Level Requirements for Skins
    useEffect(() => {
        if (playerLevel < 3 && playerCardSkin !== 'classic') {
            // If user is below level 3 but has a non-classic skin (e.g. from previous high level or bug), reset it.
            useGameStore.getState().setCardSkin('classic');
        }
    }, [playerLevel, playerCardSkin]);

    // Force scroll to top on game mount to avoid 1-2mm shift
    useEffect(() => {
        console.log("[VG] Component MOUNTED");
        const timer = setTimeout(() => {
            window.scrollTo(0, 0);
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
        }, 100);
        return () => {
            console.log("[VG] Component UNMOUNTED");
            clearTimeout(timer);
        };
    }, []);

    console.log(`[VG] Rendering... screen=${screen}, initialScreen=${initialScreen}`);

    // Sync screen with initialScreen prop ONLY if not currently in an active game
    useEffect(() => {
        if (initialScreen && initialScreen !== screen) {
            // Respect the parent's requested screen if it's a menu or setup screen,
            // or if we are not currently in an active game.
            if (initialScreen !== 'game' || (!onlineGameStarted && !gameState)) {
                setScreen(initialScreen);
            }
        }
    }, [initialScreen]);

    // Sync showing game state for Music Player
    useEffect(() => {
        setShowingGame(screen === 'game' || screen === 'scores');
    }, [screen, setShowingGame]);
    // Handle Visibility Change for Auto-Pause (AI Games only)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && screen === 'game' && aiMode && !isPaused && gameState && gameState.phase !== 'FINISHED') {
                console.log("[VG] Tab hidden, auto-pausing game...");
                setPaused(true);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [screen, aiMode, isPaused, gameState, setPaused]);

    // Local State for Lobby
    const [lobbyCode, setLobbyCode] = useState('');
    const [myPseudo, setMyPseudo] = useState(() => userProfile?.name || localStorage.getItem('skyjo_player_pseudo') || '');
    const [myAvatarId, setMyAvatarId] = useState(() => userProfile?.avatarId || localStorage.getItem('skyjo_player_avatar_id') || 'cat');
    // Removed local notification state
    const [hasPlayedVictory, setHasPlayedVictory] = useState(false);
    const [showRulesModal, setShowRulesModal] = useState(false);
    const [showDrawDiscardPopup, setShowDrawDiscardPopup] = useState(false);
    const [isNextRoundPending, setIsNextRoundPending] = useState(false);
    const [showBonusTutorial, setShowBonusTutorial] = useState(false);
    const [lobbyCountdown, setLobbyCountdown] = useState(null); // null, 3, 2, 1, 'GO'

    // Reset pending state when new round starts (phase becomes INITIAL_REVEAL)
    useEffect(() => {
        if (onlineGameState?.phase === 'INITIAL_REVEAL') {
            setIsNextRoundPending(false);
        }
    }, [onlineGameState?.phase]);

    // Reset action pending when game state or last action updates
    useEffect(() => {
        if (isActionPending) {
            setIsActionPending(false);
        }
    }, [activeGameState, lastAction]);

    // Reset chestsRevealed when round starts or phase resets
    useEffect(() => {
        if (activeGameState?.phase === 'INITIAL_REVEAL' || activeGameState?.phase === 'PLAYING') {
            setChestsRevealed(false);
        }
    }, [activeGameState?.phase]);

    // AI Config State - Load from localStorage for persistence
    const [aiConfig, setAIConfig] = useState(() => {
        const savedPseudo = localStorage.getItem('skyjo_player_pseudo') || '';
        const savedAvatarId = localStorage.getItem('skyjo_player_avatar_id') || 'cat';
        return {
            playerName: savedPseudo,
            playerAvatarId: savedAvatarId,
            aiCount: 1,
            difficulty: AI_DIFFICULTY.NORMAL,
        };
    });

    // Cards shaking state (for invalid actions)
    const [shakingCard, setShakingCard] = useState(null);

    // Swap action state (tracking selections)
    const [swapSelection, setSwapSelection] = useState({ sourceIndex: null, targetPlayerIndex: null, targetCardIndex: null });

    // Feedback sounds and Music
    const {
        playVictory,
        playCardFlip,
        playCardDraw,
        playCardPlace,
        playStart,
        playStartGame,
        playSocialInvite
    } = useFeedback();
    const musicEnabled = useGameStore(state => state.musicEnabled);
    const toggleMusic = useGameStore(state => state.toggleMusic);

    // Browser notifications for lobby
    const { requestPermission, sendNotification, isTabHidden, hasPermission } = useNotifications();

    // Music Hook REMOVED - Logic moved to global MusicPlayer component
    // const {
    //    playRandomTrack
    // } = useBackgroundMusic(screen === 'game' && activeGameState?.phase !== 'FINISHED');


    // 4. Automation & Sync Hooks (Must be before any EARLY RETURNS)

    // Save pseudo and emoji to localStorage when they change
    useEffect(() => {
        if (aiConfig.playerName) {
            localStorage.setItem('skyjo_player_pseudo', aiConfig.playerName);
        }
        if (aiConfig.playerAvatarId) {
            localStorage.setItem('skyjo_player_avatar_id', aiConfig.playerAvatarId);
        }
    }, [aiConfig.playerName, aiConfig.playerAvatarId, userProfile.avatarId]);

    // Also save from online mode
    useEffect(() => {
        if (myPseudo) {
            localStorage.setItem('skyjo_player_pseudo', myPseudo);
        }
        if (myAvatarId) {
            localStorage.setItem('skyjo_player_avatar_id', myAvatarId);
        }
    }, [myPseudo, myAvatarId]);

    // Phase-based instructions automation
    useEffect(() => {
        if (!activeGameState) return;

        // ONLY show top banner for SPECIAL actions (Swap, Black Hole, etc.)
        // Standard gameplay instructions are already shown in the center button

        if (isMyTurn) {
            switch (activeGameState.turnPhase) {
                case 'SPECIAL_ACTION_SWAP':
                    if (swapSelection.sourceIndex === null) {
                        setInstruction("Sélectionnez une de VOS cartes à échanger.");
                    } else {
                        setInstruction("Choisissez maintenant une carte adverse à échanger.");
                    }
                    break;
                case 'RESOLVE_BLACK_HOLE':
                    setInstruction("Cliquez sur l'Action pour aspirer la défausse !");
                    break;
                // Add other special modes here if any
                default:
                    setInstruction(null); // Hide banner for standard phases (DRAW, REPLACE, REVEAL, etc.)
                    break;
            }
        } else {
            // Hide banner when it's not my turn or game finished
            setInstruction(null);
        }
    }, [activeGameState?.turnPhase, activeGameState?.currentPlayerIndex, activeGameState?.phase, isMyTurn, swapSelection.sourceIndex, activeGameState, currentPlayer?.name, setInstruction]);

    // 5. EARLY RETURNS SECTION
    // These returns are safe now because all hooks have been declared.

    if (showSyncIssue) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <SkyjoLoader progress={100} />
                <p className="mt-4 text-white font-bold animate-pulse">Synchronisation...</p>
                <p className="text-xs text-white/50 mt-2">ID: {currentSocketId?.substr(0, 4)}...</p>
            </div>
        );
    }

    // Global Identity Sync: React to userProfile changes
    useEffect(() => {
        if (!userProfile) return;

        // Sync Online Setup State
        if (userProfile.name && userProfile.name !== myPseudo) {
            setMyPseudo(userProfile.name);
        }
        if (userProfile.avatarId && userProfile.avatarId !== myAvatarId) {
            console.log('[DEBUG] Syncing myAvatarId from userProfile:', userProfile.avatarId);
            setMyAvatarId(userProfile.avatarId);
        }

        // Sync Online Store directly
        setPlayerInfo(userProfile.name, userProfile.avatarId);

        // Sync Local Multiplayer/AI State (Player 0)
        setPlayers(prev => {
            if (prev[0].name === userProfile.name && prev[0].avatarId === userProfile.avatarId) {
                return prev;
            }
            const newPlayers = [...prev];
            newPlayers[0] = { ...newPlayers[0], name: userProfile.name, avatarId: userProfile.avatarId };
            return newPlayers;
        });

        // Sync AI Config
        setAIConfig(prev => ({
            ...prev,
            playerName: userProfile.name,
            playerAvatarId: userProfile.avatarId
        }));
    }, [userProfile.name, userProfile.avatarId]);

    // 🔥 EFFET AMÉLIORÉ : Auto-navigation for online games
    useEffect(() => {
        // Only run auto-nav logic if we are IN ONLINE MODE (or trying to join one)
        // If initialScreen is not lobby, we assume it's a local/AI game flow
        if (initialScreen !== 'lobby') return;

        const hasActiveState = !!activeGameState && Object.keys(activeGameState).length > 0;
        const gameIsStarted = !!onlineGameStarted;

        console.log('[VG] Auto-nav check:', {
            onlineGameStarted,
            hasActiveState,
            gameIsStarted,
            currentScreen: screen,
            roomId: onlineRoomCode
        });

        // Transition lobby → game when the game starts (WITH PREMIUM COUNTDOWN)
        if (onlineGameStarted && (screen === 'lobby' || screen === 'setup' || screen === 'menu')) {
            if (lobbyCountdown === null) {
                console.log("[VG] ⏱ Starting Premium Countdown!");
                setLobbyCountdown(3);
                playStart(); // Play start sound

                const timer = setInterval(() => {
                    setLobbyCountdown(prev => {
                        if (prev === 3) return 2;
                        if (prev === 2) return 1;
                        if (prev === 1) return 'GO';
                        if (prev === 'GO') {
                            clearInterval(timer);
                            setScreen('game');
                            setInitialReveals({});
                            setLobbyCountdown(null);
                            return null;
                        }
                        return prev;
                    });
                }, 1000);
            }
        }

        // Return to lobby ONLY if we are not in an active session anymore
        if (!onlineGameStarted && !onlineRoomCode && screen === 'game' && !onlineError) {
            console.log("[VG] ⬅️ Session lost, returning to menu");
            setScreen('menu');
        }
    }, [onlineGameStarted, screen, onlineRoomCode, onlineError]); // Removed initialScreen check

    useEffect(() => {
        console.log(`[VG] Rendering... screen=${screen}, isOnline=${isOnlineMode}, hasState=${!!activeGameState}`);
        // Avoid staying on game screen if state is lost unexpectedly
        // Check if there is an error pending (e.g., Host Left), if so, DON'T redirect yet, let overlay show
        if (initialScreen === 'lobby' && screen === 'game' && !activeGameState && !onlineGameStarted && !gameState && !onlineError) {
            console.warn("[VG] Game screen active but no state found! Redirecting to menu.");
            setScreen('menu');
        }
    }, [screen, activeGameState, onlineGameStarted, gameState, initialScreen]);

    useEffect(() => {
        if (virtualLastNotification) {
            // Using global toaster
            const { type, message } = virtualLastNotification;
            if (type === 'error') toast.error(message);
            else if (type === 'success') toast.success(message);
            else toast(message);

            // Auto clear from store to avoid re-triggering
            setTimeout(() => {
                clearNotification();
            }, 100); // Faster clear
        }
    }, [virtualLastNotification, clearNotification]);

    // Online: Sync notifications from store
    useEffect(() => {
        if (onlineLastNotificationRaw) {
            // Using global toaster
            const { type, message } = onlineLastNotificationRaw;
            if (type === 'error') toast.error(message);
            else if (type === 'success') toast.success(message);
            else toast(message); // Default info - No icon

            // If we got an error or info, likely the pending state should be cleared (especially error)
            if (onlineLastNotificationRaw.type === 'error') {
                setIsNextRoundPending(false);
            }
            // Check for sound trigger
            if (onlineLastNotificationRaw.sound === 'join') {
                const audio = new Audio('/Sounds/whoosh-radio-ready-219487.mp3');
                audio.volume = 0.5;
                audio.play().catch(e => console.log('Audio play failed', e)); // Auto-play restrictions

                // Send browser notification if tab is in background
                if (isTabHidden()) {
                    sendNotification('Skyjo - Nouveau joueur ! 🎮', {
                        body: onlineLastNotificationRaw.message,
                        tag: 'player-joined', // Prevents duplicate notifications
                        renotify: true
                    });
                }
            }
        }
    }, [onlineLastNotificationRaw, isTabHidden, sendNotification]);

    // Auto-archive online game on Game Over
    // We use a ref to prevent double-archiving in the same mounting cycle if store updates slowly
    // (hasArchivedOnlineRef is declared at the top of the component)

    // Reset ref when game starts
    useEffect(() => {
        if (onlineGameStarted && !onlineIsGameOver) {
            hasArchivedOnlineRef.current = false;
        }
    }, [onlineGameStarted, onlineIsGameOver]);

    useEffect(() => {
        if (onlineIsGameOver && onlineGameStarted && onlinePlayers.length > 0 && !hasArchivedOnlineRef.current) {
            console.log("Auto-archiving online game results...");
            hasArchivedOnlineRef.current = true;
            archiveOnlineGame({
                players: onlinePlayers,
                totalScores: onlineTotalScores,
                winner: onlineGameWinner,
                roundsPlayed: onlineRoundNumber
            });
        }
    }, [onlineIsGameOver, onlineGameStarted, onlinePlayers, onlineTotalScores, onlineGameWinner, onlineRoundNumber, archiveOnlineGame]);

    // Reset pending state when round number changes
    useEffect(() => {
        setIsNextRoundPending(false);
        setInitialReveals({}); // Clear any previous round's initial reveals
    }, [onlineRoundNumber]);

    // Return to lobby when online game is cancelled (host quits)
    useEffect(() => {
        // Improved check: If we're on the game screen but have no online game AND no local game
        // and no room code (meaning we fully disconnected), go back to menu.
        // IMPORTANT: Do NOT redirect if there is an error pending (HostLeftOverlay needs to show)
        if (screen === 'game' && !onlineGameStarted && !gameState && !onlineRoomCode && !onlineError) {
            console.log("[VG] Resetting to menu (no game, no room)");
            setScreen('menu');
        }

        // Also handle legacy case where we might still have roomCode but game stopped
        if (screen === 'game' && onlineRoomCode && !onlineGameStarted && !onlineIsGameOver && !onlineError) {
            console.log("[VG] Resetting to menu (game stopped but room active)");
            setScreen('menu');
        }
    }, [onlineGameStarted, onlineIsGameOver, onlineRoomCode, screen, gameState, onlineError]);

    // Handle Visibility Change for Auto-Pause (AI Games only)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && screen === 'game' && aiMode && !isPaused && gameState && gameState.phase !== 'FINISHED') {
                console.log("[VG] Tab hidden, auto-pausing game...");
                setPaused(true);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [screen, aiMode, isPaused, gameState, setPaused]);

    // Determine if game is finished (for sound effect)
    const activeGameStateForEffect = onlineGameStarted ? onlineGameState : gameState;
    const isGameFinished = activeGameStateForEffect?.phase === 'FINISHED';

    // Play victory sound when game finishes
    useEffect(() => {
        if (isGameFinished && !hasPlayedVictory) {
            playVictory();
            setHasPlayedVictory(true);
        }
        // Reset flag when game restarts (not finished anymore)
        if (!isGameFinished && hasPlayedVictory) {
            setHasPlayedVictory(false);
        }
    }, [isGameFinished, hasPlayedVictory, playVictory]);

    // Track if we've archived the current online game
    const [hasArchivedOnline, setHasArchivedOnline] = useState(false);

    // Track if we've archived the current AI/local game
    // Track if we've archived the current AI/local game (REMOVED: handled manually now)
    const archiveVirtualGame = useGameStore(s => s.archiveVirtualGame);
    const addXP = useGameStore(s => s.addXP);
    const gameMode = useVirtualGameStore(s => s.gameMode);

    // Track last game we awarded XP for to prevent duplicates
    const lastAwardedGameRef = useRef(null);

    // Archive online game when it ends
    useEffect(() => {
        if (onlineIsGameOver && onlineGameStarted && !hasArchivedOnline) {
            console.log(`[XP-DEBUG] Online Game Over. Winner: ${onlineGameWinner?.name} (${onlineGameWinner?.id})`);

            archiveOnlineGame({
                players: onlinePlayers,
                totalScores: onlineTotalScores,
                winner: onlineGameWinner,
                roundsPlayed: onlineRoundNumber
            });

            // Award XP if human won the online game
            const myDbId = useGameStore.getState().userProfile?.id;

            // Only award if we haven't awarded for this game yet (using onlineRoomCode as unique ID)
            if (onlineGameWinner && myDbId && (String(onlineGameWinner.id) === String(myDbId))) {
                if (lastAwardedGameRef.current !== onlineRoomCode) {
                    console.log(`[XP-DEBUG] ✅ GAME XP AWARDED (Room: ${onlineRoomCode})`);
                    addXP(5); // Now giving 5 XP for winning a full game
                    lastAwardedGameRef.current = onlineRoomCode;
                }
            }

            setHasArchivedOnline(true);
        }

        // Reset when starting a new game
        if (!onlineIsGameOver && hasArchivedOnline) {
            setHasArchivedOnline(false);
        }
    }, [onlineIsGameOver, onlineGameStarted, hasArchivedOnline, onlinePlayers, onlineTotalScores, onlineGameWinner, onlineRoundNumber, archiveOnlineGame, socketId, addXP, onlineRoomCode]);

    // Track last round we awarded XP for to prevent duplicates
    const lastAwardedRoundRef = useRef(0);

    // Award XP for winning an online ROUND
    useEffect(() => {
        // Accept both FINISHED and REVEALING_CHESTS (bonus mode with chests)
        if (!onlineGameStarted || !onlineGameState || (onlineGameState.phase !== 'FINISHED' && onlineGameState.phase !== 'REVEALING_CHESTS')) {
            return;
        }

        const currentRound = onlineRoundNumber;

        // Only proceed if we haven't processed this round yet
        if (lastAwardedRoundRef.current === currentRound) {
            return;
        }

        // Calculate results for this round
        const roundResults = calculateFinalScores(onlineGameState);
        if (!roundResults || roundResults.length === 0) {
            return;
        }

        // Find the lowest score in this round
        const sortedResults = [...roundResults].sort((a, b) => a.finalScore - b.finalScore);
        const roundWinnerScore = sortedResults[0].finalScore;

        // Check if WE are one of the winners (lowest score)
        // In online mode, match by dbId (persistent ID), NOT socketId (transient socket.io ID)
        const myDbIdForRound = useGameStore.getState().userProfile?.id;
        const myResult = roundResults.find(r => String(r.playerId) === String(myDbIdForRound));

        if (myResult && myResult.finalScore === roundWinnerScore) {
            // We won (or tied for win) the round!
            addXP(1);
            console.log(`[XP-DEBUG] ✅ XP AWARDED for Round ${currentRound}!`);
        }

        // Mark this round as processed
        lastAwardedRoundRef.current = currentRound;

    }, [onlineGameStarted, onlineGameState, onlineRoundNumber, socketId, addXP]);

    // Reset awarded round tracker when game restarts
    useEffect(() => {
        if (!onlineGameStarted) {
            lastAwardedRoundRef.current = 0;
        }
    }, [onlineGameStarted]);




    // AI Auto-play: Execute AI turns automatically with delay
    useEffect(() => {
        if (!aiMode || !gameState || isPaused) return;
        if (gameState.phase === 'FINISHED') return;

        // During initial reveal, AI players should automatically reveal their cards
        // NOTE: In INITIAL_REVEAL phase, currentPlayerIndex stays at 0 - all players reveal simultaneously
        if (gameState.phase === 'INITIAL_REVEAL') {
            // Find AI players that still need to reveal their cards
            const aiNeedingReveal = aiPlayers.filter(aiIndex => {
                const aiPlayer = gameState.players[aiIndex];
                if (!aiPlayer) return false;
                const revealedCount = aiPlayer.hand.filter(c => c && c.isRevealed).length;
                return revealedCount < 2;
            });

            // If any AI still needs to reveal, do it one at a time with delay
            if (aiNeedingReveal.length > 0) {
                const firstAIToReveal = aiNeedingReveal[0];
                setAIThinking(true);
                const timer = setTimeout(() => {
                    // Manually reveal for this AI player
                    const aiPlayer = gameState.players[firstAIToReveal];
                    const cardsToReveal = chooseInitialCardsToReveal(aiPlayer.hand, aiDifficulty);
                    revealInitial(firstAIToReveal, cardsToReveal);
                    setAIThinking(false);
                }, 800);
                return () => clearTimeout(timer);
            }
            return;
        }

        // Regular gameplay - only current AI player acts
        if (!isCurrentPlayerAI || isPaused) return;

        setAIThinking(true);
        setAIThinking(true);
        // Slower delay for better readability (was 1200)
        const delay = 2000;
        const timer = setTimeout(() => {
            executeAITurn();

            // If AI still needs to make another action (e.g., after drawing), set another timer
            const checkNextAction = setTimeout(() => {
                const currentState = useVirtualGameStore.getState().gameState;
                if (currentState &&
                    currentState.currentPlayerIndex !== undefined &&
                    useVirtualGameStore.getState().aiPlayers.includes(currentState.currentPlayerIndex) &&
                    (currentState.turnPhase === 'REPLACE_OR_DISCARD' || currentState.turnPhase === 'MUST_REPLACE' || currentState.turnPhase === 'MUST_REVEAL')) {
                    executeAITurn();
                }
                setAIThinking(false);
                setAIThinking(false);
            }, 2500); // Wait longer before next action (was 800)

            return () => clearTimeout(checkNextAction);
        }, delay);

        return () => clearTimeout(timer);
    }, [aiMode, gameState?.currentPlayerIndex, gameState?.phase, gameState?.turnPhase, isCurrentPlayerAI, aiPlayers, executeAITurn, setAIThinking, gameState, aiDifficulty, revealInitial, isPaused]);

    // Add player
    const addPlayer = () => {
        if (players.length < 8) {
            setPlayers([
                ...players,
                { name: '', emoji: PLAYER_COLORS[players.length] },
            ]);
        }
    };

    // Remove player
    const removePlayer = (index) => {
        if (players.length > 2) {
            setPlayers(players.filter((_, i) => i !== index));
        }
    };

    // Update player name
    const updatePlayer = (index, field, value) => {
        const newPlayers = [...players];
        newPlayers[index] = { ...newPlayers[index], [field]: value };
        setPlayers(newPlayers);

        // Sync local player 0 to global profile
        if (index === 0 && field === 'name' && value.trim()) {
            updateUserProfile({ name: value.trim() });
        }
    };

    // Start game
    const handleStartGame = () => {
        const gamePlayers = players.map((p, i) => ({
            id: `player-${i}`,
            name: p.name.trim() || `Joueur ${i + 1}`,
            emoji: p.emoji,
        }));
        startLocalGame(gamePlayers);
        setInitialReveals({});
        setScreen('game');
    };

    // Handle initial reveal selection
    const handleInitialReveal = (playerIndex, cardIndex) => {
        playCardFlip();
        const key = `player-${playerIndex}`;
        const current = initialReveals[key] || [];

        if (current.includes(cardIndex)) {
            // Already revealed, do nothing (cannot hide it back)
            return;
        }

        if (current.length < 2) {
            const newReveals = [...current, cardIndex];
            setInitialReveals({
                ...initialReveals,
                [key]: newReveals,
            });

            if (newReveals.length === 2) {
                if (onlineGameStarted) {
                    emitGameAction('reveal_initial', { cardIndices: newReveals });
                } else {
                    revealInitial(playerIndex, newReveals);
                }
            }
        }
    };

    // Handle card click during gameplay
    const handleCardClick = (cardIndex, playerIndex = null) => {
        const isOnline = !!onlineGameStarted;
        const activeState = isOnline ? onlineGameState : gameState;

        if (!activeState || (isOnlineMode && isActionPending)) return;

        // Determine robustly who "I" am to check if it's my turn
        const currentSocketId = isOnline ? (getSocketId?.() || socketId) : null;
        let myIdx = isOnline ? activeState.players.findIndex(p => p.id === currentSocketId) : 0;
        if (isOnline && myIdx === -1 && userProfile?.id) {
            myIdx = activeState.players.findIndex(p => String(p.dbId) === String(userProfile.id));
        }
        const isMyTurn = activeState.currentPlayerIndex === myIdx;

        // Determine player index if not provided (default to current player)
        const targetPlayerIndex = playerIndex !== null ? playerIndex : activeState.currentPlayerIndex;

        // Handle SWAP logic
        if (activeState.turnPhase === 'SPECIAL_ACTION_SWAP' && isMyTurn) {
            // Step 1: Selection of my card
            if (targetPlayerIndex === activeState.currentPlayerIndex) {
                setSwapSelection(prev => ({ ...prev, sourceIndex: cardIndex }));
                setInstruction("Choisissez maintenant une carte adverse à échanger.");
                return;
            }

            // Step 2: Selection of opponent's card
            if (targetPlayerIndex !== activeState.currentPlayerIndex && swapSelection.sourceIndex !== null) {
                try {
                    playCardPlace();
                    const sourceIdx = swapSelection.sourceIndex;
                    setSwapSelection({ sourceIndex: null, targetPlayerIndex: null, targetCardIndex: null });

                    if (isOnline) {
                        emitGameAction('perform_swap', {
                            sourceCardIndex: sourceIdx,
                            targetPlayerIndex,
                            targetCardIndex: cardIndex
                        });
                        toast.success("Échange envoyé !", { id: "swap-action" });
                    } else {
                        performSwap(sourceIdx, targetPlayerIndex, cardIndex);
                        toast.success("Échange effectué !", { id: "swap-action" });
                    }
                    setInstruction(null);
                } catch (error) {
                    toast.error(error.message || "Échange impossible !");
                }
                return;
            }

            if (targetPlayerIndex !== activeState.currentPlayerIndex && swapSelection.sourceIndex === null) {
                toast.error("Sélectionnez d'abord l'une de vos cartes à échanger.");
                return;
            }
        }

        // Only allow clicking on own board for regular phases
        if (targetPlayerIndex !== activeState.currentPlayerIndex) return;

        // In online mode, we just emit actions
        if (isOnline) {
            if (activeState.turnPhase === 'REPLACE_OR_DISCARD') {
                playCardPlace();
                emitGameAction('replace_card', { cardIndex });
            } else if (activeState.turnPhase === 'MUST_REPLACE') {
                playCardPlace();
                emitGameAction('replace_card', { cardIndex });
            } else if (activeState.turnPhase === 'MUST_REVEAL') {
                playCardFlip();
                emitGameAction('reveal_hidden', { cardIndex });
            }
            return;
        }

        // Local mode
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        const card = currentPlayer.hand[cardIndex];

        if (gameState.turnPhase === 'REPLACE_OR_DISCARD' || gameState.turnPhase === 'MUST_REPLACE') {
            try {
                playCardPlace();
                replaceHandCard(cardIndex);
            } catch (error) {
                console.error("Action interdite:", error.message);
                setShakingCard({ playerIndex: gameState.currentPlayerIndex, cardIndex });
                toast.error(error.message || "Action impossible sur une carte verrouillée !");
                setTimeout(() => setShakingCard(null), 500);
            }
        } else if (gameState.turnPhase === 'MUST_REVEAL') {
            try {
                if (!card?.isRevealed) {
                    playCardFlip();
                    revealHiddenCard(cardIndex);
                }
            } catch (error) {
                setShakingCard({ playerIndex: gameState.currentPlayerIndex, cardIndex });
                toast.error(error.message || "Carte verrouillée !");
                setTimeout(() => setShakingCard(null), 500);
            }
        }
    };


    // Helper to update player avatar from selector
    const updateAvatar = (indexOrKey, avatarId) => {
        if (indexOrKey === 'ai-player') {
            setAIConfig(prev => ({ ...prev, playerAvatarId: avatarId }));
            updateUserProfile({ avatarId }); // Persist to global store
            setOpenAvatarSelector(null);
            return;
        }
        if (indexOrKey === 'online-setup') {
            setMyAvatarId(avatarId);
            setPlayerInfo(myPseudo, avatarId);
            updateUserProfile({ avatarId }); // Global sync
            setOpenAvatarSelector(null);
            return;
        }
        const index = Number(indexOrKey);
        const newPlayers = [...players];
        newPlayers[index] = { ...newPlayers[index], avatarId };
        setPlayers(newPlayers);
        if (index === 0) {
            updateUserProfile({ avatarId }); // Global sync
        }
        setOpenAvatarSelector(null);
    };

    // Back to menu
    const handleBackToMenu = (force = false) => {
        if (!force && screen === 'game' && !isGameOver) {
            setShowExitConfirm(true);
        } else {
            confirmExit();
        }
    };

    const confirmExit = () => {
        setShowExitConfirm(false);
        // Archive online game if it was started and has data (avoid duplicates)
        // Check our ref to see if we already auto-archived
        if (onlineGameStarted && onlinePlayers.length > 0 && !hasArchivedOnlineRef.current) {
            console.log("Manual archiving on quit...");
            archiveOnlineGame({
                players: onlinePlayers,
                totalScores: onlineTotalScores,
                winner: onlineGameWinner,
                roundsPlayed: onlineRoundNumber
            });
            leaveRoom(); // 🔥 Use leaveRoom instead of disconnect
        } else if (onlineGameStarted || onlineRoomCode) {
            // Just leave if already archived or in lobby
            leaveRoom();
        }

        // Archive AI/local game when quitting (only if at least one round is finished)
        if (gameState && gameState.players && gameState.players.length > 0 && !onlineGameStarted && !isGameOver) {
            // Intelligent Archiving: Only save to history if at least one round was completed
            const isAtLeastOneRoundDone = roundNumber > 1 || gameState.phase === 'FINISHED' || gameState.phase === 'REVEALING_CHESTS';

            if (isAtLeastOneRoundDone) {
                // Calculate current winner based on totalScores
                let scores = { ...totalScores };

                // If the current round is FINISHED but not yet committed to totalScores (e.g. user quits on result screen),
                // we need to add these scores to the archive
                if (gameState.phase === 'FINISHED' || gameState.phase === 'REVEALING_CHESTS') {
                    const roundResults = calculateFinalScores(gameState);
                    roundResults.forEach(r => {
                        scores[r.playerId] = (scores[r.playerId] || 0) + r.finalScore;
                    });

                    // Award XP if quitting after a win (Unify with endRound logic)
                    const sortedResults = [...roundResults].sort((a, b) => a.finalScore - b.finalScore);
                    const winningScore = sortedResults[0]?.finalScore;
                    const myPlayer = gameState.players.find(p => p.id === 'human-1');

                    if (myPlayer && roundResults.find(r => r.playerId === myPlayer.id)?.finalScore === winningScore) {
                        const isDaily = isDailyChallenge;
                        const isDailyAvailable = useGameStore.getState().lastDailyWinDate !== new Date().toISOString().split('T')[0];

                        // CRITICAL: We only award XP here if it wasn't already awarded (e.g. if endRound hasn't been called)
                        // In Daily Challenge, we often quit from the results screen, so this is where 5 XP is awarded.
                        if (isDaily && isDailyAvailable) {
                            addXP(5);
                            useGameStore.getState().markDailyWin();
                            console.log("[VG] Daily Challenge Won (on quit)! 5 XP Awarded.");
                        } else {
                            addXP(1);
                            console.log("[VG] Round Won (on quit)! 1 XP Awarded.");
                        }
                    }
                }

                const playersWithScores = gameState.players.map(p => ({
                    ...p,
                    finalScore: scores[p.id] || 0
                })).sort((a, b) => a.finalScore - b.finalScore);

                const winner = playersWithScores[0];

                archiveVirtualGame({
                    players: gameState.players,
                    totalScores: scores,
                    winner: winner ? { id: winner.id, name: winner.name, score: winner.finalScore } : null,
                    roundsPlayed: roundNumber || 1,
                    gameType: aiMode ? 'ai' : 'local'
                });
            }
        }

        const wasDaily = isDailyChallenge;
        resetGame();
        setScreen('menu');

        // Signal parent to switch back to main menu
        if (onBackToMenu) onBackToMenu(wasDaily);
    };

    if (showSyncIssue) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <SkyjoLoader progress={100} />
                <p className="mt-4 text-white font-bold animate-pulse">Synchronisation...</p>
                <p className="text-xs text-white/50 mt-2">ID: {currentSocketId?.substr(0, 4)}...</p>
            </div>
        );
    }

    const avatarSelectorComponent = (
        <AvatarSelector
            isOpen={openAvatarSelector !== null}
            onClose={() => setOpenAvatarSelector(null)}
            selectedId={
                openAvatarSelector === 'ai-player'
                    ? aiConfig.playerAvatarId
                    : openAvatarSelector === 'online-setup'
                        ? myAvatarId
                        : (openAvatarSelector !== null && players[openAvatarSelector] ? players[openAvatarSelector].avatarId : null)
            }
            onSelect={(id) => updateAvatar(openAvatarSelector, id)}
        />
    );


    // Render AI setup screen
    if (screen === 'ai-setup') {
        const handleStartAIGame = () => {
            playStartGame();
            const isBonus = aiConfig.difficulty === AI_DIFFICULTY.BONUS;
            startAIGame(
                { name: aiConfig.playerName || 'Joueur', avatarId: aiConfig.playerAvatarId },
                1, // Forced to 1 AI opponent
                aiConfig.difficulty,
                { isBonusMode: isBonus }
            );
            setInitialReveals({});
            setScreen('game');
        };

        return (
            <div className="max-w-md mx-auto p-4 animate-in fade-in min-h-[calc(100dvh-2rem)] flex flex-col">
                <div className="relative flex items-center justify-center py-2 mb-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBackToMenu}
                        className="absolute left-0 w-10 h-10 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 transition-all"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    <div className="text-center space-y-0.5 relative">
                        <h2 className="text-xl font-black text-white tracking-tighter flex items-center justify-center gap-2">
                            CONTRE L'IA
                        </h2>
                        <div className="h-1 w-10 bg-purple-500 mx-auto rounded-full" />
                    </div>
                </div>

                <Card className="glass-premium dark:glass-dark shadow-xl border-t border-white/10 mb-4 overflow-hidden relative">
                    <CardContent className="flex flex-col gap-4 pt-6 p-4">
                        {/* Difficulty */}
                        <div className="flex flex-col pt-2">

                            <label className="text-xs font-bold uppercase tracking-wider text-purple-200 ml-1 mb-3 block">Niveau de difficulté</label>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { level: AI_DIFFICULTY.NORMAL, label: 'Normal', color: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/50', icon: Leaf, desc: 'Idéal pour débuter', activeClass: "border-emerald-500 ring-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.4)]" },
                                    { level: AI_DIFFICULTY.HARD, label: 'Difficile', color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/50', icon: Swords, desc: 'Défi stratégique', activeClass: "border-amber-500 ring-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.4)]" },
                                    { level: AI_DIFFICULTY.HARDCORE, label: 'Hardcore', color: 'from-red-600 to-rose-600', shadow: 'shadow-red-600/50', icon: Skull, desc: 'IA impitoyable', activeClass: "border-red-600 ring-red-600/50 shadow-[0_0_20px_rgba(220,38,38,0.4)]" },
                                    { level: AI_DIFFICULTY.BONUS, label: 'Tourment', color: 'from-purple-600 to-indigo-600', shadow: 'shadow-purple-600/50', icon: Flame, desc: 'Stratégie & Bonus', activeClass: "border-purple-500 ring-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.4)]" }
                                ].map((mode) => (
                                    <div key={mode.level} className="relative group h-full">
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="h-full rounded-xl"
                                        >
                                            <button
                                                onClick={() => setAIConfig({ ...aiConfig, difficulty: mode.level })}
                                                className={cn(
                                                    "relative w-full p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center overflow-hidden h-full",
                                                    aiConfig.difficulty === mode.level
                                                        ? `bg-slate-800/90 ring-2 ${mode.activeClass}`
                                                        : "border-white/10 bg-slate-900/40 hover:bg-slate-800/60 hover:border-white/20"
                                                )}
                                            >
                                                {/* Main Content Area - Centered for alignment */}
                                                <div className="flex-1 flex flex-col items-center justify-center w-full gap-3 py-1">
                                                    {/* Icon Container with Glass/Glow Effect */}
                                                    <div className={cn(
                                                        "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 overflow-hidden border border-white/20 shrink-0 relative",
                                                        aiConfig.difficulty === mode.level
                                                            ? "bg-slate-800"
                                                            : "bg-slate-800/50 grayscale-[0.5] opacity-80"
                                                    )}>
                                                        {/* Glowing Gradient Background */}
                                                        <div className={cn(
                                                            "absolute inset-0 opacity-20 bg-gradient-to-br",
                                                            mode.color
                                                        )} />

                                                        {/* Central Icon */}
                                                        <mode.icon
                                                            className={cn(
                                                                "w-8 h-8 relative z-10 drop-shadow-md",
                                                                aiConfig.difficulty === mode.level
                                                                    ? "text-white"
                                                                    : "text-slate-300"
                                                            )}
                                                            strokeWidth={1.5}
                                                        />

                                                        {/* Glow reflection */}
                                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
                                                    </div>

                                                    <div className="flex flex-col justify-center w-full text-center">
                                                        <div className={cn(
                                                            "font-black text-sm uppercase tracking-tight transition-colors",
                                                            aiConfig.difficulty === mode.level ? "text-white" : "text-slate-300"
                                                        )}>
                                                            {mode.label}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 font-bold leading-tight mt-1">{mode.desc}</div>
                                                    </div>
                                                </div>

                                                {/* Footer Area for Rules Button - Fixed height for alignment */}
                                                <div className="w-full flex items-center justify-center min-h-[40px]">
                                                    {mode.level === AI_DIFFICULTY.BONUS ? (
                                                        <div className="w-full pt-2 border-t border-white/5">
                                                            <div
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setShowBonusTutorial(true);
                                                                }}
                                                                className="w-full py-1.5 px-3 rounded-lg bg-slate-800/50 border border-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                                                            >
                                                                <Info className="w-3 h-3" />
                                                                Règles
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        /* Invisible placeholder to maintain consistent card heights */
                                                        <div className="w-full pt-2 invisible">
                                                            <div className="w-full py-1.5 px-3 text-[9px]">&nbsp;</div>
                                                        </div>
                                                    )}
                                                </div>
                                                {aiConfig.difficulty === mode.level && (
                                                    <div className={cn(
                                                        "absolute top-2 right-2 w-2 h-2 rounded-full shadow-[0_0_8px]",
                                                        mode.shadow,
                                                        "bg-white"
                                                    )} />
                                                )}
                                            </button>
                                        </motion.div>

                                    </div>
                                ))}
                            </div>
                        </div>

                    </CardContent>
                </Card>

                <PremiumTiltButton
                    onClick={handleStartAIGame}
                    disabled={!aiConfig.playerName.trim()}
                    gradientFrom={
                        aiConfig.difficulty === AI_DIFFICULTY.NORMAL ? "from-emerald-500" :
                            aiConfig.difficulty === AI_DIFFICULTY.HARD ? "from-amber-500" :
                                aiConfig.difficulty === AI_DIFFICULTY.HARDCORE ? "from-red-600" :
                                    "from-purple-600"
                    }
                    gradientTo={
                        aiConfig.difficulty === AI_DIFFICULTY.NORMAL ? "to-teal-500" :
                            aiConfig.difficulty === AI_DIFFICULTY.HARD ? "to-orange-500" :
                                aiConfig.difficulty === AI_DIFFICULTY.HARDCORE ? "to-rose-600" :
                                    "to-indigo-600"
                    }
                    shadowColor={
                        aiConfig.difficulty === AI_DIFFICULTY.NORMAL ? "shadow-emerald-500/25" :
                            aiConfig.difficulty === AI_DIFFICULTY.HARD ? "shadow-amber-500/25" :
                                aiConfig.difficulty === AI_DIFFICULTY.HARDCORE ? "shadow-red-500/25" :
                                    "shadow-purple-500/25"
                    }
                >
                    <span className="flex items-center justify-center gap-2">
                        <Play className="h-5 w-5 fill-current" />
                        AFFRONTER L'IA
                    </span>
                </PremiumTiltButton>

                {/* Robot Avatar - Precision Placement (Red Box Area) */}
                <div className="flex-1 flex items-end justify-end p-1 pr-1 pb-8 pointer-events-none">
                    <div className="w-12 h-32 relative pointer-events-auto">
                        <RobotAvatar
                            size="lg"
                            className="w-full h-full"
                            isAngry={aiConfig.difficulty === AI_DIFFICULTY.HARDCORE || aiConfig.difficulty === AI_DIFFICULTY.BONUS}
                        />
                    </div>
                </div>

                {avatarSelectorComponent}
                <BonusTutorial isOpen={showBonusTutorial} onClose={() => setShowBonusTutorial(false)} />
            </div >
        );
    }

    // Render setup screen
    if (screen === 'setup') {
        return (
            <div className="max-w-md mx-auto p-4 space-y-4 animate-in fade-in">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBackToMenu}
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 transition-all shadow-lg mb-4"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                <Card className="glass-premium dark:glass-dark shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <Users className="h-5 w-5 text-emerald-600" />
                            Joueurs (1v1)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {players.map((player, index) => (
                            <div key={index} className="flex items-center gap-2">
                                {/* Avatar Button */}
                                <button
                                    onClick={() => setOpenAvatarSelector(index)}
                                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 border border-white/10 overflow-hidden relative group bg-slate-800 ring-2 ring-white/5 hover:ring-white/20"
                                >
                                    <div className="absolute inset-0 bg-white">
                                        <img
                                            src={getAvatarPath(player.avatarId)}
                                            alt="Avatar"
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            onError={(e) => { e.target.src = '/avatars/cat.png' }}
                                        />
                                        {/* Glossy Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-black/0 via-white/20 to-white/0 opacity-50 pointer-events-none" />
                                    </div>
                                </button>
                                <Input
                                    placeholder={`Joueur ${index + 1}`}
                                    value={player.name}
                                    onChange={(e) =>
                                        updatePlayer(index, 'name', e.target.value)
                                    }
                                    className="flex-1"
                                />
                                {players.length > 2 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removePlayer(index)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                        ✕
                                    </Button>
                                )}
                            </div>
                        ))}

                        {players.length < 2 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={addPlayer}
                                className="w-full border-dashed"
                            >
                                + Ajouter un joueur
                            </Button>
                        )}
                    </CardContent>
                </Card>

                <Button
                    size="lg"
                    className="w-full bg-[#1e2235] text-white shadow-lg hover:bg-[#1e2235]/90 transition-colors border border-white/20"
                    onClick={handleStartGame}
                >
                    🚀 Lancer la partie
                </Button>
                {avatarSelectorComponent}
            </div>
        );
    }


    // Render Lobby (Online)
    if (screen === 'lobby') {
        const isRoomJoined = !!onlineRoomCode;

        if (isRoomJoined) {
            return (
                <div className="max-w-md mx-auto p-4 space-y-6 animate-in fade-in pt-6">
                    {/* Lobby Header */}
                    <div className="relative flex items-center justify-center py-4 mb-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleBackToMenu}
                            className="absolute left-0 w-10 h-10 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 transition-all shadow-xl backdrop-blur-md z-20"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>

                        <div className="flex items-center gap-2.5 relative z-10">
                            <h2 className="text-2xl font-black text-white tracking-tighter uppercase tracking-[0.08em]">
                                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                                    SALON EN LIGNE
                                </span>
                            </h2>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Invitation Code Section */}
                        <div className="relative group py-4 px-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5" />
                            <div className="relative text-center space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Code d'invitation</label>
                                <div className="flex items-center justify-center gap-3">
                                    <span className="text-4xl font-black text-white tracking-tighter font-mono bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                                        {onlineRoomCode}
                                    </span>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(onlineRoomCode);
                                            toast.success('Code copié !');
                                        }}
                                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all active:scale-90"
                                    >
                                        <Copy className="h-4 w-4 text-slate-400" />
                                    </button>
                                </div>
                                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] animate-pulse">
                                    {onlineIsHost ? 'En attente des joueurs...' : 'Attente de l\'hôte...'}
                                </div>
                            </div>
                        </div>

                        {/* Players List */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Users className="h-4 w-4 text-blue-400" />
                                    Joueurs ({onlinePlayers.length}/2)
                                </h3>
                                <div className="h-1 flex-1 bg-white/5 mx-4 rounded-full" />
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {onlinePlayers.map((p) => (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={cn(
                                            "relative flex items-center gap-4 p-3 rounded-[24px] border transition-all shadow-xl backdrop-blur-md",
                                            p.id === socketId
                                                ? "bg-blue-600/10 border-blue-500/30 shadow-blue-500/5"
                                                : "bg-slate-900/40 border-white/5"
                                        )}
                                    >
                                        <div className="relative shrink-0">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl overflow-hidden border-2 shadow-2xl relative bg-slate-800",
                                                p.id === socketId ? "border-blue-500/40" : "border-white/10"
                                            )}>
                                                <img
                                                    src={getAvatarPath(p.emoji)}
                                                    alt="Avatar"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.src = '/avatars/cat.png' }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10" />
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(16,185,129,0.5)] flex items-center justify-center">
                                                <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "font-black text-base truncate",
                                                    p.id === socketId ? "text-white" : "text-slate-200"
                                                )}>
                                                    {p.name}
                                                </span>
                                                {p.isHost && (
                                                    <Trophy className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
                                                )}
                                                {p.id === socketId && (
                                                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter bg-blue-400/10 px-1.5 py-0.5 rounded-md">Moi</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                                                Connecté
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}

                                {onlinePlayers.length < 2 && (
                                    <div className="p-4 rounded-[24px] border-2 border-dashed border-white/5 bg-white/5 flex flex-col items-center justify-center gap-2 opacity-50 backdrop-blur-sm">
                                        <Users className="h-6 w-6 text-slate-700 animate-pulse" />
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">En attente d'un adversaire...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Unified Mode Selection Container */}
                        <div className="bg-slate-900/60 backdrop-blur-xl rounded-[26px] border border-white/10 shadow-2xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/5">
                                <h3 className="text-[10px] font-black text-slate-400/80 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Award className="h-3.5 w-3.5 text-blue-500" />
                                    Mode de Jeu
                                </h3>
                                {onlineGameMode === 'bonus' && (
                                    <div className="bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
                                        <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Tourment Actif</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-3">
                                {onlineIsHost ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setOnlineGameMode('classic')}
                                            className={cn(
                                                "flex flex-col items-center justify-center py-3 px-2 rounded-[18px] transition-all relative overflow-hidden group",
                                                onlineGameMode === 'classic'
                                                    ? "bg-blue-600/20 border border-blue-500/40 text-blue-400"
                                                    : "border border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5"
                                            )}
                                        >
                                            <Trophy className={cn("h-5 w-5 mb-1.5 transition-transform group-hover:scale-110", onlineGameMode === 'classic' ? "fill-current" : "")} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Classique</span>
                                            {onlineGameMode === 'classic' && (
                                                <motion.div layoutId="active-mode" className="absolute inset-0 bg-blue-400/5 z-0" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setOnlineGameMode('bonus')}
                                            className={cn(
                                                "flex flex-col items-center justify-center py-3 px-2 rounded-[18px] transition-all relative overflow-hidden group",
                                                onlineGameMode === 'bonus'
                                                    ? "bg-rose-600/30 border border-rose-500/50 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
                                                    : "border border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5"
                                            )}
                                        >
                                            <div className="relative">
                                                <Swords className={cn("h-5 w-5 mb-1.5 transition-transform group-hover:scale-110", onlineGameMode === 'bonus' ? "text-rose-500 fill-rose-500/20" : "")} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest">Tourment</span>

                                            {onlineGameMode === 'bonus' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowBonusRules(true);
                                                    }}
                                                    className="mt-1.5 bg-rose-500/20 hover:bg-rose-500/40 px-2 py-0.5 rounded-lg border border-rose-500/30 flex items-center gap-1 transition-all active:scale-95 z-20"
                                                >
                                                    <BookOpen className="h-3 w-3 text-rose-400" />
                                                    <span className="text-[8px] font-bold text-rose-400 uppercase">Règles</span>
                                                </button>
                                            )}

                                            {onlineGameMode === 'bonus' && (
                                                <motion.div layoutId="active-mode" className="absolute inset-0 bg-gradient-to-tr from-rose-500/10 to-transparent z-0" />
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => onlineGameMode === 'bonus' && setShowBonusRules(true)}
                                        className={cn(
                                            "relative group/mode flex items-center justify-between p-3 rounded-[18px] border transition-all overflow-hidden",
                                            onlineGameMode === 'bonus'
                                                ? "bg-rose-500/10 border-rose-500/20 cursor-pointer hover:bg-rose-500/20"
                                                : "bg-white/5 border-white/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 relative z-10">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center shadow-xl",
                                                onlineGameMode === 'bonus' ? "bg-rose-500/20" : "bg-blue-500/10"
                                            )}>
                                                {onlineGameMode === 'bonus' ? (
                                                    <Swords className="h-5 w-5 text-rose-400 fill-rose-400/20" />
                                                ) : (
                                                    <Trophy className="h-5 w-5 text-blue-400 fill-blue-400/20" />
                                                )}
                                            </div>
                                            <div>
                                                <p className={cn(
                                                    "text-xs font-black uppercase tracking-tighter",
                                                    onlineGameMode === 'bonus' ? "text-rose-400" : "text-white"
                                                )}>
                                                    MODE {onlineGameMode === 'bonus' ? 'TOURMENT' : 'Classique'}
                                                </p>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Sélectionné par l'hôte</p>
                                            </div>
                                        </div>
                                        {onlineGameMode === 'bonus' && (
                                            <div className="flex items-center gap-2 relative z-10">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowBonusRules(true);
                                                    }}
                                                    className="bg-rose-500/20 hover:bg-rose-500/40 px-2 py-1 rounded-lg border border-rose-500/30 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                                                >
                                                    <BookOpen className="h-3 w-3 text-rose-400" />
                                                    <span className="text-[8px] font-black text-rose-400 uppercase">Règles</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Start Button / Status */}
                        <div className="pt-4">
                            {onlineIsHost ? (
                                <PremiumTiltButton
                                    className="w-full"
                                    onClick={startOnlineGame}
                                    disabled={onlinePlayers.length < 2 || !onlineGameMode}
                                    gradientFrom="from-[#4f46e5]"
                                    gradientTo="to-[#4338ca]"
                                    shadowColor="shadow-indigo-900/40"
                                >
                                    <span className="flex items-center justify-center gap-3">
                                        <Play className="h-6 w-6 fill-current" />
                                        LANCER LA PARTIE
                                    </span>
                                </PremiumTiltButton>
                            ) : (
                                <div className="relative group overflow-hidden py-3 px-4 rounded-[18px] bg-white/5 border border-white/5 backdrop-blur-md text-center shadow-sm">
                                    <p className="relative z-10 text-blue-400/60 font-black text-sm uppercase tracking-widest">En attente de l'hôte...</p>
                                    <div className="relative z-10 text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1 flex items-center justify-center gap-1.5">
                                        <span className="w-1 h-1 bg-blue-400/40 rounded-full animate-pulse" />
                                        La partie va bientôt commencer
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Bonus Rules Tutorial */}
                    <BonusTutorial
                        isOpen={showBonusRules}
                        onClose={() => setShowBonusRules(false)}
                    />

                    {/* Premium Countdown Overlay */}
                    <AnimatePresence>
                        {lobbyCountdown !== null && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm pointer-events-none"
                            >
                                <motion.div
                                    key={lobbyCountdown}
                                    initial={{ scale: 0.5, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 1.5, opacity: 0, y: -20 }}
                                    transition={{ type: "spring", damping: 12, stiffness: 200 }}
                                    className="relative"
                                >
                                    <span className={cn(
                                        "text-8xl font-black italic tracking-tighter px-8 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] bg-clip-text text-transparent bg-gradient-to-b",
                                        lobbyCountdown === 'GO' ? "from-emerald-400 to-teal-600" : "from-white to-slate-400"
                                    )}>
                                        {lobbyCountdown}
                                    </span>
                                    <div className={cn(
                                        "absolute inset-0 blur-3xl -z-10 opacity-30",
                                        lobbyCountdown === 'GO' ? "bg-emerald-500" : "bg-blue-500"
                                    )} />
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            );
        }

        // Join or Create UI
        return (
            <div className="max-w-md mx-auto p-4 space-y-3 animate-in fade-in">
                <div className="relative flex items-center justify-center py-4 mb-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBackToMenu}
                        className="absolute left-0 w-10 h-10 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 transition-all shadow-xl backdrop-blur-md z-20"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    <div className="text-center group relative">
                        {/* Title Glow */}
                        <div className="absolute inset-0 bg-blue-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                        <h2 className="text-2xl font-black text-white tracking-tighter flex items-center justify-center gap-2.5 relative z-10">
                            <div className="relative flex items-center justify-center">
                                <Globe className="h-6 w-6 text-blue-400 animate-pulse" />
                                <div className="absolute inset-0 bg-blue-400/30 blur-md rounded-full animate-pulse" />
                            </div>
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 uppercase tracking-[0.08em]">
                                MULTIJOUEUR
                            </span>
                        </h2>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: 30 }}
                            className="h-1 bg-gradient-to-r from-blue-600 to-cyan-400 mx-auto rounded-full mt-1 shadow-[0_0_8px_rgba(56,189,248,0.4)]"
                        />
                    </div>
                </div>

                <Card className="glass-premium dark:glass-dark shadow-xl border-t border-white/10">
                    <CardContent className="space-y-6 pt-6">
                        {onlineError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-200 text-sm rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2">
                                <Info className="h-4 w-4 text-red-400" />
                                {onlineError}
                            </div>
                        )}

                        {/* Player Profile */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/80">Votre Profil</label>
                                <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">SkyID: {userProfile?.vibeId || '---'}</span>
                            </div>

                            <div className="relative group">
                                {/* Background Ambient Glow */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition-opacity" />

                                <div className="relative flex gap-3.5 items-center bg-slate-900/60 backdrop-blur-xl p-2.5 rounded-[22px] border border-white/10 shadow-2xl transition-all group-hover:border-blue-500/30">
                                    <div className="relative">
                                        <button
                                            onClick={() => setOpenAvatarSelector('online-setup')}
                                            className="w-14 h-14 rounded-xl flex items-center justify-center shadow-2xl transition-all hover:scale-105 border-2 border-blue-500/40 overflow-hidden relative group/avatar bg-slate-800"
                                        >
                                            <div className="absolute inset-0">
                                                <img
                                                    src={getAvatarPath(myAvatarId)}
                                                    alt="Avatar"
                                                    className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-500"
                                                    onError={(e) => { e.target.src = '/avatars/cat.png' }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/30 via-transparent to-white/10" />
                                            </div>
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                                                <Palette className="w-4 h-4 text-white" />
                                            </div>
                                        </button>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="relative">
                                            <Input
                                                placeholder="Pseudo"
                                                value={myPseudo}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setMyPseudo(val);
                                                    if (val.trim()) {
                                                        updateUserProfile({ name: val.trim() });
                                                        setPlayerInfo(val.trim(), myAvatarId);
                                                    }
                                                }}
                                                className="h-8 bg-transparent border-0 text-lg font-black text-white placeholder:text-slate-600 focus-visible:ring-0 px-0"
                                                required
                                            />
                                            <motion.div
                                                className="h-0.5 w-full bg-gradient-to-r from-blue-500 to-transparent rounded-full"
                                                initial={{ scaleX: 0 }}
                                                animate={{ scaleX: 1 }}
                                            />
                                        </div>
                                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                            <span className="w-1 h-1 rounded-full bg-blue-500" />
                                            Prêt à jouer
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions Grid */}
                        <div className="grid grid-cols-1 gap-4 pt-2">
                            <PremiumTiltButton
                                className="w-full"
                                onClick={() => {
                                    setPlayerInfo(myPseudo || 'Joueur', myAvatarId);
                                    createRoom();
                                    requestPermission();
                                }}
                                gradientFrom="from-[#1e40af]"
                                gradientTo="to-[#0369a1]"
                                shadowColor="shadow-blue-900/40"
                            >
                                <span className="flex items-center justify-center gap-3">
                                    <Plus className="h-6 w-6" />
                                    CRÉER UNE PARTIE
                                </span>
                            </PremiumTiltButton>

                            <div className="grid grid-cols-5 gap-3">
                                <div className="col-span-3 relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl opacity-0 group-focus-within:opacity-100 blur transition-opacity" />
                                    <Input
                                        placeholder="CODE"
                                        value={lobbyCode}
                                        onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
                                        maxLength={4}
                                        className="h-14 bg-slate-900/80 border-white/10 text-center font-mono tracking-[0.3em] font-black text-xl text-white uppercase placeholder:tracking-normal placeholder:font-bold rounded-2xl relative z-10 transition-all focus:border-blue-500/50"
                                    />
                                </div>
                                <Button
                                    className="col-span-2 h-14 bg-slate-800 hover:bg-slate-700 text-white border border-white/10 rounded-2xl font-black text-sm tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
                                    onClick={() => {
                                        setPlayerInfo(myPseudo || 'Joueur', myAvatarId);
                                        joinRoom(lobbyCode);
                                    }}
                                >
                                    REJOINDRE
                                </Button>
                            </div>
                        </div>

                        {/* Public Lobbies & Friends Split */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            {/* Public Lobbies */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-2 px-1">
                                    <Globe className="h-3.5 w-3.5 text-blue-500" />
                                    Salons publics ({publicRooms.length})
                                </h3>

                                {publicRooms.length === 0 ? (
                                    <div className="text-center p-3.5 border-2 border-dashed border-white/5 rounded-[22px] bg-white/5 backdrop-blur-sm">
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Aucun salon disponible</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                                        {publicRooms.map((room) => (
                                            <motion.div
                                                key={room.code}
                                                whileHover={{ scale: 1.01, x: 4 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="flex items-center justify-between p-3 pl-4 bg-slate-900/40 hover:bg-slate-800/60 border border-white/5 hover:border-blue-500/40 rounded-[20px] transition-all cursor-pointer group shadow-lg"
                                                onClick={() => {
                                                    setPlayerInfo(myPseudo || 'Joueur', myAvatarId);
                                                    joinRoom(room.code);
                                                }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center text-sm shadow-2xl overflow-hidden ring-2 ring-white/5 group-hover:ring-blue-500/30 transition-all">
                                                        {getAvatarPath(room.emoji) ? (
                                                            <img src={getAvatarPath(room.emoji)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                                        ) : (
                                                            <span className="text-xl">{room.emoji}</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-white text-sm group-hover:text-blue-400 transition-colors">
                                                            {room.hostName}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] text-blue-400 font-black tracking-widest uppercase">
                                                                #{room.code}
                                                            </span>
                                                            <div className="w-1 h-1 rounded-full bg-slate-700" />
                                                            <span className="text-[9px] text-slate-500 font-bold uppercase">Public</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1.5 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 shadow-inner">
                                                        <Users className="h-3.5 w-3.5 text-blue-400" />
                                                        <span className="text-xs font-black text-blue-400">
                                                            {room.playerCount}/2
                                                        </span>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-lg">
                                                        <ChevronRight className="h-5 w-5" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Friends List */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <div className="p-1 bg-emerald-500/10 rounded-lg">
                                            <Users className="h-3.5 w-3.5 text-emerald-500" />
                                        </div>
                                        Mes Amis ({friends.length})
                                    </h3>
                                </div>

                                <div className="space-y-2.5">
                                    {friends.length === 0 ? (
                                        <div className="p-3.5 bg-white/5 border-2 border-dashed border-white/5 rounded-[22px] flex flex-col items-center justify-center opacity-60 backdrop-blur-sm">
                                            <div className="text-[9px] text-slate-500 text-center font-black uppercase tracking-[0.2em]">
                                                Liste vide
                                            </div>
                                        </div>
                                    ) : (
                                        friends.map(friend => (
                                            <motion.div
                                                key={friend.id}
                                                whileHover={{ scale: 1.01, x: 4 }}
                                                className={`p-3 border rounded-[20px] flex items-center justify-between group transition-all shadow-xl backdrop-blur-md bg-slate-900/40 border-white/10 hover:border-indigo-500/40`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className={`w-12 h-12 rounded-xl bg-slate-900 border-2 overflow-hidden shadow-2xl transition-all ${friend.isOnline ? 'border-emerald-500/30' : 'border-white/5 grayscale'}`}>
                                                            <img src={getAvatarPath(friend.avatar_id)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                                        </div>
                                                        {friend.isOnline && (
                                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(16,185,129,0.5)] flex items-center justify-center">
                                                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-black tracking-tight ${friend.isOnline ? 'text-white' : 'text-slate-200'}`}>{friend.name}</p>
                                                        <div className={`text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 mt-0.5 ${friend.isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                                                            {friend.isOnline ? (
                                                                <>
                                                                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                                                    Disponible
                                                                </>
                                                            ) : 'Hors ligne'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    className={`h-9 px-4 rounded-xl text-[10px] font-black shadow-xl active:scale-95 transition-all tracking-wider flex items-center gap-2 group/invite bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-indigo-500/25`}
                                                    onClick={() => {
                                                        if (onlineRoomCode) {
                                                            inviteFriend(friend.id, onlineRoomCode, userProfile.name);
                                                        } else {
                                                            useOnlineGameStore.getState().createRoomAndInvite(friend.id);
                                                        }
                                                        playSocialInvite();
                                                    }}
                                                >
                                                    <span>DÉFIER</span>
                                                    <Swords className="w-3.5 h-3.5 group-hover/invite:rotate-12 transition-transform" />
                                                </Button>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Premium Countdown Overlay */}
                <AnimatePresence>
                    {lobbyCountdown !== null && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm pointer-events-none"
                        >
                            <motion.div
                                key={lobbyCountdown}
                                initial={{ scale: 0.5, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 1.5, opacity: 0, y: -20 }}
                                transition={{ type: "spring", damping: 12, stiffness: 200 }}
                                className="relative"
                            >
                                <span className={cn(
                                    "text-8xl font-black italic tracking-tighter px-8 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] bg-clip-text text-transparent bg-gradient-to-b",
                                    lobbyCountdown === 'GO' ? "from-emerald-400 to-teal-600" : "from-white to-slate-400"
                                )}>
                                    {lobbyCountdown}
                                </span>
                                <div className={cn(
                                    "absolute inset-0 blur-3xl -z-10 opacity-30",
                                    lobbyCountdown === 'GO' ? "bg-emerald-500" : "bg-blue-500"
                                )} />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }


    // If no active game state and we're on game screen, show loading indicator
    if (!activeGameState && screen === 'game') {
        // ERROR HANDLING: If there is an error (e.g. host left), show overlay instead of loading
        if (onlineError) {
            return <HostLeftOverlay />;
        }

        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                <Bot className="w-12 h-12 mb-4 opacity-20 animate-pulse" />
                <p className="text-sm font-medium">Initialisation de la partie...</p>
            </div>
        );
    }

    // Early return if no game state
    if (!activeGameState) {
        return null;
    }

    // Use a separate view for the sequential revelation phase
    if (activeGameState?.phase === 'REVEALING_CHESTS' && !chestsRevealed) {
        return (
            <ChestRevelationOverlay
                gameState={activeGameState}
                onComplete={() => setChestsRevealed(true)}
            />
        );
    }

    // Get number of cards already selected for initial reveal
    const currentPlayerKey = `player-${activeGameState.currentPlayerIndex}`;
    const selectedForReveal = initialReveals[currentPlayerKey] || [];

    // If game finished, show scores
    if (isFinished) {
        // Calculate scores directly from activeGameState (works for both local and online)
        const scores = calculateFinalScores(activeGameState);

        // DEBUG: Log the entire calculation to find the bug
        console.log('[SCORE DEBUG] activeGameState.players:', activeGameState?.players?.map(p => ({
            id: p.id,
            name: p.name,
            hand: p.hand?.map(c => c ? { value: c.value, isRevealed: c.isRevealed } : null)
        })));
        console.log('[SCORE DEBUG] calculateFinalScores result:', scores);

        // Calculate what cumulative scores would be after this round
        const projectedTotals = {};
        scores?.forEach(score => {
            const currentTotal = Number(activeTotalScores[String(score.playerId)]) || 0;
            const roundScore = Number(score.finalScore) || 0;
            projectedTotals[score.playerId] = currentTotal + roundScore;
        });

        // Check if game would end after this round
        const maxProjected = Math.max(...Object.values(projectedTotals), 0);
        const isDaily = isDailyChallenge;
        const gameEndsAfterThisRound = maxProjected >= 100 || isDaily;

        // If game is already over (endRound was called), show final results
        if (isGameOver && gameWinner) {
            const isUserWinner = gameWinner?.id === activeGameState?.players?.[myPlayerIndex]?.id;

            return (
                <div className="max-w-md mx-auto p-4 space-y-4 animate-in fade-in">
                    {/* ... modals and overlays ... */}
                    <ConfirmModal
                        isOpen={showExitConfirm}
                        onClose={() => setShowExitConfirm(false)}
                        onConfirm={confirmExit}
                        title="Quitter la partie ?"
                        message="Êtes-vous sûr de vouloir quitter ? Vous serez déconnecté de la partie en cours."
                        confirmText="Quitter"
                        variant="danger"
                    />
                    <AvatarSelector
                        isOpen={openAvatarSelector !== null}
                        onClose={() => setOpenAvatarSelector(null)}
                        selectedId={
                            openAvatarSelector === 'ai-player'
                                ? aiConfig.playerAvatarId
                                : openAvatarSelector === 'online-setup'
                                    ? myAvatarId
                                    : (openAvatarSelector !== null && players[openAvatarSelector] ? players[openAvatarSelector].avatarId : null)
                        }
                        onSelect={(id) => updateAvatar(openAvatarSelector, id)}
                    />
                    <CardAnimationLayer
                        pendingAnimation={onlineGameStarted ? onlinePendingAnimation : virtualPendingAnimation}
                        onClear={onlineGameStarted ? clearOnlinePendingAnimation : clearVirtualPendingAnimation}
                    />
                    <HostLeftOverlay />
                    <Card className="glass-premium shadow-xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-orange-900/20" />
                        <CardHeader className="text-center relative">
                            <div className="relative py-4">
                            </div>
                            <CardTitle className={cn(
                                "text-2xl",
                                isDailyChallenge
                                    ? (isUserWinner ? "text-amber-300 font-black tracking-tighter" : "text-rose-400 font-black tracking-tighter")
                                    : "text-amber-400"
                            )}>
                                {isDailyChallenge
                                    ? (isUserWinner ? "Défi Quotidien Réussi !" : "Défi Quotidien Échoué")
                                    : "Fin de partie !"}
                            </CardTitle>
                            <p className="text-slate-400 text-sm mt-1">
                                Après {roundNumber} manche{roundNumber > 1 ? 's' : ''}
                            </p>
                        </CardHeader>
                        <CardContent className="relative space-y-4">
                            {/* Winner announcement */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={cn(
                                    "text-center p-4 rounded-xl relative overflow-hidden",
                                    isDailyChallenge
                                        ? "bg-gradient-to-r from-amber-500/30 via-yellow-500/40 to-amber-500/30 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                                        : "bg-gradient-to-r from-amber-900/50 to-yellow-900/50"
                                )}
                            >
                                {isDailyChallenge && (
                                    <motion.div
                                        animate={{ x: ['-100%', '200%'] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg]"
                                    />
                                )}
                                <span className="text-4xl block mb-2">{gameWinner.emoji}</span>
                                <span className="text-xl font-bold text-amber-200">
                                    {gameWinner.name} gagne !
                                </span>
                                <span className="text-sm text-amber-400 block mt-1">
                                    Score final : {gameWinner.score} pts
                                </span>
                            </motion.div>

                            {/* All players final scores */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                    Classement final
                                </h3>
                                {activeGameState.players
                                    .map(p => ({ ...p, total: activeTotalScores[String(p.id)] || 0 }))
                                    .sort((a, b) => a.total - b.total)
                                    .map((player, index) => (
                                        <div
                                            key={player.id}
                                            className={cn(
                                                "flex items-center justify-between p-2 rounded-lg",
                                                index === 0 ? "bg-amber-900/30" : "bg-white/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-400">#{index + 1}</span>
                                                {getAvatarPath(player.avatarId || player.emoji) ? (
                                                    <img
                                                        src={getAvatarPath(player.avatarId || player.emoji)}
                                                        alt="Avatar"
                                                        className="w-5 h-5 object-contain rounded-full"
                                                    />
                                                ) : (
                                                    <span>{player.emoji || '👤'}</span>
                                                )}
                                                <span className="font-medium text-slate-300">{player.name}</span>
                                            </div>
                                            <span className={cn(
                                                "font-bold",
                                                player.total >= 100 ? "text-red-500" : "text-slate-300"
                                            )}>
                                                {player.total} pts
                                            </span>
                                        </div>
                                    ))}
                            </div>

                            {/* Daily Challenge Retry Button */}
                            {isDailyChallenge && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="pt-2"
                                >
                                    <Button
                                        onClick={rematch}
                                        disabled={isUserWinner}
                                        className={cn(
                                            "w-full h-12 rounded-xl text-white font-black shadow-lg flex items-center justify-center gap-2 border-b-4 transition-all",
                                            isUserWinner
                                                ? "bg-slate-700/50 border-slate-800 text-slate-500 cursor-not-allowed opacity-50 shadow-none border-b-0 translate-y-1"
                                                : "bg-gradient-to-r from-rose-500 to-pink-600 shadow-rose-500/20 border-rose-800 active:border-b-0 active:translate-y-1"
                                        )}
                                    >
                                        <RefreshCw className={cn("w-5 h-5", !isUserWinner && "animate-spin-slow")} />
                                        REJOUER LE DÉFI
                                    </Button>
                                </motion.div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleBackToMenu}
                                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 transition-all shadow-lg"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <Button
                                    className={cn(
                                        "flex-1 text-white font-bold",
                                        isDailyChallenge
                                            ? (isUserWinner
                                                ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                                                : "bg-slate-700/50 border-slate-800 text-slate-500 cursor-not-allowed opacity-50 shadow-none")
                                            : "bg-gradient-to-r from-emerald-600 to-teal-600"
                                    )}
                                    disabled={isDailyChallenge && !isUserWinner}
                                    onClick={isDailyChallenge ? handleBackToMenu : rematch}
                                >
                                    {isDailyChallenge ? (
                                        <>
                                            <Star className="h-4 w-4 mr-2 fill-current" />
                                            Terminer le défi
                                        </>
                                    ) : (
                                        <>
                                            <RotateCcw className="h-4 w-4 mr-1" />
                                            Nouvelle partie
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        // Regular end-of-round screen
        return (
            <div className="max-w-md mx-auto p-4 space-y-4 animate-in fade-in">
                {/* Modals inserted at top */}
                <ConfirmModal
                    isOpen={showExitConfirm}
                    onClose={() => setShowExitConfirm(false)}
                    onConfirm={confirmExit}
                    title="Quitter la partie ?"
                    message="Êtes-vous sûr de vouloir quitter ? Vous serez déconnecté de la partie en cours."
                    confirmText="Quitter"
                    variant="danger"
                />
                <AvatarSelector
                    isOpen={openAvatarSelector !== null}
                    onClose={() => setOpenAvatarSelector(null)}
                    selectedId={
                        openAvatarSelector === 'ai-player'
                            ? aiConfig.playerAvatarId
                            : openAvatarSelector === 'online-setup'
                                ? myAvatarId
                                : (openAvatarSelector !== null && players[openAvatarSelector] ? players[openAvatarSelector].avatarId : null)
                    }
                    onSelect={(id) => updateAvatar(openAvatarSelector, id)}
                />
                <CardAnimationLayer
                    pendingAnimation={onlineGameStarted ? onlinePendingAnimation : virtualPendingAnimation}
                    onClear={onlineGameStarted ? clearOnlinePendingAnimation : clearVirtualPendingAnimation}
                />
                <HostLeftOverlay />
                {/* Toast notifications REMOVED - using global Toaster */}{/* Toast removed */}
                <Card className="glass-premium shadow-xl overflow-hidden min-h-fit flex flex-col">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-orange-900/20" />
                    <CardHeader className="text-center relative pt-4 pb-2">
                        <CardTitle className="text-lg text-amber-400">
                            {isDailyChallenge ? "Défi Quotidien" : `Fin de la manche ${roundNumber}`}
                        </CardTitle>
                        {gameEndsAfterThisRound && !isDailyChallenge && (
                            <p className="text-red-500 text-xs font-medium mt-0.5">
                                ⚠️ Un joueur atteint 100 points !
                            </p>
                        )}
                    </CardHeader>
                    <CardContent className="relative space-y-4 flex-1 pb-4">
                        {/* Round scores with cumulative totals */}
                        <div className="space-y-2">
                            {scores?.map((score, index) => (
                                <motion.div
                                    key={score.playerId}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={cn(
                                        "flex flex-col p-2 rounded-lg gap-1",
                                        index === 0
                                            ? "bg-gradient-to-r from-amber-900/40 to-yellow-900/40 border border-amber-500/10"
                                            : "bg-white/5 border border-white/5"
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="text-lg font-black text-slate-500 shrink-0">
                                                #{index + 1}
                                            </span>
                                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                                                <span className="font-bold text-slate-100 leading-tight">
                                                    {score.playerName}
                                                </span>
                                                {score.isFinisher && (
                                                    <div className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 shadow-sm backdrop-blur-sm flex items-center shrink-0">
                                                        <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest leading-none">
                                                            A retourné
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end shrink-0">
                                            <div className={cn(
                                                "px-2 py-0.5 rounded-lg font-bold text-base shadow-sm border flex flex-col items-center min-w-[50px] transition-all",
                                                score.penalized
                                                    ? "bg-red-500/20 text-red-500 border-red-500/30"
                                                    : score.finalScore < 0
                                                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                                        : index === 0
                                                            ? "bg-amber-400 text-amber-950 border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                                                            : score.finalScore >= 30
                                                                ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                                                                : "bg-white/10 text-slate-200 border-white/10"
                                            )}>
                                                <span className="leading-none py-0.5">
                                                    {(Number(score.finalScore) > 0 ? '+' : '') + score.finalScore}
                                                </span>
                                                {score.penalized && (
                                                    <span className="text-[8px] uppercase tracking-tighter -mt-0.5 font-black">
                                                        Doublé!
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end mt-1">
                                                <span className={cn(
                                                    "text-[10px] font-bold tracking-tight",
                                                    projectedTotals[score.playerId] >= 100 ? "text-red-500 brightness-125" : "text-slate-400 opacity-80"
                                                )}>
                                                    TOTAL : {projectedTotals[score.playerId]}
                                                </span>
                                                {projectedTotals[score.playerId] >= 100 && (
                                                    <div className="h-0.5 w-full bg-red-500/50 mt-0.5 rounded-full" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mini grid of cards - arranged in 4 columns like the game board */}
                                    <div className="grid grid-cols-4 gap-1 p-1 w-fit mx-auto">
                                        {[0, 1, 2].map(row =>
                                            [0, 1, 2, 3].map(col => {
                                                const cardIdx = col * 3 + row;
                                                const player = activeGameState.players.find(p => p.id === score.playerId);
                                                const card = player?.hand[cardIdx];
                                                const isAutoRevealed = card && !card.isRevealed;

                                                // Check for resolved chest result
                                                const chestResult = activeGameState.chestResults?.[card?.id];
                                                const resolvedCard = card ? {
                                                    ...card,
                                                    isRevealed: true,
                                                    value: chestResult !== undefined ? chestResult : card.value,
                                                    specialType: chestResult !== undefined ? null : card.specialType
                                                } : null;

                                                return card ? (
                                                    <div key={`${score.playerId}-card-${cardIdx}`} className="relative">
                                                        <SkyjoCard
                                                            card={resolvedCard}
                                                            size="xs"
                                                            className={cn(
                                                                "opacity-95 shadow-md transition-all duration-500",
                                                                isAutoRevealed && "shadow-[0_0_12px_rgba(168,85,247,0.8)] scale-110 z-10 brightness-110"
                                                            )}
                                                        />
                                                        {isAutoRevealed && (
                                                            <div className="absolute -top-1 -right-1 flex items-center justify-center z-20">
                                                                <div className="relative">
                                                                    <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping opacity-75" />
                                                                    <div className="relative w-3.5 h-3.5 bg-gradient-to-tr from-purple-600 to-fuchsia-400 rounded-full border-2 border-slate-900 shadow-sm flex items-center justify-center">
                                                                        <Sparkles className="w-2 h-2 text-white" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div
                                                        key={`${score.playerId}-card-${cardIdx}`}
                                                        className="w-[2.25rem] h-[2.25rem] opacity-0"
                                                    />
                                                );
                                            })
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Legend for the auto-reveal cards */}
                        <div className="flex items-center justify-center gap-3 pt-4 pb-1 opacity-70 border-t border-white/5 mt-4">
                            <div className="w-3.5 h-3.5 bg-gradient-to-tr from-purple-600 to-fuchsia-400 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(168,85,247,0.3)]">
                                <Sparkles className="w-2 h-2 text-white" />
                            </div>
                            <span className="text-[9px] sm:text-[10px] text-purple-300/80 font-black uppercase tracking-widest italic">
                                Carte(s) révélée(s) en fin de manche
                            </span>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleBackToMenu}
                                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 transition-all shadow-lg"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <Button
                                className="flex-1 bg-skyjo-blue hover:bg-skyjo-blue/90 text-white"
                                disabled={isOnlineMode && isNextRoundPending && !(onlineTimeoutExpired && onlineIsHost)}
                                onClick={() => {
                                    if (isOnlineMode) {
                                        // XP is now handled by the useEffect hook to prevent duplicates

                                        // If host and timeout expired, force start
                                        if (isNextRoundPending && onlineTimeoutExpired && onlineIsHost) {
                                            forceOnlineNextRound();
                                        } else {
                                            // Normal flow: emit ready status
                                            setIsNextRoundPending(true);
                                            startOnlineNextRound();
                                        }
                                    } else {
                                        // Local mode: use local store

                                        // XP Awarding removed here - unified in store endRound() to avoid duplicates
                                        // (The store handles both 1 XP for rounds and 5 XP for Daily Challenge)

                                        // Capture results directly to ensure we have the latest state for archiving
                                        const result = endRound();

                                        // If game is over, archive immediately with the fresh scores
                                        if (result && result.isGameOver) {
                                            archiveVirtualGame({
                                                players: activeGameState.players,
                                                totalScores: result.newTotalScores,
                                                winner: result.gameWinner,
                                                roundsPlayed: roundNumber,
                                                gameType: aiMode ? 'ai' : 'local'
                                            });

                                            // Award EXTRA XP if Game Winner (Bonus)
                                            // We already gave XP for round win above.
                                            // Should we give more for game win?
                                            // Let's say yes, Game Win is +2 XP ? Or just another +1.
                                            // Original code gave +1. Let's keep +1 for Game Win.
                                            if (result.gameWinner) {
                                                if (aiMode && result.gameWinner.id === 'human-1') {
                                                    addXP(1);
                                                } else if (!aiMode) {
                                                    addXP(1);
                                                }
                                            }
                                        } else {
                                            // Start next round if game continues
                                            startNextRound();
                                        }
                                    }
                                    setInitialReveals({}); // Reset initial reveals for new round
                                }}
                            >
                                {gameEndsAfterThisRound ? (
                                    <>
                                        {isDailyChallenge ? (
                                            <>
                                                <Star className="h-4 w-4 mr-2 fill-current" />
                                                Terminer
                                            </>
                                        ) : (
                                            <>
                                                <Trophy className="h-4 w-4 mr-1" />
                                                Finir la partie
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {isOnlineMode ? (
                                            <>
                                                {isNextRoundPending ? (
                                                    <>
                                                        {onlineTimeoutExpired && onlineIsHost ? (
                                                            <>
                                                                <Play className="h-4 w-4 mr-1" />
                                                                Lancer maintenant ({onlineReadyStatus.readyCount}/{onlineReadyStatus.totalPlayers > 0 ? onlineReadyStatus.totalPlayers : activeGameState.players.length})
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1" />
                                                                Attendez... ({onlineReadyStatus.readyCount}/{onlineReadyStatus.totalPlayers > 0 ? onlineReadyStatus.totalPlayers : activeGameState.players.length})
                                                            </>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        {onlineIsHost ? (
                                                            <>
                                                                <Play className="h-4 w-4 mr-1" />
                                                                Manche suivante
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                                Proposer la suite
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                {isNextRoundPending ? (
                                                    <>
                                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1" />
                                                        Attendez...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="h-4 w-4 mr-1" />
                                                        Manche suivante
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div >
        );
    }


    return (
        <div
            className={cn(
                "skyjo-game-container max-w-3xl mx-auto p-0 animate-in fade-in relative min-h-[100dvh] flex flex-col overflow-x-hidden touch-none pb-safe-plus",
                activeGameState?.players?.length <= 2 ? "justify-start gap-2 py-2" : "justify-start gap-2 py-1 pb-6"
            )}
        >

            {/* Header - ultra-thin single line with glass-style elements */}
            {/* Header - Unified Pill Container */}
            <div className="flex items-center justify-center px-2 sm:px-4 py-1 shrink-0 z-50">
                {/* Visual Container for all controls - Robust Centered Pill */}
                <div className="flex items-center justify-center gap-3 sm:gap-8 bg-slate-900/80 border border-white/10 backdrop-blur-3xl rounded-[2.5rem] p-2 sm:p-2.5 shadow-2xl relative px-4 sm:px-8">

                    {/* Quit Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBackToMenu()}
                        className="h-12 sm:h-16 px-5 sm:px-8 text-xs sm:text-sm font-black uppercase tracking-widest bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 border border-red-500/10 rounded-3xl transition-all active:scale-95 flex items-center gap-2.5 group shadow-inner shrink-0"
                    >
                        <ArrowLeft className="h-6 w-6 sm:h-7 sm:w-7 group-hover:-translate-x-1 transition-transform" />
                        <span className="hidden sm:inline">Quitter</span>
                    </Button>

                    {/* Round Counter Group - PERFECT FILL */}
                    <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-3xl border border-white/10 shrink-0 shadow-inner h-12 sm:h-16">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] hidden lg:block ml-4 mr-2">Manche</span>
                        <div className="h-9 w-9 sm:h-13 sm:w-13 flex items-center justify-center text-2xl sm:text-3xl font-black text-white font-mono bg-indigo-500/30 rounded-2xl border border-indigo-500/50 shadow-[0_0_25px_rgba(99,102,241,0.3)] shrink-0">
                            {activeRoundNumber}
                        </div>
                        {aiMode && isDailyChallenge && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/30 text-[11px] font-black text-amber-400 flex items-center gap-2 shrink-0 mr-2"
                            >
                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse outline outline-4 outline-amber-500/20" />
                                <span className="hidden xs:inline">DÉFI</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Music & Pause Group */}
                    <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                        <div className="flex items-center gap-1.5 p-1.5 bg-white/5 rounded-3xl border border-white/10 shrink-0 shadow-inner h-12 sm:h-16">
                            {/* Toggle Button FIRST */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleMusic}
                                className={cn(
                                    "h-9 w-9 sm:h-13 sm:w-13 p-0 rounded-2xl transition-all shrink-0 active:scale-95",
                                    musicEnabled
                                        ? "bg-indigo-500/30 text-indigo-400 border border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                                        : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                {musicEnabled ? (
                                    <Music2 className="h-6 w-6 sm:h-7 sm:w-7 animate-pulse text-indigo-400" />
                                ) : (
                                    <Music className="h-6 w-6 sm:h-7 sm:w-7" />
                                )}
                            </Button>

                            {/* Skip Button SECOND */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    useGameStore.getState().triggerMusicShuffle();
                                    if (window.navigator.vibrate) window.navigator.vibrate(5);
                                }}
                                disabled={!musicEnabled}
                                className="h-9 w-9 sm:h-13 sm:w-13 p-0 rounded-2xl text-slate-400 hover:text-indigo-400 transition-all active:scale-95 disabled:opacity-20 shrink-0"
                            >
                                <SkipForward className="h-6 w-6 sm:h-7 sm:w-7" />
                            </Button>
                        </div>

                        {/* Pause Button (Local/AI only) */}
                        {aiMode && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={togglePause}
                                className={cn(
                                    "h-12 sm:h-16 px-5 sm:px-8 rounded-3xl transition-all active:scale-90 border shrink-0 flex items-center gap-3 shadow-2xl",
                                    isPaused
                                        ? "bg-amber-500/25 text-amber-500 border-amber-500/40 ring-4 ring-amber-500/10"
                                        : "bg-white/5 text-slate-400 border-white/10"
                                )}
                            >
                                {isPaused ? <PlayCircle className="h-6 w-6 sm:h-8 sm:w-8" /> : <Pause className="h-5 w-5 sm:h-7 sm:w-7" />}
                                <span className="text-xs sm:text-sm font-black uppercase tracking-widest hidden sm:inline">Pause</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Opponent at TOP for thumb zone optimization */}
            {activeGameState.players[opponentIndex] && (
                <div className="relative rounded-2xl transition-all duration-500">
                    <PlayerHand
                        player={activeGameState.players[opponentIndex]}
                        isCurrentPlayer={!isInitialReveal && activeGameState.currentPlayerIndex === opponentIndex}
                        isOpponent={true}
                        isOnlineOpponent={isOnlineMode} // Show real name for online opponents
                        selectedCardIndex={null}
                        canInteract={activeGameState.turnPhase === 'SPECIAL_ACTION_SWAP'} // Allow clicking opponent cards during swap
                        onCardClick={(index) => handleCardClick(index, opponentIndex)} // Support swap selection
                        size="sm"
                    />
                </div>
            )}

            {/* MIDDLE ACTION AREA - Centered between hands */}
            <div className="flex-1 flex flex-col justify-center items-center relative z-40 my-2">
                {/* Instruction Banner - Moved here for precise central placement over piles */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                    <GameMessageBanner message={instruction} />
                </div>
                {/* Initial Reveal Instruction Banner */}
                {isInitialReveal && (
                    <motion.div
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex justify-center px-4 w-full"
                    >
                        <div className="glass-premium px-8 py-2.5 rounded-[2rem] flex items-center gap-8 shadow-2xl border-white/20 relative overflow-hidden group max-h-[52px]">
                            {/* Shimmer top border line */}
                            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none" />

                            <h3 className="font-black text-white text-sm tracking-[0.1em] uppercase drop-shadow-sm whitespace-nowrap">
                                Retournez <span className="text-indigo-400">2</span> cartes
                            </h3>

                            <div className="flex gap-3">
                                {[0, 1].map(i => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "w-5 h-5 rounded-full border-2 transition-all duration-500",
                                            (initialReveals[`player-${myPlayerIndex}`] || []).length > i
                                                ? "bg-emerald-400 border-emerald-200 shadow-[0_0_20px_rgba(52,211,153,0.8)] scale-110"
                                                : "bg-white/5 border-white/20"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Compact Draw/Discard Trigger Button */}
                {!isInitialReveal && (
                    <div
                        className="flex justify-center px-4 w-full"
                        style={{ marginTop: '0', marginBottom: '0' }}
                    >
                        <div style={{ width: '100%', maxWidth: '340px' }}>
                            <DrawDiscardTrigger
                                onClick={() => setShowDrawDiscardPopup(true)} // Default open
                                drawnCardSource={activeDrawnCardSource}
                                onDrawAction={() => {
                                    // Direct draw action
                                    if (activeGameState.turnPhase === 'DRAW') {
                                        if (isOnlineMode) {
                                            emitGameAction('draw_pile');
                                        } else {
                                            drawFromDrawPile();
                                        }
                                        setShowDrawDiscardPopup(true);
                                    }
                                }}
                                onDiscardAction={() => {
                                    // Direct discard take action
                                    if (activeGameState.turnPhase === 'DRAW') {
                                        if (isOnlineMode) {
                                            emitGameAction('draw_discard');
                                        } else {
                                            takeFromDiscard();
                                        }
                                        setShowDrawDiscardPopup(true);
                                    }
                                }}
                                discardTop={discardTop}
                                discardPile={activeGameState.discardPile}
                                drawnCard={activeGameState.drawnCard}
                                drawPileCount={activeGameState.drawPile.length}
                                discardPileCount={activeGameState.discardPile.length}
                                canInteract={
                                    !isInitialReveal &&
                                    activeGameState.currentPlayerIndex === myPlayerIndex &&
                                    (activeGameState.turnPhase === 'DRAW' || (!!activeGameState.drawnCard))
                                }
                                turnPhase={activeGameState.turnPhase}
                                activeActionSource={
                                    (onlineGameStarted ? onlinePendingAnimation?.sourceId : virtualPendingAnimation?.sourceId)
                                }
                                isDrawing={!!(onlineGameStarted ? onlinePendingAnimation?.sourceId : virtualPendingAnimation?.sourceId)}
                                instructionText={
                                    activeGameState.phase === 'FINAL_ROUND'
                                        ? '⚠️ DERNIER TOUR'
                                        : (isInitialReveal ? `Retournez chacun 2 cartes ${selectedForReveal.length > 0 ? `(${selectedForReveal.length}/2)` : ''}` :
                                            // Only show action instructions when it's the human player's turn (virtual mode only)
                                            activeGameState.currentPlayerIndex !== myPlayerIndex && !isOnlineMode
                                                ? (isAIThinking ? `IA réfléchit...` : `Tour de l'IA`)
                                                : (activeGameState.turnPhase === 'DRAW' ? 'Piocher ou défausser' :
                                                    activeGameState.turnPhase === 'REPLACE_OR_DISCARD' ?
                                                        ((activeGameState.drawnCard?.specialType === 'C' || (Number(activeGameState.drawnCard?.value) === 0 && activeGameState.drawnCard?.color === 'special')) ? 'Complétez une colonne (Joker)' : 'Jouez dans votre grille ou défaussez') :
                                                        activeGameState.turnPhase === 'MUST_REPLACE' ?
                                                            ((activeGameState.drawnCard?.specialType === 'C' || (Number(activeGameState.drawnCard?.value) === 0 && activeGameState.drawnCard?.color === 'special')) ? 'Complétez une colonne (Joker)' : 'Remplacez une de vos cartes') :
                                                            activeGameState.turnPhase === 'MUST_REVEAL' ? 'Retournez une carte' :
                                                                activeGameState.turnPhase === 'SPECIAL_ACTION_SWAP' ? 'Échangez une carte' : ''))
                                }
                                isAIThinking={isAIThinking}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Instruction Banner - BELOW the PIOCHER button */}
            {/* Instruction Banner moved inside DrawDiscardTrigger */}

            {/* Local Player at BOTTOM for thumb zone optimization */}
            {activeGameState.players[myPlayerIndex] && (
                <div className="relative rounded-2xl transition-all duration-500">
                    <PlayerHand
                        player={activeGameState.players[myPlayerIndex]}
                        isCurrentPlayer={!isInitialReveal && activeGameState.currentPlayerIndex === myPlayerIndex}
                        isOpponent={false}
                        selectedCardIndex={null}
                        pendingRevealIndices={isInitialReveal ? (initialReveals[`player-${myPlayerIndex}`] || []) : []}
                        canInteract={
                            isInitialReveal ||
                            (activeGameState.currentPlayerIndex === myPlayerIndex && (
                                activeGameState.turnPhase === 'REPLACE_OR_DISCARD' ||
                                activeGameState.turnPhase === 'MUST_REPLACE' ||
                                activeGameState.turnPhase === 'MUST_REVEAL' ||
                                activeGameState.turnPhase === 'SPECIAL_ACTION_SWAP'
                            ))
                        }
                        onCardClick={(index) => {
                            if (isInitialReveal) {
                                handleInitialReveal(myPlayerIndex, index);
                            } else {
                                if (activeGameState.currentPlayerIndex !== myPlayerIndex) return;
                                handleCardClick(index);
                            }
                        }}
                        size="sm"
                        shakingCardIndex={shakingCard?.playerIndex === myPlayerIndex ? shakingCard.cardIndex : null}
                    />
                </div>
            )}

            {/* Additional players (if more than 2 - players at index 2+) */}
            {activeGameState.players.length > 2 && (
                <div className="mt-4 pb-20">
                    <h3 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide text-center">
                        Autres adversaires ({activeGameState.players.length - 2} IA)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                        {activeGameState.players.slice(2).map((player, displayIndex) => {
                            const actualIndex = displayIndex + 2;
                            const isAI = aiPlayers.includes(actualIndex);
                            return (
                                <div
                                    key={player.id}
                                    className={cn(
                                        "relative rounded-xl p-2 transition-all duration-300",
                                        !isInitialReveal && activeGameState.currentPlayerIndex === actualIndex
                                            ? "bg-gradient-to-br from-emerald-500/30 to-teal-500/30 ring-2 ring-emerald-400"
                                            : "bg-slate-800/40"
                                    )}
                                >
                                    {/* Compact name badge */}
                                    <div className={cn(
                                        "flex items-center gap-2 mb-2 px-2 py-1 rounded-lg text-sm font-medium",
                                        !isInitialReveal && activeGameState.currentPlayerIndex === actualIndex
                                            ? "bg-emerald-500 text-white"
                                            : "bg-slate-700 text-slate-200"
                                    )}>
                                        {isAI && <Bot className="h-4 w-4" />}
                                        <span className="truncate">{player.name}</span>
                                        {!isInitialReveal && activeGameState.currentPlayerIndex === actualIndex && (
                                            <span className="ml-auto animate-pulse">🎯</span>
                                        )}
                                    </div>
                                    <DrawDiscard
                                        drawPileCount={activeGameState?.drawPile.length || 0}
                                        discardTop={activeGameState?.discardPile[activeGameState.discardPile.length - 1] || null}
                                        discardHistory={activeGameState?.discardPile || []}
                                        drawnCard={activeGameState?.players[activeGameState.currentPlayerIndex]?.drawnCard}
                                        drawnCardSource={activeDrawnCardSource}
                                        canDraw={false} // Assuming these are for display only for other players
                                        canTakeDiscard={false}
                                        canDiscardDrawn={false}
                                        onDrawClick={() => { }}
                                        onDiscardClick={() => { }}
                                        onDiscardDrawnCard={() => { }}
                                        lastDiscardedCard={activeGameState?.lastDiscardedCard}
                                    />
                                    {/* Compact card grid */}
                                    <div className="grid grid-cols-4 gap-1 justify-items-center">
                                        {player.hand.map((card, cardIdx) => {
                                            const row = cardIdx % 3;
                                            const col = Math.floor(cardIdx / 3);
                                            const actualCardIdx = col * 3 + row;
                                            return (
                                                <SkyjoCard
                                                    key={cardIdx}
                                                    card={player.hand[actualCardIdx]}
                                                    size="sm"
                                                    isClickable={false}
                                                />
                                            );
                                        })}
                                    </div>

                                    {/* Mini score */}
                                    <div className="text-center mt-1">
                                        <span className="text-xs text-slate-400">
                                            Score: <span className="font-bold text-slate-200">
                                                {player.hand
                                                    .filter((c) => c?.isRevealed)
                                                    .reduce((sum, c) => sum + c.value, 0)}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Draw/Discard Popup Modal */}
            <DrawDiscardPopup
                isOpen={showDrawDiscardPopup}
                onClose={() => {
                    // Check if we need to undo "Take from Discard" action
                    // Logic: If we are in 'MUST_REPLACE' phase (meaning we took from discard)
                    // and we close the popup without confirming placement (which would change phase)
                    // then we should UN-DO the take action (put card back).
                    if (activeGameState.turnPhase === 'MUST_REPLACE') {
                        if (!isOnlineMode) {
                            useVirtualGameStore.getState().undoTakeFromDiscard();
                        } else {
                            useOnlineGameStore.getState().undoTakeFromDiscard();
                        }
                    }
                    setShowDrawDiscardPopup(false);
                }}
                drawPileCount={activeGameState.drawPile.length}
                discardPileCount={activeGameState.discardPile.length}
                discardTop={discardTop}
                discardPile={activeGameState.discardPile}
                drawnCard={activeGameState.drawnCard}
                canDraw={activeGameState.turnPhase === 'DRAW'}
                canTakeDiscard={
                    activeGameState.turnPhase === 'DRAW' &&
                    activeGameState.discardPile.length > 0
                }
                canDiscardDrawn={activeGameState.turnPhase === 'REPLACE_OR_DISCARD'}
                isBonusMode={effectiveIsBonusMode}
                onDrawClick={() => {
                    playCardDraw();
                    if (isOnlineMode) {
                        setIsActionPending(true);
                        emitGameAction('draw_pile');
                    } else {
                        drawFromDrawPile();
                    }
                }}
                onDiscardClick={() => {
                    playCardDraw();
                    if (isOnlineMode) {
                        setIsActionPending(true);
                        emitGameAction('draw_discard');
                    } else {
                        takeFromDiscard();
                    }
                }}
                onConfirmPlacement={() => {
                    // Just close popup - we are in 'MUST_REPLACE' or 'REPLACE_OR_DISCARD'
                    // and user wants to place on grid
                    setShowDrawDiscardPopup(false);
                }}
                onDiscardDrawnCard={() => {
                    if (effectiveIsBonusMode && activeGameState?.drawnCard?.value === 20) {
                        toast.error("💀 MALÉDICTION ! Vous devez obligatoirement placer le Crâne dans votre jeu !", {
                            duration: 4000,
                            position: 'bottom-center'
                        });
                        return;
                    }
                    playCardFlip(); // Sound for discarding
                    if (isOnlineMode) {
                        setIsActionPending(true);
                        emitGameAction('discard_drawn');
                    } else {
                        useVirtualGameStore.getState().discardDrawnCard();
                    }
                    setShowDrawDiscardPopup(false);
                }}
                onUseAction={() => {
                    playCardPlace();
                    if (activeGameState.turnPhase === 'RESOLVE_BLACK_HOLE') {
                        if (isOnlineMode) {
                            // Online support could be added here
                            setIsActionPending(true);
                            emitGameAction('activate_black_hole');
                        } else {
                            useVirtualGameStore.getState().activateBlackHole();
                        }
                    } else {
                        // Existing logic for Swap card (S)
                        if (isOnlineMode) {
                            setIsActionPending(true);
                            emitGameAction('use_action_card');
                        } else {
                            useVirtualGameStore.getState().playDrawnActionCard();
                        }
                        setInstruction("Sélectionnez une de VOS cartes à échanger");
                    }
                    setShowDrawDiscardPopup(false);
                }}
                isLoading={isActionPending}
            />

            {/* Animation Layer - always on top */}
            <CardAnimationLayer
                pendingAnimation={onlineGameStarted ? onlinePendingAnimation : virtualPendingAnimation}
                onClear={onlineGameStarted ? clearOnlinePendingAnimation : clearVirtualPendingAnimation}
            />

            {/* Avatar Selector Modal */}
            <AvatarSelector
                isOpen={openAvatarSelector !== null}
                onClose={() => setOpenAvatarSelector(null)}
                selectedId={
                    openAvatarSelector === 'ai-player'
                        ? aiConfig.playerAvatarId
                        : openAvatarSelector === 'online-setup'
                            ? myAvatarId
                            : (openAvatarSelector !== null && players[openAvatarSelector] ? players[openAvatarSelector].avatarId : null)
                }
                onSelect={(id) => updateAvatar(openAvatarSelector, id)}
            />

            {/* Premium Modals */}
            <ConfirmModal
                isOpen={showExitConfirm}
                onClose={() => setShowExitConfirm(false)}
                onConfirm={confirmExit}
                title="Quitter la partie ?"
                message="Êtes-vous sûr de vouloir quitter ? Vous serez déconnecté de la partie en cours."
                confirmText="Quitter"
                variant="danger"
            />
            <HostLeftOverlay />

            {/* AI Pause Overlay */}
            <AnimatePresence>
                {isPaused && aiMode && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[140] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-sm glass-premium p-8 py-10 rounded-[3rem] border-white/20 shadow-2xl text-center space-y-8 relative overflow-hidden"
                        >
                            {/* Ambient Glow */}
                            <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none" />

                            <div className="relative">
                                <div className="w-16 h-16 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                                    <Pause className="h-8 w-8 text-indigo-400" />
                                </div>
                                <h2 className="text-3xl font-black text-white tracking-tight">PAUSE</h2>
                                <p className="text-slate-400 text-sm font-medium mt-2">La partie est en attente</p>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <PremiumTiltButton
                                    onClick={() => setPaused(false)}
                                    gradientFrom="from-emerald-500"
                                    gradientTo="to-teal-500"
                                    shadowColor="shadow-emerald-500/20"
                                    className="h-14"
                                >
                                    <Play className="h-5 w-5 fill-current" />
                                    REPRENDRE
                                </PremiumTiltButton>

                                {/* Rules Buttons */}
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowRulesModal(true)}
                                        className="h-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-blue-400 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all"
                                    >
                                        <BookOpen className="h-4 w-4" />
                                        Classique
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowBonusRules(true)}
                                        className="h-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-rose-400 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Swords className="h-4 w-4" />
                                        Tourment
                                    </Button>
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={() => confirmExit()}
                                    className="h-12 rounded-2xl border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold uppercase tracking-widest text-[10px] transition-all"
                                >
                                    QUITTER LA PARTIE
                                </Button>
                            </div>

                            <div className="flex items-center justify-center gap-2 pt-2 opacity-50">
                                <Bot className="w-3 h-3 text-indigo-400" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    Votre progression est sauvegardée
                                </span >
                            </div >
                        </motion.div >
                    </motion.div >
                )}
            </AnimatePresence >

            {/* Rules Modals */}
            <Tutorial
                isOpen={showRulesModal}
                onClose={() => setShowRulesModal(false)}
            />
            <BonusTutorial
                isOpen={showBonusRules}
                onClose={() => setShowBonusRules(false)}
            />

            {/* Premium Countdown Overlay */}
        </div>
    );
}
