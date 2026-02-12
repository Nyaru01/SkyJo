import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { cn } from '../lib/utils';
import { PremiumTiltButton } from './ui/PremiumTiltButton';
import Confetti from 'react-confetti';
import useWindowSize from '../hooks/useWindowSize';
import { LEVEL_REWARDS } from '../lib/rewards';

/**
 * LevelUpCelebration - v3 (Stable & Simple)
 * Fixes flickering by removing complex animations and using a simple fade-in.
 */
const LevelUpCelebration = () => {
    const storeLevel = useGameStore(state => state.level);
    const lastAcknowledgedLevel = useGameStore(state => state.lastAcknowledgedLevel);
    const acknowledgeLevelUp = useGameStore(state => state.acknowledgeLevelUp);

    const [celebratedLevel, setCelebratedLevel] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const { width, height } = useWindowSize();

    useEffect(() => {
        if (storeLevel > lastAcknowledgedLevel && !isVisible && !celebratedLevel) {
            setCelebratedLevel(storeLevel);
            setIsVisible(true);
        }
    }, [storeLevel, lastAcknowledgedLevel, isVisible, celebratedLevel]);

    const reward = useMemo(() => {
        if (!celebratedLevel) return null;
        return LEVEL_REWARDS[celebratedLevel] || {
            type: 'generic',
            content: '🎁',
            name: `Niveau ${celebratedLevel}`,
            description: 'Un nouveau palier franchi !',
            rarity: 'common'
        };
    }, [celebratedLevel]);

    const handleClaim = useCallback(() => {
        acknowledgeLevelUp();
        setIsVisible(false);
    }, [acknowledgeLevelUp]);

    const onExitComplete = () => {
        setCelebratedLevel(null);
    };

    if (!reward && !isVisible) return null;

    const rarityColors = {
        common: 'text-slate-400',
        uncommon: 'text-emerald-400',
        rare: 'text-blue-400',
        epic: 'text-purple-400',
        legendary: 'text-amber-400',
        mythic: 'text-rose-400',
        divine: 'text-fuchsia-400 drop-shadow-[0_0_10px_rgba(232,121,249,0.8)]',
        éternel: 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]',
    };

    return createPortal(
        <AnimatePresence onExitComplete={onExitComplete}>
            {isVisible && reward && (
                <motion.div
                    key="celebration"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 z-[1000000] flex flex-col items-center justify-center font-sans overflow-hidden"
                    onClick={handleClaim}
                >
                    {/* Full Screen Animated Background */}
                    <div className="absolute inset-0 bg-slate-950">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-purple-900/60 to-slate-900 animate-gradient-xy" />
                        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20" />
                        {/* Orb Effects */}
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse" />
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-700" />
                    </div>

                    {/* Confetti */}
                    <Confetti
                        width={width}
                        height={height}
                        recycle={true}
                        numberOfPieces={150}
                        gravity={0.08}
                        colors={['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#F43F5E', '#FFFFFF']}
                    />

                    {/* Main Content Container - Centered & Floating */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: -50 }}
                        transition={{
                            type: "spring",
                            damping: 20,
                            stiffness: 100,
                            delay: 0.2
                        }}
                        className="relative z-10 flex flex-col items-center max-w-2xl w-full p-6 text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Level Up Title with Glow */}
                        <motion.div
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4, type: "spring" }}
                            className="mb-8"
                        >
                            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-600 drop-shadow-[0_0_25px_rgba(245,158,11,0.6)] tracking-tighter uppercase italic transform -rotate-2">
                                LEVEL UP !
                            </h1>
                            <div className="text-2xl md:text-3xl font-bold text-white tracking-[0.5em] uppercase mt-2 opacity-90">
                                Niveau {celebratedLevel}
                            </div>
                        </motion.div>

                        {/* Reward Card */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.6, type: "spring" }}
                            className="relative bg-black/40 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center w-full max-w-md mx-auto"
                        >
                            {/* Rarity & Icon Halo */}
                            <div className={cn(
                                "absolute inset-0 rounded-[3rem] opacity-30 blur-2xl",
                                reward.rarity === 'éternel' ? "bg-cyan-500" :
                                    reward.rarity === 'divine' ? "bg-fuchsia-500" :
                                        reward.rarity === 'mythic' ? "bg-rose-500" :
                                            reward.rarity === 'legendary' ? "bg-amber-500" :
                                                "bg-blue-500"
                            )} />

                            <motion.div
                                animate={{
                                    y: [0, -15, 0],
                                    rotate: [0, 5, -5, 0]
                                }}
                                transition={{
                                    duration: 5,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="relative mb-8"
                            >
                                <div className={cn(
                                    "w-32 h-32 md:w-40 md:h-40 rounded-[2rem] flex items-center justify-center relative z-10",
                                    "bg-gradient-to-br from-white/10 to-transparent border border-white/20 shadow-2xl backdrop-blur-sm"
                                )}>
                                    <span className="text-6xl md:text-7xl drop-shadow-[0_0_30px_rgba(255,255,255,0.6)] grayscale-0">
                                        {reward.type === 'emoji' || reward.type === 'generic' ? reward.content : '🎁'}
                                    </span>
                                </div>
                            </motion.div>

                            {/* Reward Text */}
                            <span className={cn(
                                "inline-block px-4 py-1 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-4 border",
                                rarityColors[reward.rarity] || rarityColors.common,
                                "bg-black/40 border-current"
                            )}>
                                {reward.rarity}
                            </span>

                            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-none">
                                {reward.name}
                            </h2>

                            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                                {reward.description}
                            </p>

                            {/* Action Button */}
                            <div className="w-full">
                                <PremiumTiltButton
                                    onClick={handleClaim}
                                    gradientFrom="from-amber-500"
                                    gradientTo="to-orange-600"
                                    shadowColor="shadow-orange-500/40"
                                    className="w-full py-5 text-xl font-black tracking-widest uppercase"
                                >
                                    RÉCUPÉRER
                                </PremiumTiltButton>
                            </div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default memo(LevelUpCelebration);
