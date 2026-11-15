import { lazy, Suspense, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Activity, CloudFog, Shield, Skull, Snowflake, Tornado, X, Flame } from 'lucide-react';
import { FURY_TYPES, FURY_USES_PER_ROUND, FURY_RESERVE_MAX, FURY_ORDER as FURY_ORDER_UI, hasShield } from '../../lib/furyEngine';
import '../../styles/Fury.css';

const FURY_ICONS = { quake: Activity, curse: Skull, fog: CloudFog, tornado: Tornado, freeze: Snowflake, shield: Shield };

const plural = n => (n > 1 ? 's' : '');
// Effets three.js, chargés seulement quand une Fury est jouée.
const FuryFX3D = lazy(() => import('./FuryFX3D'));

// Panneaux Fury écrits en clair : « Fury de l'IA » (au-dessus de la pioche) et « Vos cartes Fury » (en dessous).
export function FuryRail({ part, me, opponent, opponentName, canPlay, selected, onSelect, finalRound = false }) {
    if (part === 'opponent') {
        const reserve = opponent?.fury?.reserve || [];
        const left = FURY_USES_PER_ROUND - (opponent?.fury?.used || 0);
        const status = [
            reserve.length ? `${reserve.length} carte${plural(reserve.length)} en main` : 'Aucune carte pour l’instant',
            hasShield(opponent?.fury) ? 'protégée par un Bouclier' : null,
            reserve.length && left < reserve.length ? `${left} jouable${plural(left)} cette manche` : null,
        ].filter(Boolean).join(' · ');
        return <div className="fury-panel fury-panel--opp">
            <div className="fury-panel-head"><strong>Fury de {opponentName === 'IA' ? 'l’' : ''}{opponentName}</strong><small>{status}</small></div>
            {reserve.length > 0 && <div className="fury-panel-cards">
                {reserve.map(card => <span key={card.id} title={FURY_TYPES[card.furyType].text}><FuryCard type={card.furyType} size="mini" /></span>)}
            </div>}
        </div>;
    }
    const reserve = me?.fury?.reserve || [];
    const left = FURY_USES_PER_ROUND - (me?.fury?.used || 0);
    const attacks = reserve.filter(c => c.furyType !== 'shield').length;
    const status = reserve.length === 0 ? 'Cachées dans la pioche : piochez pour en gagner'
        : finalRound ? 'Dernier tour : plus de Fury jouable'
        : attacks === 0 ? 'Votre Bouclier bloquera tout seul la prochaine attaque'
        : left <= 0 ? 'Plus de Fury jouable cette manche'
        : canPlay ? 'Touchez-en une à la place de piocher'
        : 'Jouables au début de votre tour';
    return <div className="fury-panel fury-panel--me">
        <div className="fury-panel-head">
            <strong>Vos cartes Fury{hasShield(me?.fury) ? ' · protégé' : ''}</strong>
            <small>{status}</small>
        </div>
        {reserve.length > 0 && <div className="fury-panel-cards">
            {reserve.map((card, i) => card.furyType === 'shield' ? <span key={card.id} className="fury-chip-card fury-chip-card--passive" title="Le Bouclier se déclenche tout seul quand on vous attaque" aria-label="Bouclier : bloque tout seul la prochaine Fury reçue">
                <FuryCard type="shield" size="mini" />
            </span> : <button key={card.id} type="button" disabled={!canPlay} onClick={() => onSelect(i)}
                className={`fury-chip-card${selected === i ? ' is-selected' : ''}`} aria-pressed={selected === i}
                aria-label={`${FURY_TYPES[card.furyType].title} : ${FURY_TYPES[card.furyType].text}`}>
                <FuryCard type={card.furyType} size="mini" />
            </button>)}
        </div>}
    </div>;
}

