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
        <ModalShell fullScreen stableBackdrop isOpen={showConditions} onClose={() => setShowConditions(false)} labelledBy={titleId} zIndex={preview ? 'z-[100050]' : 'z-[10050]'} className={`seasonal-rules seasonal-guide ${harvest ? 'seasonal-guide-harvest' : ''}`}>
            <header className="seasonal-guide-header">
                <span>{preview ? 'APERÇU ADMIN' : 'LES RENDEZ-VOUS SKYJO'}</span>
                <ModalCloseButton onClick={() => setShowConditions(false)} />
            </header>
            <div className="seasonal-guide-scroll">
                <div className="seasonal-guide-hero">
                    <div className="seasonal-guide-orbit" aria-hidden="true">{harvest ? <Leaf size={62} /> : <img src="/skyjo-planet-moon.svg" alt="" width="112" height="112" />}</div>
                    <p className="seasonal-rules-eyebrow">{harvest ? 'LA SAISON DES BELLES RÉCOLTES' : 'ENTRE OMBRE ET LUMIÈRE'}</p>
                    <h2 id={titleId}>{harvest ? 'Récolte d’automne' : 'Équinoxe'}</h2>
                    <div className="seasonal-guide-meta"><span>1 manche</span><span>IA Tourment</span><span>Défi saisonnier</span></div>
                </div>
                <div className="seasonal-guide-section">VOTRE MISSION <span>2 objectifs à réunir</span></div>
                <ol className="seasonal-objectives">
                    <li><span>01</span><div><strong>{harvest ? 'Faites place nette' : 'Trouvez l’équilibre'}</strong><p>{harvest ? 'Supprimez au moins deux colonnes.' : 'Gardez ces quatre cartes sur votre grille finale.'}</p>
                        <div className="seasonal-guide-tokens" aria-label={harvest ? 'Deux colonnes supprimées' : 'Moins deux, zéro, zéro, plus deux'}>{harvest ? [1, 2].map(n => <span key={n} className="seasonal-guide-column"><Leaf size={18} />Colonne {n}</span>) : ['−2', '0', '0', '+2'].map((value, index) => <span key={index} className={`seasonal-guide-card card-${index}`}>{value}</span>)}</div>
                    </div></li>
                    <li><span>02</span><div><strong>Prenez l’avantage</strong><p>Obtenez le meilleur score final.</p><small>Les égalités comptent. Pénalités incluses.</small></div></li>
                </ol>
                <div className="seasonal-guide-reward"><strong>+{challenge.rewardXP}<span> XP{preview ? ' SIMULÉS' : ''}</span></strong><div><b>{preview ? 'Session de démonstration' : 'La victoire se récompense'}</b><p>{preview ? 'Aucun impact sur votre compte.' : 'Bonus renouvelable après 7 jours.'}</p></div></div>
                <p className="seasonal-guide-retry">Défi manqué ? Réessayez immédiatement.</p>
            </div>
            <footer className="seasonal-guide-footer">
                {countdown && <p>{countdown}</p>}
                {!available && <p>Récompense disponible dans {getWeeklyChallengeRemainingDays(rewardState, now, challenge)} jours.</p>}
                <button type="button" disabled={!available} className="seasonal-launch" onClick={() => { const result = onClick?.(); if (preview || result === false) setShowConditions(false); }}>{preview ? 'Lancer l’aperçu' : 'Relever le défi'}<span aria-hidden="true"> →</span></button>
            </footer>
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
