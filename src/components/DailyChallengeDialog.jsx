import { useId } from 'react';
import { Check, Trophy, ArrowRight } from 'lucide-react';
import { TourmentIcon, FuryIcon } from './virtual/ModeIcons';
import ModalShell, { ModalCloseButton } from './ui/ModalShell';
import RobotAvatar from './virtual/RobotAvatar';
import { AI_DIFFICULTY } from '../lib/skyjoAI';
import '../styles/DailyChallenge.css';

const MODES = [
    { id: AI_DIFFICULTY.BONUS, title: 'Tourment', reward: 3, description: 'Les cartes spéciales entrent en jeu', icon: TourmentIcon },
    { id: AI_DIFFICULTY.FURY, title: 'Fury', reward: 6, description: 'Les cartes de sabotage se déchaînent', icon: FuryIcon },
];

export default function DailyChallengeDialog({ isOpen, onClose, difficulty, onDifficultyChange, onStart }) {
    const titleId = useId();
    const radioName = useId();
    const mode = MODES.find(item => item.id === difficulty);
    return <ModalShell isOpen={isOpen} onClose={onClose} labelledBy={titleId} maxWidth="max-w-md" className={`daily-challenge-dialog ${difficulty === AI_DIFFICULTY.BONUS ? 'daily-challenge-dialog--tourment' : difficulty === AI_DIFFICULTY.FURY ? 'daily-challenge-dialog--fury' : ''}`}>
        <header className="daily-challenge-header">
            <div><p>LE RENDEZ-VOUS DU JOUR</p><h2 id={titleId}>Défi quotidien</h2></div>
            <ModalCloseButton onClick={onClose} label="Fermer le défi quotidien" />
        </header>
        <div className="daily-challenge-scene">
            <div className="daily-challenge-light" aria-hidden="true" />
            <RobotAvatar size="hero" difficulty={difficulty || AI_DIFFICULTY.BONUS} className="daily-challenge-robot" />
            <div className="daily-challenge-reward" aria-live="polite" aria-atomic="true">
                <Trophy size={21} aria-hidden="true" />
                <span>BONUS DE VICTOIRE</span>
                <strong>{mode ? `+${mode.reward}` : '3–6'}<small> XP</small></strong>
                <p>{mode ? `En mode ${mode.title}` : 'Selon votre difficulté'}</p>
            </div>
        </div>
        <div className="daily-challenge-content">
            <p className="daily-challenge-intro">Un adversaire à battre.<br /><strong>Un bonus à décrocher.</strong></p>
            <fieldset className="daily-challenge-choices">
                <legend>Choisissez votre difficulté</legend>
                <div>{MODES.map(({ id, title, reward, description, icon: Icon }) => <label key={id}>
                    <input type="radio" name={radioName} value={id} checked={difficulty === id} onChange={() => onDifficultyChange(id)} />
                    <span className="daily-challenge-choice">
                        <span className="daily-challenge-choice-top"><Icon width={22} height={22} /><span className="daily-challenge-check">{difficulty === id && <Check size={12} strokeWidth={3} aria-hidden="true" />}</span></span>
                        <strong>{title}</strong><span className="daily-challenge-xp">+{reward} XP</span><small>{description}</small>
                    </span>
                </label>)}</div>
            </fieldset>
            <p className="daily-challenge-condition"><Trophy size={16} aria-hidden="true" /><span>Le bonus se gagne en remportant la partie.</span></p>
        </div>
        <footer className="daily-challenge-footer">
            <button type="button" disabled={!mode} onClick={onStart}>
                <span>{mode ? 'Relever le défi' : 'Choisissez une difficulté'}{mode && <small>{mode.title} · +{mode.reward} XP en cas de victoire</small>}</span>
                {mode && <ArrowRight size={21} aria-hidden="true" />}
            </button>
        </footer>
    </ModalShell>;
}
