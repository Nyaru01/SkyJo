/**
 * Skyjo AI Engine
 * Contains decision logic for AI players with 3 difficulty levels
 */

// Difficulty levels
export const AI_DIFFICULTY = {
    EASY: 'easy',
    NORMAL: 'normal',
    HARD: 'hard',
};

// AI player names
export const AI_NAMES = ['🤖 Bot Alpha', '🤖 Bot Beta', '🤖 Bot Gamma'];

/**
 * Get a random element from an array
 */
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Get random indices from an array
 */
const getRandomIndices = (count, max) => {
    const indices = [];
    while (indices.length < count) {
        const idx = Math.floor(Math.random() * max);
        if (!indices.includes(idx)) {
            indices.push(idx);
        }
    }
    return indices;
};

/**
 * Calculate the visible score of a hand (only revealed cards)
 */
const calculateVisibleScore = (hand) => {
    return hand.reduce((sum, card) => {
        if (card === null) return sum;
        if (!card.isRevealed) return sum;
        return sum + card.value;
    }, 0);
};

/**
 * Get indices of hidden cards in a hand
 */
const getHiddenCardIndices = (hand) => {
    return hand
        .map((card, idx) => (card && !card.isRevealed ? idx : -1))
        .filter(idx => idx !== -1);
};

/**
 * Get indices of revealed cards in a hand
 */
const getRevealedCardIndices = (hand) => {
    return hand
        .map((card, idx) => (card && card.isRevealed ? idx : -1))
        .filter(idx => idx !== -1);
};

/**
 * Find the highest value revealed card in a hand
 */
const findHighestRevealedCard = (hand) => {
    let maxValue = -Infinity;
    let maxIndex = -1;

    hand.forEach((card, idx) => {
        if (card && card.isRevealed && card.value > maxValue) {
            maxValue = card.value;
            maxIndex = idx;
        }
    });

    return { index: maxIndex, value: maxValue };
};

/**
 * Check if placing a card at an index could complete a column
 */
const checkColumnPotential = (hand, cardIndex, cardValue) => {
    // Cards are arranged in 4 columns of 3 rows
    // Column indices: [0,1,2], [3,4,5], [6,7,8], [9,10,11]
    const col = Math.floor(cardIndex / 3);
    const colStart = col * 3;
    const colIndices = [colStart, colStart + 1, colStart + 2];

    let matchCount = 0;
    let hiddenCount = 0;

    colIndices.forEach(idx => {
        if (idx === cardIndex) return; // Skip the target position
        const card = hand[idx];
        if (card === null) return;
        if (!card.isRevealed) {
            hiddenCount++;
        } else if (card.value === cardValue) {
            matchCount++;
        }
    });

    // Return true if completing the column (2 matches) or high potential (1 match + 1 hidden)
    return matchCount === 2 || (matchCount === 1 && hiddenCount >= 1);
};

/**
 * Find the best replacement position for a card
 */
const findBestReplacementPosition = (hand, cardValue, difficulty) => {
    const revealedIndices = getRevealedCardIndices(hand);
    const hiddenIndices = getHiddenCardIndices(hand);

    // Check for column completion opportunities first
    for (const idx of [...revealedIndices, ...hiddenIndices]) {
        if (hand[idx] === null) continue;
        if (checkColumnPotential(hand, idx, cardValue)) {
            return idx;
        }
    }

    // For good cards (low value), prefer replacing hidden cards
    if (cardValue <= 3) {
        if (hiddenIndices.length > 0) {
            // In hard mode, try to find hidden cards in promising columns
            if (difficulty === AI_DIFFICULTY.HARD) {
                // Prefer corners and edges for better column building
                const cornerIndices = [0, 2, 9, 11].filter(i => hiddenIndices.includes(i));
                if (cornerIndices.length > 0) {
                    return getRandomElement(cornerIndices);
                }
            }
            return getRandomElement(hiddenIndices);
        }
    }

    // For neutral/bad cards, replace the highest revealed card if worse
    const highest = findHighestRevealedCard(hand);
    if (highest.index !== -1 && cardValue < highest.value) {
        return highest.index;
    }

    // If card is bad but better than nothing, may still want a hidden spot
    if (hiddenIndices.length > 0 && cardValue <= 6) {
        return getRandomElement(hiddenIndices);
    }

    return -1; // Don't replace
};

