/**
 * Skyjo AI Engine
 * Contains decision logic for AI players with 3 difficulty levels
 */

// Difficulty levels
export const AI_DIFFICULTY = {
    NORMAL: 'normal',
    HARD: 'hard',
    HARDCORE: 'hardcore',
    BONUS: 'bonus',
};

// AI player names (without emoji - emoji is set separately)
export const AI_NAMES = ['IA', 'IA 2', 'IA 3'];

/**
 * Check if the difficulty level is Hardcore or Bonus
 */
const isAdvancedLevel = (difficulty) => {
    return difficulty === AI_DIFFICULTY.HARDCORE || difficulty === AI_DIFFICULTY.BONUS;
};

/**
 * Structured AI logging
 */
const aiLog = (difficulty, message, data = null) => {
    const prefix = `[AI-${difficulty.toUpperCase()}]`;
    if (data) {
        console.log(`${prefix} ${message}`, data);
    } else {
        console.log(`${prefix} ${message}`);
    }
};

/**
 * Estimate the average value of cards remaining in the deck.
 */
const getProbabilisticAverageValue = (gameState) => {
    // Detect Bonus Mode by looking for 20s or special types in any player's hand or discard
    const allKnownCards = [
        ...gameState.players.flatMap(p => p.hand),
        ...gameState.discardPile,
        gameState.drawnCard
    ].filter(Boolean);

    const isBonusMode = allKnownCards.some(c => c.value === 20 || c.specialType === 'H' || c.specialType === 'S' || c.value === -10);

    let totalSum = isBonusMode ? 820 : 760;
    let totalCards = isBonusMode ? 156 : 150;

    // Subtract all revealed cards to find the remaining pool
    const seenCards = allKnownCards.filter(c => c.isRevealed);

    seenCards.forEach(c => {
        // S, H, C, CH are valued at 0 in engine for simplicity
        totalSum -= c.value;
        totalCards--;
    });

    if (totalCards <= 0) return isBonusMode ? 5.25 : 5.06;
    const ev = totalSum / totalCards;

    // Safety clamp (Skyjo average usually stays between 2 and 8)
    return Math.max(2, Math.min(8, ev));
};

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
 * Decision: Should the AI try to end the game quickly?
 */
const shouldAccelerateEndGame = (gameState, playerHand) => {
    const opponent = gameState.players.find(p => p.id === 'human-1') ||
        gameState.players[(gameState.currentPlayerIndex + 1) % gameState.players.length];

    if (!opponent) return true;

    const myScore = calculateVisibleScore(playerHand);
    const opponentScore = calculateVisibleScore(opponent.hand);

    // Strategy: Accelerate if leading, slow down if losing (unless forced)
    if (myScore < opponentScore - 5) return true; // Leading: rush it!
    if (myScore > opponentScore + 10) return false; // Losing: work on hand

    return true; // Default
};

/**
 * Calculate the score differential between AI and the human opponent.
 * positive = AI is winning (lower score)
 * negative = AI is losing
 */
const getScoreDifferential = (gameState, playerHand) => {
    const opponent = gameState.players.find(p => p.id === 'human-1') ||
        gameState.players[(gameState.currentPlayerIndex + 1) % gameState.players.length];
    if (!opponent) return 0;

    return calculateVisibleScore(opponent.hand) - calculateVisibleScore(playerHand);
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
        .map((card, idx) => (card && card.isRevealed && !(card.lockCount > 0) ? idx : -1))
        .filter(idx => idx !== -1);
};

/**
 * Find the highest value revealed card in a hand
 */
const findHighestRevealedCard = (hand) => {
    let maxValue = -Infinity;
    let maxIndex = -1;

    hand.forEach((card, idx) => {
        if (card && card.isRevealed && !(card.lockCount > 0) && card.value > maxValue) {
            maxValue = card.value;
            maxIndex = idx;
        }
    });

    return { index: maxIndex, value: maxValue };
};

