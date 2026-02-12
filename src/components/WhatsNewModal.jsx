import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Zap, Flame } from 'lucide-react';
import { Button } from './ui/Button';

export const CURRENT_NEWS_VERSION = 7;

const FEATURES = [
    {
        title: "Mode Tourment",
        description: "Une expérience hardcore renouvelée ! 28 cartes spéciales, mécaniques de jeu impitoyables et stratégie poussée à l'extrême.",
        icon: Flame,
        color: "text-rose-500",
        bg: "bg-rose-500/10"
    },
    {
        title: "Notifications",
        description: "Rejoignez une partie d'un simple tap sur la notification, même app fermée ! Plus besoin de chercher vos amis.",
        icon: Zap,
        color: "text-amber-400",
        bg: "bg-amber-400/10"
    },
    {
        title: "Fond d'écran",
        description: "Ajout de nouveaux fonds d'écran pour personnaliser votre expérience.",
        icon: Flame,
        color: "text-cyan-400",
        bg: "bg-cyan-400/10"
    },
    {
        title: "Mode hors ligne contre l'IA",
        description: "Jouez partout, même sans internet ! Le mode solo est désormais 100% fonctionnel hors ligne.",
        icon: Sparkles,
        color: "text-cyan-400",
        bg: "bg-cyan-400/10"
    },
    {
        title: "Pause & Persistance",
        description: "Vos parties IA sont désormais sauvegardées. Le jeu se met en pause automatiquement quand vous quittez l'app.",
        icon: Zap,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10"
    }
];

const FeatureCard = ({ feature, index }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-200"
    >
        <div
            className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${feature.bg}`}
            aria-hidden="true"
        >
            <feature.icon className={`w-5 h-5 ${feature.color}`} />
        </div>
        <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-sm mb-0.5">
                {feature.title}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
                {feature.description}
            </p>
        </div>
    </motion.div>
);

export default function WhatsNewModal({ isOpen, onClose }) {
    // Gestion du scroll et de l'accessibilité
    useEffect(() => {
        if (isOpen) {
            // Désactive le scroll du body
            document.body.style.overflow = 'hidden';

            // Gestion de la touche Échap
            const handleEscape = (e) => {
                if (e.key === 'Escape') onClose();
            };

            document.addEventListener('keydown', handleEscape);

            return () => {
                document.body.style.overflow = '';
                document.removeEventListener('keydown', handleEscape);
            };
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
                    onClick={onClose}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                        className="w-full max-w-md relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative overflow-hidden bg-slate-900 rounded-3xl border border-white/10 shadow-2xl">
                            {/* Effets de fond */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 via-slate-900 to-purple-900/50" />
                            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-purple-500/20 to-transparent" />

                            {/* Effet de brillance subtil */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                            {/* Header */}
                            <div className="relative p-6 pb-3 text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                    className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 mb-3 shadow-lg shadow-purple-500/50"
                                >
                                    <Sparkles className="w-6 h-6 text-white" />
                                </motion.div>

                                <h2
                                    id="modal-title"
                                    className="text-2xl font-black text-white uppercase tracking-tight mb-1"
                                >
                                    Quoi de neuf ?
                                </h2>
                                <p className="text-sm text-slate-400 font-medium">
                                    Découvrez les dernières améliorations
                                </p>

                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 hover:rotate-90"
                                    aria-label="Fermer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Contenu */}
                            <div className="relative p-5 pt-2 space-y-2.5 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                {FEATURES.map((feature, idx) => (
                                    <FeatureCard
                                        key={`feature-${idx}`}
                                        feature={feature}
                                        index={idx}
                                    />
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="relative p-5 pt-3">
                                <Button
                                    size="lg"
                                    onClick={onClose}
                                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-purple-500/25 transition-all duration-200 hover:shadow-purple-500/40 hover:scale-[1.02]"
                                >
                                    C'est parti !
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}