/**
 * Utility to map card skin IDs to their image paths
 * @param {string} skinId - The ID of the skin (e.g., 'classic', 'papyrus', 'cyberpunk')
 * @returns {string} The path to the skin image
 */
export const getCardSkinPath = (skinId) => {
    switch (skinId) {
        case 'papyrus':
            return '/card-backs/papyrus.svg';
        case 'neon':
            return '/card-backs/neon.svg';
        case 'cyberpunk':
            return '/card-backs/cyberpunk.svg';
        case 'carbon':
            return '/card-backs/carbon.svg';
        case 'obsidian':
            return '/card-backs/obsidian.svg';
        case 'gold':
            return '/card-backs/gold.svg';
        case 'galaxy':
            return '/card-backs/galaxy.svg';
        case 'astral-sigil':
            return '/card-backs/astral-sigil.svg';
        case 'nebula-core':
            return '/card-backs/nebula-core.svg';
        case 'cosmic-dragon':
            return '/card-backs/cosmic-dragon.svg';
        case 'eternal-prism':
            return '/card-backs/eternal-prism.svg';
        case 'transcendent-void':
            return '/card-backs/transcendent-void.svg';
        case 'classic':
        default:
            return '/card-backs/classic.svg';
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
