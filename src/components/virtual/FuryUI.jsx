import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, X, Flame } from 'lucide-react';
import { FURY_TYPES, FURY_USES_PER_ROUND, FURY_RESERVE_MAX, FURY_ORDER as FURY_ORDER_UI, hasShield } from '../../lib/furyEngine';
import '../../styles/Fury.css';

const FURY_ART = {
    quake: {
        mark: 'M2 16l5-5 3 3 4-7 8 9M2 19h7l2-3 2 3h9M12 3l-2 3 2 2',
        engraving: 'M2 42l12-9 10 4 12-15 12 10 13-16 17 13M5 48l18-5 8 3 9-7 15 8 22-6M25 15l-4-8m36 6 5-9',
    },
    curse: {
        mark: 'M3 11q9-11 18 0-9 11-18 0Zm9-4 2 4-2 4-2-4ZM12 1v3m0 14v4M5 3l2 2m10 0 2-2',
        engraving: 'M2 31q38-36 76 0M5 38q35 25 70 0M9 11l6 8m50 0 6-8M29 49l11 5 11-5',
    },
    fog: {
        mark: 'M3 9c2-3 5-3 7-1 2-5 8-5 11 0M2 13q4-2 8 0t8 0h4M4 17h5q3 0 5 2t6 0',
        engraving: 'M0 18Q11 7 22 14T48 15T80 7M0 29q11-6 24-1t27 0 29 2M6 45q14-13 25-4t43-2',
    },
    tornado: {
        mark: 'M21 5C12 0 2 5 3 8c1 3 15 0 16 3 1 3-12 3-12 6 0 2 6 1 7 3M3 3l3 1m12 12 3-1',
        engraving: 'M2 21Q20 5 45 11T78 16M7 39q14 5 28 0t38-8M17 48q18-5 31-1l18 5',
    },
    freeze: {
        mark: 'M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 3 3-3m-6 16 3-3 3 3M3 10l4-1-1-4m12 14-1-4 4-1m-18 0 4 1-1 4m12-14-1 4 4 1',
        engraving: 'M6 30l9-13 9 13-9 14Zm50 0 9-13 9 13-9 14ZM22 6l6 6-6 6-6-6Zm36 0 6 6-6 6-6-6ZM10 51l8-5m44 0 8 5',
    },
    shield: {
        mark: 'M12 2c3 2 6 3 9 3v5c0 6-4 9-9 12-5-3-9-6-9-12V5c3 0 6-1 9-3ZM12 7l1.3 3.7L17 12l-3.7 1.3L12 17l-1.3-3.7L7 12l3.7-1.3Z',
        engraving: 'M3 12q37-21 74 0M5 21q5 22 35 32 30-10 35-32M12 25q7 14 17 17m22 0q10-3 17-17',
    },
};

function FuryMark({ type, size = 24, className }) {
    return <svg className={className} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={FURY_ART[type].mark} />
    </svg>;
}

const plural = n => (n > 1 ? 's' : '');
const NOTICE_MS = 2500;

// Rails Fury, de part et d'autre de la pioche : l'adversaire à gauche, vous à droite.
// Trois emplacements (la réserve), les Fury restantes de la manche en points, et une consigne courte.
const Slots = ({ children, count }) => <>{children}{Array.from({ length: Math.max(0, FURY_RESERVE_MAX - count) }, (_, i) => <span key={`empty-${i}`} className="fury-slot-empty" aria-hidden="true" />)}</>;
const Uses = ({ left }) => <span className="fury-rail-uses" aria-hidden="true">{Array.from({ length: FURY_USES_PER_ROUND }, (_, i) => <i key={i} className={i < left ? 'is-on' : ''} />)}</span>;

