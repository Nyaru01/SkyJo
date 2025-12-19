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
        });
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
