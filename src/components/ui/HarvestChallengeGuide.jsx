import { ArrowRight, RotateCcw, Trophy } from 'lucide-react';
import { ModalCloseButton } from './ModalShell';
import '../../styles/HarvestChallengeGuide.css';

export default function HarvestChallengeGuide({ titleId, preview, rewardXP, available, remainingDays, onClose, onLaunch }) {
    return <>
        <header className="harvest-header"><span>{preview ? 'APERÇU ADMIN' : 'LE DÉFI DE SAISON'}</span><ModalCloseButton onClick={onClose} label="Fermer le défi Récolte" /></header>
        <div className="harvest-scroll">
            <div className="harvest-heading"><p>LA SAISON DES BELLES RÉCOLTES</p><h2 id={titleId}>Récolte<span>d’automne.</span></h2><div><span>1 manche</span><i aria-hidden="true" /><span>Mode Tourment</span></div></div>

            <div className="harvest-tableau">
                <div className="harvest-example" role="img" aria-label="Exemple : deux colonnes de trois cartes identiques à supprimer">
                    {[5, 8].map((value, index) => <div key={value} className={`harvest-column harvest-column--${index}`}>
                        <span className="harvest-column-number">0{index + 1}</span>
                        {[0, 1, 2].map(row => <span className="harvest-card" key={row}><small>{value}</small><b>{value}</b><small>{value}</small></span>)}
                    </div>)}
                </div>
                <div className="harvest-prize"><Trophy size={24} strokeWidth={1.6} aria-hidden="true" /><span>À RÉCOLTER</span><strong>+{rewardXP}<small> XP</small></strong><p>{preview ? 'Récompense simulée' : 'En cas de réussite'}</p></div>
                <p className="harvest-example-caption">Deux colonnes à supprimer · exemple</p>
            </div>

            <div className="harvest-mission-heading"><h3>Votre mission</h3><span>Deux objectifs. Une victoire.</span></div>
            <ol className="harvest-missions">
                <li><span>01</span><div><h4>Faites place nette.</h4><p>Supprimez au moins <strong>deux colonnes</strong> dans la même manche.</p></div></li>
                <li><span>02</span><div><h4>Prenez l’avantage.</h4><p>Obtenez le <strong>meilleur score final</strong> contre l’IA. Égalités acceptées, pénalités incluses.</p></div></li>
            </ol>
            <div className="harvest-footnotes"><p><Trophy size={15} aria-hidden="true" />{preview ? 'Aucun impact sur votre compte.' : 'Bonus renouvelable après 7 jours.'}</p><p><RotateCcw size={15} aria-hidden="true" />Défi manqué ? Réessayez immédiatement.</p></div>
        </div>
        <footer className="harvest-footer">
            {!available && <p>Récompense disponible dans {remainingDays} jours.</p>}
            <button type="button" disabled={!available} onClick={onLaunch}>{preview ? 'Lancer l’aperçu' : 'Relever le défi'}<ArrowRight size={21} aria-hidden="true" /></button>
        </footer>
    </>;
}
