import { useEffect, useRef } from 'react';
import spriteSheet from '../../assets/sprites/daily-robot.png';

const FRAME_COUNT = 16;
const FPS = 8;
const PAUSE_MS = 2000;
const CYCLE_MS = FRAME_COUNT / FPS * 1000 + PAUSE_MS;
const position = frame => `${(frame % 4) * 100 / 3}% ${Math.floor(frame / 4) * 100 / 3}%`;

// Equal cells from the complete sheet: no individual trimming or alignment changes.
const frames = Array.from({ length: FRAME_COUNT }, (_, frame) => ({
    backgroundPosition: position(frame),
    offset: (frame / FPS * 1000) / CYCLE_MS,
    easing: 'steps(1, end)',
}));
// Hold the last frame for the pause; the next iteration starts at frame zero.
frames.push({ backgroundPosition: position(FRAME_COUNT - 1), offset: 1 });

export default function RobotAvatar({ customMessage, showBubble }) {
    const spriteRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        let animation;
        const image = new Image();
        image.src = spriteSheet;
        // Start only once the complete sheet is ready; stop when the modal closes.
        image.decode().then(() => {
            if (cancelled || !spriteRef.current) return;
            animation = spriteRef.current.animate(frames, {
                duration: CYCLE_MS,
                iterations: Infinity,
            });
        }).catch(() => { /* Keep the idle frame if the image cannot be decoded. */ });
        return () => {
            cancelled = true;
            animation?.cancel();
        };
    }, []);

    return (
        <div className="relative flex flex-col items-center w-full">
            <div
                ref={spriteRef}
                role="img"
                aria-label="Robot du défi quotidien animé"
                className="block w-40 h-40 shrink-0"
                style={{
                    backgroundImage: `url(${spriteSheet})`,
                    backgroundSize: '400% 400%',
                    backgroundPosition: position(0),
                    backgroundRepeat: 'no-repeat',
                    imageRendering: 'auto',
                }}
            />
            <p className={`h-5 text-xs font-semibold text-cyan-200 ${showBubble ? 'visible' : 'invisible'}`}>
                {customMessage}
            </p>
        </div>
    );
}
