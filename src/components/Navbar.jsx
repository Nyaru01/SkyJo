import { Home, Archive, BarChart3, Dices, Settings, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { useGameStore } from '../store/gameStore';
import { useSocialStore } from '../store/socialStore';

export default function BottomNav({ activeTab, onTabChange }) {
    const gameStatus = useGameStore(state => state.gameStatus);
    const socialNotification = useSocialStore(state => state.socialNotification);
    const setSocialNotification = useSocialStore(state => state.setSocialNotification);

    const tabs = [
        { id: 'home', label: 'Accueil', icon: Home, alwaysEnabled: true },
        { id: 'social', label: 'Social', icon: Users, alwaysEnabled: true },
        { id: 'virtual', label: 'Jouer', icon: Dices, alwaysEnabled: true },
        { id: 'stats', label: 'Stats', icon: BarChart3, alwaysEnabled: true },
        { id: 'pastGames', label: 'Parties', icon: Archive, alwaysEnabled: true },
        { id: 'settings', label: 'Réglages', icon: Settings, alwaysEnabled: true },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[80] pointer-events-none p-4 pb-8 flex justify-center safe-area-bottom">
            <nav
                className="w-full max-w-lg glass-v3 rounded-[2.5rem] p-1.5 shadow-[0_25px_60px_rgba(0,0,0,0.5)] pointer-events-auto relative overflow-hidden border border-white/20 ring-1 ring-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                role="tablist"
                aria-label="Navigation principale"
            >
                <div className="flex items-center justify-around relative px-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        const isDisabled = !tab.alwaysEnabled && gameStatus === 'SETUP';

                        return (
                            <button
                                key={tab.id}
                                role="tab"
                                aria-selected={isActive}
                                aria-label={tab.label}
                                disabled={isDisabled}
                                onClick={() => {
                                    if (!isDisabled) {
                                        onTabChange(tab.id);
                                        if (tab.id === 'social') setSocialNotification(false);
                                    }
                                }}
                                className={cn(
                                    "relative flex-1 flex flex-col items-center justify-center py-2 transition-all duration-300",
                                    isDisabled && "opacity-20 cursor-not-allowed grayscale"
                                )}
                            >
                                {/* Active Glass Glow Indicator */}
                                {isActive && (
                                    <motion.div
                                        layoutId="navbar-indicator-glow"
                                        className="glass-glow-indicator"
                                        initial={false}
                                        transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
                                    />
                                )}

                                <div className={cn(
                                    "relative z-10 flex flex-col items-center justify-center transition-all duration-300",
                                    isActive ? "scale-110 -translate-y-0.5" : "scale-100 opacity-60"
                                )}>
                                    <Icon
                                        className={cn(
                                            "h-5 w-5 transition-all duration-300",
                                            isActive ? "text-blue-400" : "text-slate-400"
                                        )}
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />

                                    {/* Notification Dot */}
                                    {tab.id === 'social' && socialNotification && !isActive && (
                                        <span className="absolute top-0 -right-1 w-2 h-2 bg-red-500 rounded-full border border-slate-900 animate-bounce shadow-sm" />
                                    )}

                                    <span className={cn(
                                        "text-[8px] font-black tracking-tighter transition-all duration-300 uppercase mt-1",
                                        isActive ? "text-blue-400 nav-label-active" : "text-slate-500"
                                    )}>
                                        {tab.label}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
