import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Star, Zap, Layout } from 'lucide-react';
import { Button } from './ui/Button';


export const CURRENT_NEWS_VERSION = 5;

const FEATURES = [
    {
        title: "Notifications & Deep-Links",
        description: "Rejoignez une partie d'un simple tap sur la notification, même app fermée ! Plus besoin de chercher vos amis.",
        icon: Zap,
        color: "text-amber-400",
        bg: "bg-amber-400/10"
    },
    {
        title: "Mode hors ligne contre l'IA",
        description: "Jouez partout, même sans internet ! Le mode solo est désormais 100% fonctionnel hors ligne.",
        icon: Sparkles,
        color: "text-cyan-400",
        bg: "bg-cyan-400/10"
    },
    {
        title: "Pause & Persistance ⏸️",
        description: "Vos parties IA sont désormais sauvegardées. Le jeu se met en pause automatiquement quand vous quittez l'app.",
        icon: Zap,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10"
    }
];

export default function WhatsNewModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full max-w-md"
                >

                    <div className="relative overflow-hidden bg-slate-900 rounded-3xl border border-white/10 shadow-2xl">
                        {/* Background Effects */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 via-slate-900 to-purple-900/50" />
                        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-purple-500/20 to-transparent" />

                        {/* Header */}
                        <div className="relative p-5 pb-2 text-center">
                            <div className="inline-flex items-center justify-center w-14 h-14 mb-3 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/20">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">
                                Quoi de neuf ?
                            </h2>
                            <p className="text-sm text-slate-400 font-medium">
                                Découvrez les dernières améliorations
                            </p>

                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>



                        {/* Content */}
                        <div className="relative p-5 space-y-3">
                            {FEATURES.map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${feature.bg}`}>
                                        <feature.icon className={`w-5 h-5 ${feature.color}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm mb-0.5">{feature.title}</h3>
                                        <p className="text-xs text-slate-400 leading-relaxed">{feature.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="relative p-5 pt-2">
                            <Button
                                size="lg"
                                onClick={onClose}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-purple-500/25"
                            >
                                D'accord
                            </Button>
                        </div>
                    </div>

                </motion.div>
            </div>
        </AnimatePresence >
    );
}
