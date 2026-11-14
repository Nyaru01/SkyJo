import { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Bot } from 'lucide-react';
import { cn } from '../lib/utils';
import '../styles/Guide.css';

/**
 * Fenêtre du pseudo, au style crépuscule du guide.
 * Le contenu n'est monté qu'à l'ouverture : le champ repart ainsi de la valeur initiale à chaque fois.
 */
function PseudoForm({ onClose, onConfirm, initialValue }) {
    const [pseudo, setPseudo] = useState(initialValue === 'Joueur' ? '' : initialValue);
    const [error, setError] = useState('');

    const handleConfirm = () => {
        const trimmed = pseudo.trim();
        if (!trimmed) { setError('Indiquez un pseudo pour continuer.'); return; }
        if (trimmed.toLowerCase() === 'joueur') { setError('Ce pseudo est réservé.'); return; }
        onConfirm(trimmed);
    };

    return <>
        <span className="pseudo-dialog-emblem" aria-hidden="true"><Bot size={26} strokeWidth={1.6} /></span>
        <p className="pseudo-dialog-kicker">Avant la première partie</p>
        <h3 id="pseudo-dialog-title">Comment vous appeler ?</h3>
        <p className="pseudo-dialog-text">Ce nom apparaîtra à la table et dans le classement.</p>
        <input
            value={pseudo}
            onChange={(e) => { setPseudo(e.target.value); setError(''); }}
            placeholder="Votre pseudo"
            className={cn('pseudo-dialog-input', error && 'pseudo-dialog-input--error')}
            aria-invalid={Boolean(error)}
            aria-label="Votre pseudo"
            autoFocus
            maxLength={24}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
        />
        {error && <p className="pseudo-dialog-error" role="alert">{error}</p>}
        <button type="button" onClick={handleConfirm} className="pseudo-dialog-confirm">C’est parti</button>
        <button type="button" onClick={onClose} className="pseudo-dialog-later">Plus tard</button>
    </>;
}

export default function PseudoModal({ isOpen, onClose, onConfirm, initialValue = '' }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="pseudo-dialog" role="dialog" aria-modal="true" aria-labelledby="pseudo-dialog-title">
                    <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pseudo-dialog-scrim" onClick={onClose} />
                    <Motion.div
                        initial={{ scale: 0.96, opacity: 0, y: 14 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.96, opacity: 0, y: 14 }}
                        className="pseudo-dialog-panel"
                    >
                        <PseudoForm onClose={onClose} onConfirm={onConfirm} initialValue={initialValue} />
                    </Motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
