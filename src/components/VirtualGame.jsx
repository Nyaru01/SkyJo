import { createPortal } from 'react-dom';
import { describeAiMove } from '../lib/aiMoveText';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Users, ArrowLeft, RotateCcw, RefreshCw, Trophy, Info, HelpCircle, Sparkles, CheckCircle, BookOpen, X, Bot, Lock, Image as ImageIcon, Palette, Copy, Share2, Wifi, Globe, Plus, ChevronRight, WifiOff, Music, Music2, Leaf, Swords, Skull, Gem, SkipForward, Pause, PlayCircle, Star, Zap, Award, QrCode, Flame } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import toast from 'react-hot-toast'; 
import confetti from 'canvas-confetti';
// Removed custom Toast import to avoid confusion
import ConfirmModal from './ui/ConfirmModal';
import PlayerHand from './virtual/PlayerHand';
import { DEAL_TOTAL_MS } from '../lib/dealTiming';
import DrawDiscard from './virtual/DrawDiscard';
import DrawDiscardPopup from './virtual/DrawDiscardPopup';
import DrawDiscardTrigger from './virtual/DrawDiscardTrigger';
import CardAnimationLayer from './virtual/CardAnimationLayer';
import SkyjoCard from './virtual/SkyjoCard';
import HostLeftOverlay from './virtual/HostLeftOverlay';
import OnlineStartCountdown from './virtual/OnlineStartCountdown';
import ChestRevelationOverlay from './virtual/ChestRevelationOverlay';
import RoundResultsPlayers from './virtual/RoundResultsPlayers';
import AISetupScreen from './virtual/AISetupScreen';
import GameMessageBanner from './virtual/GameMessageBanner';
import DrawReactionBubble from './virtual/DrawReactionBubble';
import SwapReveal from './virtual/SwapReveal';
import { FuryRail, FuryTargetBanner, FuryEffects, FuryAmbience, FuryRulesModal } from './virtual/FuryUI';
import { TourmentIcon, FuryIcon } from './virtual/ModeIcons';
import { FURY_TYPES } from '../lib/furyEngine';
import { fitCardsRef } from '../lib/fitCards';
import ExperienceBar from './ExperienceBar';
import SkinCarousel from './SkinCarousel';
import { useVirtualGameStore, selectAIMode, selectAIPlayers, selectIsCurrentPlayerAI, selectIsAIThinking } from '../store/virtualGameStore';
import { useOnlineGameStore } from '../store/onlineGameStore';
import { useSocialStore } from '../store/socialStore';
import { useGameStore } from '../store/gameStore';
import { calculateFinalScores } from '../lib/skyjoEngine';
import { AI_DIFFICULTY, chooseInitialCardsToReveal } from '../lib/skyjoAI';
import { useFeedback } from '../hooks/useFeedback';
// import { useBackgroundMusic } from '../hooks/useBackgroundMusic';
import { useNotifications } from '../hooks/useNotifications';
import { cn } from '../lib/utils';
import { getCardSkinRequiredLevel } from '../lib/skinUtils';
import { getActiveWeeklyChallenge, getGameChallenge, getWeeklyChallengeById, hasChallengeObjective, hasBestRoundScore } from '../lib/weeklyChallenge';
import { SeasonalResult } from './ui/SeasonalChallengeButton';
import { getTourmentPerformance, getFuryPerformance } from '../lib/tourmentPerformance';

import { AVATARS, getAvatarPath, handleAvatarError } from '../lib/avatars';
import AvatarSelector from './AvatarSelector';
import PseudoModal from './PseudoModal';
import BonusTutorial from './BonusTutorial';
import Tutorial from './Tutorial';
import SkyjoLoader from './SkyjoLoader';
import '../styles/OnlineLobby.css';
import '../styles/GameOver.css';
import { PremiumTiltButton } from './ui/PremiumTiltButton';

// Player colors for avatars

// Player colors for avatars
const PLAYER_EMOJIS = ['🐱', '🐶', '🦊', '🐻', '🐼', '🦁', '🐸', '🐵', '🦄', '🐲'];
const PLAYER_COLORS = ['🐱', '🐶', '🦊', '🐻', '🐼', '🦁', '🐸', '🐵']; // Backward compat for local

// ChestRevelationOverlay moved to ./virtual/ChestRevelationOverlay.jsx

/**
 * Virtual Vesper Game Component
 * Main component for playing virtual Vesper locally
 */
export default function VirtualGame({ screen: controlledScreen, defaultScreen = 'menu', onBackToMenu, onScreenChange }) {
    const [localScreen, setLocalScreen] = useState(defaultScreen);
    const screen = controlledScreen ?? localScreen;
    const setScreen = onScreenChange ?? setLocalScreen;
    const isStarting = useOnlineGameStore(state => screen === 'lobby' && state.gameStarted && !!state.gameState);
    const openTable = useCallback(() => setScreen('game'), [setScreen]);

    return (
        <>
            <VirtualGameScreen screen={screen} setScreen={setScreen} onBackToMenu={onBackToMenu} />
            <OnlineStartCountdown active={isStarting} onComplete={openTable} />
        </>
    );
}

