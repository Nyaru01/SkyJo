import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export function IntroScreen({ onComplete }) {
    const completed = useRef(false);
    const canvasRef = useRef(null);
    const animationFrame = useRef(null);
    const reduceMotion = useReducedMotion();
    const motionPreference = useRef(reduceMotion);
    motionPreference.current = reduceMotion;

    useEffect(() => {
        const shuffleAudio = new Audio('/Sounds/shuffling.mp3');
        shuffleAudio.volume = 0.4;
        const playShuffle = () => shuffleAudio.play().catch(() => {});
        playShuffle();
        window.addEventListener('pointerdown', playShuffle, { once: true });
        return () => {
            window.removeEventListener('pointerdown', playShuffle);
            shuffleAudio.pause();
            cancelAnimationFrame(animationFrame.current);
            animationFrame.current = null;
        };
    }, []);

    const startCamera = (event) => {
        if (animationFrame.current !== null) return;
        const video = event.currentTarget;
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d', { alpha: false });
        if (!context || !video.videoWidth) return;
        // Fixed native-resolution surface: neither the video layer nor its mask is scaled.
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        let elapsed = video.currentTime;
        let previousTime;
        const draw = (now) => {
            const delta = previousTime === undefined ? 0 : (now - previousTime) / 1000;
            previousTime = now;
            if (!video.paused && video.readyState >= 3 && !video.seeking) elapsed += delta;
            const progress = Math.min(1, elapsed / Math.max(1, video.duration - 2));
            const phase = progress < 0.48 ? progress / 0.48 : Math.min(1, (progress - 0.48) / 0.44);
            const eased = (1 - Math.cos(Math.PI * phase)) / 2;
            const scale = motionPreference.current ? 1 : progress < 0.48 ? 1 + 0.15 * eased : 1.15 - 0.13 * eased;
            const width = canvas.width * scale;
            const height = canvas.height * scale;
            if (video.readyState >= 2) {
                context.drawImage(video, (canvas.width - width) * 0.5, (canvas.height - height) * 0.43, width, height);
            }
            animationFrame.current = requestAnimationFrame(draw);
        };
        animationFrame.current = requestAnimationFrame(draw);
    };

    const finishIntro = () => {
        if (completed.current) return;
        completed.current = true;
        onComplete();
    };

    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 1, ease: 'easeInOut' }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black overflow-hidden"
        >
            <video
                src="/introv2.mp4"
                autoPlay muted playsInline preload="auto"
                className="absolute inset-0 w-full h-full opacity-0 pointer-events-none" aria-hidden="true"
                onPlaying={startCamera}
                onTimeUpdate={(event) => {
                    const video = event.currentTarget;
                    if (Number.isFinite(video.duration) && video.duration > 3 && video.currentTime >= video.duration - (reduceMotion ? 1 : 2)) finishIntro();
                }}
                onEnded={finishIntro}
                onError={finishIntro}
            />
            <canvas
                ref={canvasRef}
                role="img"
                aria-label="Introduction Nyaru Studio"
                className="max-w-full max-h-full w-auto h-auto object-contain"
                style={{
                    maskImage: 'linear-gradient(to bottom, black 72%, transparent 82%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 72%, transparent 82%)',
                }}
            />
        </motion.div>
    );
}
