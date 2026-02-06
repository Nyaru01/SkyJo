import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Sparkles, X } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { cn } from '../lib/utils';
import Confetti from 'react-confetti';
import useWindowSize from '../hooks/useWindowSize';

// Reward definitions
import { LEVEL_REWARDS } from '../lib/rewards';

export default function LevelUpCelebration() {
    const level = useGameStore(state => state.level);
    const lastAcknowledgedLevel = useGameStore(state => state.lastAcknowledgedLevel);
    const acknowledgeLevelUp = useGameStore(state => state.acknowledgeLevelUp);

    const [show, setShow] = useState(false);
    const [reward, setReward] = useState(null);
    const { width, height } = useWindowSize();

    useEffect(() => {
        // Show if level > lastAcknowledgedLevel
        // And we have a reward defined (or generic)
        if (level > lastAcknowledgedLevel) {
            setTimeout(() => {
                setReward(LEVEL_REWARDS[level] || {
                    type: 'generic',
                    content: '🎁',
                    name: `Niveau ${level}`,
                    description: 'Bravo ! Vous avez atteint un nouveau niveau.',
                    rarity: 'common'
                });
                setShow(true);
            }, 0);
        } else {
            setShow(false);
        }
    }, [level, lastAcknowledgedLevel]);

    const handleClaim = () => {
        setShow(false);
        // Wait for animation to finish before updating store
        setTimeout(() => {
            acknowledgeLevelUp();
        }, 500);
    };

    if (!show || !reward) return null;

    const rarityColors = {
        common: 'text-slate-400 bg-slate-800/50 border-slate-700',
        uncommon: 'text-emerald-400 bg-emerald-900/20 border-emerald-500/30',
        rare: 'text-blue-400 bg-blue-900/20 border-blue-500/30',
        epic: 'text-purple-400 bg-purple-900/20 border-purple-500/30',
        legendary: 'text-amber-400 bg-amber-900/20 border-amber-500/30',
        mythic: 'text-rose-400 bg-rose-900/25 border-rose-500/30 font-black italic animate-pulse',
    };

    const rarityGlows = {
        mythic: 'from-rose-500/40 to-red-600/40',
        legendary: 'from-amber-400/40 to-orange-600/40',
        epic: 'from-purple-500/40 to-indigo-600/40',
        rare: 'from-blue-400/40 to-indigo-500/40',
        uncommon: 'from-emerald-400/40 to-teal-500/40',
        common: 'from-slate-400/20 to-slate-600/20',
    };

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 font-sans overflow-hidden perspective-1000">
                    <Confetti
                        width={width}
                        height={height}
                        recycle={false}
                        numberOfPieces={800}
                        gravity={0.12}
                        colors={['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#F43F5E']}
                    />

                    {/* Backdrop with extreme blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-950/95 backdrop-blur-[20px]"
                    />

                    {/* Ultra Premium Particles Layer */}
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(30)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{
                                    opacity: 0,
                                    x: Math.random() * width,
                                    y: Math.random() * height,
                                    scale: Math.random() * 0.5 + 0.5
                                }}
                                animate={{
                                    opacity: [0, 0.8, 0],
                                    y: [null, '-=100'],
                                    x: [null, `+=${(Math.random() - 0.5) * 50}`],
                                }}
                                transition={{
                                    duration: Math.random() * 3 + 4,
                                    repeat: Infinity,
                                    delay: Math.random() * 5,
                                    ease: "linear"
                                }}
                                className={cn(
                                    "absolute w-1 h-1 rounded-full",
                                    reward.rarity === 'mythic' ? 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]' :
                                        reward.rarity === 'legendary' ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]' :
                                            'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                                )}
                            />
                        ))}
                    </div>

                    {/* Cinematic Background Glows */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <motion.div
                            animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.2, 0.4, 0.2],
                                rotate: [0, 90, 0],
                            }}
                            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                            className={cn(
                                "absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px]",
                                reward.rarity === 'mythic' ? 'bg-rose-600/20' :
                                    reward.rarity === 'legendary' ? 'bg-amber-500/20' :
                                        reward.rarity === 'epic' ? 'bg-purple-500/20' : 'bg-blue-500/10'
                            )}
                        />
                        <motion.div
                            animate={{
                                scale: [1.3, 1, 1.3],
                                opacity: [0.2, 0.4, 0.2],
                                rotate: [0, -90, 0],
                            }}
                            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                            className={cn(
                                "absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px]",
                                reward.rarity === 'mythic' ? 'bg-red-600/20' :
                                    reward.rarity === 'legendary' ? 'bg-orange-500/20' :
                                        reward.rarity === 'epic' ? 'bg-indigo-500/20' : 'bg-slate-500/10'
                            )}
                        />
                    </div>

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 100, rotateX: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: -50, rotateX: -20 }}
                        transition={{
                            type: "spring",
                            damping: 18,
                            stiffness: 110
                        }}
                        className="relative w-full max-w-lg mx-4"
                    >
                        {/* Divine Beam Behind */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[150%] pointer-events-none z-0">
                            <div className={cn(
                                "absolute inset-0 opacity-20 blur-[80px]",
                                reward.rarity === 'mythic' ? 'bg-rose-500' : 'bg-amber-500'
                            )} />
                        </div>

                        {/* Premium Glass Container */}
                        <div className="relative bg-slate-900/60 backdrop-blur-[32px] rounded-[3rem] border border-white/20 shadow-[0_48px_100px_-24px_rgba(0,0,0,0.8)] overflow-hidden">
                            {/* Inner Animated Shine */}
                            <motion.div
                                animate={{
                                    opacity: [0.1, 0.2, 0.1],
                                    rotate: [0, 360]
                                }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-[-100%] bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none"
                            />

                            <div className="relative p-10 flex flex-col items-center text-center">
                                {/* Header: Level Up Badge with Shimmer */}
                                <motion.div
                                    initial={{ y: -50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4, type: "spring" }}
                                    className="mb-8 group"
                                >
                                    <div className="relative overflow-hidden bg-white/10 backdrop-blur-xl px-6 py-2.5 rounded-2xl border border-white/20 shadow-2xl flex items-center gap-3">
                                        <motion.div
                                            animate={{ x: ['-200%', '300%'] }}
                                            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] pointer-events-none"
                                        />
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg relative z-10">
                                            <Trophy className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="text-white font-black text-base tracking-tighter uppercase relative z-10 italic">
                                            Niveau {level} atteint !
                                        </span>
                                    </div>
                                </motion.div>

                                {/* Complex Multi-Halo Reward Area */}
                                <motion.div
                                    initial={{ scale: 0, rotate: -30 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{
                                        type: "spring",
                                        delay: 0.6,
                                        damping: 15,
                                        stiffness: 90
                                    }}
                                    className="mb-12 relative h-64 w-64 flex items-center justify-center group"
                                >
                                    {/* Halo Layer 1: Exterior Slow Reverse */}
                                    <motion.div
                                        animate={{ rotate: -360 }}
                                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                                        className={cn(
                                            "absolute inset-[-40px] opacity-20 blur-2xl rounded-full border-4 border-dashed",
                                            reward.rarity === 'mythic' ? 'border-rose-400' : 'border-amber-400'
                                        )}
                                    />

                                    {/* Halo Layer 2: Main Dynamic Bloom */}
                                    <motion.div
                                        animate={{
                                            rotate: 360,
                                            scale: [1, 1.1, 1],
                                        }}
                                        transition={{
                                            rotate: { duration: 15, repeat: Infinity, ease: "linear" },
                                            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                                        }}
                                        className={cn(
                                            "absolute inset-[-30px] opacity-40 blur-3xl rounded-full",
                                            reward.rarity === 'mythic' ? 'bg-gradient-to-r from-rose-500 to-red-600' :
                                                reward.rarity === 'legendary' ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                                                    reward.rarity === 'epic' ? 'bg-gradient-to-r from-purple-500 to-indigo-600' :
                                                        'bg-gradient-to-r from-blue-400 to-indigo-500'
                                        )}
                                    />

                                    {/* Halo Layer 3: Intense Core Pulse */}
                                    <motion.div
                                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className={cn(
                                            "absolute inset-0 opacity-50 blur-xl rounded-full",
                                            reward.rarity === 'mythic' ? 'bg-rose-400' : 'bg-white'
                                        )}
                                    />

                                    <div className="relative z-10 transition-transform duration-500 group-hover:scale-110">
                                        {/* Dynamic Light Sweep on Reward Object */}
                                        <div className="relative">
                                            {reward.type === 'emoji' ? (
                                                <motion.div
                                                    animate={{
                                                        y: [0, -20, 0],
                                                        rotate: [-5, 5, -5]
                                                    }}
                                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                                    className="relative"
                                                >
                                                    <span className="text-[10rem] leading-none inline-block drop-shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
                                                        {reward.content}
                                                    </span>
                                                    <motion.div
                                                        animate={{ opacity: [0, 1, 0], x: ['-100%', '100%'] }}
                                                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                                                        className="absolute inset-0 bg-white blur-md opacity-0 mix-blend-overlay rotate-45"
                                                    />
                                                </motion.div>
                                            ) : reward.type === 'skin' ? (
                                                <div className="relative w-48 h-72 rounded-3xl overflow-hidden border-[6px] border-white/40 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]">
                                                    <img
                                                        src={reward.image}
                                                        alt={reward.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                                                    <motion.div
                                                        animate={{ x: ['-200%', '300%'] }}
                                                        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
                                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-30deg]"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-48 h-48 rounded-[3rem] bg-white/20 backdrop-blur-xl flex items-center justify-center border-2 border-white/30 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden">
                                                    <motion.div
                                                        animate={{ x: ['-200%', '300%'] }}
                                                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                                        className="absolute inset-0 bg-white/20 skew-x-[-20deg]"
                                                    />
                                                    <span className="text-[7rem] relative z-10">{reward.content}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Reward Info with Premium Typography */}
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="space-y-4 mb-12"
                                >
                                    <div className={cn(
                                        "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] border",
                                        rarityColors[reward.rarity] || rarityColors.common
                                    )}>
                                        <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] animate-pulse",
                                            reward.rarity === 'mythic' ? 'bg-rose-400' :
                                                reward.rarity === 'legendary' ? 'bg-amber-400' :
                                                    reward.rarity === 'epic' ? 'bg-purple-400' : 'bg-blue-400'
                                        )} />
                                        {reward.rarity}
                                    </div>
                                    <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/60 leading-none tracking-tight py-1">
                                        {reward.name}
                                    </h2>
                                    <p className="text-slate-300/60 text-base max-w-[320px] mx-auto font-medium leading-relaxed italic">
                                        "{reward.description}"
                                    </p>
                                </motion.div>

                                {/* Claim Button - Ultra Dynamic */}
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1 }}
                                    className="relative w-full"
                                >
                                    {/* Animated Shadow Glow - Removed green */}
                                    <motion.div
                                        animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className={cn(
                                            "absolute inset-[-15px] blur-2xl rounded-[1.5rem] opacity-40",
                                            reward.rarity === 'mythic' ? 'bg-rose-500' :
                                                reward.rarity === 'legendary' ? 'bg-amber-500' :
                                                    'bg-indigo-500/50'
                                        )}
                                    />

                                    <motion.button
                                        onClick={handleClaim}
                                        whileHover={{ scale: 1.02, y: -4 }}
                                        whileTap={{ scale: 0.97 }}
                                        className={cn(
                                            "relative group w-full py-6 px-12 rounded-[2rem] font-black text-white text-xl uppercase tracking-widest overflow-hidden transition-all shadow-2xl",
                                            "border-t border-white/30 border-b-[6px] border-black/40", // Relief effect
                                            reward.rarity === 'mythic' ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-red-700' :
                                                reward.rarity === 'legendary' ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-orange-600' :
                                                    reward.rarity === 'epic' ? 'bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-700' :
                                                        'bg-gradient-to-r from-indigo-600 via-indigo-500 to-slate-700' // Changed green to Indigo
                                        )}
                                    >
                                        <motion.div
                                            animate={{ x: ['-200%', '300%'] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                            className="absolute inset-0 bg-white/20 skew-x-[-30deg]"
                                        />
                                        <div className="relative flex items-center justify-center gap-4">
                                            <span>Ok</span>
                                        </div>
                                    </motion.button>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
