import test from 'node:test';
import assert from 'node:assert/strict';
import { EQUINOX, HARVEST, WINTER, getUpcomingWeeklyChallenge, hasIceColumn, hasChallengeObjective, getWinterCountdown, getActiveWeeklyChallenge, getEquinoxCountdown, getGameChallenge, canAwardWeeklyChallenge, isWeeklyChallengeAvailable, getWeeklyChallengeRemainingDays } from './weeklyChallenge.js';
import { checkAndRemoveColumns, initializeGame, calculateFinalScores } from './skyjoEngine.js';
const scores = [{ playerId: 'human-1', finalScore: -3 }, { playerId: 'ai-1', finalScore: 4 }];

test('Paris: last day, midnight switch, and countdown', () => {
    assert.equal(getEquinoxCountdown(new Date('2026-09-10T10:00:00Z')), 'J−13 · Jusqu’au 23 septembre inclus');
    assert.equal(getEquinoxCountdown(new Date('2026-09-22T22:00:00Z')), 'Dernier jour');
    assert.equal(getActiveWeeklyChallenge(new Date('2026-09-23T21:59:59.999Z')), EQUINOX);
    assert.equal(getActiveWeeklyChallenge(new Date('2026-09-23T22:00:00Z')), null);
    assert.equal(getEquinoxCountdown(new Date('2026-09-23T22:00:00Z')), null);
    assert.equal(getActiveWeeklyChallenge(new Date('2027-01-01T00:00:00Z')), null);
});

test('Nuit du solstice : grisée avant le 21 décembre, active du 21 au 31 décembre 23 h 59 (Paris)', () => {
    assert.equal(getActiveWeeklyChallenge(new Date('2026-11-15T12:00:00Z')), null);
    assert.equal(getUpcomingWeeklyChallenge(new Date('2026-11-15T12:00:00Z')), WINTER);
    assert.equal(getActiveWeeklyChallenge(new Date('2026-12-20T22:59:59Z')), null);
    assert.equal(getActiveWeeklyChallenge(new Date('2026-12-20T23:00:00Z')), WINTER);
    assert.equal(getUpcomingWeeklyChallenge(new Date('2026-12-20T23:00:00Z')), null);
    assert.equal(getActiveWeeklyChallenge(new Date('2026-12-31T22:59:59Z')), WINTER);
    assert.equal(getActiveWeeklyChallenge(new Date('2026-12-31T23:00:00Z')), null);
    assert.equal(getWinterCountdown(new Date('2026-12-21T10:00:00Z')), 'J−10 · Jusqu’au 31 décembre inclus');
    assert.equal(getWinterCountdown(new Date('2026-12-31T10:00:00Z')), 'Dernier jour');
    assert.equal(isWeeklyChallengeAvailable({}, new Date('2026-11-15T12:00:00Z')), false);
});

test('colonne de glace : trois cartes à 0 ou moins, colonne encore sur la grille', () => {
    const c = v => ({ value: v, isRevealed: true });
    const hand = [c(-2), c(0), c(-1), c(5), c(5), c(1), null, null, null, c(3), c(4), c(9)];
    assert.equal(hasIceColumn(hand), true);
    assert.equal(hasIceColumn([c(-2), c(1), c(-1), ...Array(9).fill(c(4))]), false);
    assert.equal(hasChallengeObjective({ challenge: WINTER, hand }), true);
});
test('saved games retain their event, old weekly saves mean Equinox', () => {
    assert.equal(getGameChallenge({ isWeeklyChallenge: true }), EQUINOX);
    assert.equal(getGameChallenge({ isWeeklyChallenge: true, seasonalChallengeId: EQUINOX.id }), EQUINOX);
    assert.equal(getGameChallenge({ isWeeklyChallenge: true, seasonalChallengeId: HARVEST.id }), HARVEST);
    assert.equal(getGameChallenge({}), null);
});
test('harvest: two or more columns and a winning or tied final score', () => {
    const base = { isWeeklyChallenge: true, challenge: HARVEST, roundScores: scores };
    assert.equal(canAwardWeeklyChallenge({ ...base, columnsCleared: 1 }), false);
    assert.equal(canAwardWeeklyChallenge({ ...base, columnsCleared: 2 }), true);
    assert.equal(canAwardWeeklyChallenge({ ...base, columnsCleared: 3 }), true);
    assert.equal(canAwardWeeklyChallenge({ ...base, columnsCleared: 2, isWeeklyChallenge: false }), false);
    assert.equal(canAwardWeeklyChallenge({ ...base, columnsCleared: 2, roundScores: [{ playerId: 'human-1', finalScore: 4 }, { playerId: 'ai-1', finalScore: 4 }] }), true);
    assert.equal(canAwardWeeklyChallenge({ ...base, columnsCleared: 2, roundScores: [{ playerId: 'human-1', finalScore: 5 }, { playerId: 'ai-1', finalScore: 4 }] }), false);
});
test('rewards remain independent across events, with exact seven day cooldown', () => {
    const state = { weeklyChallengeId: EQUINOX.id, weeklyChallengeWinDate: '2026-09-23T20:00:00Z', seasonalChallengeWins: { [HARVEST.id]: '2026-09-24T09:30:00Z' } };
    assert.equal(isWeeklyChallengeAvailable(state, new Date('2026-10-01T09:29:59Z'), HARVEST), false);
    assert.equal(isWeeklyChallengeAvailable(state, new Date('2026-10-01T09:30:00Z'), HARVEST), true);
    assert.equal(getWeeklyChallengeRemainingDays(state, new Date('2026-09-30T09:30:00Z'), HARVEST), 1);
    assert.equal(isWeeklyChallengeAvailable(state, new Date('2026-09-30T20:00:00Z'), EQUINOX), true);
    assert.equal(isWeeklyChallengeAvailable({}, new Date('2026-09-24T00:00:00Z'), HARVEST), true);
});
test('engine counts cleared columns once and applies final penalties before challenge evaluation', () => {
    const state = initializeGame([{id:'human-1',name:'Test'},{id:'ai-1',name:'IA'}], {isBonusMode:true});
    state.players[0].hand = Array.from({length:12}, (_,i)=>({id:String(i),value:i<3?4:i<6?5:10,isRevealed:i<6}));
    state.players[1].hand = Array.from({length:12},(_,i)=>({id:'ai'+i,value:1,isRevealed:true}));
    const cleared = checkAndRemoveColumns(state);
    assert.equal(cleared.players[0].columnsCleared, 2);
    assert.equal(checkAndRemoveColumns(cleared).players[0].columnsCleared, 2);
    cleared.finishingPlayerIndex = 0;
    const final = calculateFinalScores(cleared);
    assert.equal(canAwardWeeklyChallenge({isWeeklyChallenge:true,challenge:HARVEST,columnsCleared:2,roundScores:final}),false);
});
