import { useState } from 'react';
import { motion as Motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles, Target, LayoutGrid, Columns3, History, Flag, Users, Globe, Smartphone, Hand } from 'lucide-react';
import SkyjoCard from './virtual/SkyjoCard';
import '../styles/Guide.css';

// Couleur d'une carte selon sa valeur (même répartition que le moteur de jeu).
const colorOf = n => (n === -2 ? 'indigo' : n < 0 ? 'blue' : n === 0 ? 'cyan' : n <= 4 ? 'green' : n <= 8 ? 'yellow' : n <= 11 ? 'orange' : 'red');
const face = (id, n) => ({ id, value: n, color: colorOf(n), isRevealed: true });

// Petite île isométrique dessinée, dans le style de l'accueil (aucune image chargée).
function Prism({ x, y, w, h, top, left, right }) {
    const d = w / 2;
    return <g>
        <path d={`M${x} ${y} L${x + w} ${y + d} L${x} ${y + w} L${x - w} ${y + d} Z`} fill={top} />
        <path d={`M${x - w} ${y + d} L${x} ${y + w} L${x} ${y + w + h} L${x - w} ${y + d + h} Z`} fill={left} />
        <path d={`M${x} ${y + w} L${x + w} ${y + d} L${x + w} ${y + d + h} L${x} ${y + w + h} Z`} fill={right} />
    </g>;
}
export function WelcomeIsland() {
    return <svg className="guide-island" viewBox="0 0 220 170" aria-hidden="true">
        <defs><radialGradient id="guide-glow" cx=".5" cy=".55" r=".5"><stop offset="0" stopColor="#ffd9a0" stopOpacity=".35" /><stop offset="1" stopColor="#ffd9a0" stopOpacity="0" /></radialGradient></defs>
        <ellipse cx="110" cy="96" rx="104" ry="70" fill="url(#guide-glow)" />
        <Prism x={110} y={118} w={30} h={20} top="#bca398" left="#a9938d" right="#98868a" />
        <Prism x={110} y={88} w={56} h={22} top="#cdb7aa" left="#bca398" right="#a9938d" />
        <Prism x={110} y={58} w={78} h={10} top="#ece5db" left="#dcd2c6" right="#cbbfb2" />
        {/* Cartes posées sur le parvis */}
        {[[80, 95], [98, 86], [116, 77], [98, 104], [116, 95], [134, 86]].map(([cx, cy], i) => (
            <path key={i} d={`M${cx} ${cy - 7} L${cx + 12} ${cy - 1} L${cx} ${cy + 5} L${cx - 12} ${cy - 1} Z`} fill={i === 1 ? '#e4d3b0' : i === 4 ? '#bccfc1' : '#3d4470'} stroke="#f3eee7" strokeWidth="1" />
        ))}
        {/* Tour, fenêtre éclairée, coupole */}
        <Prism x={156} y={34} w={11} h={36} top="#c4c8d6" left="#adb3c6" right="#9299b0" />
        <rect x="148" y="52" width="6" height="9" fill="#ffd9a0" />
        <path d="M145 39 Q156 24 167 39 Z" fill="#c9b2a5" />
        <path d="M156 26 V17" stroke="#dcd2c6" strokeWidth="1.5" />
        <rect x="152" y="8" width="8" height="10" rx="1" fill="#f3eee7" />
    </svg>;
}

