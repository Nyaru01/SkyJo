/**
 * Virtual Skyjo Game Store
 * Manages state for the virtual card game mode
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import {
    initializeGame,
    revealInitialCards,
    drawFromPile,
    drawFromDiscard,
    replaceCard,
    discardAndReveal,
    endTurn,
    calculateFinalScores,
    getValidActions,
    performSwap,
    playActionCard,
    generateChestResults,
    resolveBlackHole,
} from '../lib/skyjoEngine';
import { useGameStore } from './gameStore';
import {
    AI_DIFFICULTY,
    AI_NAMES,
    chooseInitialCardsToReveal,
    decideDrawSource,
    decideCardAction,
    decideSwapAction,
    resetOpponentMemory,
    observeOpponentTurn,
} from '../lib/skyjoAI';

/**
 * Utility to handle game end transitions (revealing chests, revealing all cards)
 */
const applyGameEndLogic = (newState) => {
    if (newState.phase === 'FINISHED') {
        let hasChests = false;
        newState.players.forEach(p => {
            p.hand.forEach(c => {
                if (c && (c.specialType === 'CH' || c.value === 'CH')) hasChests = true;
            });
        });

        if (hasChests) {
            const chestResults = generateChestResults(newState, Date.now().toString());
            newState.phase = 'REVEALING_CHESTS';
            newState.chestResults = chestResults;
        }

        // Reveal all cards for final score visibility
        newState.players.forEach(p => {
            p.hand.forEach(c => {
                if (c) c.isRevealed = true;
            });
        });
    }
    return newState;
};

