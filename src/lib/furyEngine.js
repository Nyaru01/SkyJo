// Mode Fury : des cartes spéciales pour saboter le jeu de l'adversaire.
// Module à part, pour ne pas toucher aux règles des autres modes.
// - 12 cartes Fury (2 de chaque) mélangées dans la pioche (jamais distribuées ni défaussées).
// - Piocher une Fury l'envoie dans la réserve du joueur (3 au plus), puis on repioche.
// - Jouer une Fury remplace la pioche : le tour se termine ensuite.
// - 3 Fury utilisées au plus par manche et par joueur.
import { initializeGame, shuffleDeck, endTurn } from './skyjoEngine.js';

export const FURY_TYPES = {
    quake: { title: 'Séisme', text: 'Remet une colonne adverse à zéro', bubble: 'BOUM !', target: 'column' },
    curse: { title: 'Malédiction', text: 'Impose un +13 bloqué 3 tours', bubble: 'Hé hé…', target: 'card' },
    fog: { title: 'Brouillard', text: 'Recache 2 cartes adverses', bubble: 'Pouf !', target: 'player' },
    tornado: { title: 'Tornade', text: 'Mélange les cartes adverses', bubble: 'Whoosh !', target: 'player' },
    freeze: { title: 'Gel', text: 'Gèle une colonne adverse 2 tours', bubble: 'Crac !', target: 'column' },
    shield: { title: 'Bouclier', text: 'Annule la prochaine Fury reçue', bubble: 'Bloqué !', target: 'self' },
};
export const FURY_ORDER = ['quake', 'curse', 'fog', 'tornado', 'freeze', 'shield'];
export const FURY_RESERVE_MAX = 3;
export const FURY_USES_PER_ROUND = 3;
export const FURY_COPIES = 2;

const furyCard = (type, n) => ({ id: `fury-${type}-${n}`, value: 0, specialType: 'F', furyType: type, color: 'fury', isRevealed: false });
const emptyFury = () => ({ reserve: [], used: 0, shield: false });

export function initializeFuryGame(players, options = {}) {
    const base = initializeGame(players, options);
    const furies = FURY_ORDER.flatMap((type, i) => Array.from({ length: FURY_COPIES }, (_, k) => furyCard(type, i * FURY_COPIES + k)));
    return {
        ...base,
        isFuryMode: true,
        drawPile: shuffleDeck([...base.drawPile, ...furies]),
        players: base.players.map(p => ({ ...p, fury: emptyFury() })),
    };
}

const columnIndices = col => [col * 3, col * 3 + 1, col * 3 + 2];
const replacePlayer = (state, index, player) => {
    const players = [...state.players];
    players[index] = player;
    return { ...state, players };
};

// Avant une pioche normale : les Fury du dessus de la pioche vont dans la réserve du joueur.
// Réserve pleine : la carte retourne sous la pioche. Renvoie aussi les Fury gagnées (pour l'animation).
export function collectFuryFromPile(state) {
    if (!state.isFuryMode) return { state, gained: [] };
    let drawPile = [...state.drawPile];
    const index = state.currentPlayerIndex;
    const player = state.players[index];
    const fury = { ...(player.fury || emptyFury()), reserve: [...(player.fury?.reserve || [])] };
    const gained = [];
    const buried = [];
    while (drawPile.length && drawPile[drawPile.length - 1].specialType === 'F') {
        const card = drawPile.pop();
        if (fury.reserve.length < FURY_RESERVE_MAX) { fury.reserve.push(card); gained.push(card); } else buried.push(card);
    }
    drawPile = [...buried, ...drawPile];
    if (!gained.length && !buried.length) return { state, gained };
    return { state: replacePlayer({ ...state, drawPile }, index, { ...player, fury }), gained };
}

export function canPlayFury(state, playerIndex) {
    const fury = state.players[playerIndex]?.fury;
    return Boolean(state.isFuryMode && fury && state.currentPlayerIndex === playerIndex && state.turnPhase === 'DRAW'
        && (state.phase === 'PLAYING' || state.phase === 'FINAL_ROUND') && fury.reserve.length > 0 && fury.used < FURY_USES_PER_ROUND);
}

// Cibles valides d'une carte, pour l'interface et l'IA.
export function furyTargets(state, type, targetIndex) {
    const hand = state.players[targetIndex].hand;
    if (type === 'quake') return [0, 1, 2, 3].filter(col => columnIndices(col).some(i => hand[i]));
    if (type === 'freeze') return [0, 1, 2, 3].filter(col => columnIndices(col).some(i => hand[i] && hand[i].isRevealed));
    // Malédiction : seulement sur une carte déjà révélée. Sur une carte cachée, le +13 visible pourrait
    // retourner la dernière carte de l'adversaire et terminer la manche à sa place.
    if (type === 'curse') return hand.map((c, i) => (c && c.isRevealed && !(c.lockCount > 0) && !c.isCursed ? i : -1)).filter(i => i >= 0);
    return [];
}

