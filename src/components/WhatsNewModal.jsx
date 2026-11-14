import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import { Castle, Leaf, Moon, LayoutGrid, X } from 'lucide-react';
import { useDialogFocus } from '../hooks/useDialogFocus';
import { WelcomeIsland } from './Tutorial';
import '../styles/Guide.css';

// Monter ce numéro fait réapparaître la fenêtre une fois chez chaque joueur au lancement suivant.
export const CURRENT_NEWS_VERSION = 14;

const HIGHLIGHTS = [
    { icon: Castle, title: 'Une île vivante', text: 'Une tour à mécanisme qui tourne quand on la touche, des oiseaux de papier, des étoiles filantes.' },
    { icon: Leaf, title: 'Les saisons', text: 'Feuilles d’automne en ce moment, neige à partir du 21 décembre, pétales au printemps.' },
    { icon: Moon, title: 'Tout au crépuscule', text: 'Menus, table de jeu et fenêtres passent au verre nuit et à l’encre ivoire, plus reposants pour les yeux.' },
    { icon: LayoutGrid, title: 'Une table qui tient dans l’écran', text: 'Plus de défilement en partie : la taille des cartes s’ajuste à votre téléphone.' },
];

// Présentation de la nouvelle direction artistique (s'ouvre une seule fois, puis depuis « Nouveautés »).
export default function WhatsNewModal({ isOpen, onClose }) {
    const ref = useRef(null);
    const reduce = useReducedMotion();
    useDialogFocus(isOpen, ref, onClose);
    if (!isOpen) return null;
    return createPortal(
        <div className="da-news" onClick={onClose}>
            <Motion.div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="da-news-title"
                className="da-news-panel" onClick={e => e.stopPropagation()}
                initial={reduce ? false : { opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.2, 0.8, 0.25, 1] }}>
                <button type="button" className="da-news-close" onClick={onClose} aria-label="Fermer"><X size={18} aria-hidden="true" /></button>
                <div className="da-news-visual" aria-hidden="true"><WelcomeIsland /></div>
                <p className="da-news-kicker">Nouvelle direction artistique · v3.4</p>
                <h2 id="da-news-title">Skyjo passe au crépuscule</h2>
                <p className="da-news-lead">Une île suspendue, une lumière de fin de journée, des matières calmes : toute l’application a été redessinée.</p>
                <ul className="da-news-list">
                    {HIGHLIGHTS.map(({ icon: Icon, title, text }, i) => <Motion.li key={title}
                        initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.07, duration: 0.3 }}>
                        <span className="da-news-icon" aria-hidden="true"><Icon size={18} strokeWidth={1.7} /></span>
                        <span><strong>{title}</strong><small>{text}</small></span>
                    </Motion.li>)}
                </ul>
                <button type="button" className="da-news-cta" onClick={onClose}>Découvrir</button>
            </Motion.div>
        </div>,
        document.body,
    );
}
