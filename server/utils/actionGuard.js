// Garde-fou des actions en ligne : le serveur n'accepte une action que du joueur dont c'est le tour,
// et seulement à la bonne étape du tour. Sans cela, une action envoyée deux fois (double appui pendant
// l'animation, renvoi réseau) était jouée pendant le tour de l'adversaire : un 2e « retourner » terminait
// son tour à sa place, et la manche finissait sans qu'il ait joué son dernier coup.

const ALLOWED_TURN_PHASES = {
    draw_pile: ['DRAW'],
    draw_discard: ['DRAW'],
    replace_card: ['REPLACE_OR_DISCARD', 'MUST_REPLACE'],
    discard_drawn: ['REPLACE_OR_DISCARD'],
    discard_and_reveal: ['REPLACE_OR_DISCARD'],
    reveal_hidden: ['MUST_REVEAL'],
    perform_swap: ['SPECIAL_ACTION_SWAP'],
    activate_black_hole: ['RESOLVE_BLACK_HOLE'],
    use_action_card: ['REPLACE_OR_DISCARD', 'MUST_REPLACE'],
    undo_draw_discard: ['MUST_REPLACE'],
};

/**
 * @returns {string|null} null si l'action est acceptée, sinon la raison du refus.
 */
export function rejectGameAction(gameState, playerIndex, action, payload = {}) {
    if (!gameState) return 'pas de partie';
    // Révélation initiale : simultanée, chacun pour soi.
    if (action === 'reveal_initial') return gameState.phase === 'INITIAL_REVEAL' ? null : 'révélation initiale terminée';
    // Fury : arbitrée par le moteur Fury dans le serveur.
    if (action === 'play_fury') return null;

    const phases = ALLOWED_TURN_PHASES[action];
    if (!phases) return `action inconnue : ${action}`;
    if (gameState.phase !== 'PLAYING' && gameState.phase !== 'FINAL_ROUND') return `manche non jouable (${gameState.phase})`;
    if (playerIndex !== gameState.currentPlayerIndex) return 'pas votre tour';
    if (!phases.includes(gameState.turnPhase)) return `étape ${gameState.turnPhase}`;
    if (action === 'reveal_hidden') {
        const card = gameState.players?.[playerIndex]?.hand?.[payload.cardIndex];
        if (!card || card.isRevealed) return 'carte déjà retournée';
    }
    if (action === 'replace_card' && !gameState.drawnCard) return 'aucune carte en main';
    return null;
}
