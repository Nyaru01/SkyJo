/**
 * Virtual Skyjo Game Store
 * Manages state for the virtual card game mode
 */
import { create } from 'zustand';
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
} from '../lib/skyjoEngine';
import {
    AI_DIFFICULTY,
    AI_NAMES,
    chooseInitialCardsToReveal,
    decideDrawSource,
    decideCardAction,
} from '../lib/skyjoAI';

export const useVirtualGameStore = create((set, get) => ({
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
        });
    },

    /**
     * Start a new AI game (human vs AI players)
     */
    startAIGame: (humanPlayer, aiCount = 1, difficulty = AI_DIFFICULTY.NORMAL) => {
        // Create players array: human first, then AI players
        const players = [
            { id: 'human-1', name: humanPlayer.name || 'Joueur', emoji: humanPlayer.emoji || '🐱' },
        ];

        const aiPlayerIndices = [];
        for (let i = 0; i < aiCount; i++) {
            players.push({
                id: `ai-${i + 1}`,
                name: AI_NAMES[i] || `🤖 Bot ${i + 1}`,
                emoji: '🤖',
            });
            aiPlayerIndices.push(i + 1); // AI players are at indices 1, 2, 3...
        }

        const gameState = initializeGame(players);
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
            isAIThinking: false,
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
        const { gameState, aiDifficulty, aiPlayers } = get();
        if (!gameState) return;

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
                set({ gameState: newState, isAIThinking: false });
            }
            return;
        }

        // Handle playing/final round phase
        if (phase === 'PLAYING' || phase === 'FINAL_ROUND') {
            if (turnPhase === 'DRAW') {
                // Step 1: Decide where to draw from
                const drawSource = decideDrawSource(gameState, aiDifficulty);
                let newState;

                if (drawSource === 'DISCARD_PILE' && gameState.discardPile.length > 0) {
                    newState = drawFromDiscard(gameState);
                } else {
                    newState = drawFromPile(gameState);
                }

                set({ gameState: newState });
                return; // Will be called again for the next phase
            }

            if (turnPhase === 'REPLACE_OR_DISCARD' || turnPhase === 'MUST_REPLACE') {
                // Step 2: Decide what to do with drawn card
                const decision = decideCardAction(gameState, aiDifficulty);
                let newState;

                if (decision.action === 'REPLACE') {
                    newState = replaceCard(gameState, decision.cardIndex);
                    newState = endTurn(newState);
                } else {
                    // DISCARD_AND_REVEAL
                    newState = discardAndReveal(gameState, decision.cardIndex);
                    newState = endTurn(newState);
                }

                set({ gameState: newState, selectedCardIndex: null, isAIThinking: false });
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
        const { gameState } = get();
        if (!gameState || gameState.turnPhase !== 'DRAW') return;

        const newState = drawFromPile(gameState);
        set({ gameState: newState });
    },

    /**
     * Take from discard pile
     */
    takeFromDiscard: () => {
        const { gameState } = get();
        if (!gameState || gameState.turnPhase !== 'DRAW') return;
        if (gameState.discardPile.length === 0) return;

        const newState = drawFromDiscard(gameState);
        set({ gameState: newState });
    },

    /**
     * Replace a card in hand with drawn card
     */
    replaceHandCard: (cardIndex) => {
        const { gameState } = get();
        if (!gameState) return;
        if (gameState.turnPhase !== 'REPLACE_OR_DISCARD' && gameState.turnPhase !== 'MUST_REPLACE') return;

        let newState = replaceCard(gameState, cardIndex);
        newState = endTurn(newState);
        set({ gameState: newState, selectedCardIndex: null });
    },

    /**
     * Discard drawn card and reveal a hidden card
     */
    discardAndRevealCard: (cardIndex) => {
        const { gameState } = get();
        if (!gameState || gameState.turnPhase !== 'REPLACE_OR_DISCARD') return;

        const player = gameState.players[gameState.currentPlayerIndex];
        if (player.hand[cardIndex]?.isRevealed) return;

        let newState = discardAndReveal(gameState, cardIndex);
        newState = endTurn(newState);
        set({ gameState: newState, selectedCardIndex: null });
    },

    /**
     * Discard the drawn card (put it on discard pile)
     * Player must then select a hidden card to reveal
     */
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
        const { gameState } = get();
        if (!gameState || gameState.turnPhase !== 'MUST_REVEAL') return;

        const player = gameState.players[gameState.currentPlayerIndex];
        if (player.hand[cardIndex]?.isRevealed) return; // Can only reveal hidden cards

        // Reveal the card
        const newHand = player.hand.map((card, i) =>
            i === cardIndex ? { ...card, isRevealed: true } : card
        );

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
        set({ gameState: newState, selectedCardIndex: null });
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
        });
    },

    /**
     * End current round, update cumulative scores, check for game end
     */
    endRound: () => {
        const { gameState, totalScores, roundNumber } = get();
        if (!gameState || gameState.phase !== 'FINISHED') return;

        const roundScores = calculateFinalScores(gameState);
        const newTotalScores = { ...totalScores };

        // Add this round's scores to totals
        roundScores.forEach(score => {
            newTotalScores[score.playerId] = (newTotalScores[score.playerId] || 0) + score.finalScore;
        });

        // Check if anyone reached 100 points (game over condition)
        const maxScore = Math.max(...Object.values(newTotalScores));
        const isGameOver = maxScore >= 100;

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

        return { isGameOver, newTotalScores };
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
            emoji: p.emoji,
        }));

        const newGameState = initializeGame(players);
        set({
            gameState: newGameState,
            roundNumber: roundNumber + 1,
            selectedCardIndex: null,
            showScores: false,
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
            emoji: p.emoji,
        }));

        // Reset everything for a new full game
        const newGameState = initializeGame(players);
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
        });
    },
}));

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
