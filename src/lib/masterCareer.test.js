import test from 'node:test';
import assert from 'node:assert/strict';
import { getCareerIdentity, getMasterProgress, getCareerTier } from './masterCareer.js';

const cases = [
    [99, false, 0, 0, 0],
    [100, true, 0, 0, 0],
    [101, true, 1, 1, 0],
    [199, true, 99, 1, 0],
    [200, true, 100, 1, 1],
    [201, true, 1, 2, 1],
    [299, true, 99, 2, 1],
    [300, true, 100, 2, 2]
];

test('les grades distinguent les joueurs, maîtres et tous les cycles prestige', () => {
    for (const level of [1, 60, 99]) assert.equal(getCareerTier(level), 'player');
    for (const level of [100, 198, 200]) assert.equal(getCareerTier(level), 'master');
    for (const level of [201, 300, 301, 401]) assert.equal(getCareerTier(level), 'prestige');
});

for (const [level, isUnlocked, masterLevel, cycle, completedPrestiges] of cases) {
    test(`calcule correctement le niveau global ${level}`, () => {
        assert.deepEqual(getMasterProgress(level), { isUnlocked, masterLevel, cycle, completedPrestiges });
    });
}

test('affiche le niveau global dans le grade Maître', () => {
    assert.equal(getCareerIdentity(99).label, 'Niveau 99');
    assert.equal(getCareerIdentity(100).label, 'Maître 100');
    assert.equal(getCareerIdentity(162).label, 'Maître 162');
    assert.equal(getCareerIdentity(200).label, 'Maître 200');
    assert.equal(getCareerIdentity(201).label, 'Prestige 1 · 1');
    assert.equal(getCareerIdentity(300).label, 'Prestige 1 · 100');
    assert.equal(getCareerIdentity(301).label, 'Prestige 2 · 1');
    assert.equal(getCareerIdentity(401).label, 'Prestige 3 · 1');
});
