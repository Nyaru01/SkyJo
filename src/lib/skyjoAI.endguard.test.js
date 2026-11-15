import test from 'node:test';
import assert from 'node:assert/strict';
import { decideCardAction } from './skyjoAI.js';

const H = (value, isRevealed = true) => ({ id: `c-${Math.random()}`, value, isRevealed });

test("l'IA ne retourne pas sa dernière carte cachée quand elle perd nettement (score doublé)", () => {
    // IA : une seule carte cachée, ~30 pts ; adversaire ~16 pts visibles.
    const ai = [H(-1), H(1), H(2), H(0), H(3), H(0), H(3), H(3), H(9, false), H(1), H(4), H(4)];
    const me = [H(0), H(1), H(2), H(1), H(0), H(1), H(2), H(3), H(0), H(1), H(2), H(3)];
    for (const difficulty of ['normal', 'hard', 'hardcore']) {
        const state = { phase: 'PLAYING', turnPhase: 'REPLACE_OR_DISCARD', currentPlayerIndex: 1, drawnCard: H(9),
            drawPile: Array.from({ length: 80 }, () => H(5, false)), discardPile: [H(6)],
            players: [{ id: 'human-1', hand: me }, { id: 'ai-1', hand: ai }] };
        const decision = decideCardAction(state, difficulty);
        assert.notEqual(decision.cardIndex, 8, difficulty);
        assert.equal(decision.action, 'REPLACE', difficulty);
    }
});
