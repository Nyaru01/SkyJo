import { memo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Zap, Trophy, Lock, Check, X } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { cn } from '../lib/utils';

/**
 * Experience Bar Component (Compact version)
 * Displays a horizontal bar with 10 bubbles representing XP progress
 */
import { getRewardsList } from '../lib/rewards';

const REWARDS = getRewardsList();

const ExperienceBar = memo(function ExperienceBar({ className }) {
    const currentXP = useGameStore(state => state.currentXP);
    const level = useGameStore(state => state.level);
    const [showRewards, setShowRewards] = useState(false);

    // Calculate global progress to level 11 (max)
    // Assuming each level takes 10 XP
    const maxLevel = 30;
    const totalLevels = maxLevel - 1;
    const progressPercent = Math.min(100, Math.max(0, ((level - 1) / totalLevels) * 100));

    return (
        <>
            <div className={cn("w-full relative z-30", className)}>
                {/* Header Container */}
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
                            animate={{
                                boxShadow: ["0 0 0px rgba(245,158,11,0)", "0 0 25px rgba(245,158,11,0.4)", "0 0 0px rgba(245,158,11,0)"],
                                scale: [1, 1.05, 1],
                                border: ["1px solid rgba(255,255,255,0.1)", "1px solid rgba(245,158,11,0.5)", "1px solid rgba(255,255,255,0.1)"]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl cursor-pointer hover:bg-slate-800 transition-colors"
                        >
                            <div className="relative">
                                <Zap className="w-5 h-5 text-amber-400 relative z-10" />
                                <motion.div
                                    animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.6, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="absolute inset-0 bg-amber-400/30 blur-md rounded-full"
                                />
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-black text-amber-400 leading-none">{currentXP}</span>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">/ 10 XP</span>
                            </div>
                        </motion.button>
                    </div>

                    {/* Modern Fluid XP Bar - Enhanced Visibility */}
                    <div className="relative h-5 w-full rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] overflow-hidden flex items-center p-[4px]">
                        {/* Tick marks for better estimation */}
                        <div className="absolute inset-x-0 inset-y-0 flex justify-between pointer-events-none z-10 px-[4px]">
                            {[...Array(11)].map((_, i) => (
                                <div key={i} className="w-[1px] h-full bg-white/10" />
                            ))}
                        </div>

                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(currentXP / 10) * 100}%` }}
                            transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
                            className="relative h-full rounded-xl bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-200 shadow-[0_0_20px_rgba(245,158,11,0.4)] overflow-hidden"
                        >
                            {/* Shimmer Effect */}
                            <motion.div
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]"
                            />

                            {/* Internal Glow */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.4),transparent)]" />
                        </motion.div>
                    </div>

                    {/* Progress text - smaller */}
                    <p className="text-center text-xs font-medium text-slate-400 mt-2">
                        {10 - currentXP} victoire{10 - currentXP > 1 ? 's' : ''} avant le niveau {level + 1}
                    </p>
                </div>

                {/* Progression Popup - Portalled to body to match z-index */}
                {createPortal(
                    <AnimatePresence mode="wait" initial={false}>
                        {showRewards && (
                            <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 font-sans pointer-events-auto">
                                {/* Backdrop with optimized blur */}
                                <motion.div
                                    key="backdrop"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl will-change-[opacity,backdrop-filter]"
                                    onClick={() => setShowRewards(false)}
                                />

                                {/* Modal - Ultra Premium Glass - GPU Accelerated */}
                                <motion.div
                                    key="modal"
                                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                    style={{ transform: 'translateZ(0)' }}
                                    className="relative w-full max-w-lg bg-slate-900/80 rounded-[3rem] border border-white/20 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh] z-10 will-change-transform"
                                >
                                    {/* Animated Inner Shine - Optimized priority */}
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-[-100%] bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none opacity-50"
                                    />

                                    {/* Header */}
                                    <div className="p-8 pb-6 border-b border-white/10 bg-slate-900/40 relative">
                                        <button
                                            onClick={() => setShowRewards(false)}
                                            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 hover:scale-110 transition-all z-20"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>

                                        <div className="flex items-center gap-4 mb-6 relative">
                                            <div className="relative group">
                                                {/* Outer Glow Ring */}
                                                <motion.div
                                                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                                                    transition={{ duration: 3, repeat: Infinity }}
                                                    className="absolute -inset-2 rounded-[24px] bg-amber-500/20 blur-xl"
                                                />

                                                <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_2px_5px_rgba(255,255,255,0.5)] border border-amber-200/50 relative z-10 overflow-hidden">
                                                    {/* Shimmer on icon container */}
                                                    <motion.div
                                                        animate={{ x: ['-100%', '200%'] }}
                                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]"
                                                    />
                                                    <Trophy className="w-9 h-9 text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.3)] relative z-10" />
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">
                                                    Plan de Carrière
                                                </h3>
                                                <p className="text-[10px] font-black text-amber-500/80 uppercase tracking-[0.3em] mt-2 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 w-fit">
                                                    L'élite du SkyJo
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                                                <span className="text-slate-400">Niveau {level}</span>
                                                <span className="text-amber-500">Objectif {maxLevel}</span>
                                            </div>
                                            <div className="h-3 w-full bg-slate-950/40 rounded-full border border-white/5 overflow-hidden p-[2px]">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progressPercent}%` }}
                                                    className="h-full bg-gradient-to-r from-indigo-600 via-blue-400 to-cyan-300 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] relative overflow-hidden"
                                                >
                                                    <motion.div
                                                        animate={{ x: ['-200%', '300%'] }}
                                                        transition={{ duration: 4, repeat: Infinity }}
                                                        className="absolute inset-0 bg-white/30 skew-x-[-20deg]"
                                                    />
                                                </motion.div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-950/40">
                                        {REWARDS.map((reward) => {
                                            const isUnlocked = level >= reward.level;
                                            const isNext = level + 1 === reward.level;

                                            return (
                                                <motion.div
                                                    key={reward.level}
                                                    whileHover={isUnlocked || isNext ? { scale: 1.02, x: 5 } : {}}
                                                    className={cn(
                                                        "relative p-5 rounded-3xl border transition-all duration-300 group overflow-hidden",
                                                        isUnlocked
                                                            ? "bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/30 shadow-lg"
                                                            : isNext
                                                                ? "bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-blue-400/40 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
                                                                : "bg-white/[0.02] border-white/5 opacity-40 grayscale"
                                                    )}
                                                >
                                                    {/* Card Background Glow */}
                                                    {(isUnlocked || isNext) && (
                                                        <div className={cn(
                                                            "absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-10 pointer-events-none",
                                                            isUnlocked ? "bg-emerald-500" : "bg-blue-500"
                                                        )} />
                                                    )}

                                                    <div className="flex items-center gap-5 relative z-10">
                                                        <div className={cn(
                                                            "w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6",
                                                            isUnlocked ? "bg-emerald-500/20" : "bg-slate-800"
                                                        )}>
                                                            {reward.icon}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className={cn(
                                                                    "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg",
                                                                    isUnlocked
                                                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                                                        : isNext
                                                                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                                                            : "bg-slate-800 text-slate-500"
                                                                )}>
                                                                    NIVEAU {reward.level}
                                                                </span>
                                                                {isUnlocked ? (
                                                                    <div className="flex items-center gap-1.5 text-emerald-400">
                                                                        <Check className="w-4 h-4 shadow-sm" />
                                                                        <span className="text-[10px] font-black uppercase tracking-widest">Acquis</span>
                                                                    </div>
                                                                ) : (
                                                                    <Lock className="w-4 h-4 text-slate-500" />
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <h4 className={cn(
                                                                    "text-2xl font-black tracking-tight",
                                                                    isUnlocked ? "text-white" : "text-slate-400"
                                                                )}>
                                                                    {reward.name}
                                                                </h4>
                                                                {reward.type === 'ultime' && (
                                                                    <span className="text-[10px] font-black bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                                                                        Ultime
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <p className={cn(
                                                                "text-[13px] font-bold leading-relaxed mt-1.5",
                                                                isUnlocked ? "text-slate-200" : "text-slate-500"
                                                            )}>
                                                                {reward.description}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Level Progress Gauge */}
                                                    {isNext && (
                                                        <div className="mt-5 p-3 rounded-2xl bg-black/20 border border-white/5">
                                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">
                                                                <span>Progression</span>
                                                                <span className="bg-blue-400/20 px-2 py-0.5 rounded-md">{currentXP} / 10 XP</span>
                                                            </div>
                                                            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-[2px]">
                                                                <motion.div
                                                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-300 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${(currentXP / 10) * 100}%` }}
                                                                    transition={{ duration: 1 }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    {/* Footer */}
                                    <div className="p-6 border-t border-white/10 bg-slate-950/40 text-center">
                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] leading-relaxed">
                                            Triomphez pour gravir les échelons et<br />
                                            <span className="text-slate-300">Débloquer de nouvelles récompenses</span>
                                        </p>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence >
                    ,
                    document.body
                )}
            </div >
        </>
    );
});

export default ExperienceBar;
