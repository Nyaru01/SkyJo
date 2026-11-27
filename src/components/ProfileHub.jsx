import { Archive, Settings, ChevronRight } from 'lucide-react';
import ExperienceBar from './ExperienceBar';
import { useGameStore } from '../store/gameStore';
import { getAvatarPath } from '../lib/avatars';

export default function ProfileHub({ onNavigate }) {
    const profile = useGameStore(state => state.userProfile);
    return <main className="profile-hub">
        <header className="profile-hub-heading">
            <img src={getAvatarPath(profile.avatarId || profile.emoji)} alt="" width="64" height="64" />
            <div><p className="mobile-eyebrow">VOTRE ESPACE</p><h1>{profile.name || 'Votre profil'}</h1><p>Progression, parties et préférences.</p></div>
        </header>
        <section className="mobile-panel" aria-label="Votre carrière"><ExperienceBar /></section>
        <section className="profile-hub-links" aria-label="Gérer votre espace">
            <button type="button" onClick={() => onNavigate('pastGames')}><Archive aria-hidden="true" /><span><strong>Mes parties</strong><small>Retrouvez votre historique.</small></span><ChevronRight aria-hidden="true" /></button>
            <button type="button" onClick={() => onNavigate('settings')}><Settings aria-hidden="true" /><span><strong>Réglages</strong><small>Sons, apparence et préférences.</small></span><ChevronRight aria-hidden="true" /></button>
        </section>
    </main>;
}