export const useVirtualGameStore = create(
    persist(
        (set, get) => ({
            // Game state
            gameState: null,
            gameMode: null, // 'local' or 'online'
            roomCode: null,

            // Multi-round state
            totalScores: {}, // Cumulative scores per player: { playerId: score }
            roundNumber: 1,
            isGameOver: false, // True when someone reaches 100 points
            gameWinner: null, // Player with lowest score at game end

            // UI state
            selectedCardIndex: null,
            showScores: false,
            animatingCards: [],

            // AI mode state
            aiMode: false,
            aiPlayers: [], // Indices of AI players
            aiDifficulty: AI_DIFFICULTY.NORMAL,
            isAIThinking: false,
            drawnCardSource: null, // 'pile' or 'discard'
            isDailyChallenge: false,
            isShowingGame: false, // UI flag to indicate if we are on the game screen
            humanTurnStartState: null, // Track state for turn observation

            // Pause state
            isPaused: false,
            setPaused: (isPaused) => set({ isPaused }),
            setShowingGame: (isShowing) => set({ isShowingGame: isShowing }),
            togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

            // Notifications & Instructions
            lastNotification: null,
            instruction: null, // Current game instruction (persistent)
            setInstruction: (instruction) => set({ instruction }),

            /**
             * Perform a card swap (Special card 'S')
             */
            performSwap: (sourceCardIndex, targetPlayerIndex, targetCardIndex) => {
                const { gameState } = get();
                try {
                    const newState = performSwap(gameState, sourceCardIndex, targetPlayerIndex, targetCardIndex);

                    // Check for eliminations after swap
                    if (newState.lastEliminatedCards) {
                        const type = newState.eliminationType === 'column' ? 'une colonne' : 'une ligne';
                        // Notification removed as per user request (redundant with visual effect)
                        // set({
                        //     lastNotification: {
                        //         type: 'info',
                        //         message: `💥 Vous avez complété ${type} !`,
                        //         timestamp: Date.now()
                        //     }
                        // });
                    }

                    set({
                        gameState: newState,
                        selectedCardIndex: null,
                    });
                } catch (error) {
                    set({ lastNotification: { type: 'error', message: error.message } });
                }
            },

            clearNotification: () => set({ lastNotification: null }),

            // Animation State
            pendingAnimation: null, // { type, sourceId, targetId, card, onComplete }
            setPendingAnimation: (animation) => set({ pendingAnimation: animation }),
            clearPendingAnimation: () => set({ pendingAnimation: null }),


            /**
             * Start a new local game (full game with multiple rounds)
             */
            startLocalGame: (players) => {
                const gameState = initializeGame(players);
                // Initialize total scores for each player
                const totalScores = {};
                players.forEach(p => {
                    totalScores[p.id] = 0;
                });
                set({
                    gameState,
                    gameMode: 'local',
                    roomCode: null,
                    totalScores,
                    roundNumber: 1,
                    isGameOver: false,
                    gameWinner: null,
                    selectedCardIndex: null,
                    showScores: false,
                    aiMode: false,
                    aiPlayers: [],
                    drawnCardSource: null,
                    isPaused: false,
                });
            },

            /**
             * Start a new AI game (human vs AI players)
             */
            startAIGame: (humanPlayer, aiCount = 1, difficulty = AI_DIFFICULTY.NORMAL, options = {}) => {
                const isBonusMode = options.isBonusMode || false;
                // Create players array: human first, then AI players
                const players = [
                    { id: 'human-1', name: humanPlayer.name || 'Joueur', avatarId: humanPlayer.avatarId || 'cat' },
                ];

                const aiPlayerIndices = [];
                for (let i = 0; i < aiCount; i++) {
                    players.push({
                        id: `ai-${i + 1}`,
                        name: AI_NAMES[i] || `IA ALPHA ${i + 1}`,
                        avatarId: 'bot',
                    });
                    aiPlayerIndices.push(i + 1); // AI players are at indices 1, 2, 3...
                }

                const gameState = initializeGame(players, { isBonusMode });

                // Reset AI memory for new game
                resetOpponentMemory();

                const totalScores = {};
                players.forEach(p => {
                    totalScores[p.id] = 0;
                });

                set({
                    gameState,
                    gameMode: 'ai',
                    roomCode: null,
                    totalScores,
                    roundNumber: 1,
                    isGameOver: false,
                    gameWinner: null,
                    selectedCardIndex: null,
                    showScores: false,
                    aiMode: true,
                    aiPlayers: aiPlayerIndices,
                    aiDifficulty: difficulty,
                    isBonusMode: isBonusMode,
                    isAIThinking: false,
                    drawnCardSource: null,
                    isPaused: false,
                    isDailyChallenge: options.isDailyChallenge || false,
                    humanTurnStartState: null,
                });
            },

            /**
             * Set AI thinking state (for UI indicator)
             */
            setAIThinking: (isThinking) => {
                set({ isAIThinking: isThinking });
            },

            /**
             * Execute AI turn - called automatically when it's an AI player's turn
             */
            executeAITurn: () => {
                const { gameState, aiDifficulty, aiPlayers, isPaused, pendingAnimation } = get();
                if (!gameState || isPaused || pendingAnimation) return;

                const currentPlayerIndex = gameState.currentPlayerIndex;
                if (!aiPlayers.includes(currentPlayerIndex)) return;

                const phase = gameState.phase;
                const turnPhase = gameState.turnPhase;

                // Handle initial reveal phase
                if (phase === 'INITIAL_REVEAL') {
                    const currentPlayer = gameState.players[currentPlayerIndex];
                    const revealedCount = currentPlayer.hand.filter(c => c && c.isRevealed).length;

                    if (revealedCount < 2) {
                        const cardsToReveal = chooseInitialCardsToReveal(currentPlayer.hand, aiDifficulty);
                        const newState = revealInitialCards(gameState, currentPlayerIndex, cardsToReveal);
                        set({
                            gameState: newState,
                            isAIThinking: false,
                            lastNotification: {
                                type: 'info',
                                message: `${currentPlayer.name} a retourné 2 cartes`,
                                timestamp: Date.now()
                            }
                        });
                    }
                    return;
                }

                // Handle playing/final round phase
                if (phase === 'PLAYING' || phase === 'FINAL_ROUND') {
                    // Define currentPlayer once at the start of this block so it's available in all branches
                    const currentPlayer = gameState.players[currentPlayerIndex];

                    if (turnPhase === 'DRAW') {
                        // Step 1: Decide where to draw from
                        const drawSource = decideDrawSource(gameState, aiDifficulty);
                        let newState;
                        // Animation setup (currentPlayer already defined above)

                        // Helper to execute draw with animation
                        const executeDrawWithAnimation = (sourceId, sourceCard, finalStateCalc) => {
                            // 1. Set notification
                            set({
                                // lastNotification: {
                                //     type: 'info',
                                //     message: `🤖 ${currentPlayer.name} ${sourceId === 'deck-pile' ? 'a pioché' : `a pris (${sourceCard.value})`}`,
                                //     timestamp: Date.now()
                                // }
                            });

                            // 2. Trigger Animation
                            // For draw, we don't have a specific target "hand" element that is visible for AI usually
                            // But we can target the player's avatar or hand container if visible
                            // Or just a central point. Let's try to target the player's hand container if possible.
                            // Or we can add an ID to the hand container itself.
                            // We want the card to fly to the CENTER (the drawn card slot)
                            // We added ID `drawn-card-slot` in DrawDiscardTrigger
                            const targetId = 'drawn-card-slot';

                            set({
                                pendingAnimation: {
                                    sourceId: sourceId,
                                    targetId: targetId,
                                    card: sourceCard || { value: '?', color: 'gray' }, // Provide dummy if deck
                                    onComplete: () => {
                                        // 3. Commit State Change after animation
                                        set({
                                            gameState: finalStateCalc(),
                                            drawnCardSource: sourceId === 'deck-pile' ? 'pile' : 'discard'
                                        });
                                    }
                                }
                            });
                        };

                        if (drawSource === 'DISCARD_PILE' && gameState.discardPile.length > 0) {
                            const discardTop = gameState.discardPile[gameState.discardPile.length - 1];
                            executeDrawWithAnimation(
                                'discard-pile',
                                discardTop,
                                () => drawFromDiscard(get().gameState)
                            );
                        } else {
                            // Draw from pile
                            executeDrawWithAnimation(
                                'deck-pile',
                                null, // Unknown card for animation (face down)
                                () => drawFromPile(get().gameState)
                            );
                        }

                        return; // Will be called again for the next phase
                    }

                    if (turnPhase === 'REPLACE_OR_DISCARD' || turnPhase === 'MUST_REPLACE') {
                        // Step 2: Decide what to do with drawn card
                        const decision = decideCardAction(gameState, aiDifficulty);

                        const currentPlayer = gameState.players[currentPlayerIndex];
                        const drawnCard = gameState.drawnCard;

                        // We assume the card starts from "hand" area (or where it landed).
                        // But for the REPLACE animation, we want it to go from "somewhere" to the Grid Target.
                        // We'll use the center of screen or the player's general area as source?
                        // Actually, the previous animation landed it at `card-${currentPlayer.id}-4`.
                        // So let's start from there? Or maybe just use `deck-pile` if we didn't track it.
                        // Better: The "drawn card" is usually displayed in the UI (e.g., in the DrawDiscard component).
                        // But in AI turn, we don't see the Draw/Discard popup usually? 
                        // Wait, if AI is playing, the local player sees... the board.
                        // The AI doesn't open the popup.
                        // So the "drawn card" concept is abstract visually unless we show it.
                        // For now, let's assume it flies from the deck/discard to the target.

                        // If it was REPLACE:
                        // Animation: Hand/Deck -> Target Slot.

                        if (decision.action === 'REPLACE') {
                            // 1. Notify
                            set({
                                // lastNotification: {
                                //     type: 'info',
                                //     message: `🤖 ${currentPlayer.name} a remplacé une carte`,
                                //     timestamp: Date.now()
                                // }
                            });

                            // 2. Animate
                            const targetId = `card-${currentPlayer.id}-${decision.cardIndex}`;

                            // Source? If we just drew, it's virtually "in hand". 
                            // Source? The card is currently displayed at the CENTER (drawn-card-slot)
                            const sourceId = 'drawn-card-slot';

                            set({
                                pendingAnimation: {
                                    sourceId: sourceId,
                                    targetId: targetId,
                                    card: drawnCard,
                                    onComplete: () => {
                                        // 3. Commit
                                        let ns = replaceCard(get().gameState, decision.cardIndex);
                                        ns = endTurn(ns);
                                        ns = applyGameEndLogic(ns);

                                        // Notification for elimination
                                        if (ns.lastEliminatedCards) {
                                            const type = ns.eliminationType === 'column' ? 'une colonne' : 'une ligne';
                                            // Notification removed as per user request
                                            // set({
                                            //     lastNotification: {
                                            //         type: 'info',
                                            //         message: `💥 ${currentPlayer.name} a complété ${type} !`,
                                            //         timestamp: Date.now()
                                            //     }
                                            // });
                                        }

                                        set({
                                            gameState: ns,
                                            selectedCardIndex: null,
                                            isAIThinking: false,
                                            drawnCardSource: null
                                        });
                                    }
                                }
                            });

                        } else {
                            // DISCARD AND REVEAL
                            // 1. Notify
                            set({
                                // lastNotification: {
                                //     type: 'info',
                                //     message: `🤖 ${currentPlayer.name} a défaussé et retourné une carte`,
                                //     timestamp: Date.now()
                                // }
                            });

                            // 2. Animate: Center -> Discard Pile
                            const sourceId = 'drawn-card-slot';
                            const targetId = 'discard-pile';

                            set({
                                pendingAnimation: {
                                    sourceId: sourceId,
                                    targetId: targetId,
                                    card: drawnCard,
                                    onComplete: () => {
                                        // 3. Commit
                                        // Special case: if it's 'S', we use playActionCard instead of discardAndReveal
                                        const isS = drawnCard.specialType === 'S';

                                        let ns;
                                        if (isS) {
                                            ns = playActionCard(get().gameState);
                                            // Optional: notify about action
                                        } else {
                                            ns = discardAndReveal(get().gameState, decision.cardIndex);
                                        }

                                        ns = endTurn(ns);
                                        ns = applyGameEndLogic(ns);

                                        // Notification for elimination
                                        if (ns.lastEliminatedCards) {
                                            const type = ns.eliminationType === 'column' ? 'une colonne' : 'une ligne';
                                            // Notification removed as per user request
                                            // set({
                                            //     lastNotification: {
                                            //         type: 'info',
                                            //         message: `💥 ${currentPlayer.name} a complété ${type} !`,
                                            //         timestamp: Date.now()
                                            //     }
                                            // });
                                        }

                                        set({
                                            gameState: ns,
                                            selectedCardIndex: null,
                                            isAIThinking: false,
                                            drawnCardSource: null
                                        });
                                    }
                                }
                            });
                        }

                        return;
                    }

                    if (turnPhase === 'SPECIAL_ACTION_SWAP') {
                        // AI needs to decide which cards to swap
                        const swapDecision = decideSwapAction(gameState);
                        const { sourceCardIndex, targetPlayerIndex, targetCardIndex } = swapDecision;
                        const targetPlayer = gameState.players[targetPlayerIndex];

                        // Get card values for clear notification
                        const myCard = currentPlayer.hand[sourceCardIndex];
                        const theirCard = targetPlayer.hand[targetCardIndex];

                        // Phrasing logic for grammar
                        const myValText = myCard.isRevealed ? `son ${myCard.value}` : 'sa carte cachée';
                        const theirValText = theirCard.isRevealed ? `votre ${theirCard.value}` : 'votre carte cachée';

                        set({
                            lastNotification: {
                                type: 'info',
                                message: `${currentPlayer.name} a échangé ${myValText} contre ${theirValText} !`,
                                timestamp: Date.now()
                            }
                        });

                        // For now, no animation for swap, just execute
                        const ns = performSwap(gameState, sourceCardIndex, targetPlayerIndex, targetCardIndex);

                        // Check for eliminations after swap
                        if (ns.lastEliminatedCards) {
                            const type = ns.eliminationType === 'column' ? 'une colonne' : 'une ligne';
                        }

                        const nsFinal = applyGameEndLogic(ns);

                        set({
                            gameState: nsFinal,
                            isAIThinking: false,
                        });
                        return;
                    }

                    if (turnPhase === 'RESOLVE_BLACK_HOLE') {
                        // AI simply triggers the black hole
                        set({
                            lastNotification: {
                                type: 'info',
                                message: `${currentPlayer.name} a activé un TROU NOIR !`,
                                timestamp: Date.now()
                            }
                        });

                        let ns = resolveBlackHole(gameState);
                        ns = applyGameEndLogic(ns);

                        set({
                            gameState: ns,
                            isAIThinking: false,
                            drawnCardSource: null
                        });
                        return;
                    }
                }
            },

            /**
             * Reveal initial 2 cards for a player
             */
            revealInitial: (playerIndex, cardIndices) => {
                const { gameState } = get();
                if (!gameState) return;

                const newState = revealInitialCards(gameState, playerIndex, cardIndices);
                set({ gameState: newState });
            },

            /**
             * Draw from the main pile
             */
            drawFromDrawPile: () => {
                const { gameState, aiPlayers } = get();
                if (!gameState || gameState.turnPhase !== 'DRAW') return;

                // Capture start state for human turn observation
                if (!aiPlayers.includes(gameState.currentPlayerIndex)) {
                    set({ humanTurnStartState: gameState });
                }

                const newState = drawFromPile(gameState);
                set({ gameState: newState, drawnCardSource: 'pile' });
            },

            /**
             * Take from discard pile
             */
            takeFromDiscard: () => {
                const { gameState, aiPlayers } = get();
                if (!gameState || gameState.turnPhase !== 'DRAW') return;
                if (gameState.discardPile.length === 0) return;

                // Capture start state for human turn observation
                if (!aiPlayers.includes(gameState.currentPlayerIndex)) {
                    set({ humanTurnStartState: gameState });
                }

                const newState = drawFromDiscard(gameState);
                set({ gameState: newState, drawnCardSource: 'discard' });
            },

            /**
             * Replace a card in hand with drawn card
             */
            replaceHandCard: (cardIndex) => {
                const { gameState, humanTurnStartState, aiPlayers } = get();
                if (!gameState) return;
                if (gameState.turnPhase !== 'REPLACE_OR_DISCARD' && gameState.turnPhase !== 'MUST_REPLACE') return;

                const isHuman = !aiPlayers.includes(gameState.currentPlayerIndex);

                let newState = replaceCard(gameState, cardIndex);
                newState = endTurn(newState);
                newState = applyGameEndLogic(newState);

                // Observe turn if human finished
                if (isHuman && humanTurnStartState) {
                    observeOpponentTurn(humanTurnStartState, newState);
                    set({ humanTurnStartState: null });
                }

                // Notification for elimination
                if (newState.lastEliminatedCards) {
                    const type = newState.eliminationType === 'column' ? 'une colonne' : 'une ligne';
                    // Notification removed as per user request
                    // set({
                    //     lastNotification: {
                    //         type: 'info',
                    //         message: `💥 Vous avez complété ${type} !`,
                    //         timestamp: Date.now()
                    //     }
                    // });
                }

                set({ gameState: newState, selectedCardIndex: null, drawnCardSource: null });
            },

            /**
             * Discard drawn card and reveal a hidden card
             */
            discardAndRevealCard: (cardIndex) => {
                const { gameState, humanTurnStartState, aiPlayers } = get();
                if (!gameState || gameState.turnPhase !== 'REPLACE_OR_DISCARD') return;

                const player = gameState.players[gameState.currentPlayerIndex];
                if (player.hand[cardIndex]?.isRevealed) return;

                const isHuman = !aiPlayers.includes(gameState.currentPlayerIndex);

                let newState = discardAndReveal(gameState, cardIndex);
                newState = endTurn(newState);
                newState = applyGameEndLogic(newState);

                // Observe turn if human finished
                if (isHuman && humanTurnStartState) {
                    observeOpponentTurn(humanTurnStartState, newState);
                    set({ humanTurnStartState: null });
                }

                // Notification for elimination
                if (newState.lastEliminatedCards) {
                    const type = newState.eliminationType === 'column' ? 'une colonne' : 'une ligne';
                    // Notification removed as per user request
                    // set({
                    //     lastNotification: {
                    //         type: 'info',
                    //         message: `💥 Vous avez complété ${type} !`,
                    //         timestamp: Date.now()
                    //     }
                    // });
                }

                set({ gameState: newState, selectedCardIndex: null, drawnCardSource: null });
            },

            /**
             * Use the drawn card as a special action (e.g. 'S' card swap)
             * This buries the card in the discard pile and triggers the action phase.
             */
            playDrawnActionCard: () => {
                const { gameState, humanTurnStartState, aiPlayers } = get();
                if (!gameState || gameState.turnPhase !== 'REPLACE_OR_DISCARD') return;

                const isHuman = !aiPlayers.includes(gameState.currentPlayerIndex);

                let newState = playActionCard(gameState);
                newState = endTurn(newState); // endTurn respects SPECIAL_ACTION_SWAP phase
                newState = applyGameEndLogic(newState);

                // Observe turn if human finished (and turn actually ended - 
                // playActionCard might lead to SPECIAL_ACTION_SWAP which is still human turn)
                if (isHuman && humanTurnStartState && newState.currentPlayerIndex !== gameState.currentPlayerIndex) {
                    observeOpponentTurn(humanTurnStartState, newState);
                    set({ humanTurnStartState: null });
                }

                set({ gameState: newState, selectedCardIndex: null, drawnCardSource: null });
            },

            /**
             * Explicitly activate the Black Hole effect
             */
            activateBlackHole: () => {
                const { gameState } = get();
                if (!gameState || gameState.turnPhase !== 'RESOLVE_BLACK_HOLE') return;

                let newState = resolveBlackHole(gameState);
                newState = applyGameEndLogic(newState);

                set({
                    gameState: newState,
                    drawnCardSource: null,
                    lastNotification: {
                        type: 'info',
                        message: "🌀 Défausse aspirée sous la pioche !",
                        timestamp: Date.now()
                    }
                });
            },


            /**
             * Reveal a card on the grid (used when in MUST_REVEAL phase)
             */
            revealGridCard: (cardIndex) => {
                const { gameState, humanTurnStartState, aiPlayers } = get();
                if (!gameState || gameState.turnPhase !== 'MUST_REVEAL') return;

                const isHuman = !aiPlayers.includes(gameState.currentPlayerIndex);

                const player = gameState.players[gameState.currentPlayerIndex];
                // Can only reveal hidden cards
                if (player.hand[cardIndex]?.isRevealed) return;

                // Reveal the card
                const newHand = [...player.hand];
                const revealedCard = { ...newHand[cardIndex], isRevealed: true };
                if (revealedCard.value === 20) {
                    revealedCard.lockCount = 3;
                }
                newHand[cardIndex] = revealedCard;

                const newPlayers = [...gameState.players];
                newPlayers[gameState.currentPlayerIndex] = { ...player, hand: newHand };

                // After revealing, turn ends
                let newState = {
                    ...gameState,
                    players: newPlayers,
                    turnPhase: 'DRAW' // Reset for next turn logic inside endTurn
                };

                // Use engine's endTurn to handle column clearing and next player
                newState = endTurn(newState);

                // Observe turn if human finished
                if (isHuman && humanTurnStartState) {
                    observeOpponentTurn(humanTurnStartState, newState);
                    set({ humanTurnStartState: null });
                }

                // Handle Chest Revelation Phase transition
                if (newState.phase === 'FINISHED') {
                    let hasChests = false;
                    newState.players.forEach(p => {
                        p.hand.forEach(c => {
                            if (c && (c.specialType === 'CH' || c.value === 'CH')) hasChests = true;
                        });
                    });

                    if (hasChests) {
                        const chestResults = generateChestResults(newState, Date.now().toString());
                        newState.phase = 'REVEALING_CHESTS';
                        newState.chestResults = chestResults;
                    }

                    // Reveal all cards for final score visibility
                    newState.players.forEach(p => {
                        p.hand.forEach(c => {
                            if (c) c.isRevealed = true;
                        });
                    });
                }

                set({ gameState: newState });
            },
            discardDrawnCard: () => {
                const { gameState } = get();
                if (!gameState || gameState.turnPhase !== 'REPLACE_OR_DISCARD') return;
                if (!gameState.drawnCard) return;

                // Put drawn card on discard pile and set phase to reveal a hidden card
                const newState = {
                    ...gameState,
                    discardPile: [...gameState.discardPile, { ...gameState.drawnCard, isRevealed: true }],
                    drawnCard: null,
                    turnPhase: 'MUST_REVEAL', // New phase: must reveal a hidden card
                };
                set({ gameState: newState });
            },

            /**
             * Reveal a hidden card (after discarding drawn card)
             */
            revealHiddenCard: (cardIndex) => {
                const { gameState, humanTurnStartState, aiPlayers } = get();
                if (!gameState || gameState.turnPhase !== 'MUST_REVEAL') return;

                const player = gameState.players[gameState.currentPlayerIndex];
                if (player.hand[cardIndex]?.isRevealed) return; // Can only reveal hidden cards

                const isHuman = !aiPlayers.includes(gameState.currentPlayerIndex);

                // Reveal the card
                const newHand = player.hand.map((card, i) => {
                    if (i === cardIndex) {
                        const revealedCard = { ...card, isRevealed: true };
                        if (revealedCard.value === 20) {
                            revealedCard.lockCount = 3;
                        }
                        return revealedCard;
                    }
                    return card;
                });

                const newPlayers = [...gameState.players];
                newPlayers[gameState.currentPlayerIndex] = {
                    ...player,
                    hand: newHand,
                };

                let newState = {
                    ...gameState,
                    players: newPlayers,
                    turnPhase: 'DRAW',
                };
                newState = endTurn(newState);
                newState = applyGameEndLogic(newState);

                // Observe turn if human finished
                if (isHuman && humanTurnStartState) {
                    observeOpponentTurn(humanTurnStartState, newState);
                    set({ humanTurnStartState: null });
                }

                set({ gameState: newState, selectedCardIndex: null, drawnCardSource: null });
            },

            /**
             * Select a card in hand (for UI highlighting)
             */
            selectCard: (index) => {
                set({ selectedCardIndex: index });
            },

            /**
             * Get current valid actions
             */
            getActions: () => {
                const { gameState } = get();
                if (!gameState) return null;
                return getValidActions(gameState);
            },

            /**
             * Undo taking from discard (if user changes mind/closes popup)
             * Puts the drawn card back to discard pile and resets phase
             */
            undoTakeFromDiscard: () => {
                const { gameState } = get();
                if (!gameState || !gameState.drawnCard || gameState.turnPhase !== 'MUST_REPLACE') return;

                // Animate return to discard
                // Source: Center (drawn-card-slot)
                // Target: Discard Pile (discard-pile)

                const cardToAnimate = gameState.drawnCard;

                set({
                    pendingAnimation: {
                        sourceId: 'drawn-card-slot',
                        targetId: 'discard-pile',
                        card: { ...cardToAnimate, isRevealed: true },
                        onComplete: () => {
                            // Revert state
                            const newDiscardPile = [...gameState.discardPile, gameState.drawnCard];
                            set({
                                gameState: {
                                    ...gameState,
                                    discardPile: newDiscardPile,
                                    drawnCard: null,
                                    turnPhase: 'DRAW',
                                    drawnCardSource: null
                                }
                            });
                        }
                    }
                });
            },

            /**
             * Get final scores
             */
            getFinalScores: () => {
                const { gameState } = get();
                if (!gameState || gameState.phase !== 'FINISHED') return null;
                return calculateFinalScores(gameState);
            },

            /**
             * Reset game (back to menu)
             */
            resetGame: () => {
                set({
                    gameState: null,
                    gameMode: null,
                    roomCode: null,
                    totalScores: {},
                    roundNumber: 1,
                    isGameOver: false,
                    gameWinner: null,
                    selectedCardIndex: null,
                    showScores: false,
                    aiMode: false,
                    aiPlayers: [],
                    aiDifficulty: AI_DIFFICULTY.NORMAL,
                    isAIThinking: false,
                    isPaused: false,
                });
            },

            /**
             * End current round, update cumulative scores, check for game end
             */
            endRound: () => {
                const { gameState, totalScores, roundNumber, aiPlayers } = get();
                // Accept both FINISHED and REVEALING_CHESTS (bonus mode with chests already revealed)
                if (!gameState || (gameState.phase !== 'FINISHED' && gameState.phase !== 'REVEALING_CHESTS')) return;

                const roundScores = calculateFinalScores(gameState);
                const newTotalScores = { ...totalScores };

                // Add this round's scores to totals
                roundScores.forEach(score => {
                    newTotalScores[score.playerId] = (newTotalScores[score.playerId] || 0) + score.finalScore;
                });

                // Grant XP if human player won/tied the round (lowest score)
                const sortedScores = [...roundScores].sort((a, b) => a.finalScore - b.finalScore);
                const winningScore = sortedScores[0]?.finalScore;
                const humanPlayer = gameState.players.find(p => p.id === 'human-1');

                let xpAwardedValue = 0;
                if (humanPlayer && roundScores.find(s => s.playerId === humanPlayer.id)?.finalScore === winningScore) {
                    // Human won or tied for win in this round!
                    try {
                        const isDaily = get().isDailyChallenge;
                        const isDailyAvailable = useGameStore.getState().lastDailyWinDate !== new Date().toISOString().split('T')[0];

                        if (isDaily && isDailyAvailable) {
                            // XP depends on difficulty for daily challenge
                            const difficulty = get().aiDifficulty;
                            xpAwardedValue = difficulty === 'bonus' ? 6 : 3;

                            useGameStore.getState().addXP(xpAwardedValue);
                            useGameStore.getState().markDailyWin();
                            console.log(`[VG] Daily Challenge Won (${difficulty})! ${xpAwardedValue} XP Awarded.`);
                        } else {
                            // Normal win or already won today
                            xpAwardedValue = 1;
                            useGameStore.getState().addXP(1);
                            console.log("[VG] Round Won! 1 XP Awarded.");
                        }
                    } catch (e) {
                        console.warn('Could not grant XP:', e);
                    }
                }

                // Check if anyone reached 100 points (game over condition)
                const maxScore = Math.max(...Object.values(newTotalScores));
                const isDaily = get().isDailyChallenge;
                const isGameOver = maxScore >= 100 || isDaily;

                let gameWinner = null;
                if (isGameOver) {
                    // Find player with LOWEST total score (they win!)
                    const minScore = Math.min(...Object.values(newTotalScores));
                    const winnerId = Object.keys(newTotalScores).find(id => newTotalScores[id] === minScore);
                    const winner = gameState.players.find(p => p.id === winnerId);
                    gameWinner = winner ? { ...winner, score: minScore } : null;
                }

                set({
                    totalScores: newTotalScores,
                    isGameOver,
                    gameWinner,
                });

                return { isGameOver, newTotalScores, gameWinner, xpAwarded: xpAwardedValue };
            },

            /**
             * Debug: Trigger a column clean animation
             * Fills the first column with cards, then clears them to trigger the animation
             */
            debugTriggerColumnClean: () => {
                const { gameState } = get();
                if (!gameState) return;

                const playerIndex = 0; // Target the first player (usually human)
                const player = gameState.players[playerIndex];
                if (!player) return;

                // Step 1: Fill column 0 with dummy cards
                const handWithCards = [...player.hand];
                [0, 1, 2].forEach(i => {
                    handWithCards[i] = { id: `debug-${Date.now()}-${i}`, value: 5, color: 'yellow', isRevealed: true };
                });

                const stateWithCards = {
                    ...gameState,
                    players: gameState.players.map((p, i) =>
                        i === playerIndex ? { ...p, hand: handWithCards } : p
                    )
                };

                set({ gameState: stateWithCards });

                // Step 2: Clear them after a short delay to allow React to render the "before" state
                setTimeout(() => {
                    const { gameState: currentGameState } = get();
                    if (!currentGameState) return;

                    const handCleared = [...handWithCards];
                    [0, 1, 2].forEach(i => {
                        handCleared[i] = null;
                    });

                    const stateCleared = {
                        ...currentGameState,
                        players: currentGameState.players.map((p, i) =>
                            i === playerIndex ? { ...p, hand: handCleared } : p
                        )
                    };

                    set({ gameState: stateCleared });

                    // Also trigger the notification logic? No, we removed it.
                    // The animation in PlayerHand.jsx relies on the transition from cards -> null.
                }, 100);
            },

            /**
             * Debug: Simulate a full game setup
             * Initializes an AI game, reveals human cards, and switches tabs.
             */
            debugSimulateGame: () => {
                const { startAIGame, revealInitial } = get();
                const { userProfile, setActiveTab } = useGameStore.getState();

                // 1. Start a Bonus mode game against 1 IA
                startAIGame({ name: userProfile.name, avatarId: userProfile.avatarId }, 1, AI_DIFFICULTY.HARDCORE, { isBonusMode: true });

                // 2. Automatically reveal 2 cards for human to get into PLAYING phase
                setTimeout(() => {
                    revealInitial(0, [0, 1]);
                    // 3. Switch to game tab
                    setActiveTab('virtual');
                    toast.success('Simulation lancée : Mode Bonus vs IA Hardcore');
                }, 100);
            },

            /**
             * Debug: Force a special action card into the player's "drawn" slot
             */
            debugForceActionCard: (type = 'S') => {
                const { gameState } = get();
                if (!gameState) {
                    toast.error("Lancez d'abord une partie !");
                    return;
                }

                // Create a special card
                const specialCard = {
                    id: `debug-special-${Date.now()}`,
                    value: 0,
                    specialType: type, // 'S', 'H', 'C'
                    color: type === 'S' || type === 'C' ? 'special' : (type === 'H' ? 'black' : 'gold'),
                    isRevealed: true
                };

                const newState = {
                    ...gameState,
                    drawnCard: specialCard,
                    turnPhase: 'REPLACE_OR_DISCARD'
                };

                set({ gameState: newState, drawnCardSource: 'pile' });
                toast.success(`Action ${type} forcée !`);
            },

            /**
             * Start next round with same players
             */
            startNextRound: () => {
                const { gameState, roundNumber, isGameOver } = get();
                if (!gameState || isGameOver) return;

                const players = gameState.players.map(p => ({
                    id: p.id,
                    name: p.name,
                    avatarId: p.avatarId,
                }));

                const newGameState = initializeGame(players, { isBonusMode: get().isBonusMode });
                set({
                    gameState: newGameState,
                    roundNumber: roundNumber + 1,
                    selectedCardIndex: null,
                    showScores: false,
                    isPaused: false,
                });
            },

            /**
             * Play again with same players (new full game)
             */
            rematch: () => {
                const { gameState } = get();
                if (!gameState) return;

                const players = gameState.players.map(p => ({
                    id: p.id,
                    name: p.name,
                    avatarId: p.avatarId,
                }));

                // Reset everything for a new full game
                const newGameState = initializeGame(players, { isBonusMode: get().isBonusMode });
                const totalScores = {};
                players.forEach(p => {
                    totalScores[p.id] = 0;
                });

                set({
                    gameState: newGameState,
                    totalScores,
                    roundNumber: 1,
                    isGameOver: false,
                    gameWinner: null,
                    selectedCardIndex: null,
                    showScores: false,
                    isPaused: false,
                });
            },
        }),
        {
            name: 'skyjo-virtual-storage',
            version: 1,
            partialize: (state) => ({
                gameState: state.gameState,
                gameMode: state.gameMode,
                totalScores: state.totalScores,
                roundNumber: state.roundNumber,
                isGameOver: state.isGameOver,
                gameWinner: state.gameWinner,
                aiMode: state.aiMode,
                aiPlayers: state.aiPlayers,
                aiDifficulty: state.aiDifficulty,
                isBonusMode: state.isBonusMode,
                isPaused: state.isPaused,
                isDailyChallenge: state.isDailyChallenge,
            }),
        }
    )
);

