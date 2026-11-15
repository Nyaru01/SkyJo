import { useEffect, useState, memo } from 'react';
import { cn } from '../lib/utils';
import '../styles/SkyjoLoader.css';

// Écran de chargement dans la DA crépuscule : ciel du soir, étoiles, et une grille de 12 cartes
// qui se retournent une à une au fil du pourcentage — comme une manche de Skyjo qui se met en place.
const MESSAGES = ['On dresse la table', 'On mélange le paquet', 'On distribue les cartes', 'On allume les lanternes', 'Presque prêt'];
// Valeurs et couleurs pastel des cartes de la grille (ordre de retournement en spirale douce).
const CARDS = [
    { v: 5, c: 'gold' }, { v: 0, c: 'sky' }, { v: -1, c: 'violet' }, { v: 3, c: 'sage' },
    { v: 9, c: 'coral' }, { v: 2, c: 'sage' }, { v: 12, c: 'rose' }, { v: 4, c: 'gold' },
    { v: -2, c: 'violet' }, { v: 7, c: 'gold' }, { v: 1, c: 'sky' }, { v: 0, c: 'sky' },
];
const ORDER = [0, 4, 8, 9, 10, 11, 7, 3, 2, 1, 5, 6];
const STARS = Array.from({ length: 28 }, (_, i) => ({ x: (i * 37) % 100, y: (i * 53) % 62, d: (i % 7) * 0.6, s: 1 + (i % 3) }));

const Message = memo(function Message() {
    const [i, setI] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setI(n => (n + 1) % MESSAGES.length), 2000);
        return () => clearInterval(id);
    }, []);
    return <p key={i} className="sl-message">{MESSAGES[i]}</p>;
});

export default function SkyjoLoaderPremium({ progress = 0, isFullPage = true }) {
    const [internal, setInternal] = useState(progress);
    useEffect(() => {
        if (progress > 0) { const t = setTimeout(() => setInternal(progress), 0); return () => clearTimeout(t); }
        const timer = setInterval(() => {
            setInternal(prev => (prev >= 100 ? 100 : Math.min(prev + (prev > 85 ? 0.15 : Math.random() * 1.2 + 0.4), 100)));
        }, 50);
        return () => clearInterval(timer);
    }, [progress]);
    const pct = Math.round(internal);
    const flipped = Math.min(12, Math.floor((internal / 100) * 12 + 0.0001));

    return <div className={cn('sl-root', isFullPage ? 'sl-root--full' : 'sl-root--inline')} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Chargement de Skyjo">
        <div className="sl-sky" aria-hidden="true">
            <span className="sl-sun" />
            {STARS.map((s, i) => <i key={i} className="sl-star" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }} />)}
            <span className="sl-cloud sl-cloud--a" /><span className="sl-cloud sl-cloud--b" />
        </div>
        <div className="sl-content">
            <header className="sl-brand">
                <h1>Skyjo</h1>
                <p>Virtuel</p>
            </header>
            <div className="sl-board" aria-hidden="true">
                {CARDS.map((card, i) => {
                    const up = ORDER.indexOf(i) < flipped;
                    return <div key={i} className={`sl-card${up ? ' is-up' : ''}`}>
                        <div className="sl-card-inner">
                            <span className="sl-face sl-back"><b /></span>
                            <span className={`sl-face sl-front sl-front--${card.c}`}>{card.v}</span>
                        </div>
                    </div>;
                })}
            </div>
            <div className="sl-progress">
                <div className="sl-track"><span style={{ width: `${internal}%` }} /></div>
                <div className="sl-meta"><Message /><strong>{pct}%</strong></div>
            </div>
        </div>
    </div>;
}
