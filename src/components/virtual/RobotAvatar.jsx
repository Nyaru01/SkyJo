import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import normalSheet from '../../assets/sprites/ai-robot-normal.png';
import hardSheet from '../../assets/sprites/ai-robot-hard.png';
import hardcoreSheet from '../../assets/sprites/ai-robot-hardcore.png';
import bonusSheet from '../../assets/sprites/ai-robot-bonus.png';

const loadMascot = () => import('./Mascot3D');
const Mascot3D = lazy(loadMascot);
// La 3D se charge dès que possible : plus d'ancien robot (sprite) affiché le temps du chargement.
if (typeof window !== 'undefined' && supportsWebGLOnce()) loadMascot();
function supportsWebGLOnce() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } }

function supportsWebGL() {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}
// Si la 3D plante, on garde le sprite.
class MascotBoundary extends Component {
    constructor(props) { super(props); this.state = { failed: false }; }
    static getDerivedStateFromError() { return { failed: true }; }
    render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

const SHEETS = { normal: normalSheet, hard: hardSheet, hardcore: hardcoreSheet, bonus: bonusSheet };
const SIZES = { sm: 'w-12 h-12', md: 'w-20 h-20', lg: 'w-32 h-32', hero: 'w-52 h-52' };
const FPS = 8;
const FRAME_COUNT = 16;
const position = frame => `${(frame % 4) * 100 / 3}% ${Math.floor(frame / 4) * 100 / 3}%`;
const frames = Array.from({ length: FRAME_COUNT }, (_, frame) => ({
    backgroundPosition: position(frame),
    offset: frame / FRAME_COUNT,
    easing: 'steps(1, end)',
}));
frames.push({ backgroundPosition: position(0), offset: 1 });

export default function RobotAvatar({ className = '', difficulty = 'normal', size = 'md' }) {
    const spriteRef = useRef(null);
    const animationRef = useRef(null);
    const requestRef = useRef(0);
    const reducedMotion = useReducedMotion();
    const sheet = SHEETS[difficulty.toLowerCase()] || normalSheet;
    const [initialSheet] = useState(sheet);

    const play = useCallback(async () => {
        const request = ++requestRef.current;
        animationRef.current?.cancel();
        const image = new Image();
        image.src = sheet;
        try { await image.decode(); } catch { return; }
        if (request !== requestRef.current || !spriteRef.current) return;
        // Keep the previous character visible until the selected sheet is decoded.
        spriteRef.current.style.backgroundImage = `url(${sheet})`;
        if (reducedMotion) return;
        animationRef.current = spriteRef.current.animate(frames, {
            duration: FRAME_COUNT / FPS * 1000,
            iterations: 1,
        });
        // No fill: finishing restores the underlying idle frame (frame zero).
    }, [sheet, reducedMotion]);

    useEffect(() => {
        play();
        return () => {
            requestRef.current += 1;
            animationRef.current?.cancel();
        };
    }, [play]);

    // Mascotte 3D si WebGL est disponible ; sinon (ou pendant le chargement) l'ancien sprite.
    const [webgl] = useState(supportsWebGL);
    const [poke, setPoke] = useState(0);
    const sprite = <span
        ref={spriteRef}
        aria-hidden="true"
        className="block w-full h-full"
        style={{
            backgroundImage: `url(${initialSheet})`,
            backgroundSize: '400% 400%',
            backgroundPosition: position(0),
            backgroundRepeat: 'no-repeat',
            imageRendering: 'auto',
        }}
    />;

    return (
        <button
            type="button"
            onClick={webgl ? () => setPoke(p => p + 1) : play}
            aria-label={reducedMotion ? 'Mascotte de l’IA' : 'Animer la mascotte de l’IA'}
            className={`block shrink-0 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 ${SIZES[size] || SIZES.md} ${className}`}
        >
            {webgl
                ? <MascotBoundary fallback={sprite}><Suspense fallback={<span className="robot-avatar-loading" aria-hidden="true" />}><Mascot3D difficulty={difficulty} poke={poke} /></Suspense></MascotBoundary>
                : sprite}
        </button>
    );
}
