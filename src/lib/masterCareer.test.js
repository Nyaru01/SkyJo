import test from 'node:test';
import assert from 'node:assert/strict';
import { getMasterProgress } from './masterCareer.js';

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

for (const [level, isUnlocked, masterLevel, cycle, completedPrestiges] of cases) {
    test(`calcule correctement le niveau global ${level}`, () => {
        assert.deepEqual(getMasterProgress(level), { isUnlocked, masterLevel, cycle, completedPrestiges });
    });
}
