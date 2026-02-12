/**
 * Skyjo Game Engine
 * Contains all game logic for the virtual Skyjo card game
 */

// Card distribution according to official rules (150 cards total)
const CARD_DISTRIBUTION = {
    '-2': { count: 5, color: 'indigo' },
    '-1': { count: 10, color: 'blue' },
    '0': { count: 15, color: 'cyan' },
    '1': { count: 10, color: 'green' },
    '2': { count: 10, color: 'green' },
    '3': { count: 10, color: 'green' },
    '4': { count: 10, color: 'green' },
    '5': { count: 10, color: 'yellow' },
    '6': { count: 10, color: 'yellow' },
    '7': { count: 10, color: 'yellow' },
    '8': { count: 10, color: 'yellow' },
    '9': { count: 10, color: 'orange' },
    '10': { count: 10, color: 'orange' },
    '11': { count: 10, color: 'orange' },
    '12': { count: 10, color: 'red' },
};

// Card distribution for Bonus Mode (156 cards total)
const CARD_DISTRIBUTION_BONUS = {
    '-10': { count: 6, color: 'violet' },
    '-2': { count: 5, color: 'indigo' },
    '-1': { count: 10, color: 'blue' },
    '0': { count: 15, color: 'cyan' },
    '1': { count: 10, color: 'green' },
    '2': { count: 10, color: 'green' },
    '3': { count: 10, color: 'green' },
    '4': { count: 10, color: 'green' },
    '5': { count: 10, color: 'yellow' },
    '6': { count: 10, color: 'yellow' },
    '7': { count: 10, color: 'yellow' },
    '8': { count: 10, color: 'yellow' },
    '9': { count: 10, color: 'orange' },
    '10': { count: 10, color: 'orange' },
    '11': { count: 10, color: 'orange' },
    '12': { count: 10, color: 'red' },
    '20': { count: 6, color: 'darkred' },
    'S': { count: 4, color: 'special' }, // Swap Card
    'C': { count: 4, color: 'special' }, // Clean Card
    'CH': { count: 4, color: 'gold' }, // Chest Card (?)
    'H': { count: 4, color: 'black' }, // Black Hole Card
};

// Color mappings for CSS classes
export const CARD_COLORS = {
    violet: { bg: 'bg-violet-600', text: 'text-white', glow: 'shadow-violet-500/50' },
    indigo: { bg: 'bg-indigo-600', text: 'text-white', glow: 'shadow-indigo-500/50' },
    blue: { bg: 'bg-blue-500', text: 'text-white', glow: 'shadow-blue-500/50' },
    cyan: { bg: 'bg-cyan-500', text: 'text-white', glow: 'shadow-cyan-500/50' },
    green: { bg: 'bg-emerald-500', text: 'text-white', glow: 'shadow-emerald-500/50' },
    yellow: { bg: 'bg-yellow-400', text: 'text-yellow-900', glow: 'shadow-yellow-400/50' },
    orange: { bg: 'bg-orange-500', text: 'text-white', glow: 'shadow-orange-500/50' },
    red: { bg: 'bg-red-600', text: 'text-white', glow: 'shadow-red-500/50' },
    darkred: { bg: 'bg-red-950', text: 'text-white', glow: 'shadow-red-900/50' },
    special: { bg: 'bg-indigo-900', text: 'text-white', glow: 'shadow-indigo-500/50' },
    gold: { bg: 'bg-amber-500', text: 'text-amber-950', glow: 'shadow-amber-400/50' },
    black: { bg: 'bg-slate-950', text: 'text-white', glow: 'shadow-slate-800/50' },
};

/**
 * Create a single card object
 */
export const createCard = (value, id, isBonusMode = false) => {
    const distribution = isBonusMode ? CARD_DISTRIBUTION_BONUS : CARD_DISTRIBUTION;
    // Map S/C to numeric values for simplified scoring/handling if needed, 
    // but keep the string for type identification
    let numericValue = parseInt(value);
    if (value === 'S') numericValue = 0; // Action card (value 0)
    if (value === 'C') numericValue = 0; // Joker card
    if (value === 'CH') numericValue = 0; // Chest card (?)
    if (value === 'H') numericValue = 0; // Black Hole action

    const specialType = isNaN(parseInt(value)) ? value : null;

    return {
        id,
        value: numericValue,
        specialType: specialType,
        color: distribution[value].color,
        isRevealed: false,
    };
};