/**
 * Check if placing a card at an index could complete a column
 * IMPORTANT: We should NOT try to complete columns of low/negative values
 * because eliminating 3x "-2" loses us -6 points!
 * 
 * @param {Array} hand - Player's hand
 * @param {number} cardIndex - Index where card would be placed
 * @param {number} cardValue - Value of the card being placed
 * @param {boolean} forceCheck - If true, skip value threshold check (for finding positions only)
 * @returns {boolean} True if column completion is beneficial
 */
const checkColumnPotential = (hand, cardIndex, cardValue, forceCheck = false, difficulty = 'normal') => {
    const col = Math.floor(cardIndex / 3);
    const colStart = col * 3;
    const colIndices = [colStart, colStart + 1, colStart + 2];

    const MIN_VALUE_FOR_COLUMN_ELIMINATION = 3;
    const isAdvanced = difficulty === AI_DIFFICULTY.HARDCORE || difficulty === AI_DIFFICULTY.BONUS;

    if (!forceCheck && cardValue < MIN_VALUE_FOR_COLUMN_ELIMINATION) {
        return false;
    }

    let matchCount = 0;
    let hiddenCount = 0;

    colIndices.forEach(idx => {
        if (idx === cardIndex) return;
        const card = hand[idx];
        if (card === null) return;
        if (!card.isRevealed) {
            hiddenCount++;
        } else if (card.value === cardValue) {
            matchCount++;
        }
    });

    // Case 1: Completion (3 cards of same value)
    if (matchCount === 2) {
        let currentTotal = cardValue;
        colIndices.forEach(idx => {
            if (idx === cardIndex) return;
            const card = hand[idx];
            if (card && card.isRevealed) currentTotal += card.value;
            else currentTotal += cardValue;
        });

        if (currentTotal > 0) return true;
        return false;
    }

    // Case 2: Potential (Waiting for 1 more card)
    if (matchCount === 1 && hiddenCount >= 1) {
        // STRATEGY REFINEMENT: In advanced mode, don't build potential with mediocre cards (5-9)
        // because it's better to keep searching for lower values.
        // We only build potential for cards <= 4.
        if (isAdvanced && cardValue > 4) {
            return false;
        }
        return true;
    }

    return false;
};

/**
 * Check if a card would significantly help the opponent (human)
 * (Blocking logic)
 */
const wouldHelpOpponent = (gameState, cardValue, difficulty = AI_DIFFICULTY.NORMAL) => {
    // Find first human player or next player
    const opponent = gameState.players.find(p => p.id === 'human-1') ||
        gameState.players[(gameState.currentPlayerIndex + 1) % gameState.players.length];

    if (!opponent) return false;

    // A card "helps" if it completes a column of value >= 3 (beneficial elimination)
    // or if it completes ANY column regardless of value if opponent is close to ending/winning
    for (let i = 0; i < opponent.hand.length; i++) {
        const card = opponent.hand[i];
        if (!card || card.lockCount > 0) continue;

        // Check if placing it here completes a column
        // We force check because column completion is usually good for opponent
        if (checkColumnPotential(opponent.hand, i, cardValue, true, difficulty)) {
            // If it's a revealed card we are replacing, make sure the elimination is profitable
            if (card.isRevealed) {
                // If the card being replaced is excellent (<= 2) and the elimination value 
                // is mediocre, maybe it's not a huge "help". But for now, let's keep it simple:
                // Elimination of >= 3 is always a target for blocking.
                if (cardValue >= 3) return true;
                // If opponent is winning, block even low value eliminations
                const opponentScore = calculateVisibleScore(opponent.hand);
                if (opponentScore < 20) return true;
            } else {
                // Replacing a hidden card to complete a column is always a huge help
                return true;
            }
        }
    }
    return false;
};

/**
 * Find the best replacement position for a card
 */