export function FuryRail({ part, me, opponent, opponentName, canPlay, selected, onSelect, finalRound = false }) {
    if (part === 'opponent') {
        const reserve = opponent?.fury?.reserve || [];
        const left = Math.max(0, FURY_USES_PER_ROUND - (opponent?.fury?.used || 0));
        const shielded = hasShield(opponent?.fury);
        const who = opponentName === 'IA' ? 'l’IA' : opponentName;
        const status = `Fury de ${who} : ${reserve.length ? `${reserve.length} carte${plural(reserve.length)}` : 'aucune carte'}${shielded ? ', protégée par un Bouclier' : ''}, encore ${left} jouable${plural(left)} cette manche`;
        return <aside className={`fury-rail fury-rail--opp${shielded ? ' is-shielded' : ''}`} aria-label={status} title={status}>
            <span className="fury-rail-label"><small>Fury</small>{opponentName}</span>
            <div className="fury-rail-slots">
                <Slots count={reserve.length}>{reserve.map(card => <span key={card.id} className="fury-rail-card" title={`${FURY_TYPES[card.furyType].title} : ${FURY_TYPES[card.furyType].text}`}><FuryCard type={card.furyType} size="mini" iconOnly /></span>)}</Slots>
            </div>
            <Uses left={left} />
        </aside>;
    }
    const reserve = me?.fury?.reserve || [];
    const left = Math.max(0, FURY_USES_PER_ROUND - (me?.fury?.used || 0));
    const attacks = reserve.filter(c => c.furyType !== 'shield').length;
    const exhausted = left === 0;
    const shielded = hasShield(me?.fury);
    const ready = canPlay && attacks > 0 && !exhausted && !finalRound;
    const [hint, status] = finalRound ? ['Dernier tour', 'Dernier tour : plus de Fury jouable']
        : exhausted ? [FURY_USES_PER_ROUND + '/' + FURY_USES_PER_ROUND + ' jouées',
            FURY_USES_PER_ROUND + ' Fury jouées. Les attaques seront de nouveau disponibles à la prochaine manche.' + (shielded ? ' Votre Bouclier reste actif.' : '')]
        : reserve.length === 0 ? [null, 'Réserve vide. Les cartes Fury se trouvent dans la pioche.']
        : attacks === 0 ? ['Protégé', 'Votre Bouclier bloquera tout seul la prochaine attaque']
        : ready ? ['Touchez', `Touchez une Fury à la place de piocher (encore ${left} cette manche)`]
        : ['Votre tour', `Jouables au début de votre tour (encore ${left} cette manche)`];
    return <aside className={`fury-rail fury-rail--me${ready ? ' is-ready' : ''}${shielded ? ' is-shielded' : ''}`} aria-label={`Vos cartes Fury. ${status}`} title={status}>
        <span className="fury-rail-label"><small>Fury</small>Vous</span>
        <div className="fury-rail-slots">
            <Slots count={reserve.length}>{reserve.map((card, i) => card.furyType === 'shield'
                ? <span key={card.id} className="fury-rail-card fury-chip-card--passive" title="Le Bouclier se déclenche tout seul quand on vous attaque" aria-label="Bouclier : bloque tout seul la prochaine Fury reçue"><FuryCard type="shield" size="mini" iconOnly /></span>
                : <button key={card.id} type="button" disabled={!canPlay} onClick={() => onSelect(i)}
                    className={`fury-rail-card fury-chip-card${selected === i ? ' is-selected' : ''}`} aria-pressed={selected === i}
                    aria-label={`${FURY_TYPES[card.furyType].title} : ${FURY_TYPES[card.furyType].text}`}>
                    <FuryCard type={card.furyType} size="mini" iconOnly />
                </button>)}</Slots>
        </div>
        <Uses left={left} />
        <span className={'fury-rail-hint' + (exhausted && !finalRound ? ' fury-rail-hint--exhausted' : '')} aria-hidden={!hint}>{hint}</span>
    </aside>;
}

// Bandeau de ciblage : consigne, et bouton « Lancer » pour les cartes sans cible précise.
export function FuryTargetBanner({ type, onPlay, onCancel }) {
    if (!type) return null;
    const info = FURY_TYPES[type];
    const hint = info.target === 'column' ? 'Touchez une colonne adverse' : info.target === 'card' ? 'Touchez une carte adverse retournée' : null;
    const direct = info.target === 'player' || info.target === 'self';
    // Chaque carte Fury a sa couleur et son emblème en filigrane
    return <div className={`fury-target fury-target--${type}`} role="status" aria-live="polite">
        <FuryMark type={type} className="fury-target-watermark" />
        <button type="button" className="fury-target-cancel" onClick={onCancel} aria-label="Annuler"><X size={15} strokeWidth={2.4} aria-hidden="true" /></button>
        <div className="fury-target-head">
            <span className="fury-target-icon" aria-hidden="true"><FuryMark type={type} size={20} /></span>
            <strong className="fury-target-title">{info.title}</strong>
        </div>
        {hint && <p className="fury-target-hint">{hint}</p>}
        {direct && <button type="button" className="fury-target-play" onClick={onPlay}><FuryMark type={type} size={19} />Lancer</button>}
    </div>;
}

