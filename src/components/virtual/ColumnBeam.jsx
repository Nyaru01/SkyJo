import { useState } from 'react';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import '../../styles/Tabletop.css';

// Colonne nettoyée : un pilier de lumière monte, une onde part du centre,
// des poussières dorées s'élèvent, puis l'étiquette « Clean ! » (ou le bonus) apparaît.
const MOTES = 16;
function createMotes() {
    return Array.from({ length: MOTES }, () => ({
        x: (Math.random() - 0.5) * 70,
        y: -40 - Math.random() * 70,
        size: 2 + Math.random() * 3,
        delay: 0.3 + Math.random() * 0.3,
        start: (Math.random() - 0.5) * 60,
    }));
}

export default function ColumnBeam({ bonus = false }) {
    const reduce = useReducedMotion();
    const [motes] = useState(createMotes);
    if (reduce) return <div className="skyjo-clear" aria-hidden="true"><span className="skyjo-clear-result">{bonus ? '−3' : 'Clean !'}</span></div>;
    return (
        <div className="skyjo-clear" aria-hidden="true">
            {/* Pilier de lumière qui monte depuis le bas de la colonne */}
            <Motion.div className="skyjo-clear-pillar"
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: [0, 1, 1], opacity: [0, 0.95, 0] }}
                transition={{ duration: 1, times: [0, 0.35, 1], ease: 'easeOut', delay: 0.15 }} />
            {/* Onde de choc au centre */}
            <Motion.div className="skyjo-clear-ring"
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: [0.2, 1.6], opacity: [0.9, 0] }}
                transition={{ duration: 0.7, delay: 0.5, ease: 'easeOut' }} />
            {/* Poussières dorées */}
            {motes.map((m, i) => (
                <Motion.i key={i} className="skyjo-clear-mote" style={{ width: m.size, height: m.size }}
                    initial={{ x: m.x * 0.3, y: m.start, opacity: 0, scale: 0 }}
                    animate={{ x: m.x, y: m.y, opacity: [0, 1, 0], scale: [0, 1, 0.4] }}
                    transition={{ duration: 0.75, delay: m.delay, ease: 'easeOut' }} />
            ))}
            <Motion.span className={`skyjo-clear-result${bonus ? ' skyjo-clear-result--bonus' : ''}`}
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: [0, 1, 1, 0], y: [10, 0, -4, -14], scale: [0.8, 1.06, 1, 1] }}
                transition={{ duration: 0.95, times: [0, 0.3, 0.75, 1], delay: 0.72 }}>
                {bonus ? '−3' : 'Clean !'}
            </Motion.span>
        </div>
    );
}
