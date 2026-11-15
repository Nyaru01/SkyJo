import { useEffect, useState, memo } from 'react';
import { cn } from '../lib/utils';
import '../styles/SkyjoLoader.css';

// Écran de chargement dans la DA crépuscule : ciel du soir, étoiles, et un soleil qui parcourt
// son arc au-dessus de l'horizon au fil du pourcentage.
const MESSAGES = ['On dresse la table', 'On mélange le paquet', 'On distribue les cartes', 'On allume les lanternes', 'Presque prêt'];
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
    // Arc du soleil : de l'horizon gauche (0 %) à l'horizon droit (100 %), en passant par le zénith.
    const angle = Math.PI * (1 - internal / 100);
    const sunX = 120 + Math.cos(angle) * 96;
    const sunY = 112 - Math.sin(angle) * 86;

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
            <svg className="sl-arc" viewBox="0 0 240 132" aria-hidden="true">
                <defs>
                    <radialGradient id="sl-sun-glow"><stop offset="0" stopColor="#fff1d6" /><stop offset=".35" stopColor="#ffc995" stopOpacity=".8" /><stop offset="1" stopColor="#f2a07a" stopOpacity="0" /></radialGradient>
                    <linearGradient id="sl-arc-done" x1="0" x2="1"><stop offset="0" stopColor="#e3cfa8" /><stop offset="1" stopColor="#f6b48e" /></linearGradient>
                </defs>
                <path d="M24 112 A96 86 0 0 1 216 112" className="sl-arc-track" />
                <path d="M24 112 A96 86 0 0 1 216 112" className="sl-arc-done" stroke="url(#sl-arc-done)" pathLength="100" style={{ strokeDasharray: 100, strokeDashoffset: 100 - internal }} />
                <line x1="6" y1="112" x2="234" y2="112" className="sl-horizon" />
                <circle cx={sunX} cy={sunY} r="30" fill="url(#sl-sun-glow)" />
                <circle cx={sunX} cy={sunY} r="9" className="sl-sun-disc" />
                {/* Silhouette de l'île flottante, qui se balance doucement sous l'arc du soleil */}
                <g className="sl-island">
                    <path d="M92 74 L120 62 L148 74 L120 86 Z" className="sl-island-top" />
                    <path d="M92 74 L120 86 L120 96 L96 84 Z" className="sl-island-left" />
                    <path d="M148 74 L120 86 L120 96 L144 84 Z" className="sl-island-right" />
                    <path d="M98 84 L120 96 L142 84 L128 104 L120 110 L112 104 Z" className="sl-island-rock" />
                    <rect x="129" y="56" width="7" height="14" rx="1" className="sl-island-tower" />
                    <path d="M128 57 Q132.5 49 137 57 Z" className="sl-island-dome" />
                    <circle cx="105" cy="71" r="3.2" className="sl-island-tree" />
                    <circle cx="132.5" cy="62" r="1.3" className="sl-island-light" />
                </g>
            </svg>
            <p className="sl-pct">{pct}<span>%</span></p>
            <div className="sl-progress">
                <Message />
            </div>
        </div>
    </div>;
}
