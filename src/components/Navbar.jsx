import { Home, BarChart3, Dices, UserRound, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSocialStore } from '../store/socialStore';

const TABS = [
    { id: 'home', label: 'Accueil', icon: Home },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'virtual', label: 'Jouer', icon: Dices },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'profile', label: 'Profil', icon: UserRound },
];
const PROFILE_SCREENS = ['profile', 'pastGames', 'settings', 'changelog'];

export default function BottomNav({ activeTab, onTabChange }) {
    const socialNotification = useSocialStore(state => state.socialNotification);
    const setSocialNotification = useSocialStore(state => state.setSocialNotification);
    const selected = PROFILE_SCREENS.includes(activeTab) ? 'profile' : activeTab === 'game' ? 'home' : activeTab;
    return (
        <div className="mobile-navigation">
            <nav aria-label="Navigation principale">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button type="button" key={id} aria-label={label} aria-current={selected === id ? 'page' : undefined}
                        className={cn('mobile-nav-item', selected === id && 'mobile-nav-item--active')}
                        onClick={() => {
                            onTabChange(id);
                            if (id === 'social') setSocialNotification(false);
                        }}>
                        <span className="mobile-nav-icon"><Icon size={22} aria-hidden="true" />
                            {id === 'social' && socialNotification && <span className="mobile-nav-notification" role="img" aria-label="Nouveautés sociales" />}
                        </span>
                        <span>{label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
}
