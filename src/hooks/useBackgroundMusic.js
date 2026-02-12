import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';

const PLAYLIST = [
    '/Music/stranger-things-124008.mp3',
    '/Music/bathroom-chill-background-music-14977.mp3',
    '/Music/chill-lofi-347217.mp3',
    '/Music/reveil-239031.mp3',
    '/Music/scizzie - aquatic ambience.mp3',
    '/Music/lofi-piano-soulful-slow-music-260273.mp3',
    '/Music/GW1.mp3',
    '/Music/GW2.mp3',
    '/Music/fassounds-cutie-japan-lofi-402355.mp3',
    '/Music/lofi-chil.mp3',
    '/Music/postal-card-lofi-186313.mp3',
    '/Music/nostalgic.mp3',
    '/Music/Japanese Spring.mp3',
    '/Music/Down the Kuma.mp3'
];

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ============================================
// SHARED WEB AUDIO CONTEXT (for mobile compatibility)
// ============================================
let sharedAudioContext = null;
let audioContextUnlocked = false;

/**
 * Get or create the shared AudioContext
 */
const getAudioContext = () => {
    if (!sharedAudioContext) {
        try {
            sharedAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('WebAudio API not available');
            return null;
        }
    }
    return sharedAudioContext;
};

/**
 * Unlock AudioContext on first user interaction
 */
const unlockAudioContext = async () => {
    if (audioContextUnlocked) return true;

    const ctx = getAudioContext();
    if (!ctx) return false;

    if (ctx.state === 'suspended') {
        try {
            await ctx.resume();
            console.log('🎵 AudioContext resumed for background music');
        } catch (e) {
            console.log('Failed to resume AudioContext:', e);
            return false;
        }
    }

    audioContextUnlocked = true;
    return true;
};

// Set up unlock listeners once
if (typeof document !== 'undefined') {
    const unlockEvents = ['touchstart', 'touchend', 'click', 'keydown'];
    const handleUnlock = () => {
        unlockAudioContext();
        unlockEvents.forEach(event => {
            document.removeEventListener(event, handleUnlock, true);
        });
    };
    unlockEvents.forEach(event => {
        document.addEventListener(event, handleUnlock, { capture: true, passive: true });
    });
}

// Pre-loaded audio buffers
const audioBuffers = {};

/**
 * Load an audio file into a buffer
 */
const loadAudioBuffer = async (url) => {
    if (audioBuffers[url]) return audioBuffers[url];

    const ctx = getAudioContext();
    if (!ctx) return null;

    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        audioBuffers[url] = audioBuffer;
        console.log(`✓ Loaded music: ${url.split('/').pop()}`);
        return audioBuffer;
    } catch (e) {
        console.log(`Failed to load ${url}:`, e);
        return null;
    }
};

