import { useEffect, useRef, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { HelpCircle, Trophy, ChevronRight, Gem, Skull } from 'lucide-react';
import { useFeedback } from '../../hooks/useFeedback';
import { getChestRevelations } from '../../lib/chestRevelation';
import '../../styles/ChestRevelation.css';

function ChestReveal({ chest, index, total, onNext }) {
    const [phase, setPhase] = useState('waiting');
    const advanced = useRef(false);
    const feedback = useFeedback();
    const sounds = useRef(feedback);
    useEffect(() => { sounds.current = feedback; }, [feedback]);
    useEffect(() => {
        const flip = setTimeout(() => {
            setPhase('flipping');
            sounds.current.playCardFlip();
        }, 450);
        const reveal = setTimeout(() => {
            setPhase('revealed');
            if (chest.result < 0) sounds.current.playVictory();
            else sounds.current.playCardPlace();
        }, 1100);
        return () => { clearTimeout(flip); clearTimeout(reveal); };
    }, [chest.result]);
    const treasure = chest.result < 0;
    const Icon = treasure ? Gem : Skull;
    const ready = phase === 'revealed';
    const next = () => {
        if (!ready || advanced.current) return;
        advanced.current = true;
        onNext();
    };
    return (
        <div className={`chest-reveal ${treasure ? 'chest-reveal--treasure' : 'chest-reveal--trap'}`} role="dialog" aria-modal="true" aria-label="Révélation Mystère">
            <div className="chest-reveal-content">
                <header>
                    <div className="chest-reveal-eyebrow"><HelpCircle size={14} /> RÉVÉLATION MYSTÈRE</div>
                    <h2>{chest.playerName}</h2>
                    <p>Carte {index + 1} / {total}</p>
                </header>
                <div className="chest-reveal-stage">
                    <Motion.div className="chest-reveal-flipper" initial={{ rotateY: 0 }}
                        animate={{ rotateY: phase === 'waiting' ? 0 : 180 }}
                        transition={{ duration: .65, ease: [.4, 0, .2, 1] }}>
                        <div className="chest-reveal-front" aria-hidden={phase !== 'waiting'}>
                            <img src="/card-chest.png" alt="Carte Mystère" />
                        </div>
                        <div className="chest-reveal-result" aria-hidden={!ready}>
                            <div className="chest-reveal-art" />
                            <div className="chest-reveal-art-shade" />
                            <span className="chest-reveal-rarity">✦ MYSTÈRE ✦</span>
                            <span className="chest-reveal-corner" aria-hidden="true">{treasure ? '−15' : '+15'}</span>
                            <div className="chest-reveal-emblem"><Icon strokeWidth={1.5} /></div>
                            <span className="chest-reveal-title">{treasure ? 'TRÉSOR' : 'PIÈGE'}</span>
                            <strong>{treasure ? '−15' : '+15'}</strong>
                            <span className="chest-reveal-points">POINTS</span>
                            <div className="chest-reveal-rule" />
                            <p>{treasure ? '15 points en moins · Avantage' : '15 points en plus · Pénalité'}</p>
                        </div>
                    </Motion.div>
                </div>
                <footer>
                    <button type="button" onClick={next} disabled={!ready}>
                        {index + 1 < total ? <ChevronRight size={20} /> : <Trophy size={20} />}
                        {ready ? (index + 1 < total ? 'Carte suivante' : 'Voir les scores') : 'Révélation…'}
                    </button>
                    <div className="chest-reveal-progress" aria-hidden="true">
                        {Array.from({ length: total }, (_, i) => <i key={i} className={i === index ? 'current' : i < index ? 'done' : ''} />)}
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default function ChestRevelationOverlay({ gameState, onComplete }) {
    const [index, setIndex] = useState(0);
    const chests = getChestRevelations(gameState);
    const chest = chests[index];
    useEffect(() => { if (!chest) onComplete(); }, [chest, onComplete]);
    if (!chest) return null;
    return <ChestReveal key={chest.id} chest={chest} index={index} total={chests.length}
        onNext={() => index + 1 < chests.length ? setIndex(i => i + 1) : onComplete()} />;
}
