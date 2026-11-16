import { lazy, Suspense, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Activity, CloudFog, Shield, Skull, Snowflake, Tornado, X, Flame } from 'lucide-react';
import { FURY_TYPES, FURY_USES_PER_ROUND, FURY_RESERVE_MAX, FURY_ORDER as FURY_ORDER_UI, hasShield } from '../../lib/furyEngine';
import '../../styles/Fury.css';

const FURY_ICONS = { quake: Activity, curse: Skull, fog: CloudFog, tornado: Tornado, freeze: Snowflake, shield: Shield };

const plural = n => (n > 1 ? 's' : '');
// Durée du bandeau de Fury reçue.
const NOTICE_MS = 2500;
// Effets three.js, chargés seulement quand une Fury est jouée.
const FuryFX3D = lazy(() => import('./FuryFX3D'));

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
                <Slots count={reserve.length}>{reserve.map(card => <span key={card.id} className="fury-rail-card" title={`${FURY_TYPES[card.furyType].title} : ${FURY_TYPES[card.furyType].text}`}><FuryCard type={card.furyType} size="mini" /></span>)}</Slots>
            </div>
            <Uses left={left} />
        </aside>;
    }
    const reserve = me?.fury?.reserve || [];
    const left = Math.max(0, FURY_USES_PER_ROUND - (me?.fury?.used || 0));
    const attacks = reserve.filter(c => c.furyType !== 'shield').length;
    const ready = canPlay && attacks > 0 && left > 0 && !finalRound;
    const [hint, status] = reserve.length === 0 ? ['Piochez', 'Les Fury sont cachées dans la pioche : piochez pour en gagner']
        : finalRound ? ['Dernier tour', 'Dernier tour : plus de Fury jouable']
        : attacks === 0 ? ['Protégé', 'Votre Bouclier bloquera tout seul la prochaine attaque']
        : left <= 0 ? ['Limite', `Limite atteinte : ${FURY_USES_PER_ROUND} Fury jouées cette manche`]
        : ready ? ['Touchez', `Touchez une Fury à la place de piocher (encore ${left} cette manche)`]
        : ['Votre tour', `Jouables au début de votre tour (encore ${left} cette manche)`];
    return <aside className={`fury-rail fury-rail--me${ready ? ' is-ready' : ''}${hasShield(me?.fury) ? ' is-shielded' : ''}`} aria-label={`Vos cartes Fury. ${status}`} title={status}>
        <span className="fury-rail-label"><small>Fury</small>Vous</span>
        <div className="fury-rail-slots">
            <Slots count={reserve.length}>{reserve.map((card, i) => card.furyType === 'shield'
                ? <span key={card.id} className="fury-rail-card fury-chip-card--passive" title="Le Bouclier se déclenche tout seul quand on vous attaque" aria-label="Bouclier : bloque tout seul la prochaine Fury reçue"><FuryCard type="shield" size="mini" /></span>
                : <button key={card.id} type="button" disabled={!canPlay} onClick={() => onSelect(i)}
                    className={`fury-rail-card fury-chip-card${selected === i ? ' is-selected' : ''}`} aria-pressed={selected === i}
                    aria-label={`${FURY_TYPES[card.furyType].title} : ${FURY_TYPES[card.furyType].text}`}>
                    <FuryCard type={card.furyType} size="mini" />
                </button>)}</Slots>
        </div>
        <Uses left={left} />
        <span className="fury-rail-hint">{hint}</span>
    </aside>;
}

// Bandeau de ciblage : consigne, et bouton « Lancer » pour les cartes sans cible précise.
export function FuryTargetBanner({ type, onPlay, onCancel }) {
    if (!type) return null;
    const info = FURY_TYPES[type];
    const Icon = FURY_ICONS[type];
    const hint = info.target === 'column' ? 'Touchez une colonne adverse' : info.target === 'card' ? 'Touchez une carte adverse retournée' : null;
    const direct = info.target === 'player' || info.target === 'self';
    // Chaque carte Fury a sa couleur et son emblème en filigrane
    return <div className={`fury-target fury-target--${type}`} role="status" aria-live="polite">
        <Icon className="fury-target-watermark" aria-hidden="true" />
        <button type="button" className="fury-target-cancel" onClick={onCancel} aria-label="Annuler"><X size={15} strokeWidth={2.4} aria-hidden="true" /></button>
        <div className="fury-target-head">
            <span className="fury-target-icon" aria-hidden="true"><Icon size={20} /></span>
            <strong className="fury-target-title">{info.title}</strong>
        </div>
        {hint && <p className="fury-target-hint">{hint}</p>}
        {direct && <button type="button" className="fury-target-play" onClick={onPlay}><Icon size={19} aria-hidden="true" />Lancer</button>}
    </div>;
}