export const useBackgroundMusic = (shouldPlay = false) => {
    const sourceNodeRef = useRef(null);
    const gainNodeRef = useRef(null);
    const shuffledPlaylistRef = useRef(shuffleArray(PLAYLIST));
    const currentTrackIndexRef = useRef(0);
    const playTrackRef = useRef(null);
    const hasStartedSessionRef = useRef(false);
    const isLoadingRef = useRef(false);
    const shouldPlayRef = useRef(shouldPlay);

    const musicEnabled = useGameStore(state => state.musicEnabled);
    const [isPlaying, setIsPlaying] = useState(false);

    // Keep shouldPlayRef in sync
    shouldPlayRef.current = shouldPlay;

    const playGenerationRef = useRef(0);

    // Play a specific track using Web Audio API
    const playTrack = useCallback(async (trackUrl) => {
        const currentGeneration = ++playGenerationRef.current; // Increment generation

        const ctx = getAudioContext();
        if (!ctx) return;

        // Make sure AudioContext is running
        if (ctx.state === 'suspended') {
            try {
                await ctx.resume();
            } catch (e) {
                console.log('Could not resume AudioContext');
                return;
            }
        }

        // Stop current source immediately
        if (sourceNodeRef.current) {
            try {
                sourceNodeRef.current.onended = null;
                sourceNodeRef.current.stop();
            } catch (e) { }
            sourceNodeRef.current = null;
        }

        // Load buffer if not cached
        isLoadingRef.current = true;
        let buffer = null;
        try {
            buffer = await loadAudioBuffer(trackUrl);
        } catch (e) {
            console.error(`❌ [MUSIC] Critical load error for ${trackUrl}:`, e);
        }
        isLoadingRef.current = false;

        // If a new play request started while we were loading, abort this one
        if (currentGeneration !== playGenerationRef.current) {
            return;
        }

        if (!buffer) {
            console.warn(`⚠️ [MUSIC] Failed to load "${trackUrl.split('/').pop()}". Skipping to next track...`);
            // MOVE TO NEXT TRACK IMMEDIATELY IF LOAD FAILS
            if (shouldPlayRef.current && useGameStore.getState().musicEnabled) {
                currentTrackIndexRef.current++;
                if (currentTrackIndexRef.current >= PLAYLIST.length) {
                    shuffledPlaylistRef.current = shuffleArray(PLAYLIST);
                    currentTrackIndexRef.current = 0;
                }
                const nextTrack = shuffledPlaylistRef.current[currentTrackIndexRef.current];
                // Delay slightly to prevent infinite rapid loops if all files are missing
                setTimeout(() => {
                    if (playTrackRef.current) playTrackRef.current(nextTrack);
                }, 1000);
            }
            return;
        }

        // Check if we should still be playing
        if (!shouldPlayRef.current || !useGameStore.getState().musicEnabled) {
            return;
        }

        // Double check stop before creating new source (paranoid check)
        if (sourceNodeRef.current) {
            try {
                sourceNodeRef.current.onended = null;
                sourceNodeRef.current.stop();
            } catch (e) { }
        }

        // Create new source
        const source = ctx.createBufferSource();
        source.buffer = buffer;

        // Create/reuse gain node for volume control
        if (!gainNodeRef.current) {
            gainNodeRef.current = ctx.createGain();
            gainNodeRef.current.connect(ctx.destination);
        }
        gainNodeRef.current.gain.value = 0.3;

        source.connect(gainNodeRef.current);

        // Handle track end - play next track
        source.onended = () => {
            console.log('🎵 [MUSIC] Track ended, playing next...');
            // Only play next if we should still be playing
            if (shouldPlayRef.current && useGameStore.getState().musicEnabled) {
                currentTrackIndexRef.current++;
                if (currentTrackIndexRef.current >= PLAYLIST.length) {
                    shuffledPlaylistRef.current = shuffleArray(PLAYLIST);
                    currentTrackIndexRef.current = 0;
                }
                if (playTrackRef.current) {
                    playTrackRef.current(shuffledPlaylistRef.current[currentTrackIndexRef.current]);
                }
            }
        };

        source.start(0);
        sourceNodeRef.current = source;
        setIsPlaying(true);
        console.log(`🎵 [MUSIC] Now playing: ${trackUrl.split('/').pop()}`);
    }, []);

    // Keep ref in sync
    playTrackRef.current = playTrack;

    // Stop playback
    const stopPlayback = useCallback(() => {
        if (sourceNodeRef.current) {
            try {
                sourceNodeRef.current.onended = null; // Prevent triggering next track
                sourceNodeRef.current.stop();
            } catch (e) {
                // Already stopped
            }
            sourceNodeRef.current = null;
        }
        setIsPlaying(false);
    }, []);

    // Handle play/pause
    useEffect(() => {
        if (musicEnabled && shouldPlay) {
            // Start a new session
            if (!hasStartedSessionRef.current) {
                shuffledPlaylistRef.current = shuffleArray(PLAYLIST);
                currentTrackIndexRef.current = 0;
                hasStartedSessionRef.current = true;
            }

            // Start playing first track
            if (!isLoadingRef.current) {
                playTrack(shuffledPlaylistRef.current[currentTrackIndexRef.current]);
            }
        } else {
            stopPlayback();
            hasStartedSessionRef.current = false;
        }

        return () => {
            // Cleanup on unmount
        };
    }, [musicEnabled, shouldPlay, playTrack, stopPlayback]);

    // Handle visibility changes (Mobile/PWA background handling)
    useEffect(() => {
        const handleVisibilityChange = () => {
            const ctx = getAudioContext();
            if (!ctx) return;

            if (document.hidden) {
                console.log('🔇 [MUSIC] App hidden, suspending audio...');
                if (ctx.state === 'running') {
                    ctx.suspend().catch(e => console.log('Error suspending audio:', e));
                }
            } else {
                console.log('🔊 [MUSIC] App visible, resuming audio...');
                // Only resume if music is enabled and should be playing
                if (useGameStore.getState().musicEnabled && shouldPlayRef.current) {
                    if (ctx.state === 'suspended') {
                        ctx.resume().catch(e => console.log('Error resuming audio:', e));
                    }
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopPlayback();
        };
    }, [stopPlayback]);

    // Play random track manually
    const playRandomTrack = useCallback(() => {
        if (!musicEnabled) return;

        // Resume context just in case
        const ctx = getAudioContext();
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(console.error);
        }

        // Just pick next one in shuffle
        currentTrackIndexRef.current++;
        if (currentTrackIndexRef.current >= PLAYLIST.length) {
            shuffledPlaylistRef.current = shuffleArray(PLAYLIST);
            currentTrackIndexRef.current = 0;
        }
        playTrack(shuffledPlaylistRef.current[currentTrackIndexRef.current]);
    }, [musicEnabled, playTrack]);

    return {
        isPlaying,
        playRandomTrack
    };
};
