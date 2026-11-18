import test from 'node:test';
import assert from 'node:assert/strict';
import { decideCardAction } from './skyjoAI.js';

const H = (value, isRevealed = true) => ({ id: `c-${Math.random()}`, value, isRevealed });

// Cas réel : l'IA pioche un 4 alors qu'elle a déjà un 4 visible (index 9, colonne 4).
// Elle doit le poser dans cette colonne (index 10 ou 11), pas « commencer » une colonne encore cachée.
test("l'IA range un 4 sous son autre 4 plutôt que dans une colonne cachée", () => {
    const ai = [H(7, false), H(9, false), H(0), H(1, false), H(6, false), H(8, false), H(5, false), H(9, false), H(2, false), H(4), H(10, false), H(3, false)];
    const me = [H(-1), H(5, false), H(6, false), H(5, false), H(7, false), H(8, false), H(5, false), H(4, false), H(9, false), H(3, false), H(0), H(0)];
    for (const difficulty of ['hard', 'hardcore', 'bonus']) {
        const state = { phase: 'PLAYING', turnPhase: 'REPLACE_OR_DISCARD', currentPlayerIndex: 1, drawnCard: H(4),
            drawPile: Array.from({ length: 120 }, () => H(5, false)), discardPile: [H(3)],
            players: [{ id: 'human-1', hand: me }, { id: 'ai-1', hand: ai }] };
        const decision = decideCardAction(state, difficulty);
        assert.equal(decision.action, 'REPLACE', difficulty);
        assert.ok([10, 11].includes(decision.cardIndex), `${difficulty} : index ${decision.cardIndex}`);
    }
});