/**
 * Create a full Skyjo deck
 */
export const createDeck = (isBonusMode = false) => {
    const deck = [];
    let cardId = 0;
    const distribution = isBonusMode ? CARD_DISTRIBUTION_BONUS : CARD_DISTRIBUTION;

    Object.entries(distribution).forEach(([value, { count }]) => {
        for (let i = 0; i < count; i++) {
            deck.push(createCard(value, `card-${cardId++}`, isBonusMode));
        }
    });

    return deck;
};

/**
 * Fisher-Yates shuffle algorithm
 */
export const shuffleDeck = (deck) => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

/**
 * Deal cards to players (12 cards each in 3x4 grid)
 */
export const dealCards = (deck, playerCount) => {
    const shuffled = shuffleDeck(deck);

    // Separate special action cards to ensure they are NOT in the initial hand
    const dealableCards = shuffled.filter(c => c.specialType !== 'S' && c.specialType !== 'H');
    const actionCards = shuffled.filter(c => c.specialType === 'S' || c.specialType === 'H');

    const cardsPerPlayer = 12;
    const hands = [];
    let dealIndex = 0;

    for (let p = 0; p < playerCount; p++) {
        const hand = [];
        for (let i = 0; i < cardsPerPlayer; i++) {
            hand.push({ ...dealableCards[dealIndex++] });
        }
        hands.push(hand);
    }

    // Draw pile = remaining normal cards + all action cards, shuffled again
    const remainingNormal = dealableCards.slice(dealIndex);
    const drawPile = shuffleDeck([...remainingNormal, ...actionCards]);

    return { hands, drawPile };
};

/**
 * Initialize a new game
 */
export const initializeGame = (players, options = {}) => {
    const isBonusMode = options.isBonusMode || false;
    const deck = createDeck(isBonusMode);
    const { hands, drawPile } = dealCards(deck, players.length);

    // Start discard pile with one card from draw pile
    // RULE: Discard pile cannot start with an 'S' card. If it does, bury it.
    // Use a while loop in case the replacement card is ALSO an 'S' card (rare but possible)
    let initialDiscard = { ...drawPile.pop(), isRevealed: true };
    let finalDrawPile = [...drawPile];
    let finalDiscardPile = [];
    let buriedCards = [];

    while (initialDiscard.specialType === 'S' || initialDiscard.specialType === 'H') {
        console.log(`[ENGINE] Initial discard was "${initialDiscard.specialType}", burying and drawing another.`);
        buriedCards.push(initialDiscard);
        if (finalDrawPile.length === 0) {
            // Should be impossible with standard deck but good safety
            finalDrawPile = [...buriedCards];
            buriedCards = [];
            shuffleDeck(finalDrawPile);
        }
        initialDiscard = { ...finalDrawPile.pop(), isRevealed: true };
    }

    // Put buried 'S' cards at the bottom of the draw pile? 
    // Or just put them in the discard pile *under* the valid card?
    // Rules say "bury in discard" or "reshuffle". 
    // Let's put them at the bottom of the discard pile to be safe and invisible.
    finalDiscardPile = [...buriedCards, initialDiscard];

    return {
        players: players.map((player, index) => ({
            ...player,
            hand: hands[index],
            hasFinished: false,
        })),
        drawPile: finalDrawPile,
        discardPile: finalDiscardPile,
        currentPlayerIndex: 0,
        phase: 'INITIAL_REVEAL', // INITIAL_REVEAL, PLAYING, FINAL_ROUND, FINISHED
        turnPhase: 'DRAW', // DRAW, REPLACE_OR_DISCARD
        drawnCard: null,
        finishingPlayerIndex: null,
        roundNumber: 1,
    };
};