const findBestReplacementPosition = (hand, cardValue, difficulty, gameState = null) => {
    const revealedIndices = getRevealedCardIndices(hand);
    const hiddenIndices = getHiddenCardIndices(hand);

    // Risk adjustment: if losing badly, be more aggressive. If winning, be more conservative.
    let riskAdjustment = 0;
    let slowDown = false;
    if (gameState && isAdvancedLevel(difficulty)) {
        const diff = getScoreDifferential(gameState, hand);
        if (diff < -15) riskAdjustment = -2; // Losing: a 6 is now "worse", more likely to replace
        if (diff > 15) riskAdjustment = 2;   // Winning: a 4 is now "better", less likely to replace

        slowDown = !shouldAccelerateEndGame(gameState, hand);
    }

    // Check for column completion opportunities first
    for (const idx of [...revealedIndices, ...hiddenIndices]) {
        if (hand[idx] === null) continue;
        // RULE: Never replace a locked card
        if (hand[idx].lockCount > 0) continue;
        // CRITICAL FIX: Never replace a card with the same value (waste of turn)
        if (hand[idx].isRevealed && hand[idx].value === cardValue) continue;

        // SMART PROTECTION: Only skip if column completion is NOT possible or NOT profitable
        if (hand[idx].isRevealed && hand[idx].value <= 2) {
            if (!checkColumnPotential(hand, idx, cardValue, false, difficulty)) {
                continue;
            }
            // If checkColumnPotential returns true, it means it's a profitable elimination!
        }

        if (checkColumnPotential(hand, idx, cardValue, false, difficulty)) {
            // Prudent Finisher: only finish with a column completion if it's highly profitable
            if (slowDown && hiddenIndices.length === 1 && hiddenIndices.includes(idx)) {
                // If this is the last hidden card, only complete if total hand score is already low
                const currentScore = calculateVisibleScore(hand);
                if (currentScore > 20) {
                    aiLog(difficulty, "Prudent Finisher: Skipping game-ending column completion (score too high)");
                    continue;
                }
            }
            return idx;
        }
    }

    // MULTI-COLUMN STRATEGY (Lower priority than completion)
    if (isAdvancedLevel(difficulty) || difficulty === AI_DIFFICULTY.HARD) {
        const matchingRevealedCount = hand.filter(c => c && c.isRevealed && c.value === cardValue).length;

        if (matchingRevealedCount > 0 && hiddenIndices.length > 0) {
            // Find the best column to start the "collection"
            let bestExpansionIdx = -1;
            let maxPotential = -1;

            for (const idx of hiddenIndices) {
                const col = Math.floor(idx / 3);
                const colStart = col * 3;
                const colIndices = [colStart, colStart + 1, colStart + 2];
                const colCards = colIndices.map(i => hand[i]);

                // A column is good if it's mostly hidden or already has a matching card
                const revealedInCol = colCards.filter(c => c && c.isRevealed);
                const matchingInCol = revealedInCol.filter(c => c.value === cardValue);

                let potential = 0;
                if (matchingInCol.length > 0) potential = 10; // Already has it, keep filling!
                else if (revealedInCol.length === 0) potential = 5; // Fresh column
                else if (revealedInCol.length === 1 && revealedInCol[0].value > 8) potential = 2; // Can replace a bad card

                if (potential > maxPotential) {
                    maxPotential = potential;
                    bestExpansionIdx = idx;
                }
            }

            if (bestExpansionIdx !== -1) {
                aiLog(difficulty, `Expanding multi-column: collecting value ${cardValue} at index ${bestExpansionIdx}`);
                return bestExpansionIdx;
            }
        }
    }

    const highest = findHighestRevealedCard(hand);

    // SPECIAL LOGIC FOR 20 (Cursed Skull)
    if (cardValue === 20) {
        // 1. Try to replace any high revealed card first (10, 11, 12)
        // Since we MUST replace if we drawn a 20, replacing a 12 with a 20
        // is better than replacing a -10, as we hope to clear the column later.
        if (highest.index !== -1 && highest.value >= 10) {
            return highest.index;
        }

        // 2. Prefer replacing a hidden card to "start" a column for elimination
        // and avoid breaking known GOOD cards.
        if (hiddenIndices.length > 0) {
            // Prefer corners as usual
            const cornerIndices = [0, 2, 9, 11].filter(i => hiddenIndices.includes(i));
            if (cornerIndices.length > 0) return getRandomElement(cornerIndices);
            return getRandomElement(hiddenIndices);
        }

        // 3. Last resort: highest revealed card even if it's "okay" (like a 5)
        if (highest.index !== -1 && highest.value >= 5) {
            return highest.index;
        }
    }

    // EXCELLENT CARDS (<= 0)
    // Always replace highest revealed card if it's > cardValue, or reveal a hidden card
    if (cardValue <= 0) {
        // If we have a high revealed card (5+ for Hardcore/Hard), replace it
        if (highest.index !== -1 && highest.value >= 5) {
            return highest.index;
        }
        // Hardcore: Even if highest is low (e.g. 4), replacing with 0 is +4 diff, worth it
        if ((difficulty === AI_DIFFICULTY.HARDCORE || difficulty === AI_DIFFICULTY.BONUS) && highest.index !== -1 && highest.value > cardValue) {
            return highest.index;
        }

        // If no high cards revealed, still prefer replacing ANY revealed card that's worse
        if (highest.index !== -1 && cardValue < highest.value) {
            return highest.index;
        }
    }

    // GOOD CARDS (1-4)
    if (cardValue <= 4) {
        // Replace significantly worse card
        const threshold = cardValue + 4 + riskAdjustment;
        if (highest.index !== -1 && highest.value >= threshold) {
            return highest.index;
        }

        // Hard/Hardcore: Smart hidden card usage
        if (hiddenIndices.length > 0) {
            // Prudent Finisher: Don't reveal/replace last card if losing
            if (slowDown && hiddenIndices.length === 1) {
                // Try to find a revealed card to replace instead
                if (highest.index !== -1 && highest.value > cardValue) {
                    return highest.index;
                }
                aiLog(difficulty, "Prudent Finisher: Avoiding last card replacement (must slow down)");
                return -1;
            }

            if (difficulty === AI_DIFFICULTY.HARD || isAdvancedLevel(difficulty)) {
                // Prefer corners and edges for better column building
                const cornerIndices = [0, 2, 9, 11].filter(i => hiddenIndices.includes(i));
                if (cornerIndices.length > 0) {
                    return getRandomElement(cornerIndices);
                }
            }
            return getRandomElement(hiddenIndices);
        }
    }

    // MEDIOCRE/BAD CARDS (> 4)
    // Only replace if we have something TERRIBLE revealed (like a 12)
    const badThreshold = 10 + riskAdjustment;
    if (highest.index !== -1 && cardValue < highest.value && highest.value >= badThreshold) {
        return highest.index;
    }

    return -1; // Don't replace
};

