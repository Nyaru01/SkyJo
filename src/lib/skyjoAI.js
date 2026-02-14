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

// ============================================
// OPPONENT MEMORY & PLAYER PROFILING (Points 2 & 8)
// ============================================

/**
 * Persistent memory of opponent actions across turns.
 * Tracks what the opponent picks from discard (reveals their strategy)
 * and what they discard (reveals what they don't need).
 */
const opponentMemory = {
    // Cards the opponent deliberately took from discard pile
    pickedFromDiscard: [],
    // Cards the opponent discarded after drawing from deck
    discardedValues: [],
    // Number of column completions the opponent has achieved
    columnCompletions: 0,
    // Total turns observed
    turnsObserved: 0,
    // How many times opponent drew from discard vs deck
    drawFromDiscard: 0,
    drawFromDeck: 0,
    // Track the last known discard top to detect opponent picks
    lastDiscardTop: null,
    // Number of times opponent replaced a revealed card (aggressive play)
    replacedRevealed: 0,
    // Number of times opponent revealed a hidden card (conservative play)
    revealedHidden: 0,
};

/**
 * Reset opponent memory (call at start of a new game)
 */
export const resetOpponentMemory = () => {
    opponentMemory.pickedFromDiscard = [];
    opponentMemory.discardedValues = [];
    opponentMemory.columnCompletions = 0;
    opponentMemory.turnsObserved = 0;
    opponentMemory.drawFromDiscard = 0;
    opponentMemory.drawFromDeck = 0;
    opponentMemory.lastDiscardTop = null;
    opponentMemory.replacedRevealed = 0;
    opponentMemory.revealedHidden = 0;
};

/**
 * Update opponent memory after observing their turn.
 * Call this at the END of each human turn, passing the gameState
 * BEFORE and AFTER the human's action.
 *
 * @param {object} preState - gameState before human action
 * @param {object} postState - gameState after human action
 */
export const observeOpponentTurn = (preState, postState) => {
    opponentMemory.turnsObserved++;

    const preDiscard = preState.discardPile || [];
    const postDiscard = postState.discardPile || [];
    const preDiscardTop = preDiscard.length > 0 ? preDiscard[preDiscard.length - 1] : null;

    // Detect if opponent drew from discard (discard pile shrank or top changed)
    if (preDiscard.length > postDiscard.length ||
        (preDiscardTop && postDiscard.length > 0 &&
            preDiscardTop.value !== postDiscard[postDiscard.length - 1]?.value)) {
        opponentMemory.drawFromDiscard++;
        if (preDiscardTop) {
            opponentMemory.pickedFromDiscard.push(preDiscardTop.value);
            aiLog('memory', `Opponent picked ${preDiscardTop.value} from discard`);
        }
    } else {
        opponentMemory.drawFromDeck++;
    }

    // Detect what opponent discarded (new top of discard after their turn)
    if (postDiscard.length > 0) {
        const newTop = postDiscard[postDiscard.length - 1];
        // If discard grew or top changed, opponent discarded something
        if (postDiscard.length > preDiscard.length ||
            (preDiscardTop && newTop.value !== preDiscardTop.value)) {
            opponentMemory.discardedValues.push(newTop.value);
        }
    }

    // Detect play style: count revealed vs hidden changes
    const opponent = postState.players.find(p => p.id === 'human-1');
    const preOpponent = preState.players.find(p => p.id === 'human-1');
    if (opponent && preOpponent) {
        const preHiddenCount = preOpponent.hand.filter(c => c && !c.isRevealed).length;
        const postHiddenCount = opponent.hand.filter(c => c && !c.isRevealed).length;
        const preRevealedCount = preOpponent.hand.filter(c => c && c.isRevealed).length;
        const postRevealedCount = opponent.hand.filter(c => c && c.isRevealed).length;

        if (postHiddenCount < preHiddenCount && postRevealedCount > preRevealedCount) {
            opponentMemory.revealedHidden++;
        }
        if (postRevealedCount >= preRevealedCount && postHiddenCount === preHiddenCount) {
            opponentMemory.replacedRevealed++;
        }
    }

    opponentMemory.lastDiscardTop = postDiscard.length > 0
        ? postDiscard[postDiscard.length - 1]
        : null;
};

