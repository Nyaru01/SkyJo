import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeftRight } from 'lucide-react';
import SkyjoCard from './SkyjoCard';
import '../../styles/Tabletop.css';

// Échange fait par l'adversaire : les deux vraies cartes, au centre de l'écran.
// Une carte cachée reste montrée de dos.
function Side({ label, card, from }) {
    const reduce = useReducedMotion();
    return <div className="swap-reveal-side">
        <Motion.div initial={reduce ? false : { x: from * 28, rotate: from * 8, opacity: 0 }} animate={{ x: 0, rotate: 0, opacity: 1 }} transition={{ duration: 0.4, ease: [0.2, 0.8, 0.25, 1] }}>
            {card ? <SkyjoCard card={card} size="md" /> : null}
        </Motion.div>
        <small>{label}</small>
    </div>;
}

export default function SwapReveal({ swap }) {
    return createPortal(
        <AnimatePresence>
            {swap && <Motion.div key={swap.key} className="swap-reveal" role="status" aria-live="polite"
                initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25 }}>
                <p className="swap-reveal-title">{swap.by} échange</p>
                <div className="swap-reveal-cards">
                    <Side label="Prise chez vous" card={swap.taken} from={-1} />
                    <span className="swap-reveal-arrow" aria-hidden="true"><ArrowLeftRight size={20} /></span>
                    <Side label={`Donnée par ${swap.by}`} card={swap.given} from={1} />
                </div>
            </Motion.div>}
        </AnimatePresence>,
        document.body,
    );
}