// Bandeau de ciblage : consigne, et bouton « Lancer » pour les cartes sans cible précise.
export function FuryTargetBanner({ type, onPlay, onCancel }) {
    if (!type) return null;
    const info = FURY_TYPES[type];
    const Icon = FURY_ICONS[type];
    const hint = info.target === 'column' ? 'Touchez une colonne adverse' : info.target === 'card' ? 'Touchez une carte adverse retournée' : info.target === 'self' ? 'Protège votre plateau' : 'Vise le plateau adverse';
    const direct = info.target === 'player' || info.target === 'self';
    return <div className="fury-target" role="status" aria-live="polite">
        <span className="fury-target-icon" aria-hidden="true"><Icon size={18} /></span>
        <span className="fury-target-copy"><strong>{info.title}</strong><small>{hint}</small></span>
        {direct && <button type="button" className="fury-target-play" onClick={onPlay}>Lancer</button>}
        <button type="button" className="fury-target-cancel" onClick={onCancel} aria-label="Annuler"><X size={16} aria-hidden="true" /></button>
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
    useEffect(() => {
        if (!lastFury?.at) return undefined;
        const t0 = setTimeout(() => setShown(lastFury), 0);
        const target = lastFury.targetIndex === myIndex ? '.skyjo-hand:not(.skyjo-hand--opponent)' : '.skyjo-hand--opponent';
        const el = document.querySelector(target);
        if (el && !reduce && !lastFury.blocked && lastFury.type !== 'shield') { el.classList.remove('fury-shake'); void el.offsetWidth; el.classList.add('fury-shake'); }
        if (lastFury.targetIndex === myIndex && lastFury.type !== 'shield') { try { navigator.vibrate?.([40, 30, 60]); } catch { /* indisponible */ } }
        // Fury adverse : après l’onomatopée, une annonce au centre explique ce qui s’est passé (fermée par « OK »).
        const theirs = lastFury.by !== myIndex;
        const t1 = setTimeout(() => setShown(null), theirs ? 1000 : 1700);
        const t2 = theirs ? setTimeout(() => setAnnounce(lastFury), 900) : null;
        // Votre Fury : l'effet 3D éclate sur le plateau visé.
        let t3 = null, t4 = null;
        const zone = !theirs && !reduce ? document.querySelector(lastFury.type === 'shield' ? '.skyjo-hand:not(.skyjo-hand--opponent)' : '.skyjo-hand--opponent') : null;
        if (zone) {
            const r = zone.getBoundingClientRect();
            t3 = setTimeout(() => setBoardFx({ type: lastFury.blocked ? 'shield' : lastFury.type, at: lastFury.at, rect: { left: r.left - 30, top: r.top - 30, width: r.width + 60, height: r.height + 60 } }), 0);
            t4 = setTimeout(() => setBoardFx(null), 2500);
        }
        return () => { clearTimeout(t0); clearTimeout(t1); if (t2) clearTimeout(t2); if (t3) clearTimeout(t3); if (t4) clearTimeout(t4); };
    }, [lastFury, myIndex, reduce]);
    useEffect(() => {
        if (!lastGain?.at) return undefined;
        const mine = lastGain.by === myIndex;
        const t0 = setTimeout(() => setGain(lastGain), 0);
        // La carte du joueur reste affichée jusqu’à « OK » ; celle de l’adversaire s’efface seule.
        const t1 = mine ? null : setTimeout(() => setGain(null), 2400);
        if (mine) { try { navigator.vibrate?.([30, 40, 30]); } catch { /* indisponible */ } }
        return () => { clearTimeout(t0); if (t1) clearTimeout(t1); };
    }, [lastGain, myIndex]);
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
                const byName = names[announce.by] === 'IA' ? 'L’IA' : names[announce.by];
                return <Motion.div key={`announce-${announce.at}`} className={`fury-announce fury-card--${fx}`} role="alertdialog" aria-label={`${byName} joue ${FURY_TYPES[announce.type].title}`}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }} transition={{ duration: 0.3 }}>
                    {!reduce && <Suspense fallback={null}><FuryFX3D type={fx} loop className="fury-announce-fx" /></Suspense>}
                    <div className="fury-announce-body">
                        <Motion.span className="fury-announce-kicker" initial={reduce ? false : { y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
                            <Flame size={13} aria-hidden="true" />Fury de {byName === 'L’IA' ? 'l’IA' : byName}
                        </Motion.span>
                        <Motion.h2 className="fury-announce-word" initial={reduce ? false : { scale: 0.4, opacity: 0, rotate: -6 }} animate={{ scale: 1, opacity: 1, rotate: -3 }} transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.1 }}>
                            {announce.blocked ? 'Bloqué !' : FURY_TYPES[announce.type].bubble}
                        </Motion.h2>
                        <Motion.div className="fury-announce-stage" initial={reduce ? false : { rotateY: 180, scale: 0.5, y: 20 }} animate={{ rotateY: 0, scale: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15, ease: [0.2, 0.8, 0.25, 1] }}>
                            <FuryCard type={announce.type} />
                        </Motion.div>
                        <Motion.div className={`fury-announce-effect${announce.blocked ? ' is-blocked' : ''}`} initial={reduce ? false : { y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45 }}>
                            <span className="fury-announce-target"><Icon size={14} aria-hidden="true" />{announce.type === 'shield' ? 'Sur son plateau' : announce.blocked ? 'Attaque bloquée' : 'Sur votre plateau'}</span>
                            <p>{furyExplain(announce, names[announce.by])}</p>
                        </Motion.div>
                        <Motion.button type="button" className="fury-reveal-ok fury-announce-ok" onClick={() => setAnnounce(null)} autoFocus
                            initial={reduce ? false : { y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>Compris</Motion.button>
                    </div>
                </Motion.div>;
            })()}
        </AnimatePresence>
        <AnimatePresence>
            {gain && gain.by === myIndex && <Motion.div key={`reveal-${gain.at}`} className="fury-reveal" role="status"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: 60, scale: 0.6 }} transition={{ duration: 0.3 }}>
                <Motion.p className="fury-reveal-title" initial={reduce ? false : { y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    <Flame size={18} aria-hidden="true" />Carte Fury !
                </Motion.p>
                <div className="fury-reveal-cards">
                    {gain.cards.map((c, i) => <Motion.div key={c.id} initial={reduce ? false : { rotateY: 180, scale: 0.4 }} animate={{ rotateY: 0, scale: 1 }}
                        transition={{ duration: 0.55, delay: 0.1 + i * 0.12, ease: [0.2, 0.8, 0.25, 1] }}>
                        <FuryCard type={c.furyType} />
                    </Motion.div>)}
                </div>
                <p className="fury-reveal-sub">Rangée dans votre réserve, sous la pioche. Jouez-la au début d’un prochain tour, à la place de piocher.</p>
                <button type="button" className="fury-reveal-ok" onClick={() => setGain(null)} autoFocus>OK</button>
            </Motion.div>}
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
            <p className="skyjo-pause-text">Les règles du Skyjo, plus six cartes pour saboter le jeu adverse.</p>
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
