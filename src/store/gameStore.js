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
            migratedToV2: false, // Flag for LocalStorage -> DB migration
            isRehydrated: false, // Flag to track when store is ready
            cardSkin: 'classic', // classic, papyrus
            background: '/Wallpapers/bg-skyjo.png', // Default background
            isAdminOpen: false, // Global admin status
            adminAuthToken: null, // Admin session token
            musicShuffleTrigger: 0, // Increment to trigger track shuffle
            activeTab: 'home', // 'home', 'game', 'stats', 'community', 'virtual'
            setActiveTab: (tab) => set({ activeTab: tab }),
            lastDailyWinDate: null, // ISO date string of last daily challenge win
            userProfile: {
                id: `u-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: 'Joueur',
                avatarId: 'cat',
                emoji: '🐱',
                vibeId: '',
                level: 1,
                currentXP: 0
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

            setIsAdminOpen: (open) => set({ isAdminOpen: open }),

            setAdminAuthToken: (token) => set({ adminAuthToken: token }),

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
                set(state => ({
                    userProfile: { ...state.userProfile, ...updates }
                }));
                // Sync after update
                get().syncProfileWithBackend();
            },

            syncProfileWithBackend: async () => {
                const state = get();
                let { userProfile, level, currentXP } = state;

                // Safety: Ensure ID exists before syncing
                if (!userProfile?.id) {
                    const newId = `u-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    console.warn('[STORE] Fixed missing user ID:', newId);

                    set(state => ({
                        userProfile: {
                            ...state.userProfile,
                            id: newId,
                            name: state.userProfile?.name || 'Joueur',
                            avatarId: state.userProfile?.avatarId || 'cat',
                            emoji: state.userProfile?.emoji || '🐱',
                            level: state.level,
                            currentXP: state.currentXP
                        }
                    }));
                    userProfile = get().userProfile;
                }

                // CRITICAL: Always use root level/XP to ensure they are never out of sync with userProfile object
                const profileWithLatestStats = {
                    ...userProfile,
                    level: level,
                    currentXP: currentXP
                };

                try {
                    const response = await fetch('/api/social/profile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(profileWithLatestStats)
                    });

                    if (response.ok) {
                        // Silent on success to avoid console noise
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

                        // Only update if data is valid and different
                        if (data && (data.level !== undefined || data.xp !== undefined)) {
                            const newLevel = data.level !== undefined ? data.level : get().level;
                            const newXP = data.xp !== undefined ? data.xp : get().currentXP;

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
                                    }
                                }));
                            }
                        }
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
                            name: persistedState.userProfile?.name || 'Joueur',
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

/**
 * Check if the daily challenge is available for today
 */
export const selectIsDailyAvailable = (state) => {
    if (!state.lastDailyWinDate) return true;
    const today = new Date().toISOString().split('T')[0];
    return state.lastDailyWinDate !== today;
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
