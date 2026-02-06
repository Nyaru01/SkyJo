import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export const PremiumTiltButton = ({
    children,
    onClick,
    className,
    contentClassName,
    gradientFrom = "from-sky-600",
    gradientTo = "to-blue-600",
    shadowColor = "shadow-sky-500/20",
    disabled = false
}) => {
    // "Arcade" style button:
    // - Distinct "side" layer (depth)
    // - Top layer moves down on click/active
    // - No rotation/tilt/gyro needed, just pure satisfying press depth

    return (
        <motion.div
            className={cn(
                "relative group isolate",
                disabled ? "cursor-not-allowed opacity-50 grayscale" : "cursor-pointer",
                className
            )}
            onClick={disabled ? undefined : (e) => {
                // Haptic feedback
                if (navigator.vibrate) navigator.vibrate(50);
                onClick?.(e);
            }}
            whileHover={disabled ? {} : { scale: 1.02 }}
            whileTap={disabled ? {} : { scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
            {/* Depth Layer ( The "Bottom" ) */}
            <div className={cn(
                "absolute inset-0 rounded-xl translate-y-[6px]", // The depth height
                "bg-slate-900/50" // Darken base
            )}>
                <div className={cn(
                    "absolute inset-0 rounded-xl",
                    "bg-gradient-to-r brightness-50", // Darker version of main color
                    gradientFrom, gradientTo
                )} />
            </div>

            {/* Surface Layer ( The "Top" ) */}
            <motion.div
                className={cn(
                    "relative h-14 rounded-xl flex items-center justify-center overflow-hidden",
                    "border-t border-white/40 border-b border-black/20", // Clean high-contrast borders
                    "shadow-[inset_0_2px_0_rgba(255,255,255,0.2)]", // Inner bevel highlight
                    "bg-gradient-to-r",
                    gradientFrom, gradientTo,
                    contentClassName
                )}
                whileTap={disabled ? {} : { y: 4 }} // Move down to cover depth
                transition={{ duration: 0.1 }}
            >
                {/* Soft Gloss Gradient (Top Half) */}
                <div className="absolute inset-x-0 top-0 h-[50%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

                {/* Hover Highlight */}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 w-full h-full flex items-center justify-center gap-2 font-black tracking-widest text-white uppercase drop-shadow-sm filter">
                    {children}
                </div>
            </motion.div>
        </motion.div>
    );
};