function VirtualGameScreen({ screen, setScreen, onBackToMenu }) {
    // 1. Data Stores
    const userProfile = useGameStore(state => state.userProfile);
    const updateUserProfile = useGameStore(state => state.updateUserProfile);
    const setPlayerInfo = useOnlineGameStore(s => s.setPlayerInfo);
    const createRoom = useOnlineGameStore(s => s.createRoom);
    const joinRoom = useOnlineGameStore(s => s.joinRoom);
    const startOnlineGame = useOnlineGameStore(s => s.startGame);
    const startOnlineNextRound = useOnlineGameStore(s => s.startNextRound);
    const forceOnlineNextRound = useOnlineGameStore(s => s.forceNextRound);
    const onlineTimeoutExpired = useOnlineGameStore(s => s.timeoutExpired);
    const emitGameAction = useOnlineGameStore(s => s.emitGameAction);
    const selectOnlineCard = useOnlineGameStore(s => s.selectCard);

    const { friends, fetchFriends, inviteFriend } = useSocialStore();
    const onlineCrowd = useSocialStore(s => s.onlinePlayers);
    const fetchOnlinePlayers = useSocialStore(s => s.fetchOnlinePlayers);

    // 2. Local State
    const [chestsRevealed, setChestsRevealed] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [players, setPlayers] = useState([
        { name: userProfile?.name || 'Joueur', avatarId: userProfile?.avatarId || 'cat' },
        { name: '', avatarId: 'dog' },
    ]);

    // Fetch friends when entering multiplayer lobby
    useEffect(() => {
        if (screen === 'lobby' && userProfile?.id) {
            fetchFriends(String(userProfile.id));
        }
    }, [screen, userProfile?.id, fetchFriends]);
    const [openAvatarSelector, setOpenAvatarSelector] = useState(null);
    const [localPlayerIndex, setLocalPlayerIndex] = useState(0);
    const [initialReveals, setInitialReveals] = useState({});
    const [isActionPending, setIsActionPending] = useState(false); // For online loading states
    const [showBonusRules, setShowBonusRules] = useState(false);
    const [rulesMode, setRulesMode] = useState('tourment'); // tourment or hardcore
    const [showPseudoModal, setShowPseudoModal] = useState(false);
    const [pendingStartAction, setPendingStartAction] = useState(null); // 'ai' or 'local'
    const hasArchivedOnlineRef = useRef(false);

    const gameState = useVirtualGameStore((s) => s.gameState);
    const totalScores = useVirtualGameStore((s) => s.totalScores);
    const roundNumber = useVirtualGameStore((s) => s.roundNumber);
    const isGameOver = useVirtualGameStore((s) => s.isGameOver);
    const gameWinner = useVirtualGameStore((s) => s.gameWinner);
    const onlineRedirection = useOnlineGameStore(s => s.redirectionState);
    const startLocalGame = useVirtualGameStore((s) => s.startLocalGame);

    const revealInitial = useVirtualGameStore((s) => s.revealInitial);
    const drawFromDrawPile = useVirtualGameStore((s) => s.drawFromDrawPile);
    const takeFromDiscard = useVirtualGameStore((s) => s.takeFromDiscard);
    const replaceHandCard = useVirtualGameStore((s) => s.replaceHandCard);
    const discardAndRevealCard = useVirtualGameStore((s) => s.discardAndRevealCard);
    const discardDrawnCard = useVirtualGameStore((s) => s.discardDrawnCard);
    const revealHiddenCard = useVirtualGameStore((s) => s.revealHiddenCard);
    const resetGame = useVirtualGameStore((s) => s.resetGame);
    const rematch = useVirtualGameStore((s) => s.rematch);
    const endRound = useVirtualGameStore((s) => s.endRound);
    const startNextRound = useVirtualGameStore((s) => s.startNextRound);
    const getFinalScores = useVirtualGameStore((s) => s.getFinalScores);
    const performSwap = useVirtualGameStore((s) => s.performSwap);
    const setShowingGame = useVirtualGameStore(s => s.setShowingGame);

    // Pause & Persistence state
    const isPaused = useVirtualGameStore(s => s.isPaused);
    const setPaused = useVirtualGameStore(s => s.setPaused);
    const togglePause = useVirtualGameStore(s => s.togglePause);

    // Notifications
    const virtualLastNotification = useVirtualGameStore((s) => s.lastNotification);
    const [swapReveal, setSwapReveal] = useState(null);
    const [furySelect, setFurySelect] = useState(null);
    const [furyRulesOpen, setFuryRulesOpen] = useState(false);
    const hasSeenFuryIntro = useGameStore(s => s.hasSeenFuryIntroV1);
    const setHasSeenFuryIntro = useGameStore(s => s.setHasSeenFuryIntro);
    const playFuryCard = useVirtualGameStore((s) => s.playFuryCard);
    const clearNotification = useVirtualGameStore((s) => s.clearNotification);
    const virtualPendingAnimation = useVirtualGameStore(s => s.pendingAnimation);
    const isDailyChallenge = useVirtualGameStore(s => s.isDailyChallenge);
    const clearVirtualPendingAnimation = useVirtualGameStore(s => s.clearPendingAnimation);
    const instruction = useVirtualGameStore(s => s.instruction);
    const setInstruction = useVirtualGameStore(s => s.setInstruction);

    // AI Store
    const startAIGame = useVirtualGameStore((s) => s.startAIGame);
    const executeAITurn = useVirtualGameStore((s) => s.executeAITurn);
    const setAIThinking = useVirtualGameStore((s) => s.setAIThinking);
    const aiMode = useVirtualGameStore(selectAIMode);
    const aiPlayers = useVirtualGameStore(selectAIPlayers);
    const isCurrentPlayerAI = useVirtualGameStore(selectIsCurrentPlayerAI);
    const isAIThinking = useVirtualGameStore(selectIsAIThinking);
    const aiDifficulty = useVirtualGameStore((s) => s.aiDifficulty);
    const virtualIsBonusMode = useVirtualGameStore((s) => s.isBonusMode);
    const drawnCardSource = useVirtualGameStore(s => s.drawnCardSource);
    const challengeJustWon = useVirtualGameStore(s => s.challengeJustWon);
    const clearChallengeWon = useVirtualGameStore(s => s.clearChallengeWon);
    const onlineDrawnCardSource = useOnlineGameStore(s => s.drawnCardSource);



    // Online Store
    const isOnlineConnected = useOnlineGameStore(s => s.isConnected);
    const onlineGameState = useOnlineGameStore(s => s.gameState);
    const onlinePlayers = useOnlineGameStore(s => s.players);
    const onlineTotalScores = useOnlineGameStore(s => s.totalScores);
    const onlineRoundNumber = useOnlineGameStore(s => s.roundNumber);
    const onlineGameStarted = useOnlineGameStore(s => s.gameStarted);
    const onlineIsGameOver = useOnlineGameStore(s => s.isGameOver);
    const onlineGameWinner = useOnlineGameStore(s => s.gameWinner);
    const onlineError = useOnlineGameStore(s => s.error);
    const onlineRoomCode = useOnlineGameStore(s => s.roomCode);
    // Joueurs en ligne : rafraîchis toutes les 15 s tant que le menu « Jouer en ligne » est ouvert.
    useEffect(() => {
        if (screen !== 'lobby' || onlineRoomCode) return undefined;
        fetchOnlinePlayers();
        const id = setInterval(fetchOnlinePlayers, 15000);
        return () => clearInterval(id);
    }, [screen, onlineRoomCode, fetchOnlinePlayers]);
    const onlineIsHost = useOnlineGameStore(s => s.isHost);
    const publicRooms = useOnlineGameStore(s => s.publicRooms);
    const socketId = useOnlineGameStore(s => s.socketId);
    const onlineLastNotificationRaw = useOnlineGameStore(s => s.lastNotification);
    const clearOnlineNotification = useOnlineGameStore(s => s.clearOnlineNotification);
    const lastAction = useOnlineGameStore(s => s.lastAction);
    const onlinePendingAnimation = useOnlineGameStore(s => s.pendingAnimation);
    const clearOnlinePendingAnimation = useOnlineGameStore(s => s.clearPendingAnimation);
    const onlineReadyStatus = useOnlineGameStore(s => s.readyStatus);
    const getSocketId = useOnlineGameStore(s => s.getSocketId);
    const onlineGameMode = useOnlineGameStore(s => s.gameMode);
    const setOnlineGameMode = useOnlineGameStore(s => s.setGameMode);
    const onlineIsPaused = useOnlineGameStore(s => s.isPaused);
    const toggleOnlinePause = useOnlineGameStore(s => s.togglePause);

    // 🔥 AUTO-REDIRECTION TO HOME AFTER DISCONNECT
    const prevRedirectionActive = useRef(false);
    useEffect(() => {
        if (prevRedirectionActive.current && !onlineRedirection.active && !onlineGameStarted) {
            console.log("[VG] Automatic redirection finished, returning to home...");
            if (onBackToMenu) onBackToMenu();
        }
        prevRedirectionActive.current = onlineRedirection.active;
    }, [onlineRedirection.active, onlineGameStarted, onBackToMenu]);

    // Main game store for archiving
    const archiveOnlineGame = useGameStore(s => s.archiveOnlineGame);
    const playerLevel = useGameStore(s => s.level);
    const playerCardSkin = useGameStore(s => s.cardSkin);
    const hasSeenTourmentPerformanceGoal = useGameStore(s => s.hasSeenTourmentPerformanceGoalV1);
    const setHasSeenTourmentPerformanceGoal = useGameStore(s => s.setHasSeenTourmentPerformanceGoal);
    const hasSeenFuryPerformanceGoal = useGameStore(s => s.hasSeenFuryPerformanceGoalV1);
    const setHasSeenFuryPerformanceGoal = useGameStore(s => s.setHasSeenFuryPerformanceGoal);

    // --- GAME LOGIC CONSOLIDATION (PRE-RENDER) ---
    // Moved here to satisfy Rules of Hooks (must be before any early returns)

    // 1. Identify active game state and basic properties
    const activeGameState = onlineGameStarted ? onlineGameState : gameState;
    const isOnlineMode = onlineGameStarted || screen === 'lobby';
    const activeRoundNumber = onlineGameStarted ? onlineRoundNumber : roundNumber;
    const isGameOverState = onlineGameStarted ? onlineIsGameOver : isGameOver;
    const effectiveIsBonusMode = onlineGameStarted ? (onlineGameMode === 'bonus') : virtualIsBonusMode;
    const activeDrawnCardSource = onlineGameStarted ? onlineDrawnCardSource : drawnCardSource;
    const activeTotalScores = onlineGameStarted ? onlineTotalScores : totalScores;
    const activeIsPaused = onlineGameStarted ? onlineIsPaused : isPaused;
    const activeGameWinner = onlineGameStarted ? onlineGameWinner : gameWinner;
    const showTourmentPerformanceGoal = screen === 'game'
        && !!activeGameState
        && effectiveIsBonusMode
        && !hasSeenTourmentPerformanceGoal;
    // Fury : même principe de rang de performance, présenté une fois, après les règles Fury.
    const showFuryPerformanceGoal = screen === 'game'
        && !!activeGameState?.isFuryMode
        && hasSeenFuryIntro
        && !hasSeenFuryPerformanceGoal;
    const performanceGoal = showTourmentPerformanceGoal ? {
        key: 'tourment', title: 'Objectif Tourment',
        text: 'Les règles restent identiques. À chaque victoire longue, votre score final détermine maintenant votre rang de performance.',
        tiles: [['amber', 'Score positif', 'Victoire de justesse'], ['sky', '0 à −49', 'Bon début'], ['sage', '−50 à −99', 'Maîtrise du Tourment'], ['violet', '−100 ou moins', 'Domination absolue']],
        close: () => setHasSeenTourmentPerformanceGoal(true),
    } : showFuryPerformanceGoal ? {
        key: 'fury', title: 'Objectif Fury',
        text: 'À chaque victoire longue (jusqu’à 100 points), votre score final détermine votre rang de performance.',
        tiles: [['amber', 'Plus de 60', 'Victoire de justesse'], ['sky', '36 à 60', 'Belle victoire'], ['sage', '11 à 35', 'Maîtrise de la Fury'], ['violet', '10 ou moins', 'Domination absolue']],
        close: () => setHasSeenFuryPerformanceGoal(true),
    } : null;

    // 2. Calculate the local player's index in the game state
    // In online mode, try to find by socket.id first, then fallback to dbId (for reconnects)
    const currentSocketId = (getSocketId?.() || socketId);
    let myPlayerIndex = 0;
    let showSyncIssue = false;

    if (isOnlineMode && activeGameState) {
        const playersList = activeGameState.players || [];
        // Robust lookup: check id, dbId, or socketId
        myPlayerIndex = playersList.findIndex(p =>
            p.id === currentSocketId ||
            (p.dbId && userProfile?.id && String(p.dbId) === String(userProfile.id)) ||
            (p.socketId && p.socketId === currentSocketId) ||
            (p.id && userProfile?.id && String(p.id) === String(userProfile.id))
        );

        if (myPlayerIndex === -1 && screen === 'game') {
            showSyncIssue = true;
        }
    }

    // 3. Derived indices and state flags
    const opponentIndex = myPlayerIndex === 0 ? 1 : 0;
    const currentPlayer = activeGameState?.players?.[activeGameState?.currentPlayerIndex];
    const isInitialReveal = activeGameState?.phase === 'INITIAL_REVEAL';
    const isFinished = activeGameState?.phase === 'FINISHED' || (activeGameState?.phase === 'REVEALING_CHESTS' && chestsRevealed);
    // Temps de jeu : compté par tranches de 15 s quand une partie est affichée à l'écran.
    const isPlayingNow = screen === 'game' && !!activeGameState && !isFinished && !isGameOverState;
    useEffect(() => {
        if (!isPlayingNow) return undefined;
        const id = setInterval(() => {
            if (document.visibilityState === 'visible') useGameStore.getState().addPlayTime(15000);
        }, 15000);
        return () => clearInterval(id);
    }, [isPlayingNow]);
    // Fin de manche : on laisse voir le plateau final, il s'assombrit, puis le bilan apparaît en fondu.
    const [resultsReady, setResultsReady] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setResultsReady(isFinished), isFinished ? 2300 : 0);
        return () => clearTimeout(t);
    }, [isFinished]);
    const discardTop = activeGameState?.discardPile?.[activeGameState?.discardPile?.length - 1];
    const isMyTurn = !isInitialReveal && activeGameState?.currentPlayerIndex === myPlayerIndex;
    // Mode Fury (contre l'IA uniquement pour l'instant)
    // Fury contre l'IA comme en ligne : c'est l'état de la partie qui le dit.
    const furyOn = Boolean(activeGameState?.isFuryMode);
    const furyCanPlay = furyOn && isMyTurn && activeGameState?.phase === 'PLAYING' && activeGameState?.turnPhase === 'DRAW' && (activeGameState?.players[myPlayerIndex]?.fury?.used || 0) < 3;
    const furyActiveType = furyCanPlay && furySelect !== null ? activeGameState.players[myPlayerIndex].fury.reserve[furySelect]?.furyType || null : null;
    const isOpponentTurn = !isInitialReveal && activeGameState?.currentPlayerIndex === opponentIndex;

    // Online Actions
    const connectOnline = useOnlineGameStore(s => s.connect);
    const disconnectOnline = useOnlineGameStore(s => s.disconnect);
    const leaveRoom = useOnlineGameStore(s => s.leaveRoom);


    // Enforce Level Requirements for Skins
    useEffect(() => {
        if (playerLevel < getCardSkinRequiredLevel(playerCardSkin)) {
            // Keep persisted selections valid if a profile is restored at a lower level.
            useGameStore.getState().setCardSkin('classic');
        }
    }, [playerLevel, playerCardSkin]);

    // Force scroll to top on game mount to avoid 1-2mm shift
    useEffect(() => {
        console.log("[VG] Component MOUNTED");
        const timer = setTimeout(() => {
            window.scrollTo(0, 0);
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
        }, 100);
        return () => {
            console.log("[VG] Component UNMOUNTED");
            clearTimeout(timer);
        };
    }, []);

    // Sync showing game state for Music Player
    useEffect(() => {
        setShowingGame(screen === 'game' || screen === 'scores');
    }, [screen, setShowingGame]);


    // Handle Visibility Change for Auto-Pause (AI Games only)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && screen === 'game' && aiMode && !isPaused && gameState && gameState.phase !== 'FINISHED') {
                console.log("[VG] Tab hidden, auto-pausing game...");
                setPaused(true);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [screen, aiMode, isPaused, gameState, setPaused]);

    // Local State for Lobby
    const [lobbyCode, setLobbyCode] = useState('');
    const [myPseudo, setMyPseudo] = useState(() => userProfile?.name || localStorage.getItem('skyjo_player_pseudo') || '');
    const [myAvatarId, setMyAvatarId] = useState(() => userProfile?.avatarId || localStorage.getItem('skyjo_player_avatar_id') || 'cat');
    // Removed local notification state
    const [hasPlayedVictory, setHasPlayedVictory] = useState(false);
    const [showRulesModal, setShowRulesModal] = useState(false);
    const [drawDiscardPopup, setDrawDiscardPopup] = useState(null);
    const showDrawDiscardPopup = drawDiscardPopup === 'choose'
        || (drawDiscardPopup === 'drawn' && !!activeGameState?.drawnCard);
    const [isNextRoundPending, setIsNextRoundPending] = useState(false);
    const [showBonusTutorial, setShowBonusTutorial] = useState(false);

    // Reset pending state when new round starts (phase becomes INITIAL_REVEAL)
    useEffect(() => {
        if (onlineGameState?.phase === 'INITIAL_REVEAL') {
            setIsNextRoundPending(false);
            setInitialReveals({});
        }
    }, [onlineGameState?.phase]);

    // Filet de sécurité : si le serveur ignore une action (hors tour, en double), aucune mise à jour n'arrive :
    // on libère le verrou au bout de 3 s pour ne jamais bloquer le joueur.
    useEffect(() => {
        if (!isActionPending) return undefined;
        const t = setTimeout(() => setIsActionPending(false), 3000);
        return () => clearTimeout(t);
    }, [isActionPending]);

    // Reset action pending when game state or last action updates
    useEffect(() => {
        if (isActionPending) {
            setIsActionPending(false);
        }
    }, [activeGameState, lastAction]);

    // Une pioche rejetée ou expirée ne doit pas ouvrir la fenêtre au prochain tour.
    useEffect(() => {
        if (drawDiscardPopup === 'drawn' && !activeGameState?.drawnCard && !isActionPending) {
            setDrawDiscardPopup(null);
        }
    }, [drawDiscardPopup, activeGameState?.drawnCard, isActionPending]);

    // Reset chestsRevealed when round starts or phase resets
    useEffect(() => {
        if (activeGameState?.phase === 'INITIAL_REVEAL' || activeGameState?.phase === 'PLAYING') {
            setChestsRevealed(false);
        }
    }, [activeGameState?.phase]);

    // AI Config State - Load from localStorage for persistence
    const [aiConfig, setAIConfig] = useState(() => {
        const savedPseudo = localStorage.getItem('skyjo_player_pseudo') || '';
        const savedAvatarId = localStorage.getItem('skyjo_player_avatar_id') || 'cat';
        return {
            playerName: savedPseudo,
            playerAvatarId: savedAvatarId,
            aiCount: 1,
            // Dernier mode choisi par le joueur (retenu d’une visite à l’autre)
            difficulty: [AI_DIFFICULTY.BONUS, AI_DIFFICULTY.FURY].includes(localStorage.getItem('skyjo_last_ai_mode'))
                ? localStorage.getItem('skyjo_last_ai_mode') : AI_DIFFICULTY.BONUS,
        };
    });
    useEffect(() => { try { localStorage.setItem('skyjo_last_ai_mode', aiConfig.difficulty); } catch { /* stockage indisponible */ } }, [aiConfig.difficulty]);

    // Cards shaking state (for invalid actions)
    const [shakingCard, setShakingCard] = useState(null);

    // Swap action state (tracking selections)
    const [swapSelection, setSwapSelection] = useState({ sourceIndex: null, targetPlayerIndex: null, targetCardIndex: null });

    // Feedback sounds and Music
    const {
        playVictory,
        playCardFlip,
        playCardDraw,
        playCardPlace,
        playStartGame,
        playSocialInvite
    } = useFeedback();
    const musicEnabled = useGameStore(state => state.musicEnabled);
    const toggleMusic = useGameStore(state => state.toggleMusic);

    // Browser notifications for lobby
    const { requestPermission, sendNotification, isTabHidden, hasPermission } = useNotifications();

    // Music Hook REMOVED - Logic moved to global MusicPlayer component
    // const {
    //    playRandomTrack
    // } = useBackgroundMusic(screen === 'game' && activeGameState?.phase !== 'FINISHED');


    // 4. Automation & Sync Hooks (Must be before any EARLY RETURNS)

    // Save pseudo and emoji to localStorage when they change
    useEffect(() => {
        if (aiConfig.playerName) {
            localStorage.setItem('skyjo_player_pseudo', aiConfig.playerName);
        }
        if (aiConfig.playerAvatarId) {
            localStorage.setItem('skyjo_player_avatar_id', aiConfig.playerAvatarId);
        }
    }, [aiConfig.playerName, aiConfig.playerAvatarId, userProfile.avatarId]);

    // Also save from online mode
    useEffect(() => {
        if (myPseudo) {
            localStorage.setItem('skyjo_player_pseudo', myPseudo);
        }
        if (myAvatarId) {
            localStorage.setItem('skyjo_player_avatar_id', myAvatarId);
        }
    }, [myPseudo, myAvatarId]);

    // Phase-based instructions automation
    useEffect(() => {
        if (!activeGameState) return;

        // ONLY show top banner for SPECIAL actions (Swap, Black Hole, etc.)
        // Standard gameplay instructions are already shown in the center button

        if (isMyTurn) {
            switch (activeGameState.turnPhase) {
                case 'SPECIAL_ACTION_SWAP':
                    if (swapSelection.sourceIndex === null) {
                        setInstruction("Sélectionnez une de VOS cartes à échanger.");
                    } else {
                        setInstruction("Choisissez maintenant une carte adverse à échanger.");
                    }
                    break;
                case 'RESOLVE_BLACK_HOLE':
                    setInstruction("Cliquez sur l'Action pour aspirer la défausse !");
                    break;
                // Add other special modes here if any
                default:
                    setInstruction(null); // Hide banner for standard phases (DRAW, REPLACE, REVEAL, etc.)
                    break;
            }
        } else {
            // Hide banner when it's not my turn or game finished
            setInstruction(null);
        }
    }, [activeGameState?.turnPhase, activeGameState?.currentPlayerIndex, activeGameState?.phase, isMyTurn, swapSelection.sourceIndex, activeGameState, currentPlayer?.name, setInstruction]);

    // 5. EARLY RETURNS SECTION
    // These returns are safe now because all hooks have been declared.

    // 5. EARLY RETURNS SECTION MOVED TO BOTTOM TO FIX HOOK VIOLATION
    // if (showSyncIssue) { ... } moved to before screen rendering

    // Global Identity Sync: React to userProfile changes
    useEffect(() => {
        if (!userProfile) return;

        // Sync Online Setup State
        if (userProfile.name && userProfile.name !== myPseudo) {
            setMyPseudo(userProfile.name);
        }
        if (userProfile.avatarId && userProfile.avatarId !== myAvatarId) {
            console.log('[DEBUG] Syncing myAvatarId from userProfile:', userProfile.avatarId);
            setMyAvatarId(userProfile.avatarId);
        }

        // Sync Online Store directly
        setPlayerInfo(userProfile.name, userProfile.avatarId);

        // Sync Local Multiplayer/AI State (Player 0)
        setPlayers(prev => {
            if (prev[0].name === userProfile.name && prev[0].avatarId === userProfile.avatarId) {
                return prev;
            }
            const newPlayers = [...prev];
            newPlayers[0] = { ...newPlayers[0], name: userProfile.name, avatarId: userProfile.avatarId };
            return newPlayers;
        });

        // Sync AI Config
        setAIConfig(prev => ({
            ...prev,
            playerName: userProfile.name,
            playerAvatarId: userProfile.avatarId
        }));
    }, [userProfile.name, userProfile.avatarId]);

    useEffect(() => {
        if (virtualLastNotification) {
            // Using global toaster
            const { type, message, swap } = virtualLastNotification;
            if (type === 'swap' && swap) {
                setTimeout(() => setSwapReveal({ ...swap, key: Date.now() }), 0);
                setTimeout(() => setSwapReveal(null), 2800);
            } else if (type === 'error') toast.error(message);
            else if (type === 'success') toast.success(message);
            else toast(message);

            // Auto clear from store to avoid re-triggering
            setTimeout(() => {
                clearNotification();
            }, 100); // Faster clear
        }
    }, [virtualLastNotification, clearNotification]);

    // Online: Sync notifications from store
    useEffect(() => {
        if (onlineLastNotificationRaw) {
            // Using global toaster
            const { type, message } = onlineLastNotificationRaw;
            if (type === 'error') toast.error(message);
            else if (type === 'success') toast.success(message);
            else toast(message); // Default info - No icon

            // If we got an error or info, likely the pending state should be cleared (especially error)
            if (onlineLastNotificationRaw.type === 'error') {
                setIsNextRoundPending(false);
            }
            // Check for sound trigger
            if (onlineLastNotificationRaw.sound === 'join') {
                const audio = new Audio('/Sounds/whoosh-radio-ready-219487.mp3');
                audio.volume = 0.5;
                audio.play().catch(e => console.log('Audio play failed', e)); // Auto-play restrictions

                // Send browser notification if tab is in background
                if (isTabHidden()) {
                    sendNotification('Vesper - Nouveau joueur ! 🎮', {
                        body: onlineLastNotificationRaw.message,
                        tag: 'player-joined', // Prevents duplicate notifications
                        renotify: true
                    });
                }
            }
            // NEW: Clear from store to avoid re-triggering (e.g. when re-entering Virtual Mode)
            setTimeout(() => {
                clearOnlineNotification();
            }, 100);
        }
    }, [onlineLastNotificationRaw, isTabHidden, sendNotification, clearOnlineNotification]);

    // Auto-archive online game on Game Over
    // We use a ref to prevent double-archiving in the same mounting cycle if store updates slowly
    // (hasArchivedOnlineRef is declared at the top of the component)

    // Reset ref when game starts
    useEffect(() => {
        if (onlineGameStarted && !onlineIsGameOver) {
            hasArchivedOnlineRef.current = false;
        }
    }, [onlineGameStarted, onlineIsGameOver]);
    // Toasts pour le pause en ligne
    const prevOnlineIsPaused = useRef(onlineIsPaused);

    useEffect(() => {
        if (onlineGameStarted && isGameOver === false) {
            // Only toast if the paused state actually changed
            if (prevOnlineIsPaused.current !== onlineIsPaused) {
                if (onlineIsPaused) {
                    toast("Partie en pause", {
                        icon: '⏸️',
                        style: {
                            borderRadius: '10px',
                            background: '#333',
                            color: '#fff',
                        },
                    });
                } else {
                    toast("Partie reprise", {
                        icon: '▶️',
                        style: {
                            borderRadius: '10px',
                            background: '#333',
                            color: '#fff',
                        },
                    });
                }
                prevOnlineIsPaused.current = onlineIsPaused;
            }
        } else {
            // Reset ref if game is not started, so it's ready for next game
            prevOnlineIsPaused.current = onlineIsPaused;
        }
    }, [onlineIsPaused, onlineGameStarted, isGameOver]);

    useEffect(() => {
        if (onlineGameStarted && !onlinePlayers.find(p => p.isHost)) {
            toast.error("L'hôte s'est déconnecté. Redirection...");
            setTimeout(() => {
                handleBackToMenu(true);
            }, 3000);
        }
    }, [onlinePlayers, onlineGameStarted]);

    useEffect(() => {
        if (onlineIsGameOver && onlineGameStarted && onlinePlayers.length > 0 && !hasArchivedOnlineRef.current) {
            console.log("Auto-archiving online game results...");
            hasArchivedOnlineRef.current = true;
            archiveOnlineGame({
                players: onlinePlayers,
                totalScores: onlineTotalScores,
                winner: onlineGameWinner,
                roundsPlayed: onlineRoundNumber
            });
        }
    }, [onlineIsGameOver, onlineGameStarted, onlinePlayers, onlineTotalScores, onlineGameWinner, onlineRoundNumber, archiveOnlineGame]);

    // Reset pending state when round number changes
    useEffect(() => {
        setIsNextRoundPending(false);
        setInitialReveals({}); // Clear any previous round's initial reveals
    }, [onlineRoundNumber]);

    // Return to lobby when online game is cancelled (host quits)
    useEffect(() => {
        // Improved check: If we're on the game screen but have no online game AND no local game
        // and no room code (meaning we fully disconnected), go back to menu.
        // IMPORTANT: Do NOT redirect if there is an error pending (HostLeftOverlay needs to show)
        if (screen === 'game' && !onlineGameStarted && !gameState && !onlineRoomCode && !onlineError) {
            console.log("[VG] Resetting to menu (no game, no room)");
            setScreen('menu');
            if (onBackToMenu) onBackToMenu();
        }

        // Also handle legacy case where we might still have roomCode but game stopped
        if (screen === 'game' && onlineRoomCode && !onlineGameStarted && !onlineIsGameOver && !onlineError) {
            console.log("[VG] Resetting to menu (game stopped but room active)");
            setScreen('menu');
            if (onBackToMenu) onBackToMenu();
        }
    }, [onlineGameStarted, onlineIsGameOver, onlineRoomCode, screen, gameState, onlineError, onBackToMenu, setScreen]);

    // Handle Visibility Change for Auto-Pause (AI Games only)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && screen === 'game' && aiMode && !isPaused && gameState && gameState.phase !== 'FINISHED') {
                console.log("[VG] Tab hidden, auto-pausing game...");
                setPaused(true);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [screen, aiMode, isPaused, gameState, setPaused]);

    // Determine if game is finished (for sound effect)
    const activeGameStateForEffect = onlineGameStarted ? onlineGameState : gameState;
    const isGameFinished = activeGameStateForEffect?.phase === 'FINISHED';

    // Play victory sound when game finishes
    useEffect(() => {
        if (isGameFinished && !hasPlayedVictory) {
            playVictory();
            setHasPlayedVictory(true);
        }
        // Reset flag when game restarts (not finished anymore)
        if (!isGameFinished && hasPlayedVictory) {
            setHasPlayedVictory(false);
        }
    }, [isGameFinished, hasPlayedVictory, playVictory]);

    // Track if we've archived the current online game
    const [hasArchivedOnline, setHasArchivedOnline] = useState(false);

    // Track if we've archived the current AI/local game
    // Track if we've archived the current AI/local game (REMOVED: handled manually now)
    const archiveVirtualGame = useGameStore(s => s.archiveVirtualGame);
    const addXP = useGameStore(s => s.addXP);
    const gameMode = useVirtualGameStore(s => s.gameMode);

    // Track last game we awarded XP for to prevent duplicates
    const lastAwardedGameRef = useRef(null);

    // Archive online game when it ends
    useEffect(() => {
        if (onlineIsGameOver && onlineGameStarted && !hasArchivedOnline) {
            console.log(`[XP-DEBUG] Online Game Over. Winner: ${onlineGameWinner?.name} (${onlineGameWinner?.id})`);

            archiveOnlineGame({
                players: onlinePlayers,
                totalScores: onlineTotalScores,
                winner: onlineGameWinner,
                roundsPlayed: onlineRoundNumber
            });

            // Award XP if human won the online game
            const myDbId = useGameStore.getState().userProfile?.id;

            // Only award if we haven't awarded for this game yet (using onlineRoomCode as unique ID)
            if (onlineGameWinner && myDbId && (String(onlineGameWinner.id) === String(myDbId))) {
                if (lastAwardedGameRef.current !== onlineRoomCode) {
                    console.log(`[XP-DEBUG] ✅ GAME XP AWARDED (Room: ${onlineRoomCode})`);
                    addXP(5); // Now giving 5 XP for winning a full game
                    lastAwardedGameRef.current = onlineRoomCode;
                }
            }

            setHasArchivedOnline(true);
        }

        // Reset when starting a new game
        if (!onlineIsGameOver && hasArchivedOnline) {
            setHasArchivedOnline(false);
        }
    }, [onlineIsGameOver, onlineGameStarted, hasArchivedOnline, onlinePlayers, onlineTotalScores, onlineGameWinner, onlineRoundNumber, archiveOnlineGame, socketId, addXP, onlineRoomCode]);

    // Track last round we awarded XP for to prevent duplicates
    const lastAwardedRoundRef = useRef(0);

    // Award XP for winning an online ROUND
    useEffect(() => {
        // Accept both FINISHED and REVEALING_CHESTS (bonus mode with chests)
        if (!onlineGameStarted || !onlineGameState || (onlineGameState.phase !== 'FINISHED' && onlineGameState.phase !== 'REVEALING_CHESTS')) {
            return;
        }

        const currentRound = onlineRoundNumber;

        // Only proceed if we haven't processed this round yet
        if (lastAwardedRoundRef.current === currentRound) {
            return;
        }

        // Calculate results for this round
        const roundResults = calculateFinalScores(onlineGameState);
        if (!roundResults || roundResults.length === 0) {
            return;
        }

        // Find the lowest score in this round
        const sortedResults = [...roundResults].sort((a, b) => a.finalScore - b.finalScore);
        const roundWinnerScore = sortedResults[0].finalScore;

        // Check if WE are one of the winners (lowest score)
        // In online mode, match by dbId (persistent ID), NOT socketId (transient socket.io ID)
        const myDbIdForRound = useGameStore.getState().userProfile?.id;
        const myResult = roundResults.find(r => String(r.playerId) === String(myDbIdForRound));

        if (myResult && myResult.finalScore === roundWinnerScore) {
            // We won (or tied for win) the round!
            addXP(1);
            console.log(`[XP-DEBUG] ✅ XP AWARDED for Round ${currentRound}!`);
        }

        // Mark this round as processed
        lastAwardedRoundRef.current = currentRound;

    }, [onlineGameStarted, onlineGameState, onlineRoundNumber, socketId, addXP]);

    // Reset awarded round tracker when game restarts
    useEffect(() => {
        if (!onlineGameStarted) {
            lastAwardedRoundRef.current = 0;
        }
    }, [onlineGameStarted]);

    // --- Challenge Success Celebration ---
    useEffect(() => {
        const challenge = getWeeklyChallengeById(challengeJustWon);
        if (challenge) {
            // Explose de confettis !
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#f59e0b', '#8b5cf6', '#4f46e5', '#fff']
            });

            toast.success(`${challenge.icon} DÉFI RÉUSSI : ${challenge.shortTitle} ! +${challenge.rewardXP} XP`, {
                duration: 6000,
                icon: challenge.icon,
                style: {
                    border: '1px solid #818cf8',
                    padding: '20px',
                    color: '#fff',
                    background: '#312e81',
                    fontWeight: 'black',
                    fontSize: '16px'
                }
            });

            // Play victory sound as well
            playVictory();

            // Clear flag
            setTimeout(() => {
                clearChallengeWon();
            }, 500);
        }
    }, [challengeJustWon, clearChallengeWon, playVictory]);

    // AI Auto-play: Execute AI turns automatically with delay
    useEffect(() => {
        if (!aiMode || !gameState || isPaused) return;
        if (gameState.phase === 'FINISHED') return;

        // During initial reveal, AI players should automatically reveal their cards
        // NOTE: In INITIAL_REVEAL phase, currentPlayerIndex stays at 0 - all players reveal simultaneously
        if (gameState.phase === 'INITIAL_REVEAL') {
            // Find AI players that still need to reveal their cards
            const aiNeedingReveal = aiPlayers.filter(aiIndex => {
                const aiPlayer = gameState.players[aiIndex];
                if (!aiPlayer) return false;
                const revealedCount = aiPlayer.hand.filter(c => c && c.isRevealed).length;
                return revealedCount < 2;
            });

            // If any AI still needs to reveal, do it one at a time with delay
            if (aiNeedingReveal.length > 0) {
                const firstAIToReveal = aiNeedingReveal[0];
                setAIThinking(true);
                const timer = setTimeout(() => {
                    // Manually reveal for this AI player
                    const aiPlayer = gameState.players[firstAIToReveal];
                    const cardsToReveal = chooseInitialCardsToReveal(aiPlayer.hand, aiDifficulty);
                    revealInitial(firstAIToReveal, cardsToReveal);
                    setAIThinking(false);
                }, DEAL_TOTAL_MS); // après la distribution : l'IA retourne des cartes posées, pas des cartes en vol
                return () => clearTimeout(timer);
            }
            return;
        }

        // Regular gameplay - only current AI player acts
        if (!isCurrentPlayerAI || isPaused) return;

        setAIThinking(true);
        setAIThinking(true);
        // Slower delay for better readability (was 1200)
        const delay = 2000;
        let checkNextAction;
        const timer = setTimeout(() => {
            executeAITurn();

            // If AI still needs to make another action (e.g., after drawing), set another timer
            checkNextAction = setTimeout(() => {
                const currentState = useVirtualGameStore.getState().gameState;
                if (currentState &&
                    currentState.currentPlayerIndex !== undefined &&
                    useVirtualGameStore.getState().aiPlayers.includes(currentState.currentPlayerIndex) &&
                    (currentState.turnPhase === 'REPLACE_OR_DISCARD' || currentState.turnPhase === 'MUST_REPLACE' || currentState.turnPhase === 'MUST_REVEAL')) {
                    executeAITurn();
                }
                setAIThinking(false);
                setAIThinking(false);
            }, 2500); // Wait longer before next action (was 800)


        }, delay);

        return () => { clearTimeout(timer); clearTimeout(checkNextAction); };
    }, [aiMode, gameState?.currentPlayerIndex, gameState?.phase, gameState?.turnPhase, isCurrentPlayerAI, aiPlayers, executeAITurn, setAIThinking, gameState, aiDifficulty, revealInitial, isPaused]);

    // Add player
    const addPlayer = () => {
        if (players.length < 8) {
            setPlayers([
                ...players,
                { name: '', emoji: PLAYER_COLORS[players.length] },
            ]);
        }
    };

    // Remove player
    const removePlayer = (index) => {
        if (players.length > 2) {
            setPlayers(players.filter((_, i) => i !== index));
        }
    };

    // Update player name
    const updatePlayer = (index, field, value) => {
        const newPlayers = [...players];
        newPlayers[index] = { ...newPlayers[index], [field]: value };
        setPlayers(newPlayers);

        // Sync local player 0 to global profile
        if (index === 0 && field === 'name' && value.trim()) {
            updateUserProfile({ name: value.trim() });
        }
    };

    // Start game
    const handleStartGame = () => {
        // Check for invalid names
        const hasInvalidName = players.some(p => !p.name.trim() || p.name.trim().toLowerCase() === 'joueur');
        if (hasInvalidName) {
            setPendingStartAction('local');
            setShowPseudoModal(true);
            return;
        }

        const gamePlayers = players.map((p, i) => ({
            id: `player-${i}`,
            name: p.name.trim() || `Joueur ${i + 1}`,
            emoji: p.emoji,
        }));
        startLocalGame(gamePlayers);
        setInitialReveals({});
        setScreen('game');
    };

    // Handle initial reveal selection
    const handleInitialReveal = (playerIndex, cardIndex) => {
        playCardFlip();
        const key = `player-${playerIndex}`;
        const current = initialReveals[key] || [];

        if (current.includes(cardIndex)) {
            // Already revealed, do nothing (cannot hide it back)
            return;
        }

        if (current.length < 2) {
            const newReveals = [...current, cardIndex];
            setInitialReveals({
                ...initialReveals,
                [key]: newReveals,
            });

            if (newReveals.length === 2) {
                if (onlineGameStarted) {
                    emitGameAction('reveal_initial', { cardIndices: newReveals });
                } else {
                    revealInitial(playerIndex, newReveals);
                }
            }
        }
    };

    // Jouer une Fury : en local via le store, en ligne via le serveur (qui valide le coup).
    const doPlayFury = (reserveIndex, targetIndex, target = null) => {
        if (onlineGameStarted) { emitGameAction('play_fury', { reserveIndex, targetIndex, target }); return true; }
        return playFuryCard(reserveIndex, targetIndex, target);
    };

    // Handle card click during gameplay
    const handleCardClick = (cardIndex, playerIndex = null) => {
        // Fury : une carte sélectionnée vise la colonne ou la carte touchée chez l'adversaire.
        if (furyActiveType && playerIndex === opponentIndex) {
            const need = FURY_TYPES[furyActiveType].target;
            const target = need === 'column' ? Math.floor(cardIndex / 3) : need === 'card' ? cardIndex : null;
            if (doPlayFury(furySelect, opponentIndex, target)) setFurySelect(null);
            return;
        }
        const isOnline = !!onlineGameStarted;
        const activeState = isOnline ? onlineGameState : gameState;

        if (!activeState || (isOnlineMode && isActionPending)) return;

        // Determine robustly who "I" am to check if it's my turn
        const currentSocketId = isOnline ? (getSocketId?.() || socketId) : null;
        let myIdx = isOnline ? activeState.players.findIndex(p => p.id === currentSocketId) : 0;
        if (isOnline && myIdx === -1 && userProfile?.id) {
            myIdx = activeState.players.findIndex(p => String(p.dbId) === String(userProfile.id));
        }
        const isMyTurn = activeState.currentPlayerIndex === myIdx;

        // Determine player index if not provided (default to current player)
        const targetPlayerIndex = playerIndex !== null ? playerIndex : activeState.currentPlayerIndex;

        // Handle SWAP logic
        if (activeState.turnPhase === 'SPECIAL_ACTION_SWAP' && isMyTurn) {
            // Step 1: Selection of my card
            if (targetPlayerIndex === activeState.currentPlayerIndex) {
                setSwapSelection(prev => ({ ...prev, sourceIndex: cardIndex }));
                setInstruction("Choisissez maintenant une carte adverse à échanger.");
                return;
            }

            // Step 2: Selection of opponent's card
            if (targetPlayerIndex !== activeState.currentPlayerIndex && swapSelection.sourceIndex !== null) {
                try {
                    playCardPlace();
                    const sourceIdx = swapSelection.sourceIndex;
                    setSwapSelection({ sourceIndex: null, targetPlayerIndex: null, targetCardIndex: null });

                    if (isOnline) {
                        emitGameAction('perform_swap', {
                            sourceCardIndex: sourceIdx,
                            targetPlayerIndex,
                            targetCardIndex: cardIndex
                        });
                        toast.success("Échange envoyé !", { id: "swap-action" });
                    } else {
                        performSwap(sourceIdx, targetPlayerIndex, cardIndex);
                        toast.success("Échange effectué !", { id: "swap-action" });
                    }
                    setInstruction(null);
                } catch (error) {
                    toast.error(error.message || "Échange impossible !");
                }
                return;
            }

            if (targetPlayerIndex !== activeState.currentPlayerIndex && swapSelection.sourceIndex === null) {
                toast.error("Sélectionnez d'abord l'une de vos cartes à échanger.");
                return;
            }
        }

        // Only allow clicking on own board for regular phases
        if (targetPlayerIndex !== activeState.currentPlayerIndex) return;

        // In online mode, we just emit actions
        if (isOnline) {
            // Une seule action à la fois : l'état du serveur n'arrive qu'après l'animation (~0,6 s),
            // et un 2e appui envoyait la même action une seconde fois.
            if (activeState.turnPhase === 'REPLACE_OR_DISCARD' || activeState.turnPhase === 'MUST_REPLACE') {
                setIsActionPending(true);
                playCardPlace();
                emitGameAction('replace_card', { cardIndex });
            } else if (activeState.turnPhase === 'MUST_REVEAL') {
                if (activeState.players[targetPlayerIndex]?.hand?.[cardIndex]?.isRevealed) return;
                setIsActionPending(true);
                playCardFlip();
                emitGameAction('reveal_hidden', { cardIndex });
            }
            return;
        }

        // Local mode
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        const card = currentPlayer.hand[cardIndex];

        if (gameState.turnPhase === 'REPLACE_OR_DISCARD' || gameState.turnPhase === 'MUST_REPLACE') {
            try {
                playCardPlace();
                replaceHandCard(cardIndex);
            } catch (error) {
                console.error("Action interdite:", error.message);
                setShakingCard({ playerIndex: gameState.currentPlayerIndex, cardIndex });
                toast.error(error.message || "Action impossible sur une carte verrouillée !");
                setTimeout(() => setShakingCard(null), 500);
            }
        } else if (gameState.turnPhase === 'MUST_REVEAL') {
            try {
                if (!card?.isRevealed) {
                    playCardFlip();
                    revealHiddenCard(cardIndex);
                }
            } catch (error) {
                setShakingCard({ playerIndex: gameState.currentPlayerIndex, cardIndex });
                toast.error(error.message || "Carte verrouillée !");
                setTimeout(() => setShakingCard(null), 500);
            }
        }
    };


    // Helper to update player avatar from selector
    const updateAvatar = (indexOrKey, avatarId) => {
        if (indexOrKey === 'ai-player') {
            setAIConfig(prev => ({ ...prev, playerAvatarId: avatarId }));
            updateUserProfile({ avatarId }); // Persist to global store
            setOpenAvatarSelector(null);
            return;
        }
        if (indexOrKey === 'online-setup') {
            setMyAvatarId(avatarId);
            setPlayerInfo(myPseudo, avatarId);
            updateUserProfile({ avatarId }); // Global sync
            setOpenAvatarSelector(null);
            return;
        }
        const index = Number(indexOrKey);
        const newPlayers = [...players];
        newPlayers[index] = { ...newPlayers[index], avatarId };
        setPlayers(newPlayers);
        if (index === 0) {
            updateUserProfile({ avatarId }); // Global sync
        }
        setOpenAvatarSelector(null);
    };

    const handleTogglePause = useCallback(() => {
        if (onlineGameStarted) {
            toggleOnlinePause(!onlineIsPaused);
        } else {
            togglePause();
        }
    }, [onlineGameStarted, onlineIsPaused, toggleOnlinePause, togglePause]);

    // Back to menu
    const handleBackToMenu = (force = false) => {
        if (!force && screen === 'game' && !isGameOver) {
            setShowExitConfirm(true);
        } else {
            confirmExit();
        }
    };

    const confirmExit = () => {
        setShowExitConfirm(false);
        if (gameState?.isSeasonalPreview) {
            useVirtualGameStore.getState().exitSeasonalPreview();
            return;
        }
        // Archive online game if it was started and has data (avoid duplicates)
        // Check our ref to see if we already auto-archived
        if (onlineGameStarted && onlinePlayers.length > 0 && !hasArchivedOnlineRef.current) {
            console.log("Manual archiving on quit...");
            archiveOnlineGame({
                players: onlinePlayers,
                totalScores: onlineTotalScores,
                winner: onlineGameWinner,
                roundsPlayed: onlineRoundNumber
            });
            leaveRoom(); // 🔥 Use leaveRoom instead of disconnect
        } else if (onlineGameStarted || onlineRoomCode) {
            // Just leave if already archived or in lobby
            leaveRoom();
        }

        // Archive AI/local game when quitting (only if at least one round is finished)
        if (gameState && gameState.players && gameState.players.length > 0 && !onlineGameStarted && !isGameOver) {
            // Intelligent Archiving: Only save to history if at least one round was completed
            const isAtLeastOneRoundDone = roundNumber > 1 || gameState.phase === 'FINISHED' || gameState.phase === 'REVEALING_CHESTS';

            if (isAtLeastOneRoundDone) {
                // Calculate current winner based on totalScores
                let scores = { ...totalScores };

                // If the current round is FINISHED but not yet committed to totalScores (e.g. user quits on result screen),
                // we need to add these scores to the archive
                if (gameState.phase === 'FINISHED' || gameState.phase === 'REVEALING_CHESTS') {
                    const roundResults = calculateFinalScores(gameState);
                    roundResults.forEach(r => {
                        scores[r.playerId] = (scores[r.playerId] || 0) + r.finalScore;
                    });

                    // Award XP if quitting after a win (Unify with endRound logic)
                    const sortedResults = [...roundResults].sort((a, b) => a.finalScore - b.finalScore);
                    const winningScore = sortedResults[0]?.finalScore;
                    const myPlayer = gameState.players.find(p => p.id === 'human-1');

                    if (!gameState.isWeeklyChallenge && myPlayer && roundResults.find(r => r.playerId === myPlayer.id)?.finalScore === winningScore) {
                        const isDaily = isDailyChallenge;
                        const isDailyAvailable = useGameStore.getState().lastDailyWinDate !== new Date().toISOString().split('T')[0];

                        // CRITICAL: We only award XP here if it wasn't already awarded (e.g. if endRound hasn't been called)
                        // In Daily Challenge, we often quit from the results screen, so this is where 5 XP is awarded.
                        if (isDaily && isDailyAvailable) {
                            // Défi quotidien : Tourment 3 XP, Fury 6 XP
                            addXP(useVirtualGameStore.getState().isFuryMode ? 6 : 3);
                            useGameStore.getState().markDailyWin();
                            console.log("[VG] Daily Challenge Won (on quit)!");
                        } else {
                            addXP(1);
                            console.log("[VG] Round Won (on quit)! 1 XP Awarded.");
                        }
                    }
                }

                const playersWithScores = gameState.players.map(p => ({
                    ...p,
                    finalScore: scores[p.id] || 0
                })).sort((a, b) => a.finalScore - b.finalScore);

                const winner = playersWithScores[0];

                archiveVirtualGame({
                    players: gameState.players,
                    totalScores: scores,
                    winner: winner ? { id: winner.id, name: winner.name, score: winner.finalScore } : null,
                    roundsPlayed: roundNumber || 1,
                    gameType: aiMode ? 'ai' : 'local'
                });
            }
        }

        const wasDaily = isDailyChallenge;
        resetGame();
        setScreen('menu');

        // Signal parent to switch back to main menu
        if (onBackToMenu) onBackToMenu(wasDaily);
    };



    const avatarSelectorComponent = (
        <AvatarSelector
            isOpen={openAvatarSelector !== null}
            onClose={() => setOpenAvatarSelector(null)}
            selectedId={
                openAvatarSelector === 'ai-player'
                    ? aiConfig.playerAvatarId
                    : openAvatarSelector === 'online-setup'
                        ? myAvatarId
                        : (openAvatarSelector !== null && players[openAvatarSelector] ? players[openAvatarSelector].avatarId : null)
            }
            onSelect={(id) => updateAvatar(openAvatarSelector, id)}
        />
    );



    if (!onlineGameStarted && isFinished && activeGameState?.isWeeklyChallenge) {
        const challenge = getGameChallenge(activeGameState);
        const scores = calculateFinalScores(activeGameState);
        const human = activeGameState.players.find(p => p.id === 'human-1');
        const result = activeGameState.seasonalResult || {
            success: hasChallengeObjective({ challenge, hand: human?.hand, columnsCleared: human?.columnsCleared }) && hasBestRoundScore(scores),
            rewardXP: activeGameState.challengeJustWon ? challenge.rewardXP : 0,
        };
        const totals = Object.fromEntries(scores.map(s => [s.playerId, s.finalScore]));
        const canRetry = !result.success && (activeGameState.isSeasonalPreview || challenge?.id === getActiveWeeklyChallenge()?.id);
        const retryChallenge = () => {
            if (!activeGameState.isSeasonalPreview && challenge?.id !== getActiveWeeklyChallenge()?.id) {
                toast.error('Cette saison est terminée. Retrouvez le nouveau défi dans le menu.');
                return;
            }
            const started = startAIGame(
                { name: human?.name, avatarId: human?.avatarId }, 1, AI_DIFFICULTY.BONUS,
                { isBonusMode: true, isWeeklyChallenge: true, isSeasonalPreview: !!activeGameState.isSeasonalPreview }
            );
            if (started === false) {
                toast.error('Ce défi n’est plus disponible pour le moment.');
                return;
            }
            setInitialReveals({});
            setChestsRevealed(false);
            setDrawDiscardPopup(null);
            setScreen('game');
            playStartGame();
        };
        return createPortal(<div className="round-results-viewport">
            <Card className="round-results-shell overflow-hidden flex flex-col">
                <CardHeader className="round-results-heading text-center">
                    <CardTitle>{challenge?.shortTitle || 'Défi saisonnier'}</CardTitle>
                    <p className="text-amber-200 text-sm">{activeGameState.isSeasonalPreview ? 'Aperçu admin · ' : ''}{result.success ? 'Défi réussi' : 'Défi non réussi'} · +{result.rewardXP} XP{activeGameState.isSeasonalPreview ? ' simulés' : ''}</p>
                </CardHeader>
                <CardContent className="round-results-content">
                    <div className="round-results-scroll"><SeasonalResult gameState={activeGameState} /><RoundResultsPlayers scores={scores} gameState={activeGameState} totals={totals} /></div>
                    <div className="round-actions flex flex-col gap-2">
                        {canRetry && <Button className="w-full" onClick={retryChallenge}><RotateCcw className="mr-2 h-4 w-4" />Réessayer le défi</Button>}
                        <Button variant={canRetry ? 'ghost' : 'primary'} className="w-full" onClick={confirmExit}>{activeGameState.isSeasonalPreview ? 'Retour au panneau admin' : 'Terminer le défi'}</Button>
                    </div>
                </CardContent>
            </Card>
        </div>, document.body);
    }

    if (showSyncIssue) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <SkyjoLoader progress={100} />
                <p className="mt-4 text-white font-bold animate-pulse">Synchronisation...</p>
                <p className="text-xs text-white/50 mt-2">ID: {currentSocketId?.substr(0, 4)}...</p>
            </div>
        );
    }

    // Render AI setup screen
    if (screen === 'ai-setup') {
        const handleStartAIGame = () => {
            const name = aiConfig.playerName?.trim();
            if (!name || name.toLowerCase() === 'joueur') {
                setPendingStartAction('ai');
                setShowPseudoModal(true);
                return;
            }

            playStartGame();
            const isBonus = aiConfig.difficulty === AI_DIFFICULTY.BONUS;
            startAIGame(
                { name: aiConfig.playerName || 'Joueur', avatarId: aiConfig.playerAvatarId },
                1, // Forced to 1 AI opponent
                aiConfig.difficulty,
                { isBonusMode: isBonus }
            );
            setInitialReveals({});
            setScreen('game');
        };

        return (
            <>
                <AISetupScreen
                    difficulty={aiConfig.difficulty}
                    onDifficultyChange={difficulty => setAIConfig(prev => ({ ...prev, difficulty }))}
                    onStart={handleStartAIGame}
                    onBack={handleBackToMenu}
                    onRules={mode => { if (mode === 'fury') { setFuryRulesOpen(true); return; } setRulesMode(mode); setShowBonusTutorial(true); }}
                />
                <FuryRulesModal open={furyRulesOpen} onClose={() => setFuryRulesOpen(false)} />
                {avatarSelectorComponent}
                <BonusTutorial
                    isOpen={showBonusTutorial}
                    onClose={() => setShowBonusTutorial(false)}
                    mode={rulesMode}
                />

                <PseudoModal
                    isOpen={showPseudoModal}
                    onClose={() => setShowPseudoModal(false)}
                    initialValue={pendingStartAction === 'ai' ? aiConfig.playerName : (players[0]?.name || '')}
                    onConfirm={(newPseudo) => {
                        setShowPseudoModal(false);
                        if (pendingStartAction === 'ai') {
                            setAIConfig(prev => ({ ...prev, playerName: newPseudo }));
                            updateUserProfile({ name: newPseudo });
                            // Re-trigger start with the new name
                            playStartGame();
                            const isBonus = aiConfig.difficulty === AI_DIFFICULTY.BONUS;
                            startAIGame(
                                { name: newPseudo, avatarId: aiConfig.playerAvatarId },
                                1,
                                aiConfig.difficulty,
                                { isBonusMode: isBonus }
                            );
                            setInitialReveals({});
                            setScreen('game');
                        } else if (pendingStartAction === 'local') {
                            const updatedPlayers = [...players];
                            updatedPlayers[0] = { ...updatedPlayers[0], name: newPseudo };
                            setPlayers(updatedPlayers);
                            updateUserProfile({ name: newPseudo });

                            if (updatedPlayers.every(p => p.name.trim() && p.name.trim().toLowerCase() !== 'joueur')) {
                                const gamePlayers = updatedPlayers.map((p, i) => ({
                                    id: `player-${i}`,
                                    name: p.name.trim(),
                                    emoji: p.emoji,
                                }));
                                startLocalGame(gamePlayers);
                                setInitialReveals({});
                                setScreen('game');
                            }
                        }
                    }}
                />
            </>
        );
    }

    // Render setup screen
    if (screen === 'setup') {
        return (
            <div className="max-w-md mx-auto p-4 space-y-4 animate-in fade-in">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBackToMenu}
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 transition-all shadow-lg mb-4"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                <Card className="glass-premium dark:glass-dark shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <Users className="h-5 w-5 text-emerald-600" />
                            Joueurs (1v1)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {players.map((player, index) => (
                            <div key={index} className="flex items-center gap-2">
                                {/* Avatar Button */}
                                <button
                                    onClick={() => setOpenAvatarSelector(index)}
                                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 border border-white/10 overflow-hidden relative group bg-slate-800 ring-2 ring-white/5 hover:ring-white/20"
                                >
                                    <div className="absolute inset-0 bg-white">
                                        <img
                                            src={getAvatarPath(player.avatarId)}
                                            alt="Avatar"
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            onError={handleAvatarError}
                                        />
                                        {/* Glossy Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-black/0 via-white/20 to-white/0 opacity-50 pointer-events-none" />
                                    </div>
                                </button>
                                <Input
                                    placeholder={`Joueur ${index + 1}`}
                                    value={player.name}
                                    onChange={(e) =>
                                        updatePlayer(index, 'name', e.target.value)
                                    }
                                    className="flex-1"
                                />
                                {players.length > 2 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removePlayer(index)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                        ✕
                                    </Button>
                                )}
                            </div>
                        ))}

                        {players.length < 2 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={addPlayer}
                                className="w-full border-dashed"
                            >
                                + Ajouter un joueur
                            </Button>
                        )}
                    </CardContent>
                </Card>

                <Button
                    size="lg"
                    className="w-full bg-[#1e2235] text-white shadow-lg hover:bg-[#1e2235]/90 transition-colors border border-white/20"
                    onClick={handleStartGame}
                >
                    🚀 Lancer la partie
                </Button>
                {avatarSelectorComponent}
            </div>
        );
    }


    // Render Lobby (Online)
    if (screen === 'lobby') {
        const isRoomJoined = !!onlineRoomCode;

        if (isRoomJoined) {
            return (
                <div className="max-w-md mx-auto p-4 space-y-6 animate-in fade-in pt-6" inert={onlineGameStarted}>
                    {/* Lobby Header */}
                    <div className="relative flex items-center justify-center py-4 mb-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleBackToMenu}
                            className="absolute left-0 w-10 h-10 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 transition-all shadow-xl backdrop-blur-md z-20"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>

                        <div className="flex items-center gap-2.5 relative z-10">
                            <h2 className="text-2xl font-black text-white tracking-tighter uppercase tracking-[0.08em]">
                                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                                    SALON EN LIGNE
                                </span>
                            </h2>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Invitation Code Section */}
                        <div className="relative group py-4 px-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5" />
                            <div className="relative text-center space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Code d'invitation</label>
                                <div className="flex items-center justify-center gap-3">
                                    <span className="text-4xl font-black text-white tracking-tighter font-mono bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                                        {onlineRoomCode}
                                    </span>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(onlineRoomCode);
                                            toast.success('Code copié !');
                                        }}
                                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all active:scale-90"
                                    >
                                        <Copy className="h-4 w-4 text-slate-400" />
                                    </button>
                                </div>
                                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] animate-pulse">
                                    {onlineIsHost ? 'En attente des joueurs...' : 'Attente de l\'hôte...'}
                                </div>
                            </div>
                        </div>

                        {/* Players List */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Users className="h-4 w-4 text-blue-400" />
                                    Joueurs ({onlinePlayers.length}/2)
                                </h3>
                                <div className="h-1 flex-1 bg-white/5 mx-4 rounded-full" />
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {onlinePlayers.map((p) => (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={cn(
                                            "relative flex items-center gap-4 p-3 rounded-[24px] border transition-all shadow-xl backdrop-blur-md",
                                            p.id === socketId
                                                ? "bg-blue-600/10 border-blue-500/30 shadow-blue-500/5"
                                                : "bg-slate-900/40 border-white/5"
                                        )}
                                    >
                                        <div className="relative shrink-0">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl overflow-hidden border-2 shadow-2xl relative bg-slate-800",
                                                p.id === socketId ? "border-blue-500/40" : "border-white/10"
                                            )}>
                                                <img
                                                    src={getAvatarPath(p.emoji)}
                                                    alt="Avatar"
                                                    className="w-full h-full object-cover"
                                                    onError={handleAvatarError}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10" />
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(16,185,129,0.5)] flex items-center justify-center">
                                                <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "font-black text-base truncate",
                                                    p.id === socketId ? "text-white" : "text-slate-200"
                                                )}>
                                                    {p.name}
                                                </span>
                                                {p.isHost && (
                                                    <Trophy className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
                                                )}
                                                {p.id === socketId && (
                                                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter bg-blue-400/10 px-1.5 py-0.5 rounded-md">Moi</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                                                Connecté
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}

                                {onlinePlayers.length < 2 && (
                                    <div className="p-4 rounded-[24px] border-2 border-dashed border-white/5 bg-white/5 flex flex-col items-center justify-center gap-2 opacity-50 backdrop-blur-sm">
                                        <Users className="h-6 w-6 text-slate-700 animate-pulse" />
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">En attente d'un adversaire...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mode de jeu du salon : Tourment ou Fury (choisi par l'hôte) */}
                        <div className="ol-modes">
                            <h3 className="ol-modes-title">Mode de jeu{!onlineIsHost && <small>choisi par l’hôte</small>}</h3>
                            <div className="ol-modes-grid" role="radiogroup" aria-label="Mode de jeu">
                                {[
                                    { id: 'bonus', title: 'Tourment', text: 'Cartes spéciales', Icon: TourmentIcon, tone: 'coral', rules: () => setShowBonusRules(true) },
                                    { id: 'fury', title: 'Fury', text: 'Cartes de sabotage', Icon: FuryIcon, tone: 'ember', rules: () => setFuryRulesOpen(true) },
                                ].map(m => {
                                    const active = onlineGameMode === m.id;
                                    if (!onlineIsHost && !active) return null;
                                    return <div key={m.id} className={`ol-mode ol-mode--${m.tone}${active ? ' is-active' : ''}${!onlineIsHost ? ' is-readonly' : ''}`}>
                                        <button type="button" role="radio" aria-checked={active} disabled={!onlineIsHost} onClick={() => setOnlineGameMode(m.id)}>
                                            <span className="ol-mode-icon"><m.Icon width={22} height={22} /></span>
                                            <strong>{m.title}</strong><small>{m.text}</small>
                                        </button>
                                        {m.rules && active && <button type="button" className="ol-mode-rules" onClick={m.rules}><BookOpen size={12} aria-hidden="true" />Règles</button>}
                                    </div>;
                                })}
                                {!onlineIsHost && !onlineGameMode && <div className="ol-mode-wait" role="status">
                                    <span className="ol-mode-wait-icons" aria-hidden="true">
                                        <span className="ol-mode-icon ol-mode--coral"><TourmentIcon width={20} height={20} /></span>
                                        <span className="ol-mode-icon ol-mode--ember"><FuryIcon width={20} height={20} /></span>
                                    </span>
                                    <strong>L’hôte choisit le mode<span className="ol-dots" aria-hidden="true"><i /><i /><i /></span></strong>
                                    <small>Tourment ou Fury : la partie commencera dès qu’il aura lancé.</small>
                                </div>}
                            </div>
                        </div>
                        <FuryRulesModal open={furyRulesOpen} onClose={() => setFuryRulesOpen(false)} />

                        {/* Start Button / Status */}
                        <div className="pt-4">
                            {onlineIsHost ? (
                                <PremiumTiltButton
                                    className="w-full"
                                    onClick={startOnlineGame}
                                    disabled={onlinePlayers.length < 2 || !onlineGameMode}
                                    gradientFrom="from-[#4f46e5]"
                                    gradientTo="to-[#4338ca]"
                                    shadowColor="shadow-indigo-900/40"
                                >
                                    <span className="flex items-center justify-center gap-3">
                                        <Play className="h-6 w-6 fill-current" />
                                        LANCER LA PARTIE
                                    </span>
                                </PremiumTiltButton>
                            ) : (
                                <div className="relative group overflow-hidden py-3 px-4 rounded-[18px] bg-white/5 border border-white/5 backdrop-blur-md text-center shadow-sm">
                                    <p className="relative z-10 text-blue-400/60 font-black text-sm uppercase tracking-widest">En attente de l'hôte...</p>
                                    <div className="relative z-10 text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1 flex items-center justify-center gap-1.5">
                                        <span className="w-1 h-1 bg-blue-400/40 rounded-full animate-pulse" />
                                        La partie va bientôt commencer
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Bonus Rules Tutorial */}
                    <BonusTutorial
                        isOpen={showBonusRules}
                        onClose={() => setShowBonusRules(false)}
                    />

                    {onlineRedirection.active && <HostLeftOverlay onBackToMenu={onBackToMenu} />}
                </div>
            );
        }

        // Join or Create UI — DA crépuscule, comme l'écran « Rencontrez votre rival »
        return (
            <main className="ol-screen">
                <header className="ol-header">
                    <button type="button" onClick={handleBackToMenu} className="ol-back" aria-label="Retour au menu Jouer"><ArrowLeft size={20} aria-hidden="true" /></button>
                    <div><p>À PLUSIEURS</p><h1>Jouer en ligne.</h1></div>
                </header>

                {onlineError && <div className="ol-error" role="alert"><Info size={16} aria-hidden="true" />{onlineError}</div>}

                {/* Profil */}
                <section className="ol-profile" aria-label="Votre profil">
                    <button type="button" className="ol-avatar" onClick={() => setOpenAvatarSelector('online-setup')} aria-label="Changer d’avatar">
                        <img src={getAvatarPath(myAvatarId)} alt="" onError={handleAvatarError} />
                        <span className="ol-avatar-edit" aria-hidden="true"><Palette size={13} /></span>
                        <i className="ol-online-dot" aria-hidden="true" />
                    </button>
                    <div className="ol-profile-main">
                        <div className="ol-profile-top">
                            <label className="ol-label" htmlFor="ol-pseudo">Votre pseudo</label>
                            <button type="button" className="ol-skyid" onClick={() => { if (userProfile?.vibeId) { navigator.clipboard?.writeText(userProfile.vibeId); toast.success('ID copié'); } }} aria-label={`Copier mon ID ${userProfile?.vibeId || ''}`}>
                                <small>ID</small><b>{userProfile?.vibeId || '—'}</b><Copy size={12} aria-hidden="true" />
                            </button>
                        </div>
                        <input id="ol-pseudo" className="ol-pseudo" placeholder="Pseudo" value={myPseudo} required
                            onChange={(e) => {
                                const val = e.target.value;
                                setMyPseudo(val);
                                if (val.trim()) { updateUserProfile({ name: val.trim() }); setPlayerInfo(val.trim(), myAvatarId); }
                            }} />
                        <span className="ol-ready"><i aria-hidden="true" />Prêt à jouer</span>
                    </div>
                </section>

                {/* Créer / rejoindre */}
                <section className="ol-actions" aria-label="Créer ou rejoindre une partie">
                    <button type="button" className="ol-create" onClick={() => { setPlayerInfo(myPseudo || 'Joueur', myAvatarId); createRoom(); requestPermission(); }}>
                        <span className="ol-create-icon"><Plus size={22} aria-hidden="true" /></span>
                        <span><strong>Créer une partie</strong><small>Un code à partager avec votre adversaire</small></span>
                        <ChevronRight size={22} aria-hidden="true" />
                    </button>
                    <div className="ol-join">
                        <label className="ol-label" htmlFor="ol-code">Rejoindre avec un code</label>
                        <div className="ol-join-row">
                            <input id="ol-code" className="ol-code" placeholder="ABCD" value={lobbyCode} maxLength={4} autoComplete="off" autoCapitalize="characters"
                                onChange={(e) => setLobbyCode(e.target.value.toUpperCase())} />
                            <button type="button" className="ol-join-btn" disabled={lobbyCode.trim().length < 4}
                                onClick={() => { setPlayerInfo(myPseudo || 'Joueur', myAvatarId); joinRoom(lobbyCode); }}>Rejoindre</button>
                        </div>
                    </div>
                </section>

                {/* Salons publics */}
                <section className="ol-section" aria-label="Salons publics">
                    <h2><Globe size={15} aria-hidden="true" />Salons publics<span>{publicRooms.length}</span></h2>
                    {publicRooms.length === 0 ? <p className="ol-empty">Aucun salon ouvert pour l’instant. Créez le vôtre !</p> : <ul className="ol-list">
                        {publicRooms.map(room => <li key={room.code}>
                            <button type="button" className="ol-row" onClick={() => { setPlayerInfo(myPseudo || 'Joueur', myAvatarId); joinRoom(room.code); }}>
                                <span className="ol-row-avatar">{getAvatarPath(room.emoji) ? <img src={getAvatarPath(room.emoji)} alt="" /> : <span>{room.emoji}</span>}</span>
                                <span className="ol-row-main"><strong>{room.hostName}</strong><small>#{room.code} · Public</small></span>
                                <span className="ol-row-count"><Users size={13} aria-hidden="true" />{room.playerCount}/2</span>
                                <ChevronRight size={18} aria-hidden="true" />
                            </button>
                        </li>)}
                    </ul>}
                </section>

                {/* Joueurs en ligne (amis ou non) */}
                <section className="ol-section" aria-label="Joueurs en ligne">
                    <h2><i className="ol-live-dot" aria-hidden="true" />En ligne maintenant<span>{onlineCrowd.length}</span></h2>
                    {onlineCrowd.length === 0 ? <p className="ol-empty">Personne d’autre n’est connecté pour l’instant.</p> : <ul className="ol-list">
                        {onlineCrowd.map(p => {
                            const isFriend = friends.some(f => String(f.id) === String(p.id));
                            const busy = p.status !== 'AVAILABLE';
                            return <li key={p.id} className="ol-row ol-row--friend">
                                <span className="ol-row-avatar is-online"><img src={getAvatarPath(p.avatarId)} alt="" onError={handleAvatarError} /><i aria-hidden="true" /></span>
                                <span className="ol-row-main"><strong>{p.name}{isFriend && <em className="ol-tag">Ami</em>}</strong><small className={busy ? '' : 'is-online'}>{p.status === 'IN_GAME' ? 'En partie' : p.status === 'IN_ROOM' ? 'Dans un salon' : 'Disponible'}</small></span>
                                <button type="button" className="ol-challenge" disabled={busy} onClick={() => {
                                    setPlayerInfo(myPseudo || 'Joueur', myAvatarId);
                                    if (onlineRoomCode) inviteFriend(p.id, onlineRoomCode, userProfile.name);
                                    else useOnlineGameStore.getState().createRoomAndInvite(p.id);
                                    playSocialInvite();
                                }}><Swords size={14} aria-hidden="true" />Défier</button>
                            </li>;
                        })}
                    </ul>}
                </section>

                {/* Amis */}
                <section className="ol-section" aria-label="Mes amis">
                    <h2><Users size={15} aria-hidden="true" />Mes amis<span>{friends.length}</span></h2>
                    {friends.length === 0 ? <p className="ol-empty">Ajoutez des amis depuis l’onglet Social pour les défier ici.</p> : <ul className="ol-list">
                        {friends.map(friend => <li key={friend.id} className="ol-row ol-row--friend">
                            <span className={`ol-row-avatar${friend.isOnline ? ' is-online' : ' is-offline'}`}><img src={getAvatarPath(friend.avatar_id)} alt="" />{friend.isOnline && <i aria-hidden="true" />}</span>
                            <span className="ol-row-main"><strong>{friend.name}</strong><small className={friend.isOnline ? 'is-online' : ''}>{friend.isOnline ? 'Disponible' : 'Hors ligne'}</small></span>
                            <button type="button" className="ol-challenge" onClick={() => {
                                if (onlineRoomCode) inviteFriend(friend.id, onlineRoomCode, userProfile.name);
                                else useOnlineGameStore.getState().createRoomAndInvite(friend.id);
                                playSocialInvite();
                            }}><Swords size={14} aria-hidden="true" />Défier</button>
                        </li>)}
                    </ul>}
                </section>

            </main>
        );
    }




    // 7. Gestion des états de redirection et d'erreur (avancé)
    const isRedirecting = onlineRedirection?.active;

    // Helper to wrap loaders with critical overlays
    const withOverlays = (content) => (
        <div className="relative min-h-[50vh] flex items-center justify-center">
            {content}
            <HostLeftOverlay onBackToMenu={onBackToMenu} />
            {/* We don't render Portal here because it might be redundant, but HostLeftOverlay is essential */}
        </div>
    );

    // Protection immédiate pour l'écran menu pour éviter de descendre dans la logique de jeu
    if (screen === 'menu') {
        return withOverlays(
            <div className="flex flex-col items-center justify-center space-y-4">
                <SkyjoLoader progress={100} isFullPage={false} />
                <p className="text-white font-bold relative z-[150]">Menu...</p>
            </div>
        );
    }

    // Si on est sur l'écran de jeu mais qu'il n'y a plus d'état (ex: déconnexion)
    if (!activeGameState && screen === 'game') {
        if (isRedirecting) {
            return withOverlays(
                <div className="flex flex-col items-center justify-center space-y-4">
                    <SkyjoLoader progress={100} isFullPage={false} />
                    <p className="text-white font-bold relative z-[150]">Redirection...</p>
                </div>
            );
        }
    }

    // Protection ultime : si pas d'état et pas dans le lobby/setup, on affiche un loader ou on sort
    if (!activeGameState && screen !== 'lobby' && screen !== 'setup' && screen !== 'ai-setup') {
        return withOverlays(
            <div className="flex flex-col items-center justify-center">
                <SkyjoLoader progress={100} isFullPage={false} />
                <p className="mt-4 text-white font-bold animate-pulse relative z-[150]">Chargement...</p>
            </div>
        );
    }

    // Use a separate view for the sequential revelation phase
    if (activeGameState?.phase === 'REVEALING_CHESTS' && !chestsRevealed) {
        return (
            <ChestRevelationOverlay
                gameState={activeGameState}
                onComplete={() => setChestsRevealed(true)}
            />
        );
    }

    // Get number of cards already selected for initial reveal
    const currentPlayerKey = `player-${activeGameState.currentPlayerIndex}`;
    const selectedForReveal = initialReveals[currentPlayerKey] || [];

    // If game finished, show scores
    if (isFinished && resultsReady) {
        // Calculate scores directly from activeGameState (works for both local and online)
        const scores = calculateFinalScores(activeGameState);

        // DEBUG: Log the entire calculation to find the bug
        console.log('[SCORE DEBUG] activeGameState.players:', activeGameState?.players?.map(p => ({
            id: p.id,
            name: p.name,
            hand: p.hand?.map(c => c ? { value: c.value, isRevealed: c.isRevealed } : null)
        })));
        console.log('[SCORE DEBUG] calculateFinalScores result:', scores);

        // Calculate what cumulative scores would be after this round
        const projectedTotals = {};
        scores?.forEach(score => {
            const currentTotal = Number(activeTotalScores[String(score.playerId)]) || 0;
            const roundScore = Number(score.finalScore) || 0;
            projectedTotals[score.playerId] = currentTotal + roundScore;
        });

        // Check if game would end after this round
        const maxProjected = Math.max(...Object.values(projectedTotals), 0);
        const isDaily = isDailyChallenge;
        const reachesScoreLimit = maxProjected >= 100;
        const gameEndsAfterThisRound = reachesScoreLimit || isDaily || !!activeGameState?.challengeJustWon;

        // If game is already over (endRound was called), show final results
        if (isGameOverState && activeGameWinner) {
            const isUserWinner = activeGameWinner?.id === activeGameState?.players?.[myPlayerIndex]?.id;
            const rankedWin = !isDailyChallenge && reachesScoreLimit && isUserWinner;
            const performanceMode = effectiveIsBonusMode ? 'Tourment' : activeGameState?.isFuryMode ? 'Fury' : null;
            const tourmentPerformance = rankedWin && performanceMode
                ? (performanceMode === 'Fury' ? getFuryPerformance : getTourmentPerformance)(activeGameWinner.score)
                : null;

            return (
                <div className="max-w-md mx-auto p-4 space-y-4 animate-in fade-in">
                    {/* ... modals and overlays ... */}
                    <ConfirmModal
                        isOpen={showExitConfirm}
                        onClose={() => setShowExitConfirm(false)}
                        onConfirm={confirmExit}
                        title="Quitter la partie ?"
                        className="confirm-night"
                        message="Êtes-vous sûr de vouloir quitter ? Vous serez déconnecté de la partie en cours."
                        confirmText="Quitter"
                        variant="danger"
                    />
                    <AvatarSelector
                        isOpen={openAvatarSelector !== null}
                        onClose={() => setOpenAvatarSelector(null)}
                        selectedId={
                            openAvatarSelector === 'ai-player'
                                ? aiConfig.playerAvatarId
                                : openAvatarSelector === 'online-setup'
                                    ? myAvatarId
                                    : (openAvatarSelector !== null && players[openAvatarSelector] ? players[openAvatarSelector].avatarId : null)
                        }
                        onSelect={(id) => updateAvatar(openAvatarSelector, id)}
                    />
                    <CardAnimationLayer
                        pendingAnimation={onlineGameStarted ? onlinePendingAnimation : virtualPendingAnimation}
                        onClear={onlineGameStarted ? clearOnlinePendingAnimation : clearVirtualPendingAnimation}
                    />
                    {(() => {
                        // Écran de fin : panneau nuit, gagnant en vedette, rang de performance, classement vers les 100 points.
                        const ranked = activeGameState.players
                            .map(p => ({ ...p, total: activeTotalScores[String(p.id)] || 0 }))
                            .sort((a, b) => a.total - b.total);
                        const winnerPlayer = activeGameState.players.find(p => p.id === activeGameWinner.id);
                        const winnerAvatar = getAvatarPath(winnerPlayer?.avatarId || activeGameWinner.emoji);
                        const tiers = ['survival', 'progress', 'mastery', 'absolute'];
                        const tierIndex = tourmentPerformance ? tiers.indexOf(tourmentPerformance.id) : -1;
                        const outcome = isDailyChallenge
                            ? (isUserWinner ? 'Défi quotidien réussi' : 'Défi quotidien échoué')
                            : (isUserWinner ? 'Victoire' : 'Défaite');
                        return (
                            <section className={cn('go-panel', isUserWinner ? 'go-panel--win' : 'go-panel--loss')} aria-labelledby="go-title">
                                <span className="go-glow" aria-hidden="true" />
                                <header className="go-head">
                                    <p className="go-kicker">Fin de partie · {roundNumber} manche{roundNumber > 1 ? 's' : ''}</p>
                                    <h2 id="go-title" className="go-outcome">{outcome}</h2>
                                </header>

                                <div className="go-hero">
                                    <div className="go-avatar">
                                        <span className="go-rays" aria-hidden="true" />
                                        <span className="go-crown" aria-hidden="true"><Trophy size={18} strokeWidth={2} /></span>
                                        {winnerAvatar
                                            ? <img src={winnerAvatar} alt="" width="76" height="76" />
                                            : <span className="go-avatar-emoji">{activeGameWinner.emoji || '👤'}</span>}
                                    </div>
                                    <p className="go-winner">{activeGameWinner.name} gagne&nbsp;!</p>
                                    <p className="go-score"><b>{activeGameWinner.score}</b> pts</p>
                                </div>

                                {tourmentPerformance && (
                                    <div className={`go-rank go-rank--${tourmentPerformance.id}`}>
                                        <div className="go-rank-top">
                                            <Award size={18} aria-hidden="true" />
                                            <div>
                                                <span className="go-rank-kicker">Performance {performanceMode}</span>
                                                <strong className="go-rank-label">{tourmentPerformance.label}</strong>
                                            </div>
                                        </div>
                                        <div className="go-rank-meter" aria-hidden="true">
                                            {tiers.map((t, i) => <i key={t} className={i <= tierIndex ? 'is-on' : ''} />)}
                                        </div>
                                        <p className="go-rank-text">{tourmentPerformance.description}</p>
                                    </div>
                                )}

                                <div className="go-board">
                                    <h3 className="go-board-title">Classement final</h3>
                                    {ranked.map((player, index) => {
                                        const avatar = getAvatarPath(player.avatarId || player.emoji);
                                        const isMe = player.id === activeGameState.players[myPlayerIndex]?.id;
                                        return (
                                            <div key={player.id} className={cn('go-row', index === 0 && 'go-row--first', isMe && 'go-row--me')} style={{ '--i': index }}>
                                                <span className="go-row-pos">{index + 1}</span>
                                                {avatar ? <img className="go-row-avatar" src={avatar} alt="" width="30" height="30" /> : <span className="go-row-avatar">{player.emoji || '👤'}</span>}
                                                <div className="go-row-main">
                                                    <span className="go-row-name">{player.name}{isMe && <em>Vous</em>}</span>
                                                    <span className="go-row-bar" aria-hidden="true"><i style={{ width: `${Math.min(100, Math.max(3, player.total))}%` }} /></span>
                                                </div>
                                                <span className={cn('go-row-total', player.total >= 100 && 'is-out')}>{player.total}<small> pts</small></span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="go-actions">
                                    {isDailyChallenge && (
                                        <button type="button" onClick={rematch} disabled={isUserWinner} className="go-btn go-btn--ghost">
                                            <RefreshCw size={17} aria-hidden="true" />Rejouer le défi
                                        </button>
                                    )}
                                    <button type="button" onClick={() => handleBackToMenu(isDailyChallenge)} className="go-btn go-btn--main">
                                        {isDailyChallenge ? <CheckCircle size={18} aria-hidden="true" /> : <ArrowLeft size={18} aria-hidden="true" />}
                                        {isDailyChallenge ? 'Terminer' : 'Revenir au menu'}
                                    </button>
                                </div>
                            </section>
                        );
                    })()}
                </div>
            );
        }

        // Regular end-of-round screen
        return createPortal(
            <div className="round-results-viewport">
                {/* Modals inserted at top */}
                <ConfirmModal
                    isOpen={showExitConfirm}
                    onClose={() => setShowExitConfirm(false)}
                    onConfirm={confirmExit}
                    title="Quitter la partie ?"
                    className="confirm-night"
                    message="Êtes-vous sûr de vouloir quitter ? Vous serez déconnecté de la partie en cours."
                    confirmText="Quitter"
                    variant="danger"
                />
                <AvatarSelector
                    isOpen={openAvatarSelector !== null}
                    onClose={() => setOpenAvatarSelector(null)}
                    selectedId={
                        openAvatarSelector === 'ai-player'
                            ? aiConfig.playerAvatarId
                            : openAvatarSelector === 'online-setup'
                                ? myAvatarId
                                : (openAvatarSelector !== null && players[openAvatarSelector] ? players[openAvatarSelector].avatarId : null)
                    }
                    onSelect={(id) => updateAvatar(openAvatarSelector, id)}
                />
                <CardAnimationLayer
                    pendingAnimation={onlineGameStarted ? onlinePendingAnimation : virtualPendingAnimation}
                    onClear={onlineGameStarted ? clearOnlinePendingAnimation : clearVirtualPendingAnimation}
                />
                <HostLeftOverlay />
                {/* Toast notifications REMOVED - using global Toaster */}{/* Toast removed */}
                <Card className="round-results-shell glass-premium shadow-xl overflow-hidden min-h-fit flex flex-col">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-orange-900/20" />
                    <CardHeader className="round-results-heading text-center relative pt-4 pb-2">
                        <CardTitle className="text-lg text-amber-400">
                            {isDailyChallenge ? "Défi Quotidien" : `Fin de la manche ${roundNumber}`}
                        </CardTitle>
                        {reachesScoreLimit && !isDailyChallenge && (
                            <p className="text-red-500 text-xs font-medium mt-0.5">
                                ⚠️ Un joueur atteint 100 points !
                            </p>
                        )}
                    </CardHeader>
                    <CardContent className="round-results-content relative px-3 sm:px-4">
                        <div className="round-results-scroll"><RoundResultsPlayers scores={scores} gameState={activeGameState} totals={projectedTotals} /></div>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                            className="round-actions flex gap-3 mt-4 group/tray"
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleBackToMenu}
                                aria-label="Retour au menu"
                                title="Retour au menu"
                                className="round-actions-back shrink-0 transition-all group/back"
                            >
                                <ArrowLeft className="h-5 w-5 group-hover/back:-translate-x-1 transition-transform" />
                            </Button>

                            <PremiumTiltButton
                                className="round-actions-next flex-1"
                                bodyClassName="round-actions-body"
                                contentClassName="round-actions-content"
                                disabled={isOnlineMode && isNextRoundPending && !(onlineTimeoutExpired && onlineIsHost)}
                                gradientFrom={gameEndsAfterThisRound ? "from-amber-400" : "from-sky-500"}
                                gradientTo={gameEndsAfterThisRound ? "to-orange-600" : "to-blue-700"}
                                shadowColor={gameEndsAfterThisRound ? "shadow-amber-500/40" : "shadow-blue-500/40"}
                                onClick={() => {
                                    if (isOnlineMode) {
                                        if (isNextRoundPending && onlineTimeoutExpired && onlineIsHost) {
                                            forceOnlineNextRound();
                                        } else {
                                            setIsNextRoundPending(true);
                                            startOnlineNextRound();
                                        }
                                    } else {
                                        const result = endRound();
                                        if (result && result.isGameOver) {
                                            archiveVirtualGame({
                                                players: activeGameState.players,
                                                totalScores: result.newTotalScores,
                                                winner: result.gameWinner,
                                                roundsPlayed: roundNumber,
                                                gameType: aiMode ? 'ai' : 'local'
                                            });
                                            if (result.gameWinner) {
                                                if (aiMode && result.gameWinner.id === 'human-1') {
                                                    addXP(1);
                                                } else if (!aiMode) {
                                                    addXP(1);
                                                }
                                            }
                                        } else {
                                            startNextRound();
                                        }
                                    }
                                    setInitialReveals({});
                                }}
                            >
                                {gameEndsAfterThisRound ? (
                                    <>
                                        {isDailyChallenge ? (
                                            <>
                                                <CheckCircle className="h-5 w-5" />
                                                TERMINER
                                            </>
                                        ) : activeGameState?.challengeJustWon ? (
                                            <>
                                                <Award className="h-5 w-5" />
                                                TERMINER LE DÉFI
                                            </>
                                        ) : (
                                            <>
                                                <Trophy className="h-5 w-5" />
                                                FINIR LA PARTIE
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {isOnlineMode ? (
                                            <>
                                                {isNextRoundPending ? (
                                                    <>
                                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1" />
                                                        {onlineTimeoutExpired && onlineIsHost ? "LANCER" : "ATTENDEZ..."}
                                                    </>
                                                ) : (
                                                    <>
                                                        {onlineIsHost ? (
                                                            <>
                                                                <Play className="h-5 w-5 fill-white" />
                                                                CONTINUER
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="h-5 w-5" />
                                                                PRÊT ?
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                {isNextRoundPending ? (
                                                    <>
                                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1" />
                                                        CHARGEMENT...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="h-5 w-5 fill-white" />
                                                        CONTINUER
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
                            </PremiumTiltButton>
                        </motion.div>
                    </CardContent>
                </Card>
            </div>
        , document.body);
    }


    return (
        <div
            ref={fitCardsRef}
            className={cn(
                "skyjo-game-container max-w-3xl mx-auto p-0 animate-in fade-in relative min-h-[100dvh] flex flex-col overflow-x-hidden touch-none pb-safe-plus",
                activeGameState?.players?.length <= 2 ? "justify-start gap-2 py-2" : "justify-start gap-2 py-1 pb-6"
            )}
        >

            {activeGameState?.isSeasonalPreview && <button className="text-xs text-amber-200 underline py-1" onClick={() => useVirtualGameStore.getState().exitSeasonalPreview()}>Quitter l’aperçu · Retour admin</button>}
            <AnimatePresence>
                {performanceGoal && (
                    <motion.div
                        key={performanceGoal.key}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="skyjo-pause tourment-goal-layer"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 18 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            className="skyjo-pause-panel tourment-goal"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="tourment-performance-goal-title"
                        >
                            <span className="skyjo-pause-emblem tourment-goal-emblem" aria-hidden="true"><Flame size={24} strokeWidth={1.8} /></span>
                            <h2 id="tourment-performance-goal-title" className="tourment-goal-title">
                                {performanceGoal.title}
                            </h2>
                            <p className="skyjo-pause-text tourment-goal-text">
                                {performanceGoal.text}
                            </p>
                            <div className="tourment-goal-grid">
                                {performanceGoal.tiles.map(([tone, score, rank]) => (
                                    <div key={rank} className={`tourment-goal-tile tourment-goal-tile--${tone}`}>
                                        <div className="tourment-goal-score">{score}</div>
                                        <div className="tourment-goal-rank">{rank}</div>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={performanceGoal.close} className="skyjo-pause-resume">J’ai compris</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header - ultra-thin single line with glass-style elements */}
            {/* Header - Unified Pill Container */}
            <div className="flex items-center justify-center px-2 sm:px-4 py-1 shrink-0 z-50">
                {/* Visual Container for all controls - Robust Centered Pill */}
                <div className="skyjo-game-header flex items-center justify-center gap-3 sm:gap-8 bg-slate-900/80 border border-white/10 backdrop-blur-3xl rounded-[2.5rem] p-2 sm:p-2.5 shadow-2xl relative px-4 sm:px-8">

                    {/* Quit Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBackToMenu()}
                        className="h-12 sm:h-16 px-5 sm:px-8 text-xs sm:text-sm font-black uppercase tracking-widest bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 border border-red-500/10 rounded-3xl transition-all active:scale-95 flex items-center gap-2.5 group shadow-inner shrink-0"
                    >
                        <ArrowLeft className="h-6 w-6 sm:h-7 sm:w-7 group-hover:-translate-x-1 transition-transform" />
                        <span className="hidden sm:inline">Quitter</span>
                    </Button>

                    {/* Round Counter Group - PERFECT FILL */}
                    <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-3xl border border-white/10 shrink-0 shadow-inner h-12 sm:h-16">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] hidden lg:block ml-4 mr-2">Manche</span>
                        <div className="h-9 w-9 sm:h-13 sm:w-13 flex items-center justify-center text-2xl sm:text-3xl font-black text-white font-mono bg-indigo-500/30 rounded-2xl border border-indigo-500/50 shadow-[0_0_25px_rgba(99,102,241,0.3)] shrink-0">
                            {activeRoundNumber}
                        </div>
                        {aiMode && isDailyChallenge && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/30 text-[11px] font-black text-amber-400 flex items-center gap-2 shrink-0 mr-2"
                            >
                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse outline outline-4 outline-amber-500/20" />
                                <span className="hidden xs:inline">DÉFI</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Music & Pause Group */}
                    <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                        <div className="flex items-center gap-1.5 p-1.5 bg-white/5 rounded-3xl border border-white/10 shrink-0 shadow-inner h-12 sm:h-16">
                            {/* Toggle Button FIRST */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleMusic}
                                className={cn(
                                    "h-9 w-9 sm:h-13 sm:w-13 p-0 rounded-2xl transition-all shrink-0 active:scale-95",
                                    musicEnabled
                                        ? "bg-indigo-500/30 text-indigo-400 border border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                                        : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                {musicEnabled ? (
                                    <Music2 className="h-6 w-6 sm:h-7 sm:w-7 animate-pulse text-indigo-400" />
                                ) : (
                                    <Music className="h-6 w-6 sm:h-7 sm:w-7" />
                                )}
                            </Button>

                            {/* Skip Button SECOND */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    useGameStore.getState().triggerMusicShuffle();
                                    if (window.navigator.vibrate) window.navigator.vibrate(5);
                                }}
                                disabled={!musicEnabled}
                                className="h-9 w-9 sm:h-13 sm:w-13 p-0 rounded-2xl text-slate-400 hover:text-indigo-400 transition-all active:scale-95 disabled:opacity-20 shrink-0"
                            >
                                <SkipForward className="h-6 w-6 sm:h-7 sm:w-7" />
                            </Button>
                        </div>

                        {/* Pause Button (Local/AI & Online) */}
                        {(aiMode || onlineGameStarted) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleTogglePause}
                                className={cn(
                                    "h-12 sm:h-16 px-5 sm:px-8 rounded-3xl transition-all active:scale-90 border shrink-0 flex items-center gap-3 shadow-2xl",
                                    activeIsPaused
                                        ? "bg-amber-500/25 text-amber-500 border-amber-500/40 ring-4 ring-amber-500/10"
                                        : "bg-white/5 text-slate-400 border-white/10"
                                )}
                            >
                                {activeIsPaused ? <PlayCircle className="h-6 w-6 sm:h-8 sm:w-8" /> : <Pause className="h-5 w-5 sm:h-7 sm:w-7" />}
                                <span className="text-xs sm:text-sm font-black uppercase tracking-widest hidden sm:inline">Pause</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Opponent at TOP for thumb zone optimization */}
            {activeGameState.players[opponentIndex] && (
                <motion.div
                    className="relative rounded-2xl skyjo-board-in skyjo-board-in--top"
                >
                    <PlayerHand
                        hideAutoRevealed={isFinished}
                        player={activeGameState.players[opponentIndex]}
                        columnBonus={activeGameState.isBonusMode || activeGameState.isHardcoreMode || activeGameState.isFuryMode}
                        eliminatedCards={activeGameState.lastEliminatedCards}
                        isCurrentPlayer={!isInitialReveal && activeGameState.currentPlayerIndex === opponentIndex}
                        isOpponent={true}
                        isOnlineOpponent={isOnlineMode} // Show real name for online opponents
                        selectedCardIndex={null}
                        canInteract={activeGameState.turnPhase === 'SPECIAL_ACTION_SWAP' || Boolean(furyActiveType)} // Allow clicking opponent cards during swap
                        onCardClick={(index) => handleCardClick(index, opponentIndex)} // Support swap selection
                        size="sm"
                    />
                </motion.div>
            )}

            {/* MIDDLE ACTION AREA - Centered between hands */}
            <div className="skyjo-action-area flex-1 flex flex-col justify-center items-center relative z-40 my-2">
                {isFinished && !resultsReady && createPortal(<div className="round-end-veil" role="status">
                    <div className="round-end-reason">
                        <strong>Fin de la manche</strong>
                        <span>{activeGameState.finishingPlayerIndex === myPlayerIndex ? 'Vous avez retourné toutes vos cartes' : activeGameState.players[activeGameState.finishingPlayerIndex] ? `${activeGameState.players[activeGameState.finishingPlayerIndex].name === 'IA' ? 'L’IA' : activeGameState.players[activeGameState.finishingPlayerIndex].name} a retourné toutes ses cartes` : 'Manche terminée'}</span>
                        <small>Chacun a joué son dernier tour.</small>
                    </div>
                </div>, document.body)}
                {/* Mode Fury : état adverse, ciblage, effets, ambiance */}
                {furyOn && <>
                    <FuryAmbience />
                    <FuryRulesModal open={!hasSeenFuryIntro || furyRulesOpen} first={!hasSeenFuryIntro}
                        onClose={() => { setHasSeenFuryIntro(true); setFuryRulesOpen(false); }} />
                    <FuryEffects lastFury={activeGameState.lastFury} lastGain={activeGameState.lastFuryGain} myIndex={myPlayerIndex}
                        names={activeGameState.players.map((p, i) => (i === myPlayerIndex ? 'Vous' : p.name))} />
                </>}
                {furyOn && !isInitialReveal && <FuryRail part="opponent" opponent={activeGameState.players[opponentIndex]} opponentName={activeGameState.players[opponentIndex]?.name} />}
                {/* Échange de l'IA : les deux cartes échangées, au centre */}
                <SwapReveal swap={swapReveal} />
                {/* Bulle « Aïe ! » / « Yes ! » quand un +20 ou un −10 sort de la pioche */}
                {activeGameState.drawnCard && activeDrawnCardSource !== 'discard' && [20, -10].includes(Number(activeGameState.drawnCard.value)) && (
                    <DrawReactionBubble
                        key={activeGameState.drawnCard.id}
                        value={Number(activeGameState.drawnCard.value)}
                        who={activeGameState.currentPlayerIndex === myPlayerIndex ? null : (aiMode ? 'l’IA' : 'l’adversaire')}
                    />
                )}
                {/* Instruction Banner - Moved here for precise central placement over piles */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                    <GameMessageBanner message={instruction} />
                </div>
                {/* Initial Reveal Instruction Banner */}
                {isInitialReveal && (
                    <motion.div
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex justify-center px-4 w-full"
                    >
                        <div className="skyjo-reveal-pill glass-premium px-8 py-2.5 rounded-[2rem] flex items-center gap-8 shadow-2xl border-white/20 relative overflow-hidden group max-h-[52px]">
                            {/* Shimmer top border line */}
                            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none" />

                            <h3 className="font-black text-white text-sm tracking-[0.1em] uppercase drop-shadow-sm whitespace-nowrap">
                                Retournez <span className="text-indigo-400">2</span> cartes
                            </h3>

                            <div className="flex gap-3">
                                {[0, 1].map(i => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "w-5 h-5 rounded-full border-2 transition-all duration-500",
                                            (initialReveals[`player-${myPlayerIndex}`] || []).length > i
                                                ? "bg-emerald-400 border-emerald-200 shadow-[0_0_20px_rgba(52,211,153,0.8)] scale-110"
                                                : "bg-white/5 border-white/20"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Compact Draw/Discard Trigger Button (remplacé par le ciblage Fury) */}
                {furyActiveType && <div className="flex justify-center px-4 w-full"><div style={{ width: '100%', maxWidth: '340px' }}>
                    <FuryTargetBanner type={furyActiveType}
                        onPlay={() => { if (doPlayFury(furySelect, furyActiveType === 'shield' ? myPlayerIndex : opponentIndex)) setFurySelect(null); }}
                        onCancel={() => setFurySelect(null)} />
                </div></div>}
                {!isInitialReveal && !furyActiveType && (
                    <div
                        className="flex justify-center px-4 w-full"
                        style={{ marginTop: '0', marginBottom: '0' }}
                    >
                        <div style={{ width: '100%', maxWidth: '340px' }}>
                            <DrawDiscardTrigger
                                onClick={() => setDrawDiscardPopup(activeGameState.drawnCard ? 'drawn' : 'choose')}
                                drawnCardSource={activeDrawnCardSource}
                                drawnCardInPopup={showDrawDiscardPopup}
                                onDrawAction={() => {
                                    if (activeGameState.turnPhase !== 'DRAW' || isActionPending) return;
                                    if (isOnlineMode) {
                                        setIsActionPending(true);
                                        emitGameAction('draw_pile');
                                    } else {
                                        drawFromDrawPile();
                                    }
                                    setDrawDiscardPopup('drawn');
                                }}
                                onDiscardAction={() => {
                                    if (activeGameState.turnPhase !== 'DRAW' || isActionPending) return;
                                    if (isOnlineMode) {
                                        setIsActionPending(true);
                                        emitGameAction('draw_discard');
                                    } else {
                                        takeFromDiscard();
                                    }
                                    setDrawDiscardPopup('drawn');
                                }}
                                discardTop={discardTop}
                                discardPile={activeGameState.discardPile}
                                drawnCard={activeGameState.drawnCard}
                                drawPileCount={activeGameState.drawPile.length}
                                discardPileCount={activeGameState.discardPile.length}
                                canInteract={
                                    !isInitialReveal &&
                                    activeGameState.currentPlayerIndex === myPlayerIndex &&
                                    (activeGameState.turnPhase === 'DRAW' || (!!activeGameState.drawnCard))
                                }
                                turnPhase={activeGameState.turnPhase}
                                activeActionSource={
                                    (onlineGameStarted ? onlinePendingAnimation?.sourceId : virtualPendingAnimation?.sourceId)
                                }
                                isDrawing={!!(onlineGameStarted ? onlinePendingAnimation?.sourceId : virtualPendingAnimation?.sourceId)}
                                instructionText={
                                    activeGameState.phase === 'FINAL_ROUND'
                                        ? (activeGameState.finishingPlayerIndex === myPlayerIndex
                                            ? 'Dernier tour : vous avez tout retourné'
                                            : `Dernier tour : ${activeGameState.players[activeGameState.finishingPlayerIndex]?.name || 'un joueur'} a tout retourné`)
                                        : (isInitialReveal ? `Retournez chacun 2 cartes ${selectedForReveal.length > 0 ? `(${selectedForReveal.length}/2)` : ''}` :
                                            // Only show action instructions when it's the human player's turn (virtual mode only)
                                            // Pas votre tour : « Tour de l'IA » / « Tour de Claude » (en ligne), jamais vos consignes à vous.
                                            activeGameState.currentPlayerIndex !== myPlayerIndex
                                                ? (isOnlineMode ? `Tour de ${activeGameState.players[activeGameState.currentPlayerIndex]?.name || 'l’adversaire'}` : (isAIThinking ? `IA réfléchit...` : `Tour de l'IA`))
                                                : (activeGameState.turnPhase === 'DRAW' ? 'Piochez ou prenez la défausse' :
                                                    activeGameState.turnPhase === 'REPLACE_OR_DISCARD' ?
                                                        ((activeGameState.drawnCard?.specialType === 'C' || (Number(activeGameState.drawnCard?.value) === 0 && activeGameState.drawnCard?.color === 'special')) ? 'Complétez une colonne (Joker)' : 'Jouez dans votre grille ou défaussez') :
                                                        activeGameState.turnPhase === 'MUST_REPLACE' ?
                                                            ((activeGameState.drawnCard?.specialType === 'C' || (Number(activeGameState.drawnCard?.value) === 0 && activeGameState.drawnCard?.color === 'special')) ? 'Complétez une colonne (Joker)' : 'Remplacez une de vos cartes') :
                                                            activeGameState.turnPhase === 'MUST_REVEAL' ? 'Retournez une carte' :
                                                                activeGameState.turnPhase === 'SPECIAL_ACTION_SWAP' ? 'Échangez une carte' : ''))
                                }
                                isAIThinking={isAIThinking}
                                recapText={aiMode && !isInitialReveal && activeGameState.currentPlayerIndex === myPlayerIndex && activeGameState.turnPhase === 'DRAW' ? describeAiMove(activeGameState.aiLastMove) : ''}
                            />
                        </div>
                    </div>
                )}
                {furyOn && !isInitialReveal && <FuryRail part="me" me={activeGameState.players[myPlayerIndex]} canPlay={furyCanPlay} finalRound={activeGameState.phase === 'FINAL_ROUND'} selected={furyActiveType ? furySelect : null} onSelect={i => setFurySelect(prev => (prev === i ? null : i))} />}
            </div>

            {/* Instruction Banner - BELOW the PIOCHER button */}
            {/* Instruction Banner moved inside DrawDiscardTrigger */}

            {/* Local Player at BOTTOM for thumb zone optimization */}
            {activeGameState.players[myPlayerIndex] && (
                <motion.div
                    className="relative rounded-2xl skyjo-board-in skyjo-board-in--bottom"
                >
                    <PlayerHand
                        hideAutoRevealed={isFinished}
                        player={activeGameState.players[myPlayerIndex]}
                        columnBonus={activeGameState.isBonusMode || activeGameState.isHardcoreMode || activeGameState.isFuryMode}
                        eliminatedCards={activeGameState.lastEliminatedCards}
                        isCurrentPlayer={!isInitialReveal && activeGameState.currentPlayerIndex === myPlayerIndex}
                        isOpponent={false}
                        selectedCardIndex={null}
                        pendingRevealIndices={isInitialReveal ? (initialReveals[`player-${myPlayerIndex}`] || []) : []}
                        canInteract={
                            isInitialReveal ||
                            (activeGameState.currentPlayerIndex === myPlayerIndex && (
                                activeGameState.turnPhase === 'REPLACE_OR_DISCARD' ||
                                activeGameState.turnPhase === 'MUST_REPLACE' ||
                                activeGameState.turnPhase === 'MUST_REVEAL' ||
                                activeGameState.turnPhase === 'SPECIAL_ACTION_SWAP'
                            ))
                        }
                        onCardClick={(index) => {
                            if (isInitialReveal) {
                                handleInitialReveal(myPlayerIndex, index);
                            } else {
                                if (activeGameState.currentPlayerIndex !== myPlayerIndex) return;
                                handleCardClick(index);
                            }
                        }}
                        size="sm"
                        shakingCardIndex={shakingCard?.playerIndex === myPlayerIndex ? shakingCard.cardIndex : null}
                    />
                </motion.div>
            )}

            {/* Additional players (if more than 2 - players at index 2+) */}
            {activeGameState.players.length > 2 && (
                <div className="mt-4 pb-20">
                    <h3 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide text-center">
                        Autres adversaires ({activeGameState.players.length - 2} IA)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                        {activeGameState.players.slice(2).map((player, displayIndex) => {
                            const actualIndex = displayIndex + 2;
                            const isAI = aiPlayers.includes(actualIndex);
                            return (
                                <div
                                    key={player.id}
                                    className={cn(
                                        "relative rounded-xl p-2 transition-all duration-300",
                                        !isInitialReveal && activeGameState.currentPlayerIndex === actualIndex
                                            ? "bg-gradient-to-br from-emerald-500/30 to-teal-500/30 ring-2 ring-emerald-400"
                                            : "bg-slate-800/40"
                                    )}
                                >
                                    {/* Compact name badge */}
                                    <div className={cn(
                                        "flex items-center gap-2 mb-2 px-2 py-1 rounded-lg text-sm font-medium",
                                        !isInitialReveal && activeGameState.currentPlayerIndex === actualIndex
                                            ? "bg-emerald-500 text-white"
                                            : "bg-slate-700 text-slate-200"
                                    )}>
                                        {isAI && <Bot className="h-4 w-4" />}
                                        <span className="truncate">{player.name}</span>
                                        {!isInitialReveal && activeGameState.currentPlayerIndex === actualIndex && (
                                            <span className="ml-auto animate-pulse">🎯</span>
                                        )}
                                    </div>
                                    <DrawDiscard
                                        drawPileCount={activeGameState?.drawPile.length || 0}
                                        discardTop={activeGameState?.discardPile[activeGameState.discardPile.length - 1] || null}
                                        discardHistory={activeGameState?.discardPile || []}
                                        drawnCard={activeGameState?.players[activeGameState.currentPlayerIndex]?.drawnCard}
                                        drawnCardSource={activeDrawnCardSource}
                                        canDraw={false} // Assuming these are for display only for other players
                                        canTakeDiscard={false}
                                        canDiscardDrawn={false}
                                        onDrawClick={() => { }}
                                        onDiscardClick={() => { }}
                                        onDiscardDrawnCard={() => { }}
                                        lastDiscardedCard={activeGameState?.lastDiscardedCard}
                                    />
                                    {/* Compact card grid */}
                                    <div className="grid grid-cols-4 gap-1 justify-items-center">
                                        {player.hand.map((card, cardIdx) => {
                                            const row = cardIdx % 3;
                                            const col = Math.floor(cardIdx / 3);
                                            const actualCardIdx = col * 3 + row;
                                            return (
                                                <SkyjoCard
                                                    key={cardIdx}
                                                    card={player.hand[actualCardIdx]}
                                                    size="sm"
                                                    isClickable={false}
                                                />
                                            );
                                        })}
                                    </div>

                                    {/* Mini score */}
                                    <div className="text-center mt-1">
                                        <span className="text-xs text-slate-400">
                                            Score: <span className="font-bold text-slate-200">
                                                {player.hand
                                                    .filter((c) => c?.isRevealed)
                                                    .reduce((sum, c) => sum + c.value, 0)}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Draw/Discard Popup Modal */}
            <DrawDiscardPopup
                isOpen={showDrawDiscardPopup}
                furyCards={activeGameState?.drawnCard?.id && activeGameState.lastFuryGain?.drawnId === activeGameState.drawnCard.id
                    && activeGameState.lastFuryGain.by === myPlayerIndex ? activeGameState.lastFuryGain.cards : undefined}
                onClose={() => {
                    // Check if we need to undo "Take from Discard" action
                    // Logic: If we are in 'MUST_REPLACE' phase (meaning we took from discard)
                    // and we close the popup without confirming placement (which would change phase)
                    // then we should UN-DO the take action (put card back).
                    if (activeGameState.turnPhase === 'MUST_REPLACE') {
                        if (!isOnlineMode) {
                            useVirtualGameStore.getState().undoTakeFromDiscard();
                        } else {
                            useOnlineGameStore.getState().undoTakeFromDiscard();
                        }
                    }
                    setDrawDiscardPopup(null);
                }}
                drawPileCount={activeGameState.drawPile.length}
                discardPileCount={activeGameState.discardPile.length}
                discardTop={discardTop}
                discardPile={activeGameState.discardPile}
                drawnCard={activeGameState.drawnCard}
                canDraw={activeGameState.turnPhase === 'DRAW'}
                canTakeDiscard={
                    activeGameState.turnPhase === 'DRAW' &&
                    activeGameState.discardPile.length > 0
                }
                canDiscardDrawn={activeGameState.turnPhase === 'REPLACE_OR_DISCARD'}
                isBonusMode={effectiveIsBonusMode}
                onDrawClick={() => {
                    playCardDraw();
                    if (isOnlineMode) {
                        setIsActionPending(true);
                        emitGameAction('draw_pile');
                    } else {
                        drawFromDrawPile();
                    }
                }}
                onDiscardClick={() => {
                    playCardDraw();
                    if (isOnlineMode) {
                        setIsActionPending(true);
                        emitGameAction('draw_discard');
                    } else {
                        takeFromDiscard();
                    }
                }}
                onConfirmPlacement={() => {
                    // Just close popup - we are in 'MUST_REPLACE' or 'REPLACE_OR_DISCARD'
                    // and user wants to place on grid
                    setDrawDiscardPopup(null);
                }}
                onDiscardDrawnCard={() => {
                    if (effectiveIsBonusMode && activeGameState?.drawnCard?.value === 20) {
                        toast.error("💀 MALÉDICTION ! Vous devez obligatoirement placer le Crâne dans votre jeu !", {
                            duration: 4000,
                            position: 'bottom-center'
                        });
                        return;
                    }
                    playCardFlip(); // Sound for discarding
                    if (isOnlineMode) {
                        setIsActionPending(true);
                        emitGameAction('discard_drawn');
                    } else {
                        useVirtualGameStore.getState().discardDrawnCard();
                    }
                    setDrawDiscardPopup(null);
                }}
                onUseAction={() => {
                    playCardPlace();
                    if (activeGameState.turnPhase === 'RESOLVE_BLACK_HOLE') {
                        if (isOnlineMode) {
                            // Online support could be added here
                            setIsActionPending(true);
                            emitGameAction('activate_black_hole');
                        } else {
                            useVirtualGameStore.getState().activateBlackHole();
                        }
                    } else {
                        // Existing logic for Swap card (S)
                        if (isOnlineMode) {
                            setIsActionPending(true);
                            emitGameAction('use_action_card');
                        } else {
                            useVirtualGameStore.getState().playDrawnActionCard();
                        }
                        setInstruction("Sélectionnez une de VOS cartes à échanger");
                    }
                    setDrawDiscardPopup(null);
                }}
                isLoading={isActionPending}
            />

            {/* Animation Layer - always on top */}
            <CardAnimationLayer
                pendingAnimation={onlineGameStarted ? onlinePendingAnimation : virtualPendingAnimation}
                onClear={onlineGameStarted ? clearOnlinePendingAnimation : clearVirtualPendingAnimation}
            />

            {/* Avatar Selector Modal */}
            <AvatarSelector
                isOpen={openAvatarSelector !== null}
                onClose={() => setOpenAvatarSelector(null)}
                selectedId={
                    openAvatarSelector === 'ai-player'
                        ? aiConfig.playerAvatarId
                        : openAvatarSelector === 'online-setup'
                            ? myAvatarId
                            : (openAvatarSelector !== null && players[openAvatarSelector] ? players[openAvatarSelector].avatarId : null)
                }
                onSelect={(id) => updateAvatar(openAvatarSelector, id)}
            />

            {/* Premium Modals */}
            <ConfirmModal
                isOpen={showExitConfirm}
                onClose={() => setShowExitConfirm(false)}
                onConfirm={confirmExit}
                title="Quitter la partie ?"
                className="confirm-night"
                message="Êtes-vous sûr de vouloir quitter ? Vous serez déconnecté de la partie en cours."
                confirmText="Quitter"
                variant="danger"
            />
            <HostLeftOverlay onBackToMenu={onBackToMenu} />

            {/* Pause Overlay (Unifié) */}
            <AnimatePresence>
                {((onlineGameStarted && onlineIsPaused) || (aiMode && activeIsPaused)) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="skyjo-pause"
                    >
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0, y: 14 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.96, opacity: 0, y: 14 }}
                            className="skyjo-pause-panel"
                            role="dialog" aria-modal="true" aria-labelledby="skyjo-pause-title"
                        >
                            <span className="skyjo-pause-emblem" aria-hidden="true"><Pause size={24} strokeWidth={1.8} /></span>
                            <h2 id="skyjo-pause-title">Pause</h2>
                            <p className="skyjo-pause-text">La partie vous attend.</p>
                            <button type="button" onClick={handleTogglePause} className="skyjo-pause-resume">
                                <Play size={18} fill="currentColor" aria-hidden="true" />Reprendre
                            </button>
                            <p className="skyjo-pause-label">Règles</p>
                            {/* Seulement les règles du mode en cours */}
                            <div className="skyjo-pause-rules skyjo-pause-rules--single">
                                {furyOn
                                    ? <button type="button" onClick={() => setFuryRulesOpen(true)}><Flame size={16} aria-hidden="true" />Règles du mode Fury</button>
                                    : effectiveIsBonusMode
                                        ? <button type="button" onClick={() => setShowBonusRules(true)}><Swords size={16} aria-hidden="true" />Règles du mode Tourment</button>
                                        : <button type="button" onClick={() => setShowRulesModal(true)}><BookOpen size={16} aria-hidden="true" />Règles classiques</button>}
                            </div>
                            <button type="button" onClick={() => confirmExit()} className="skyjo-pause-quit">Quitter la partie</button>
                            <p className="skyjo-pause-note"><Bot size={13} aria-hidden="true" />Votre progression est sauvegardée</p>
                        </motion.div >
                    </motion.div >
                )}
            </AnimatePresence >

            {/* Rules Modals */}
            <Tutorial
                isOpen={showRulesModal}
                onClose={() => setShowRulesModal(false)}
            />
            <BonusTutorial
                isOpen={showBonusRules}
                onClose={() => setShowBonusRules(false)}
            />

            <HostLeftOverlay onBackToMenu={onBackToMenu} />
        </div>
    );
}