function applyEffect(state, type, targetIndex, target) {
    const victim = state.players[targetIndex];
    const hand = [...victim.hand];
    let drawPile = [...state.drawPile];
    const detail = { type, targetIndex, cards: [] };

    if (type === 'quake') {
        // Les cartes de la colonne repartent sous la pioche, remplacées par des cartes cachées.
        const col = target ?? furyTargets(state, 'quake', targetIndex)[0];
        detail.column = col;
        const back = [];
        columnIndices(col).forEach(i => {
            if (!hand[i]) return;
            back.push({ ...hand[i], isRevealed: false, lockCount: 0 });
            let next = drawPile.pop();
            while (next && next.specialType === 'F') { back.push(next); next = drawPile.pop(); }
            hand[i] = next ? { ...next, isRevealed: false } : hand[i];
            detail.cards.push(i);
        });
        drawPile = [...back.filter(c => c.specialType !== 'F'), ...back.filter(c => c.specialType === 'F'), ...drawPile];
    } else if (type === 'curse') {
        const i = target ?? furyTargets(state, 'curse', targetIndex)[0];
        const old = hand[i];
        if (old) drawPile = [{ ...old, isRevealed: false, lockCount: 0 }, ...drawPile];
        hand[i] = { id: `curse-${Date.now()}-${i}`, value: 13, specialType: null, color: 'darkred', isRevealed: true, lockCount: 3, isCursed: true };
        detail.cards.push(i);
    } else if (type === 'fog') {
        const revealed = hand.map((c, i) => (c && c.isRevealed && !(c.lockCount > 0) ? i : -1)).filter(i => i >= 0);
        shuffleDeck(revealed).slice(0, 2).forEach(i => { hand[i] = { ...hand[i], isRevealed: false }; detail.cards.push(i); });
    } else if (type === 'tornado') {
        const slots = hand.map((c, i) => (c ? i : -1)).filter(i => i >= 0);
        const mixed = shuffleDeck(slots.map(i => hand[i]));
        slots.forEach((slot, k) => { hand[slot] = mixed[k]; });
        detail.cards = slots;
    } else if (type === 'freeze') {
        const col = target ?? furyTargets(state, 'freeze', targetIndex)[0];
        detail.column = col;
        columnIndices(col).forEach(i => {
            if (hand[i] && hand[i].isRevealed) { hand[i] = { ...hand[i], lockCount: Math.max(hand[i].lockCount || 0, 2), isFrozen: true }; detail.cards.push(i); }
        });
    }
    return { state: replacePlayer({ ...state, drawPile }, targetIndex, { ...victim, hand }), detail };
}

// Joue la carte Fury n° reserveIndex du joueur courant. Le tour se termine ensuite.
export function playFury(state, reserveIndex, targetIndex, target = null) {
    const me = state.currentPlayerIndex;
    if (!canPlayFury(state, me)) throw new Error('Aucune carte Fury jouable maintenant.');
    const player = state.players[me];
    const card = player.fury.reserve[reserveIndex];
    if (!card) throw new Error('Carte Fury introuvable.');
    const type = card.furyType;
    const reserve = player.fury.reserve.filter((_, i) => i !== reserveIndex);
    let next = replacePlayer(state, me, { ...player, fury: { ...player.fury, reserve, used: player.fury.used + 1, shield: type === 'shield' ? true : player.fury.shield } });
    let result = { type, by: me, targetIndex: type === 'shield' ? me : targetIndex, blocked: false, cards: [] };

    if (type !== 'shield') {
        if (targetIndex === me) throw new Error('Choisissez un adversaire.');
        const victim = next.players[targetIndex];
        const needs = FURY_TYPES[type].target;
        if (needs === 'column' || needs === 'card') {
            const valid = furyTargets(next, type, targetIndex);
            if (valid.length === 0) throw new Error('Aucune cible possible pour cette carte.');
            if (target !== null && target !== undefined && !valid.includes(target)) {
                throw new Error(type === 'curse' ? 'Visez une carte déjà retournée.' : 'Cette colonne ne peut pas être visée.');
            }
        }
        if (victim.fury?.shield) {
            // Le bouclier encaisse l'attaque et disparaît.
            next = replacePlayer(next, targetIndex, { ...victim, fury: { ...victim.fury, shield: false } });
            result = { ...result, blocked: true };
        } else {
            const applied = applyEffect(next, type, targetIndex, target);
            next = applied.state;
            result = { ...result, ...applied.detail };
        }
    }
    const ended = endTurn({ ...next, drawnCard: null, lastFury: { ...result, at: Date.now() } });
    return { state: ended, result };
}

