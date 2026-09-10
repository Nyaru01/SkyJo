const DAY_IN_MS = 86400000;
const WEEK_IN_MS = 7 * DAY_IN_MS;
export const EQUINOX_END = '2026-09-24T00:00:00+02:00';
export const EQUINOX = Object.freeze({
    id: 'equinoxe_2026', title: 'MODE ÉQUINOXE · ÉQUILIBRE', shortTitle: 'MODE ÉQUINOXE',
    subtitle: 'JUSQU’AU 23 SEPTEMBRE INCLUS', icon: '🌗', rewardXP: 15, endsAt: EQUINOX_END,
    requiredCards: [{ value: -2, count: 1 }, { value: 0, count: 2 }, { value: 2, count: 1 }],
    requirementLabel: 'Conservez −2 · 0 · 0 · +2',
});
export const HARVEST = Object.freeze({
    id: 'recolte_2026', title: 'RÉCOLTE D’AUTOMNE', shortTitle: 'RÉCOLTE D’AUTOMNE',
    subtitle: 'DEUX COLONNES, UNE VICTOIRE', icon: '🍂', rewardXP: 15,
    startsAt: EQUINOX_END, requiredColumns: 2, requirementLabel: 'Supprimez au moins 2 colonnes',
});
export const getActiveWeeklyChallenge = (now = new Date()) => now.getTime() < Date.parse(EQUINOX_END) ? EQUINOX : HARVEST;
export const getWeeklyChallengeById = id => id === HARVEST.id ? HARVEST : id === EQUINOX.id ? EQUINOX : null;
// Missing identifiers in old saved weekly games always mean Equinox, never today's event.
export const getGameChallenge = state => state?.isWeeklyChallenge ? getWeeklyChallengeById(state.seasonalChallengeId || EQUINOX.id) : null;
// Compatibility for existing consumers; live menus use the date selector instead.
export const CURRENT_WEEKLY_CHALLENGE = EQUINOX;
const parisDateNumber = now => {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    const part = type => Number(parts.find(p => p.type === type).value);
    return Date.UTC(part('year'), part('month') - 1, part('day'));
};
export const getEquinoxCountdown = (now = new Date()) => {
    if (now.getTime() >= Date.parse(EQUINOX_END)) return null;
    const days = (Date.UTC(2026, 8, 23) - parisDateNumber(now)) / DAY_IN_MS;
    return days <= 0 ? 'Dernier jour' : `J−${days} · Jusqu’au 23 septembre inclus`;
};
export const hasRequiredWeeklyChallengeCards = (hand = []) => EQUINOX.requiredCards.every(({ value, count }) => hand.filter(c => c && c.isRevealed && c.value === value).length >= count);
export const hasBestRoundScore = (roundScores = [], humanPlayerId = 'human-1') => {
    const score = roundScores.find(s => s.playerId === humanPlayerId)?.finalScore;
    return Number.isFinite(score) && score === Math.min(...roundScores.map(s => s.finalScore).filter(Number.isFinite));
};
export const hasChallengeObjective = ({ challenge, hand, columnsCleared = 0 }) => !!challenge && (challenge.id === HARVEST.id ? columnsCleared >= 2 : hasRequiredWeeklyChallengeCards(hand));
export const getChallengeWins = state => ({
    ...(state.weeklyChallengeId && state.weeklyChallengeWinDate ? { [state.weeklyChallengeId]: state.weeklyChallengeWinDate } : {}),
    ...state.seasonalChallengeWins,
});
export const isWeeklyChallengeAvailable = (state, now = new Date(), challenge = getActiveWeeklyChallenge(now)) => {
    const date = getChallengeWins(state)[challenge.id];
    return !date || !Number.isFinite(Date.parse(date)) || now.getTime() - Date.parse(date) >= WEEK_IN_MS;
};
export const getWeeklyChallengeRemainingDays = (state, now = new Date(), challenge = getActiveWeeklyChallenge(now)) => {
    if (isWeeklyChallengeAvailable(state, now, challenge)) return 0;
    return Math.max(0, Math.ceil((Date.parse(getChallengeWins(state)[challenge.id]) + WEEK_IN_MS - now.getTime()) / DAY_IN_MS));
};
export const canAwardWeeklyChallenge = ({ isWeeklyChallenge, hand, columnsCleared, roundScores, humanPlayerId = 'human-1', now = new Date(), challenge = EQUINOX, ...state }) => (
    isWeeklyChallenge === true && !!challenge && isWeeklyChallengeAvailable(state, now, challenge)
    && hasChallengeObjective({ challenge, hand, columnsCleared }) && hasBestRoundScore(roundScores, humanPlayerId)
);
export const applyXpReward = (currentXP, level, rewardXP) => {
    let nextXP = currentXP + rewardXP;
    let nextLevel = level;
    while (nextXP >= 10) { nextXP -= 10; nextLevel += 1; }
    return { currentXP: nextXP, level: nextLevel };
};
