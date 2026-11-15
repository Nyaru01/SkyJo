import { useState, useId } from 'react';
import ModalShell from './ModalShell';
import { useSeasonalClock } from '../../hooks/useSeasonalClock';
import { Snowflake, Lock } from 'lucide-react';
import { PremiumTiltButton } from './PremiumTiltButton';
import { getActiveWeeklyChallenge, getUpcomingWeeklyChallenge, getWeeklyChallengeRemainingDays, getWinterCountdown, isWeeklyChallengeAvailable, EQUINOX } from '../../lib/weeklyChallenge';
import '../../styles/SeasonalChallenge.css';
import WinterChallengeGuide from './WinterChallengeGuide';

// Défi de saison. Entre deux saisons, le prochain défi s'affiche grisé avec sa date d'ouverture ;
// il s'active tout seul le jour venu (l'horloge saisonnière se met à jour chaque minute).
export default function SeasonalChallengeButton({ onClick, rewardState = {}, preview = false, challenge: forcedChallenge, calm = false }) {
    const [open, setOpen] = useState(false);
    const titleId = useId();
    const now = useSeasonalClock();
    const active = forcedChallenge || getActiveWeeklyChallenge(now);
    const upcoming = active ? null : getUpcomingWeeklyChallenge(now);
    const challenge = active || upcoming;
    if (!challenge || challenge.id === EQUINOX.id) return null;
    const locked = !active && !preview;
    const available = preview || (!locked && isWeeklyChallengeAvailable(rewardState, now, challenge));
    const remainingDays = locked ? 0 : getWeeklyChallengeRemainingDays(rewardState, now, challenge);
    const countdown = locked || preview ? null : getWinterCountdown(now);
    const caption = locked ? `Prochain mode · disponible le ${challenge.availableFrom}` : 'La nuit la plus longue de l’année';
    return <><PremiumTiltButton
        calm={calm}
        onClick={() => setOpen(true)}
        gradientFrom="from-slate-900" gradientTo="to-sky-950" shadowColor="shadow-sky-500/10"
        className={`seasonal-button w-full group seasonal-winter${locked ? ' is-locked' : ''}`}
        contentClassName="game-mode-card-content" bodyClassName="seasonal-button-body"
        aria-label={locked ? `${challenge.shortTitle} : prochain mode, disponible le ${challenge.availableFrom}` : undefined}
    >
        <div className="seasonal-snow" aria-hidden="true">{[0, 1, 2, 3, 4].map(i => <Snowflake key={i} className={`seasonal-flake flake-${i}`} />)}</div>
        <div className="flex items-center justify-between gap-3 w-full relative z-10 text-left">
            <div className="min-w-0">
                <h3 className="game-mode-card-title text-white">{challenge.shortTitle}</h3>
                <p className="seasonal-caption">{caption}{!locked && <span>+{challenge.rewardXP} XP</span>}</p>
                {preview && <p className="text-xs text-sky-200 mt-1">Aperçu admin · Tester la Nuit du solstice</p>}
                {countdown && <p className="seasonal-countdown">{countdown}</p>}
                {!locked && !available && <p className="seasonal-countdown">Récompense disponible dans {remainingDays} jours</p>}
            </div>
            {locked ? <span className="seasonal-lock" aria-hidden="true"><Lock size={18} /><b>21 déc.</b></span> : <Snowflake className="seasonal-emblem w-12 h-12 shrink-0 text-sky-200" aria-hidden="true" />}
        </div>
    </PremiumTiltButton>
        <ModalShell fullScreen stableBackdrop isOpen={open} onClose={() => setOpen(false)} labelledBy={titleId} zIndex={preview ? 'z-[100050]' : 'z-[10050]'} className="winter-guide">
            <WinterChallengeGuide
                titleId={titleId} preview={preview} rewardXP={challenge.rewardXP} locked={locked} challenge={challenge}
                available={available} remainingDays={remainingDays} countdown={countdown}
                onClose={() => setOpen(false)}
                onLaunch={() => { const result = onClick?.(); if (preview || result === false) setOpen(false); }}
            />
        </ModalShell>
    </>;
}

export function SeasonalResult({ gameState }) {
    if (!gameState?.isWeeklyChallenge || !gameState.seasonalResult) return null;
    const result = gameState.seasonalResult;
    return <div className="seasonal-progress" role="status">
        {result.success ? `Défi réussi · +${result.rewardXP} XP${result.preview ? ' simulés' : ''}` : 'Défi non réussi · 0 XP'}
    </div>;
}
