export const MASTER_UNLOCK_LEVEL = 100;
export const MASTER_LEVELS_PER_CYCLE = 100;
export const XP_PER_LEVEL = 10;

export const getMasterProgress = (globalLevel = 1) => {
    const safeLevel = Math.max(1, Number(globalLevel) || 1);

    if (safeLevel <= MASTER_UNLOCK_LEVEL) {
        return {
            isUnlocked: safeLevel === MASTER_UNLOCK_LEVEL,
            masterLevel: 0,
            cycle: 0,
            completedPrestiges: 0
        };
    }

    const offset = safeLevel - MASTER_UNLOCK_LEVEL - 1;
    return {
        isUnlocked: true,
        masterLevel: (offset % MASTER_LEVELS_PER_CYCLE) + 1,
        cycle: Math.floor(offset / MASTER_LEVELS_PER_CYCLE) + 1,
        completedPrestiges: Math.floor((safeLevel - MASTER_UNLOCK_LEVEL) / MASTER_LEVELS_PER_CYCLE)
    };
};

export const getGlobalLevelForMaster = (masterLevel) =>
    MASTER_UNLOCK_LEVEL + Math.min(MASTER_LEVELS_PER_CYCLE, Math.max(1, Number(masterLevel) || 1));

export const getCareerIdentity = (globalLevel = 1) => {
    const progress = getMasterProgress(globalLevel);
    if (!progress.isUnlocked) return { label: `Niveau ${globalLevel}`, ...progress };
    if (progress.masterLevel === 0) return { label: 'Carrière Maître débloquée', ...progress };

    return {
        label: `Maître ${progress.masterLevel}`,
        prestigeLabel: progress.completedPrestiges > 0
            ? `★ ${progress.completedPrestiges}`
            : 'Cycle I',
        ...progress
    };
};
