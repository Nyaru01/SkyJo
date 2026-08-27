import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProfileSyncPayload, mergeCloudProfile } from './profileSync.js';

const state = {
    level: 21,
    currentXP: 6,
    lastAcknowledgedLevel: 21,
    weeklyChallengeWinDate: '2026-08-20',
    weeklyChallengeId: 'previous_season',
    profileLoadedFromBackend: false,
    userProfile: {
        id: 'user-1',
        name: 'Kiki',
        emoji: '🐱',
        avatarId: 'cat',
        vibeId: '#ABC123',
    },
};

test('envoie la date et l’identifiant du défi dans le profil', () => {
    const payload = buildProfileSyncPayload(state);
    assert.equal(payload.weeklyChallengeWinDate, '2026-08-20');
    assert.equal(payload.weeklyChallengeId, 'previous_season');
    assert.equal(payload.xp, 6);
});

test('synchronise le défi cloud même si le niveau et les XP sont identiques', () => {
    const merged = mergeCloudProfile(state, {
        name: 'Kiki',
        level: 21,
        xp: 6,
        weekly_challenge_win_date: '2026-08-27T00:00:00.000Z',
        weekly_challenge_id: 'equinoxe_2026',
    });

    assert.equal(merged.level, 21);
    assert.equal(merged.currentXP, 6);
    assert.equal(merged.weeklyChallengeWinDate, '2026-08-27');
    assert.equal(merged.weeklyChallengeId, 'equinoxe_2026');
    assert.equal(merged.profileLoadedFromBackend, true);
});
