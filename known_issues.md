# Known Issues - Online Mode

## Persistent 0 Score at End of Round
**Severity**: High
**Status**: Unresolved
**Description**: 
At the end of an online round, the score displayed for the opponent (and possibly the local player) often remains at **0**, despite the game logic apparently calculating the score correctly on the server side.

### Observations
- The server logs indicate that scores are calculated (needs verification if the values are non-zero).
- The client-side "Round Finished" screen shows "Total: 0".
- The "Next Round" functionality works, suggesting the game state itself progresses, but the cumulative score data is either:
    1. Not sent correctly in the `game_update` or `game_started` events.
    2. Not correctly reading the persistent `dbId` vs `socketId` when mapping scores to players on the client.
    3. The cards are not fully "revealed" in the client's internal state logic at the exact moment of score calculation rendering.

- [~] **Persistance du Chat** : L'historique des messages privés est stocké localement. Bien que renforcé en v2.4.1, un nettoyage manuel du cache navigateur entraînera toujours la perte des messages faute de stockage permanent côté serveur.

### Potential Leads
- **Client-side ID Mismatch**: The client might be looking up scores using `socket.id` while the server sends them keyed by `dbId` (or vice versa), especially in the `VirtualGame.jsx` rendering logic.
- **Timing**: The score update event might arrive *after* the modal renders.
- **Data Structure**: Check if `totalScores` object is receiving string keys vs number keys consistent with the client's expectation.

### Reproduction Steps
1. Play a full round of Skyjo Online.
2. One player finishes (reveals all cards).
3. Observe the "Fin de la manche" screen.
4. Check the "Total" score displayed under the player names.
