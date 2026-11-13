import { useId, useLayoutEffect, useRef } from 'react';
import { ArrowLeft, ArrowUpRight, Check, Flame, Leaf, Play, Skull, Swords, BookOpen } from 'lucide-react';
import { AI_DIFFICULTY } from '../../lib/skyjoAI';
import RobotAvatar from './RobotAvatar';
import '../../styles/AISetup.css';

const MODES = [
    { id: AI_DIFFICULTY.NORMAL, title: 'Normal', description: 'Prenez vos marques', icon: Leaf, theme: 'mint', line: 'On commence en douceur ?', detail: 'Le bon terrain pour découvrir le jeu et affiner vos premiers coups.' },
    { id: AI_DIFFICULTY.HARD, title: 'Difficile', description: 'Pensez un coup plus loin', icon: Swords, theme: 'amber', line: 'À vous de me surprendre.', detail: 'Un duel plus exigeant, où chaque décision peut faire la différence.' },
    { id: AI_DIFFICULTY.HARDCORE, title: 'Hardcore', description: 'Ne laissez rien au hasard', icon: Skull, theme: 'violet', line: 'Je ne vous ferai aucun cadeau.', detail: 'Une IA impitoyable et des règles spéciales. Consultez-les avant le duel.', rules: 'hardcore' },
    { id: AI_DIFFICULTY.BONUS, title: 'Tourment', description: 'Osez les cartes spéciales', icon: Flame, theme: 'coral', line: 'Prêt à jouer avec le feu ?', detail: 'Cartes spéciales et bonus de colonnes : découvrez une autre façon de jouer.', rules: 'tourment' },
];

export default function AISetupScreen({ difficulty, onDifficultyChange, onStart, onBack, onRules }) {
    const mode = MODES.find(item => item.id === difficulty) || MODES[0];
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
            <div><p>LE DUEL SOLO</p><h1>Rencontrez votre rival.</h1></div>
        </header>

        <section className="ai-rival" aria-label="Votre adversaire IA">
            <div className="ai-rival-topline"><span><i aria-hidden="true" />Adversaire prêt</span></div>
            <div className="ai-rival-stage">
                <div className="ai-rival-grid" aria-hidden="true" />
                <div className="ai-rival-orbit" aria-hidden="true" />
                <div className="ai-rival-platform" aria-hidden="true" />
                <RobotAvatar size="hero" difficulty={mode.id} className="ai-rival-avatar" />
            </div>
            <div className="ai-rival-dialogue" aria-live="polite" aria-atomic="true">
                <span className="ai-rival-mode">{mode.title}</span>
                <p>« {mode.line} »</p>
            </div>
        </section>

        <fieldset className="ai-difficulties">
            <legend>Choisissez votre défi<span>4 façons de jouer</span></legend>
            <div className="ai-difficulty-grid">
                {MODES.map(({ id, title, description, icon: Icon, theme }) => <label key={id} className={`ai-difficulty ai-difficulty--${theme}`}>
                    <input type="radio" name={radioName} value={id} checked={difficulty === id} onChange={() => onDifficultyChange(id)} />
                    <span className="ai-difficulty-body">
                        <span className="ai-difficulty-icon"><Icon size={21} strokeWidth={1.8} aria-hidden="true" /></span>
                        <span className="ai-difficulty-check" aria-hidden="true">{difficulty === id && <Check size={12} strokeWidth={3} />}</span>
                        <strong>{title}</strong><small>{description}</small>
                    </span>
                </label>)}
            </div>
        </fieldset>

        <div className="ai-mode-detail">
            <p>{mode.detail}</p>
            {mode.rules && <button type="button" onClick={() => onRules(mode.rules)}><BookOpen size={16} aria-hidden="true" />Règles {mode.title}<ArrowUpRight size={15} aria-hidden="true" /></button>}
        </div>
        <div ref={dockRef} className="ai-setup-dock"><button type="button" onClick={onStart} className="ai-setup-launch">
            <span className="ai-setup-launch-icon"><Play size={21} fill="currentColor" aria-hidden="true" /></span>
            <span><strong>Affronter l’IA</strong><small>Mode {mode.title}</small></span>
            <ArrowUpRight size={23} aria-hidden="true" />
        </button></div>
    </main>;
}
