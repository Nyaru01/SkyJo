export function getChestRevelations(gameState) {
    const seen = new Set();
    const chests = [];
    for (const player of gameState.players || []) {
        for (const card of player.hand || []) {
            if (!card || (card.specialType !== 'CH' && card.value !== 'CH') || seen.has(card.id)) continue;
            const result = gameState.chestResults?.[card.id];
            // Scores belong to the engine; never invent another random result in the UI.
            if (result !== -15 && result !== 15) continue;
            seen.add(card.id);
            chests.push({ id: card.id, playerName: player.name, result });
        }
    }
    return chests;
}
