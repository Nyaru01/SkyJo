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
const checkColumnPotential = (hand, cardIndex, cardValue, forceCheck = false) => {
    // Cards are arranged in 4 columns of 3 rows
    // Column indices: [0,1,2], [3,4,5], [6,7,8], [9,10,11]
    const col = Math.floor(cardIndex / 3);
    const colStart = col * 3;
    const colIndices = [colStart, colStart + 1, colStart + 2];

    // CRITICAL FIX: Don't try to complete columns with low/negative values!
    // Eliminating 3x "-2" = losing -6 points (bad!)
    // Eliminating 3x "0" = losing 0 points but removing 3 cards (neutral, but wastes opportunity)
    // Eliminating 3x "1" or "2" = marginal benefit (only 3-6 points saved)
    // Only actively pursue column completion for cards with value > 2
    const MIN_VALUE_FOR_COLUMN_ELIMINATION = 3;

    if (!forceCheck && cardValue < MIN_VALUE_FOR_COLUMN_ELIMINATION) {
        return false; // Don't prioritize completing columns of low-value cards
    }

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
 * Check if a card would significantly help the opponent (human)
 * (Blocking logic)
 */
const wouldHelpOpponent = (gameState, cardValue) => {
    // Find first human player or next player
    const opponent = gameState.players.find(p => p.id === 'human-1') ||
        gameState.players[(gameState.currentPlayerIndex + 1) % gameState.players.length];

    if (!opponent) return false;

    // A card "helps" if it completes a column of value >= 3 (beneficial elimination)
    // or if it completes ANY column regardless of value if opponent is close to ending/winning
    for (let i = 0; i < opponent.hand.length; i++) {
        if (opponent.hand[i] && !opponent.hand[i].isRevealed) {
            // Check if placing it here completes a column
            // We force check because even if it's a low value, completion is usually good for opponent
            if (checkColumnPotential(opponent.hand, i, cardValue, true)) {
                return true;
            }
        }
    }
    return false;
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
        // RULE: Never replace a locked card
        if (hand[idx].lockCount > 0) continue;
        // CRITICAL FIX: Never replace a card with the same value (waste of turn)
        if (hand[idx].isRevealed && hand[idx].value === cardValue) continue;

        // PROTECTION: Don't replace a GOOD revealed card (<= 2) for a column completion of a WORSE card
        // (Replacing a -10 with a 4 to complete a column of 4s is a net loss)
        if (hand[idx].isRevealed && hand[idx].value < cardValue && hand[idx].value <= 2) continue;

        if (checkColumnPotential(hand, idx, cardValue)) {
            return idx;
        }
    }

    // MULTI-COLUMN STRATEGY: Favor values already present on the board to prepare future columns
    if (difficulty === AI_DIFFICULTY.HARD || difficulty === AI_DIFFICULTY.HARDCORE || difficulty === AI_DIFFICULTY.BONUS) {
        const otherRevealedValues = hand
            .filter(c => c && c.isRevealed && c.value === cardValue)
            .length;

        if (otherRevealedValues > 0 && hiddenIndices.length > 0) {
            // We have this value elsewhere, let's start a new column with it
            // if we have hidden cards to explore.
            const bestHidden = getRandomElement(hiddenIndices);
            return bestHidden;
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
        if (highest.index !== -1 && highest.value >= cardValue + 4) {
            return highest.index;
        }

        // Hard/Hardcore: Smart hidden card usage
        if (hiddenIndices.length > 0) {
            if (difficulty === AI_DIFFICULTY.HARD || difficulty === AI_DIFFICULTY.HARDCORE || difficulty === AI_DIFFICULTY.BONUS) {
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
    if (highest.index !== -1 && cardValue < highest.value && highest.value >= 10) {
        return highest.index;
    }

    return -1; // Don't replace
};

// ============================================
// MAIN AI DECISION FUNCTIONS
// ============================================

/**
 * Choose 2 initial cards to reveal
 * Strategy: Random for normal, prefer corners for hard/hardcore
 */
export const chooseInitialCardsToReveal = (hand, difficulty = AI_DIFFICULTY.NORMAL) => {
    // Normal: Random
    if (difficulty === AI_DIFFICULTY.NORMAL) {
        return getRandomIndices(2, hand.length);
    }

    // Hard/Hardcore: prefer corner positions (better for column building visibility)
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
            if (hand[i] && !(hand[i].lockCount > 0) && checkColumnPotential(hand, i, discardValue)) {
                if (hand[i].isRevealed && hand[i].value === discardValue) continue;
                return 'DISCARD_PILE';
            }
        }
        return 'DRAW_PILE';
    }

    // Hard / Hardcore: Sophisticated analysis
    if (difficulty === AI_DIFFICULTY.HARD || difficulty === AI_DIFFICULTY.HARDCORE || difficulty === AI_DIFFICULTY.BONUS) {
        // Always take negative cards or the Swap card
        if (discardValue <= 0 || discardTop.specialType === 'S') {
            return 'DISCARD_PILE';
        }

        // Hardcore: Aggressively take low cards (<= 4)
        const threshold = (difficulty === AI_DIFFICULTY.HARDCORE || difficulty === AI_DIFFICULTY.BONUS) ? 4 : 3;

        if (discardValue <= threshold) {
            const highest = findHighestRevealedCard(currentPlayer.hand);
            if (highest.value > discardValue + 2) { // Tighter threshold for swap
                return 'DISCARD_PILE';
            }
            // Check column potential
            for (let i = 0; i < currentPlayer.hand.length; i++) {
                if (currentPlayer.hand[i] && checkColumnPotential(currentPlayer.hand, i, discardValue)) {
                    // PROTECTION: Don't replace a GOOD revealed card (<= 2) for a column completion of a WORSE card
                    if (currentPlayer.hand[i].isRevealed && currentPlayer.hand[i].value < discardValue && currentPlayer.hand[i].value <= 2) continue;
                    return 'DISCARD_PILE';
                }
            }
        }

        // Check for column completion (Primary strat for Hardcore)
        for (let i = 0; i < currentPlayer.hand.length; i++) {
            if (currentPlayer.hand[i] && !(currentPlayer.hand[i].lockCount > 0) && checkColumnPotential(currentPlayer.hand, i, discardValue)) {
                // Fix: Don't take from discard if we would just replace same value
                if (currentPlayer.hand[i].isRevealed && currentPlayer.hand[i].value === discardValue) continue;

                // PROTECTION: Don't replace a GOOD revealed card (<= 2) for a column completion of a WORSE card
                if (currentPlayer.hand[i].isRevealed && currentPlayer.hand[i].value < discardValue && currentPlayer.hand[i].value <= 2) continue;

                return 'DISCARD_PILE';
            }
        }

        // ANTICIPATION: Denial Strategy (Block the opponent)
        // If the discard would give a huge benefit to the opponent, take it even if it's mediocre for us
        if (wouldHelpOpponent(gameState, discardValue)) {
            // Only block if our own hand isn't already "perfect" (avoid taking high card if we are winning)
            const myHighest = findHighestRevealedCard(currentPlayer.hand);
            if (myHighest.value >= discardValue) {
                console.log(`[AI] Blocking opponent by taking ${discardValue} from discard!`);
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
        const replaceIndex = findBestReplacementPosition(hand, 20, difficulty);
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
        const replaceIndex = findBestReplacementPosition(hand, drawnValue, difficulty);
        // If no good position found, just replace a random card (should rarely happen for AI)
        // CRITICAL: Must not pick a locked card
        const finalIndex = replaceIndex !== -1 ? replaceIndex : getRandomElement(
            hand.map((c, i) => (c !== null && !(c.lockCount > 0)) ? i : -1).filter(i => i !== -1)
        );
        return { action: 'REPLACE', cardIndex: finalIndex };
    }

    // Normal: Strategic decision
    if (difficulty === AI_DIFFICULTY.NORMAL) {
        const replaceIndex = findBestReplacementPosition(hand, drawnValue, difficulty);
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
    const replaceIndex = findBestReplacementPosition(hand, drawnValue, difficulty);

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
    if ((difficulty === AI_DIFFICULTY.HARD || difficulty === AI_DIFFICULTY.HARDCORE || difficulty === AI_DIFFICULTY.BONUS) &&
        wouldHelpOpponent(gameState, drawnValue)) {

        if (highest.index !== -1 && highest.value >= drawnValue) {
            console.log(`[AI] Preventing opponent from getting ${drawnValue} by keeping it!`);
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

            // Hardcore: Avoid revealing the last card if score is high (risky)
            if ((difficulty === AI_DIFFICULTY.HARDCORE || difficulty === AI_DIFFICULTY.BONUS) && hiddenIndices.length === 1) {
                const totalScore = calculateVisibleScore(hand);
                if (totalScore > 50) {
                    // Start closing out game, just take random
                    score = 0;
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
    const humanPlayer = gameState.players.find(p => !p.isAI) || gameState.players[(gameState.currentPlayerIndex + 1) % gameState.players.length];

    // IA Strategy:
    // 1. Find my worst card (revealed > 10, or random hidden if no bad revealed)
    // 2. Find human's best revealed card (< 0)

    let worstMyIndex = -1;
    let worstMyValue = -Infinity;
    currentPlayer.hand.forEach((card, idx) => {
        if (card && !(card.lockCount > 0)) {
            // Prefer revealed bad cards
            if (card.isRevealed && card.value > worstMyValue) {
                worstMyValue = card.value;
                worstMyIndex = idx;
            }
        }
    });

    // If no bad revealed cards, pick a hidden one
    if (worstMyIndex === -1 || worstMyValue < 5) {
        const hidden = getHiddenCardIndices(currentPlayer.hand);
        if (hidden.length > 0) worstMyIndex = getRandomElement(hidden);
    }

    // If still -1, pick any non-locked revealed
    if (worstMyIndex === -1) {
        const revealed = getRevealedCardIndices(currentPlayer.hand);
        if (revealed.length > 0) worstMyIndex = getRandomElement(revealed);
    }

    let bestTheirIndex = -1;
    let bestTheirValue = Infinity;
    humanPlayer.hand.forEach((card, idx) => {
        if (card && card.isRevealed && !(card.lockCount > 0) && card.value < bestTheirValue) {
            bestTheirValue = card.value;
            bestTheirIndex = idx;
        }
    });

    // If human has no good revealed cards, pick a hidden one
    if (bestTheirIndex === -1) {
        const hidden = getHiddenCardIndices(humanPlayer.hand);
        if (hidden.length > 0) bestTheirIndex = getRandomElement(hidden);
    }

    // Safety fallback
    if (bestTheirIndex === -1) {
        const revealed = getRevealedCardIndices(humanPlayer.hand);
        if (revealed.length > 0) bestTheirIndex = getRandomElement(revealed);
    }

    const humanPlayerIndex = gameState.players.findIndex(p => p.id === humanPlayer.id);

    return {
        sourceCardIndex: worstMyIndex,
        targetPlayerIndex: humanPlayerIndex,
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
