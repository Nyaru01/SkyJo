import { motion as Motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeftRight, ChevronDown, ChevronUp, Info, Orbit } from 'lucide-react';
import '../../styles/Tabletop.css';

// Lit le message de la partie pour en faire un bandeau clair : titre, consigne, étapes, direction.
function describe(message) {
    const msg = message.toLowerCase();
    if (msg.includes('échange') || msg.includes('swap')) {
        const step = msg.includes('adverse') ? 2 : 1;
        return {
            kind: 'swap', icon: ArrowLeftRight, title: 'Échange', step,
            text: step === 1 ? 'Touchez une de vos cartes' : 'Touchez une carte de l’adversaire',
            direction: step === 1 ? 'down' : 'up',
        };
    }
    if (msg.includes('aspirer') || msg.includes('trou noir')) return { kind: 'hole', icon: Orbit, title: 'Trou noir', text: message, direction: null };
    return { kind: 'info', icon: Info, title: null, text: message, direction: null };
}

// Bandeau des actions spéciales, centré entre les deux plateaux.
const GameMessageBanner = ({ message }) => {
    const reduce = useReducedMotion();
    const info = message ? describe(message) : null;
    const Icon = info?.icon;
    const Arrow = info?.direction === 'up' ? ChevronUp : ChevronDown;
    return (
        <div className="skyjo-banner-layer" role="status" aria-live="polite">
            <AnimatePresence mode="wait">
                {info && (
                    <Motion.div key={`${info.kind}-${info.step || 0}`}
                        className={`skyjo-banner skyjo-banner--${info.kind}`}
                        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -6 }}
                        transition={{ duration: 0.28, ease: [0.2, 0.8, 0.25, 1] }}>
                        {info.direction === 'up' && <Motion.span className="skyjo-banner-arrow skyjo-banner-arrow--up" aria-hidden="true"
                            animate={reduce ? undefined : { y: [0, -4, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}><Arrow size={18} /></Motion.span>}
                        <div className="skyjo-banner-head">
                            <span className="skyjo-banner-icon" aria-hidden="true"><Icon size={18} strokeWidth={1.8} /></span>
                            <span className="skyjo-banner-copy">
                                {info.title && <strong>{info.title}</strong>}
                                <span>{info.text}</span>
                            </span>
                        </div>
                        {info.kind === 'swap' && <ol className="skyjo-banner-steps" aria-label={`Étape ${info.step} sur 2`}>
                            <li className={info.step === 1 ? 'is-current' : 'is-done'}><i>1</i>Votre carte</li>
                            <li aria-hidden="true" className="skyjo-banner-steps-sep" />
                            <li className={info.step === 2 ? 'is-current' : ''}><i>2</i>Carte adverse</li>
                        </ol>}
                        {info.direction === 'down' && <Motion.span className="skyjo-banner-arrow skyjo-banner-arrow--down" aria-hidden="true"
                            animate={reduce ? undefined : { y: [0, 4, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}><Arrow size={18} /></Motion.span>}
                    </Motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GameMessageBanner;
