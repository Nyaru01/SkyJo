import { memo, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Layers, X } from 'lucide-react';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import SkyjoCard from './SkyjoCard';
import '../../styles/DiscardHistory.css';

const DiscardHistoryOverlay = memo(function DiscardHistoryOverlay({ cards = [], isVisible, onClose }) {
    const dialogRef = useRef(null);
    const titleId = useId();
    const reduced = useReducedMotion();
    const recentCards = cards.slice(-4);
    const open = isVisible && recentCards.length > 0;
    useDialogFocus(open, dialogRef, onClose);

    return createPortal(
        <AnimatePresence>
            {open && (
                <Motion.div className="discard-history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: reduced ? 0 : .18 }}
                    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
                    <Motion.section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId}
                        className="discard-history__panel"
                        initial={reduced ? false : { y: 10, scale: .98 }} animate={{ y: 0, scale: 1 }}>
                        <header className="discard-history__header">
                            <span className="discard-history__icon"><Layers size={17} aria-hidden="true" /></span>
                            <div>
                                <h2 id={titleId}>Défausse</h2>
                                <p>{recentCards.length === cards.length
                                    ? `${cards.length} carte${cards.length === 1 ? '' : 's'}`
                                    : `${recentCards.length} dernières cartes sur ${cards.length}`}</p>
                            </div>
                            <button type="button" className="discard-history__close" onClick={onClose} aria-label="Fermer la défausse">
                                <X size={18} aria-hidden="true" />
                            </button>
                        </header>
                        <ol className="discard-history__cards">
                            {recentCards.map((card, index) => {
                                const isTop = index === recentCards.length - 1;
                                return <li key={card.id ?? index} className={isTop ? 'discard-history__top' : undefined}>
                                    <div className="discard-history__card">
                                        <SkyjoCard card={{ ...card, isRevealed: true }} size="custom" />
                                    </div>
                                    {isTop && <span>Au-dessus</span>}
                                </li>;
                            })}
                        </ol>
                    </Motion.section>
                </Motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
});

export default DiscardHistoryOverlay;
