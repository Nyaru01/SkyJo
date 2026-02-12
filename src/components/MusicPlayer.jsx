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

    // 4. Global UI state
    const activeTab = useGameStore(state => state.activeTab);
    const isPaused = useVirtualGameStore(state => state.isPaused);
    const isShowingVirtualGame = useVirtualGameStore(state => state.isShowingGame);

    // Consolidated "Is Playing" logic
    // We play music if ANY game mode is active AND the user is on the relevant screen
    const isManualGamePlaying = gameStatus === 'PLAYING' && (activeTab === 'game' || activeTab === 'home');
    const isVirtualGamePlaying = isShowingVirtualGame && activeTab === 'virtual' && !isPaused;
    const isOnlineGamePlaying = isShowingVirtualGame && activeTab === 'virtual';

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
