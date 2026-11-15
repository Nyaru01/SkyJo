import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Skull, TrendingUp, Gem, RefreshCw, Eraser, Sparkles, Flame, HelpCircle, Hand } from 'lucide-react';
import SkyjoCard from './virtual/SkyjoCard';
import '../styles/TourmentRules.css';

// Guide du mode Tourment (et règle « colonne −3 » du mode Difficile), dans la DA crépuscule du jeu.
const card = (id, value, color, extra = {}) => ({ id, value, color, isRevealed: true, ...extra });

function Fan() {
    const reduce = useReducedMotion();
    const cards = [
        card('fan-s', 0, 'special', { specialType: 'S' }),
        card('fan-10', -10, 'violet'),
        card('fan-ch', 0, 'gold', { specialType: 'CH' }),
        card('fan-20', 20, 'darkred'),
        card('fan-c', 0, 'special', { specialType: 'C' }),
    ];
    return <div className="tr-fan" aria-hidden="true">
        <span className="tr-fan-halo" />
        {cards.map((c, i) => {
            const k = i - 2;
            return <Motion.div key={c.id} className="tr-fan-card" style={{ zIndex: 5 - Math.abs(k) }}
                initial={reduce ? false : { rotate: 0, x: 0, y: 30, opacity: 0 }}
                animate={{ rotate: k * 10, x: k * 36, y: Math.abs(k) * 8, opacity: 1 }}
                transition={{ delay: 0.08 * i, type: 'spring', stiffness: 160, damping: 16 }}>
                <SkyjoCard card={c} size="sm" isClickable={false} />
            </Motion.div>;
        })}
    </div>;
}

const Row = ({ children }) => <div className="tr-row">{children}</div>;
const Tag = ({ tone = 'cream', children }) => <p className={`tr-tag tr-tag--${tone}`}>{children}</p>;

const STEPS = [
    {
        id: 'intro', title: 'Le mode Tourment', icon: Flame, tone: 'coral',
        text: '24 cartes spéciales rejoignent le paquet. Les règles de Vesper restent les mêmes, mais chaque pioche peut tout changer.',
        content: <Fan />,
    },
    {
        id: 'goal', title: 'L’objectif de domination', icon: TrendingUp, tone: 'plum',
        text: 'La partie s’arrête toujours quand quelqu’un atteint 100. Votre rang dépend de votre score à ce moment-là : descendez à −100 pour la domination absolue.',
        content: <div className="tr-stats">
            <div className="tr-stat tr-stat--plum"><strong>≤ −100</strong><span>Domination absolue</span></div>
            <div className="tr-stat tr-stat--coral"><strong>+100</strong><span>Fin de partie</span></div>
        </div>,
    },
    {
        id: 'column', title: 'Colonne nettoyée : −3', icon: Eraser, tone: 'sage',
        text: 'Trois cartes identiques dans une colonne disparaissent, et vous rapportent −3 points en fin de manche.',
        content: <><Row>{[1, 2, 3].map(i => <SkyjoCard key={i} card={card(`col-${i}`, 8, 'orange')} size="xs" isClickable={false} />)}</Row><Tag tone="sage">Bonus −3 par colonne</Tag></>,
    },
    {
        id: 'minus10', title: 'La carte −10', icon: Gem, tone: 'plum',
        text: 'La meilleure carte du jeu, en six exemplaires seulement. Gardez-la précieusement.',
        content: <><Row><Floating><SkyjoCard card={card('m10', -10, 'violet')} size="sm" isClickable={false} /></Floating></Row><Tag tone="plum">Votre meilleure alliée</Tag></>,
    },
    {
        id: 'skull', title: 'Le Crâne maudit', icon: Skull, tone: 'coral',
        text: 'Il vaut 20 points (six exemplaires). Pioché, il doit être posé dans votre grille, puis il reste bloqué 3 tours.',
        content: <><Row><Shaking><SkyjoCard card={card('skull', 20, 'darkred')} size="sm" isClickable={false} /></Shaking></Row><Tag tone="coral">Débarrassez-vous-en vite</Tag></>,
    },
    {
        id: 'swap', title: 'L’Échange', icon: RefreshCw, tone: 'sky',
        text: 'Quatre exemplaires. Échangez une de vos cartes, visible ou cachée, avec celle d’un adversaire.',
        content: <><Row>
            <SkyjoCard card={card('sw-s', 0, 'special', { specialType: 'S' })} size="xs" isClickable={false} />
            <span className="tr-arrow" aria-hidden="true">→</span>
            <Swap a={<SkyjoCard card={card('sw-12', 12, 'red')} size="xs" isClickable={false} />} b={<SkyjoCard card={card('sw-m10', -10, 'violet')} size="xs" isClickable={false} />} />
        </Row><Tag tone="sky">Votre pire carte contre sa meilleure</Tag></>,
    },
    {
        id: 'joker', title: 'L’Étoile', icon: Sparkles, tone: 'sage',
        text: 'Quatre exemplaires, valeur 0. Posée avec une paire dans une colonne, elle la complète : la colonne disparaît.',
        content: <><Row>
            <SkyjoCard card={card('j1', 5, 'green')} size="xs" isClickable={false} />
            <SkyjoCard card={card('j2', 5, 'green')} size="xs" isClickable={false} />
            <Floating><SkyjoCard card={card('j3', 0, 'special', { specialType: 'C' })} size="xs" isClickable={false} /></Floating>
        </Row><Tag tone="sage">Faites place nette</Tag></>,
    },
    {
        id: 'chest', title: 'La carte Mystère', icon: HelpCircle, tone: 'gold',
        text: 'Quatre exemplaires. Sa valeur, −15 ou +15, n’est dévoilée qu’en fin de manche. Pour les colonnes, elle compte comme un 0.',
        content: <><Row><Floating><SkyjoCard card={card('chest', 0, 'gold', { specialType: 'CH' })} size="sm" isClickable={false} /></Floating></Row>
            <div className="tr-stats tr-stats--small">
                <div className="tr-stat tr-stat--sage"><strong>−15</strong><span>Trésor</span></div>
                <div className="tr-stat tr-stat--coral"><strong>+15</strong><span>Piège</span></div>
            </div></>,
    },
    {
        id: 'tip', title: 'Astuce', icon: Hand, tone: 'sky',
        text: 'Un doute sur les cartes jouées ? Appuyez longuement sur la défausse pour revoir les trois dernières.',
        content: <Row><div className="tr-history">
            <SkyjoCard card={card('h1', 5, 'blue')} size="xs" isClickable={false} />
            <SkyjoCard card={card('h2', -2, 'blue')} size="xs" isClickable={false} />
            <SkyjoCard card={card('h3', 12, 'red')} size="xs" isClickable={false} />
        </div></Row>,
    },
];

