import { memo, useLayoutEffect, useMemo, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { Zap, Trophy, Lock, Check, X, Crown, Star, ChevronRight } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { cn } from '../lib/utils';
import { getMasterRewardsList, getPrestigeRewardsList, getRewardsList } from '../lib/rewards';
import { getMasterProgress, getCareerIdentity } from '../lib/masterCareer';

const CAREER_REWARDS = getRewardsList();
const MASTER_REWARDS = getMasterRewardsList();
const PRESTIGE_I_REWARDS = getPrestigeRewardsList();

const RewardRow = ({ reward, unlocked, next, progressPercent, master, prestige }) => (
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
                        {prestige ? `Prestige I · ${reward.level}` : master ? `Maître ${reward.level}` : `Niveau ${reward.level}`}
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
    const closeRef = useRef(null);
    const titleId = useId();
    const masterProgress = useMemo(() => getMasterProgress(level), [level]);
    const isMasterTab = selectedTab === 'master';
    const isPrestigeI = isMasterTab && masterProgress.cycle === 2;
    const masterCyclePercent = masterProgress.masterLevel === 100
        ? 100
        : Math.max(0, (masterProgress.masterLevel ? masterProgress.masterLevel - 1 : 0) + (currentXP / 10));

    useLayoutEffect(() => {
        if (!showRewards) return;
        const list = listRef.current;
        const current = list?.querySelector('[data-current="true"]');
        if (current) {
            // Position only this list before paint; never scroll the menu behind the dialog.
            list.scrollTop += current.getBoundingClientRect().top - list.getBoundingClientRect().top - (list.clientHeight - current.clientHeight) / 2;
        } else if (list) list.scrollTop = 0;
    }, [showRewards, selectedTab]);

    useLayoutEffect(() => {
        if (!showRewards) return;
        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeRef.current?.focus({ preventScroll: true });
        const onKeyDown = event => { if (event.key === 'Escape') closeCareerPlan(); };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', onKeyDown);
            if (previousFocus?.isConnected) previousFocus.focus?.({ preventScroll: true });
        };
    }, [showRewards, closeCareerPlan]);

    const rewards = isMasterTab ? (isPrestigeI ? PRESTIGE_I_REWARDS : MASTER_REWARDS) : CAREER_REWARDS;

    return (
        <>
            <div className={cn('relative z-30 w-full', className)}>
                <div className="mb-4 min-h-[85px]">
                    <p className="mb-3 text-center text-[10px] font-black uppercase leading-none tracking-[0.3em] text-slate-500">
                        Progression de Carrière
                    </p>
                    <div className="flex items-center justify-between">
                        <button onClick={() => openCareerPlan(level >= 100 ? 'master' : 'career')} className="text-left">
                            <p className="text-3xl font-black uppercase leading-none tracking-tighter text-white">
                                {getCareerIdentity(level).label}
                            </p>
                        </button>
                        <button onClick={() => openCareerPlan(level >= 100 ? 'master' : 'career')} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 shadow-xl">
                            <Zap className="h-5 w-5 text-amber-400" />
                            <span className="text-lg font-black text-amber-500">{currentXP}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">/ 10 XP</span>
                        </button>
                    </div>
                    <button aria-label="Ouvrir le plan de carrière" onClick={() => openCareerPlan(level >= 100 ? 'master' : 'career')} className="mt-1 h-5 w-full overflow-hidden rounded-full border border-white/10 bg-slate-900 p-[3px]">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-400" style={{ width: `${progressPercent}%` }} />
                    </button>
                    <button type="button" aria-haspopup="dialog" aria-expanded={showRewards}
                        onClick={() => openCareerPlan(level >= 100 ? 'master' : 'career')}
                        className="mt-2 flex w-full items-center justify-between gap-3 rounded-xl border border-amber-300/20 bg-amber-300/5 px-3 py-2.5 text-left transition-colors hover:bg-amber-300/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300">
                        <span><span className="block text-xs font-bold text-amber-100">Voir le plan de carrière</span><span className="mt-0.5 block text-[10px] text-slate-400">Récompenses et grades · {10 - currentXP} XP avant le prochain niveau</span></span>
                        <ChevronRight size={18} className="shrink-0 text-amber-300" aria-hidden="true" />
                    </button>
                </div>
            </div>

            {createPortal(
                <>
                    {showRewards && (
                        <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-slate-950 px-4 font-sans">
                            <button aria-label="Fermer le plan de carrière" tabIndex={-1} className="absolute inset-0" onClick={closeCareerPlan} />
                            <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative flex h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-slate-700 bg-[#0f172a] shadow-2xl">
                                <div className={cn('relative shrink-0 border-b border-slate-800 px-6 pb-4 pt-5', isMasterTab ? 'bg-gradient-to-br from-fuchsia-950 to-slate-950' : 'bg-slate-900')}>
                                    <button ref={closeRef} aria-label="Fermer le plan de carrière" onClick={closeCareerPlan} className="absolute right-4 top-4 rounded-full border border-slate-700 bg-slate-800 p-2 text-slate-300"><X size={20} /></button>
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">{isMasterTab ? <Crown className="h-8 w-8 text-fuchsia-300" /> : <Trophy className="h-8 w-8 text-amber-400" />}</div>
                                        <div><h2 id={titleId} className="text-xl font-black uppercase text-white">{isPrestigeI ? 'Prestige I' : isMasterTab ? 'Carrière Maître' : 'Plan de Carrière'}</h2><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{isPrestigeI ? 'Récompenses cosmiques 201–300' : isMasterTab ? 'La maîtrise au-delà des limites' : "L'élite du Skyjo"}</p></div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 rounded-xl bg-slate-950/70 p-1">
                                        <button onClick={() => openCareerPlan('career')} className={cn('rounded-lg py-2 text-xs font-black uppercase', !isMasterTab ? 'bg-amber-500 text-slate-950' : 'text-slate-400')}>Carrière</button>
                                        <button disabled={!masterProgress.isUnlocked} onClick={() => openCareerPlan('master')} className={cn('rounded-lg py-2 text-xs font-black uppercase', isMasterTab ? 'bg-fuchsia-500 text-white' : 'text-slate-400', !masterProgress.isUnlocked && 'cursor-not-allowed opacity-40')}>Maître {masterProgress.isUnlocked ? '' : '🔒'}</button>
                                    </div>
                                </div>

                                <div className="shrink-0 border-b border-slate-800 bg-slate-900 px-6 py-4">
                                    {isMasterTab ? (
                                        <div>
                                            <div className="flex items-center justify-between"><span className="text-xs font-black uppercase text-fuchsia-300">{isPrestigeI ? `Prestige I · palier ${masterProgress.masterLevel}` : masterProgress.masterLevel ? `Maître ${masterProgress.masterLevel}` : 'Accès Maître débloqué'}</span><span className="flex items-center gap-1 text-xs font-black text-amber-300"><Star size={14} fill="currentColor" /> {masterProgress.completedPrestiges}</span></div>
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
                                            ? (isPrestigeI ? masterProgress.cycle === 2 : masterProgress.cycle <= 1) && level + 1 === reward.globalLevel
                                            : level + 1 === reward.level;
                                        return <RewardRow key={reward.level} reward={reward} unlocked={unlocked} next={next} progressPercent={progressPercent} master={isMasterTab} prestige={isPrestigeI} />;
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </>,
                document.body
            )}
        </>
    );
});

export default ExperienceBar;
