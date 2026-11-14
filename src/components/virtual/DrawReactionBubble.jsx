import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import '../../styles/Tabletop.css';

// Bulle de bande dessinée quand on pioche une carte extrême :
// +20 → « Aïe ! » (éclat corail qui tremble), −10 → « Yes ! » (bulle dorée qui rebondit).
// Montée une fois par carte piochée (clé = id de la carte), elle s'efface d'elle-même.

// Éclat en étoile irrégulière, façon onomatopée.
const BURST = (() => {
    const pts = [];
    const n = 14;
    for (let i = 0; i < n * 2; i++) {
        const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? 50 : 36 + ((i * 7) % 5);
        pts.push(`${(60 + Math.cos(a) * r * 1.12).toFixed(1)},${(52 + Math.sin(a) * r * 0.86).toFixed(1)}`);
    }
    return pts.join(' ');
})();

function Ouch({ who }) {
    return <>
        <svg className="draw-bubble-shape" viewBox="0 0 120 104" aria-hidden="true">
            <polygon points={BURST} fill="#eba594" stroke="#1d2031" strokeWidth="3" strokeLinejoin="round" />
            <polygon points={BURST} fill="none" stroke="#fff3e8" strokeWidth="1.2" strokeLinejoin="round" transform="translate(60 52) scale(.86) translate(-60 -52)" opacity=".55" />
        </svg>
        <span className="draw-bubble-text">Aïe !</span>
        {who && <span className="draw-bubble-who">pour {who}</span>}
    </>;
}
function Yes({ who }) {
    return <>
        <svg className="draw-bubble-shape" viewBox="0 0 120 104" aria-hidden="true">
            <path d="M14 46 C14 22 36 10 60 10 C84 10 106 22 106 46 C106 68 86 80 62 80 L50 98 L48 80 C30 78 14 66 14 46 Z" fill="#f4e6c8" stroke="#1d2031" strokeWidth="3" strokeLinejoin="round" />
        </svg>
        <span className="draw-bubble-text draw-bubble-text--yes">Yes !</span>
        {who && <span className="draw-bubble-who">pour {who}</span>}
        {[[-8, 6], [116, 14], [104, 84], [4, 80]].map(([x, y], i) => <Motion.i key={i} className="draw-bubble-spark" style={{ left: x, top: y }}
            initial={{ scale: 0, rotate: 0 }} animate={{ scale: [0, 1.2, 0], rotate: 90 }} transition={{ duration: 0.9, delay: 0.15 + i * 0.08 }} />)}
    </>;
}

export default function DrawReactionBubble({ value, who = null }) {
    const reduce = useReducedMotion();
    const ouch = value === 20;
    // Petite vibration sur téléphone pour le « Aïe ! »
    useEffect(() => {
        if (!ouch || who) return;
        try { navigator.vibrate?.([25, 40, 25]); } catch { /* indisponible */ }
    }, [ouch, who]);
    const pop = reduce
        ? { initial: { opacity: 0 }, animate: { opacity: [0, 1, 1, 0] }, transition: { duration: 1.8, times: [0, 0.1, 0.8, 1] } }
        : ouch
            ? { initial: { opacity: 0, scale: 0.3, rotate: -14 }, animate: { opacity: [0, 1, 1, 1, 0], scale: [0.3, 1.18, 1, 1, 0.9], rotate: [-14, 6, -5, 3, 0], x: [0, -5, 5, -3, 0] }, transition: { duration: 1.8, times: [0, 0.18, 0.32, 0.82, 1] } }
            : { initial: { opacity: 0, scale: 0.3, y: 20 }, animate: { opacity: [0, 1, 1, 1, 0], scale: [0.3, 1.12, 0.96, 1, 0.92], y: [20, -8, 2, 0, -10] }, transition: { duration: 1.8, times: [0, 0.2, 0.34, 0.82, 1] } };
    return createPortal(
        <div className="draw-bubble-layer">
            <Motion.div className={`draw-bubble draw-bubble--${ouch ? 'ouch' : 'yes'}`} aria-hidden="true" {...pop}>
                {ouch ? <Ouch who={who} /> : <Yes who={who} />}
            </Motion.div>
            <span className="sr-only" role="status">{ouch ? 'Aïe, un plus vingt !' : 'Yes, un moins dix !'}</span>
        </div>,
        document.body,
    );
}
