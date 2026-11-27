import { useEffect, useRef, useState } from 'react';
import { motion as Motion, useIsPresent, useReducedMotion } from 'framer-motion';

const HOME_FADE_SECONDS = 1.55;
const HOME_PREPARE_AT_SECONDS = 2;
const STUDIO_VIDEO = '/nyaru-studio-intro.mp4';

function syncVideoBackground(video, background) {
    if (background?.readyState >= 1 && Math.abs(background.currentTime - video.currentTime) > 0.3) {
        background.currentTime = video.currentTime;
    }
}

function paintStudioBackdrop(ctx, video) {
    if (video.readyState < 2) return;
    const { width, height } = ctx.canvas;
    const { videoWidth, videoHeight } = video;
    const scale = Math.min(width / videoWidth, height / videoHeight);
    const w = videoWidth * scale, h = videoHeight * scale;
    const x = (width - w) / 2, y = (height - h) / 2;

    // Prolonger le ciel par réflexion des bords, sans agrandir le logo.
    if (y > 0) {
        const edge = Math.min(y / scale, videoHeight * .18);
        ctx.setTransform(1, 0, 0, -1, 0, y);
        ctx.drawImage(video, 0, 0, videoWidth, edge, 0, 0, width, y);
        ctx.setTransform(1, 0, 0, -1, 0, y + h);
        ctx.drawImage(video, 0, videoHeight - edge, videoWidth, edge, 0, -y, width, y);
    } else if (x > 0) {
        const edge = Math.min(x / scale, videoWidth * .18);
        ctx.setTransform(-1, 0, 0, 1, x, 0);
        ctx.drawImage(video, 0, 0, edge, videoHeight, 0, 0, x, height);
        ctx.setTransform(-1, 0, 0, 1, x + w, 0);
        ctx.drawImage(video, videoWidth - edge, 0, edge, videoHeight, -x, 0, x, height);
    }
    ctx.resetTransform();
    ctx.drawImage(video, x, y, w, h);
}

function StudioBackdrop({ videoRef, active }) {
    const canvasRef = useRef(null);
    useEffect(() => {
        if (!active) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const resize = () => {
            const { clientWidth, clientHeight } = canvas;
            const scale = 280 / Math.max(clientWidth, clientHeight, 1);
            canvas.width = Math.max(1, Math.round(clientWidth * scale));
            canvas.height = Math.max(1, Math.round(clientHeight * scale));
            paintStudioBackdrop(ctx, video);
        };
        const observer = new ResizeObserver(resize);
        observer.observe(canvas);
        resize();

        const nextFrame = video.requestVideoFrameCallback?.bind(video) ?? requestAnimationFrame;
        const cancelFrame = video.cancelVideoFrameCallback?.bind(video) ?? cancelAnimationFrame;
        let frame = nextFrame(function draw() {
            paintStudioBackdrop(ctx, video);
            frame = nextFrame(draw);
        });
        return () => {
            cancelFrame(frame);
            observer.disconnect();
        };
    }, [active, videoRef]);
    return <canvas ref={canvasRef} className="studio-intro-bg" aria-hidden="true" />;
}

function VesperIntro({ active, reduceMotion, onPrepareHome, onDone }) {
    const videoRef = useRef(null);
    const bgRef = useRef(null);
    const done = useRef(false);
    const prepared = useRef(false);
    const finish = () => { if (done.current) return; done.current = true; onDone(); };
    useEffect(() => {
        const v = videoRef.current;
        if (!active || !v) return;
        // Avec le son si le navigateur l'autorise, sinon en muet.
        v.muted = false;
        v.play().catch(() => { v.muted = true; v.play().catch(finish); });
        bgRef.current?.play().catch(() => {});
    }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
    return <div className="vesper-intro" style={{ opacity: active ? 1 : 0 }}>
        {/* Copie floutée et agrandie en fond : elle remplit le haut et le bas de l'écran avec les vraies couleurs
            de la vidéo, à chaque instant (au lieu de bandes de couleur fixe qui se voyaient). */}
        <video ref={bgRef} className="vesper-intro-bg" src="/vesper-intro.mp4" muted playsInline preload="auto" aria-hidden="true" />
        <video ref={videoRef} src="/vesper-intro.mp4" playsInline preload="auto" aria-label="Introduction Vesper"
            onTimeUpdate={e => {
                const v = e.currentTarget;
                syncVideoBackground(v, bgRef.current);
                if (!active || !Number.isFinite(v.duration)) return;
                if (!prepared.current && v.currentTime >= HOME_PREPARE_AT_SECONDS) {
                    prepared.current = true;
                    onPrepareHome();
                }
                const remaining = Math.max(0, v.duration - v.currentTime);
                if (remaining <= HOME_FADE_SECONDS) {
                    const gain = remaining / HOME_FADE_SECONDS;
                    v.volume = gain * gain;
                    if (!reduceMotion) finish();
                }
            }}
            onEnded={finish}
            onError={active ? finish : undefined} />
    </div>;
}

export function IntroScreen({ onPrepareHome, onComplete }) {
    const [phase, setPhase] = useState('studio');
    const completed = useRef(false);
    const studioVideo = useRef(null);
    const reduceMotion = useReducedMotion();
    const isPresent = useIsPresent();

    useEffect(() => {
        const shuffleAudio = new Audio('/Sounds/shuffling.mp3');
        shuffleAudio.volume = 0.4;
        const playShuffle = () => shuffleAudio.play().catch(() => {});
        playShuffle();
        window.addEventListener('pointerdown', playShuffle, { once: true });
        return () => {
            window.removeEventListener('pointerdown', playShuffle);
            shuffleAudio.pause();
        };
    }, []);

    // Fin du logo Nyaru Studio : on passe à la vidéo Vesper
    const finishIntro = () => {
        if (completed.current) return;
        completed.current = true;
        setPhase('vesper');
    };

    return (
        <Motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : HOME_FADE_SECONDS, ease: [0.42, 0, 0.22, 1] }}
            data-leaving={isPresent ? undefined : ''}
            className="studio-intro fixed inset-0 z-[99999] flex items-center justify-center bg-black overflow-hidden"
        >
            <VesperIntro active={phase === 'vesper'} reduceMotion={reduceMotion} onPrepareHome={onPrepareHome} onDone={onComplete} />
            <div className="studio-intro-layer" style={{ opacity: phase === 'studio' ? 1 : 0 }}>
                <StudioBackdrop videoRef={studioVideo} active={phase === 'studio'} />
                <video
                    ref={studioVideo}
                    src={STUDIO_VIDEO}
                    autoPlay muted playsInline preload="auto"
                    className="studio-intro-video" aria-label="Introduction Nyaru Studio"
                    onEnded={finishIntro}
                    onError={finishIntro}
                />
            </div>
        </Motion.div>
    );
}
