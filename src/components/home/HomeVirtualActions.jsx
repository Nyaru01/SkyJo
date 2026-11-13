import { ChevronRight } from 'lucide-react';
import HomeGlyph from './HomeGlyphs';
import { useVirtualGameStore } from '../../store/virtualGameStore';

// Menu de l'accueil virtuel : de vrais boutons pleine largeur.
// Le premier (Reprendre ou Contre l'IA) est plein, les suivants sont clairs.
export default function HomeVirtualActions({ onAction }) {
    const savedGame = useVirtualGameStore(state => state.gameState);
    const items = [
        ...(savedGame ? [{ id: 'quick', title: 'Reprendre la partie', caption: 'Votre table vous attend' }] : []),
        { id: 'ai', title: 'Contre l’IA', caption: 'Quatre niveaux, du calme au tourment' },
        { id: 'online', title: 'En ligne', caption: 'Une table à partager entre amis' },
        { id: 'challenges', title: 'Défis', caption: 'Objectifs du jour et de la saison' },
    ];
    return <nav className="lobby-menu" aria-label="Jouer en virtuel">
        {items.map(({ id, title, caption }, i) => (
            <button key={id} type="button" className={`lobby-menu-btn${i === 0 ? ' lobby-menu-btn--primary' : ''}`} onClick={() => onAction(id)}>
                <span className="lobby-menu-btn-icon"><HomeGlyph id={id} /></span>
                <span className="lobby-menu-btn-copy">
                    <span className="lobby-menu-btn-title">{title}</span>
                    <span className="lobby-menu-btn-caption">{caption}</span>
                </span>
                <ChevronRight className="lobby-menu-btn-chevron" size={18} aria-hidden="true"/>
            </button>
        ))}
    </nav>;
}
