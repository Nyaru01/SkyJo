import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles, Star, Skull, TrendingUp } from 'lucide-react';
import { Button } from './ui/Button';
import SkyjoCard from './virtual/SkyjoCard';

const BONUS_STEPS = [
    {
        title: "Le Mode Bonus ✨",
        description: "Bienvenue dans la variante la plus extrême de Skyjo ! Ici, nous avons ajouté 12 cartes spéciales au deck original pour rendre les parties imprévisibles.",
        icon: Sparkles,
        color: "text-purple-400",
        bg: "bg-purple-400/10",
        content: (
            <div className="relative w-full h-40 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-slate-900 to-indigo-950" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                        }}
                        transition={{ repeat: Infinity, duration: 4 }}
                    >
                        <Sparkles className="w-16 h-16 text-purple-400 opacity-50" />
                    </motion.div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-xs font-black text-white uppercase tracking-widest text-center">
                    Prêt pour le carnage ?
                </div>
            </div>
        )
    },
    {
        title: "La Carte Étoile (-10) 🌟",
        description: "La meilleure carte du jeu ! Elle est de couleur violette et vaut -10 points. Il n'en existe que 6 dans tout le deck.",
        icon: Star,
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
                        size="md"
                        isClickable={false}
                    />
                    <div className="absolute -top-2 -right-2">
                        <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                    </div>
                </motion.div>
                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-tighter">Votre meilleure alliée !</p>
            </div>
        )
    },
    {
        title: "Le Crâne Maudit (20) 💀",
        description: "ATTENTION ! Cette carte vaut 20 points. MALÉDICTION : Si vous la piochez, vous êtes OBLIGÉ de la placer dans votre jeu ! Vous ne pouvez pas la défausser. Il y en a 6 dans le jeu.",
        icon: Skull,
        color: "text-red-600",
        bg: "bg-red-600/10",
        content: (
            <div className="flex flex-col items-center gap-4 py-4">
                <motion.div
                    animate={{ rotate: [0, -2, 2, 0], x: [0, -1, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="relative z-10"
                >
                    <SkyjoCard
                        card={{ id: 'bonus-skull', value: 20, color: 'darkred', isRevealed: true }}
                        size="md"
                        isClickable={false}
                    />
                </motion.div>
                <p className="text-[10px] font-bold text-red-600 uppercase tracking-tighter">Débarrassez-vous en vite !</p>
            </div>
        )
    },
    {
        title: "Stratégie Bonus 🧠",
        description: "Avec ces cartes extrêmes, la stratégie de colonne est d'autant plus risquée. Un combo de trois '20' élimine 60 points d'un coup, mais en garder une seule est fatal !",
        icon: TrendingUp,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        content: (
            <div className="flex gap-2 py-4">
                {[20, 20, 20].map((n, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.2 }}
                    >
                        <SkyjoCard
                            card={{ id: `tut-bonus-${i}`, value: n, color: 'darkred', isRevealed: true }}
                            size="xs"
                            isClickable={false}
                        />
                    </motion.div>
                ))}
            </div>
        )
    },
    {
        title: "Astuce Pro 🕵️‍♂️",
        description: "Vous avez un doute sur les cartes passées ? Faites un appui long sur la défausse pour voir les 3 dernières cartes jouées !",
        icon: Sparkles,
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
                    className="relative w-full max-w-md glass-premium overflow-hidden rounded-[3rem] shadow-2xl border-purple-500/30 border"
                >
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />

                    <div className="p-6 pb-2 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${step.bg} border border-white/10 group`}>
                                <step.icon className={`w-6 h-6 ${step.color} group-hover:scale-110 transition-transform`} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">
                                    Guide Mode Bonus
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
