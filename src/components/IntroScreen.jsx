import { useEffect, useRef, useState } from 'react';
import { motion as Motion, useIsPresent, useReducedMotion } from 'framer-motion';

const HOME_FADE_SECONDS = 1.55;
const HOME_PREPARE_AT_SECONDS = 2;

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
                const bg = bgRef.current;
                if (bg && Math.abs(bg.currentTime - v.currentTime) > 0.3) bg.currentTime = v.currentTime;
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
    const canvasRef = useRef(null);
    const animationFrame = useRef(null);
    const reduceMotion = useReducedMotion();
    const isPresent = useIsPresent();
    const motionPreference = useRef(reduceMotion);

    useEffect(() => { motionPreference.current = reduceMotion; }, [reduceMotion]);

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
        // Calque intermédiaire : la vidéo réduite y est dessinée puis ses bords sont fondus en transparence,
        // pour que son fond bleuté ne forme pas de bande nette sur le noir de l'écran.
        const layer = document.createElement('canvas');
        layer.width = canvas.width;
        layer.height = canvas.height;
        const layerContext = layer.getContext('2d');
        layerContext.imageSmoothingEnabled = true;
        layerContext.imageSmoothingQuality = 'high';
        // Masque (aux dimensions de la vidéo) : bords fondus, sauf la bande du texte « Nyaru Studio »
        // dont les lettres touchent les bords de la vidéo et ne doivent pas être estompées.
        const W = canvas.width, H = canvas.height;
        const mask = document.createElement('canvas');
        mask.width = W;
        mask.height = H;
        const maskContext = mask.getContext('2d');
        const fadeX = W * 0.08, fadeY = H * 0.06;
        const horizontal = maskContext.createLinearGradient(0, 0, W, 0);
        horizontal.addColorStop(0, 'rgba(0,0,0,0)');
        horizontal.addColorStop(fadeX / W, '#000');
        horizontal.addColorStop(1 - fadeX / W, '#000');
        horizontal.addColorStop(1, 'rgba(0,0,0,0)');
        maskContext.fillStyle = horizontal;
        maskContext.fillRect(0, 0, W, H);
        maskContext.globalCompositeOperation = 'destination-in';
        const vertical = maskContext.createLinearGradient(0, 0, 0, H);
        vertical.addColorStop(0, 'rgba(0,0,0,0)');
        vertical.addColorStop(fadeY / H, '#000');
        vertical.addColorStop(1 - fadeY / H, '#000');
        vertical.addColorStop(1, 'rgba(0,0,0,0)');
        maskContext.fillStyle = vertical;
        maskContext.fillRect(0, 0, W, H);
        maskContext.globalCompositeOperation = 'source-over';
        const bandTop = H * 0.5, bandBottom = H * 0.64, ramp = H * 0.025;
        const band = maskContext.createLinearGradient(0, bandTop - ramp, 0, bandBottom + ramp);
        band.addColorStop(0, 'rgba(0,0,0,0)');
        band.addColorStop(ramp / (bandBottom - bandTop + 2 * ramp), '#000');
        band.addColorStop(1 - ramp / (bandBottom - bandTop + 2 * ramp), '#000');
        band.addColorStop(1, 'rgba(0,0,0,0)');
        maskContext.fillStyle = band;
        maskContext.fillRect(0, bandTop - ramp, W, bandBottom - bandTop + 2 * ramp);
        let elapsed = video.currentTime;
        let previousTime;
        const draw = (now) => {
            const delta = previousTime === undefined ? 0 : (now - previousTime) / 1000;
            previousTime = now;
            if (!video.paused && video.readyState >= 3 && !video.seeking) elapsed += delta;
            const progress = Math.min(1, elapsed / Math.max(1, video.duration - 2));
            const phase = progress < 0.48 ? progress / 0.48 : Math.min(1, (progress - 0.48) / 0.44);
            const eased = (1 - Math.cos(Math.PI * phase)) / 2;
            // Le texte « Nyaru Studio » occupe déjà toute la largeur de la vidéo : on la réduit légèrement
            // (léger travelling 84 % → 90 % → 87 %) pour laisser de la marge sur les côtés ; le fond noir étoilé se fond dans l'écran noir.
            const scale = motionPreference.current ? 0.87 : progress < 0.48 ? 0.84 + 0.06 * eased : 0.9 - 0.03 * eased;
            const width = canvas.width * scale;
            const height = canvas.height * scale;
            if (video.readyState >= 2) {
                const x = (canvas.width - width) * 0.5;
                const y = (canvas.height - height) * 0.43;
                layerContext.globalCompositeOperation = 'source-over';
                layerContext.clearRect(0, 0, layer.width, layer.height);
                layerContext.drawImage(video, x, y, width, height);
                layerContext.globalCompositeOperation = 'destination-in';
                layerContext.drawImage(mask, x, y, width, height);
                context.fillStyle = '#000';
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.drawImage(layer, 0, 0);
            }
            animationFrame.current = requestAnimationFrame(draw);
        };
        animationFrame.current = requestAnimationFrame(draw);
    };

    // Fin du logo Nyaru Studio : on passe à la vidéo Vesper
    const finishIntro = () => {
        if (completed.current) return;
        completed.current = true;
        setPhase('vesper');
        // Laisse le fondu Nyaru → Vesper se terminer avant d'arrêter le dessin du logo
        setTimeout(() => cancelAnimationFrame(animationFrame.current), 1100);
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
            </div>
        </Motion.div>
    );
}
