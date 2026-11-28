import { useEffect, useRef, useState } from 'react';

const HOLD_MS = 400;

export function useDiscardHistory(cardCount, onTake, onHold) {
    const [showHistory, setShowHistory] = useState(false);
    const timer = useRef(null);
    const held = useRef(false);

    useEffect(() => () => clearTimeout(timer.current), []);

    const openHistory = () => {
        if (cardCount) setShowHistory(true);
    };
    const stopPress = () => clearTimeout(timer.current);

    return {
        showHistory,
        openHistory,
        closeHistory: () => setShowHistory(false),
        pressHandlers: {
            onPointerDown: event => {
                if (!event.isPrimary || event.button !== 0) return;
                stopPress();
                held.current = false;
                if (!cardCount) return;
                timer.current = setTimeout(() => {
                    held.current = true;
                    onHold?.();
                    openHistory();
                }, HOLD_MS);
            },
            onPointerUp: stopPress,
            onPointerLeave: stopPress,
            onPointerCancel: stopPress,
            onContextMenu: event => event.preventDefault(),
            onClick: event => {
                if (held.current && event.detail > 0) {
                    held.current = false;
                    return;
                }
                onTake?.(event);
            },
        },
    };
}