// ============================================
// MAIN AI DECISION FUNCTIONS
// ============================================

/**
 * Choose 2 initial cards to reveal
 * Strategy: Random for easy, prefer corners for normal/hard
 */
export const chooseInitialCardsToReveal = (hand, difficulty = AI_DIFFICULTY.NORMAL) => {
    if (difficulty === AI_DIFFICULTY.EASY) {
        return getRandomIndices(2, hand.length);
    }

    // For Normal/Hard: prefer corner positions (better for column building visibility)
    const preferredPositions = [0, 2, 9, 11]; // Corners
    const shuffled = [...preferredPositions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2);
};

/**
 * Decide whether to draw from pile or discard
 */
export const decideDrawSource = (gameState, difficulty = AI_DIFFICULTY.NORMAL) => {
    const discardTop = gameState.discardPile[gameState.discardPile.length - 1];
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    if (!discardTop) {
        return 'DRAW_PILE';
    }

    const discardValue = discardTop.value;

    // Easy: 50% random
    if (difficulty === AI_DIFFICULTY.EASY) {
        if (Math.random() < 0.5) {
            return Math.random() < 0.5 ? 'DRAW_PILE' : 'DISCARD_PILE';
        }
    }

    // Normal: Take discard if value <= 4
    if (difficulty === AI_DIFFICULTY.NORMAL) {
        if (discardValue <= 4) {
            return 'DISCARD_PILE';
        }
        // Also take if it can complete a column
        const hand = currentPlayer.hand;
        for (let i = 0; i < hand.length; i++) {
            if (hand[i] && checkColumnPotential(hand, i, discardValue)) {
                return 'DISCARD_PILE';
            }
        }
        return 'DRAW_PILE';
    }

    // Hard: More sophisticated analysis
    if (difficulty === AI_DIFFICULTY.HARD) {
        // Take negative cards always
        if (discardValue <= 0) {
            return 'DISCARD_PILE';
        }

        // Take low cards if they can replace high cards or complete columns
        if (discardValue <= 3) {
            const highest = findHighestRevealedCard(currentPlayer.hand);
            if (highest.value > discardValue + 3) {
                return 'DISCARD_PILE';
            }
            // Check column potential
            for (let i = 0; i < currentPlayer.hand.length; i++) {
                if (currentPlayer.hand[i] && checkColumnPotential(currentPlayer.hand, i, discardValue)) {
                    return 'DISCARD_PILE';
                }
            }
        }

        // Check if discard could complete a column
        for (let i = 0; i < currentPlayer.hand.length; i++) {
            if (currentPlayer.hand[i] && checkColumnPotential(currentPlayer.hand, i, discardValue)) {
                return 'DISCARD_PILE';
            }
        }

        return 'DRAW_PILE';
    }

    return 'DRAW_PILE';
};

/**
 * Decide what to do with a drawn card (replace or discard+reveal)
 * Returns: { action: 'REPLACE' | 'DISCARD_AND_REVEAL', cardIndex: number }
 */