const STEPS = [
    {
        title: 'Bienvenue',
        description: 'Quelques étapes pour prendre vos marques : le but, la grille, les combinaisons et les petites subtilités qui font gagner.',
        icon: Sparkles,
        content: <WelcomeIsland />,
    },
    {
        title: 'Le plus petit score gagne',
        description: 'Chaque point compte contre vous. Votre objectif est de finir la partie avec le total le plus bas.',
        icon: Target,
        content: (
            <div className="guide-cards">
                {[{ n: -2, l: 'Excellent' }, { n: 0, l: 'Parfait' }, { n: 12, l: 'À éviter' }].map(({ n, l }, i) => (
                    <div key={n} className="guide-card-col">
                        <Motion.div animate={{ y: n < 0 ? [0, -4, 0] : 0 }} transition={{ repeat: Infinity, duration: 2.4, delay: i * 0.2 }}>
                            <SkyjoCard card={face(`guide-2-${i}`, n)} size="sm" isClickable={false} />
                        </Motion.div>
                        <span>{l}</span>
                    </div>
                ))}
            </div>
        ),
    },
    {
        title: 'Votre grille',
        description: 'Vous jouez sur une grille de 12 cartes, en 3 lignes et 4 colonnes. Au départ, vous n’en connaissez que deux.',
        icon: LayoutGrid,
        content: (
            <div className="guide-grid">
                {[...Array(12)].map((_, i) => (
                    <SkyjoCard key={i} size="xs" isClickable={false}
                        card={[4, 7].includes(i) ? face(`guide-3-${i}`, 7) : { id: `guide-3-${i}`, value: null, isRevealed: false }} />
                ))}
            </div>
        ),
    },
    {
        title: 'La colonne parfaite',
        description: 'Trois cartes identiques dans une même colonne : la colonne entière disparaît et ne compte plus.',
        icon: Columns3,
        content: (
            <div className="guide-column">
                {[9, 9, 9].map((n, i) => (
                    <div key={i} className="guide-column-card"><SkyjoCard card={face(`guide-4-${i}`, n)} size="xs" isClickable={false} /></div>
                ))}
                <span>Colonne effacée</span>
            </div>
        ),
    },
    {
        title: 'Mémoire de la défausse',
        description: 'Un doute sur les cartes déjà jouées ? Appuyez longuement sur la défausse pour revoir les quatre dernières.',
        icon: History,
        content: (
            <div className="guide-panel guide-history">
                <span className="guide-hint"><Hand size={16} strokeWidth={1.75} aria-hidden="true" />Appui long</span>
                <div className="guide-fan">
                    <SkyjoCard card={face('guide-5-a', 5)} size="xs" isClickable={false} />
                    <div style={{ rotate: '7deg' }}><SkyjoCard card={face('guide-5-b', -2)} size="xs" isClickable={false} /></div>
                    <div style={{ rotate: '14deg' }}><SkyjoCard card={face('guide-5-c', 12)} size="xs" isClickable={false} /></div>
                </div>
            </div>
        ),
    },
    {
        title: 'Attention au dernier tour',
        description: 'Quand un joueur retourne sa dernière carte, les autres jouent un ultime tour. Si celui qui a fini n’a pas le plus petit score, ses points sont doublés.',
        icon: Flag,
        content: (
            <div className="guide-double">
                <span className="guide-double-from">15</span>
                <ChevronRight size={22} strokeWidth={1.5} aria-hidden="true" />
                <Motion.span className="guide-double-to" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.2 }}>30</Motion.span>
                <span className="guide-double-tag">Score doublé</span>
            </div>
        ),
    },
    {
        title: 'Vos amis',
        description: 'Ajoutez vos amis avec leur pseudo ou leur code, et voyez d’un coup d’œil qui est disponible pour une partie.',
        icon: Users,
        content: (
            <div className="guide-friends">
                {[{ n: 'Renard', on: true }, { n: 'Chat', on: false }].map(f => (
                    <div key={f.n} className={`guide-panel guide-friend${f.on ? '' : ' is-away'}`}>
                        <span className="guide-avatar">{f.n[0]}</span>
                        <span className="guide-friend-name">{f.n}</span>
                        <span className="guide-friend-state">{f.on ? 'En ligne' : 'Absent'}</span>
                    </div>
                ))}
            </div>
        ),
    },
    {
        title: 'Jouer en ligne',
        description: 'Invitez un ami connecté, ou créez une table privée et partagez son code.',
        icon: Globe,
        content: (
            <div className="guide-panel guide-room">
                <span>Code de la table</span>
                <strong>XK9L</strong>
                <div className="guide-room-seats">{[0, 1, 2].map(i => <i key={i} className={i === 0 ? 'is-taken' : ''} />)}</div>
            </div>
        ),
    },
    {
        title: 'Garder l’app à jour sur Android',
        description: 'Si l’icône de l’app reste ancienne sur votre écran d’accueil, réinstallez-la :',
        icon: Smartphone,
        content: (
            <ol className="guide-steps">
                <li className="guide-panel">Appuyez longuement sur l’icône de l’app.</li>
                <li className="guide-panel">Choisissez « Désinstaller » ou « Supprimer ».</li>
                <li className="guide-panel">Rouvrez le site dans Chrome, puis « Ajouter à l’écran d’accueil ».</li>
            </ol>
        ),
    },
];

export default function Tutorial({ isOpen, onClose }) {
    const [currentStep, setCurrentStep] = useState(0);
    const reduced = useReducedMotion();
    const step = STEPS[currentStep];
    const Icon = step.icon;
    const last = currentStep === STEPS.length - 1;

    const handleNext = () => { if (!last) setCurrentStep(currentStep + 1); else onClose(); };
    const handleBack = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="skyjo-guide" role="dialog" aria-modal="true" aria-labelledby="guide-title">
                    <Motion.div className="skyjo-guide-backdrop" onClick={onClose}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                    <Motion.div className="skyjo-guide-panel"
                        initial={reduced ? false : { y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }}
                        transition={{ duration: reduced ? 0 : 0.28, ease: [0.2, 0.8, 0.25, 1] }}>
                        <header className="skyjo-guide-header">
                            <span className="skyjo-guide-icon"><Icon size={20} strokeWidth={1.6} aria-hidden="true" /></span>
                            <span className="skyjo-guide-meta"><span>Guide de jeu</span><span>Étape {currentStep + 1} sur {STEPS.length}</span></span>
                            <button type="button" className="skyjo-guide-close" onClick={onClose} aria-label="Fermer le guide"><X size={20} strokeWidth={1.6} /></button>
                        </header>
                        <div className="skyjo-guide-progress" aria-hidden="true">
                            {STEPS.map((_, i) => <i key={i} className={i <= currentStep ? 'is-done' : ''} />)}
                        </div>
                        <AnimatePresence mode="wait" initial={false}>
                            <Motion.div key={currentStep} className="skyjo-guide-body"
                                initial={reduced ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: reduced ? 0 : 0.2 }}>
                                <h2 id="guide-title">{step.title}</h2>
                                <p>{step.description}</p>
                                <div className="skyjo-guide-visual">{step.content}</div>
                            </Motion.div>
                        </AnimatePresence>
                        <footer className="skyjo-guide-footer">
                            {currentStep > 0 && <button type="button" className="skyjo-guide-btn skyjo-guide-btn--ghost" onClick={handleBack}><ChevronLeft size={18} aria-hidden="true" />Retour</button>}
                            <button type="button" className="skyjo-guide-btn skyjo-guide-btn--primary" onClick={handleNext}>
                                {last ? 'C’est parti' : 'Suivant'}{!last && <ChevronRight size={18} aria-hidden="true" />}
                            </button>
                        </footer>
                    </Motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
