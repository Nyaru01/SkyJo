import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Users, ArrowLeft, RotateCcw, Trophy, Info, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import PlayerHand from './virtual/PlayerHand';
import DrawDiscard from './virtual/DrawDiscard';
import SkyjoCard from './virtual/SkyjoCard';
import { useVirtualGameStore } from '../store/virtualGameStore';
import { cn } from '../lib/utils';

// Player colors for avatars
const PLAYER_COLORS = ['🐱', '🐶', '🦊', '🐻', '🐼', '🦁', '🐸', '🐵'];

/**
 * Virtual Skyjo Game Component
 * Main component for playing virtual Skyjo locally
 */
export default function VirtualGame() {
    const [screen, setScreen] = useState('menu'); // menu, setup, game, scores
    const [players, setPlayers] = useState([
        { name: '', emoji: '🐱' },
        { name: '', emoji: '🐶' },
    ]);
    const [localPlayerIndex, setLocalPlayerIndex] = useState(0);
    const [initialReveals, setInitialReveals] = useState({});

    const gameState = useVirtualGameStore((s) => s.gameState);
    const totalScores = useVirtualGameStore((s) => s.totalScores);
    const roundNumber = useVirtualGameStore((s) => s.roundNumber);
    const isGameOver = useVirtualGameStore((s) => s.isGameOver);
    const gameWinner = useVirtualGameStore((s) => s.gameWinner);
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
    };

    // Start game
    const handleStartGame = () => {
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
        const key = `player-${playerIndex}`;
        const current = initialReveals[key] || [];

        if (current.includes(cardIndex)) {
            setInitialReveals({
                ...initialReveals,
                [key]: current.filter((i) => i !== cardIndex),
            });
        } else if (current.length < 2) {
            const newReveals = [...current, cardIndex];
            setInitialReveals({
                ...initialReveals,
                [key]: newReveals,
            });

            if (newReveals.length === 2) {
                revealInitial(playerIndex, newReveals);
            }
        }
    };

    // Handle card click during gameplay
    const handleCardClick = (cardIndex) => {
        if (!gameState) return;

        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        const card = currentPlayer.hand[cardIndex];

        if (gameState.turnPhase === 'REPLACE_OR_DISCARD') {
            // Always replace the card when clicking on grid (whether hidden or revealed)
            // The "Discard drawn card" action is handled by clicking the discard pile
            replaceHandCard(cardIndex);
        } else if (gameState.turnPhase === 'MUST_REPLACE') {
            // Took from discard pile, must replace a card
            replaceHandCard(cardIndex);
        } else if (gameState.turnPhase === 'MUST_REVEAL') {
            // Discarded drawn card, must reveal a hidden card
            if (!card?.isRevealed) {
                revealHiddenCard(cardIndex);
            }
        }
    };

    // Back to menu
    const handleBackToMenu = () => {
        resetGame();
        setScreen('menu');
    };

    // Render menu screen
    if (screen === 'menu') {
        return (
            <div className="max-w-md mx-auto p-4 space-y-6 animate-in fade-in">
                <Card className="glass-premium dark:glass-dark shadow-xl overflow-hidden">
                    <div className="absolute inset-0 animate-shimmer opacity-10 pointer-events-none" />
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-3">
                            <div className="w-16 h-16 rounded-2xl gradient-winner flex items-center justify-center shadow-glow-emerald animate-float">
                                <Sparkles className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            Skyjo Virtuel
                        </CardTitle>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                            Jouez avec les vraies cartes !
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            size="lg"
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg"
                            onClick={() => setScreen('setup')}
                        >
                            <Play className="mr-2 h-5 w-5" />
                            Partie Locale
                        </Button>

                        <Button
                            size="lg"
                            variant="outline"
                            className="w-full border-emerald-300 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                            disabled
                        >
                            <Users className="mr-2 h-5 w-5" />
                            En Ligne (bientôt)
                        </Button>

                        <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-400">
                            <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 mt-0.5 shrink-0 text-slate-500" />
                                <p>
                                    En mode local, passez l'écran entre les joueurs à
                                    chaque tour.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Render setup screen
    if (screen === 'setup') {
        return (
            <div className="max-w-md mx-auto p-4 space-y-4 animate-in fade-in">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setScreen('menu')}
                    className="mb-2"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Retour
                </Button>

                <Card className="glass-premium dark:glass-dark shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <Users className="h-5 w-5 text-emerald-600" />
                            Joueurs ({players.length}/8)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {players.map((player, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <span className="text-2xl w-10 text-center">
                                    {player.emoji}
                                </span>
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

                        {players.length < 8 && (
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
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                    onClick={handleStartGame}
                >
                    🚀 Lancer la partie
                </Button>
            </div>
        );
    }

    // Render game screen
    if (screen === 'game' && gameState) {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        const isInitialReveal = gameState.phase === 'INITIAL_REVEAL';
        const isFinished = gameState.phase === 'FINISHED';
        const discardTop =
            gameState.discardPile[gameState.discardPile.length - 1];

        // Get number of cards already selected for initial reveal
        const currentPlayerKey = `player-${gameState.currentPlayerIndex}`;
        const selectedForReveal = initialReveals[currentPlayerKey] || [];

        // If game finished, show scores
        if (isFinished) {
            const scores = getFinalScores();

            // Calculate what cumulative scores would be after this round
            const projectedTotals = {};
            scores?.forEach(score => {
                projectedTotals[score.playerId] = (totalScores[score.playerId] || 0) + score.finalScore;
            });

            // Check if game would end after this round
            const maxProjected = Math.max(...Object.values(projectedTotals));
            const gameEndsAfterThisRound = maxProjected >= 100;

            // If game is already over (endRound was called), show final results
            if (isGameOver && gameWinner) {
                return (
                    <div className="max-w-md mx-auto p-4 space-y-4 animate-in fade-in">
                        <Card className="glass-premium dark:glass-dark shadow-xl overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-100/50 to-orange-100/50 dark:from-amber-900/20 dark:to-orange-900/20" />
                            <CardHeader className="text-center relative">
                                <div className="relative">
                                    <Trophy className="h-20 w-20 mx-auto text-amber-500 mb-2" />
                                    <Sparkles className="absolute top-0 right-1/3 h-6 w-6 text-yellow-400 animate-pulse" />
                                </div>
                                <CardTitle className="text-2xl text-amber-700 dark:text-amber-400">
                                    🎉 Fin de partie ! 🎉
                                </CardTitle>
                                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                                    Après {roundNumber} manche{roundNumber > 1 ? 's' : ''}
                                </p>
                            </CardHeader>
                            <CardContent className="relative space-y-4">
                                {/* Winner announcement */}
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center p-4 bg-gradient-to-r from-amber-200 to-yellow-200 dark:from-amber-900/50 dark:to-yellow-900/50 rounded-xl"
                                >
                                    <span className="text-4xl block mb-2">{gameWinner.emoji}</span>
                                    <span className="text-xl font-bold text-amber-800 dark:text-amber-200">
                                        {gameWinner.name} gagne !
                                    </span>
                                    <span className="text-sm text-amber-600 dark:text-amber-400 block mt-1">
                                        Score final : {gameWinner.score} pts
                                    </span>
                                </motion.div>

                                {/* All players final scores */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        Classement final
                                    </h3>
                                    {gameState.players
                                        .map(p => ({ ...p, total: totalScores[p.id] || 0 }))
                                        .sort((a, b) => a.total - b.total)
                                        .map((player, index) => (
                                            <div
                                                key={player.id}
                                                className={cn(
                                                    "flex items-center justify-between p-2 rounded-lg",
                                                    index === 0 ? "bg-amber-100/50 dark:bg-amber-900/30" : "bg-white/30 dark:bg-white/5"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-400">#{index + 1}</span>
                                                    <span>{player.emoji}</span>
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{player.name}</span>
                                                </div>
                                                <span className={cn(
                                                    "font-bold",
                                                    player.total >= 100 ? "text-red-600" : "text-slate-700 dark:text-slate-300"
                                                )}>
                                                    {player.total} pts
                                                </span>
                                            </div>
                                        ))}
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={handleBackToMenu}
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-1" />
                                        Menu
                                    </Button>
                                    <Button
                                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                                        onClick={rematch}
                                    >
                                        <RotateCcw className="h-4 w-4 mr-1" />
                                        Nouvelle partie
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );
            }

            // Regular end-of-round screen
            return (
                <div className="max-w-md mx-auto p-4 space-y-4 animate-in fade-in">
                    <Card className="glass-premium dark:glass-dark shadow-xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-100/50 to-orange-100/50 dark:from-amber-900/20 dark:to-orange-900/20" />
                        <CardHeader className="text-center relative">
                            <Trophy className="h-16 w-16 mx-auto text-amber-500 mb-2 animate-bounce" />
                            <CardTitle className="text-2xl text-amber-700 dark:text-amber-400">
                                Fin de la manche {roundNumber}
                            </CardTitle>
                            {gameEndsAfterThisRound && (
                                <p className="text-red-500 text-sm font-medium mt-1">
                                    ⚠️ Un joueur atteint 100 points !
                                </p>
                            )}
                        </CardHeader>
                        <CardContent className="relative space-y-3">
                            {/* Round scores with cumulative totals */}
                            {scores?.map((score, index) => (
                                <motion.div
                                    key={score.playerId}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-xl",
                                        index === 0
                                            ? "bg-gradient-to-r from-amber-200 to-yellow-200 dark:from-amber-900/50 dark:to-yellow-900/50"
                                            : "bg-white/50 dark:bg-white/5"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-bold text-slate-400">
                                            #{index + 1}
                                        </span>
                                        <span className="font-medium text-slate-800 dark:text-slate-200">
                                            {score.playerName}
                                        </span>
                                        {score.isFinisher && (
                                            <span className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                                                Finisseur
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className={cn(
                                            "text-lg font-bold",
                                            score.penalized ? "text-red-600" : "text-slate-800 dark:text-slate-200"
                                        )}>
                                            +{score.finalScore}
                                        </span>
                                        {score.penalized && (
                                            <span className="text-xs text-red-500 block">
                                                (doublé!)
                                            </span>
                                        )}
                                        <span className={cn(
                                            "text-xs block",
                                            projectedTotals[score.playerId] >= 100 ? "text-red-500 font-bold" : "text-slate-500"
                                        )}>
                                            Total: {projectedTotals[score.playerId]}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}

                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={handleBackToMenu}
                                >
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    Quitter
                                </Button>
                                <Button
                                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                                    onClick={() => {
                                        endRound(); // Update cumulative scores
                                        if (!gameEndsAfterThisRound) {
                                            startNextRound(); // Start next round if game continues
                                            setInitialReveals({}); // Reset initial reveals for new round
                                        }
                                    }}
                                >
                                    {gameEndsAfterThisRound ? (
                                        <>
                                            <Trophy className="h-4 w-4 mr-1" />
                                            Voir résultats
                                        </>
                                    ) : (
                                        <>
                                            <Play className="h-4 w-4 mr-1" />
                                            Manche suivante
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return (
            <div className="max-w-3xl mx-auto p-2 space-y-3 animate-in fade-in">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBackToMenu}
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Quitter
                    </Button>
                    <div className="text-center">
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                            {currentPlayer.emoji} {currentPlayer.name}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block">
                            {isInitialReveal
                                ? 'Révélez 2 cartes'
                                : gameState.turnPhase === 'DRAW'
                                    ? 'Piochez une carte'
                                    : 'Jouez votre carte'}
                        </span>
                    </div>
                    <div className="text-xs text-slate-500">
                        Manche {gameState.roundNumber || 1}
                    </div>
                </div>

                {/* Action hint */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={gameState.turnPhase + gameState.phase}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="text-center py-2"
                    >
                        <span className={cn(
                            "inline-block px-4 py-2 rounded-full text-sm font-medium",
                            isInitialReveal
                                ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
                                : gameState.turnPhase === 'DRAW'
                                    ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                                    : "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                        )}>
                            {isInitialReveal && (
                                <>
                                    Touchez 2 cartes pour les révéler
                                    {selectedForReveal.length > 0 && ` (${selectedForReveal.length}/2)`}
                                </>
                            )}
                            {!isInitialReveal && gameState.turnPhase === 'DRAW' && (
                                '👆 Touchez la pioche ou la défausse'
                            )}
                            {gameState.turnPhase === 'REPLACE_OR_DISCARD' && (
                                '👆 Jouez dans votre grille ou défaussez'
                            )}
                            {gameState.turnPhase === 'MUST_REPLACE' && (
                                '👆 Remplacez une de vos cartes'
                            )}
                            {gameState.turnPhase === 'MUST_REVEAL' && (
                                '👆 Retournez une carte cachée'
                            )}
                        </span>
                    </motion.div>
                </AnimatePresence>

                {/* Player 1 (always first player, on top) */}
                {gameState.players[0] && (
                    <div className={cn(
                        "relative rounded-2xl transition-all duration-500",
                        gameState.currentPlayerIndex === 0 && "ring-4 ring-emerald-400 shadow-lg shadow-emerald-500/30"
                    )}>
                        <PlayerHand
                            player={gameState.players[0]}
                            isCurrentPlayer={gameState.currentPlayerIndex === 0}
                            selectedCardIndex={null}
                            canInteract={
                                gameState.currentPlayerIndex === 0 && (
                                    isInitialReveal ||
                                    gameState.turnPhase === 'REPLACE_OR_DISCARD' ||
                                    gameState.turnPhase === 'MUST_REPLACE' ||
                                    gameState.turnPhase === 'MUST_REVEAL'
                                )
                            }
                            onCardClick={(index) => {
                                if (gameState.currentPlayerIndex !== 0) return;
                                if (isInitialReveal) {
                                    handleInitialReveal(0, index);
                                } else {
                                    handleCardClick(index);
                                }
                            }}
                            size="md"
                        />
                    </div>
                )}

                {/* Draw/Discard Area (between players) */}
                <Card className={cn(
                    "glass-premium dark:glass-dark transition-all duration-500",
                    !isInitialReveal && "ring-2 ring-emerald-400/50"
                )}>
                    {!isInitialReveal ? (
                        <DrawDiscard
                            drawPileCount={gameState.drawPile.length}
                            discardTop={discardTop}
                            drawnCard={gameState.drawnCard}
                            canDraw={gameState.turnPhase === 'DRAW'}
                            canTakeDiscard={
                                gameState.turnPhase === 'DRAW' &&
                                gameState.discardPile.length > 0
                            }
                            canDiscardDrawn={gameState.turnPhase === 'REPLACE_OR_DISCARD'}
                            onDrawClick={drawFromDrawPile}
                            onDiscardClick={takeFromDiscard}
                            onDiscardDrawnCard={discardDrawnCard}
                        />
                    ) : (
                        <div className="flex items-center justify-center gap-8 py-4">
                            <div className="flex flex-col items-center gap-2">
                                <div className="relative w-14 h-20 rounded-xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-2 border-slate-600 flex items-center justify-center shadow-xl opacity-50">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">S</span>
                                    </div>
                                </div>
                                <span className="text-xs font-medium text-slate-400">
                                    Pioche ({gameState.drawPile.length})
                                </span>
                            </div>
                            <div className="text-center text-slate-400 text-sm">
                                Révélation des cartes...
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-14 h-20 rounded-xl border-2 border-dashed border-slate-400/30 flex items-center justify-center opacity-50">
                                    <span className="text-slate-400/50 text-xs">Vide</span>
                                </div>
                                <span className="text-xs font-medium text-slate-400">
                                    Défausse
                                </span>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Player 2 (always second player, on bottom) */}
                {gameState.players[1] && (
                    <div className={cn(
                        "relative rounded-2xl transition-all duration-500",
                        gameState.currentPlayerIndex === 1 && "ring-4 ring-emerald-400 shadow-lg shadow-emerald-500/30"
                    )}>
                        <PlayerHand
                            player={gameState.players[1]}
                            isCurrentPlayer={gameState.currentPlayerIndex === 1}
                            selectedCardIndex={null}
                            canInteract={
                                gameState.currentPlayerIndex === 1 && (
                                    isInitialReveal ||
                                    gameState.turnPhase === 'REPLACE_OR_DISCARD' ||
                                    gameState.turnPhase === 'MUST_REPLACE' ||
                                    gameState.turnPhase === 'MUST_REVEAL'
                                )
                            }
                            onCardClick={(index) => {
                                if (gameState.currentPlayerIndex !== 1) return;
                                if (isInitialReveal) {
                                    handleInitialReveal(1, index);
                                } else {
                                    handleCardClick(index);
                                }
                            }}
                            size="md"
                        />
                    </div>
                )}

                {/* Additional players (if more than 2) */}
                {gameState.players.length > 2 && (
                    <div className="mt-4">
                        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                            Autres joueurs
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {gameState.players.slice(2).map((player, displayIndex) => {
                                const actualIndex = displayIndex + 2;
                                return (
                                    <div
                                        key={player.id}
                                        className={cn(
                                            "relative rounded-2xl transition-all duration-500",
                                            gameState.currentPlayerIndex === actualIndex && "ring-4 ring-emerald-400 shadow-lg shadow-emerald-500/30"
                                        )}
                                    >
                                        <PlayerHand
                                            player={player}
                                            isCurrentPlayer={gameState.currentPlayerIndex === actualIndex}
                                            canInteract={
                                                gameState.currentPlayerIndex === actualIndex && (
                                                    isInitialReveal ||
                                                    gameState.turnPhase === 'REPLACE_OR_DISCARD' ||
                                                    gameState.turnPhase === 'MUST_REPLACE' ||
                                                    gameState.turnPhase === 'MUST_REVEAL'
                                                )
                                            }
                                            onCardClick={(index) => {
                                                if (gameState.currentPlayerIndex !== actualIndex) return;
                                                if (isInitialReveal) {
                                                    handleInitialReveal(actualIndex, index);
                                                } else {
                                                    handleCardClick(index);
                                                }
                                            }}
                                            size="sm"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return null;
}
