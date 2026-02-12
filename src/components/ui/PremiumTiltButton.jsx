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
    // "Modern Kinetic" style:
    // - Subtle depth (2px-4px)
    // - Focus on gradient sheen and inner glows
    // - Clean, not blocky

    return (
        <motion.button
            className={cn(
                "relative group isolate w-full touch-manipulation outline-none select-none",
                disabled ? "cursor-not-allowed opacity-50 grayscale" : "cursor-pointer",
                className
            )}
            onClick={disabled ? undefined : (e) => {
                if (navigator.vibrate) navigator.vibrate(20);
                onClick?.(e);
            }}
            whileHover={disabled ? {} : { scale: 1.02 }}
            whileTap={disabled ? {} : { scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
            {/* Outer Glow / Shadow */}
            <div className={cn(
                "absolute inset-0 rounded-2xl opacity-50 blur-xl transition-opacity duration-300",
                shadowColor.replace('/20', '/40'), // Intensify shadow
                "group-hover:opacity-75"
            )} />

            {/* Main Button Body */}
            <div className={cn(
                "relative rounded-2xl overflow-hidden",
                "bg-gradient-to-br",
                gradientFrom, gradientTo,
                "shadow-[0_4px_0_rgba(0,0,0,0.2),0_2px_4px_rgba(0,0,0,0.2)]", // Subtle physical depth via shadow
                "border-t border-white/20" // Top rim light
            )}>
                {/* Glass Sheen */}
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent opacity-50 pointer-events-none" />

                {/* Content Container */}
                <div className={cn(
                    "relative px-7 py-5 flex items-center justify-center w-full",
                    contentClassName
                )}>
                    {/* Content wrapper */}
                    <div className="font-black text-white uppercase tracking-widest drop-shadow-md text-xl flex items-center justify-center gap-3 leading-none w-full">
                        {children}
                    </div>
                </div>

                {/* Hover Flash Effect */}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
            </div>
        </motion.button>
    );
};
