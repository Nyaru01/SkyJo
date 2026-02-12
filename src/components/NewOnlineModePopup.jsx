import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Zap, Globe, Bot } from 'lucide-react';

export default function NewOnlineModePopup({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                {/* Backdrop with intense blur */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl"
                    onClick={onClose}
                />

                {/* Premium Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-slate-950 shadow-[0_0_100px_rgba(0,0,0,0.9)] border border-white/10"
                >
                    {/* Interior Glows */}
                    <div className="absolute top-0 left-1/4 w-1/2 h-32 bg-rose-500/10 blur-[80px] pointer-events-none" />
                    <div className="absolute bottom-0 right-1/4 w-1/2 h-32 bg-amber-500/10 blur-[80px] pointer-events-none" />

                    {/* Content */}
                    <div className="relative p-8 md:p-12 text-center flex flex-col items-center">
                        {/* Premium Border Beam */}
                        <div className="absolute inset-[1px] rounded-[2.45rem] p-[1px] overflow-hidden pointer-events-none">
                            <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_280deg,#f43f5e_360deg)] animate-[spin_4s_linear_infinite]" />
                            <div className="absolute inset-[1px] rounded-[2.4rem] bg-slate-950/90 backdrop-blur-3xl" />
                        </div>

                        {/* Top Icon Section */}
                        <div className="relative mb-8 pt-4">
                            <div className="absolute inset-0 bg-rose-500 blur-[30px] opacity-30 animate-pulse" />
                            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-950 border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden group">
                                <Swords className="w-12 h-12 text-rose-500 group-hover:scale-110 transition-transform duration-700" strokeWidth={1.5} />
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="relative space-y-4">
                            <h2 className="text-4xl md:text-5xl font-black tracking-widest text-white leading-none">
                                MODE <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500 bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">TOURMENT</span>
                            </h2>

                            <div className="h-px w-24 bg-gradient-to-r from-transparent via-rose-500/40 to-transparent mx-auto py-[1px]" />

                            <p className="text-slate-300 text-sm md:text-base font-medium max-w-sm mx-auto leading-relaxed px-4">
                                Relevez le défi ultime ! Un mode de jeu compétitif avec des règles spéciales pour les joueurs les plus aguerris.
                            </p>
                        </div>

                        {/* Features Highlights */}
                        <div className="relative grid grid-cols-2 gap-4 mt-8 w-full max-w-xs">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-2">
                                <Bot className="w-5 h-5 text-white" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contre l'IA</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-2">
                                <Globe className="w-5 h-5 text-white" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">En Ligne</span>
                            </div>
                        </div>

                        {/* Action Button - NO bg-white to avoid CSS overrides */}
                        <div className="relative mt-12 w-full max-w-xs px-2">
                            <button
                                onClick={onClose}
                                className="w-full h-14 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 text-white font-black text-sm uppercase tracking-[0.2em] transition-all active:scale-95 shadow-[0_10px_30px_rgba(244,63,94,0.3)] hover:shadow-[0_15px_40px_rgba(244,63,94,0.4)] border-b-4 border-rose-800 active:border-b-0 flex items-center justify-center"
                            >
                                Compris
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