// ============================================
// MAIN AI DECISION FUNCTIONS
// ============================================

/**
 * Choose 2 initial cards to reveal
 * Strategy: Random for normal, prefer same-column corners for hard/hardcore
 */
export const chooseInitialCardsToReveal = (hand, difficulty = AI_DIFFICULTY.NORMAL) => {
    // Normal: Random
    if (difficulty === AI_DIFFICULTY.NORMAL) {
        return getRandomIndices(2, hand.length);
    }

    // Advanced/Hardcore: Prefer same-column corners (0&2 or 9&11) 
    if (isAdvancedLevel(difficulty)) {
        const potentialPairs = [
            [0, 2], [9, 11], // Corners
            [3, 5], [6, 8], // Edges
        ];

        // Pick one pair randomly (mostly corners)
        const selectedPair = getRandomElement(potentialPairs.slice(0, 2));
        aiLog(difficulty, `Initial reveal: targeting column corners ${selectedPair}`);
        return selectedPair;
    }

    // Hard: prefer corner positions (legacy)
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

    // Normal: Take discard if value <= 4
    if (difficulty === AI_DIFFICULTY.NORMAL) {
        if (discardValue <= 4) {
            return 'DISCARD_PILE';
        }
        // Also take if it can complete a column
        const hand = currentPlayer.hand;
        for (let i = 0; i < hand.length; i++) {
            if (hand[i] && !(hand[i].lockCount > 0) && checkColumnPotential(hand, i, discardValue, false, difficulty)) {
                if (hand[i].isRevealed && hand[i].value === discardValue) continue;
                return 'DISCARD_PILE';
            }
        }
        return 'DRAW_PILE';
    }

    // Hard / Hardcore: Sophisticated analysis
    if (isAdvancedLevel(difficulty) || difficulty === AI_DIFFICULTY.HARD) {
        const avgValue = getProbabilisticAverageValue(gameState);

        // Always take negative cards or the Swap card
        if (discardValue <= 0 || discardTop.specialType === 'S') {
            return 'DISCARD_PILE';
        }

        // Hardcore/Bonus: Take from discard if it's excellent (<= 2)
        // OR if it completes a column. Otherwise, prefer drawing from the deck.
        if (discardValue <= 2) {
            const highest = findHighestRevealedCard(currentPlayer.hand);
            if (highest.value > discardValue + 2) {
                return 'DISCARD_PILE';
            }
            // Check column potential
            for (let i = 0; i < currentPlayer.hand.length; i++) {
                if (currentPlayer.hand[i] && checkColumnPotential(currentPlayer.hand, i, discardValue, false, difficulty)) {
                    // Don't replace a GOOD card with a worse card even if it helps potential
                    if (currentPlayer.hand[i].isRevealed && currentPlayer.hand[i].value < discardValue && currentPlayer.hand[i].value <= 2) continue;
                    return 'DISCARD_PILE';
                }
            }
        }

        // Check for column completion (Primary strat for Hardcore)
        for (let i = 0; i < currentPlayer.hand.length; i++) {
            if (currentPlayer.hand[i] && !(currentPlayer.hand[i].lockCount > 0) && checkColumnPotential(currentPlayer.hand, i, discardValue, false, difficulty)) {
                // Fix: Don't take from discard if we would just replace same value
                if (currentPlayer.hand[i].isRevealed && currentPlayer.hand[i].value === discardValue) continue;

                // PROTECTION: Don't replace a GOOD revealed card (<= 2) for a column completion of a WORSE card
                if (currentPlayer.hand[i].isRevealed && currentPlayer.hand[i].value < discardValue && currentPlayer.hand[i].value <= 2) continue;

                return 'DISCARD_PILE';
            }
        }

        // ANTICIPATION: Denial Strategy (Block the opponent)
        // If the discard would give a huge benefit to the opponent, take it even if it's mediocre for us
        if (wouldHelpOpponent(gameState, discardValue, difficulty)) {
            // Only block if our own hand isn't already "perfect" (avoid taking high card if we are winning)
            const myHighest = findHighestRevealedCard(currentPlayer.hand);
            if (myHighest.value >= discardValue) {
                aiLog(difficulty, `Blocking opponent by taking ${discardValue} from discard!`);
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
    if (!drawnCard) return { action: 'DISCARD_AND_REVEAL', cardIndex: 0 }; // Fallback

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const hand = currentPlayer.hand;

    let drawnValue = drawnCard.value;

    // Treat Special Cards differently for evaluation
    if (drawnCard.specialType === 'S') {
        // AI Strategy for Swap card: 
        // If we have any bad revealed cards (> 8), definitely use the swap!
        const badRevealed = hand.some(c => c && c.isRevealed && c.value > 8);
        if (badRevealed || difficulty === AI_DIFFICULTY.BONUS) {
            // Pick a dummy index for revelation (won't be used if store calls playActionCard)
            const hidden = getHiddenCardIndices(hand);
            const revealIdx = hidden.length > 0 ? hidden[0] : 0;
            return { action: 'DISCARD_AND_REVEAL', cardIndex: revealIdx };
        }
    }

    if (drawnCard.specialType === 'C') drawnValue = 0;   // Value it like a zero

    // BLACK HOLE (H)
    if (drawnCard.specialType === 'H') {
        // AI Strategy for Black Hole: Always use it (it targets turn end anyway)
        const hidden = getHiddenCardIndices(hand);
        const revealIdx = hidden.length > 0 ? hidden[0] : 0;
        return { action: 'DISCARD_AND_REVEAL', cardIndex: revealIdx };
    }

    // BONUS MODE RULE: Forced replacement if drawn card is 20
    if (difficulty === AI_DIFFICULTY.BONUS && drawnValue === 20) {
        const replaceIndex = findBestReplacementPosition(hand, 20, difficulty, gameState);
        if (replaceIndex !== -1) {
            return { action: 'REPLACE', cardIndex: replaceIndex };
        }

        // Fallback if findBestReplacementPosition somehow failed or didn't want to replace
        // We MUST find a non-locked card.
        const validIndices = hand.map((c, i) => (c !== null && !(c.lockCount > 0)) ? i : -1).filter(i => i !== -1);

        // Pick the absolute worst card to replace with a 20 (highest value)
        let worstIdx = validIndices[0];
        let maxVal = -Infinity;
        validIndices.forEach(idx => {
            const card = hand[idx];
            if (card && card.isRevealed && card.value > maxVal) {
                maxVal = card.value;
                worstIdx = idx;
            }
        });

        return { action: 'REPLACE', cardIndex: worstIdx };
    }

    // If came from discard, MUST replace
    if (gameState.turnPhase === 'MUST_REPLACE') {
        const replaceIndex = findBestReplacementPosition(hand, drawnValue, difficulty, gameState);
        // If no good position found, just replace a random card (should rarely happen for AI)
        // CRITICAL: Must not pick a locked card
        const finalIndex = replaceIndex !== -1 ? replaceIndex : getRandomElement(
            hand.map((c, i) => (c !== null && !(c.lockCount > 0)) ? i : -1).filter(i => i !== -1)
        );
        return { action: 'REPLACE', cardIndex: finalIndex };
    }

    // Normal: Strategic decision
    if (difficulty === AI_DIFFICULTY.NORMAL) {
        const replaceIndex = findBestReplacementPosition(hand, drawnValue, difficulty, gameState);
        if (drawnValue <= 3 && replaceIndex !== -1) {
            return { action: 'REPLACE', cardIndex: replaceIndex };
        }
        const highest = findHighestRevealedCard(hand);
        if (highest.index !== -1 && drawnValue < highest.value - 2) {
            return { action: 'REPLACE', cardIndex: highest.index };
        }
        // Default: discard and reveal
        const hiddenIndices = getHiddenCardIndices(hand);
        if (hiddenIndices.length > 0) {
            return { action: 'DISCARD_AND_REVEAL', cardIndex: getRandomElement(hiddenIndices) };
        }
    }

    // Hard / Hardcore
    const replaceIndex = findBestReplacementPosition(hand, drawnValue, difficulty, gameState);

    // 1. Column Completion (Highest Priority)
    // Check if this card completes a column
    // (Handled inside findBestReplacementPosition, but verified here)
    if (replaceIndex !== -1 && checkColumnPotential(hand, replaceIndex, drawnValue)) {
        return { action: 'REPLACE', cardIndex: replaceIndex };
    }

    // 2. Good Card Strategy
    // Hardcore: Always keep cards <= 4 if they improve the board
    const goodCardThreshold = (difficulty === AI_DIFFICULTY.HARDCORE || difficulty === AI_DIFFICULTY.BONUS) ? 4 : 3;
    if (drawnValue <= goodCardThreshold && replaceIndex !== -1) {
        return { action: 'REPLACE', cardIndex: replaceIndex };
    }

    // 3. High Card Replacement
    const highest = findHighestRevealedCard(hand);
    if (highest.index !== -1 && drawnValue < highest.value) {
        // Hardcore: Strict improvement
        return { action: 'REPLACE', cardIndex: highest.index };
    }

    // 4. ANTICIPATION: Denial Strategy (Block the opponent)
    // If the drawn card would help the opponent, replace our worst revealed card with it
    // instead of discarding it (which gives it to them!)
    if (isAdvancedLevel(difficulty) && wouldHelpOpponent(gameState, drawnValue)) {
        if (highest.index !== -1 && highest.value >= drawnValue) {
            aiLog(difficulty, `Preventing opponent from getting ${drawnValue} by keeping it!`);
            return { action: 'REPLACE', cardIndex: highest.index };
        }
    }

    // 4. Bad/Mediocre Card -> Discard & Reveal Strategy
    const hiddenIndices = getHiddenCardIndices(hand);
    if (hiddenIndices.length > 0) {
        // Hardcore/Hard: Target specific hidden cards to reveal

        let bestHiddenIdx = hiddenIndices[0];
        let bestScore = -Infinity;

        for (const idx of hiddenIndices) {
            const col = Math.floor(idx / 3);
            const colStart = col * 3;
            const colIndices = [colStart, colStart + 1, colStart + 2];

            // Score based on column potential
            let score = 0;
            const revealedVals = colIndices
                .filter(i => i !== idx && hand[i] && hand[i].isRevealed)
                .map(i => hand[i].value);

            // Hardcore Logic:
            // - If column has 2 identical revealed cards: +20 (Try for Skyjo)
            // - If column has 1 revealed card: +5 (Start building)
            // - If column has 0 revealed cards: +1 (Explore)

            if (revealedVals.length === 2 && revealedVals[0] === revealedVals[1]) {
                score = 20;
            } else if (revealedVals.length === 1) {
                // Hardcore: Prefer columns where the revealed card is GOOD
                if ((difficulty === AI_DIFFICULTY.HARDCORE || difficulty === AI_DIFFICULTY.BONUS) && revealedVals[0] <= 4) {
                    score = 8;
                } else {
                    score = 5;
                }
            } else {
                score = 1;
            }

            // Hardcore: Avoid revealing the last card if we are behind
            if (isAdvancedLevel(difficulty) && hiddenIndices.length === 1) {
                if (!shouldAccelerateEndGame(gameState, hand)) {
                    aiLog(difficulty, "Prudent Finisher: avoiding last card revelation (score differential is bad)");
                    score = -100; // Even heavier penalty
                } else {
                    score = 20; // Encouraged if leading
                }
            }

            if (score > bestScore) {
                bestScore = score;
                bestHiddenIdx = idx;
            }
        }

        // Add some randomness only for Normal (not reached here technically due to if block above)
        // Hardcore is deterministic in its "best" choice
        return { action: 'DISCARD_AND_REVEAL', cardIndex: bestHiddenIdx };
    }

    // No hidden cards left, must replace (Last Resort)
    const validIndices = hand.map((c, i) => (c !== null && !(c.lockCount > 0)) ? i : -1).filter(i => i !== -1);
    // Try to minimize damage
    let bestIdx = validIndices[0];
    let minDiff = Infinity; // We want minimum (new - old) which is negative or small positive
    // Actually we want to replace the card where (drawn - current) is minimized?
    // No, we want to replace the HIGHEST value card to minimize total score.

    // We already checked "highest" above. If we are here, drawnValue >= highest.value.
    // So we just replace the highest value card to minimize the GAIN.
    bestIdx = findHighestRevealedCard(hand).index;
    if (bestIdx === -1) bestIdx = validIndices[0];

    // Final safety: if for some reason we still have -1 or a locked card (should be impossible)
    if (bestIdx === -1) {
        // Fallback to any non-null, non-locked card
        const fallbackIdx = hand.findIndex(c => c !== null && !(c.lockCount > 0));
        bestIdx = fallbackIdx !== -1 ? fallbackIdx : 0;
    }

    return { action: 'REPLACE', cardIndex: bestIdx };
};

/**
 * Decide which cards to swap (Special card 'S')
 */
export const decideSwapAction = (gameState) => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    // Find next player (human-1 if available, otherwise next in order)
    const opponent = gameState.players.find(p => p.id === 'human-1') ||
        gameState.players[(gameState.currentPlayerIndex + 1) % gameState.players.length];
    const opponentIndex = gameState.players.findIndex(p => p.id === opponent.id);

    const difficulty = gameState.aiDifficulty || AI_DIFFICULTY.NORMAL;
    const avgValue = getProbabilisticAverageValue(gameState);

    // 1. Find my worst card
    const myHidden = getHiddenCardIndices(currentPlayer.hand);
    let worstMyIndex = -1;
    let worstMyValue = -Infinity;

    const myHighest = findHighestRevealedCard(currentPlayer.hand);
    if (myHighest.index !== -1) {
        worstMyIndex = myHighest.index;
        worstMyValue = myHighest.value;
    }

    // 2. Find their best revealed card
    let bestTheirIndex = -1;
    let bestTheirValue = Infinity;
    opponent.hand.forEach((card, idx) => {
        if (card && card.isRevealed && !(card.lockCount > 0) && card.value < bestTheirValue) {
            bestTheirValue = card.value;
            bestTheirIndex = idx;
        }
    });

    // 3. EV Decision Logic
    if (isAdvancedLevel(difficulty)) {
        // Option A: Swap my worst revealed for their best revealed
        // Option B: Swap a hidden (EV ~5.3) for their best revealed

        // If my worst revealed is actually better than the average hidden card, 
        // swap a hidden card instead IF the target is excellent.
        if (myHidden.length > 0 && (worstMyIndex === -1 || worstMyValue <= avgValue)) {
            // Target must be better than average to risk a hidden swap
            if (bestTheirValue <= -1) {
                worstMyIndex = getRandomElement(myHidden);
                aiLog(difficulty, `EV Decided: Swapping hidden card for opponent's ${bestTheirValue}`);
            }
        }

        // If opponent has no good revealed cards, pick a hidden one
        if (bestTheirIndex === -1 || bestTheirValue > avgValue) {
            const theirHidden = getHiddenCardIndices(opponent.hand);
            if (theirHidden.length > 0) {
                bestTheirIndex = getRandomElement(theirHidden);
                aiLog(difficulty, `EV Decided: Picking opponent's hidden card (no good revealed available)`);
            }
        }
    }

    // Final Fallbacks
    if (worstMyIndex === -1) {
        worstMyIndex = myHidden.length > 0 ? getRandomElement(myHidden) : 0;
    }
    if (bestTheirIndex === -1) {
        const theirHidden = getHiddenCardIndices(opponent.hand);
        bestTheirIndex = theirHidden.length > 0 ? getRandomElement(theirHidden) : 0;
    }

    return {
        sourceCardIndex: worstMyIndex,
        targetPlayerIndex: opponentIndex,
        targetCardIndex: bestTheirIndex
    };
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

    // Special Action: Swap
    if (turnPhase === 'SPECIAL_ACTION_SWAP') {
        const swapDecision = decideSwapAction(gameState);
        actions.push({
            type: 'PERFORM_SWAP',
            ...swapDecision
        });
        return actions;
    }

    // Special Action: Black Hole
    if (turnPhase === 'RESOLVE_BLACK_HOLE') {
        actions.push({
            type: 'ACTIVATE_BLACK_HOLE'
        });
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
