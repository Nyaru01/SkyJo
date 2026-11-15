// Résumé court du dernier coup de l'IA, pour que le joueur comprenne ce qui vient de se passer.
const v = value => (typeof value === 'number' ? String(value) : '?');

export function describeAiMove(move) {
    if (!move) return '';
    if (move.kind === 'replace') {
        return move.oldHidden
            ? `L’IA pose un ${v(move.card)} (un ${v(move.old)} défaussé)`
            : `L’IA remplace son ${v(move.old)} par un ${v(move.card)}`;
    }
    if (move.kind === 'discard') return `L’IA défausse le ${v(move.card)}, retourne un ${v(move.revealed)}`;
    return '';
}
