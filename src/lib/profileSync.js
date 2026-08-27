const normalizeCloudDate = (value, fallback) => {
    if (!value) return fallback;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString().split('T')[0];
};

export const buildProfileSyncPayload = (state, userProfile = state.userProfile) => ({
    ...userProfile,
    level: state.level,
    xp: state.currentXP,
    weeklyChallengeWinDate: state.weeklyChallengeWinDate,
    weeklyChallengeId: state.weeklyChallengeId,
});

export const mergeCloudProfile = (state, data) => {
    const level = data.level !== undefined && data.level !== null
        ? Number(data.level)
        : state.level;
    const currentXP = data.xp !== undefined && data.xp !== null
        ? Number(data.xp)
        : state.currentXP;

    return {
        level,
        currentXP,
        lastAcknowledgedLevel: Math.min(state.lastAcknowledgedLevel, level),
        profileLoadedFromBackend: true,
        userProfile: {
            ...state.userProfile,
            name: data.name || state.userProfile.name,
            emoji: data.emoji || state.userProfile.emoji,
            avatarId: data.avatar_id || state.userProfile.avatarId,
            vibeId: data.vibe_id || state.userProfile.vibeId,
            level,
            currentXP,
        },
        weeklyChallengeWinDate: normalizeCloudDate(
            data.weekly_challenge_win_date,
            state.weeklyChallengeWinDate,
        ),
        weeklyChallengeId: data.weekly_challenge_id ?? state.weeklyChallengeId,
    };
};
