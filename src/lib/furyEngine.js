// Mode Fury : des cartes spéciales pour saboter le jeu de l'adversaire.
// Module à part, pour ne pas toucher aux règles des autres modes.
// - 6 cartes Fury mélangées dans la pioche (jamais distribuées ni défaussées).
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

const furyCard = (type, n) => ({ id: `fury-${type}-${n}`, value: 0, specialType: 'F', furyType: type, color: 'fury', isRevealed: false });
const emptyFury = () => ({ reserve: [], used: 0, shield: false });

export function initializeFuryGame(players, options = {}) {
    const base = initializeGame(players, options);
    const furies = FURY_ORDER.map((type, i) => furyCard(type, i));
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

// IA : joue une Fury quand c'est rentable. Renvoie { reserveIndex, targetIndex, target } ou null.
export function decideFuryAction(state, aiIndex) {
    if (!canPlayFury(state, aiIndex)) return null;
    const reserve = state.players[aiIndex].fury.reserve;
    const oppIndex = state.players.findIndex((_, i) => i !== aiIndex);
    const opp = state.players[oppIndex];
    const pick = type => reserve.findIndex(c => c.furyType === type);
    const revealed = opp.hand.filter(c => c && c.isRevealed);

    // Bouclier : dès que l'adversaire a de quoi attaquer.
    if (pick('shield') >= 0 && !state.players[aiIndex].fury.shield && (opp.fury?.reserve.length || 0) > 0) return { reserveIndex: pick('shield'), targetIndex: aiIndex };
    // Séisme : sur la colonne la plus avancée (deux cartes révélées identiques ou très basses).
    if (pick('quake') >= 0) {
        const cols = furyTargets(state, 'quake', oppIndex).map(col => {
            const cards = columnIndices(col).map(i => opp.hand[i]).filter(c => c && c.isRevealed);
            const pair = cards.length >= 2 && cards.some((c, k) => cards.some((d, j) => j !== k && d.value === c.value));
            return { col, score: (pair ? 10 : 0) + cards.reduce((s, c) => s + (6 - c.value), 0) };
        }).sort((a, b) => b.score - a.score);
        if (cols[0] && cols[0].score >= 8) return { reserveIndex: pick('quake'), targetIndex: oppIndex, target: cols[0].col };
    }
    // Malédiction : sur sa meilleure carte révélée.
    if (pick('curse') >= 0) {
        const targets = furyTargets(state, 'curse', oppIndex).filter(i => opp.hand[i].isRevealed).sort((a, b) => opp.hand[a].value - opp.hand[b].value);
        if (targets.length && opp.hand[targets[0]].value <= 3) return { reserveIndex: pick('curse'), targetIndex: oppIndex, target: targets[0] };
    }
    if (pick('tornado') >= 0 && revealed.length >= 6) return { reserveIndex: pick('tornado'), targetIndex: oppIndex };
    if (pick('fog') >= 0 && revealed.length >= 5) return { reserveIndex: pick('fog'), targetIndex: oppIndex };
    if (pick('freeze') >= 0) {
        const cols = furyTargets(state, 'freeze', oppIndex);
        const high = cols.find(col => columnIndices(col).some(i => opp.hand[i] && opp.hand[i].isRevealed && opp.hand[i].value >= 9));
        if (high !== undefined) return { reserveIndex: pick('freeze'), targetIndex: oppIndex, target: high };
    }
    // Réserve pleine : on ne garde pas tout.
    if (reserve.length >= FURY_RESERVE_MAX) {
        const i = reserve.findIndex(c => c.furyType !== 'shield');
        if (i >= 0) {
            const type = reserve[i].furyType;
            const t = FURY_TYPES[type].target;
            const targets = t === 'column' || t === 'card' ? furyTargets(state, type, oppIndex) : [null];
            if (targets.length) return { reserveIndex: i, targetIndex: oppIndex, target: targets[0] };
        }
    }
    return null;
}
