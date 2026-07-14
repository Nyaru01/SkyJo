import { memo, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy, Lock, Check, X, Crown, Star } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { cn } from '../lib/utils';
import { getMasterRewardsList, getRewardsList } from '../lib/rewards';
import { getCareerIdentity, getMasterProgress } from '../lib/masterCareer';

const CAREER_REWARDS = getRewardsList();
const MASTER_REWARDS = getMasterRewardsList();

const RewardRow = ({ reward, unlocked, next, progressPercent, master }) => (
    <div
        data-current={next || undefined}
        className={cn(
            'relative rounded-2xl border p-4 transition-colors',
            unlocked ? 'border-emerald-900/50 bg-slate-900' :
                next ? 'border-fuchsia-500/60 bg-slate-800 ring-1 ring-fuchsia-500/20' :
                    'border-slate-800 bg-slate-950 opacity-60'
        )}
    >
        <div className="flex items-center gap-4">
            <div className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-xl',
                unlocked ? 'border-emerald-900 bg-emerald-950 text-emerald-400' :
                    next ? 'border-fuchsia-800 bg-fuchsia-950 text-fuchsia-300' :
                        'border-slate-800 bg-slate-900 text-slate-600'
            )}>
                {reward.icon}
            </div>
            <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between">
                    <span className={cn(
                        'text-[9px] font-black uppercase tracking-widest',
                        unlocked ? 'text-emerald-500' : next ? 'text-fuchsia-400' : 'text-slate-600'
                    )}>
                        {master ? `Maître ${reward.level}` : `Niveau ${reward.level}`}
                    </span>
                    {unlocked ? <Check size={14} className="text-emerald-500" /> : !next && <Lock size={12} />}
                </div>
                <h3 className={cn('text-base font-bold leading-tight', unlocked || next ? 'text-white' : 'text-slate-500')}>
                    {reward.name}
                </h3>
                <p className="mt-1 text-[11px] leading-snug text-slate-400">{reward.description}</p>
            </div>
        </div>
        {next && (
            <div className="mt-3 border-t border-slate-700/50 pt-3">
                <div className="mb-1 flex justify-between text-[9px] font-bold uppercase tracking-wider text-fuchsia-300">
                    <span>En cours</span><span>{Math.round(progressPercent)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-950">
                    <div className="h-full rounded-full bg-fuchsia-500" style={{ width: `${progressPercent}%` }} />
                </div>
            </div>
        )}
    </div>
);

