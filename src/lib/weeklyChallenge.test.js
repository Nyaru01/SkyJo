import test from 'node:test';
import assert from 'node:assert/strict';
import {
    CURRENT_WEEKLY_CHALLENGE,
    applyXpReward,
    canAwardWeeklyChallenge,
    hasRequiredWeeklyChallengeCards,
    isWeeklyChallengeAvailable,
} from './weeklyChallenge.js';

const card = value => ({ value, isRevealed: true });
const winningScores = [
    { playerId: 'human-1', finalScore: 8 },
    { playerId: 'ai-1', finalScore: 12 },
];
const requiredHand = [card(-2), card(0), card(0), card(2)];

test('accepte la combinaison Équinoxe exacte', () => {
    assert.equal(hasRequiredWeeklyChallengeCards(requiredHand), true);
});

test('accepte des cartes supplémentaires', () => {
    assert.equal(hasRequiredWeeklyChallengeCards([...requiredHand, card(-2), card(7)]), true);
});

test('refuse une combinaison incomplète ou une carte requise cachée', () => {
    assert.equal(hasRequiredWeeklyChallengeCards([card(-2), card(0), card(2)]), false);
    assert.equal(hasRequiredWeeklyChallengeCards([...requiredHand.slice(0, 3), { value: 2, isRevealed: false }]), false);
});

test('attribue le défi uniquement à une partie hebdomadaire gagnée', () => {
    const base = {
        hand: requiredHand,
        roundScores: winningScores,
        weeklyChallengeWinDate: null,
        weeklyChallengeId: null,
    };

    assert.equal(canAwardWeeklyChallenge({ ...base, isWeeklyChallenge: true }), true);
    assert.equal(canAwardWeeklyChallenge({ ...base, isWeeklyChallenge: false }), false);
    assert.equal(canAwardWeeklyChallenge({
        ...base,
        isWeeklyChallenge: true,
        roundScores: [
            { playerId: 'human-1', finalScore: 14 },
            { playerId: 'ai-1', finalScore: 7 },
        ],
    }), false);
});

test('une égalité au meilleur score reste une victoire', () => {
    assert.equal(canAwardWeeklyChallenge({
        isWeeklyChallenge: true,
        hand: requiredHand,
        roundScores: [
            { playerId: 'human-1', finalScore: 8 },
            { playerId: 'ai-1', finalScore: 8 },
        ],
        weeklyChallengeWinDate: null,
        weeklyChallengeId: null,
    }), true);
});

test('une ancienne saison débloque immédiatement Équinoxe', () => {
    assert.equal(isWeeklyChallengeAvailable({
        weeklyChallengeWinDate: '2026-08-26',
        weeklyChallengeId: 'previous_season',
    }, new Date('2026-08-27T12:00:00Z')), true);
});

test('la même saison bloque une seconde récompense pendant sept jours', () => {
    const state = {
        weeklyChallengeWinDate: '2026-08-27',
        weeklyChallengeId: CURRENT_WEEKLY_CHALLENGE.id,
    };

    assert.equal(isWeeklyChallengeAvailable(state, new Date('2026-09-02T23:59:59Z')), false);
    assert.equal(isWeeklyChallengeAvailable(state, new Date('2026-09-03T00:00:00Z')), true);
});

test('applique les 15 XP avec passage de niveau', () => {
    assert.deepEqual(applyXpReward(6, 21, CURRENT_WEEKLY_CHALLENGE.rewardXP), {
        currentXP: 1,
        level: 23,
    });
});
