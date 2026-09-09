import { useCallback, useEffect, useRef } from 'react';
import normalSheet from '../../assets/sprites/ai-robot-normal.png';
import hardSheet from '../../assets/sprites/ai-robot-hard.png';
import hardcoreSheet from '../../assets/sprites/ai-robot-hardcore.png';
import bonusSheet from '../../assets/sprites/ai-robot-bonus.png';

const SHEETS = { normal: normalSheet, hard: hardSheet, hardcore: hardcoreSheet, bonus: bonusSheet };
const SIZES = { sm: 'w-12 h-12', md: 'w-20 h-20', lg: 'w-32 h-32' };
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
    const sheet = SHEETS[difficulty.toLowerCase()] || normalSheet;

    const play = useCallback(async () => {
        const request = ++requestRef.current;
        animationRef.current?.cancel();
        const image = new Image();
        image.src = sheet;
        try { await image.decode(); } catch { return; }
        if (request !== requestRef.current || !spriteRef.current) return;
        animationRef.current = spriteRef.current.animate(frames, {
            duration: FRAME_COUNT / FPS * 1000,
            iterations: 1,
        });
        // No fill: finishing restores the underlying idle frame (frame zero).
    }, [sheet]);

    useEffect(() => {
        play();
        return () => {
            requestRef.current += 1;
            animationRef.current?.cancel();
        };
    }, [play]);

    return (
        <button
            type="button"
            onClick={play}
            aria-label="Relancer l’animation du robot IA"
            title="Toucher pour animer le robot"
            className={`block shrink-0 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 ${SIZES[size] || SIZES.md} ${className}`}
        >
            <span
                ref={spriteRef}
                aria-hidden="true"
                className="block w-full h-full"
                style={{
                    backgroundImage: `url(${sheet})`,
                    backgroundSize: '400% 400%',
                    backgroundPosition: position(0),
                    backgroundRepeat: 'no-repeat',
                    imageRendering: 'pixelated',
                }}
            />
        </button>
    );
}
