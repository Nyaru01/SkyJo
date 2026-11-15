import test from 'node:test';
import assert from 'node:assert/strict';
import { decideCardAction } from './skyjoAI.js';

const H = (value, isRevealed = true) => ({ id: `c-${Math.random()}`, value, isRevealed });

test("l'IA ne remplace jamais son 5 par un 10 pour « commencer une colonne »", () => {
    const ai = [H(4), H(7, false), H(9, false), H(5), H(6, false), H(8, false), H(-2), H(5, false), H(2, false), H(6, false), H(9, false), H(3)];
    const me = [H(4), H(3), H(6, false), H(5, false), H(7, false), H(8, false), H(5, false), H(4, false), H(-1), H(0), H(-1), H(-1)];
    for (const difficulty of ['normal', 'hard', 'hardcore']) {
        const state = { phase: 'PLAYING', turnPhase: 'REPLACE_OR_DISCARD', currentPlayerIndex: 1, drawnCard: H(10),
            drawPile: Array.from({ length: 100 }, () => H(5, false)), discardPile: [H(2)],
            players: [{ id: 'human-1', hand: me }, { id: 'ai-1', hand: ai }] };
        const decision = decideCardAction(state, difficulty);
        assert.notEqual(decision.action === 'REPLACE' && decision.cardIndex === 3, true, difficulty);
    }
});
