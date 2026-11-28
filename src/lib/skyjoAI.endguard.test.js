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

test("l'IA remplace son 12 visible plutôt qu'un 2 pour amorcer une paire de 0", () => {
    const X = () => H(5, false);
    // index = colonne * 3 + rangée ; colonne 4 : 2, ?, 0 — poser le 0 sur le 2 ferait une paire de 0.
    const ai = [H(6), X(), H(-1), H(3), H(12), X(), H(0), X(), X(), H(2), X(), H(0)];
    const me = [H(-1), H(0), H(5), H(12), X(), X(), X(), X(), X(), H(-1), H(0), H(2)];
    for (const turnPhase of ['REPLACE_OR_DISCARD', 'MUST_REPLACE']) {
        const state = { phase: 'PLAYING', turnPhase, currentPlayerIndex: 1, drawnCard: H(0), isFuryMode: true,
            drawPile: Array.from({ length: 80 }, () => X()), discardPile: [H(2)],
            players: [{ id: 'human-1', hand: me }, { id: 'ai-1', hand: ai }] };
        assert.deepEqual(decideCardAction(state, 'hard'), { action: 'REPLACE', cardIndex: 4 }, turnPhase);
    }
});

// Position remontée par un joueur (Tourment) : l'IA remplaçait son 1 par un 6 pour ne pas finir,
// alors que ses deux colonnes nettoyées (−6) la mettaient devant.
const tourmentState = (me, aiColumns) => ({
    phase: 'PLAYING', turnPhase: 'REPLACE_OR_DISCARD', currentPlayerIndex: 1, isBonusMode: true, drawnCard: H(6),
    drawPile: Array.from({ length: 80 }, () => H(5, false)), discardPile: [H(3)],
    players: [{ id: 'human-1', hand: me, columnsCleared: 0 }, { id: 'ai-1', columnsCleared: aiColumns,
        hand: [null, null, null, null, null, null, H(2), H(2), H(9, false), H(1), H(-1), H(0)] }],
});

test("fin de manche : l'IA finit la manche quand ses colonnes nettoyées la mettent devant", () => {
    const me = [H(0), H(2), H(0), H(0), H(-1), H(5, false), H(-2), H(-1), H(0), H(0), H(0), H(2)];
    const decision = decideCardAction(tourmentState(me, 2), 'bonus');
    assert.deepEqual(decision, { action: 'DISCARD_AND_REVEAL', cardIndex: 8 });
});

test("fin de manche : les colonnes nettoyées comptent dans l'estimation (−3 chacune)", () => {
    // Adversaire à −6 visibles + 2 cartes cachées (≈ 4) ; IA à 4 visibles + 1 cachée (≈ 9), mais −6 de colonnes.
    const me = [H(-2), H(-2), H(5, false), H(-1), H(-1), H(5, false), H(0), H(0), H(0), H(0), H(0), H(0)];
    assert.equal(decideCardAction(tourmentState(me, 2), 'bonus').action, 'DISCARD_AND_REVEAL');
    // Sans les colonnes, l'IA est nettement derrière : elle garde la manche ouverte.
    assert.equal(decideCardAction(tourmentState(me, 0), 'bonus').action, 'REPLACE');
});
