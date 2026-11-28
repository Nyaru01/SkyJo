import test from 'node:test';
import assert from 'node:assert/strict';
import { decideCardAction, ensureLegalCardAction } from './skyjoAI.js';
import { replaceCard, discardAndReveal } from './skyjoEngine.js';

// Cas relevés par la simulation de 2 000 parties (Tourment et Fury) : chaque décision doit être un coup
// que le moteur accepte, sinon l'exception fige la partie pendant l'animation du tour de l'IA.
let n = 0;
const H = (value, isRevealed = true, extra = {}) => ({ id: `c-${n++}`, value, specialType: null, isRevealed, ...extra });
const state = (ai, me, extra = {}) => ({
    phase: 'PLAYING', turnPhase: 'REPLACE_OR_DISCARD', currentPlayerIndex: 1, finishingPlayerIndex: null,
    drawPile: Array.from({ length: 60 }, () => H(5, false)), discardPile: [H(7)],
    players: [{ id: 'human-1', hand: me }, { id: 'ai-1', hand: ai }], ...extra,
});
const play = (s, d) => (d.action === 'REPLACE' ? replaceCard(s, d.cardIndex) : discardAndReveal(s, d.cardIndex));

test("Tourment : le garde-fou de fin ne fait jamais poser une carte Échange", () => {
    const ai = [H(9), H(8), H(7), H(6), H(5), H(4), H(3), H(2), H(1), H(10), H(11), H(5, false)];
    const me = Array.from({ length: 12 }, () => H(0));
    const s = state(ai, me, { isBonusMode: true, drawnCard: { id: 'swap', value: 0, specialType: 'S', isRevealed: true } });
    for (const difficulty of ['bonus', 'hardcore', 'hard']) {
        assert.equal(decideCardAction(s, difficulty).action, 'DISCARD_AND_REVEAL', difficulty);
    }
});

test("Fury : l'IA ne vise pas une carte gelée pour compléter une colonne", () => {
    const frozen = { lockCount: 2, isFrozen: true };
    const ai = [H(0, true, frozen), H(0, true, frozen), H(9, false, frozen), H(3), H(4), H(6, false), H(8, false), H(2), H(-1), H(5, false), H(1), H(7, false)];
    const me = Array.from({ length: 12 }, () => H(1));
    const s = state(ai, me, { isFuryMode: true, drawnCard: H(0) });
    for (const difficulty of ['hard', 'hardcore', 'normal']) {
        const d = decideCardAction(s, difficulty);
        assert.doesNotThrow(() => play(s, d), `${difficulty} : ${JSON.stringify(d)}`);
    }
});

test('regroupement : la première carte cachée de la colonne 0 reste une cible', () => {
    const ai = [H(5, false), H(4), H(9), H(1), H(1), H(2, false), H(0), H(2), H(3, false), H(6, false), H(7, false), H(8, false)];
    const me = Array.from({ length: 12 }, () => H(2));
    const s = state(ai, me, { drawnCard: H(4) });
    const d = decideCardAction(s, 'hard');
    assert.doesNotThrow(() => play(s, d));
});

test('ensureLegalCardAction corrige un coup refusé par le moteur', () => {
    const ai = [H(20, true, { lockCount: 2 }), H(3), H(4, false), H(12), H(1), H(2), H(0), H(5), H(6), H(7), H(8), H(9)];
    const me = Array.from({ length: 12 }, () => H(1));
    const s = state(ai, me, { isBonusMode: true, drawnCard: H(2) });
    // Remplacer un Crâne verrouillé → la carte cachée est retournée à la place.
    assert.deepEqual(ensureLegalCardAction(s, { action: 'REPLACE', cardIndex: 0 }), { action: 'DISCARD_AND_REVEAL', cardIndex: 2 });
    // Défausse obligatoire impossible (carte prise en défausse) → remplacer la pire carte visible libre.
    const must = { ...s, turnPhase: 'MUST_REPLACE' };
    assert.deepEqual(ensureLegalCardAction(must, { action: 'DISCARD_AND_REVEAL', cardIndex: 2 }), { action: 'REPLACE', cardIndex: 3 });
    // Un coup déjà légal n'est pas modifié.
    assert.deepEqual(ensureLegalCardAction(s, { action: 'REPLACE', cardIndex: 3 }), { action: 'REPLACE', cardIndex: 3 });
});
