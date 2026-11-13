import { useLayoutEffect, useRef } from 'react';

let scrollLocks = 0;
let originalOverflow = '';
const FOCUSABLE = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function useDialogFocus(isOpen, dialogRef, onClose, initialFocusRef) {
    const closeRef = useRef(onClose);
    closeRef.current = onClose;
    useLayoutEffect(() => {
        if (!isOpen) return;
        const dialog = dialogRef.current;
        if (!dialog) return;
        const previousFocus = document.activeElement;
        if (scrollLocks++ === 0) {
            originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
        }
        const controls = () => [...dialog.querySelectorAll(FOCUSABLE)].filter(node => node.getClientRects().length && node.tabIndex >= 0);
        (initialFocusRef?.current || controls()[0] || dialog).focus({ preventScroll: true });
        const handleKey = event => {
            // Only the topmost mounted dialog handles keyboard input.
            const dialogs = document.querySelectorAll('[aria-modal="true"]');
            if (dialogs[dialogs.length - 1] !== dialog) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                closeRef.current?.();
            }
            if (event.key === 'Tab') {
                const items = controls();
                const first = items[0];
                const last = items[items.length - 1];
                if (!first) { event.preventDefault(); dialog.focus(); }
                else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
                    event.preventDefault(); last.focus();
                } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
                    event.preventDefault(); first.focus();
                }
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('keydown', handleKey);
            if (--scrollLocks === 0) document.body.style.overflow = originalOverflow;
            if (previousFocus?.isConnected) previousFocus.focus?.({ preventScroll: true });
        };
    }, [isOpen, dialogRef, initialFocusRef]);
}