/**
 * Reveal initial cards (each player reveals 2 cards)
 */
export const revealInitialCards = (gameState, playerIndex, cardIndices) => {
    if (cardIndices.length !== 2) {
        throw new Error('Must reveal exactly 2 cards initially');
    }

    const newState = { ...gameState };
    newState.players = [...gameState.players];
    newState.players[playerIndex] = {
        ...gameState.players[playerIndex],
        hand: gameState.players[playerIndex].hand.map((card, i) => {
            if (cardIndices.includes(i)) {
                const revealedCard = { ...card, isRevealed: true };
                if (revealedCard.value === 20) {
                    revealedCard.lockCount = 3;
                }
                return revealedCard;
            }
            return card;
        }),
    };

    // Check if all players have revealed their initial cards
    const allRevealed = newState.players.every(
        p => p.hand.filter(c => c.isRevealed).length >= 2
    );

    if (allRevealed) {
        // Find player with highest sum of revealed cards to start
        let highestSum = -Infinity;
        let startingPlayer = 0;

        newState.players.forEach((player, idx) => {
            const sum = player.hand
                .filter(c => c.isRevealed)
                .reduce((acc, c) => acc + c.value, 0);
            if (sum > highestSum) {
                highestSum = sum;
                startingPlayer = idx;
            }
        });

        newState.phase = 'PLAYING';
        newState.currentPlayerIndex = startingPlayer;
    }
    // For simultaneous reveal: don't change currentPlayerIndex until all reveal
    // Each player can reveal independently

    return newState;
};

/**
 * Draw a card from the draw pile
 */
export const drawFromPile = (gameState) => {
    if (gameState.drawPile.length === 0) {
        // Shuffle discard pile (except top card) back into draw pile
        const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];
        const newDrawPile = shuffleDeck(gameState.discardPile.slice(0, -1));
        const drawnCard = { ...newDrawPile.pop(), isRevealed: true };
        let nextPhase = drawnCard.value === 20 ? 'MUST_REPLACE' : 'REPLACE_OR_DISCARD';
        if (drawnCard.specialType === 'H') nextPhase = 'RESOLVE_BLACK_HOLE';

        return {
            ...gameState,
            drawPile: newDrawPile,
            discardPile: [topDiscard],
            drawnCard,
            turnPhase: nextPhase,
        };
    }

    const drawnCard = { ...gameState.drawPile[gameState.drawPile.length - 1], isRevealed: true };

    // BONUS MODE RULE: If drawn card is 20 (Cursed Skull), player MUST replace a card
    let nextPhase = drawnCard.value === 20 ? 'MUST_REPLACE' : 'REPLACE_OR_DISCARD';

    // TRIGGER BLACK HOLE (H)
    if (drawnCard.specialType === 'H') {
        nextPhase = 'RESOLVE_BLACK_HOLE';
    }

    return {
        ...gameState,
        drawPile: gameState.drawPile.slice(0, -1),
        drawnCard,
        turnPhase: nextPhase,
    };
};

/**
 * Resolve Black Hole effect (H)
 * Moves all discard pile cards back into draw pile (bottom)
 */
export const resolveBlackHole = (gameState) => {
    if (gameState.turnPhase !== 'RESOLVE_BLACK_HOLE') return gameState;

    const drawnCard = { ...gameState.drawnCard, isRevealed: true };
    const cardsFromDiscard = [...gameState.discardPile];
    const shuffledRecovered = shuffleDeck(cardsFromDiscard);

    // Put them UNDER the draw pile, INCLUDING the Black Hole card itself
    // so it never touches the discard pile
    const newDrawPile = [...shuffledRecovered, drawnCard, ...gameState.drawPile];

    const newState = {
        ...gameState,
        drawPile: newDrawPile,
        discardPile: [], // Empty discard
        drawnCard: null,
        turnPhase: 'DRAW' // Reset for endTurn consistency
    };

    return endTurn(newState);
};

/**
 * Take the top card from discard pile
 */
