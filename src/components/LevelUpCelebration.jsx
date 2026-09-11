import { useState, useEffect, useMemo, memo, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useGameStore } from '../store/gameStore';




import { getPrestigeRewardForLevel, LEVEL_REWARDS, MASTER_REWARDS } from '../lib/rewards';
import { getMasterProgress, getCareerIdentity } from '../lib/masterCareer';
import '../styles/LevelUpCelebration.css';

// Admin previews share the production view but never acknowledge account progression.
const LevelUpCelebration = ({ previewLevel = null, onPreviewClose } = {}) => {
    const storeLevel = useGameStore(state => state.level);
    const lastAcknowledgedLevel = useGameStore(state => state.lastAcknowledgedLevel);
    const acknowledgeLevelUp = useGameStore(state => state.acknowledgeLevelUp);

    const [celebratedLevel, setCelebratedLevel] = useState(previewLevel);
    const [isVisible, setIsVisible] = useState(previewLevel !== null);
    const reduceMotion = useReducedMotion();
    const titleId = useId();

    useEffect(() => {
        if (previewLevel !== null) return;
        if (storeLevel > lastAcknowledgedLevel && !isVisible && !celebratedLevel) {
            let active = true;
            queueMicrotask(() => {
                if (!active) return;
                setCelebratedLevel(storeLevel);
                setIsVisible(true);
            });
            return () => {
                active = false;
            };
        }
    }, [storeLevel, lastAcknowledgedLevel, isVisible, celebratedLevel, previewLevel]);

    const reward = useMemo(() => {
        if (!celebratedLevel) return null;
        if (celebratedLevel > 100) {
            const progress = getMasterProgress(celebratedLevel);
            if (progress.cycle === 2) {
                const prestigeReward = getPrestigeRewardForLevel(celebratedLevel, progress.cycle);
                if (prestigeReward) return prestigeReward;
                return {
                    type: 'generic',
                    content: '✦',
                    name: `Prestige I · Maître ${progress.masterLevel}`,
                    description: 'Progression vers le prochain jalon du Prestige I.',
                    rarity: 'prestige'
                };
            }
            if (progress.masterLevel === 100) {
                const finalReward = MASTER_REWARDS[100];
                return {
                    ...finalReward,
                    type: 'generic',
                    content: '⭐',
                    name: `Étoile de Prestige ${progress.completedPrestiges}`,
                    description: `${finalReward.name} débloqué. Le cycle ${progress.cycle} est terminé : votre prestige rayonne encore davantage.`,
                    rarity: 'transcendant'
                };
            }
            if (progress.cycle === 1) return MASTER_REWARDS[progress.masterLevel];
            return {
                type: 'generic',
                content: '✦',
                name: `Maître ${progress.masterLevel} · Cycle ${progress.cycle}`,
                description: `Progression vers votre prochaine Étoile de Prestige.`,
                rarity: 'éternel'
            };
        }
        return LEVEL_REWARDS[celebratedLevel] || {
            type: 'generic',
            content: '🎁',
            name: `Niveau ${celebratedLevel}`,
            description: 'Un nouveau palier franchi !',
            rarity: 'common'
        };
    }, [celebratedLevel]);

    const handleClaim = useCallback(() => {
        if (previewLevel === null) acknowledgeLevelUp();
        setIsVisible(false);
    }, [acknowledgeLevelUp, previewLevel]);

    const onExitComplete = () => {
        setCelebratedLevel(null);
        if (previewLevel !== null) onPreviewClose?.();
    };

    if (!reward && !isVisible) return null;

    return createPortal(
        <AnimatePresence onExitComplete={onExitComplete}>
            {isVisible && reward && (
                <Motion.div
                    key="celebration"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.25 }}
                    className="fixed inset-0 z-[1000000] flex items-center justify-center bg-slate-950/95 p-4"
                    role="dialog" aria-modal="true" aria-labelledby={titleId}
                >
                    <Motion.div
                        initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.45, ease: 'easeOut' }}
                        className={`level-award relative flex max-h-[90dvh] w-full max-w-sm flex-col overflow-hidden rounded-[2rem] shadow-2xl ${celebratedLevel > 200 ? 'level-award-prestige' : ''}`}
                    >
                        <div className="overflow-y-auto px-7 pt-8 pb-4 text-center">
                            <p className="level-award-kicker">{previewLevel !== null ? 'APERÇU ADMIN · AUCUN XP MODIFIÉ' : 'CARRIÈRE SKYJO'}</p>
                            <div className="level-award-number" aria-hidden="true">{getMasterProgress(celebratedLevel).cycle >= 2 ? getMasterProgress(celebratedLevel).masterLevel : celebratedLevel}</div>
                            <h1 id={titleId} className="mt-3 text-3xl font-black tracking-tight text-white">{getCareerIdentity(celebratedLevel).label}</h1>
                            <p className="mt-2 text-sm text-slate-400">{celebratedLevel > 200 ? 'Votre prestige prend une nouvelle dimension.' : 'Un palier de plus. Une nouvelle distinction.'}</p>
                            <div className="level-award-emblem relative mx-auto my-6 flex h-28 w-28 items-center justify-center">
                                {!reduceMotion && <Motion.div
                                    initial={{ scale: 0.85, opacity: 0 }}
                                    animate={{ scale: [0.85, 1, 1.35], opacity: [0, 0.5, 0] }}
                                    transition={{ duration: 1.1, times: [0, 0.3, 1], ease: 'easeOut' }}
                                    className="pointer-events-none absolute inset-0 rounded-full border border-amber-200/50"
                                />}
                                <div className="absolute inset-0 rounded-full bg-amber-300/10 blur-2xl" />
                                <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl border border-amber-200/20 bg-gradient-to-br from-amber-100/10 to-slate-900 text-6xl shadow-lg">
                                    {reward.image ? <img src={reward.image} alt={reward.name} className="h-20 max-w-[80px] rounded-lg object-contain" /> : reward.content || <Trophy size={48} className="text-amber-200" />}
                                </div>
                            </div>
                            <div className="level-award-divider"><span>{reward.rarity || 'DISTINCTION'}</span></div>
                            <h2 className="mt-2 text-xl font-bold text-white">{reward.name}</h2>
                            <p className="mt-3 text-sm leading-relaxed text-slate-300">{reward.description}</p>
                        </div>
                        <div className="shrink-0 p-5">
                            <button type="button" autoFocus onClick={handleClaim}
                                className="w-full rounded-2xl border border-amber-100/30 bg-gradient-to-r from-amber-200 to-amber-400 px-5 py-4 font-bold text-slate-950 transition-colors hover:from-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200">
                                {previewLevel !== null ? 'Retour au simulateur' : 'Continuer l’aventure'}
                            </button>
                        </div>
                    </Motion.div>
                </Motion.div>
            )}
        </AnimatePresence>, document.body
    );
};
export default memo(LevelUpCelebration);
