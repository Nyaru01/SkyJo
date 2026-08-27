import React from 'react';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

export const PremiumTiltButton = ({
    children,
    onClick,
    className,
    contentClassName,
    bodyClassName,
    gradientFrom = "from-sky-600",
    gradientTo = "to-blue-600",
    shadowColor = "shadow-sky-500/20",
    disabled = false
}) => {
    const prefersReducedMotion = useReducedMotion();
    // "Modern Kinetic" style:
    // - Subtle depth (2px-4px)
    // - Focus on gradient sheen and inner glows
    // - Clean, not blocky

    return (
        <Motion.button
            className={cn(
                "premium-focus-ring relative group isolate w-full touch-manipulation outline-none select-none rounded-[1.625rem]",
                disabled ? "cursor-not-allowed opacity-50 grayscale" : "cursor-pointer",
                className
            )}
            onClick={disabled ? undefined : (e) => {
                if (navigator.vibrate) navigator.vibrate(20);
                onClick?.(e);
            }}
            whileHover={disabled || prefersReducedMotion ? {} : { scale: 1.012 }}
            whileTap={disabled || prefersReducedMotion ? {} : { scale: 0.985 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
            {/* Outer Glow / Shadow */}
            <div className={cn(
                "absolute inset-1 rounded-2xl opacity-25 blur-lg transition-opacity duration-300",
                shadowColor.replace('/20', '/30'), // Slightly more intense shadow for glow
                "group-hover:opacity-45"
            )} />

            {/* Main Button Body */}
            <div className={cn(
                "relative rounded-[1.625rem] overflow-hidden",
                "bg-gradient-to-br",
                gradientFrom, gradientTo,
                "shadow-[0_2px_0_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)]", // Thinner physical depth
                "border border-white/15", // Consistent rim and focus boundary
                bodyClassName
            )}>
                {/* Glass Sheen */}
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent opacity-40 pointer-events-none" />

                {/* Shimmer Effect */}
                {!disabled && !prefersReducedMotion && (
                    <Motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-[200%] -translate-x-full skew-x-[-25deg]"
                        animate={{
                            translateX: ["-100%", "100%"]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatDelay: 7,
                            ease: "easeInOut"
                        }}
                    />
                )}

                {/* Content Container */}
                <div className={cn(
                    "relative px-5 py-3.5 flex items-center justify-center w-full",
                    contentClassName
                )}>
                    {/* Content wrapper */}
                    <div className="font-bold text-white uppercase tracking-wider drop-shadow-sm text-lg flex items-center justify-center gap-2.5 leading-tight w-full">
                        {children}
                    </div>
                </div>

                {/* Hover Flash Effect */}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
            </div>
        </Motion.button>
    );
};
