import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Activity, CloudFog, Shield, Skull, Snowflake, Tornado, X, Flame } from 'lucide-react';
import { FURY_TYPES, FURY_USES_PER_ROUND, FURY_ORDER as FURY_ORDER_UI } from '../../lib/furyEngine';
import '../../styles/Fury.css';

const FURY_ICONS = { quake: Activity, curse: Skull, fog: CloudFog, tornado: Tornado, freeze: Snowflake, shield: Shield };

const flames = used => Array.from({ length: FURY_USES_PER_ROUND }, (_, i) => <Flame key={i} size={12} className={i < FURY_USES_PER_ROUND - used ? 'is-on' : ''} aria-hidden="true" />);

// Réserve Fury du joueur (sous la dalle) + état de l'adversaire (au-dessus).
export function FuryRail({ part, me, opponent, opponentName, canPlay, selected, onSelect }) {
    const reserve = me?.fury?.reserve || [];
    if (part === 'opponent') return <div className="fury-opponent" aria-label={`Fury de ${opponentName}`}>
            <span className="fury-flames" aria-label={`${FURY_USES_PER_ROUND - (opponent?.fury?.used || 0)} Fury restantes`}>{flames(opponent?.fury?.used || 0)}</span>
            <span>{opponentName} · {opponent?.fury?.reserve?.length || 0} en réserve</span>
            {opponent?.fury?.shield && <span className="fury-shield-chip"><Shield size={12} aria-hidden="true" />Bouclier</span>}
        </div>;
    return <div className="fury-rail" aria-label="Votre réserve Fury">
            <span className="fury-flames" aria-label={`${FURY_USES_PER_ROUND - (me?.fury?.used || 0)} Fury restantes cette manche`}>{flames(me?.fury?.used || 0)}</span>
            {reserve.length === 0 && <span className="fury-rail-empty">Piochez pour trouver des cartes Fury</span>}
            {reserve.map((card, i) => {
                return <button key={card.id} type="button" disabled={!canPlay} onClick={() => onSelect(i)}
                    className={`fury-chip-card${selected === i ? ' is-selected' : ''}`} aria-pressed={selected === i}
                    aria-label={`${FURY_TYPES[card.furyType].title} : ${FURY_TYPES[card.furyType].text}`}>
                    <FuryCard type={card.furyType} size="mini" />
                </button>;
            })}
            {me?.fury?.shield && <span className="fury-shield-chip"><Shield size={12} aria-hidden="true" />Protégé</span>}
        </div>;
}

// Bandeau de ciblage : consigne, et bouton « Lancer » pour les cartes sans cible précise.
export function FuryTargetBanner({ type, onPlay, onCancel }) {
    if (!type) return null;
    const info = FURY_TYPES[type];
    const Icon = FURY_ICONS[type];
    const hint = info.target === 'column' ? 'Touchez une colonne adverse' : info.target === 'card' ? 'Touchez une carte adverse' : info.target === 'self' ? 'Protège votre plateau' : 'Vise le plateau adverse';
    const direct = info.target === 'player' || info.target === 'self';
    return <div className="fury-target" role="status" aria-live="polite">
        <span className="fury-target-icon" aria-hidden="true"><Icon size={18} /></span>
        <span className="fury-target-copy"><strong>{info.title}</strong><small>{hint}</small></span>
        {direct && <button type="button" className="fury-target-play" onClick={onPlay}>Lancer</button>}
        <button type="button" className="fury-target-cancel" onClick={onCancel} aria-label="Annuler"><X size={16} aria-hidden="true" /></button>
    </div>;
}

