import { memo } from 'react';
import { X, Lock, RefreshCw, Eraser, Sparkles, HelpCircle, Orbit } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { CARD_COLORS } from '../../lib/skyjoEngine';
import { useGameStore } from '../../store/gameStore';
import { getCardSkinPath } from '../../lib/skinUtils';

// Simple haptic feedback for card touches
const triggerHaptic = () => {
    if (navigator.vibrate) {
        navigator.vibrate(50); // Perceptible tap on Android
    }
};

/**
 * Skyjo Card Component - Skeuomorphic Design
 * Reproduces the physical Skyjo card appearance with mosaic texture
 */

// Mosaic color schemes for each card color
const MOSAIC_COLORS = {
    indigo: {
        primary: '#4338ca',
        secondary: '#6366f1',
        tertiary: '#818cf8',
        light: '#a5b4fc',
        lines: 'rgba(255,255,255,0.3)',
    },
    blue: {
        primary: '#2563eb',
        secondary: '#3b82f6',
        tertiary: '#60a5fa',
        light: '#93c5fd',
        lines: 'rgba(255,255,255,0.3)',
    },
    cyan: {
        primary: '#0891b2',
        secondary: '#06b6d4',
        tertiary: '#22d3ee',
        light: '#67e8f9',
        lines: 'rgba(255,255,255,0.3)',
    },
    green: {
        primary: '#059669',
        secondary: '#10b981',
        tertiary: '#34d399',
        light: '#6ee7b7',
        lines: 'rgba(255,255,255,0.25)',
    },
    yellow: {
        primary: '#ca8a04',
        secondary: '#eab308',
        tertiary: '#facc15',
        light: '#fde047',
        lines: 'rgba(255,255,255,0.2)',
    },
    orange: {
        primary: '#ea580c',
        secondary: '#f97316',
        tertiary: '#fb923c',
        light: '#fdba74',
        lines: 'rgba(255,255,255,0.25)',
    },
    red: {
        primary: '#dc2626',
        secondary: '#ef4444',
        tertiary: '#f87171',
        light: '#fca5a5',
        lines: 'rgba(255,255,255,0.25)',
    },
    violet: {
        primary: '#7c3aed',
        secondary: '#8b5cf6',
        tertiary: '#a78bfa',
        light: '#c4b5fd',
        lines: 'rgba(255,255,255,0.3)',
    },
    darkred: {
        primary: '#7f1d1d',
        secondary: '#991b1b',
        tertiary: '#b91c1c',
        light: '#dc2626',
        lines: 'rgba(255,255,255,0.4)',
    },
    special: {
        primary: '#1e1b4b',
        secondary: '#312e81',
        tertiary: '#4338ca',
        light: '#818cf8',
        lines: 'rgba(255,255,255,0.4)',
    },
    gold: {
        primary: '#78350f',
        secondary: '#d97706',
        tertiary: '#f59e0b',
        light: '#fcd34d',
        lines: 'rgba(255,255,255,0.5)',
    },
    black: {
        primary: '#020617',
        secondary: '#0f172a',
        tertiary: '#1e293b',
        light: '#334155',
        lines: 'rgba(255,255,255,0.2)',
    },
};

