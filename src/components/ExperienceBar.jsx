import { memo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy, Lock, Check, X } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { cn } from '../lib/utils';
import { getRewardsList } from '../lib/rewards';

const REWARDS = getRewardsList();

const ExperienceBar = memo(function ExperienceBar({ className }) {
    const currentXP = useGameStore(state => state.currentXP);
    const level = useGameStore(state => state.level);
    const [showRewards, setShowRewards] = useState(false);

    // Calculate global progress
    const maxLevel = 40;
    const progressPercent = Math.min(100, Math.max(0, (currentXP / 10) * 100));

    // Scroll animation for list
    const containerRef = useRef(null);

    return (
        <>
            <div className={cn("w-full relative z-30", className)}>
                {/* Header Container - Compact Bar */}
                <div className="mb-4 min-h-[85px]">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none mb-3">
                        Progression de Carrière
                    </p>

                    <div className="flex justify-between items-center">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowRewards(true)}
                            className="flex items-baseline gap-2 group cursor-pointer"
                        >
                            <p className="text-3xl font-black text-white uppercase tracking-tighter leading-none shadow-black drop-shadow-lg">
                                NIVEAU <span className="text-4xl text-amber-500 transition-all group-hover:text-amber-400 group-hover:drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">{level}</span>
                            </p>
                        </motion.button>

                        {/* XP Counter - Ultra Pulsing Badge */}
                        <motion.button
                            onClick={() => setShowRewards(true)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900 border border-white/10 shadow-xl cursor-pointer hover:bg-slate-800 transition-colors group"
                        >
                            <div className="relative">
                                <Zap className="w-5 h-5 text-amber-400 relative z-10 group-hover:text-yellow-300" />
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-black text-amber-500 leading-none">{currentXP}</span>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">/ 10 XP</span>
                            </div>
                        </motion.button>
                    </div>

                    {/* Modern Fluid XP Bar */}
                    <motion.div
                        className="relative h-5 w-full rounded-full bg-slate-900 border border-white/10 shadow-inner overflow-hidden flex items-center p-[3px] mt-1 cursor-pointer group"
                        onClick={() => setShowRewards(true)}
                        whileHover={{ scale: 1.01 }}
                    >
                        {/* Tick marks */}


                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1.2, ease: "circOut" }}
                            className="relative h-full rounded-full bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                        >


                        </motion.div>
                    </motion.div>

                    <p className="text-center text-xs font-medium text-slate-500 mt-2">
                        {10 - currentXP} victoire{10 - currentXP > 1 ? 's' : ''} avant le niveau {level + 1}
                    </p>
                </div>

                {/* --- MODALE REDESIGNED - SOLID STYLE --- */}
                {createPortal(
                    <AnimatePresence mode="wait">
                        {showRewards && (
                            <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 font-sans pointer-events-auto">
                                {/* Backdrop Solid Dark */}
                                <motion.div
                                    key="backdrop"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                                    onClick={() => setShowRewards(false)}
                                />

                                {/* Modal Card - Solid Dark Theme */}
                                <motion.div
                                    key="modal"
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                    className="relative w-full max-w-md h-[85vh] bg-[#0f172a] rounded-[24px] border border-slate-700 shadow-2xl flex flex-col overflow-hidden"
                                >
                                    {/* --- HEADER SOLID --- */}
                                    <div className="relative h-40 shrink-0 overflow-hidden bg-slate-900 border-b border-slate-800">
                                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-transparent" />


                                        {/* Close Button */}
                                        <button
                                            onClick={() => setShowRewards(false)}
                                            className="absolute top-4 right-4 z-50 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-all border border-slate-700"
                                        >
                                            <X size={20} />
                                        </button>

                                        {/* Contenu Header */}
                                        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center pt-2">
                                            <div className="p-3 bg-slate-800 rounded-2xl mb-3 border border-slate-700 shadow-lg">
                                                <Trophy className="w-8 h-8 text-amber-400" />
                                            </div>

                                            <h2 className="text-xl font-bold text-white uppercase tracking-tight text-center leading-none">
                                                Plan de Carrière
                                            </h2>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">
                                                L'élite du Skyjo
                                            </p>
                                        </div>
                                    </div>

                                    {/* --- PROGRESS BAR STICKY --- */}
                                    <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 shrink-0 z-20 sticky top-0 shadow-md">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Niveau {level}</span>
                                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">{currentXP} / 10 XP</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-indigo-500 rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progressPercent}%` }}
                                                transition={{ duration: 1, ease: "circOut" }}
                                            />
                                        </div>
                                    </div>

                                    {/* --- LISTE DES RÉCOMPENSES --- */}
                                    <div
                                        ref={containerRef}
                                        className="flex-1 overflow-y-auto px-5 py-6 space-y-3 bg-[#0f172a]"
                                    >
                                        {REWARDS.map((reward, index) => {
                                            const isUnlocked = level >= reward.level;
                                            const isNext = level + 1 === reward.level;
                                            const isLocked = !isUnlocked && !isNext;

                                            return (
                                                <motion.div
                                                    key={reward.level}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className={cn(
                                                        "relative p-4 rounded-2xl border transition-all duration-200 select-none",
                                                        isUnlocked
                                                            ? "bg-slate-900 border-emerald-900/50 hover:border-emerald-700/50"
                                                            : isNext
                                                                ? "bg-slate-800 border-indigo-500/50 shadow-lg ring-1 ring-indigo-500/20"
                                                                : "bg-slate-950 border-slate-800 opacity-60"
                                                    )}
                                                >
                                                    {/* Effets de fond */}


                                                    <div className="flex items-center gap-4">
                                                        {/* Icon Box */}
                                                        <div className={cn(
                                                            "w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 border",
                                                            isUnlocked ? "bg-emerald-950 text-emerald-400 border-emerald-900" :
                                                                isNext ? "bg-indigo-950 text-indigo-400 border-indigo-900" :
                                                                    "bg-slate-900 text-slate-600 border-slate-800"
                                                        )}>
                                                            {reward.icon}
                                                        </div>

                                                        {/* Texte */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className={cn(
                                                                    "text-[9px] font-black uppercase tracking-widest",
                                                                    isUnlocked ? "text-emerald-500" :
                                                                        isNext ? "text-indigo-400" :
                                                                            "text-slate-600"
                                                                )}>
                                                                    Niveau {reward.level}
                                                                </span>

                                                                {isUnlocked && <Check size={14} className="text-emerald-500" />}
                                                                {isLocked && <Lock size={12} className="text-slate-700" />}
                                                            </div>

                                                            <h3 className={cn("text-base font-bold leading-tight", isUnlocked || isNext ? "text-white" : "text-slate-500")}>
                                                                {reward.name}
                                                            </h3>
                                                            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                                                                {reward.description}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Barre de progression locale pour le prochain niveau */}
                                                    {isNext && (
                                                        <div className="mt-3 pt-3 border-t border-slate-700/50">
                                                            <div className="flex justify-between text-[9px] font-bold text-indigo-300 mb-1 uppercase tracking-wider">
                                                                <span>En cours</span>
                                                                <span>{Math.round(progressPercent)}%</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    className="h-full bg-indigo-500 rounded-full"
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${progressPercent}%` }}
                                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    {/* Footer Gradient Fade */}
                                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#0f172a] to-transparent pointer-events-none" />
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
            </div>
        </>
    );
});

export default ExperienceBar;
