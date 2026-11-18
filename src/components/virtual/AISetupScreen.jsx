import { useId, useLayoutEffect, useRef } from 'react';
import { ArrowLeft, ArrowUpRight, Check, Play, BookOpen } from 'lucide-react';
import { NormalIcon, HardIcon, TourmentIcon, FuryIcon } from './ModeIcons';
import { AI_DIFFICULTY } from '../../lib/skyjoAI';
import RobotAvatar from './RobotAvatar';
import IslandSpin from './IslandSpin';
import '../../styles/AISetup.css';

const MODES = [
    { id: AI_DIFFICULTY.HARD, title: 'Normal', description: 'Un duel équilibré', icon: NormalIcon, theme: 'amber', line: 'À vous de me surprendre.', detail: 'Le bon niveau pour une partie posée : l’IA joue juste, sans vous écraser.' },
    { id: AI_DIFFICULTY.HARDCORE, title: 'Difficile', description: 'Ne laissez rien au hasard', icon: HardIcon, theme: 'violet', line: 'Je ne vous ferai aucun cadeau.', detail: 'Une IA impitoyable et des règles spéciales. Consultez-les avant le duel.', rules: 'hardcore' },
    { id: AI_DIFFICULTY.BONUS, title: 'Tourment', description: 'Osez les cartes spéciales', icon: TourmentIcon, theme: 'coral', line: 'Prêt à jouer avec le feu ?', detail: 'Cartes spéciales et bonus de colonnes : découvrez une autre façon de jouer.', rules: 'tourment' },
    { id: AI_DIFFICULTY.FURY, title: 'Fury', description: 'Détruisez le jeu adverse', icon: FuryIcon, theme: 'ember', line: 'Je vais tout casser.', detail: '12 cartes de sabotage cachées dans la pioche : séisme, malédiction, tornade… Trois au plus par manche.', rules: 'fury' },
];

export default function AISetupScreen({ difficulty, onDifficultyChange, onStart, onBack, onRules }) {
    const mode = MODES.find(item => item.id === difficulty) || MODES.find(item => item.id === AI_DIFFICULTY.HARD);
    const radioName = useId();
    const dockRef = useRef(null);
    useLayoutEffect(() => {
        const navigation = document.querySelector('.mobile-navigation');
        const positionDock = () => {
            dockRef.current?.style.setProperty('--ai-nav-offset', `${Math.ceil(navigation?.getBoundingClientRect().height || 0)}px`);
        };
        positionDock();
        const observer = new ResizeObserver(positionDock);
        if (navigation) observer.observe(navigation);
        return () => observer.disconnect();
    }, []);
    return <main className={`ai-setup ai-setup--${mode.theme}`}>
        <header className="ai-setup-header">
            <button type="button" onClick={onBack} className="ai-setup-back" aria-label="Retour au menu Jouer"><ArrowLeft size={20} aria-hidden="true" /></button>
            <div><p>FACE À L’IA</p><h1>Rencontrez votre rival.</h1></div>
        </header>

        <section className="ai-rival" aria-label="Votre adversaire IA">
            <div className={`ai-rival-stage ai-rival-stage--${mode.id}`}>
                <div className="ai-rival-grid" aria-hidden="true" />
                <div className="ai-rival-orbit" aria-hidden="true" />
                <div className="ai-rival-platform" aria-hidden="true" />
                <IslandSpin />
                <div className="ai-rival-sea" aria-hidden="true" />
                <RobotAvatar size="hero" difficulty={mode.id} rival className="ai-rival-avatar" />
            </div>
        </section>

        <fieldset className="ai-difficulties">
            <legend>Choisissez votre défi<span>4 façons de jouer</span></legend>
            <div className="ai-difficulty-grid">
                {MODES.map(({ id, title, description, icon: Icon, theme }) => <label key={id} className={`ai-difficulty ai-difficulty--${theme}`}>
                    <input type="radio" name={radioName} value={id} checked={difficulty === id} onChange={() => onDifficultyChange(id)} />
                    <span className="ai-difficulty-body">
                        <span className="ai-difficulty-icon"><Icon width={22} height={22} /></span>
                        <span className="ai-difficulty-check" aria-hidden="true">{difficulty === id && <Check size={12} strokeWidth={3} />}</span>
                        <strong>{title}</strong><small>{description}</small>
                    </span>
                </label>)}
            </div>
        </fieldset>

        <div className="ai-mode-detail">
            <p>{mode.detail}</p>
            {mode.rules && <button type="button" onClick={() => onRules(mode.rules)} aria-label={`Règles du mode ${mode.title}`}><BookOpen size={15} aria-hidden="true" />Règles<ArrowUpRight size={14} aria-hidden="true" /></button>}
        </div>
        <div ref={dockRef} className="ai-setup-dock"><button type="button" onClick={onStart} className="ai-setup-launch">
            <span className="ai-setup-launch-icon"><Play size={21} fill="currentColor" aria-hidden="true" /></span>
            <span><strong>Affronter l’IA</strong><small>Mode {mode.title}</small></span>
            <ArrowUpRight size={23} aria-hidden="true" />
        </button></div>
    </main>;
}