// Generate mosaic SVG pattern with more complexity
const MosaicPattern = ({ colors, id }) => (
    <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
        <defs>
            <pattern id={`mosaic-${id}`} patternUnits="userSpaceOnUse" width="40" height="40">
                {/* Gradient background */}
                <rect width="40" height="40" fill={colors.secondary} />

                {/* More complex irregular polygon cells */}
                <polygon points="0,0 20,5 15,15 0,12" fill={colors.primary} stroke={colors.lines} strokeWidth="0.5" />
                <polygon points="20,5 40,0 40,15 25,20 15,15" fill={colors.tertiary} stroke={colors.lines} strokeWidth="0.5" />
                <polygon points="0,12 15,15 8,40 0,40" fill={colors.tertiary} stroke={colors.lines} strokeWidth="0.5" />
                <polygon points="15,15 25,20 20,40 8,40" fill={colors.light} stroke={colors.lines} strokeWidth="0.5" />
                <polygon points="25,20 40,15 40,35 32,40 20,40" fill={colors.secondary} stroke={colors.lines} strokeWidth="0.5" />
                <polygon points="40,35 40,40 32,40" fill={colors.primary} stroke={colors.lines} strokeWidth="0.5" />

                {/* Additional micro-cells for richness */}
                <circle cx="10" cy="8" r="1.5" fill={colors.light} opacity="0.3" />
                <circle cx="30" cy="25" r="2" fill={colors.primary} opacity="0.2" />
            </pattern>

            {/* Gradient overlay for depth */}
            <linearGradient id={`depth-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
                <stop offset="45%" stopColor="rgba(255,255,255,0.05)" />
                <stop offset="55%" stopColor="rgba(0,0,0,0.05)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
            </linearGradient>

            {/* Texture Filter */}
            <filter id={`noise-${id}`}>
                <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
            </filter>
        </defs>

        <rect width="100%" height="100%" fill={`url(#mosaic-${id})`} />
        <rect width="100%" height="100%" fill={`url(#depth-${id})`} />
        <rect width="100%" height="100%" filter={`url(#noise-${id})`} opacity="0.4" />
    </svg>
);

// Shimmer effect component
const ShimmerOverlay = () => (
    <motion.div
        className="absolute inset-0 z-10 pointer-events-none overflow-hidden"
        initial={{ x: '-150%', skewX: -20 }}
        animate={{
            x: ['-150%', '250%'],
        }}
        transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 18.5,
            ease: "easeInOut"
        }}
        style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.0), rgba(255,255,255,0.4), rgba(255,255,255,0.0), transparent)',
            width: '100%',
        }}
    />
);