export const drawFromDiscard = (gameState) => {
    if (gameState.discardPile.length === 0) {
        throw new Error('Discard pile is empty');
    }

    const drawnCard = { ...gameState.discardPile[gameState.discardPile.length - 1] };

    // RULE: Cannot take an 'S' or 'H' card from the discard pile
    // (Actually 'H' should never be there, but we keep it for safety)
    if (drawnCard.specialType === 'S' || drawnCard.specialType === 'H') {
        throw new Error("Impossible de prendre cette carte spéciale dans la défausse !");
    }

    const nextPhase = drawnCard.specialType === 'H' ? 'RESOLVE_BLACK_HOLE' : 'MUST_REPLACE';

    return {
        ...gameState,
        discardPile: gameState.discardPile.slice(0, -1),
        drawnCard,
        turnPhase: nextPhase,
    };
};

/**
 * Replace a card in hand with the drawn card
 */
export const replaceCard = (gameState, cardIndex) => {
    const player = gameState.players[gameState.currentPlayerIndex];
    const targetCard = player.hand[cardIndex];

    // RULE: Cannot replace a locked card
    if (targetCard && targetCard.lockCount > 0) {
        throw new Error('Cette carte est verrouillée pour encore ' + targetCard.lockCount + ' rounds !');
    }

    if (!targetCard) {
        // Trying to replace an empty slot - allowed to fill holes
        const drawnCard = { ...gameState.drawnCard, isRevealed: true };

        // RULE: Cannot place an 'S' or 'H' card in hand (even in empty slot)
        if (drawnCard.specialType === 'S' || drawnCard.specialType === 'H') {
            throw new Error("Impossible de placer cette carte spéciale dans la grille ! Utilisez son action.");
        }

        if (drawnCard.value === 20) drawnCard.lockCount = 3;
        const newHand = [...player.hand];
        newHand[cardIndex] = drawnCard;
        const newPlayers = [...gameState.players];
        newPlayers[gameState.currentPlayerIndex] = { ...player, hand: newHand };

        const isS = drawnCard.specialType === 'S';
        const nextTurnPhase = isS ? 'SPECIAL_ACTION_SWAP' : 'DRAW';

        return {
            ...gameState,
            players: newPlayers,
            discardPile: [...gameState.discardPile],
            drawnCard: null,
            turnPhase: nextTurnPhase,
        };
    }

    const drawnCard = { ...gameState.drawnCard, isRevealed: true };

    // RULE: Cannot place an 'S' or 'H' card in hand
    if (drawnCard.specialType === 'S' || drawnCard.specialType === 'H') {
        throw new Error("Impossible de placer cette carte spéciale dans la grille ! Utilisez son action.");
    }

    const replacedCard = { ...targetCard, isRevealed: true, lockCount: 0 };

    // NEW RULE: If placing a 20, lock it for 3 rounds
    if (drawnCard.value === 20) {
        drawnCard.lockCount = 3;
    }

    const newHand = [...player.hand];
    newHand[cardIndex] = drawnCard;

    const newPlayers = [...gameState.players];
    newPlayers[gameState.currentPlayerIndex] = {
        ...player,
        hand: newHand,
    };

    const isS = drawnCard.specialType === 'S';
    const nextTurnPhase = isS ? 'SPECIAL_ACTION_SWAP' : 'DRAW';

    return {
        ...gameState,
        players: newPlayers,
        discardPile: [...gameState.discardPile, replacedCard],
        drawnCard: null,
        turnPhase: nextTurnPhase,
    };
};

/**
 * Play a drawn card as an action (specifically for 'S' Swap card)
 * This avoids revealing a card from the grid and "buries" the 'S' card.
 */
export const playActionCard = (gameState) => {
    const { drawnCard } = gameState;
    if (!drawnCard) return gameState;

    const isS = drawnCard.specialType === 'S';
    const nextPhase = isS ? 'SPECIAL_ACTION_SWAP' : 'DRAW';

    // "Bury" the card: put it at the start (bottom) of the discard pile 
    // instead of the end (top) so it's "invisible/consumed"
    const newDiscardPile = [{ ...drawnCard, isRevealed: true }, ...gameState.discardPile];

    return {
        ...gameState,
        discardPile: newDiscardPile,
        drawnCard: null,
        turnPhase: nextPhase,
    };
};

