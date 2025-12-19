/**
 * Hook for audio and haptic feedback
 * Provides sound effects and vibration for game events
 */

import { useGameStore } from '../store/gameStore';

// Simple beep using Web Audio API
const playBeep = (frequency = 440, duration = 100, volume = 0.3) => {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (e) {
        console.log('Audio not available');
    }
};

// Play audio file from public folder
const playAudioFile = (path, volume = 0.5) => {
    try {
        const audio = new Audio(path);
        audio.volume = volume;
        audio.play().catch(e => console.log('Audio playback failed:', e));
    } catch (e) {
        console.log('Audio file not available');
    }
};

// Vibration feedback (mobile only)
const vibrate = (pattern = 50) => {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};

/**
 * Custom hook for feedback effects
 * Respects the soundEnabled setting from the store
 */
export const useFeedback = () => {
    const soundEnabled = useGameStore(state => state.soundEnabled);

    // Success sound - higher pitch, pleasant
    const playSuccess = () => {
        if (!soundEnabled) return;
        playBeep(660, 80, 0.2);
        setTimeout(() => playBeep(880, 100, 0.2), 80);
        vibrate(50);
    };

    // Click sound - short tap
    const playClick = () => {
        if (!soundEnabled) return;
        playBeep(440, 50, 0.15);
        vibrate(30);
    };

    // Victory sound - custom audio file
    const playVictory = () => {
        if (!soundEnabled) return;
        playAudioFile('/Sounds/victory.mp3', 0.6);
        vibrate([50, 50, 100]);
    };

    // Start game sound - custom audio file
    const playStart = () => {
        if (!soundEnabled) return;
        playAudioFile('/Sounds/Start.mp3', 0.5);
        vibrate(50);
    };

    // Error sound - lower pitch
    const playError = () => {
        if (!soundEnabled) return;
        playBeep(220, 150, 0.2);
        vibrate([100, 50, 100]);
    };

    // Undo sound - descending
    const playUndo = () => {
        if (!soundEnabled) return;
        playBeep(440, 80, 0.15);
        setTimeout(() => playBeep(330, 80, 0.15), 80);
        vibrate(30);
    };

    return {
        playSuccess,
        playClick,
        playVictory,
        playStart,
        playError,
        playUndo,
        vibrate
    };
};

export default useFeedback;
