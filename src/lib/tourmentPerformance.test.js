import test from 'node:test';
import assert from 'node:assert/strict';
import { getTourmentPerformance } from './tourmentPerformance.js';

test('classe une victoire positive comme victoire de justesse', () => {
    assert.equal(getTourmentPerformance(1).id, 'survival');
    assert.equal(getTourmentPerformance(42).id, 'survival');
});

test('classe les scores de 0 à -49 comme bon début', () => {
    assert.equal(getTourmentPerformance(0).id, 'progress');
    assert.equal(getTourmentPerformance(-49).id, 'progress');
});

test('classe les scores de -50 à -99 comme maîtrise', () => {
    assert.equal(getTourmentPerformance(-50).id, 'mastery');
    assert.equal(getTourmentPerformance(-99).id, 'mastery');
});

test('classe -100 et moins comme domination absolue', () => {
    assert.equal(getTourmentPerformance(-100).id, 'absolute');
    assert.equal(getTourmentPerformance(-140).id, 'absolute');
});

test('refuse les scores invalides', () => {
    assert.equal(getTourmentPerformance(undefined), null);
    assert.equal(getTourmentPerformance('invalide'), null);
});