// IA : estime, pour chaque Fury et chaque cible, combien de points elle fait perdre à l'adversaire,
// et ne joue que si le coup vaut mieux qu'une pioche normale. Renvoie { reserveIndex, targetIndex, target } ou null.
const HIDDEN_EV = 5; // valeur moyenne d'une carte cachée
const sameValuePair = cards => cards.length >= 2 && cards.some((c, k) => cards.some((d, j) => j !== k && d.value === c.value));

export function scoreFuryMove(state, aiIndex, type, target) {
    const oppIndex = state.players.findIndex((_, i) => i !== aiIndex);
    const opp = state.players[oppIndex];
    const hand = opp.hand;
    const hidden = hand.filter(c => c && !c.isRevealed).length;
    // Plus l'adversaire est près de finir la manche, plus le ralentir compte.
    const urgency = hidden <= 1 ? 6 : hidden <= 3 ? 3 : hidden <= 5 ? 1 : 0;
    const colCards = col => columnIndices(col).map(i => hand[i]).filter(c => c && c.isRevealed && !c.isCursed);
    if (type === 'shield') {
        const threat = (opp.fury?.reserve.length || 0) > 0 && (opp.fury?.used || 0) < FURY_USES_PER_ROUND;
        return state.players[aiIndex].fury.shield || !threat ? -1 : 5 + (opp.fury.reserve.length - 1) * 2;
    }
    if (opp.fury?.shield) return 1; // l'attaque finira sur le bouclier : seulement pour le retirer
    if (type === 'quake') {
        const cards = colCards(target);
        const gain = cards.reduce((s, c) => s + (HIDDEN_EV - c.value), 0);
        return gain + (sameValuePair(cards) ? 6 : 0) + cards.length * (urgency / 2);
    }
    if (type === 'curse') {
        const card = hand[target];
        const others = columnIndices(Math.floor(target / 3)).filter(i => i !== target).map(i => hand[i]).filter(c => c && c.isRevealed);
        return 13 - card.value + (others.some(c => c.value === card.value) ? 5 : 0);
    }
    if (type === 'freeze') {
        const cards = colCards(target);
        // Bloque une mauvaise carte que l'adversaire voudrait remplacer, ou une paire prête à être complétée.
        const stuck = cards.reduce((s, c) => s + Math.max(0, c.value - 6), 0);
        return stuck * 0.8 + (sameValuePair(cards) && cards.length === 2 ? 4 : 0) + (cards.length ? urgency / 2 : -1);
    }
    if (type === 'fog') {
        const revealed = hand.filter(c => c && c.isRevealed && !(c.lockCount > 0)).length;
        return revealed < 2 ? -1 : urgency * 1.2 + 1;
    }
    if (type === 'tornado') {
        const pairs = [0, 1, 2, 3].filter(col => sameValuePair(colCards(col))).length;
        const low = hand.filter(c => c && c.isRevealed && c.value <= 2).length;
        return pairs * 5 + low * 0.5 + urgency;
    }
    return -1;
}

export function decideFuryAction(state, aiIndex) {
    if (!canPlayFury(state, aiIndex)) return null;
    const reserve = state.players[aiIndex].fury.reserve;
    const oppIndex = state.players.findIndex((_, i) => i !== aiIndex);
    let best = null;
    reserve.forEach((card, reserveIndex) => {
        const type = card.furyType;
        const t = FURY_TYPES[type].target;
        const targets = t === 'column' || t === 'card' ? furyTargets(state, type, oppIndex) : [null];
        targets.forEach(target => {
            const value = scoreFuryMove(state, aiIndex, type, target);
            if (!best || value > best.value) best = { value, reserveIndex, targetIndex: type === 'shield' ? aiIndex : oppIndex, target };
        });
    });
    // Jouer une Fury coûte la pioche du tour : il faut que ça vaille plus. Réserve pleine : on est moins exigeant.
    if (!best || best.value < (reserve.length >= FURY_RESERVE_MAX ? 2 : 5)) return null;
    const { reserveIndex, targetIndex, target } = best;
    return target === null ? { reserveIndex, targetIndex } : { reserveIndex, targetIndex, target };
}
