import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

// --- SOUS-COMPOSANTS DIVINE LIGHT ---

const GoldMote = () => {
    // Particules qui montent doucement pendant la charge
    const randomX = (Math.random() - 0.5) * 15;
    const randomY = (Math.random() - 0.5) * 200;
    const duration = 0.8 + Math.random() * 0.5;

    return (
        <motion.div
            initial={{
                x: randomX,
                y: 100,
                opacity: 0,
                scale: 0
            }}
            animate={{
                y: randomY - 100,
                opacity: [0, 1, 0],
                scale: [0, 1.2, 0]
            }}
            transition={{ duration: duration, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 w-[2px] h-[2px] bg-amber-200 rounded-full z-50 pointer-events-none shadow-[0_0_6px_rgba(251,191,36,0.9)]"
        />
    )
};

const SparkleParticle = () => {
    // Particules post-clean qui scintillent
    const randomX = (Math.random() - 0.5) * 80;
    const randomY = (Math.random() - 1) * 80;
    const delay = Math.random() * 0.3;

    return (
        <motion.div
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{
                x: randomX,
                y: randomY,
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                rotate: Math.random() * 180
            }}
            transition={{ duration: 1.5, delay, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2"
        >
            <Sparkles size={8} className="text-amber-100/60" />
        </motion.div>
    )
};

// --- COMPOSANT PRINCIPAL V5 "DIVINE LIGHT" ---

const ColumnBeam = () => {
    const [phase, setPhase] = useState('charge');

    useEffect(() => {
        const timer = setTimeout(() => setPhase('blast'), 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="absolute inset-0 z-50 pointer-events-none overflow-visible flex flex-col items-center justify-center">

            <AnimatePresence>
                {/* 1. PHASE DE CHARGE (Poussière d'or) */}
                {phase === 'charge' && (
                    <div className="absolute inset-0">
                        {[...Array(12)].map((_, i) => (
                            <GoldMote key={`mote-${i}`} />
                        ))}
                    </div>
                )}

                {/* 2. PHASE DE PURIFICATION (BLAST) */}
                {phase === 'blast' && (
                    <>
                        {/* Soft localized Glow instead of huge flash */}
                        <motion.div
                            key="soft-flash"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.3, 0] }}
                            transition={{ duration: 0.8 }}
                            className="absolute inset-0 bg-amber-50 z-[60] mix-blend-overlay pointer-events-none rounded-xl blur-xl"
                        />

                        {/* Core Beam (Droit et élégant) */}
                        <motion.div
                            key="main-beam"
                            initial={{ scaleY: 0, opacity: 0 }}
                            animate={{ scaleY: 1, opacity: [0, 1, 0] }}
                            transition={{ duration: 0.6, ease: "easeInOut" }}
                            className="absolute inset-y-[-100px] left-1/2 -translate-x-1/2 w-[1px] bg-white z-40 shadow-[0_0_10px_1px_rgba(255,255,255,0.8)]"
                        />

                        {/* Divine Glow (Halo doré) */}
                        <motion.div
                            key="gold-glow"
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: [0, 1, 0], opacity: [0, 0.6, 0] }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="absolute inset-y-[-150px] left-1/2 -translate-x-1/2 w-4 bg-amber-300 blur-lg z-30 mix-blend-screen"
                        />

                        {/* Light Pillars Subtiles */}
                        <motion.div
                            key="pillar-l"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "100%", opacity: [0, 0.3, 0] }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="absolute bottom-0 left-[10%] w-[1px] bg-amber-200/50"
                        />
                        <motion.div
                            key="pillar-r"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "100%", opacity: [0, 0.3, 0] }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="absolute bottom-0 right-[10%] w-[1px] bg-amber-200/50"
                        />

                        {/* Shockwave Douce */}
                        <motion.div
                            key="soft-wave"
                            initial={{ scale: 0.5, opacity: 0, borderWidth: "2px" }}
                            animate={{ scale: 1.5, opacity: [0, 0.4, 0] }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-amber-200/40 z-20"
                        />

                        {/* Sparkling Aftermath */}
                        {[...Array(15)].map((_, i) => <SparkleParticle key={`sparkle-${i}`} />)}
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ColumnBeam;
