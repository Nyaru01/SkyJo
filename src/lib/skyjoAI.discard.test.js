import test from 'node:test';
import assert from 'node:assert/strict';
import { decideCardAction, decideDrawSource } from './skyjoAI.js';

const C = (value, isRevealed = true) => ({ id: `c-${Math.random()}`, value, isRevealed });
const parse = s => s.trim().split(/\s+/).map(t => (t === '?' ? C(5, false) : C(Number(t))));
const state = (aiHand, discard, meHand = parse('0 ? ? ? ? ? ? ? ? ? ? 1')) => ({
    phase: 'PLAYING', currentPlayerIndex: 1, drawPile: Array.from({ length: 80 }, () => C(5, false)),
    discardPile: [C(discard)], players: [{ id: 'human-1', hand: meHand }, { id: 'ai-1', hand: aiHand }],
});

// Cas trouvés par simulation : la défausse complète une colonne en sacrifiant une petite carte.
const CLEARS = [
    ['-2 1 8 -2 12 6 ? 2 ? 11 1 11', 11, 10], // 11 · 1 · 11 : l'11 sur le 1 élimine 23 points
    ['8 3 8 ? ? -1 6 ? 8 ? ? ?', 8, 1],        // 8 · 3 · 8
    ['? ? 0 5 5 4 7 ? 3 4 -2 4', 5, 5],        // 5 · 5 · 4
];

test("l'IA prend la défausse qui élimine une colonne, et la pose au bon endroit", () => {
    for (const difficulty of ['hard', 'hardcore', 'bonus']) {
        for (const [hand, discard, index] of CLEARS) {
            const base = state(parse(hand), discard);
            assert.equal(decideDrawSource({ ...base, turnPhase: 'DRAW', drawnCard: null }, difficulty), 'DISCARD_PILE', `${difficulty} ${hand}`);
            const d = decideCardAction({ ...base, discardPile: [], turnPhase: 'MUST_REPLACE', drawnCard: C(discard) }, difficulty);
            assert.deepEqual([d.action, d.cardIndex], ['REPLACE', index], `${difficulty} ${hand}`);
        }
    }
});

test("l'IA ne prend pas un 12 dans la défausse juste pour « bloquer »", () => {
    // L'adversaire montre deux 12 : avant, l'IA prenait le 12 alors qu'elle n'y gagnait rien.
    const me = parse('12 ? ? 12 ? ? ? ? ? ? ? ?');
    for (const difficulty of ['hardcore', 'bonus']) {
        const base = state(parse('12 5 ? ? ? ? ? ? ? ? ? ?'), 12, me);
        assert.equal(decideDrawSource({ ...base, turnPhase: 'DRAW', drawnCard: null }, difficulty), 'DRAW_PILE', difficulty);
    }
});