// Effets : onomatopée façon BD, secousse du plateau visé, et annonce des Fury piochées.
export function FuryEffects({ lastFury, lastGain, myIndex, names }) {
    const reduce = useReducedMotion();
    const [shown, setShown] = useState(null);
    const [gain, setGain] = useState(null);
    useEffect(() => {
        if (!lastFury?.at) return undefined;
        const t0 = setTimeout(() => setShown(lastFury), 0);
        const target = lastFury.targetIndex === myIndex ? '.skyjo-hand:not(.skyjo-hand--opponent)' : '.skyjo-hand--opponent';
        const el = document.querySelector(target);
        if (el && !reduce && !lastFury.blocked && lastFury.type !== 'shield') { el.classList.remove('fury-shake'); void el.offsetWidth; el.classList.add('fury-shake'); }
        if (lastFury.targetIndex === myIndex && lastFury.type !== 'shield') { try { navigator.vibrate?.([40, 30, 60]); } catch { /* indisponible */ } }
        const t1 = setTimeout(() => setShown(null), 1700);
        return () => { clearTimeout(t0); clearTimeout(t1); };
    }, [lastFury, myIndex, reduce]);
    useEffect(() => {
        if (!lastGain?.at) return undefined;
        const t0 = setTimeout(() => setGain(lastGain), 0);
        const t1 = setTimeout(() => setGain(null), 1600);
        return () => { clearTimeout(t0); clearTimeout(t1); };
    }, [lastGain]);
    const word = shown ? (shown.blocked ? 'Bloqué !' : FURY_TYPES[shown.type].bubble) : '';
    const by = shown ? names[shown.by] : '';
    return createPortal(<div className="fury-fx-layer">
        <AnimatePresence>
            {shown && <Motion.div key={shown.at} className={`fury-boom fury-boom--${shown.blocked ? 'shield' : shown.type}`}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.2, rotate: -18 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, scale: [0.2, 1.25, 1], rotate: [-18, 8, -4] }}
                exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.45 }}>
                <svg viewBox="0 0 200 150" aria-hidden="true"><polygon points="100,4 118,40 160,14 148,56 196,58 156,82 190,118 140,106 128,146 100,112 72,146 60,106 10,118 44,82 4,58 52,56 40,14 82,40" /></svg>
                <span className="fury-boom-word">{word}</span>
                <span className="fury-boom-caption">{by} · {FURY_TYPES[shown.type].title}</span>
            </Motion.div>}
        </AnimatePresence>
        <AnimatePresence>
            {gain && <Motion.div key={gain.at} className="fury-gain" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <Flame size={16} aria-hidden="true" />
                {gain.by === myIndex ? 'Carte Fury : ' : `${names[gain.by]} récupère : `}{gain.cards.map(c => FURY_TYPES[c.furyType].title).join(', ')}
            </Motion.div>}
        </AnimatePresence>
        <span className="sr-only" role="status">{shown ? `${by} joue ${FURY_TYPES[shown.type].title}${shown.blocked ? ', bloqué par le bouclier' : ''}` : ''}</span>
    </div>, document.body);
}

// Ambiance du plateau Fury : braises qui montent, ciel rougi (classe sur le body).
const EMBERS = Array.from({ length: 18 }, (_, i) => ({ left: (i * 37) % 100, delay: (i * 0.73) % 7, dur: 6 + (i % 5), size: 2 + (i % 3) }));
export function FuryAmbience() {
    useEffect(() => {
        document.body.classList.add('fury-mode');
        return () => document.body.classList.remove('fury-mode');
    }, []);
    return createPortal(<div className="fury-embers" aria-hidden="true">
        {EMBERS.map((e, i) => <i key={i} style={{ left: `${e.left}%`, animationDelay: `${e.delay}s`, animationDuration: `${e.dur}s`, width: e.size, height: e.size }} />)}
    </div>, document.body);
}

// Carte Fury dessinée : fond de lave, liseré braise, pictogramme, nom (et effet en grand format).
export function FuryCard({ type, size = 'full' }) {
    const Icon = FURY_ICONS[type];
    const info = FURY_TYPES[type];
    return <span className={`fury-card fury-card--${size} fury-card--${type}`}>
        <span className="fury-card-corner" aria-hidden="true"><Flame size={size === 'mini' ? 8 : 10} /></span>
        <span className="fury-card-emblem" aria-hidden="true"><Icon size={size === 'mini' ? 18 : 26} strokeWidth={1.8} /></span>
        <span className="fury-card-title">{info.title}</span>
        {size === 'full' && <span className="fury-card-text">{info.text}</span>}
    </span>;
}

// Règles du mode Fury : au premier lancement, puis depuis la pause.
export function FuryRulesModal({ open, onClose, first = false }) {
    if (!open) return null;
    return createPortal(<div className="skyjo-pause fury-rules-layer" onClick={onClose}>
        <div className="skyjo-pause-panel fury-rules" role="dialog" aria-modal="true" aria-labelledby="fury-rules-title" onClick={e => e.stopPropagation()}>
            <span className="skyjo-pause-emblem fury-rules-emblem" aria-hidden="true"><Flame size={24} strokeWidth={1.8} /></span>
            <h2 id="fury-rules-title" className="fury-rules-title">Mode Fury</h2>
            <p className="skyjo-pause-text">Les règles du Skyjo, plus six cartes pour saboter le jeu adverse.</p>
            <ol className="fury-rules-steps">
                <li><b>1</b><span><strong>Piochez-les.</strong> Une carte Fury tirée de la pioche file dans votre réserve (3 au plus), puis vous piochez normalement.</span></li>
                <li><b>2</b><span><strong>Jouez-les à la place de piocher.</strong> Touchez la carte, puis la cible chez l’adversaire. Votre tour s’arrête là.</span></li>
                <li><b>3</b><span><strong>Trois par manche.</strong> Les flammes indiquent ce qu’il vous reste. Le Bouclier annule la prochaine attaque reçue.</span></li>
            </ol>
            <div className="fury-rules-grid">{FURY_ORDER_UI.map(type => <FuryCard key={type} type={type} />)}</div>
            <button type="button" className="skyjo-pause-resume" onClick={onClose}>{first ? 'Au combat' : 'Compris'}</button>
        </div>
    </div>, document.body);
}