function furyResult(event) {
    if (event.blocked) return 'Bouclier utilisé contre ' + FURY_TYPES[event.type].title;
    if (event.type === 'quake') return 'Colonne ' + (event.column + 1) + ' remise à zéro';
    if (event.type === 'freeze') return 'Colonne ' + (event.column + 1) + ' gelée pendant 2 tours';
    if (event.type === 'curse') return '+13 verrouillé pendant 3 tours';
    if (event.type === 'fog') {
        const count = event.cards.length;
        return count === 0 ? 'Aucune carte à recacher' : count === 1 ? '1 carte recachée' : count + ' cartes recachées';
    }
    if (event.type === 'tornado') return 'Cartes mélangées';
    return 'La prochaine attaque est bloquée';
}

function getImpactTargets(event, playerId) {
    if (playerId == null) return [];
    if (event.blocked || event.type === 'shield' || event.type === 'tornado') {
        const board = document.getElementById('fury-board-' + playerId);
        return board ? [board] : [];
    }
    return event.cards.map(index => document.getElementById('card-' + playerId + '-' + index)).filter(Boolean);
}

export function FuryEffects({ lastFury, lastGain, myIndex, players }) {
    const reduce = useReducedMotion();
    const [shown, setShown] = useState(null);
    const [gain, setGain] = useState(null);
    // Les objets sont recréés au fil des messages en ligne. Une annonce se joue une seule fois.
    const [furyEvent, setFuryEvent] = useState(null);
    const [gainEvent, setGainEvent] = useState(null);
    if (lastFury?.at && lastFury.at !== furyEvent?.at) setFuryEvent(lastFury);
    if (lastGain?.at && lastGain.at !== gainEvent?.at) setGainEvent(lastGain);
    const [past] = useState(() => ({ fury: lastFury?.at, gain: lastGain?.at }));
    const targetPlayerId = players[furyEvent?.targetIndex]?.id;

    useEffect(() => {
        if (!furyEvent?.at || furyEvent.at === past.fury) return undefined;
        const enter = setTimeout(() => {
            setShown({ event: furyEvent, targets: getImpactTargets(furyEvent, targetPlayerId) });
            if (furyEvent.targetIndex === myIndex && furyEvent.type !== 'shield') navigator.vibrate?.([40, 30, 60]);
        }, 0);
        const leave = setTimeout(() => setShown(null), NOTICE_MS);
        return () => { clearTimeout(enter); clearTimeout(leave); };
    }, [furyEvent, myIndex, past, targetPlayerId]);

    useEffect(() => {
        if (!gainEvent?.at || gainEvent.at === past.gain) return undefined;
        if (gainEvent.by === myIndex) { navigator.vibrate?.([30, 40, 30]); return undefined; }
        const enter = setTimeout(() => setGain(gainEvent), 0);
        const leave = setTimeout(() => setGain(null), 2400);
        return () => { clearTimeout(enter); clearTimeout(leave); };
    }, [gainEvent, myIndex, past]);

    const name = index => index === myIndex ? 'Vous' : players[index]?.name === 'IA' ? 'L’IA' : players[index]?.name || 'Adversaire';
    const event = shown?.event;
    const type = event?.blocked ? 'shield' : event?.type;
    const gainType = gain?.cards[0]?.furyType;
    const title = event && (event.blocked ? 'Attaque bloquée' : FURY_TYPES[event.type].title);
    const result = event && furyResult(event);

    return <>
        {shown?.targets.map((target, index) => createPortal(
            <span className={'fury-impact fury-impact--' + type + ' fury-card--' + type}
                style={{ '--impact-delay': (index * 75) + 'ms' }} aria-hidden="true">
                {index === Math.floor(shown.targets.length / 2) && (
                    <span className="fury-impact__seal"><FuryMark type={type} size={18} /></span>
                )}
            </span>,
            target, event.at + '-' + index,
        ))}
        <span className="sr-only" role="status" aria-atomic="true">
            {event && (name(event.by) + (event.by === myIndex ? ' jouez ' : ' joue ') + FURY_TYPES[event.type].title
                + (event.by !== event.targetIndex ? ' sur ' + name(event.targetIndex) : '') + '. ' + result)}
        </span>
        <AnimatePresence mode="wait">
            {event && <Motion.div key={event.at} className={'fury-play fury-card--' + type} aria-hidden="true"
                initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : .2 }}>
                <span className="fury-play__icon"><FuryMark type={type} size={25} /></span>
                <div className="fury-play__copy">
                    <small className="fury-play__route">
                        <span>{name(event.by)}</span>
                        {event.by !== event.targetIndex && <><ArrowRight size={11} /><span>{name(event.targetIndex)}</span></>}
                    </small>
                    <strong>{title}</strong>
                    <span>{result}</span>
                </div>
                {!reduce && <span className="fury-play__timer" style={{ animationDuration: NOTICE_MS + 'ms' }} />}
            </Motion.div>}
        </AnimatePresence>
        <AnimatePresence>
            {!event && gainType && gain.by !== myIndex && <Motion.div key={gain.at} className={'fury-gain fury-card--' + gainType} role="status"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <FuryMark type={gainType} size={19} />
                <span>{name(gain.by)} récupère {gain.cards.map(card => FURY_TYPES[card.furyType].title).join(', ')}</span>
            </Motion.div>}
        </AnimatePresence>
    </>;
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

