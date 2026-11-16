import { useEffect, useRef } from 'react';

// L’île de l’accueil, au loin derrière le rival : 120 vues pré-rendues (3° chacune) dans une seule image.
// Pour une rotation fluide, deux vues voisines se fondent l’une dans l’autre à chaque image :
// seules la position du fond et l’opacité de deux petits éléments changent (aucun coût 3D).
const N = 120;
const COLS = 12;
const ROWS = 10;
const PERIOD = 16000; // un tour complet en 16 s
const pos = i => `${(i % COLS) * 100 / (COLS - 1)}% ${Math.floor(i / COLS) * 100 / (ROWS - 1)}%`;

export default function IslandSpin() {
    const a = useRef(null);
    const b = useRef(null);
    useEffect(() => {
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
        let raf = 0;
        let last = -1;
        const start = performance.now();
        const tick = now => {
            const f = ((now - start) % PERIOD) / PERIOD * N;
            const i = Math.floor(f);
            if (a.current && b.current) {
                if (i !== last) {
                    a.current.style.backgroundPosition = pos(i);
                    b.current.style.backgroundPosition = pos((i + 1) % N);
                    last = i;
                }
                b.current.style.opacity = String(f - i);
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);
    return <div className="ai-rival-island" aria-hidden="true">
        <i ref={a} />
        <i ref={b} style={{ opacity: 0 }} />
    </div>;
}
