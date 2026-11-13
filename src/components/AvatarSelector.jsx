import { createPortal } from 'react-dom';
import { motion as Motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { AVATARS } from '../lib/avatars';
import { Check, X } from 'lucide-react';

export default function AvatarSelector({ selectedId, onSelect, isOpen, onClose }) {
    if (!isOpen) return null;
    const current = AVATARS.find(avatar => avatar.id === selectedId) || AVATARS[0];

    return createPortal(
        <div className="lobby-dialog avatar-picker-backdrop fixed inset-0 z-[300] flex items-center justify-center p-4">
            {/* Overlay click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            <Motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="avatar-picker-title"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                className="avatar-picker relative w-full max-w-sm"
            >
                <button type="button" onClick={onClose} aria-label="Fermer" className="avatar-picker-close"><X size={18} aria-hidden="true" /></button>

                <header className="avatar-picker-header">
                    <div className="avatar-picker-preview">
                        <img src={current.path} alt="" />
                    </div>
                    <div>
                        <p>VOTRE PERSONNAGE</p>
                        <h3 id="avatar-picker-title">{current.name || 'Choisir un avatar'}</h3>
                    </div>
                </header>

                <div className="avatar-picker-grid" role="radiogroup" aria-label="Avatars">
                    {AVATARS.map((avatar, index) => {
                        const isSelected = selectedId === avatar.id;
                        return (
                            <button
                                key={avatar.id}
                                type="button"
                                role="radio"
                                aria-checked={isSelected}
                                aria-label={avatar.name}
                                onClick={() => onSelect(avatar.id)}
                                className={cn('avatar-picker-tile', isSelected && 'avatar-picker-tile--selected')}
                                style={{ '--i': index }}
                            >
                                <img src={avatar.path} alt="" />
                                {isSelected && <span className="avatar-picker-check"><Check size={12} strokeWidth={3} aria-hidden="true" /></span>}
                            </button>
                        );
                    })}
                </div>

                <button type="button" onClick={onClose} className="avatar-picker-done">C'est parfait</button>
            </Motion.div>
        </div>,
        document.body
    );
}
