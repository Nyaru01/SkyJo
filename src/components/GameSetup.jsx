import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion';
import { Bell, Check, Gamepad2, HelpCircle, Play, RefreshCw, Settings, ScrollText, Users, Zap } from 'lucide-react';
import InstallPWA from './InstallPWA';
import { useGameStore } from '../store/gameStore';
import { useSocialStore } from '../store/socialStore';
import { useVirtualGameStore } from '../store/virtualGameStore';
import { useFeedback } from '../hooks/useFeedback';
import { useUpdateCheck } from './UpdatePrompt';
import { AVATARS, getAvatarPath } from '../lib/avatars';
import { getCareerIdentity } from '../lib/masterCareer';
import AvatarSelector from './AvatarSelector';
import PseudoModal from './PseudoModal';
import WhatsNewModal, { CURRENT_NEWS_VERSION } from './WhatsNewModal';
import HomeWorldScene from './home/HomeWorldScene';
import HomeVirtualActions from './home/HomeVirtualActions';
import HomePlayerList from './home/HomePlayerList';
import '../styles/HomeLobby.css';

/* global __APP_VERSION__ */
export default function GameSetup({ onNavigate, onVirtualAction, onOpenTutorial, showGuide = false, allowAutoNews = true, onWhatsNewVisibilityChange }) {
    const [mode, setMode] = useState('virtual');
    const [players, setPlayers] = useState([{ name: '', avatarId: 'frog', draftId: 0 }]);
    const nextDraftId = useRef(1);
    const [openAvatarSelector, setOpenAvatarSelector] = useState(null);
    const [showPseudoModal, setShowPseudoModal] = useState(false);
    const [pendingQuickStart, setPendingQuickStart] = useState(false);
    const setConfiguration = useGameStore(state => state.setConfiguration);
    const updateUserProfile = useGameStore(state => state.updateUserProfile);
    const hasNotification = useSocialStore(state => state.socialNotification);
    const level = useGameStore(state => state.level);
    const currentXP = useGameStore(state => state.currentXP);
    const profileAvatar = useGameStore(state => state.userProfile?.avatarId);
    const careerLabel = getCareerIdentity(level).label;
    const xpPercent = Math.min(100, Math.max(0, (currentXP || 0) * 10));
    const { playStart, playClick } = useFeedback();
    const reducedMotion = useReducedMotion();
    const { checkForUpdates, isChecking, checkResult } = useUpdateCheck();
    const [isNewsManuallyOpen, setIsNewsManuallyOpen] = useState(false);
    const [hasDismissedAutoNews, setHasDismissedAutoNews] = useState(false);
    const hasUnreadNews = Number.parseInt(localStorage.getItem('skyjo_news_version') || '0', 10) < CURRENT_NEWS_VERSION;
    const showWhatsNew = isNewsManuallyOpen || (allowAutoNews && hasUnreadNews && !hasDismissedAutoNews);
    useEffect(() => { onWhatsNewVisibilityChange?.(showWhatsNew); }, [onWhatsNewVisibilityChange, showWhatsNew]);
    useEffect(() => () => onWhatsNewVisibilityChange?.(false), [onWhatsNewVisibilityChange]);

    const validName = name => !!name.trim() && name.trim().toLowerCase() !== 'joueur';
    const startReal = (draft = players) => {
        playStart();
        setConfiguration(draft.map(({ name, avatarId }) => ({ name: name.trim(), avatarId })), 100);
    };
    const handleStart = () => {
        if (players.some(player => !validName(player.name))) {
            setPendingQuickStart(false); setShowPseudoModal(true); return;
        }
        startReal();
    };
    const handleVirtualAction = action => {
        if (action === 'quick' && !useVirtualGameStore.getState().gameState && !validName(useGameStore.getState().userProfile.name || '')) {
            setPendingQuickStart(true); setShowPseudoModal(true); return;
        }
        playClick();
        onVirtualAction?.(action);
    };
    const addPlayer = () => {
        if (players.length >= 8) return;
        const draftId = nextDraftId.current++;
        setPlayers(previous => [...previous, { name: '', avatarId: AVATARS[previous.length % AVATARS.length].id, draftId }]);
    };
    const changePlayer = (index, fields) => setPlayers(previous => previous.map((player, i) => i === index ? { ...player, ...fields } : player));

    return <div className={`home-lobby home-lobby--${mode}`}>
        <header className="lobby-header">
            <h1 className="lobby-brand" aria-label="SKYJO">
                <span className="lobby-brand-mark" aria-hidden="true"><i/><i/><i/></span>
                <span aria-hidden="true">SKYJO</span>
            </h1>
            <div className="lobby-header-actions">
                <button type="button" className="lobby-player-chip" aria-label={`Profil · ${careerLabel} · ${currentXP || 0} sur 10 XP`} onClick={() => onNavigate?.('profile')} style={{ '--xp': `${xpPercent}%` }}>
                    <span className="lobby-player-chip-ring"><img src={getAvatarPath(profileAvatar || 'frog')} alt=""/></span>
                    <span className="lobby-player-chip-level">{level || 1}</span>
                </button>
                <button type="button" aria-label={hasNotification ? 'Notifications sociales non lues' : 'Notifications sociales'} onClick={() => onNavigate?.('social')}><Bell size={21} aria-hidden="true"/>{hasNotification && <i/>}</button>
                <button type="button" aria-label="Paramètres" onClick={() => onNavigate?.('settings')}><Settings size={21} aria-hidden="true"/></button>
            </div>
        </header>
        <div className="lobby-mode-switch" role="group" aria-label="Mode de jeu">
            <button type="button" aria-pressed={mode === 'real'} onClick={() => { playClick(); setMode('real'); }}><Users size={20} aria-hidden="true"/><span>Édition réelle</span></button>
            <button type="button" aria-pressed={mode === 'virtual'} onClick={() => { playClick(); setMode('virtual'); }}><Gamepad2 size={22} aria-hidden="true"/><span>Virtuel</span></button>
        </div>
        <section className="lobby-hero" aria-labelledby="lobby-mode-title">
            <div className="lobby-hero-copy"><h2 id="lobby-mode-title" className={mode === 'virtual' ? 'sr-only' : undefined}>{mode === 'virtual' ? 'Skyjo virtuel' : 'Vos cartes, nos calculs.'}</h2>{mode === 'real' && <p>Jusqu’à 8 joueurs, partie en 100 points.</p>}</div>
            <HomeWorldScene compact={mode === 'real'}/>
        </section>
        <AnimatePresence mode="wait" initial={false}><Motion.div key={mode} className="lobby-mode-content" initial={reducedMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 0 }} transition={{ duration: reducedMotion ? 0 : .14 }}>
            {mode === 'virtual' ? <HomeVirtualActions onAction={handleVirtualAction}/> : <HomePlayerList players={players} onNameChange={(index, name) => changePlayer(index, { name })} onAvatar={setOpenAvatarSelector} onAdd={addPlayer} onRemove={index => { if (players.length > 2) setPlayers(previous => previous.filter((_, i) => i !== index)); }}/>}
            {mode === 'virtual'
                ? null
                : <>
                    <Motion.button type="button" className="lobby-launch" whileTap={reducedMotion ? {} : { scale: .98 }} onClick={handleStart}>
                        <Play size={21} fill="currentColor" aria-hidden="true"/>Lancer la partie
                    </Motion.button>
                </>}
        </Motion.div></AnimatePresence>
        <footer className="lobby-footer">
            {showGuide && <button type="button" onClick={onOpenTutorial}><HelpCircle size={15} aria-hidden="true"/>Guide</button>}
            <button type="button" onClick={() => { setIsNewsManuallyOpen(true); localStorage.setItem('skyjo_news_version', CURRENT_NEWS_VERSION.toString()); }}><ScrollText size={15} aria-hidden="true"/>Nouveautés{hasUnreadNews && <span className="lobby-unread"/>}</button>
            <button type="button" className="lobby-version" onClick={checkForUpdates} disabled={isChecking} aria-label={isChecking ? 'Recherche de mise à jour' : `Version ${__APP_VERSION__} · rechercher une mise à jour`}>{checkResult === 'update-available' ? <Zap size={13} aria-hidden="true"/> : checkResult === 'up-to-date' ? <Check size={13} aria-hidden="true"/> : <RefreshCw size={13} className={isChecking ? 'animate-spin' : ''} aria-hidden="true"/>}{isChecking ? 'Recherche…' : checkResult === 'update-available' ? 'Mise à jour disponible' : `v${__APP_VERSION__}`}</button>
            <InstallPWA className="lobby-install"/>
        </footer>
        <AvatarSelector isOpen={openAvatarSelector !== null} onClose={() => setOpenAvatarSelector(null)} selectedId={openAvatarSelector !== null ? players[openAvatarSelector]?.avatarId : null} onSelect={avatarId => { changePlayer(openAvatarSelector, { avatarId }); setOpenAvatarSelector(null); }}/>
        <WhatsNewModal isOpen={showWhatsNew} onClose={() => { setIsNewsManuallyOpen(false); setHasDismissedAutoNews(true); if (hasUnreadNews) localStorage.setItem('skyjo_news_version', CURRENT_NEWS_VERSION.toString()); }}/>
        <PseudoModal isOpen={showPseudoModal} onClose={() => { setShowPseudoModal(false); setPendingQuickStart(false); }} initialValue={pendingQuickStart ? useGameStore.getState().userProfile.name || '' : players[0]?.name || ''} onConfirm={newPseudo => {
            setShowPseudoModal(false); updateUserProfile({ name: newPseudo });
            if (pendingQuickStart) { setPendingQuickStart(false); onVirtualAction?.('quick'); return; }
            const updated = players.map((player, i) => i === 0 ? { ...player, name: newPseudo } : player);
            setPlayers(updated);
            if (updated.every(player => validName(player.name))) startReal(updated);
        }}/>
    </div>;
}
