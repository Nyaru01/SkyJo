import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Star, Skull, TrendingUp, Swords, RefreshCw, Eraser, Zap, Flame, HelpCircle, Orbit } from 'lucide-react';
import { Button } from './ui/Button';
import SkyjoCard from './virtual/SkyjoCard';

const BONUS_STEPS = [
    {
        title: "Le Mode Tourment",
        description: "Bienvenue dans la variante la plus extrême de Skyjo ! Ici, nous avons ajouté 28 cartes spéciales au deck original pour rendre les parties stratégiques et impitoyables.",
        icon: Flame,
        color: "text-rose-500",
        bg: "bg-rose-500/10",
        content: (
            <div className="flex justify-center my-4">
                <div className="inline-block rounded-2xl bg-gradient-to-br from-rose-500/40 via-purple-500/30 to-rose-500/40 p-[2px] shadow-lg shadow-rose-500/25">
                    <div className="rounded-[14px] overflow-hidden bg-slate-900">
                        <img
                            src="/Tourment.png"
                            alt="Tourment Mode"
                            className="block max-w-full h-auto rounded-[14px]"
                        />
                    </div>
                </div>
            </div>
        )
    },
    {
        title: "La Carte (-10)",
        description: "La meilleure carte du jeu ! Elle est de couleur violette et vaut -10 points. Il n'en existe que 6 dans tout le deck.",
        icon: Swords,
        color: "text-violet-400",
        bg: "bg-violet-400/10",
        content: (
            <div className="flex flex-col items-center gap-4 py-4">
                <motion.div
                    animate={{ y: [0, -10, 0], scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="relative z-10"
                >
                    <SkyjoCard
                        card={{ id: 'bonus-star', value: -10, color: 'violet', isRevealed: true }}
                        size="sm"
                        isClickable={false}
                    />
                </motion.div>
                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Votre meilleure alliée !</p>
            </div>
        )
    },
    {
        title: "Le Crâne Maudit",
        description: "ATTENTION ! Cette carte vaut 20 points. (6 exemplaires). MALÉDICTION : Si vous la piochez, vous êtes OBLIGÉ de la placer ! Une fois posée, elle est VERROUILLÉE pendant 3 rounds (impossible à échanger).",
        icon: Skull,
        color: "text-rose-600",
        bg: "bg-rose-600/10",
        content: (
            <div className="flex flex-col items-center gap-4 py-4">
                <motion.div
                    animate={{ rotate: [0, -2, 2, 0], x: [0, -1, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="relative z-10"
                >
                    <SkyjoCard
                        card={{ id: 'bonus-skull', value: 20, color: 'darkred', isRevealed: true }}
                        size="sm"
                        isClickable={false}
                    />
                </motion.div>
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Débarrassez-vous en vite !</p>
            </div>
        )
    },
    {
        title: "L'Échange",
        description: "CARTE ÉCHANGE (4 exemplaires) : Le symbole des flèches circulaires vous permet de permuter l'une de vos cartes (visible ou cachée) avec celle d'un autre joueur. Utilisez-la stratégiquement pour récupérer un -10 par exemple !",
        icon: RefreshCw,
        color: "text-indigo-400",
        bg: "bg-indigo-400/10",
        content: (
            <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex items-center gap-4 relative">
                    {/* The S card that triggers it */}
                    <div className="relative group">
                        <SkyjoCard
                            card={{ id: 'tut-s-card', value: 0, color: 'special', specialType: 'S', isRevealed: true }}
                            size="xs"
                            isClickable={false}
                        />
                        <div className="absolute -top-1 -right-1 bg-indigo-500 rounded-full p-0.5 border border-white/20">
                            <RefreshCw className="w-2 h-2 text-white animate-spin-slow" />
                        </div>
                    </div>

                    <div className="w-4 h-[1px] bg-white/20" />

                    <div className="flex items-center gap-3">
                        <motion.div
                            animate={{ x: [0, 20, 0], opacity: [1, 0.5, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            <SkyjoCard
                                card={{ id: 'tut-swap-1', value: 12, color: 'red', isRevealed: true }}
                                size="xs"
                                isClickable={false}
                            />
                        </motion.div>
                        <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin-slow" />
                        <motion.div
                            animate={{ x: [0, -20, 0], opacity: [1, 0.5, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            <SkyjoCard
                                card={{ id: 'tut-swap-2', value: -10, color: 'violet', isRevealed: true }}
                                size="xs"
                                isClickable={false}
                            />
                        </motion.div>
                    </div>
                </div>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Échangez votre pire carte contre sa meilleure !</p>
            </div>
        )
    },
    {
        title: "Le Nettoyage",
        description: "CARTE ÉTOILE (4 exemplaires) : Agit comme un joker de complétion. Si vous l'alignez avec une paire sur une même ligne, la ligne entière est supprimée. Sa valeur intrinsèque est de 0 point.",
        icon: Zap,
        color: "text-indigo-400",
        bg: "bg-indigo-400/10",
        content: (
            <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex gap-2 relative">
                    <SkyjoCard
                        card={{ id: 'tut-clean-1', value: 5, color: 'green', isRevealed: true }}
                        size="xs"
                        isClickable={false}
                    />
                    <SkyjoCard
                        card={{ id: 'tut-clean-2', value: 5, color: 'green', isRevealed: true }}
                        size="xs"
                        isClickable={false}
                    />
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        <SkyjoCard
                            card={{ id: 'tut-clean-3', value: 0, color: 'special', specialType: 'C', isRevealed: true }}
                            size="xs"
                            isClickable={false}
                        />
                    </motion.div>
                </div>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Faites place nette dans votre jeu !</p>
            </div>
        )
    },
    {
        title: "La Carte Mystère",
        description: "CARTE MYSTÈRE (4 exemplaires) : Sa valeur résolue (-15 ou +15) n'est révélée qu'à la fin de la partie. ASTUCE : Elle agit comme un 0 pour les combos : utile pour sécuriser une colonne... au risque de perdre un bonus de -15 !",
        icon: HelpCircle,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        content: (
            <div className="flex flex-col items-center gap-4 py-4">
                <motion.div
                    animate={{
                        rotateY: [0, 180, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    style={{ perspective: 1000 }}
                >
                    <SkyjoCard
                        card={{ id: 'tut-chest', value: 0, color: 'gold', specialType: 'CH', isRevealed: true }}
                        size="sm"
                        isClickable={false}
                    />
                </motion.div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                        <span className="text-xl font-black text-emerald-400">-15</span>
                        <span className="text-[8px] font-bold text-slate-500">TRÉSOR</span>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="flex flex-col items-center">
                        <span className="text-xl font-black text-rose-500">+15</span>
                        <span className="text-[8px] font-bold text-slate-500">PIÈGE</span>
                    </div>
                </div>
            </div>
        )
    },
    {
        title: "Le Trou Noir",
        description: "CARTE TROU NOIR (4 exemplaires) : ASPIRATION ! Lorsque vous piochez cette carte, elle aspire instantanément toute la défausse. Les cartes sont mélangées et remises dans la pioche. Votre tour s'arrête immédiatement après.",
        icon: Orbit,
        color: "text-slate-200",
        bg: "bg-slate-900",
        content: (
            <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex items-center gap-6 relative">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                        className="relative z-10"
                    >
                        <SkyjoCard
                            card={{ id: 'tut-hole', value: 0, color: 'black', specialType: 'H', isRevealed: true }}
                            size="sm"
                            isClickable={false}
                        />
                    </motion.div>
                    <div className="relative">
                        <div className="flex flex-col gap-1 opacity-40">
                            <div className="w-8 h-12 bg-slate-700 rounded-sm border border-white/10" />
                            <div className="w-8 h-12 bg-slate-700 rounded-sm border border-white/10" />
                        </div>
                        <motion.div
                            animate={{
                                x: [-20, -60],
                                y: [0, 0],
                                opacity: [0, 1, 0],
                                scale: [1, 0.5, 0]
                            }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="absolute top-1/2 left-0 -translate-y-1/2"
                        >
                            <div className="w-6 h-10 bg-blue-500/50 rounded-sm blur-[2px]" />
                        </motion.div>
                    </div>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nettoyez la table et rechargez la pioche !</p>
            </div>
        )
    },
    {
        title: "Astuce",
        description: "Vous avez un doute sur les cartes passées ? Faites un appui long sur la défausse pour voir les 3 dernières cartes jouées !",
        icon: Zap,
        color: "text-sky-400",
        bg: "bg-sky-400/10",
        content: (
            <div className="flex flex-col items-center justify-center py-4 bg-slate-800/30 rounded-2xl border border-white/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-slate-700/50 animate-pulse border border-white/10" />
                    <span className="text-xs font-bold text-slate-400">Maintenez appuyé...</span>
                </div>
                <div className="flex -space-x-4">
                    <SkyjoCard card={{ value: 5, color: 'blue', isRevealed: true }} size="xs" isClickable={false} />
                    <div className="rotate-6 origin-bottom-left"><SkyjoCard card={{ value: -2, color: 'blue', isRevealed: true }} size="xs" isClickable={false} /></div>
                    <div className="rotate-12 origin-bottom-left"><SkyjoCard card={{ value: 12, color: 'red', isRevealed: true }} size="xs" isClickable={false} /></div>
                </div>
            </div>
        )
    }
];

export default function BonusTutorial({ isOpen, onClose }) {
    const [currentStep, setCurrentStep] = useState(0);

    if (!isOpen) return null;

    const step = BONUS_STEPS[currentStep];

    const handleNext = () => {
        if (currentStep < BONUS_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
            setCurrentStep(0);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
                />

                <motion.div
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    className="relative w-full max-w-md glass-premium overflow-hidden rounded-[3rem] shadow-2xl border-rose-500/30 border"
                >
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-rose-500/10 to-transparent pointer-events-none" />

                    <div className="p-6 pb-2 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${step.bg} border border-white/10 group`}>
                                <step.icon className={`w-6 h-6 ${step.color} group-hover:scale-110 transition-transform`} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em]">
                                    GUIDE DU MODE TOURMENT
                                </span>
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                    Étape {currentStep + 1} / {BONUS_STEPS.length}
                                </span>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="px-6 flex gap-1 h-1 mb-4">
                        {BONUS_STEPS.map((_, i) => (
                            <div
                                key={i}
                                className={`flex-1 rounded-full transition-all duration-300 ${i <= currentStep ? 'bg-purple-500' : 'bg-white/10'}`}
                            />
                        ))}
                    </div>

                    <div className="px-8 py-2 flex flex-col items-center min-h-[260px]">
                        <h2 className="text-xl font-black text-white text-center mb-2 tracking-tight">
                            {step.title}
                        </h2>
                        <p className="text-xs text-slate-400 text-center leading-relaxed px-4">
                            {step.description}
                        </p>

                        <div className="flex-1 flex items-center justify-center w-full">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ type: "spring", damping: 20 }}
                                className="w-full"
                            >
                                {step.content}
                            </motion.div>
                        </div>
                    </div>

                    <div className="p-6 flex gap-3">
                        {currentStep > 0 && (
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                className="flex-1 h-12 rounded-2xl border-white/10 text-white font-bold"
                            >
                                <ChevronLeft className="w-5 h-5 mr-1" />
                                RETOUR
                            </Button>
                        )}
                        <Button
                            onClick={handleNext}
                            className="flex-[2] h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-black shadow-lg shadow-purple-500/30"
                        >
                            {currentStep === BONUS_STEPS.length - 1 ? "C'EST PARTI !" : "SUIVANT"}
                            {currentStep < BONUS_STEPS.length - 1 && <ChevronRight className="w-5 h-5 ml-1" />}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
