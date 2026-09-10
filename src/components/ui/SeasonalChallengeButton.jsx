import { useState, useId } from 'react';
import ModalShell, { ModalCloseButton } from './ModalShell';
import { useSeasonalClock } from '../../hooks/useSeasonalClock';
import { Leaf } from 'lucide-react';
import { PremiumTiltButton } from './PremiumTiltButton';
import { getActiveWeeklyChallenge, getEquinoxCountdown, getWeeklyChallengeRemainingDays, isWeeklyChallengeAvailable, HARVEST } from '../../lib/weeklyChallenge';
import '../../styles/SeasonalChallenge.css';

export default function SeasonalChallengeButton({ onClick, rewardState = {}, preview = false, challenge: forcedChallenge }) {
    const [showConditions, setShowConditions] = useState(false);
    const titleId = useId();
    const now = useSeasonalClock();
    const challenge = forcedChallenge || getActiveWeeklyChallenge(now);
    const harvest = challenge.id === HARVEST.id;
    const available = preview || isWeeklyChallengeAvailable(rewardState, now, challenge);
    const countdown = harvest ? null : getEquinoxCountdown(now);
    return <><PremiumTiltButton
        onClick={() => setShowConditions(true)} disabled={!available}
        gradientFrom={harvest ? 'from-slate-950' : 'from-indigo-700'}
        gradientTo={harvest ? 'to-amber-950' : 'to-amber-500'}
        shadowColor="shadow-amber-500/10"
        className={`seasonal-button w-full group ${harvest ? 'seasonal-harvest' : 'seasonal-equinox'}`}
        contentClassName="game-mode-card-content" bodyClassName="seasonal-button-body"
    >
        {harvest && <div className="seasonal-leaves" aria-hidden="true">{[0, 1, 2, 3].map(i => <Leaf key={i} className={`seasonal-leaf leaf-${i}`} />)}</div>}
        <div className="flex items-center justify-between gap-3 w-full relative z-10 text-left">
            <div className="min-w-0">
                <h3 className="game-mode-card-title text-white">{challenge.shortTitle}</h3>
                <p className="seasonal-caption">{harvest ? 'La saison des belles récoltes' : 'Entre ombre et lumière'} <span>+{challenge.rewardXP} XP</span></p>
                {preview && <p className="text-xs text-amber-200 mt-1">Aperçu admin · Tester Récolte d’automne</p>}
                {countdown && <p className="text-[10px] text-indigo-100 mt-1">{countdown === 'Dernier jour' ? countdown : countdown?.split(' · ')[0] + ' · Fin le 23 septembre'}</p>}
                {!available && <p className="text-[10px] text-slate-300 mt-1">Récompense disponible dans {getWeeklyChallengeRemainingDays(rewardState, now, challenge)} jours</p>}
            </div>
            {harvest ? <Leaf className="seasonal-emblem w-12 h-12 shrink-0 text-amber-300" aria-hidden="true" /> : <span className="game-mode-icon relative shrink-0"><img src="/skyjo-planet-moon.svg" alt="" className="absolute left-1/2 top-1/2 w-16 h-16 max-w-none -translate-x-1/2 -translate-y-1/2" /></span>}
        </div>
    </PremiumTiltButton>
        <ModalShell fullScreen stableBackdrop isOpen={showConditions} onClose={() => setShowConditions(false)} labelledBy={titleId} zIndex="z-[10050]" className="seasonal-rules">
            <ModalCloseButton onClick={() => setShowConditions(false)} />
            <div className="seasonal-rules-icon">{harvest ? <Leaf size={44} className="text-amber-300" /> : <img src="/skyjo-planet-moon.svg" alt="" width="96" height="96" />}</div>
            <p className="seasonal-rules-eyebrow">{preview ? 'APERÇU ADMIN' : 'DÉFI SAISONNIER'}</p>
            <h2 id={titleId} className="text-xl font-black text-white text-center">{challenge.shortTitle}</h2>
            <p className="text-sm text-slate-300 text-center mt-2">Une manche contre l’IA en mode Tourment.</p>
            <ol className="seasonal-objectives">
                <li><span>1</span><div>{harvest ? 'Supprimez au moins deux colonnes.' : 'Conservez −2, deux cartes 0 et +2 sur votre grille finale.'}</div></li>
                <li><span>2</span><div>Obtenez le meilleur score final.<small>Les égalités comptent ; les pénalités sont incluses.</small></div></li>
            </ol>
            <div className="seasonal-reward"><strong>+{challenge.rewardXP} XP{preview ? ' simulés' : ''}</strong><p>{preview ? 'Aucun impact sur votre progression ou votre historique.' : 'Une récompense tous les 7 jours. Après une défaite, réessayez immédiatement.'}</p></div>
            {countdown && <p className="text-xs text-slate-400 text-center mb-4">{countdown}</p>}
            {!available && <p className="text-xs text-amber-200 mb-3">Récompense disponible dans {getWeeklyChallengeRemainingDays(rewardState, now, challenge)} jours.</p>}
            <button type="button" disabled={!available} className="seasonal-launch" onClick={() => { const result = onClick?.(); if (preview || result === false) setShowConditions(false); }}>{preview ? 'Lancer l’aperçu' : 'Commencer le défi'}</button>
        </ModalShell>
    </>;
}

export function SeasonalProgress({ gameState }) {
    if (!gameState?.isWeeklyChallenge || gameState.seasonalChallengeId !== HARVEST.id) return null;
    const cleared = gameState.players.find(p => p.id === 'human-1')?.columnsCleared || 0;
    const result = gameState.seasonalResult;
    return <div className="seasonal-progress" role="status">
        <span>{gameState.isSeasonalPreview ? 'Aperçu admin · ' : ''}Récolte d’automne</span>
        <span className="flex items-center gap-1" aria-label={`${Math.min(cleared, 2)} colonnes sur 2`}>{[1, 2].map(n => <Leaf key={n} size={18} className={cleared >= n ? 'text-amber-300 fill-amber-400/30' : 'text-slate-600'} />)} {Math.min(cleared, 2)}/2</span>
        {result && <span>{result.success ? `Défi réussi · +${result.rewardXP} XP${result.preview ? ' simulés' : ''}` : 'Défi non réussi · 0 XP'}</span>}
    </div>;
}
