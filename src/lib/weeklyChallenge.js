const DAY_IN_MS = 24 * 60 * 60 * 1000;
const WEEK_IN_MS = 7 * DAY_IN_MS;

export const CURRENT_WEEKLY_CHALLENGE = Object.freeze({
    id: 'equinoxe_2026',
    title: 'MODE ÉQUINOXE · ÉQUILIBRE',
    shortTitle: 'MODE ÉQUINOXE',
    subtitle: 'ÉVÉNEMENT SEPTEMBRE–OCTOBRE',
    icon: '🌗',
    rewardXP: 15,
    requiredCards: Object.freeze([
        Object.freeze({ value: -2, count: 1 }),
        Object.freeze({ value: 0, count: 2 }),
        Object.freeze({ value: 2, count: 1 }),
    ]),
    requirementLabel: 'Gardez -2 + 2× "0" + 2',
});

export const hasRequiredWeeklyChallengeCards = (hand = []) => (
    CURRENT_WEEKLY_CHALLENGE.requiredCards.every(({ value, count }) => (
        hand.filter(card => card && card.isRevealed && card.value === value).length >= count
    ))
);

export const hasBestRoundScore = (roundScores = [], humanPlayerId = 'human-1') => {
    if (!roundScores.length) return false;

    const humanScore = roundScores.find(score => score.playerId === humanPlayerId)?.finalScore;
    if (!Number.isFinite(humanScore)) return false;

    const finiteScores = roundScores
        .map(score => score.finalScore)
        .filter(Number.isFinite);

    return finiteScores.length > 0 && humanScore === Math.min(...finiteScores);
};

export const isWeeklyChallengeAvailable = ({
    weeklyChallengeWinDate,
    weeklyChallengeId,
}, now = new Date()) => {
    if (weeklyChallengeId !== CURRENT_WEEKLY_CHALLENGE.id) return true;
    if (!weeklyChallengeWinDate) return true;

    const lastWin = new Date(weeklyChallengeWinDate);
    if (Number.isNaN(lastWin.getTime())) return true;

    return now.getTime() - lastWin.getTime() >= WEEK_IN_MS;
};

export const getWeeklyChallengeRemainingDays = ({
    weeklyChallengeWinDate,
    weeklyChallengeId,
}, now = new Date()) => {
    if (isWeeklyChallengeAvailable({ weeklyChallengeWinDate, weeklyChallengeId }, now)) return 0;

    const nextAvailableAt = new Date(weeklyChallengeWinDate).getTime() + WEEK_IN_MS;
    return Math.max(0, Math.ceil((nextAvailableAt - now.getTime()) / DAY_IN_MS));
};

export const canAwardWeeklyChallenge = ({
    isWeeklyChallenge,
    hand,
    roundScores,
    humanPlayerId = 'human-1',
    weeklyChallengeWinDate,
    weeklyChallengeId,
    now = new Date(),
}) => (
    isWeeklyChallenge === true
    && isWeeklyChallengeAvailable({ weeklyChallengeWinDate, weeklyChallengeId }, now)
    && hasRequiredWeeklyChallengeCards(hand)
    && hasBestRoundScore(roundScores, humanPlayerId)
);

export const applyXpReward = (currentXP, level, rewardXP) => {
    let nextXP = currentXP + rewardXP;
    let nextLevel = level;

    while (nextXP >= 10) {
        nextXP -= 10;
        nextLevel += 1;
    }

    return { currentXP: nextXP, level: nextLevel };
};
