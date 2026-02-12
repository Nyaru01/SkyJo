import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MESSAGES = [
    "Mélange des cartes...",
    "Alignement des colonnes...",
    "Calcul des probabilités...",
    "Hésite pas à piocher",
    "Prêt à jouer ?"
];

const LoaderText = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex(prev => (prev + 1) % MESSAGES.length);
        }, 400);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-6 flex items-center justify-center overflow-hidden mb-2">
            <AnimatePresence mode="wait">
                <motion.p
                    key={index}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium text-sky-300 italic flex items-center gap-2"
                >
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                    {MESSAGES[index]}
                </motion.p>
            </AnimatePresence>
        </div>
    );
};

export default function SkyjoLoader({ progress = 0 }) {
    return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[100]">
            {/* Background Image with Cinematic Zoom - Darker overlay */}
            <motion.div
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.4 }}
                transition={{ duration: 4, ease: "easeOut" }}
                className="absolute inset-0 bg-[url('/premium-bg.jpg')] bg-cover bg-center"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-900/90" />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-md px-8">

                {/* Logo / Title Area */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-12 flex flex-col items-center"
                >
                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#9E67F2] to-[#748EF8] drop-shadow-[0_0_15px_rgba(158,103,242,0.5)] tracking-tighter">
                        SKYJO
                    </h1>
                    <div className="h-1 w-24 bg-gradient-to-r from-[#9E67F2] to-[#748EF8] rounded-full mt-2 shadow-[0_0_10px_rgba(158,103,242,0.8)]" />
                </motion.div>

                {/* Progress Bar Container */}
                <div className="w-full space-y-4">

                    {/* Flavour Text - Cycling Interval */}
                    <LoaderText />

                    <div className="flex justify-between items-end px-1">
                        <span className="text-xs font-bold text-[#9E67F2] uppercase tracking-widest">Chargement</span>
                        <span className="text-xl font-black text-white tabular-nums">{Math.round(progress)}%</span>
                    </div>

                    <div className="h-4 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/10 shadow-[inner_0_2px_4px_rgba(0,0,0,0.5)] backdrop-blur-sm p-[1px]">
                        <motion.div
                            className="h-full bg-gradient-to-r from-[#9E67F2] via-[#b692f6] to-[#748EF8] relative rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                            transition={{ ease: "circOut", duration: 0.5 }}
                        >
                            {/* Intense Glow at the tip */}
                            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white/60 to-transparent blur-[2px]" />
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full blur-[6px] shadow-[0_0_15px_white]" />

                            {/* Moving Shimmer Effect */}
                            <div className="absolute inset-0 w-full h-full overflow-hidden rounded-full">
                                <div className="absolute top-0 bottom-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 animate-[shimmer_1.5s_infinite]" />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Version removed as requested */}
        </div>
    );
}