const ExperienceBar = memo(function ExperienceBar({ className }) {
    const currentXP = useGameStore(state => state.currentXP);
    const level = useGameStore(state => state.level);
    const showRewards = useGameStore(state => state.isCareerPlanOpen);
    const selectedTab = useGameStore(state => state.careerPlanTab);
    const openCareerPlan = useGameStore(state => state.openCareerPlan);
    const closeCareerPlan = useGameStore(state => state.closeCareerPlan);
    const progressPercent = Math.min(100, Math.max(0, currentXP * 10));
    const listRef = useRef(null);
    const masterProgress = useMemo(() => getMasterProgress(level), [level]);
    const identity = useMemo(() => getCareerIdentity(level), [level]);
    const isMasterTab = selectedTab === 'master';
    const masterCyclePercent = masterProgress.masterLevel === 100
        ? 100
        : Math.max(0, (masterProgress.masterLevel ? masterProgress.masterLevel - 1 : 0) + (currentXP / 10));

    useEffect(() => {
        if (!showRewards) return;
        requestAnimationFrame(() => listRef.current?.querySelector('[data-current="true"]')?.scrollIntoView({ block: 'center' }));
    }, [showRewards, selectedTab]);

    const rewards = isMasterTab ? MASTER_REWARDS : CAREER_REWARDS;

    return (
        <>
            <div className={cn('relative z-30 w-full', className)}>
                <div className="mb-4 min-h-[85px]">
                    <p className="mb-3 text-[10px] font-black uppercase leading-none tracking-[0.3em] text-slate-500">
                        Progression de Carrière
                    </p>
                    <div className="flex items-center justify-between">
                        <button onClick={() => openCareerPlan(level >= 100 ? 'master' : 'career')} className="text-left">
                            <p className="text-3xl font-black uppercase leading-none tracking-tighter text-white">
                                NIVEAU <span className="text-4xl text-amber-500">{level}</span>
                            </p>
                            {level >= 100 && <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-fuchsia-400">{identity.label} {identity.prestigeLabel}</p>}
                        </button>
                        <button onClick={() => openCareerPlan(level >= 100 ? 'master' : 'career')} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 shadow-xl">
                            <Zap className="h-5 w-5 text-amber-400" />
                            <span className="text-lg font-black text-amber-500">{currentXP}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">/ 10 XP</span>
                        </button>
                    </div>
                    <button onClick={() => openCareerPlan(level >= 100 ? 'master' : 'career')} className="mt-1 h-5 w-full overflow-hidden rounded-full border border-white/10 bg-slate-900 p-[3px]">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-400" style={{ width: `${progressPercent}%` }} />
                    </button>
                    <p className="mt-2 text-center text-xs font-medium text-slate-500">{10 - currentXP} victoire{10 - currentXP > 1 ? 's' : ''} avant le prochain niveau</p>
                </div>
            </div>

            {createPortal(
                <AnimatePresence>
                    {showRewards && (
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 font-sans">
                            <Motion.button aria-label="Fermer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/85" onClick={closeCareerPlan} />
                            <Motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} className="relative flex h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-slate-700 bg-[#0f172a] shadow-2xl">
                                <div className={cn('relative shrink-0 border-b border-slate-800 px-6 pb-4 pt-5', isMasterTab ? 'bg-gradient-to-br from-fuchsia-950 to-slate-950' : 'bg-slate-900')}>
                                    <button onClick={closeCareerPlan} className="absolute right-4 top-4 rounded-full border border-slate-700 bg-slate-800 p-2 text-slate-300"><X size={20} /></button>
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">{isMasterTab ? <Crown className="h-8 w-8 text-fuchsia-300" /> : <Trophy className="h-8 w-8 text-amber-400" />}</div>
                                        <div><h2 className="text-xl font-black uppercase text-white">{isMasterTab ? 'Carrière Maître' : 'Plan de Carrière'}</h2><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{isMasterTab ? 'La maîtrise au-delà des limites' : "L'élite du Skyjo"}</p></div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 rounded-xl bg-slate-950/70 p-1">
                                        <button onClick={() => openCareerPlan('career')} className={cn('rounded-lg py-2 text-xs font-black uppercase', !isMasterTab ? 'bg-amber-500 text-slate-950' : 'text-slate-400')}>Carrière</button>
                                        <button disabled={!masterProgress.isUnlocked} onClick={() => openCareerPlan('master')} className={cn('rounded-lg py-2 text-xs font-black uppercase', isMasterTab ? 'bg-fuchsia-500 text-white' : 'text-slate-400', !masterProgress.isUnlocked && 'cursor-not-allowed opacity-40')}>Maître {masterProgress.isUnlocked ? '' : '🔒'}</button>
                                    </div>
                                </div>

                                <div className="shrink-0 border-b border-slate-800 bg-slate-900 px-6 py-4">
                                    {isMasterTab ? (
                                        <div>
                                            <div className="flex items-center justify-between"><span className="text-xs font-black uppercase text-fuchsia-300">{masterProgress.masterLevel ? `Maître ${masterProgress.masterLevel}` : 'Accès Maître débloqué'}</span><span className="flex items-center gap-1 text-xs font-black text-amber-300"><Star size={14} fill="currentColor" /> {masterProgress.completedPrestiges}</span></div>
                                            <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">Cycle {Math.max(1, masterProgress.cycle)} · niveau global {level}</p>
                                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-950"><div className="h-full rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-400" style={{ width: `${masterCyclePercent}%` }} /></div>
                                        </div>
                                    ) : <div className="flex justify-between text-xs font-black uppercase text-slate-300"><span>Niveau {level}</span><span>{currentXP} / 10 XP</span></div>}
                                </div>

                                <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-[#0f172a] px-5 py-6">
                                    {rewards.map(reward => {
                                        const unlocked = isMasterTab
                                            ? level >= reward.globalLevel
                                            : level >= reward.level;
                                        const next = isMasterTab
                                            ? masterProgress.cycle <= 1 && level + 1 === reward.globalLevel
                                            : level + 1 === reward.level;
                                        return <RewardRow key={reward.level} reward={reward} unlocked={unlocked} next={next} progressPercent={progressPercent} master={isMasterTab} />;
                                    })}
                                </div>
                            </Motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
});

export default ExperienceBar;
