import { useCallback, useEffect, useRef, useState } from 'react';
import { motion as Motion, useIsPresent, useReducedMotion } from 'framer-motion';

const HOME_FADE_SECONDS = 1.55;
const HOME_PREPARE_AT_SECONDS = 2;
const STUDIO_OUTRO_MS = 320;
const VESPER_FADE_IN_SECONDS = .55;
const STUDIO_VIDEO = '/nyaru-studio-intro-v2.mp4';

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
    const [hasStarted, setHasStarted] = useState(false);
    const videoRef = useRef(null);
    const bgRef = useRef(null);
    const done = useRef(false);
    const prepared = useRef(false);
    const finish = () => { if (done.current) return; done.current = true; onDone(); };
    useEffect(() => {
        const v = videoRef.current;
        if (!active || !v) return;
        const background = bgRef.current;
        let audioFrame;
        let cancelled = false;
        const fadeAudioIn = () => {
            if (cancelled || done.current || reduceMotion) return;
            const progress = Math.min(v.currentTime / VESPER_FADE_IN_SECONDS, 1);
            v.volume = progress * progress * (3 - 2 * progress);
            if (progress < 1) audioFrame = requestAnimationFrame(fadeAudioIn);
        };
        // Laisser un volume audible pendant la tentative : certains navigateurs
        // autorisent un volume nul, puis suspendent la vidéo si on le remonte.
        v.volume = 1;
        v.muted = false;
        v.play().then(fadeAudioIn, () => {
            if (cancelled || done.current) return;
            v.muted = true;
            v.play().catch(() => { if (!cancelled) finish(); });
        });
        background?.play().catch(() => {});
        return () => {
            cancelled = true;
            cancelAnimationFrame(audioFrame);
            v.pause();
            background?.pause();
        };
    }, [active, reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps
    const skip = () => {
        finish();
        videoRef.current?.pause();
        bgRef.current?.pause();
    };
    return <>
        <div className="vesper-intro" style={{ opacity: active && hasStarted ? 1 : 0 }} aria-hidden={!active || !hasStarted}>
            {/* Copie floutée et agrandie en fond : elle remplit le haut et le bas de l'écran avec les vraies couleurs
                de la vidéo, à chaque instant (au lieu de bandes de couleur fixe qui se voyaient). */}
            <video ref={bgRef} className="vesper-intro-bg" src="/vesper-intro.mp4" muted playsInline preload="auto" aria-hidden="true" />
            <video ref={videoRef} src="/vesper-intro.mp4" playsInline preload="auto" aria-label="Introduction Vesper"
                onPlaying={() => setHasStarted(true)}
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
                        if (!v.muted) v.volume = gain * gain;
                        if (!reduceMotion) finish();
                    }
                }}
                onEnded={finish}
                onError={active ? finish : undefined} />
        </div>
        {active && <button type="button" className="vesper-intro-skip" onClick={skip}>Passer la vidéo</button>}
    </>;
}

export function IntroScreen({ onPrepareHome, onComplete }) {
    const [phase, setPhase] = useState('studio');
    const completed = useRef(false);
    const studioVideo = useRef(null);
    const audioAttempt = useRef(0);
    const studioNeedsGesture = useRef(false);
    const reduceMotion = useReducedMotion();
    const isPresent = useIsPresent();

    const finishIntro = useCallback(() => {
        if (completed.current) return;
        completed.current = true;
        setPhase('bridge');
    }, []);

    useEffect(() => {
        if (phase !== 'bridge') return;
        const handoff = setTimeout(() => setPhase('vesper'), reduceMotion ? 0 : STUDIO_OUTRO_MS);
        return () => clearTimeout(handoff);
    }, [phase, reduceMotion]);

    const playStudioWithSound = useCallback(async () => {
        const video = studioVideo.current;
        if (!video || completed.current) return;
        const attempt = ++audioAttempt.current;
        studioNeedsGesture.current = false;
        video.muted = false;
        try {
            await video.play();
        } catch {
            if (attempt !== audioAttempt.current || completed.current) return;
            // Si le navigateur impose un geste, l'intro démarre en muet et peut être réactivée.
            video.muted = true;
            studioNeedsGesture.current = true;
            video.play().catch(() => {
                if (attempt === audioAttempt.current) finishIntro();
            });
        }
    }, [finishIntro]);

    useEffect(() => {
        const video = studioVideo.current;
        const resumeAudio = () => {
            if (studioNeedsGesture.current) playStudioWithSound();
        };
        const playbackFrame = requestAnimationFrame(playStudioWithSound);
        window.addEventListener('pointerup', resumeAudio);
        window.addEventListener('keydown', resumeAudio);
        return () => {
            cancelAnimationFrame(playbackFrame);
            window.removeEventListener('pointerup', resumeAudio);
            window.removeEventListener('keydown', resumeAudio);
            audioAttempt.current += 1;
            video?.pause();
        };
    }, [playStudioWithSound]);

    return (
        <Motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : HOME_FADE_SECONDS, ease: [0.42, 0, 0.22, 1] }}
            data-leaving={isPresent ? undefined : ''}
            className="studio-intro fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden"
            style={{ '--studio-outro-duration': `${STUDIO_OUTRO_MS}ms` }}
        >
            <VesperIntro active={phase === 'vesper'} reduceMotion={reduceMotion} onPrepareHome={onPrepareHome} onDone={onComplete} />
            <div className="studio-intro-layer" style={{ opacity: phase === 'studio' ? 1 : 0 }}>
                <StudioBackdrop videoRef={studioVideo} active={phase === 'studio'} />
                <video
                    ref={studioVideo}
                    src={STUDIO_VIDEO}
                    playsInline preload="auto"
                    className="studio-intro-video" aria-label="Introduction Nyaru Studio"
                    onEnded={finishIntro}
                    onError={finishIntro}
                />
            </div>
        </Motion.div>
    );
}
