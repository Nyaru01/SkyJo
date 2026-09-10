import test from 'node:test';
import assert from 'node:assert/strict';
import { getPrestigeRewardForLevel, getPrestigeRewardsList } from './rewards.js';

test('Prestige I defines visible milestones from global level 201 through 300', () => {
    const rewards = getPrestigeRewardsList();
    assert.equal(rewards[0].globalLevel, 201);
    assert.equal(rewards.at(-1).globalLevel, 300);
    assert.equal(rewards.length, 6);
});

test('Prestige I returns a milestone only at its configured levels', () => {
    assert.equal(getPrestigeRewardForLevel(210)?.name, 'Insigne Aurore');
    assert.equal(getPrestigeRewardForLevel(211), null);
    assert.equal(getPrestigeRewardForLevel(300)?.name, 'Couronne Prestige I');
});