// Selectors
export const selectGameState = (state) => state.gameState;
export const selectCurrentPlayer = (state) => {
    if (!state.gameState) return null;
    return state.gameState.players[state.gameState.currentPlayerIndex];
};
export const selectGamePhase = (state) => state.gameState?.phase;
export const selectTurnPhase = (state) => state.gameState?.turnPhase;
export const selectDrawnCard = (state) => state.gameState?.drawnCard;
export const selectDiscardTop = (state) => {
    if (!state.gameState?.discardPile?.length) return null;
    return state.gameState.discardPile[state.gameState.discardPile.length - 1];
};
export const selectTotalScores = (state) => state.totalScores;
export const selectRoundNumber = (state) => state.roundNumber;
export const selectIsGameOver = (state) => state.isGameOver;
export const selectGameWinner = (state) => state.gameWinner;

// AI selectors
export const selectAIMode = (state) => state.aiMode;
export const selectAIPlayers = (state) => state.aiPlayers;
export const selectAIDifficulty = (state) => state.aiDifficulty;
export const selectIsAIThinking = (state) => state.isAIThinking;
export const selectIsCurrentPlayerAI = (state) => {
    if (!state.gameState || !state.aiMode) return false;
    return state.aiPlayers.includes(state.gameState.currentPlayerIndex);
};
