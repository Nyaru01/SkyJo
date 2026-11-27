import { useEffect, useRef } from 'react';

const COLUMNS = 12;
const ROWS = 10;
const FRAME_COUNT = COLUMNS * ROWS;
const FRAME_MS = 16000 / FRAME_COUNT;

export default function IslandSpin({ active }) {
    const islandRef = useRef(null);

    useEffect(() => {
        if (!active) return undefined;

        const island = islandRef.current;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let timer;
        let frame = 0;
        const draw = () => {
            const x = frame % COLUMNS * 100 / (COLUMNS - 1);
            const y = Math.floor(frame / COLUMNS) * 100 / (ROWS - 1);
            island.style.backgroundPosition = `${x}% ${y}%`;
        };
        const update = () => {
            window.clearInterval(timer);
            if (reducedMotion.matches) {
                frame = 0;
                draw();
            } else if (!document.hidden) {
                timer = window.setInterval(() => {
                    frame = (frame + 1) % FRAME_COUNT;
                    draw();
                }, FRAME_MS);
            }
        };

        draw();
        update();
        reducedMotion.addEventListener('change', update);
        document.addEventListener('visibilitychange', update);
        return () => {
            window.clearInterval(timer);
            reducedMotion.removeEventListener('change', update);
            document.removeEventListener('visibilitychange', update);
        };
    }, [active]);

    return <div ref={islandRef} className="ai-rival-island" aria-hidden="true" />;
}