/**
 * Get opponent's player profile based on observed behavior.
 * Returns a profile object describing their tendencies.
 */
const getOpponentProfile = () => {
    const mem = opponentMemory;
    if (mem.turnsObserved < 2) {
        return { style: 'unknown', discardPickRate: 0, aggressiveness: 0.5, preferredValues: [] };
    }

    const totalDraws = mem.drawFromDiscard + mem.drawFromDeck;
    const discardPickRate = totalDraws > 0 ? mem.drawFromDiscard / totalDraws : 0;

    const totalActions = mem.replacedRevealed + mem.revealedHidden;
    const aggressiveness = totalActions > 0 ? mem.replacedRevealed / totalActions : 0.5;

    // Identify values the opponent is collecting (picked from discard multiple times)
    const valueCounts = {};
    mem.pickedFromDiscard.forEach(v => {
        valueCounts[v] = (valueCounts[v] || 0) + 1;
    });
    const preferredValues = Object.entries(valueCounts)
        .filter(([_, count]) => count >= 2)
        .map(([val]) => parseInt(val));

    // Identify values the opponent doesn't want (discarded)
    const unwantedValues = [...new Set(mem.discardedValues)];

    let style = 'balanced';
    if (discardPickRate > 0.6) style = 'column_builder';  // Frequently picks specific values
    if (aggressiveness > 0.7) style = 'aggressive';       // Replaces revealed cards often
    if (discardPickRate < 0.25 && aggressiveness < 0.3) style = 'conservative';

    return {
        style,
        discardPickRate,
        aggressiveness,
        preferredValues,
        unwantedValues,
    };
};

/**
 * Check if opponent is likely building a column with a specific value.
 * Uses memory of what they picked from discard + visible hand state.
 */