// Ce que la Fury adverse vient de vous faire, en clair.
function furyExplain(f, byName) {
    const col = f.column !== undefined ? `n° ${f.column + 1}` : '';
    if (f.type === 'shield') return `${byName === 'IA' ? 'L’IA' : byName} se protège : votre prochaine Fury contre lui sera annulée.`;
    if (f.blocked) return 'Votre Bouclier a encaissé l’attaque : il ne se passe rien, et le Bouclier disparaît.';
    if (f.type === 'quake') return `Votre colonne ${col} est remise à zéro : ses cartes repartent dans la pioche, remplacées par des cartes cachées.`;
    if (f.type === 'curse') return 'Une de vos cartes est remplacée par un +13, bloqué pendant 3 tours.';
    if (f.type === 'fog') return `${f.cards?.length || 2} de vos cartes retournées sont recachées.`;
    if (f.type === 'tornado') return 'Toutes vos cartes ont changé de place.';
    if (f.type === 'freeze') return `Votre colonne ${col} est gelée 2 tours : impossible d’y remplacer une carte.`;
    return FURY_TYPES[f.type].text;
}

// Effets : onomatopée façon BD, secousse du plateau visé, et annonce des Fury piochées.
export function FuryEffects({ lastFury, lastGain, myIndex, names }) {
    const reduce = useReducedMotion();
    const [shown, setShown] = useState(null);
    const [gain, setGain] = useState(null);
    const [announce, setAnnounce] = useState(null);
    const [boardFx, setBoardFx] = useState(null);
    // En ligne, chaque mise à jour du serveur recrée ces objets : on ne rejoue un effet que pour un nouvel événement (nouvel « at »).
    const [furyEvent, setFuryEvent] = useState(null);
    const [gainEvent, setGainEvent] = useState(null);
    if (lastFury?.at && lastFury.at !== furyEvent?.at) setFuryEvent(lastFury);
    if (lastGain?.at && lastGain.at !== gainEvent?.at) setGainEvent(lastGain);
    // Événements déjà là à l'affichage (reprise d'une partie, retour de pause) : déjà vus, on ne les rejoue pas.
    const [past] = useState(() => ({ fury: lastFury?.at, gain: lastGain?.at }));
    useEffect(() => {
        if (!furyEvent?.at || furyEvent.at === past.fury) return undefined;
        const t0 = setTimeout(() => setShown(furyEvent), 0);
        const target = furyEvent.targetIndex === myIndex ? '.skyjo-hand:not(.skyjo-hand--opponent)' : '.skyjo-hand--opponent';
        const el = document.querySelector(target);
        if (el && !reduce && !furyEvent.blocked && furyEvent.type !== 'shield') { el.classList.remove('fury-shake'); void el.offsetWidth; el.classList.add('fury-shake'); }
        if (furyEvent.targetIndex === myIndex && furyEvent.type !== 'shield') { try { navigator.vibrate?.([40, 30, 60]); } catch { /* indisponible */ } }
        // Fury adverse : après l’onomatopée, un bandeau compact dit ce qu’on a reçu, puis s’efface seul.
        const theirs = furyEvent.by !== myIndex;
        const t1 = setTimeout(() => setShown(null), theirs ? 1000 : 1700);
        // Le bandeau se pose au milieu de la zone Pioche / Défausse (position mesurée à l'affichage).
        const t2 = theirs ? setTimeout(() => {
            const pile = document.querySelector('.skyjo-pile-zone')?.getBoundingClientRect();
            setAnnounce({ ...furyEvent, top: pile && pile.height ? Math.round(pile.top + pile.height / 2) : null });
        }, 900) : null;
        const t5 = theirs ? setTimeout(() => setAnnounce(cur => (cur?.at === furyEvent.at ? null : cur)), 900 + NOTICE_MS) : null;
        // Votre Fury : l'effet 3D éclate sur le plateau visé.
        let t3 = null, t4 = null;
        const zone = !theirs && !reduce ? document.querySelector(furyEvent.type === 'shield' ? '.skyjo-hand:not(.skyjo-hand--opponent)' : '.skyjo-hand--opponent') : null;
        if (zone) {
            const r = zone.getBoundingClientRect();
            t3 = setTimeout(() => setBoardFx({ type: furyEvent.blocked ? 'shield' : furyEvent.type, at: furyEvent.at, rect: { left: r.left - 30, top: r.top - 30, width: r.width + 60, height: r.height + 60 } }), 0);
            t4 = setTimeout(() => setBoardFx(null), 2500);
        }
        return () => { clearTimeout(t0); clearTimeout(t1); if (t2) clearTimeout(t2); if (t3) clearTimeout(t3); if (t4) clearTimeout(t4); if (t5) clearTimeout(t5); };
    }, [furyEvent, myIndex, reduce, past]);
    useEffect(() => {
        if (!gainEvent?.at || gainEvent.at === past.gain) return undefined;
        // Votre Fury s'affiche dans la fenêtre de pioche, à côté de la carte piochée (DrawDiscardPopup).
        if (gainEvent.by === myIndex) { try { navigator.vibrate?.([30, 40, 30]); } catch { /* indisponible */ } return undefined; }
        // Celle de l'adversaire : une annonce courte qui s'efface seule.
        const t0 = setTimeout(() => setGain(gainEvent), 0);
        const t1 = setTimeout(() => setGain(null), 2400);
        return () => { clearTimeout(t0); clearTimeout(t1); };
    }, [gainEvent, myIndex, past]);
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
            {announce && (() => {
                const fx = announce.blocked ? 'shield' : announce.type;
                const Icon = FURY_ICONS[fx];
                const byName = names[announce.by] === 'IA' ? 'l’IA' : names[announce.by];
                const where = announce.type === 'shield' ? 'Sur son plateau' : announce.blocked ? 'Attaque bloquée' : 'Sur votre plateau';
                // Bandeau compact : ce qu’on a reçu, sans fond plein écran ni bouton. Toucher le ferme plus tôt.
                return <Motion.button type="button" key={`announce-${announce.at}`} className={`fury-notice fury-card--${fx}`} role="status" aria-live="polite" style={announce.top ? { top: announce.top } : undefined}
                    aria-label={`Fury de ${byName} : ${FURY_TYPES[announce.type].title}. ${furyExplain(announce, names[announce.by])}`} onClick={() => setAnnounce(null)}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12, transition: { duration: 0.25 } }} transition={{ duration: 0.35, ease: [0.2, 0.8, 0.25, 1] }}>
                    <span className="fury-notice-card" aria-hidden="true"><FuryCard type={announce.type} size="mini" /></span>
                    <span className="fury-notice-copy">
                        <span className="fury-notice-kicker"><Flame size={11} aria-hidden="true" />Fury de {byName} · {FURY_TYPES[announce.type].title}</span>
                        <span className="fury-notice-text">{furyExplain(announce, names[announce.by])}</span>
                        <span className="fury-notice-where"><Icon size={11} aria-hidden="true" />{where}</span>
                    </span>
                    {!reduce && <span className="fury-notice-timer" style={{ animationDuration: `${NOTICE_MS}ms` }} aria-hidden="true" />}
                </Motion.button>;
            })()}
        </AnimatePresence>
        <AnimatePresence>
            {gain && gain.by !== myIndex && <Motion.div key={gain.at} className="fury-gain" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <Flame size={16} aria-hidden="true" />
                {gain.by === myIndex ? 'Carte Fury : ' : `${names[gain.by]} récupère : `}{gain.cards.map(c => FURY_TYPES[c.furyType].title).join(', ')}
            </Motion.div>}
        </AnimatePresence>
        {boardFx && !reduce && <div key={boardFx.at} className="fury-board-fx" style={boardFx.rect}>
            <Suspense fallback={null}><FuryFX3D type={boardFx.type} duration={2.3} /></Suspense>
        </div>}
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
            <p className="skyjo-pause-text">Les règles de Vesper, plus six cartes pour saboter le jeu adverse.</p>
            <ol className="fury-rules-steps">
                <li><b>1</b><span><strong>Piochez-les.</strong> 12 cartes Fury sont cachées dans la pioche. Celle que vous tirez file dans votre réserve (3 au plus), puis vous piochez normalement.</span></li>
                <li><b>2</b><span><strong>Jouez-les à la place de piocher.</strong> Touchez la carte, puis la cible chez l’adversaire. Votre tour s’arrête là.</span></li>
                <li><b>3</b><span><strong>Trois par manche, jamais au dernier tour.</strong> Une fois qu’un joueur a tout retourné, plus personne ne joue de Fury.</span></li>
                <li><b>4</b><span><strong>Le Bouclier se déclenche tout seul.</strong> Gardé dans votre réserve, il bloque la prochaine Fury reçue, puis disparaît.</span></li>
                <li><b>5</b><span><strong>Colonne nettoyée : −3 points.</strong> Trois cartes identiques dans une colonne disparaissent et vous rapportent −3 en fin de manche.</span></li>
            </ol>
            <div className="fury-rules-grid">{FURY_ORDER_UI.map(type => <FuryCard key={type} type={type} />)}</div>
            <button type="button" className="skyjo-pause-resume" onClick={onClose}>{first ? 'Au combat' : 'Compris'}</button>
        </div>
    </div>, document.body);
}
