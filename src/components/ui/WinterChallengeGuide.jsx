import { ArrowRight, CalendarDays, RotateCcw, Snowflake, Trophy } from 'lucide-react';
import { ModalCloseButton } from './ModalShell';
import '../../styles/WinterChallengeGuide.css';

// Règles du défi d'hiver « Nuit du solstice » (21 → 31 décembre 2026).
const ICE = [-2, 0, -1];

export default function WinterChallengeGuide({ titleId, preview, rewardXP, locked, challenge, available, remainingDays, countdown, onClose, onLaunch }) {
    return <>
        <header className="winter-header"><span>{preview ? 'APERÇU ADMIN' : locked ? 'PROCHAIN DÉFI DE SAISON' : 'LE DÉFI DE SAISON'}</span><ModalCloseButton onClick={onClose} label="Fermer le défi d’hiver" /></header>
        <div className="winter-scroll">
            <div className="winter-heading">
                <p>LA NUIT LA PLUS LONGUE DE L’ANNÉE</p>
                <h2 id={titleId}>Nuit<span>du solstice.</span></h2>
                <div><span>1 manche</span><i aria-hidden="true" /><span>Mode Tourment</span><i aria-hidden="true" /><span>21 → 31 déc.</span></div>
            </div>

            <div className="winter-tableau">
                <div className="winter-example" role="img" aria-label="Exemple : une colonne de glace avec moins deux, zéro et moins un">
                    <div className="winter-column is-ice">
                        <span className="winter-column-tag"><Snowflake size={12} aria-hidden="true" />Glace</span>
                        {ICE.map((v, i) => <span key={i} className="winter-card is-ice"><b>{v}</b></span>)}
                    </div>
                    <div className="winter-column">
                        {[4, 7, 2].map((v, i) => <span key={i} className="winter-card"><b>{v}</b></span>)}
                    </div>
                </div>
                <div className="winter-prize"><Trophy size={24} strokeWidth={1.6} aria-hidden="true" /><span>À GAGNER</span><strong>+{rewardXP}<small> XP</small></strong><p>{preview ? 'Récompense simulée' : 'En cas de réussite'}</p></div>
                <p className="winter-example-caption">Une colonne de glace · exemple</p>
            </div>

            <div className="winter-mission-heading"><h3>Votre mission</h3><span>Deux objectifs. Une victoire.</span></div>
            <ol className="winter-missions">
                <li><span>01</span><div><h4>Gardez une colonne de glace.</h4><p>Terminez la manche avec une colonne de <strong>trois cartes à 0 ou moins</strong>. Elle doit rester sur votre grille : une colonne nettoyée ne compte pas.</p></div></li>
                <li><span>02</span><div><h4>Prenez l’avantage.</h4><p>Obtenez le <strong>meilleur score final</strong> contre l’IA. Égalités acceptées, pénalités incluses.</p></div></li>
            </ol>
            <div className="winter-footnotes">
                <p><CalendarDays size={15} aria-hidden="true" />Du 21 décembre au 31 décembre 2026, 23 h 59.</p>
                <p><Trophy size={15} aria-hidden="true" />{preview ? 'Aucun impact sur votre compte.' : 'Bonus renouvelable après 7 jours.'}</p>
                <p><RotateCcw size={15} aria-hidden="true" />Défi manqué ? Réessayez immédiatement.</p>
            </div>
        </div>
        <footer className="winter-footer">
            {countdown && <p>{countdown}</p>}
            {!locked && !available && <p>Récompense disponible dans {remainingDays} jours.</p>}
            <button type="button" disabled={locked || !available} onClick={onLaunch}>
                {locked ? `Disponible le ${challenge.availableFrom}` : preview ? 'Lancer l’aperçu' : 'Relever le défi'}{!locked && <ArrowRight size={21} aria-hidden="true" />}
            </button>
        </footer>
    </>;
}
