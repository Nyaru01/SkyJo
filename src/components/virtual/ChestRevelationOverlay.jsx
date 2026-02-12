import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Trophy, ChevronRight, Gem, Skull } from 'lucide-react';
import { Button } from '../ui/Button';
import SkyjoCard from './SkyjoCard';
import { useFeedback } from '../../hooks/useFeedback';
import { cn } from '../../lib/utils';

/**
 * Component for the sequential revelation of Chest Cards (?)
 */
const FLIP_DELAY = 800;
const REVEAL_DELAY = 800;

const ChestRevelationOverlay = ({ gameState, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [revealValue, setRevealValue] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const { playCardFlip, playVictory, playCardPlace } = useFeedback();

    // List all chest cards in the game - Memoizing to prevent infinite loop
    const chests = useMemo(() => {
        const c = [];
        // Handle mock data or real game state
        const players = gameState.players || [];

        players.forEach(p => {
            if (!p.hand) return;
            p.hand.forEach((card) => {
                if (card && (card.specialType === 'CH' || card.value === 'CH')) {
                    c.push({
                        card: card,
                        playerId: p.id,
                        playerName: p.name,
                        result: gameState.chestResults ? gameState.chestResults[card.id] : (Math.random() > 0.5 ? -15 : 15)
                    });
                }
            });
        });
        return c;
    }, [gameState.players, gameState.chestResults]);

    const currentChest = chests[currentIndex];

    // Auto-animate revelation for current chest
    // Auto-animate revelation for current chest
    useEffect(() => {
        if (!currentChest) {
            // If no chests at all or finished
            if (chests.length > 0 && currentIndex >= chests.length) {
                onComplete();
            } else if (chests.length === 0) {
                onComplete();
            }
            return;
        }

        // Reset for next chest
        setRevealValue(null);
        setIsAnimating(false);

        let revealTimer;
        // Auto-animate revelation
        const startTimer = setTimeout(() => {
            setIsAnimating(true);
            playCardFlip();

            revealTimer = setTimeout(() => {
                setRevealValue(currentChest.result); // Assume result is stable for this card instance
                if (currentChest.result < 0) {
                    playVictory();
                    // Confetti explosion for Treasure
                    import('canvas-confetti').then((confetti) => {
                        confetti.default({
                            particleCount: 100,
                            spread: 70,
                            origin: { y: 0.6 },
                            colors: ['#10b981', '#fbbf24', '#ffffff']
                        });
                    });
                } else {
                    playCardPlace();
                }
            }, REVEAL_DELAY);
        }, FLIP_DELAY);

        return () => {
            clearTimeout(startTimer);
            clearTimeout(revealTimer);
        };
    }, [currentIndex, currentChest?.card?.id, chests.length, onComplete, playCardFlip, playVictory, playCardPlace]); // Removed currentChest object dependency

    const handleNext = () => {
        if (currentIndex < chests.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    if (!currentChest) return null;

    // Determine the final result state immediately to prep the back of the card
    const resultIsTrap = currentChest.result > 0;
    const resultIsTreasure = currentChest.result < 0;

    // Internal state for the "moment" of revelation
    const isTrap = revealValue > 0;
    const isTreasure = revealValue < 0;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-md md:backdrop-blur-2xl animate-in fade-in duration-700">
            {/* Ambient gold glow and particles */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[60px] md:blur-[120px] pointer-events-none animate-pulse-slow" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 pointer-events-none" />

            <div className="flex flex-col items-center gap-12 p-8 max-w-sm w-full relative z-10">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 mb-4 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                        <HelpCircle className="w-4 h-4 text-amber-500 animate-[spin_4s_linear_infinite]" />
                        <span className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em] text-shadow-sm">Révélation Mystère</span>
                    </div>
                    <h2 className="text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-slate-400 text-4xl font-black drop-shadow-2xl tracking-tight">
                        {currentChest.playerName}
                    </h2>
                </motion.div>

                <div className="relative w-56 h-80" style={{ perspective: '1200px' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            className="w-full h-full relative"
                        >
                            {/* Floating Animation Container */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                className="w-full h-full relative"
                                style={{ willChange: 'transform' }}
                            >
                                {/* Glowing Halo behind card */}
                                <motion.div
                                    animate={{ opacity: isAnimating ? 0.3 : 0.6, scale: isAnimating ? 1.1 : 1 }}
                                    className="absolute inset-0 bg-amber-400/30 rounded-[1.5rem] blur-xl"
                                />

                                {/* 3D Flip Container */}
                                <motion.div
                                    animate={isAnimating ? { rotateY: 180, scale: 1.1 } : { rotateY: 0, scale: 1 }}
                                    transition={{
                                        type: "spring", stiffness: 45, damping: 14, mass: 1.2
                                    }}
                                    style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
                                    className="w-full h-full relative"
                                >
                                    {/* Front - The Chest Card */}
                                    <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
                                        <img
                                            src="/card-chest.png"
                                            alt="La Carte Mystère"
                                            className="w-full h-full object-cover rounded-[1.2rem] shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 rounded-[1.2rem] pointer-events-none" />
                                    </div>

                                    {/* Back - The Result */}
                                    <div
                                        className={cn(
                                            "absolute inset-0 rounded-[1.2rem] shadow-[0_30px_70px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center overflow-hidden border-[4px]",
                                            resultIsTreasure ? "border-emerald-500/50" : (resultIsTrap ? "border-rose-500/50" : "border-slate-700")
                                        )}
                                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                                    >
                                        <img
                                            src={resultIsTreasure ? "/card-treasure.png" : "/card-trap.png"}
                                            alt={resultIsTreasure ? "Trésor -15" : "Piège +15"}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 opacity-50 pointer-events-none" />

                                        <AnimatePresence>
                                            {/* Removed redundant icons to let the card art breathe */}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="w-full space-y-4">
                    <Button
                        onClick={handleNext}
                        disabled={revealValue === null}
                        className={cn(
                            "w-full h-16 rounded-[2rem] font-black text-lg shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden group",
                            revealValue !== null
                                ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white border-none transform hover:-translate-y-1"
                                : "bg-white/5 text-slate-500 border border-white/10"
                        )}
                    >
                        {revealValue !== null && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1s_infinite]" />
                        )}

                        {currentIndex < chests.length - 1 ? (
                            <>
                                Carte suivante
                                <ChevronRight className="w-6 h-6" />
                            </>
                        ) : (
                            <>
                                <Trophy className="w-6 h-6 mb-1" />
                                Voir les Scores
                            </>
                        )}
                    </Button>

                    {/* Enhanced Progress dots */}
                    <div className="flex justify-center gap-3">
                        {chests.map((_, i) => (
                            <motion.div
                                key={i}
                                initial={false}
                                animate={{
                                    width: i === currentIndex ? 32 : 8,
                                    height: 8,
                                    backgroundColor: i === currentIndex ? '#f59e0b' : (i < currentIndex ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)'),
                                    opacity: i < currentIndex ? 0.4 : 1
                                }}
                                className="rounded-full transition-colors duration-300"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChestRevelationOverlay;
