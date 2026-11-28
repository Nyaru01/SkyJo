import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion';
import { getAvatarPath, handleAvatarError } from '../../lib/avatars';
import { useFeedback } from '../../hooks/useFeedback';
import { useOnlineGameStore } from '../../store/onlineGameStore';
import { FuryIcon, TourmentIcon } from './ModeIcons';
import '../../styles/OnlineStartCountdown.css';

const SECONDS = [3, 2, 1];

export default function OnlineStartCountdown({ active, onComplete }) {
    const [step, setStep] = useState(3);
    const players = useOnlineGameStore(state => state.players);
    const mode = useOnlineGameStore(state => state.gameMode);
    const { playStart } = useFeedback();
    const reducedMotion = useReducedMotion();

    useEffect(() => {
        if (!active) return;

        playStart();
        const timers = [2, 1, 0].map((value, index) =>
            setTimeout(() => setStep(value), (index + 1) * 1000)
        );
        timers.push(setTimeout(onComplete, 4000));

        return () => {
            timers.forEach(clearTimeout);
            setStep(3);
        };
    }, [active, onComplete, playStart]);

    const fury = mode === 'fury';
    const ModeIcon = fury ? FuryIcon : TourmentIcon;
    const started = step === 0;

    return createPortal(
        <AnimatePresence>
            {active && (
                <Motion.div
                    className={`online-start${fury ? ' online-start--fury' : ''}`}
                    initial={{ opacity: reducedMotion ? 1 : 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reducedMotion ? 0 : 0.32, ease: 'easeOut' }}
                >
                    <div className="online-start__content">
                        {mode && <div className="online-start__mode"><ModeIcon width={20} height={20} />{fury ? 'Fury' : 'Tourment'}</div>}

                        <div className="online-start__dial">
                            <div className="online-start__rings" aria-hidden="true" />
                            <span key={step} className={started ? 'online-start__go' : 'online-start__number'} aria-hidden="true">
                                {started ? 'En jeu' : step}
                            </span>
                        </div>

                        <div className="online-start__progress" aria-hidden="true">
                            {SECONDS.map(second => <span key={second} data-state={step < second ? 'done' : step === second ? 'current' : 'next'} />)}
                        </div>

                        <ul className={`online-start__players${players.length > 2 ? ' online-start__players--group' : ''}`} aria-label="Joueurs">
                            {players.map(player => <li key={player.id}>
                                <img src={getAvatarPath(player.emoji)} alt="" onError={handleAvatarError} />
                                <span title={player.name}>{player.name}</span>
                            </li>)}
                        </ul>
                        <span className="sr-only" role="status" aria-atomic="true">
                            {started ? 'La partie commence' : `Début de la partie dans ${step} seconde${step === 1 ? '' : 's'}`}
                        </span>
                    </div>
                </Motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}