const isOpponentCollecting = (gameState, cardValue) => {
    const profile = getOpponentProfile();

    // Direct evidence: opponent picked this value from discard before
    if (opponentMemory.pickedFromDiscard.includes(cardValue)) {
        return true;
    }

    // Indirect evidence: opponent has 2+ revealed cards of this value
    const opponent = gameState.players.find(p => p.id === 'human-1');
    if (opponent) {
        const matchCount = opponent.hand.filter(
            c => c && c.isRevealed && c.value === cardValue
        ).length;
        if (matchCount >= 2) return true;
    }

    // Profile-based: if opponent is a column_builder and this value is in their preferences
    if (profile.preferredValues.includes(cardValue)) return true;

    return false;
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

// ============================================
// DYNAMIC THRESHOLDS & ESTIMATED SCORE (Points 3 & 5)
// ============================================

/**
 * Calculate the game progress ratio (0 = start, 1 = near end).
 * Based on how many cards are revealed across all players.
 */
const getGameProgress = (gameState) => {
    const allCards = gameState.players.flatMap(p => p.hand).filter(Boolean);
    const totalCards = allCards.length;
    if (totalCards === 0) return 0;
    const revealedCards = allCards.filter(c => c.isRevealed).length;
    return revealedCards / totalCards;
};

/**
 * Get dynamic thresholds that adapt based on game progress and score differential.
 * Early game = more selective (higher standards). Late game = more accepting.
 *
 * @param {object} gameState
 * @param {Array} playerHand - AI's hand
 * @param {string} difficulty
 * @returns {object} Dynamic threshold values
 */
const getDynamicThresholds = (gameState, playerHand, difficulty) => {
    const progress = getGameProgress(gameState);
    const avgValue = getProbabilisticAverageValue(gameState);
    const hiddenCount = getHiddenCardIndices(playerHand).length;
    const totalSlots = playerHand.filter(c => c !== null).length;
    const revealRatio = totalSlots > 0 ? 1 - (hiddenCount / totalSlots) : 1;

    // Score differential: positive = AI winning
    const scoreDiff = getScoreDifferential(gameState, playerHand);

    // --- goodCardThreshold ---
    // Early game (progress < 0.3): strict, only accept <= 3
    // Mid game (0.3-0.7): accept <= 4-5
    // Late game (> 0.7): accept anything below average deck value
    let goodCardThreshold;
    if (progress < 0.3) {
        goodCardThreshold = isAdvancedLevel(difficulty) ? 3 : 4;
    } else if (progress < 0.7) {
        goodCardThreshold = isAdvancedLevel(difficulty) ? 4 : 5;
    } else {
        // Late game: accept up to deck average (clamped)
        goodCardThreshold = Math.min(Math.ceil(avgValue), 7);
    }

    // If losing, be more accepting (raise threshold by 1)
    if (scoreDiff < -10) goodCardThreshold = Math.min(goodCardThreshold + 1, 8);
    // If winning, be stricter (lower threshold by 1)
    if (scoreDiff > 15) goodCardThreshold = Math.max(goodCardThreshold - 1, 2);

    // --- badThreshold (for "only replace terrible cards") ---
    // Early game: only replace 11-12
    // Late game: replace anything >= 7-8
    let badThreshold;
    if (progress < 0.3) {
        badThreshold = 11;
    } else if (progress < 0.6) {
        badThreshold = 9;
    } else {
        badThreshold = 7;
    }
    if (scoreDiff < -10) badThreshold = Math.max(badThreshold - 2, 5);
    if (scoreDiff > 15) badThreshold = Math.min(badThreshold + 1, 12);

    // --- columnEliminationMinValue ---
    // Early game: only complete columns of 4+
    // Late game: complete columns of 3+
    let columnEliminationMinValue;
    if (progress < 0.4) {
        columnEliminationMinValue = isAdvancedLevel(difficulty) ? 4 : 3;
    } else {
        columnEliminationMinValue = 3;
    }

    // --- replacementGapThreshold ---
    // How much better must the new card be to justify replacing a revealed card
    // Early game: gap of 5+ required. Late game: gap of 2+ is fine.
    let replacementGap;
    if (progress < 0.3) {
        replacementGap = 5;
    } else if (progress < 0.6) {
        replacementGap = 4;
    } else {
        replacementGap = 2;
    }

    return {
        goodCardThreshold,
        badThreshold,
        columnEliminationMinValue,
        replacementGap,
        gameProgress: progress,
        revealRatio,
    };
};

/**
 * Estimate the TOTAL score of a hand, including hidden cards.
 * Hidden cards are valued at their expected value based on remaining deck composition.
 * This gives a much more accurate picture than just visible score.
 *
 * @param {Array} hand - Player's hand
 * @param {object} gameState - Current game state
 * @returns {number} Estimated total score
 */
const estimateTotalScore = (hand, gameState) => {
    const avgValue = getProbabilisticAverageValue(gameState);
    let total = 0;

    hand.forEach(card => {
        if (card === null) return;
        if (card.isRevealed) {
            total += card.value;
        } else {
            // Hidden card: use expected value from remaining deck
            total += avgValue;
        }
    });

    return total;
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
 * IMPROVED (Point 5): Uses estimated total score (hidden cards included)
 * instead of just visible score for more accurate end-game decisions.
 */
const shouldAccelerateEndGame = (gameState, playerHand) => {
    const opponent = gameState.players.find(p => p.id === 'human-1') ||
        gameState.players[(gameState.currentPlayerIndex + 1) % gameState.players.length];

    if (!opponent) return true;

    // Use estimated total scores (visible + hidden card EV)
    const myEstimated = estimateTotalScore(playerHand, gameState);
    const opponentEstimated = estimateTotalScore(opponent.hand, gameState);

    // Also check visible scores for a "confidence" factor
    const myVisible = calculateVisibleScore(playerHand);
    const myHiddenCount = getHiddenCardIndices(playerHand).length;

    // If we have many hidden cards, our estimate is less reliable → be cautious
    const confidencePenalty = myHiddenCount * 1.5;

    // Leading estimated: rush if confident
    if (myEstimated < opponentEstimated - 5 - confidencePenalty) {
        aiLog('endgame', `Accelerating: estimated ${myEstimated.toFixed(1)} vs opponent ${opponentEstimated.toFixed(1)}`);
        return true;
    }

    // Losing estimated: slow down and improve hand
    if (myEstimated > opponentEstimated + 8) {
        aiLog('endgame', `Slowing down: estimated ${myEstimated.toFixed(1)} vs opponent ${opponentEstimated.toFixed(1)}`);
        return false;
    }

    // Edge case: if all our cards are revealed and score is good, rush
    if (myHiddenCount <= 1 && myVisible < opponentEstimated) return true;

    // Close game: default to slight acceleration if we have fewer hidden cards
    const opponentHiddenCount = getHiddenCardIndices(opponent.hand).length;
    if (myHiddenCount < opponentHiddenCount) return true;

    return myEstimated <= opponentEstimated; // Accelerate only if not losing
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

    if (!forceCheck && cardValue < MIN_VALUE_FOR_COLUMN_ELIMINATION && cardValue !== 0) {
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
            else if (card && !card.isRevealed) currentTotal += 5.3; // EV for hidden
            else currentTotal += cardValue;
        });

        // SPECIAL RULE: Don't eliminate a column if total is <= 0 (keeps negative advantage)
        // Exception: eliminate columns of 0s if they don't have any negative cards
        const hasNegative = colIndices.some(idx => hand[idx] && hand[idx].isRevealed && hand[idx].value < 0);
        if (currentTotal > 0 || (currentTotal === 0 && !hasNegative)) return true;
        return false;
    }

    // Case 2: Potential (Waiting for 1 more card)
    if (matchCount === 1 && hiddenCount >= 1) {
        // Only build potential if it's profitable or zero
        let estimatedTotal = cardValue;
        colIndices.forEach(idx => {
            if (idx === cardIndex) return;
            const card = hand[idx];
            if (card && card.isRevealed) estimatedTotal += card.value;
            else estimatedTotal += 5.3; // Hidden EV
        });

        if (estimatedTotal <= 0) return false;
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
    const highest = findHighestRevealedCard(hand);

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

    // --- URGENT REPLACEMENTS (High targets) ---
    // If we have very bad revealed cards (>= 10), replace them before thinking about strategy
    if (highest.index !== -1 && highest.value >= 10 && cardValue < highest.value) {
        return highest.index;
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
                if (matchingInCol.length > 0) {
                    // PROTECTION: Don't expand if col has an excellent negative card (don't eliminate it!)
                    const hasNegative = colCards.some(c => c && c.isRevealed && c.value < 0);
                    if (!hasNegative) potential = 10;
                    else potential = 1; // Low priority
                }
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
    if (cardValue <= 0) {
        // 1. Replace high cards first (even if just 5+)
        if (highest.index !== -1 && highest.value >= 5) {
            return highest.index;
        }

        // 2. Explore hidden cards before replacing good revealed cards
        if (hiddenIndices.length > 0) {
            // Avoid ending game if losing
            if (slowDown && hiddenIndices.length === 1) {
                if (highest.index !== -1 && highest.value > cardValue) return highest.index;
                // If it's a very good card (<= -2), we MUST keep it even if it ends the game
                if (cardValue <= -2) {
                    if (highest.index !== -1) return highest.index;
                    return getRandomElement(hiddenIndices);
                }
                return -1;
            }
            const cornerIndices = [0, 2, 9, 11].filter(i => hiddenIndices.includes(i));
            if (cornerIndices.length > 0) return getRandomElement(cornerIndices);
            return getRandomElement(hiddenIndices);
        }

        // 3. Last resort: replace highest revealed if it's worse
        if (highest.index !== -1 && cardValue < highest.value) {
            // Gap check: if we are replacing a "good" card (<= 4) with 0 or -1,
            // better gap of 4 required.
            const gap = highest.value - cardValue;
            if (highest.value > 4 || gap >= 3) {
                return highest.index;
            }
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
    // IMPROVED (Point 3): Use dynamic thresholds instead of fixed 10
    let badThreshold = 10 + riskAdjustment;
    if (gameState && (isAdvancedLevel(difficulty) || difficulty === AI_DIFFICULTY.HARD)) {
        const dynThresholds = getDynamicThresholds(gameState, hand, difficulty);
        badThreshold = dynThresholds.badThreshold + riskAdjustment;
    }
    if (highest.index !== -1 && cardValue < highest.value && highest.value >= badThreshold) {
        return highest.index;
    }

    return -1; // Don't replace
};

// ============================================
// LOOK-AHEAD / ANTICIPATION (Point 4)
// ============================================

/**
 * Simulate what happens if we discard a card: would the opponent benefit?
 * This is a depth-1 minimax: we evaluate the opponent's best possible
 * response to our discard action.
 *
 * @param {object} gameState
 * @param {number} cardValue - Value we would discard
 * @param {string} difficulty
 * @returns {number} Risk score (higher = worse for us to discard this card)
 *   0 = safe to discard, >0 = risky, the opponent can use it well
 */
const evaluateDiscardRisk = (gameState, cardValue, difficulty) => {
    if (!isAdvancedLevel(difficulty) && difficulty !== AI_DIFFICULTY.HARD) return 0;

    const opponent = gameState.players.find(p => p.id === 'human-1') ||
        gameState.players[(gameState.currentPlayerIndex + 1) % gameState.players.length];
    if (!opponent) return 0;

    let risk = 0;

    // 1. Check if opponent can complete a column with this value
    for (let i = 0; i < opponent.hand.length; i++) {
        const card = opponent.hand[i];
        if (!card || card.lockCount > 0) continue;

        const col = Math.floor(i / 3);
        const colStart = col * 3;
        const colIndices = [colStart, colStart + 1, colStart + 2];

        let matchCount = 0;
        colIndices.forEach(idx => {
            if (idx === i) return;
            const c = opponent.hand[idx];
            if (c && c.isRevealed && c.value === cardValue) matchCount++;
        });

        // Opponent can complete a column! High risk.
        if (matchCount === 2) {
            risk += cardValue >= 3 ? cardValue * 3 : cardValue; // Higher value columns are worse to give away
        }
        // Opponent has 1 matching card — building potential
        if (matchCount === 1) {
            risk += cardValue >= 5 ? 3 : 1;
        }
    }

    // 2. Check memory: is the opponent actively collecting this value?
    if (isOpponentCollecting(gameState, cardValue)) {
        risk += 10;
        aiLog(difficulty, `Lookahead: opponent is collecting value ${cardValue}, high discard risk!`);
    }

    // 3. Profile-based adjustment
    const profile = getOpponentProfile();
    if (profile.style === 'column_builder' && cardValue >= 3) {
        // Column builders are more dangerous — any medium-high card helps them
        risk += 3;
    }

    // 4. If it would replace opponent's worst card with something better
    const opponentHighest = findHighestRevealedCard(opponent.hand);
    if (opponentHighest.index !== -1 && cardValue < opponentHighest.value) {
        risk += (opponentHighest.value - cardValue); // The bigger the upgrade, the bigger the risk
    }

    return risk;
};

/**
 * Compare two possible actions: REPLACE vs DISCARD_AND_REVEAL
 * using look-ahead to evaluate which is safer.
 *
 * @param {object} gameState
 * @param {number} drawnValue - Value of drawn card
 * @param {number} replaceIndex - Best replacement position (-1 if none)
 * @param {Array} hand - AI's hand
 * @param {string} difficulty
 * @returns {'REPLACE'|'DISCARD'} Recommended action considering look-ahead
 */
const lookaheadDecision = (gameState, drawnValue, replaceIndex, hand, difficulty) => {
    if (!isAdvancedLevel(difficulty)) return replaceIndex !== -1 ? 'REPLACE' : 'DISCARD';

    const discardRisk = evaluateDiscardRisk(gameState, drawnValue, difficulty);

    // If discarding is very risky and we have a valid replacement, prefer keeping the card
    if (discardRisk >= 8 && replaceIndex !== -1) {
        aiLog(difficulty, `Lookahead: keeping card ${drawnValue} (discard risk=${discardRisk}) to deny opponent`);
        return 'REPLACE';
    }

    // If discarding is somewhat risky but replacing would hurt us more
    if (replaceIndex !== -1) {
        const currentCardValue = hand[replaceIndex]?.isRevealed ? hand[replaceIndex].value : null;
        if (currentCardValue !== null) {
            const replaceBenefit = currentCardValue - drawnValue; // positive = we improve
            // If replacing helps us more than discard risk hurts us
            if (replaceBenefit > 0 || discardRisk >= 5) {
                return 'REPLACE';
            }
        }
    }

    // If discard risk is low, discard freely
    if (discardRisk <= 2) return 'DISCARD';

    // Medium risk: prefer replacing if possible
    return replaceIndex !== -1 ? 'REPLACE' : 'DISCARD';
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

        // IMPROVED (Point 2): Memory-based denial
        // If opponent has been collecting a specific value, block it even if
        // the standard wouldHelpOpponent check didn't trigger
        if (isAdvancedLevel(difficulty) && isOpponentCollecting(gameState, discardValue)) {
            const myHighest = findHighestRevealedCard(currentPlayer.hand);
            if (myHighest.value >= discardValue) {
                aiLog(difficulty, `Memory-based block: opponent collects ${discardValue}, taking from discard`);
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

        // [CRITICAL FIX] Never discard a very good negative card (<= -2)
        if (drawnValue <= -2) {
            const finalReplaceIdx = replaceIndex !== -1 ? replaceIndex : (
                highest.index !== -1 ? highest.index : (
                    getHiddenCardIndices(hand).length > 0 ? getHiddenCardIndices(hand)[0] : 0
                )
            );
            return { action: 'REPLACE', cardIndex: finalReplaceIdx };
        }

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

    // IMPROVED (Point 3): Use dynamic thresholds
    const dynThresholds = getDynamicThresholds(gameState, hand, difficulty);

    // 1. Column Completion (Highest Priority)
    // Check if this card completes a column
    // (Handled inside findBestReplacementPosition, but verified here)
    if (replaceIndex !== -1 && checkColumnPotential(hand, replaceIndex, drawnValue)) {
        return { action: 'REPLACE', cardIndex: replaceIndex };
    }

    // 2. Good Card Strategy
    // IMPROVED (Point 3): Dynamic threshold instead of fixed 3/4
    if (drawnValue <= dynThresholds.goodCardThreshold && replaceIndex !== -1) {
        return { action: 'REPLACE', cardIndex: replaceIndex };
    }

    // 3. High Card Replacement
    const highest = findHighestRevealedCard(hand);
    if (highest.index !== -1 && drawnValue < highest.value) {
        // IMPROVED (Point 3): Use dynamic replacement gap
        if (highest.value - drawnValue >= dynThresholds.replacementGap || drawnValue <= dynThresholds.goodCardThreshold) {
            return { action: 'REPLACE', cardIndex: highest.index };
        }
    }

    // 4. LOOKAHEAD + DENIAL (Points 4 & 2)
    // Use look-ahead to evaluate discard risk before deciding
    if (isAdvancedLevel(difficulty)) {
        const lookahead = lookaheadDecision(gameState, drawnValue, replaceIndex, hand, difficulty);
        if (lookahead === 'REPLACE' && replaceIndex !== -1) {
            aiLog(difficulty, `Lookahead decided to KEEP card ${drawnValue} (deny opponent)`);
            return { action: 'REPLACE', cardIndex: replaceIndex };
        }
        // Fallback: original denial logic if lookahead says discard but opponent would benefit
        if (wouldHelpOpponent(gameState, drawnValue)) {
            if (highest.index !== -1 && highest.value >= drawnValue) {
                aiLog(difficulty, `Preventing opponent from getting ${drawnValue} by keeping it!`);
                return { action: 'REPLACE', cardIndex: highest.index };
            }
        }
    }

    // 5. Bad/Mediocre Card -> Discard & Reveal Strategy
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
 * IMPROVED (Point 7): Check if sending a card to the opponent would complete
 * one of their columns. Returns true if dangerous.
 *
 * @param {Array} opponentHand
 * @param {number} targetIndex - Where the card will land in opponent's hand
 * @param {number} cardValue - Value of the card being sent
 * @returns {boolean} True if this would gift a column completion
 */
const wouldGiftColumnCompletion = (opponentHand, targetIndex, cardValue) => {
    const col = Math.floor(targetIndex / 3);
    const colStart = col * 3;
    const colIndices = [colStart, colStart + 1, colStart + 2];

    let matchCount = 0;
    colIndices.forEach(idx => {
        if (idx === targetIndex) return;
        const card = opponentHand[idx];
        if (card && card.isRevealed && card.value === cardValue) matchCount++;
    });

    // If 2 other cards in the column match, placing this card completes it
    return matchCount === 2;
};

/**
 * Decide which cards to swap (Special card 'S')
 * IMPROVED (Point 7): Verifies that the swap doesn't accidentally
 * gift the opponent a column completion.
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

    // ============================================
    // POINT 7: Anti-completion safety check
    // Verify that sending our card to the opponent's slot won't complete their column!
    // ============================================
    if (isAdvancedLevel(difficulty) || difficulty === AI_DIFFICULTY.HARD) {
        const myCard = currentPlayer.hand[worstMyIndex];
        const myCardValue = myCard ? (myCard.isRevealed ? myCard.value : avgValue) : avgValue;

        // Check: would placing our card at bestTheirIndex complete a column for opponent?
        if (bestTheirIndex !== -1 && wouldGiftColumnCompletion(opponent.hand, bestTheirIndex, myCardValue)) {
            aiLog(difficulty, `Swap safety: sending ${myCardValue} to index ${bestTheirIndex} would gift a column completion!`);

            // Try to find an alternative target that doesn't gift a column
            let alternativeIndex = -1;
            let alternativeValue = Infinity;

            opponent.hand.forEach((card, idx) => {
                if (idx === bestTheirIndex) return; // Skip the dangerous one
                if (!card || card.lockCount > 0) return;

                // Check this alternative doesn't also gift a completion
                if (wouldGiftColumnCompletion(opponent.hand, idx, myCardValue)) return;

                if (card.isRevealed && card.value < alternativeValue) {
                    alternativeValue = card.value;
                    alternativeIndex = idx;
                }
            });

            if (alternativeIndex !== -1) {
                aiLog(difficulty, `Swap safety: using safe alternative target index ${alternativeIndex} (value ${alternativeValue})`);
                bestTheirIndex = alternativeIndex;
            } else {
                // No safe revealed targets — try a hidden card
                const theirHidden = getHiddenCardIndices(opponent.hand);
                const safeHidden = theirHidden.filter(
                    idx => !wouldGiftColumnCompletion(opponent.hand, idx, myCardValue)
                );
                if (safeHidden.length > 0) {
                    bestTheirIndex = getRandomElement(safeHidden);
                    aiLog(difficulty, `Swap safety: targeting hidden card at ${bestTheirIndex} instead`);
                }
                // If all targets are dangerous, we proceed anyway (rare edge case)
            }
        }

        // BONUS CHECK: Also verify the card we RECEIVE won't break one of our own potential columns
        const theirCard = opponent.hand[bestTheirIndex];
        if (theirCard && theirCard.isRevealed && worstMyIndex !== -1) {
            // Check if placing their card at worstMyIndex would disrupt our column building
            const col = Math.floor(worstMyIndex / 3);
            const colStart = col * 3;
            const colIndices = [colStart, colStart + 1, colStart + 2];
            const myColValues = colIndices
                .filter(i => i !== worstMyIndex)
                .map(i => currentPlayer.hand[i])
                .filter(c => c && c.isRevealed)
                .map(c => c.value);

            // If we had 2 matching cards in this column and incoming card breaks it
            if (myColValues.length === 2 && myColValues[0] === myColValues[1] && theirCard.value !== myColValues[0]) {
                // Try to find a different source card from our hand
                const myRevealed = getRevealedCardIndices(currentPlayer.hand);
                const alternativeSource = myRevealed.find(idx => {
                    if (idx === worstMyIndex) return false;
                    const srcCol = Math.floor(idx / 3);
                    const srcColStart = srcCol * 3;
                    const srcColIndices = [srcColStart, srcColStart + 1, srcColStart + 2];
                    const srcColVals = srcColIndices
                        .filter(i => i !== idx)
                        .map(i => currentPlayer.hand[i])
                        .filter(c => c && c.isRevealed)
                        .map(c => c.value);
                    // Don't break another potential column either
                    return !(srcColVals.length === 2 && srcColVals[0] === srcColVals[1]);
                });

                if (alternativeSource !== undefined) {
                    aiLog(difficulty, `Swap safety: avoiding column disruption, swapping from index ${alternativeSource} instead of ${worstMyIndex}`);
                    worstMyIndex = alternativeSource;
                }
            }
        }
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
