import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles, Star, Trophy } from 'lucide-react';

export default function MasterCareerPopup({ isOpen, onClose, onDiscover, playerLevel }) {
    const isUnlocked = playerLevel >= 100;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <Motion.button aria-label="Fermer l’annonce" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/90" onClick={onClose} />
                    <Motion.div initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-fuchsia-400/30 bg-slate-950 p-8 text-center shadow-[0_0_80px_rgba(217,70,239,0.25)] md:p-11">
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-fuchsia-950/70 via-transparent to-cyan-950/50" />
                        <div className="relative">
                            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-fuchsia-300/30 bg-gradient-to-br from-fuchsia-600/30 to-cyan-500/20 shadow-[0_0_35px_rgba(217,70,239,0.35)]">
                                <Crown className="h-12 w-12 text-amber-300" />
                            </div>
                            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.35em] text-fuchsia-300">{isUnlocked ? 'Niveau 100 atteint' : 'Disponible au niveau 100'}</p>
                            <h2 className="text-3xl font-black uppercase leading-tight text-white md:text-4xl">{isUnlocked ? 'La Carrière Maître est débloquée' : 'Découvrez la Carrière Maître'}</h2>
                            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-slate-300">{isUnlocked ? 'Cent nouveaux paliers, dix cosmétiques cosmiques et une boucle de Prestige infinie vous attendent.' : 'Après le niveau 100, poursuivez votre progression avec cent niveaux Maître, dix cosmétiques cosmiques et des Étoiles de Prestige.'}</p>
                            <div className="my-7 grid grid-cols-3 gap-2">
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><Trophy className="mx-auto mb-2 h-5 w-5 text-fuchsia-300" /><span className="text-[9px] font-black uppercase text-slate-300">Maître 1–100</span></div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><Sparkles className="mx-auto mb-2 h-5 w-5 text-cyan-300" /><span className="text-[9px] font-black uppercase text-slate-300">10 cosmétiques</span></div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><Star className="mx-auto mb-2 h-5 w-5 text-amber-300" /><span className="text-[9px] font-black uppercase text-slate-300">Prestige infini</span></div>
                            </div>
                            <button onClick={onDiscover} className="h-14 w-full rounded-2xl border-b-4 border-fuchsia-900 bg-gradient-to-r from-fuchsia-600 to-violet-600 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_12px_30px_rgba(192,38,211,0.3)] active:translate-y-0.5 active:border-b-2">{isUnlocked ? 'Découvrir l’arbre' : 'Voir le futur arbre'}</button>
                            <button onClick={onClose} className="mt-4 text-xs font-bold text-slate-500 hover:text-slate-300">Plus tard</button>
                        </div>
                    </Motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
