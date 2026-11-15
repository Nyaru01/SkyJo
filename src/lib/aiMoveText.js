// Résumé en clair du dernier coup de l'IA, pour que le joueur comprenne ce qui vient de se passer.
const v = value => (typeof value === 'number' ? String(value) : '?');


export function describeAiMove(move) {
    if (!move) return '';
    if (move.kind === 'replace') {
        return move.oldHidden
            ? `L’IA a posé son ${v(move.card)} sur une carte cachée (un ${v(move.old)}, défaussé)`
            : `L’IA a posé son ${v(move.card)} à la place de son ${v(move.old)}`;
    }
    if (move.kind === 'discard') return `L’IA a défaussé le ${v(move.card)} et retourné un ${v(move.revealed)}`;
    return '';
}
