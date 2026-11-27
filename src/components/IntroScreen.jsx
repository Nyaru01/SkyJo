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
                <video
                    src="/introv2.mp4"
                    autoPlay muted playsInline preload="auto"
                    className="studio-intro-video" aria-label="Introduction Nyaru Studio"
                    onTimeUpdate={(event) => {
                        const video = event.currentTarget;
                        if (Number.isFinite(video.duration) && video.duration > 3 && video.currentTime >= video.duration - (reduceMotion ? 1 : 2)) finishIntro();
                    }}
                    onEnded={finishIntro}
                    onError={finishIntro}
                />
            </div>
        </Motion.div>
    );
}
