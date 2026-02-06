import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useVirtualGameStore } from '../store/virtualGameStore';
import { useOnlineGameStore } from '../store/onlineGameStore';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';

export const MusicPlayer = () => {
    // 1. Manual Game Status
    const gameStatus = useGameStore(state => state.gameStatus);

    // 2. Virtual Game State (Local AI)
    const virtualGameState = useVirtualGameStore(state => state.gameState);

    // 3. Online Game State
    const onlineGameStarted = useOnlineGameStore(state => state.gameStarted);
    const musicShuffleTrigger = useGameStore(state => state.musicShuffleTrigger);

    // Consolidated "Is Playing" logic
    // We play music if ANY game mode is active
    // Note: We might want to refine this if the user is in the menu while a game is "technically" active in background,
    // but usually "gameStatus === PLAYING" implies the user is in the game flow.
    const isManualGamePlaying = gameStatus === 'PLAYING';
    const isVirtualGamePlaying = !!virtualGameState; // If gameState exists, we are in a game (or setup finishes)
    const isOnlineGamePlaying = !!onlineGameStarted;

    const shouldPlay = isManualGamePlaying || isVirtualGamePlaying || isOnlineGamePlaying;

    // Use the hook with the calculated state
    const { playRandomTrack } = useBackgroundMusic(shouldPlay);

    // Listen for manual shuffle triggers
    useEffect(() => {
        if (musicShuffleTrigger > 0) {
            playRandomTrack();
        }
    }, [musicShuffleTrigger, playRandomTrack]);

    // Render nothing (invisible component)
    return null;
};

export default MusicPlayer;
