/* global __APP_VERSION__ */
import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import { BarChart3, Snowflake, Sparkle, X } from 'lucide-react';
import { FuryIcon } from './virtual/ModeIcons';
import { useDialogFocus } from '../hooks/useDialogFocus';
import '../styles/Guide.css';

// Monter ce numéro fait réapparaître la fenêtre une fois chez chaque joueur au lancement suivant.
export const CURRENT_NEWS_VERSION = 17;

const HIGHLIGHTS = [
    { icon: Sparkle, title: 'Skyjo devient Vesper', text: 'Un nouveau nom, celui de l’étoile du soir, et une nouvelle icône. Vos parties, votre niveau et vos amis ne changent pas.' },
    { icon: FuryIcon, title: 'Mode Fury', text: 'Des cartes de sabotage cachées dans la pioche, contre l’IA et maintenant en ligne entre amis.' },
    { icon: BarChart3, title: 'Les statistiques font peau neuve', text: 'Taux de victoire, temps de jeu, derniers scores et parties récentes : votre parcours en un coup d’œil.' },
    { icon: Snowflake, title: 'Prochaine saison à venir', text: 'La Nuit du solstice ouvre le 21 décembre : un nouveau défi, et l’île passe sous la neige.' },
];

// Nouveautés de la version (s'ouvre une fois à chaque nouvelle annonce, puis depuis « Nouveautés »).
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
                <div className="da-news-visual" aria-hidden="true"><img className="da-news-logo" src="/brand/vesper-v-512.png" alt="" /></div>
                <p className="da-news-kicker">Nouveautés · v{__APP_VERSION__}</p>
                <h2 id="da-news-title">Bienvenue sur Vesper</h2>
                <p className="da-news-lead">Le jeu change de nom et continue de grandir. Voici ce qui vous attend.</p>
                <ul className="da-news-list">
                    {HIGHLIGHTS.map(({ icon: Icon, title, text }, i) => <Motion.li key={title}
                        initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.07, duration: 0.3 }}>
                        <span className="da-news-icon" aria-hidden="true"><Icon size={18} width={18} height={18} strokeWidth={1.7} /></span>
                        <span><strong>{title}</strong><small>{text}</small></span>
                    </Motion.li>)}
                </ul>
                <button type="button" className="da-news-cta" onClick={onClose}>C’est parti</button>
            </Motion.div>
        </div>,
        document.body,
    );
}
