
export const LEVEL_REWARDS = {
    2: {
        type: 'emoji',
        content: '🍪',
        name: 'Cookie Pixel',
        description: '0 calorie, 100% virtuel. Mangez-le avec les yeux.',
        rarity: 'common'
    },
    3: {
        type: 'skin',
        image: '/card-back-papyrus.jpg',
        name: 'Skin Papyrus',
        description: 'Pour jouer comme en 1999 av. J-C. Attention, fragile.',
        rarity: 'uncommon'
    },
    4: { type: 'emoji', content: '🎓', name: 'Savant Fou', description: 'E=mc² ? Non, Skyjo = -2. C\'est ça la vraie science.', rarity: 'common' },
    5: {
        type: 'skin',
        image: '/card-back-neon.png',
        name: 'Skin Neon',
        description: 'Tellement brillant que vous aurez besoin de lunettes de soleil.',
        rarity: 'rare'
    },
    6: { type: 'emoji', content: '🎭', name: 'Double Jeu', description: 'Idéal pour bluffer... même contre une IA.', rarity: 'common' },
    7: { type: 'generic', content: '🎰', name: 'Lucky Seven', description: 'Le chiffre porte-bonheur. Enfin, sauf si vous piochez un 12.', rarity: 'uncommon' },
    8: { type: 'emoji', content: '🚀', name: 'Vers la Lune', description: 'Votre score décolle... on espère que c\'est vers le bas !', rarity: 'rare' },
    9: { type: 'generic', content: '🦈', name: 'Card Shark', description: 'Vous ne jouez plus, vous chassez. *Musique des Dents de la Mer*', rarity: 'rare' },
    10: {
        type: 'skin',
        image: '/card-back-gold.png',
        name: 'Skin Gold',
        description: 'Si brillant que vos adversaires seront éblouis (littéralement).',
        rarity: 'epic'
    },
    11: { type: 'emoji', content: '👑', name: 'Roi du Skyjo', description: 'Inclinez-vous, mortels. Le patron est dans la place.', rarity: 'epic' },
    12: { type: 'generic', content: '🧙‍♂️', name: 'Grand Master', description: 'Vous voyez les chiffres en vert comme dans Matrix.', rarity: 'epic' },
    13: { type: 'emoji', content: '💎', name: 'Précieux', description: 'Mon préééciiiieux... Ne le jetez pas dans la lave.', rarity: 'legendary' },
    14: { type: 'generic', content: '🏆', name: 'Légende', description: 'On racontera vos exploits aux générations futures.', rarity: 'legendary' },
    15: {
        type: 'skin',
        image: '/card-back-galaxy.png',
        name: 'Skin Galaxy',
        description: 'L\'univers entier dans votre main. Ne le faites pas tomber.',
        rarity: 'legendary'
    },
};

/**
 * Helper to get rewards as an array for UI lists
 */
export const getRewardsList = () => {
    return Object.entries(LEVEL_REWARDS).map(([level, reward]) => ({
        level: parseInt(level),
        ...reward,
        // Map types to legacy icon format for ExperienceBar if needed
        icon: reward.type === 'emoji' ? reward.content :
            reward.type === 'skin' ? '🎨' :
                reward.type === 'generic' ? reward.content : '🎁'
    })).sort((a, b) => a.level - b.level);
};