/**
 * Discard the drawn card and reveal one hidden card
 */
export const discardAndReveal = (gameState, cardIndex) => {
    // PROTECTION: Cannot discard if there is no drawn card
    if (!gameState.drawnCard) return gameState;

    const player = gameState.players[gameState.currentPlayerIndex];

    // RULE: Cannot discard a Black Hole (H)
    if (gameState.drawnCard?.specialType === 'H') {
        throw new Error("Impossible de défausser un Trou Noir ! Vous devez l'activer.");
    }

    // RULE: Cannot reveal a locked card
    if (player.hand[cardIndex] && player.hand[cardIndex].lockCount > 0) {
        throw new Error('Cette carte est verrouillée !');
    }

    if (!player.hand[cardIndex]) {
        throw new Error('Emplacement déjà vide');
    }

    if (player.hand[cardIndex].isRevealed) {
        throw new Error('Cette carte est déjà retournée');
    }

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

    const isS = gameState.drawnCard.specialType === 'S';
    const nextPhase = isS ? 'SPECIAL_ACTION_SWAP' : 'DRAW';

    // RULE: 'S' card is never visible in discard, bury it
    const newDiscardPile = isS
        ? [{ ...gameState.drawnCard, isRevealed: true }, ...gameState.discardPile]
        : [...gameState.discardPile, { ...gameState.drawnCard, isRevealed: true }];

    return {
        ...gameState,
        players: newPlayers,
        discardPile: newDiscardPile,
        drawnCard: null,
        turnPhase: nextPhase,
    };
};

/**
 * Check and remove completed columns (3 cards of same value)
 * Returns { gameState, removedCards } where removedCards is an array of cards
 * that were eliminated from columns (for adding to discard pile)
 */
export const checkAndRemoveColumns = (gameState) => {
    let allRemovedCards = [];

    const newPlayers = gameState.players.map(player => {
        const hand = [...player.hand];
        const cardsToRemove = new Set();
        const removedCardsFromPlayer = [];

        // 1. Check Columns (Standard)
        for (let col = 0; col < 4; col++) {
            const indices = [col * 3, col * 3 + 1, col * 3 + 2];
            const cards = indices.map(i => hand[i]);

            if (cards.every(c => c && c.isRevealed)) {
                // Logic for 'C' (Joker):
                // 3 cards match if:
                // - 0 'C': all 3 values must be identical
                // - 1 'C': the other 2 must be identical
                // - 2 'C' + 1 other: always a match
                // - 3 'C': always a match
                const hasC = cards.some(c => c && c.specialType === 'C');
                const nonCCards = cards.filter(c => c && c.specialType !== 'C');

                let isMatch = false;
                if (nonCCards.length <= 1) {
                    isMatch = true; // 2 or 3 'C' cards (or 2 'C' and 1 other card, or 1 'C' and 0 others if nulls were possible but they aren't here)
                } else if (nonCCards.length === 2) {
                    isMatch = nonCCards[0].value === nonCCards[1].value;
                } else {
                    isMatch = nonCCards[0].value === nonCCards[1].value && nonCCards[1].value === nonCCards[2].value;
                }

                if (isMatch) {
                    indices.forEach(i => cardsToRemove.add(i));
                    cards.forEach(c => removedCardsFromPlayer.push({ ...c, isRevealed: true }));
                }
            }
        }


        if (cardsToRemove.size > 0) {
            const newHand = hand.map((card, i) =>
                cardsToRemove.has(i) ? null : card
            );
            allRemovedCards = [...allRemovedCards, ...removedCardsFromPlayer];
            return { ...player, hand: newHand };
        }

        return player;
    });

    // RULE: Filter out 'S' cards from eliminated cards to bury them
    const normalEliminated = allRemovedCards.filter(c => c.specialType !== 'S');
    const swapEliminated = allRemovedCards.filter(c => c.specialType === 'S');

    // Bury 'S' cards at the bottom, others on top
    const newDiscardPile = [...swapEliminated, ...gameState.discardPile, ...normalEliminated];

    return {
        ...gameState,
        players: newPlayers,
        discardPile: newDiscardPile,
        lastEliminatedCards: allRemovedCards.length > 0 ? allRemovedCards : null,
        eliminationType: allRemovedCards.length > 0
            ? (allRemovedCards.length % 3 === 0 ? 'column' : 'mixed')
            : null
    };
};

