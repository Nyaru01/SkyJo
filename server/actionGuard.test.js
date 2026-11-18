import test from 'node:test';
import assert from 'node:assert/strict';
import { rejectGameAction } from './utils/actionGuard.js';
import { drawFromPile, endTurn } from '../src/lib/skyjoEngine.js';

const C = (value, isRevealed) => ({ id: `c-${Math.random()}`, value, isRevealed, color: 'green' });
const start = () => ({
    phase: 'PLAYING', turnPhase: 'DRAW', currentPlayerIndex: 0, finishingPlayerIndex: null, drawnCard: null,
    drawPile: Array.from({ length: 50 }, () => C(5, false)), discardPile: [C(3, true)],
    players: [
        { id: 'virgil', hand: [...Array(11)].map(() => C(2, true)).concat([C(4, false)]) },
        { id: 'melody', hand: [...Array(12)].map((_, i) => C(6, i < 4)) },
    ],
});
// Même enchaînement que le serveur pour « défausser puis retourner »
const revealHidden = (state, pIdx, cardIndex) => {
    const s = JSON.parse(JSON.stringify(state));
    s.players[pIdx].hand[cardIndex].isRevealed = true;
    s.turnPhase = 'DRAW';
    return endTurn(s);
};

test('un 2e « retourner » envoyé en double ne termine pas la manche à la place de l’adversaire', () => {
    let s = drawFromPile(start());
    s.discardPile.push({ ...s.drawnCard }); s.drawnCard = null; s.turnPhase = 'MUST_REVEAL';
    assert.equal(rejectGameAction(s, 0, 'reveal_hidden', { cardIndex: 11 }), null);
    s = revealHidden(s, 0, 11);
    assert.equal(s.phase, 'FINAL_ROUND');
    assert.equal(s.currentPlayerIndex, 1, 'Mélody doit jouer son dernier coup');
    // Le doublon arrive : il doit être refusé (avant, il terminait la manche)
    assert.notEqual(rejectGameAction(s, 0, 'reveal_hidden', { cardIndex: 11 }), null);
});

test('les actions hors tour ou à la mauvaise étape sont refusées', () => {
    const s = start();
    assert.notEqual(rejectGameAction(s, 1, 'draw_pile'), null, 'pas son tour');
    assert.equal(rejectGameAction(s, 0, 'draw_pile'), null);
    assert.notEqual(rejectGameAction(s, 0, 'replace_card', { cardIndex: 0 }), null, 'rien en main');
    assert.notEqual(rejectGameAction(s, 0, 'reveal_hidden', { cardIndex: 11 }), null, 'pas l’étape de révélation');
    assert.notEqual(rejectGameAction({ ...s, phase: 'FINISHED' }, 0, 'draw_pile'), null, 'manche finie');
    assert.equal(rejectGameAction({ ...s, phase: 'INITIAL_REVEAL' }, 1, 'reveal_initial', { cardIndices: [0, 1] }), null);
});