export const decideCardAction = (gameState, difficulty = AI_DIFFICULTY.NORMAL) => {
    const drawnCard = gameState.drawnCard;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const hand = currentPlayer.hand;
    const drawnValue = drawnCard.value;

    // If came from discard, MUST replace
    if (gameState.turnPhase === 'MUST_REPLACE') {
        const replaceIndex = findBestReplacementPosition(hand, drawnValue, difficulty);
        // If no good position found, just replace a random card
        const finalIndex = replaceIndex !== -1 ? replaceIndex : getRandomElement(
            hand.map((c, i) => c !== null ? i : -1).filter(i => i !== -1)
        );
        return { action: 'REPLACE', cardIndex: finalIndex };
    }

    // Easy: Random decision
    if (difficulty === AI_DIFFICULTY.EASY) {
        const shouldReplace = Math.random() < 0.6;
        if (shouldReplace) {
            const validIndices = hand.map((c, i) => c !== null ? i : -1).filter(i => i !== -1);
            return { action: 'REPLACE', cardIndex: getRandomElement(validIndices) };
        } else {
            const hiddenIndices = getHiddenCardIndices(hand);
            if (hiddenIndices.length > 0) {
                return { action: 'DISCARD_AND_REVEAL', cardIndex: getRandomElement(hiddenIndices) };
            }
            // No hidden cards, must replace
            const validIndices = hand.map((c, i) => c !== null ? i : -1).filter(i => i !== -1);
            return { action: 'REPLACE', cardIndex: getRandomElement(validIndices) };
        }
    }

    // Normal/Hard: Strategic decision
    const replaceIndex = findBestReplacementPosition(hand, drawnValue, difficulty);

    // Good card (low value) - definitely replace something
    if (drawnValue <= 3 && replaceIndex !== -1) {
        return { action: 'REPLACE', cardIndex: replaceIndex };
    }

    // Check if we can improve by replacing highest card
    const highest = findHighestRevealedCard(hand);
    if (highest.index !== -1 && drawnValue < highest.value - 2) {
        return { action: 'REPLACE', cardIndex: highest.index };
    }

    // Bad card (high value) - discard and reveal
    if (drawnValue >= 8) {
        const hiddenIndices = getHiddenCardIndices(hand);
        if (hiddenIndices.length > 0) {
            // In hard mode, prefer revealing cards that might help build columns
            if (difficulty === AI_DIFFICULTY.HARD) {
                // Check which hidden card is in the most promising column
                let bestHiddenIdx = hiddenIndices[0];
                let bestScore = -Infinity;

                for (const idx of hiddenIndices) {
                    const col = Math.floor(idx / 3);
                    const colStart = col * 3;
                    const colIndices = [colStart, colStart + 1, colStart + 2];

                    // Score based on how many revealed cards with same value in column
                    let score = 0;
                    const revealedVals = colIndices
                        .filter(i => i !== idx && hand[i] && hand[i].isRevealed)
                        .map(i => hand[i].value);

                    if (revealedVals.length === 2 && revealedVals[0] === revealedVals[1]) {
                        score = 10; // High chance for column completion
                    }

                    if (score > bestScore) {
                        bestScore = score;
                        bestHiddenIdx = idx;
                    }
                }

                return { action: 'DISCARD_AND_REVEAL', cardIndex: bestHiddenIdx };
            }

            return { action: 'DISCARD_AND_REVEAL', cardIndex: getRandomElement(hiddenIndices) };
        }
    }

    // Medium card - replace if we found a good spot, otherwise discard
    if (replaceIndex !== -1) {
        return { action: 'REPLACE', cardIndex: replaceIndex };
    }

    // Default: discard and reveal
    const hiddenIndices = getHiddenCardIndices(hand);
    if (hiddenIndices.length > 0) {
        return { action: 'DISCARD_AND_REVEAL', cardIndex: getRandomElement(hiddenIndices) };
    }

    // No hidden cards left, must replace
    const validIndices = hand.map((c, i) => c !== null ? i : -1).filter(i => i !== -1);
    return { action: 'REPLACE', cardIndex: getRandomElement(validIndices) };
};

/**
 * Execute a complete AI turn
 * Returns an array of actions to be executed with delays
 */
export const planAITurn = (gameState, difficulty = AI_DIFFICULTY.NORMAL) => {
    const actions = [];
    const phase = gameState.phase;
    const turnPhase = gameState.turnPhase;

    // Initial reveal phase
    if (phase === 'INITIAL_REVEAL') {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        const revealedCount = currentPlayer.hand.filter(c => c && c.isRevealed).length;

        if (revealedCount < 2) {
            const cardsToReveal = chooseInitialCardsToReveal(currentPlayer.hand, difficulty);
            actions.push({
                type: 'REVEAL_INITIAL',
                cardIndices: cardsToReveal,
            });
        }
        return actions;
    }

    // Playing/Final round phase
    if (phase === 'PLAYING' || phase === 'FINAL_ROUND') {
        if (turnPhase === 'DRAW') {
            // Step 1: Decide draw source
            const drawSource = decideDrawSource(gameState, difficulty);
            actions.push({
                type: 'DRAW',
                source: drawSource,
            });

            // We'll need to return here and let the store update
            // The next action will be decided after drawing
            return actions;
        }

        if (turnPhase === 'REPLACE_OR_DISCARD' || turnPhase === 'MUST_REPLACE') {
            // Step 2: Decide what to do with drawn card
            const decision = decideCardAction(gameState, difficulty);
            actions.push({
                type: decision.action,
                cardIndex: decision.cardIndex,
            });
            return actions;
        }
    }

    return actions;
};