/**
 * End current player's turn and move to next
 */
export const endTurn = (gameState) => {
    let newState = checkAndRemoveColumns(gameState);

    // DECREMENT LOCKS for ALL players (or just current? rule says "3 round")
    // If it's 3 rounds, it means 3 rotations of the table or 3 turns of the current player?
    // User says: "IA pioche 20 -> Je joue -> Elle peut pas échanger -> Je joue -> Elle peut pas échanger -> Je joue -> Elle peut échanger"
    // This looks like it counts every "round" (turn of anyone).
    // Let's decrement for the current player at the end of their turn.
    const currentPlayer = newState.players[newState.currentPlayerIndex];
    const updatedHand = currentPlayer.hand.map(card => {
        if (card && card.lockCount > 0) {
            return { ...card, lockCount: card.lockCount - 1 };
        }
        return card;
    });

    newState.players = [...newState.players];
    newState.players[newState.currentPlayerIndex] = { ...currentPlayer, hand: updatedHand };

    // Check if current player has revealed all cards
    // const currentPlayer = newState.players[newState.currentPlayerIndex]; // REMOVED (already declared above)
    const allRevealed = currentPlayer.hand.every(c => c === null || c.isRevealed);

    if (allRevealed && newState.phase === 'PLAYING') {
        newState = {
            ...newState,
            phase: 'FINAL_ROUND',
            finishingPlayerIndex: newState.currentPlayerIndex,
        };
    }

    // Move to next player ONLY IF we are not in a special action phase
    if (newState.turnPhase === 'SPECIAL_ACTION_SWAP') {
        return newState;
    }

    let nextPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length;

    // Check if game is finished (back to finishing player)
    if (newState.phase === 'FINAL_ROUND' && nextPlayerIndex === newState.finishingPlayerIndex) {
        return {
            ...newState,
            phase: 'FINISHED',
        };
    }

    return {
        ...newState,
        currentPlayerIndex: nextPlayerIndex,
        turnPhase: 'DRAW',
    };
};

/**
 * Handle card swap (Special card 'S')
 */
export const performSwap = (gameState, sourceCardIndex, targetPlayerIndex, targetCardIndex) => {
    if (gameState.turnPhase !== 'SPECIAL_ACTION_SWAP') {
        throw new Error('Not in swap phase');
    }

    const newState = { ...gameState };
    newState.players = [...gameState.players];

    const currentPlayer = newState.players[gameState.currentPlayerIndex];
    const targetPlayer = newState.players[targetPlayerIndex];

    const myCard = currentPlayer.hand[sourceCardIndex];
    const theirCard = targetPlayer.hand[targetCardIndex];

    // RULE: Cannot swap locked cards
    if ((myCard && myCard.lockCount > 0) || (theirCard && theirCard.lockCount > 0)) {
        throw new Error('Une des cartes est verrouillée !');
    }

    // Perform swap
    const myNewHand = [...currentPlayer.hand];
    const theirNewHand = [...targetPlayer.hand];

    // Re-lock 20s if swapped
    const cardFromMe = { ...myCard };
    if (cardFromMe.value === 20) cardFromMe.lockCount = 3;

    const cardFromThem = { ...theirCard };
    if (cardFromThem.value === 20) cardFromThem.lockCount = 3;

    myNewHand[sourceCardIndex] = cardFromThem;
    theirNewHand[targetCardIndex] = cardFromMe;

    newState.players[gameState.currentPlayerIndex] = { ...currentPlayer, hand: myNewHand };
    newState.players[targetPlayerIndex] = { ...targetPlayer, hand: theirNewHand };

    // Consume the 'S' card from discard or wherever it was? 
    // Actually, the 'S' card was already placed in the hand to TRIGGER the swap.
    // So the 'S' card IS one of the hand cards. 
    // Wait, if I place 'S' and then swap it, I lose 'S'. Perfect.

    newState.turnPhase = 'DRAW'; // Shift to DRAW for the next player will be handled by endTurn
    return endTurn(newState);
};

