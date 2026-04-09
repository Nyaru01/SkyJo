import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateRoundScore, checkStrictlyLowest } from '../lib/scoreUtils';

/**
 * Calculate total scores for all players across all rounds
 * @param {Array} players - Array of player objects with id
 * @param {Array} rounds - Array of round objects with scores
 * @returns {Object} Map of player id to total score
 */
const calculateTotals = (players, rounds) => {
    const totals = {};
    players.forEach(p => totals[p.id] = 0);
    rounds.forEach(r => {
        players.forEach(p => {
            totals[p.id] += r.scores[p.id] || 0;
        });
    });
    return totals;
};

/**
 * Check if any player has reached or exceeded the threshold
 */
const checkGameOver = (totals, threshold) => {
    return Object.values(totals).some(score => score >= threshold);
};

export const useGameStore = create(
    persist(
        (set, get) => ({
            // Initial clean state
            players: [],
            threshold: 100,
            rounds: [],
            gameStatus: 'SETUP',
            gameHistory: [], // Array of archived finished games
            achievements: [], // Array of unlocked achievements
            darkMode: true, // Always default to dark mode
            soundEnabled: true,
            musicEnabled: true,
            vibrationEnabled: true,
            hasSeenTutorial: false,
            hasSeenNewOnlineModeAnnouncement: false,
            hasSeenWeeklyChallengeAnnouncement: false,
            migratedToV2: false, // Flag for LocalStorage -> DB migration
            isRehydrated: false, // Flag to track when store is ready
            profileLoadedFromBackend: false, // Prevent early sync from overwriting DB
            cardSkin: 'classic', // classic, papyrus
            background: '/Wallpapers/bg-skyjo.png', // Default background
            isAdminOpen: false, // Global admin status
            adminAuthToken: null, // Admin session token
            musicShuffleTrigger: 0, // Increment to trigger track shuffle
            activeTab: 'home', // 'home', 'game', 'stats', 'community', 'virtual'
            setActiveTab: (tab) => set({ activeTab: tab }),
            lastDailyWinDate: null, // ISO date string of last daily challenge win
            weeklyChallengeWinDate: null, // ISO date string of last weekly challenge win
            userProfile: {
                id: `u-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: '',
                avatarId: 'cat',
                emoji: '🐱',
                vibeId: '',
                level: 1,
                currentXP: 0,
                isLinked: false,
                firebase_uid: null
            },

            // Transition logic for V2
            runMigration: async () => {
                const state = get();
                if (state.migratedToV2) return;

                console.log('[MIGRATION] Starting migration to V2...');
                try {
                    const response = await fetch('/api/social/migrate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: state.userProfile.id,
                            profile: state.userProfile,
                            history: state.gameHistory
                        })
                    });

                    if (response.ok) {
                        set({ migratedToV2: true });
                        console.log('[MIGRATION] Successfully moved local data to database.');
                    }
                } catch (err) {
                    console.error('[MIGRATION] Failed to migrate:', err);
                }
            },

            setCardSkin: (skin) => set({ cardSkin: skin }),

            setBackground: (bg) => set({ background: bg }),

            setIsRehydrated: (val) => set({ isRehydrated: val }),

            setIsFeedbackOpen: (open) => set({ isFeedbackOpen: open }),

            setHasSeenTutorial: (seen) => set({ hasSeenTutorial: seen }),

            setHasSeenNewOnlineModeAnnouncement: (seen) => set({ hasSeenNewOnlineModeAnnouncement: seen }),

            setHasSeenWeeklyChallengeAnnouncement: (seen) => set({ hasSeenWeeklyChallengeAnnouncement: seen }),

            setIsAdminOpen: (open) => set({ isAdminOpen: open }),

            setAdminAuthToken: (token) => set({ adminAuthToken: token }),

            isWallpaperModalOpen: false,
            setIsWallpaperModalOpen: (open) => set({ isWallpaperModalOpen: open }),

            // XP & Level System
            // Note: We'll keep these values in parallel with userProfile for backward compatibility 
            // but sync them to userProfile when they change
            level: 1,
            lastAcknowledgedLevel: 1,
            currentXP: 0,

            generateSkyId: () => {
                const { userProfile, syncProfileWithBackend } = get();
                if (userProfile.vibeId) return;
                const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
                const newVibeId = `#${randomPart}`;
                set(state => ({
                    userProfile: { ...state.userProfile, vibeId: newVibeId }
                }));
                // Sync after ID generation
                syncProfileWithBackend();
            },

            updateUserProfile: (updates) => {
                if (updates.name && updates.name.trim().toLowerCase() === 'joueur') {
                    return; // Block 'Joueur' name
                }
                set(state => ({
                    userProfile: { ...state.userProfile, ...updates }
                }));
                // Sync after update
                get().syncProfileWithBackend();
            },

            forceRestoreProfile: async (serverData) => {
                console.log('[STORE] 🔄 FORCING PROFILE RESTORE:', serverData);
                // Atomic update of the profile to avoid partial sync conflicts
                set(state => ({
                    level: serverData.level || state.level,
                    currentXP: serverData.xp || state.currentXP,
                    lastAcknowledgedLevel: serverData.level || state.level,
                    userProfile: {
                        ...state.userProfile,
                        id: serverData.id,
                        name: serverData.name || '',
                        emoji: serverData.emoji || state.userProfile.emoji,
                        avatarId: serverData.avatar_id || state.userProfile.avatarId,
                        vibeId: serverData.vibe_id || serverData.vibeId || '',
                        level: serverData.level || state.level,
                        currentXP: serverData.xp || state.currentXP,
                        isLinked: true,
                        firebase_uid: serverData.firebase_uid || serverData.firebaseUid
                    }
                }));

                // We don't call syncProfileWithBackend here because we JUST got the data from the backend
            },

            syncProfileWithBackend: async () => {
                const state = get();
                let { userProfile, level, currentXP, profileLoadedFromBackend } = state;

                // CRITICAL: If we haven't loaded from backend yet in this session, 
                // do NOT sync local state to backend as it might overwrite higher values 
                // before we've had a chance to read them.
                if (!profileLoadedFromBackend) {
                    console.log('[STORE] ⏸ Skipping push sync: Backend data not yet loaded into session');
                    return;
                }

                // Safety: Ensure ID exists before syncing
                if (!userProfile?.id) {
                    const newId = `u-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    console.warn('[STORE] Fixed missing user ID:', newId);

                    set(state => ({
                        userProfile: {
                            ...state.userProfile,
                            id: newId,
                            name: state.userProfile?.name && state.userProfile.name.toLowerCase() !== 'joueur' ? state.userProfile.name : '',
                            avatarId: state.userProfile?.avatarId || 'cat',
                            emoji: state.userProfile?.emoji || '🐱',
                            level: state.level,
                            currentXP: state.currentXP
                        }
                    }));
                    userProfile = get().userProfile;
                }

                // CRITICAL: Map currentXP to xp for backend column naming
                const profileWithLatestStats = {
                    ...userProfile,
                    level: level,
                    xp: currentXP,
                    weeklyChallengeWinDate: state.weeklyChallengeWinDate
                };

                try {
                    const response = await fetch('/api/social/profile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(profileWithLatestStats)
                    });

                    if (response.ok) {
                        console.log('[STORE] ✅ Profile sync success:', profileWithLatestStats);
                    } else {
                        const errorData = await response.json().catch(() => ({}));
                        console.error('[STORE] ❌ Profile sync failed:', response.status, errorData);
                    }
                } catch (err) {
                    console.error('[STORE] ❌ Sync error (fetch):', err);
                }
            },

            loadProfileFromBackend: async () => {
                const { userProfile } = get();
                if (!userProfile?.id) return;

                try {
                    const res = await fetch(`/api/social/profile/${userProfile.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        console.log('[STORE] Profile data received from backend:', data);

                        // Mark as loaded even if no update needed, so subsequent syncs are allowed
                        set({ profileLoadedFromBackend: true });

                        // Only update if data is valid and different
                        if (data) {
                            // Ensure we have numbers and not NULLs from DB
                            const newLevel = (data.level !== undefined && data.level !== null) ? Number(data.level) : get().level;
                            const newXP = (data.xp !== undefined && data.xp !== null) ? Number(data.xp) : get().currentXP;

                            if (newLevel !== get().level || newXP !== get().currentXP) {
                                console.log(`[STORE] 🔄 LOCAL STATE UPDATE from backend: Level ${get().level}->${newLevel}, XP ${get().currentXP}->${newXP}`);

                                const currentLastAck = get().lastAcknowledgedLevel;
                                const fixedLastAck = currentLastAck > newLevel ? newLevel : currentLastAck;

                                set(state => ({
                                    level: newLevel,
                                    currentXP: newXP,
                                    lastAcknowledgedLevel: fixedLastAck,
                                    userProfile: {
                                        ...state.userProfile,
                                        name: data.name || state.userProfile.name,
                                        emoji: data.emoji || state.userProfile.emoji,
                                        avatarId: data.avatar_id || state.userProfile.avatarId,
                                        vibeId: data.vibe_id || state.userProfile.vibeId,
                                        level: newLevel,
                                        currentXP: newXP
                                    },
                                    weeklyChallengeWinDate: data.weekly_challenge_win_date ? new Date(data.weekly_challenge_win_date).toISOString().split('T')[0] : state.weeklyChallengeWinDate
                                }));
                            }
                        }
                    } else if (res.status === 404) {
                        // User not in DB yet, allowed to sync local state
                        console.log('[STORE] User not found in DB, allowing initial sync');
                        set({ profileLoadedFromBackend: true });
                    } else {
                        console.error('[STORE] Failed to load profile from backend:', res.status);
                    }
                } catch (err) {
                    console.error('[STORE] Load profile error:', err);
                }
            },

            /**
             * Add XP points (called on victory)
             * @param {number} amount - XP to add (default 1)
             */
            addXP: (amount = 1) => {
                const { currentXP, level, syncProfileWithBackend } = get();
                let newXP = currentXP + amount;
                let newLevel = level;

                if (newXP >= 10) {
                    newXP -= 10;
                    newLevel += 1;
                }

                set(state => ({
                    currentXP: newXP,
                    level: newLevel,
                    userProfile: {
                        ...state.userProfile,
                        level: newLevel,
                        currentXP: newXP
                    }
                }));

                console.log(`[STORE] addXP(+${amount}): OldXP=${currentXP} -> NewXP=${newXP}, NewLevel=${newLevel}`);

                // Sync XP/Level change
                syncProfileWithBackend();
            },

            /**
             * Mark daily challenge as completed for today
             */
            markDailyWin: () => {
                set({ lastDailyWinDate: new Date().toISOString().split('T')[0] });
            },

            /**
             * Mark weekly challenge as completed for today
             */
            markWeeklyWin: () => {
                set({ weeklyChallengeWinDate: new Date().toISOString().split('T')[0] });
                // Trigger sync to persist in DB
                get().syncProfileWithBackend();
            },

            /**
             * Acknowledge that the user has seen the level up reward
             */
            acknowledgeLevelUp: () => {
                set({ lastAcknowledgedLevel: get().level });
            },

            /**
             * Reset XP and Level (for testing/admin)
             */
            resetXP: () => set({ currentXP: 0, level: 1, lastAcknowledgedLevel: 1 }),

            /**
             * Debug: Force level up
             */
            debugLevelUp: () => {
                const { level, userProfile, lastAcknowledgedLevel } = get();
                const newLevel = level + 1;
                // Force triggering by ensuring lastAcknowledged is lower than new level
                // This fixes issues where manual DB edits left lastAcknowledged higher than current level
                const fixedLastAck = Math.min(lastAcknowledgedLevel, newLevel - 1);

                set({
                    level: newLevel,
                    currentXP: 0,
                    lastAcknowledgedLevel: fixedLastAck,
                    userProfile: { ...userProfile, level: newLevel, currentXP: 0 }
                });
            },

            toggleDarkMode: () => {
                const newMode = !get().darkMode;
                document.documentElement.classList.toggle('dark', newMode);
                set({ darkMode: newMode });
            },

            toggleSound: () => set({ soundEnabled: !get().soundEnabled }),

            toggleMusic: () => set({ musicEnabled: !get().musicEnabled }),

            toggleVibration: () => set({ vibrationEnabled: !get().vibrationEnabled }),

            triggerMusicShuffle: () => set(state => ({ musicShuffleTrigger: state.musicShuffleTrigger + 1 })),

            setConfiguration: (playerData, threshold) => {
                const players = playerData.map((p, index) => ({
                    id: `p${Date.now()}-${index}`,
                    name: p.name || `Player ${index + 1}`,
                    emoji: p.emoji || '👤',
                    avatarId: p.avatarId || 'cat'
                }));
                set({
                    players,
                    threshold: Number(threshold) || 100,
                    rounds: [],
                    gameStatus: 'PLAYING'
                });
            },

            addRound: (rawScores, finisherId) => {
                const { rounds, players, threshold } = get();

                const isStrictlyLowest = checkStrictlyLowest(finisherId, rawScores);

                const finalScores = {};
                players.forEach(p => {
                    const raw = rawScores[p.id];
                    const isFinisher = p.id === finisherId;
                    finalScores[p.id] = calculateRoundScore(raw, isFinisher, isStrictlyLowest);
                });

                const newRound = {
                    id: `r${Date.now()}`,
                    rawScores,
                    scores: finalScores,
                    finisherId,
                    isStrictlyLowest
                };

                const nextRounds = [...rounds, newRound];
                const totals = calculateTotals(players, nextRounds);
                const isGameOver = checkGameOver(totals, threshold);

                set({
                    rounds: nextRounds,
                    gameStatus: isGameOver ? 'FINISHED' : 'PLAYING'
                });
            },

            deleteRound: (roundId) => {
                const { rounds, threshold, players } = get();
                const nextRounds = rounds.filter(r => r.id !== roundId);
                const totals = calculateTotals(players, nextRounds);
                const isGameOver = checkGameOver(totals, threshold);

                set({
                    rounds: nextRounds,
                    gameStatus: isGameOver ? 'FINISHED' : 'PLAYING'
                });
            },

            undoLastRound: () => {
                const { rounds, threshold, players } = get();
                if (rounds.length === 0) return;

                const nextRounds = rounds.slice(0, -1);
                const totals = calculateTotals(players, nextRounds);
                const isGameOver = checkGameOver(totals, threshold);

                set({
                    rounds: nextRounds,
                    gameStatus: isGameOver ? 'FINISHED' : 'PLAYING'
                });
            },

            /**
             * Archive the current finished game to history
             */
            archiveGame: () => {
                const { players, rounds, threshold, gameHistory } = get();
                if (players.length === 0 || rounds.length === 0) return;

                // Calculate final scores
                const totals = calculateTotals(players, rounds);
                const playersWithScores = players.map(p => ({
                    ...p,
                    finalScore: totals[p.id]
                })).sort((a, b) => a.finalScore - b.finalScore);

                const winner = playersWithScores[0];

                const archivedGame = {
                    id: `game-${Date.now()}`,
                    date: new Date().toISOString(),
                    players: playersWithScores,
                    rounds: [...rounds],
                    threshold,
                    winner: { id: winner.id, name: winner.name, score: winner.finalScore }
                };

                // Add to history (newest first), keep max 50 games
                const updatedHistory = [archivedGame, ...gameHistory].slice(0, 50);
                set({ gameHistory: updatedHistory });
            },

            /**
             * Archive an online game to history
             * @param {Object} params - Online game data
             * @param {Array} params.players - Array of player objects with name, emoji
             * @param {Object} params.totalScores - Map of player id to total score
             * @param {Object} params.winner - Winner object with name, emoji, score
             * @param {number} params.roundsPlayed - Number of rounds played
             */
            archiveOnlineGame: ({ players, totalScores, winner, roundsPlayed }) => {
                const { gameHistory } = get();
                if (!players || players.length === 0) return;

                // Convert online format to archive format
                const playersWithScores = players.map(p => ({
                    id: p.id,
                    name: p.name,
                    emoji: p.emoji,
                    finalScore: totalScores[p.id] || 0
                })).sort((a, b) => a.finalScore - b.finalScore);

                const archivedGame = {
                    id: `game-online-${Date.now()}`,
                    date: new Date().toISOString(),
                    players: playersWithScores,
                    rounds: [], // Online games don't track individual rounds the same way
                    threshold: 100,
                    winner: winner ? {
                        id: winner.id || 'online-winner',
                        name: winner.name,
                        score: winner.score
                    } : playersWithScores[0] ? {
                        id: playersWithScores[0].id,
                        name: playersWithScores[0].name,
                        score: playersWithScores[0].finalScore
                    } : null,
                    gameType: 'online', // Partie en ligne
                    roundsPlayed: roundsPlayed || 1
                };

                // Add to history (newest first), keep max 50 games
                const updatedHistory = [archivedGame, ...gameHistory].slice(0, 50);
                set({ gameHistory: updatedHistory });
            },

            /**
             * Archive a virtual game (AI or local) to history
             * @param {Object} params - Virtual game data
             * @param {Array} params.players - Array of player objects with name, emoji, id
             * @param {Object} params.totalScores - Map of player id to total score
             * @param {Object} params.winner - Winner object with name, emoji, score
             * @param {number} params.roundsPlayed - Number of rounds played
             * @param {string} params.gameType - Type of game: 'ai' or 'local'
             */
            archiveVirtualGame: ({ players, totalScores, winner, roundsPlayed, gameType = 'ai' }) => {
                const { gameHistory } = get();
                if (!players || players.length === 0) return;

                // Convert virtual format to archive format
                const playersWithScores = players.map(p => ({
                    id: p.id,
                    name: p.name,
                    emoji: p.emoji,
                    finalScore: totalScores[p.id] || 0
                })).sort((a, b) => a.finalScore - b.finalScore);

                const archivedGame = {
                    id: `game-${gameType}-${Date.now()}`,
                    date: new Date().toISOString(),
                    players: playersWithScores,
                    rounds: [], // Virtual games don't track rounds the same way
                    threshold: 100,
                    winner: winner ? {
                        id: winner.id || `${gameType}-winner`,
                        name: winner.name,
                        score: winner.score
                    } : playersWithScores[0] ? {
                        id: playersWithScores[0].id,
                        name: playersWithScores[0].name,
                        score: playersWithScores[0].finalScore
                    } : null,
                    gameType: gameType, // 'ai' ou 'local'
                    roundsPlayed: roundsPlayed || 1
                };

                // Add to history (newest first), keep max 50 games
                const updatedHistory = [archivedGame, ...gameHistory].slice(0, 50);
                set({ gameHistory: updatedHistory });
            },

            /**
             * Delete a game from history
             */
            deleteArchivedGame: (gameId) => {
                const { gameHistory } = get();
                set({ gameHistory: gameHistory.filter(g => g.id !== gameId) });
            },

            /**
             * Clear all game history
             */
            clearArchivedGames: () => {
                set({ gameHistory: [] });
            },

            resetGame: () => {
                set({
                    gameStatus: 'SETUP',
                    rounds: [],
                    players: []
                });
            },

            rematch: () => {
                set({
                    gameStatus: 'PLAYING',
                    rounds: []
                });
            }
        }),
        {
            name: 'skyjo-storage',
            version: 6,
            migrate: (persistedState, version) => {
                // ... migration
                if (version < 5) {
                    persistedState = {
                        ...persistedState,
                        lastDailyWinDate: null
                    };
                }
                if (version < 6) {
                    persistedState = {
                        ...persistedState,
                        background: '/Wallpapers/bg-skyjo.png'
                    };
                }
                // Ensure usedProfile exists and has an ID during migration
                if (!persistedState.userProfile || !persistedState.userProfile.id) {
                    const newId = `u-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    persistedState = {
                        ...persistedState,
                        userProfile: {
                            ...(persistedState.userProfile || {}),
                            id: newId,
                            name: persistedState.userProfile?.name && persistedState.userProfile.name.toLowerCase() !== 'joueur' ? persistedState.userProfile.name : '',
                            avatarId: 'cat',
                            level: 1,
                            currentXP: 0
                        }
                    };
                }

                if (version < 2) {
                    return {
                        ...persistedState,
                        hasSeenTutorial: false,
                        achievements: [],
                    };
                }
                if (version < 3) {
                    return {
                        ...persistedState,
                        hasSeenTutorial: persistedState.hasSeenTutorial ?? false,
                        achievements: persistedState.achievements || [],
                    };
                }
                return persistedState;
            },
            onRehydrateStorage: () => (state) => {
                state?.setIsRehydrated(true);
            },
            partialize: (state) =>
                Object.fromEntries(
                    Object.entries(state).filter(([key]) => !['profileLoadedFromBackend', 'isRehydrated'].includes(key))
                ),
        }
    )
);

// Computed selectors for optimized re-renders
export const selectPlayers = (state) => state.players;
export const selectRounds = (state) => state.rounds;
export const selectThreshold = (state) => state.threshold;
export const selectGameStatus = (state) => state.gameStatus;
export const selectGameHistory = (state) => state.gameHistory;
export const selectLastDailyWinDate = (state) => state.lastDailyWinDate;
export const selectWeeklyChallengeWinDate = (state) => state.weeklyChallengeWinDate;

/**
 * Check if the daily challenge is available for today
 */
export const selectIsDailyAvailable = (state) => {
    if (!state.lastDailyWinDate) return true;
    const today = new Date().toISOString().split('T')[0];
    return state.lastDailyWinDate !== today;
};

/**
 * Check if the weekly challenge is available
 */
export const selectIsWeeklyAvailable = (state) => {
    if (!state.weeklyChallengeWinDate) return true;
    
    const lastWin = new Date(state.weeklyChallengeWinDate);
    const today = new Date();
    
    // Difference in days
    const diffTime = Math.abs(today - lastWin);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 7;
};

/**
 * Selector for player totals - use with shallow comparison
 */
export const selectPlayerTotals = (state) => {
    return state.players.map(p => ({
        ...p,
        score: state.rounds.reduce((sum, r) => sum + (r.scores[p.id] || 0), 0)
    })).sort((a, b) => a.score - b.score);
};
