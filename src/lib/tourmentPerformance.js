export const TOURMENT_PERFORMANCE_TIERS = Object.freeze({
    SURVIVAL: Object.freeze({
        id: 'survival',
        label: 'Victoire de justesse',
        description: 'La victoire est là, mais le Tourment vous a marqué.',
    }),
    PROGRESS: Object.freeze({
        id: 'progress',
        label: 'Bon début',
        description: 'Un score négatif encourageant. Continuez à creuser.',
    }),
    MASTERY: Object.freeze({
        id: 'mastery',
        label: 'Maîtrise du Tourment',
        description: 'Entre −50 et −99 : une victoire de grande qualité.',
    }),
    ABSOLUTE: Object.freeze({
        id: 'absolute',
        label: 'Domination absolue',
        description: '−100 ou moins : le Tourment est sous votre contrôle.',
    }),
});

export const getTourmentPerformance = (score) => {
    const numericScore = Number(score);
    if (!Number.isFinite(numericScore)) return null;
    if (numericScore <= -100) return TOURMENT_PERFORMANCE_TIERS.ABSOLUTE;
    if (numericScore <= -50) return TOURMENT_PERFORMANCE_TIERS.MASTERY;
    if (numericScore <= 0) return TOURMENT_PERFORMANCE_TIERS.PROGRESS;
    return TOURMENT_PERFORMANCE_TIERS.SURVIVAL;
};
