import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ModalCloseButton({ onClick, className, label = 'Fermer' }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className={cn('modal-close-button premium-focus-ring', className)}
        >
            <X className="h-5 w-5" aria-hidden="true" />
        </button>
    );
}

export default function ModalShell({
    isOpen,
    onClose,
    children,
    labelledBy,
    describedBy,
    maxWidth = 'max-w-md',
    zIndex = 'z-[9999]',
    className,
    closeOnBackdrop = true,
    stableBackdrop = false,
    fullScreen = false,
}) {
    const prefersReducedMotion = useReducedMotion();
    const closeRef = useRef(onClose);
    closeRef.current = onClose;

    useEffect(() => {
        if (!isOpen) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleEscape = (event) => {
            if (event.key === 'Escape') closeRef.current?.();
        };

        document.addEventListener('keydown', handleEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    // A full-page rules screen must not inherit the menu's enter/exit animations.
    if (fullScreen) return isOpen ? createPortal(
        <div className={cn('fixed inset-0 overflow-y-auto bg-[#0d1729]', zIndex)}>
            <div role="dialog" aria-modal="true" aria-labelledby={labelledBy}
                aria-describedby={describedBy}
                className={cn('relative mx-auto w-full max-w-lg', className, 'seasonal-rules-fullscreen')}>
                {children}
            </div>
        </div>, document.body
    ) : null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <Motion.div
                    inherit={false}
                    initial={{ opacity: stableBackdrop ? 1 : 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
                    className={cn('modal-backdrop', zIndex)}
                    style={stableBackdrop ? { background: '#080f1e', backdropFilter: 'none', WebkitBackdropFilter: 'none' } : undefined}
                    onClick={closeOnBackdrop ? onClose : undefined}
                >
                    <Motion.div
                        inherit={false}
                        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 10 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: 'easeOut' }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={labelledBy}
                        aria-describedby={describedBy}
                        onClick={(event) => event.stopPropagation()}
                        className={cn('modal-surface', maxWidth, className)}
                    >
                        {children}
                    </Motion.div>
                </Motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
