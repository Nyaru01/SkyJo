import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeFuryGame, collectFuryFromPile, playFury, canPlayFury, decideFuryAction, furyTargets, FURY_USES_PER_ROUND } from './furyEngine.js';

const players = [{ id: 'me', name: 'Moi' }, { id: 'ai', name: 'IA' }];
function ready(furyTypes = ['quake']) {
    const g = initializeFuryGame(players);
    const reserve = furyTypes.map((t, i) => ({ id: `f-${t}-${i}`, specialType: 'F', furyType: t, value: 0 }));
    const p0 = { ...g.players[0], fury: { reserve, used: 0, shield: false } };
    // Révèle toute la main de l'adversaire pour des cibles prévisibles.
    const p1 = { ...g.players[1], hand: g.players[1].hand.map((c, i) => ({ ...c, isRevealed: true, value: i % 4 })) };
    return { ...g, phase: 'PLAYING', turnPhase: 'DRAW', currentPlayerIndex: 0, players: [p0, p1] };
}

test('la pioche contient 12 Fury, jamais distribuées', () => {
    const g = initializeFuryGame(players);
    assert.equal(g.drawPile.filter(c => c.specialType === 'F').length, 12);
    assert.ok(g.players.every(p => p.hand.every(c => c.specialType !== 'F')));
    assert.ok(g.discardPile.every(c => c.specialType !== 'F'));
});

test('une Fury piochée va dans la réserve', () => {
    const g = ready([]);
    const top = { id: 'f-x', specialType: 'F', furyType: 'fog', value: 0 };
    const { state, gained } = collectFuryFromPile({ ...g, drawPile: [...g.drawPile.filter(c => c.specialType !== 'F'), top] });
    assert.equal(gained.length, 1);
    assert.equal(state.players[0].fury.reserve.length, 1);
    assert.notEqual(state.drawPile[state.drawPile.length - 1].specialType, 'F');
});

test('Séisme : la colonne visée est remplacée par des cartes cachées et le tour passe', () => {
    const g = ready(['quake']);
    const { state, result } = playFury(g, 0, 1, 2);
    assert.equal(result.column, 2);
    [6, 7, 8].forEach(i => assert.equal(state.players[1].hand[i].isRevealed, false));
    assert.equal(state.currentPlayerIndex, 1);
    assert.equal(state.players[0].fury.used, 1);
});

test('Malédiction : un +13 bloqué 3 tours', () => {
    const { state } = playFury(ready(['curse']), 0, 1, 4);
    const card = state.players[1].hand[4];
    assert.equal(card.value, 13);
    assert.equal(card.lockCount, 3);
});

test('Bouclier : la prochaine attaque est bloquée', () => {
    const g = ready(['quake']);
    const shielded = { ...g, players: [g.players[0], { ...g.players[1], fury: { reserve: [], used: 0, shield: true } }] };
    const before = shielded.players[1].hand.map(c => c.id).join();
    const { state, result } = playFury(shielded, 0, 1, 0);
    assert.equal(result.blocked, true);
    assert.equal(state.players[1].fury.shield, false);
    assert.equal(state.players[1].hand.map(c => c.id).join(), before);
});

test('Gel : seules les cartes révélées de la colonne sont bloquées', () => {
    const { state } = playFury(ready(['freeze']), 0, 1, 1);
    [3, 4, 5].forEach(i => assert.ok(state.players[1].hand[i].lockCount >= 1));
});

test('limite de 3 Fury par manche', () => {
    const g = ready(['fog']);
    const capped = { ...g, players: [{ ...g.players[0], fury: { ...g.players[0].fury, used: FURY_USES_PER_ROUND } }, g.players[1]] };
    assert.equal(canPlayFury(capped, 0), false);
});

test('le Bouclier en réserve bloque tout seul, quelle que soit sa place', () => {
    const g = ready(['quake']);
    const reserve = [{ id: 'x', specialType: 'F', furyType: 'fog' }, { id: 's', specialType: 'F', furyType: 'shield' }];
    const state = { ...g, players: [g.players[0], { ...g.players[1], fury: { reserve, used: 0, shield: false } }] };
    const before = state.players[1].hand.map(c => c.id).join();
    const { state: after, result } = playFury(state, 0, 1, 0);
    assert.equal(result.blocked, true);
    assert.equal(after.players[1].hand.map(c => c.id).join(), before);
    assert.deepEqual(after.players[1].fury.reserve.map(c => c.furyType), ['fog']);
    // Le Bouclier ne se joue pas à la main, et l'IA ne le joue pas.
    const own = { ...g, players: [{ ...g.players[0], fury: { reserve: [{ id: 's2', specialType: 'F', furyType: 'shield' }, ...g.players[0].fury.reserve], used: 0, shield: false } }, g.players[1]] };
    assert.throws(() => playFury(own, 0, 0));
    const aiTurn = { ...g, currentPlayerIndex: 1, players: [g.players[0], { ...g.players[1], fury: { reserve: [{ id: 's', specialType: 'F', furyType: 'shield' }], used: 0, shield: false } }] };
    assert.equal(decideFuryAction(aiTurn, 1), null);
});

test('pas de Fury pendant le dernier tour', () => {
    const g = ready(['fog']);
    assert.equal(canPlayFury({ ...g, phase: 'FINAL_ROUND', finishingPlayerIndex: 1 }, 0), false);
});

test('Malédiction : jamais sur une carte cachée (sinon la manche peut finir à la place de la victime)', () => {
    const g = ready(['curse']);
    // L'adversaire n'a plus qu'une carte cachée, en position 11.
    const hand = g.players[1].hand.map((c, i) => ({ ...c, isRevealed: i !== 11 }));
    const state = { ...g, players: [g.players[0], { ...g.players[1], hand }] };
    assert.equal(furyTargets(state, 'curse', 1).includes(11), false);
    assert.throws(() => playFury(state, 0, 1, 11));
});

test("l'IA vise la meilleure colonne adverse, jamais une colonne de mauvaises cartes", () => {
    const g = ready(['quake']);
    const values = [12, 11, 10, 0, 0, 5, 9, 9, 8, 7, 7, 7];
    const opp = { ...g.players[0], hand: g.players[0].hand.map((c, i) => ({ ...c, isRevealed: true, value: values[i] })) };
    const ai = { ...g.players[1], fury: { reserve: [{ id: 'q', specialType: 'F', furyType: 'quake' }], used: 0, shield: false } };
    const state = { ...g, currentPlayerIndex: 1, players: [opp, ai] };
    assert.deepEqual(decideFuryAction(state, 1), { reserveIndex: 0, targetIndex: 0, target: 1 });
    const bad = { ...state, players: [{ ...opp, hand: opp.hand.map(c => ({ ...c, value: 10 })) }, ai] };
    assert.equal(decideFuryAction(bad, 1), null);
});
