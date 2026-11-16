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

// Mode Fury : cartes classiques (−2 à 12), le gagnant finit le plus souvent entre 40 et 100 points
// (médiane ≈ 74 sur 400 parties IA contre IA). Seuils calés pour que chaque rang reste atteignable.
export const FURY_PERFORMANCE_TIERS = Object.freeze({
    SURVIVAL: Object.freeze({
        id: 'survival',
        label: 'Victoire de justesse',
        description: 'Plus de 60 points : la victoire, de peu.',
    }),
    PROGRESS: Object.freeze({
        id: 'progress',
        label: 'Belle victoire',
        description: 'De 36 à 60 points : la Fury vous réussit.',
    }),
    MASTERY: Object.freeze({
        id: 'mastery',
        label: 'Maîtrise de la Fury',
        description: 'De 11 à 35 points : une victoire de grande qualité.',
    }),
    ABSOLUTE: Object.freeze({
        id: 'absolute',
        label: 'Domination absolue',
        description: '10 points ou moins : l’adversaire n’a rien vu venir.',
    }),
});

export const getFuryPerformance = (score) => {
    const numericScore = Number(score);
    if (!Number.isFinite(numericScore)) return null;
    if (numericScore <= 10) return FURY_PERFORMANCE_TIERS.ABSOLUTE;
    if (numericScore <= 35) return FURY_PERFORMANCE_TIERS.MASTERY;
    if (numericScore <= 60) return FURY_PERFORMANCE_TIERS.PROGRESS;
    return FURY_PERFORMANCE_TIERS.SURVIVAL;
};
