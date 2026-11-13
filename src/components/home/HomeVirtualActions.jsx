import { Bot, Play, RotateCcw, Trophy } from 'lucide-react';
import { useVirtualGameStore } from '../../store/virtualGameStore';

export default function HomeVirtualActions({ onAction }) {
    const savedGame = useVirtualGameStore(state => state.gameState);
    const actions = [
        { id: 'quick', icon: savedGame ? RotateCcw : Play, title: savedGame ? 'Reprendre' : 'Partie rapide', description: savedGame ? 'Votre table vous attend' : 'Solo · Normal' },
        { id: 'challenges', icon: Trophy, title: 'Défis', description: 'Bonus & objectifs' },
        { id: 'ai', icon: Bot, title: 'Contre l’IA', description: 'Choisir le niveau' },
    ];
    return <section className="lobby-actions" aria-label="Jouer en virtuel">
        {actions.map(({ id, icon: Icon, title, description }) => (
            <button key={id} type="button" onClick={() => onAction(id)}>
                <span className="lobby-action-icon"><Icon size={22} strokeWidth={1.5} aria-hidden="true"/></span>
                <span className="lobby-action-copy"><strong>{title}</strong><span>{description}</span></span>
            </button>
        ))}
    </section>;
}
