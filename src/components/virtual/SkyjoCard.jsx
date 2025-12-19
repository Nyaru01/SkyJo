import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { CARD_COLORS } from '../../lib/skyjoEngine';

/**
 * Skyjo Card Component
 * Displays a card with flip animation, value, and color coding
 */
const SkyjoCard = memo(function SkyjoCard({
    card,
    size = 'md',
    isSelected = false,
    isClickable = false,
    isHighlighted = false,
    onClick,
    className,
}) {
    if (card === null) {
        // Empty slot (column was removed)
        return (
            <div
                className={cn(
                    "rounded-lg border-2 border-dashed border-slate-300/50 dark:border-slate-600/50",
                    size === 'sm' && "w-10 h-14",
                    size === 'md' && "w-14 h-20",
                    size === 'lg' && "w-16 h-24",
                    className
                )}
            />
        );
    }

    const colors = CARD_COLORS[card.color] || CARD_COLORS.green;
    const isRevealed = card.isRevealed;

    const sizeClasses = {
        sm: "w-10 h-14 text-lg",
        md: "w-14 h-20 text-2xl",
        lg: "w-16 h-24 text-3xl",
    };

    return (
        <motion.div
            className={cn(
                "perspective-1000 cursor-pointer",
                sizeClasses[size],
                className
            )}
            onClick={isClickable ? onClick : undefined}
            whileHover={isClickable ? { scale: 1.05 } : undefined}
            whileTap={isClickable ? { scale: 0.95 } : undefined}
        >
            <motion.div
                className="relative w-full h-full preserve-3d transition-transform duration-500"
                animate={{ rotateY: isRevealed ? 0 : 180 }}
                initial={false}
            >
                {/* Front face (value visible) */}
                <div
                    className={cn(
                        "absolute inset-0 backface-hidden rounded-xl flex items-center justify-center font-black shadow-lg border-2 border-white/30",
                        colors.bg,
                        colors.text,
                        isSelected && "ring-4 ring-amber-400 ring-offset-2",
                        isHighlighted && "ring-4 ring-emerald-400 animate-pulse",
                        isClickable && "hover:shadow-xl",
                        colors.glow && isRevealed && `shadow-lg ${colors.glow}`
                    )}
                >
                    <span className="drop-shadow-md">
                        {card.value < 0 ? card.value : card.value}
                    </span>
                </div>

                {/* Back face (hidden) */}
                <div
                    className={cn(
                        "absolute inset-0 backface-hidden rounded-xl flex items-center justify-center rotate-y-180",
                        "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900",
                        "border-2 border-slate-600",
                        isSelected && "ring-4 ring-amber-400 ring-offset-2",
                        isHighlighted && "ring-4 ring-emerald-400 animate-pulse"
                    )}
                >
                    {/* Card back pattern */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-inner">
                        <span className="text-white text-xs font-bold">S</span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
});

export default SkyjoCard;