/**
 * Calculate score for a player's hand
 */
export const calculateHandScore = (hand, chestResults = {}) => {
    return hand.reduce((sum, card, index) => {
        if (card === null) return sum;

        // Handle chest cards (?)
        if (card.specialType === 'CH' || card.value === 'CH') {
            return sum + (chestResults[card.id] || 0);
        }

        // Handle undefined values - log a warning and treat as 0
        if (typeof card.value !== 'number' || isNaN(card.value)) {
            console.warn(`[SCORING BUG] Card at index ${index} has invalid value:`, card);
            return sum + 0; // Don't break the calculation
        }
        return sum + card.value;
    }, 0);
};

/**
 * Calculate final scores and determine winner
 */
export const calculateFinalScores = (gameState) => {
    const chestResults = gameState.chestResults || {};
    const scores = gameState.players.map((player, index) => {
        let score = calculateHandScore(player.hand, chestResults);

        // Penalty: if finisher doesn't have lowest score, double their score
        if (index === gameState.finishingPlayerIndex) {
            const otherScores = gameState.players
                .filter((_, i) => i !== index)
                .map(p => calculateHandScore(p.hand, chestResults));
            const lowestOther = Math.min(...otherScores);

            // Official rule: penalty only applies to POSITIVE scores
            if (score >= lowestOther && score > 0) {
                score *= 2;
            }
        }

        return {
            playerId: player.id,
            playerName: player.name,
            rawScore: calculateHandScore(player.hand, chestResults),
            finalScore: score,
            isFinisher: index === gameState.finishingPlayerIndex,
            penalized: index === gameState.finishingPlayerIndex && score !== calculateHandScore(player.hand, chestResults),
        };
    });

    return scores.sort((a, b) => a.finalScore - b.finalScore);
};

/**
 * Get valid actions for current game state
 */
export const getValidActions = (gameState) => {
    if (gameState.phase === 'INITIAL_REVEAL') {
        return { type: 'REVEAL_INITIAL', description: 'Révélez 2 cartes' };
    }

    if (gameState.phase === 'FINISHED') {
        return { type: 'GAME_OVER', description: 'Partie terminée' };
    }

    if (gameState.turnPhase === 'DRAW') {
        return {
            type: 'DRAW',
            description: 'Piochez une carte',
            options: ['DRAW_PILE', 'DISCARD_PILE'],
        };
    }

    if (gameState.turnPhase === 'MUST_REPLACE') {
        return {
            type: 'MUST_REPLACE',
            description: 'Remplacez une carte de votre main',
        };
    }

    if (gameState.turnPhase === 'REPLACE_OR_DISCARD') {
        return {
            type: 'REPLACE_OR_DISCARD',
            description: 'Remplacez une carte ou défaussez et retournez',
            options: ['REPLACE', 'DISCARD_AND_REVEAL'],
        };
    }

    return null;
};

/**
 * Generate deterministic results for chest cards
 * -15 or +15 based on seed and card ID
 */
export const generateChestResults = (gameState, seed) => {
    const chestResults = {};

    gameState.players.forEach(player => {
        player.hand.forEach(card => {
            if (card && (card.specialType === 'CH' || card.value === 'CH')) {
                // Deterministically result based on seed and cardId
                const uniqueSeed = `${seed}-${card.id}`;
                let hash = 0;
                for (let i = 0; i < uniqueSeed.length; i++) {
                    hash = (hash << 5) - hash + uniqueSeed.charCodeAt(i);
                    hash |= 0; // Convert to 32bit integer
                }
                const chestValue = Math.abs(hash) % 2 === 0 ? -15 : 15;
                chestResults[card.id] = chestValue;
            }
        });
    });

    return chestResults;
};