function Floating({ children }) {
    const reduce = useReducedMotion();
    return <Motion.div animate={reduce ? undefined : { y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}>{children}</Motion.div>;
}
function Shaking({ children }) {
    const reduce = useReducedMotion();
    return <Motion.div animate={reduce ? undefined : { rotate: [0, -3, 3, -2, 0] }} transition={{ repeat: Infinity, duration: 1.4, repeatDelay: 0.8 }}>{children}</Motion.div>;
}
function Swap({ a, b }) {
    const reduce = useReducedMotion();
    return <div className="tr-swap">
        <Motion.div animate={reduce ? undefined : { x: [0, 52, 52, 0], y: [0, -10, -10, 0] }} transition={{ repeat: Infinity, duration: 3, times: [0, 0.35, 0.65, 1] }}>{a}</Motion.div>
        <Motion.div animate={reduce ? undefined : { x: [0, -52, -52, 0], y: [0, 10, 10, 0] }} transition={{ repeat: Infinity, duration: 3, times: [0, 0.35, 0.65, 1] }}>{b}</Motion.div>
    </div>;
}

export default function BonusTutorial({ isOpen, onClose, mode = 'tourment' }) {
    const [index, setIndex] = useState(0);
    const steps = mode === 'hardcore' ? STEPS.filter(s => s.id === 'column') : STEPS;
    const step = steps[Math.min(index, steps.length - 1)];
    const Icon = step.icon;
    const last = index >= steps.length - 1;
    const close = () => { setIndex(0); onClose(); };

    return createPortal(<AnimatePresence>
        {isOpen && <Motion.div className="tr-layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
            <Motion.section className={`tr-panel tr-panel--${step.tone}`} role="dialog" aria-modal="true" aria-labelledby="tr-title"
                initial={{ y: 24, scale: 0.97, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
                onClick={e => e.stopPropagation()}>
                <header className="tr-head">
                    <span className="tr-emblem"><Icon size={20} strokeWidth={1.8} aria-hidden="true" /></span>
                    <div>
                        <p>{mode === 'hardcore' ? 'Règle du mode Difficile' : 'Guide du mode Tourment'}</p>
                        {steps.length > 1 && <small>Étape {index + 1} sur {steps.length}</small>}
                    </div>
                    <button type="button" className="tr-close" onClick={close} aria-label="Fermer"><X size={18} aria-hidden="true" /></button>
                </header>
                {steps.length > 1 && <div className="tr-progress" aria-hidden="true">{steps.map((s, i) => <i key={s.id} className={i <= index ? 'is-on' : ''} />)}</div>}
                <AnimatePresence mode="wait">
                    <Motion.div key={step.id} className="tr-body" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.22 }}>
                        <h2 id="tr-title">{step.title}</h2>
                        <p className="tr-text">{step.text}</p>
                        <div className="tr-stage">{step.content}</div>
                    </Motion.div>
                </AnimatePresence>
                <footer className="tr-actions">
                    {index > 0 && <button type="button" className="tr-back" onClick={() => setIndex(i => i - 1)}><ChevronLeft size={18} aria-hidden="true" />Retour</button>}
                    <button type="button" className="tr-next" onClick={() => (last ? close() : setIndex(i => i + 1))}>
                        {last ? 'C’est parti' : 'Suivant'}{!last && <ChevronRight size={18} aria-hidden="true" />}
                    </button>
                </footer>
            </Motion.section>
        </Motion.div>}
    </AnimatePresence>, document.body);
}
