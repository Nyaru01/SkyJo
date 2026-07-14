/**
 * Utility to map card skin IDs to their image paths
 * @param {string} skinId - The ID of the skin (e.g., 'classic', 'papyrus', 'cyberpunk')
 * @returns {string} The path to the skin image
 */
export const getCardSkinPath = (skinId) => {
    switch (skinId) {
        case 'papyrus':
            return '/card-back-papyrus.jpg';
        case 'neon':
            return '/card-back-neon.png';
        case 'cyberpunk':
            return '/card-back-cyberpunk.png';
        case 'carbon':
            return '/card-back-carbon.png';
        case 'obsidian':
            return '/card-back-obsidian.png';
        case 'gold':
            return '/card-back-gold.png';
        case 'galaxy':
            return '/card-back-galaxy.png';
        case 'astral-sigil':
            return '/master/card-back-astral-sigil.webp';
        case 'nebula-core':
            return '/master/card-back-nebula-core.webp';
        case 'cosmic-dragon':
            return '/master/card-back-cosmic-dragon.webp';
        case 'eternal-prism':
            return '/master/card-back-eternal-prism.webp';
        case 'transcendent-void':
            return '/master/card-back-transcendent-void.webp';
        case 'classic':
        default:
            return '/card-back.png?v=2';
    }
};

const SKIN_REQUIRED_LEVELS = {
    classic: 1,
    papyrus: 3,
    neon: 5,
    cyberpunk: 6,
    carbon: 8,
    obsidian: 12,
    gold: 13,
    galaxy: 18,
    'astral-sigil': 110,
    'nebula-core': 130,
    'cosmic-dragon': 150,
    'eternal-prism': 170,
    'transcendent-void': 190
};

export const getCardSkinRequiredLevel = (skinId) => SKIN_REQUIRED_LEVELS[skinId] || 1;