const FURY_RULES_SUMMARIES = {
    quake: 'Remet une colonne adverse à zéro.',
    curse: 'Pose un +13 verrouillé 3 tours.',
    fog: 'Recache 2 cartes adverses.',
    tornado: 'Mélange les cartes adverses.',
    freeze: 'Gèle une colonne adverse 2 tours.',
    shield: 'Bloque d’office la prochaine Fury, puis disparaît.',
};

// Cartes de réserve et cartes détaillées utilisent le même sceau.
export function FuryCard({ type, size = 'full', iconOnly = false }) {
    const info = FURY_TYPES[type];
    const detailed = size !== 'mini';
    return <span className={`fury-card fury-card--${size} fury-card--${type}`}>
        {detailed && <svg className="fury-card-engraving" viewBox="0 0 80 54" fill="none" stroke="currentColor" strokeWidth=".8" strokeLinecap="round" aria-hidden="true">
            <path d={FURY_ART[type].engraving} />
        </svg>}
        <span className="fury-card-corner" aria-hidden="true"><Flame size={size === 'mini' ? 8 : 10} /></span>
        <span className="fury-card-emblem" aria-hidden="true"><FuryMark type={type} size={size === 'mini' ? 18 : 26} /></span>
        <span className={iconOnly ? 'sr-only' : 'fury-card-title'}>{info.title}</span>
        {detailed && <span className="fury-card-text">{size === 'rules' ? FURY_RULES_SUMMARIES[type] : info.text}</span>}
    </span>;
}

// Règles du mode Fury : au premier lancement, puis depuis la pause.
export function FuryRulesModal({ open, onClose, first = false }) {
    if (!open) return null;
    return createPortal(<div className="skyjo-pause fury-rules-layer" onClick={onClose}>
        <div className="skyjo-pause-panel fury-rules" role="dialog" aria-modal="true" aria-labelledby="fury-rules-title" onClick={e => e.stopPropagation()}>
            <div className="fury-rules-copy">
                <h2 id="fury-rules-title" className="fury-rules-title">
                    <Flame size={21} strokeWidth={1.8} aria-hidden="true" /> Mode Fury
                </h2>
                <ul className="fury-rules-steps">
                    <li><strong>Pioche.</strong> 12 Fury sont cachées dans la pioche. La Fury tirée va en réserve (3 max), puis vous repiochez.</li>
                    <li><strong>Attaque.</strong> Jouez une Fury au lieu de piocher et visez si besoin. Votre tour se termine. 3 par manche, jamais au dernier tour.</li>
                    <li><strong>Colonne.</strong> Trois cartes identiques retirées d’une colonne valent −3 points en fin de manche.</li>
                </ul>
            </div>
            <div className="fury-rules-grid" aria-label="Les six cartes Fury">{FURY_ORDER_UI.map(type => <FuryCard key={type} type={type} size="rules" />)}</div>
            <button type="button" className="skyjo-pause-resume" onClick={onClose}>{first ? 'Au combat' : 'Compris'}</button>
        </div>
    </div>, document.body);
}
