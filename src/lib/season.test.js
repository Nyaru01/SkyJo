import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seasonForDate } from './season.js';

test('automne jusqu’au 20 décembre 2026', () => {
    assert.equal(seasonForDate(new Date(2026, 10, 14)), 'autumn');
    assert.equal(seasonForDate(new Date(2026, 11, 20)), 'autumn');
});

test('neige à partir du lundi 21 décembre 2026', () => {
    assert.equal(seasonForDate(new Date(2026, 11, 21)), 'winter');
    assert.equal(seasonForDate(new Date(2027, 0, 15)), 'winter');
    assert.equal(seasonForDate(new Date(2027, 2, 19)), 'winter');
});

test('printemps, été puis automne', () => {
    assert.equal(seasonForDate(new Date(2027, 2, 20)), 'spring');
    assert.equal(seasonForDate(new Date(2027, 5, 21)), 'summer');
    assert.equal(seasonForDate(new Date(2027, 8, 22)), 'autumn');
});
