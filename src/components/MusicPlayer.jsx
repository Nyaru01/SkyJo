import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useVirtualGameStore } from '../store/virtualGameStore';
import { useOnlineGameStore } from '../store/onlineGameStore';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';
import { createHomeMelody } from '../lib/homeMelody';

let homeMelody = null;

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

    // Mélodie douce des menus (synthétisée, hors ligne) : partout, sauf pendant une partie (playlist de jeu)
    const musicEnabled = useGameStore(state => state.musicEnabled);
    const playHomeMelody = musicEnabled && !shouldPlay;
    useEffect(() => {
        if (!homeMelody) homeMelody = createHomeMelody();
        if (!playHomeMelody) { homeMelody.stop(); return undefined; }
        homeMelody.start();
        // Les navigateurs bloquent le son avant le premier geste : on relance au premier toucher.
        const resume = () => homeMelody.start();
        const onVisibility = () => (document.hidden ? homeMelody.stop() : homeMelody.start());
        document.addEventListener('pointerdown', resume, { once: true });
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            document.removeEventListener('pointerdown', resume);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [playHomeMelody]);

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