const SkyjoCard = memo(function SkyjoCard({
    card,
    size = 'md',
    isSelected = false,
    isClickable = false,
    isHighlighted = false,
    isShaking = false,
    isLocked = false,
    onClick,
    className,
    style,
}) {
    // Shake animation variants
    const shakeVariants = {
        shake: {
            x: [0, -5, 5, -5, 5, 0],
            transition: { duration: 0.4 }
        }
    };
    // Dynamic sizing - 2:3 ratio
    const sizeStyles = {
        xs: {
            width: 'clamp(2.25rem, 7vw, 3.25rem)',
            height: 'clamp(2.25rem, 7.5vh, 3.375rem)',
            fontSize: 'clamp(0.95rem, 2.8vw, 1.4rem)',
            cornerSize: '0.45rem',
            cornerFont: '0.38rem',
        },
        sm: {
            width: 'clamp(2.5rem, 7vw, 3.5rem)',
            height: 'clamp(3.2rem, 9vh, 4.2rem)',
            fontSize: 'clamp(1.25rem, 3.4vw, 1.7rem)',
            cornerSize: '0.65rem',
            cornerFont: '0.5rem',
        },
        md: {
            width: 'clamp(2.7rem, 7.5vw, 3.8rem)',
            height: 'clamp(3.6rem, 10vh, 4.8rem)',
            fontSize: 'clamp(1.5rem, 4vw, 2.1rem)',
            cornerSize: '0.8rem',
            cornerFont: '0.55rem',
        },
        lg: {
            width: 'clamp(3.5rem, 9vw, 4.5rem)',
            height: 'clamp(5.25rem, 13.5vh, 6.75rem)',
            fontSize: 'clamp(2.1rem, 6vw, 3.2rem)',
            cornerSize: '1.1rem',
            cornerFont: '0.75rem',
        },
    };

    const currentSize = sizeStyles[size] || sizeStyles.md;

    // Robust retrieval with fallback
    const cardSkin = useGameStore(s => (s && s.cardSkin) ? s.cardSkin : 'classic');

    if (card === null) {
        return (
            <div
                className={cn(
                    "rounded-lg border-2 border-dashed border-slate-300/50 dark:border-slate-600/50",
                    className
                )}
                style={{
                    width: currentSize.width,
                    height: currentSize.height,
                }}
            />
        );
    }

    let mosaicColors = MOSAIC_COLORS[card.color];

    // Force correct colors for special Bonus cards (20, -10, S, C)
    const numericValue = parseInt(card.value);
    const isS = card.specialType === 'S' || card.value === 'S';
    const isC = card.specialType === 'C' || card.value === 'C';

    if (numericValue === 20) {
        mosaicColors = MOSAIC_COLORS.darkred;
    } else if (numericValue === -10) {
        mosaicColors = MOSAIC_COLORS.violet;
    } else if (isS || (card.value === 0 && card.color === 'special' && !isC)) {
        mosaicColors = MOSAIC_COLORS.special;
    } else if (isC || (card.value === 0 && card.color === 'special')) {
        mosaicColors = MOSAIC_COLORS.special;
    } else if (card.specialType === 'CH' || card.value === 'CH' || card.color === 'gold') {
        mosaicColors = MOSAIC_COLORS.gold;
    } else if (card.specialType === 'H' || card.value === 'H' || card.color === 'black') {
        mosaicColors = MOSAIC_COLORS.black;
    }

    // Final fallback if color is still missing
    if (!mosaicColors) {
        mosaicColors = MOSAIC_COLORS.green;
    }
    const isRevealed = card.isRevealed;
    const patternId = `${card.id}-${card.color}`;

    // Determine display content (Value or Icon for special types)
    const displayValue = card.specialType || card.value;

    const isCH = card.specialType === 'CH' || card.value === 'CH';
    const isH = card.specialType === 'H' || card.value === 'H';
    const isSpecial = isS || isC || isCH || isH;

    const SpecialIcon = isSpecial ? (isS ? RefreshCw : (isC ? Sparkles : (isCH ? HelpCircle : Orbit))) : null;

    return (
        <motion.div
            className={cn(
                "perspective-1000 relative",
                isClickable ? "cursor-pointer" : "cursor-default",
                className
            )}
            style={{
                width: size === 'custom' ? undefined : currentSize.width,
                height: size === 'custom' ? undefined : currentSize.height,
                ...style // Allow overriding style
            }}
            onClick={isClickable ? () => { triggerHaptic(); onClick?.(); } : undefined}
            whileHover={isClickable ? { scale: 1.08, y: -4 } : undefined}
            whileTap={isClickable ? { scale: 0.95 } : undefined}
            animate={isShaking ? "shake" : undefined}
            variants={shakeVariants}
        >
            {/* Extended touch area */}
            {isClickable && (
                <div
                    className="absolute pointer-events-auto"
                    style={{ top: '-8px', left: '-8px', right: '-8px', bottom: '-8px', zIndex: 10 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic();
                        onClick?.();
                    }}
                />
            )}

            <motion.div
                className="relative w-full h-full preserve-3d"
                animate={{ rotateY: isRevealed ? 0 : 180 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                initial={false}
            >
                {/* FRONT FACE - Skeuomorphic card design */}
                <div
                    className={cn(
                        "absolute inset-0 backface-hidden overflow-hidden transition-all duration-200",
                        isSelected && "ring-2 ring-amber-400 ring-offset-1",
                    )}
                    style={{
                        borderRadius: '10px',
                        boxShadow: `
                            0 4px 15px rgba(0, 0, 0, 0.5), 
                            0 1px 3px rgba(0, 0, 0, 0.4), 
                            inset 0 0 0 1px rgba(255,255,255,0.3),
                            inset 0 1px 1px rgba(255,255,255,0.5),
                            ${(isCH || isH || isSpecial || numericValue === 20 || numericValue === -10)
                                ? `0 0 12px ${mosaicColors.tertiary}66`
                                : ''}
                        `,
                        border: '2.5px solid #ffffff',
                        background: mosaicColors.secondary,
                    }}
                >
                    {/* Mosaic texture pattern */}
                    <MosaicPattern colors={mosaicColors} id={patternId} />

                    {/* Shimmer effect */}
                    <ShimmerOverlay />

                    {/* Top-left corner number */}
                    <div
                        className="absolute flex items-center justify-center"
                        style={{
                            top: '4px',
                            left: '4px',
                            width: currentSize.cornerSize,
                            height: currentSize.cornerSize,
                            background: 'rgba(255,255,255,0.9)',
                            borderRadius: '50%',
                            fontSize: currentSize.cornerFont,
                            fontWeight: 'bold',
                            color: mosaicColors.primary,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        }}
                    >
                        {isSpecial ? (
                            <SpecialIcon style={{ width: '80%', height: '80%' }} strokeWidth={3} />
                        ) : (
                            displayValue
                        )}
                    </div>

                    {/* Bottom-right corner number (rotated) */}
                    <div
                        className="absolute flex items-center justify-center"
                        style={{
                            bottom: '4px',
                            right: '4px',
                            width: currentSize.cornerSize,
                            height: currentSize.cornerSize,
                            background: 'rgba(255,255,255,0.9)',
                            borderRadius: '50%',
                            fontSize: currentSize.cornerFont,
                            fontWeight: 'bold',
                            color: mosaicColors.primary,
                            transform: 'rotate(180deg)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        }}
                    >
                        {isSpecial ? (
                            <SpecialIcon style={{ width: '80%', height: '80%' }} strokeWidth={3} />
                        ) : (
                            displayValue
                        )}
                    </div>

                    {/* Center number with strong relief effect */}
                    <div
                        className="absolute inset-0 flex items-center justify-center p-2"
                        style={{ fontSize: currentSize.fontSize }}
                    >
                        <span
                            style={{
                                fontWeight: 900,
                                color: '#ffffff',
                                textShadow: '0 1px 1px rgba(0,0,0,0.3), 1px 1px 3px rgba(0,0,0,0.3)',
                                letterSpacing: '-0.02em',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                height: '100%',
                                filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))',
                                position: 'relative'
                            }}
                        >
                            {/* Inner highlight for "embossed" look */}
                            <span
                                className="absolute inset-0 flex items-center justify-center opacity-40 blur-[0.5px]"
                                style={{ transform: 'translate(-1px, -1px)', color: 'rgba(255,255,255,0.8)' }}
                            >
                                {isSpecial ? (
                                    <SpecialIcon className="w-[65%] h-[65%]" strokeWidth={4} />
                                ) : (
                                    displayValue
                                )}
                            </span>

                            {isSpecial ? (
                                <SpecialIcon className="w-[65%] h-[65%] relative z-10" strokeWidth={4} />
                            ) : (
                                <span className="relative z-10">{displayValue}</span>
                            )}
                        </span>
                    </div>

                    {/* Glossy overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 30%, transparent 50%)',
                        }}
                    />

                    {/* Lock overlay */}
                    {isLocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px] z-20">
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-slate-900/80 p-1.5 rounded-full border border-white/20 shadow-lg"
                            >
                                <Lock className="w-5 h-5 text-amber-400" />
                            </motion.div>
                        </div>
                    )}
                </div>

                {/* BACK FACE */}
                <div
                    className={cn(
                        "absolute inset-0 backface-hidden flex items-center justify-center rotate-y-180 overflow-hidden transition-all duration-200",
                        isSelected && "ring-2 ring-amber-400 ring-offset-1",
                    )}
                    style={{
                        borderRadius: '10px',
                        boxShadow: isHighlighted
                            ? '0 0 20px rgba(52, 211, 153, 0.6), 0 4px 16px rgba(0, 0, 0, 0.4)'
                            : '0 4px 16px rgba(0, 0, 0, 0.4)',
                        border: isHighlighted
                            ? '2px solid rgba(52, 211, 153, 0.9)'
                            : '2.5px solid rgba(100, 116, 139, 0.5)',
                        backgroundColor: '#1e293b', // Fallback
                    }}
                >
                    <img
                        src={getCardSkinPath(cardSkin)}
                        alt="Card Back"
                        className="w-full h-full object-cover"
                    />
                </div>
            </motion.div>
        </motion.div>
    );
});

export default SkyjoCard;
