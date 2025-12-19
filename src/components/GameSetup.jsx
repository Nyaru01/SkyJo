import { useState, useEffect, useRef } from 'react';
import { Plus, X, User, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { useGameStore } from '../store/gameStore';
import { useFeedback } from '../hooks/useFeedback';
import { cn } from '../lib/utils';

// Emojis disponibles pour les avatars
const PLAYER_EMOJIS = ['🐱', '🐶', '🦊', '🐻', '🐼', '🦁', '🐸', '🐵', '🐰', '🐨', '🐯', '🦄', '🐲', '🎮', '⭐', '🔥'];

// Couleurs uniques pour chaque joueur
const PLAYER_COLORS = [
    { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-100' },
    { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-100' },
    { bg: 'bg-purple-500', text: 'text-purple-700', light: 'bg-purple-100' },
    { bg: 'bg-amber-500', text: 'text-amber-700', light: 'bg-amber-100' },
    { bg: 'bg-rose-500', text: 'text-rose-700', light: 'bg-rose-100' },
    { bg: 'bg-cyan-500', text: 'text-cyan-700', light: 'bg-cyan-100' },
    { bg: 'bg-orange-500', text: 'text-orange-700', light: 'bg-orange-100' },
    { bg: 'bg-pink-500', text: 'text-pink-700', light: 'bg-pink-100' },
];

export default function GameSetup() {
    const [players, setPlayers] = useState([
        { name: '', emoji: '🐱' },
        { name: '', emoji: '🐶' }
    ]);
    const [threshold, setThreshold] = useState(100);
    const [openEmojiPicker, setOpenEmojiPicker] = useState(null);
    const setConfiguration = useGameStore(state => state.setConfiguration);
    const { playStart } = useFeedback();

    const addPlayer = () => {
        if (players.length < 8) {
            const nextEmoji = PLAYER_EMOJIS[players.length % PLAYER_EMOJIS.length];
            setPlayers([...players, { name: '', emoji: nextEmoji }]);
        }
    };

    const removePlayer = (index) => {
        if (players.length > 2) {
            const newPlayers = [...players];
            newPlayers.splice(index, 1);
            setPlayers(newPlayers);
        }
    };

    const updateName = (index, name) => {
        const newPlayers = [...players];
        newPlayers[index] = { ...newPlayers[index], name };
        setPlayers(newPlayers);
    };

    const updateEmoji = (index, emoji) => {
        const newPlayers = [...players];
        newPlayers[index] = { ...newPlayers[index], emoji };
        setPlayers(newPlayers);
        setOpenEmojiPicker(null);
    };

    const handleStart = () => {
        const finalPlayers = players.map((p, i) => ({
            name: p.name.trim() || `Joueur ${i + 1}`,
            emoji: p.emoji
        }));
        playStart();
        setConfiguration(finalPlayers, threshold);
    };

    // Récupérer le joueur pour lequel le picker est ouvert
    const selectedPlayerForPicker = openEmojiPicker !== null ? players[openEmojiPicker] : null;

    return (
        <div className="max-w-md mx-auto p-3 space-y-3 animate-in fade-in zoom-in duration-300 h-[calc(100vh-6rem)] flex flex-col justify-center">
            {/* Header Premium */}
            <div className="text-center glass-premium dark:glass-dark p-4 rounded-2xl shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 animate-shimmer opacity-20 pointer-events-none" />
                <div className="relative z-10 flex items-center justify-center gap-4">
                    <div className="w-12 h-12 rounded-xl gradient-winner flex items-center justify-center shadow-glow-emerald animate-float">
                        <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-left">
                        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-700 bg-clip-text text-transparent drop-shadow-sm dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-400">
                            Skyjo Score
                        </h1>
                        <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">Configuration de la partie</p>
                    </div>
                </div>
            </div>

            {/* Carte Joueurs */}
            <Card className="glass-premium dark:glass-dark shadow-xl">
                <CardHeader className="py-2 px-4">
                    <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2 text-base">
                        <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        Joueurs
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 py-2 px-4">
                    {players.map((player, index) => {
                        const color = PLAYER_COLORS[index];
                        return (
                            <div
                                key={index}
                                className="flex gap-2 animate-scale-in"
                                style={{ animationDelay: `${index * 80}ms` }}
                            >
                                {/* Emoji Selector Button */}
                                <button
                                    type="button"
                                    onClick={() => setOpenEmojiPicker(openEmojiPicker === index ? null : index)}
                                    className={cn(
                                        "w-9 h-9 rounded-lg flex items-center justify-center text-lg shadow-sm transition-all hover:scale-110",
                                        color.bg
                                    )}
                                >
                                    {player.emoji}
                                </button>

                                {/* Name Input */}
                                <div className="relative flex-1">
                                    <Input
                                        placeholder={`Joueur ${index + 1}`}
                                        value={player.name}
                                        onChange={(e) => updateName(index, e.target.value)}
                                        className={cn(
                                            "h-9 bg-white/90 dark:bg-white/10 border-slate-300 dark:border-white/20 focus:bg-white dark:focus:bg-white/20 focus:border-emerald-400 transition-all shadow-sm text-sm text-slate-900 dark:text-white placeholder:text-slate-500",
                                            player.name && "font-medium"
                                        )}
                                    />
                                </div>

                                {/* Remove Button */}
                                {players.length > 2 && (
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        onClick={() => removePlayer(index)}
                                        className="shrink-0 h-9 w-9 text-red-600 hover:bg-red-100/70 hover:text-red-700 bg-white/60 dark:bg-white/10 border-white/40 dark:border-white/20 transition-all"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        );
                    })}

                    {players.length < 8 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-dashed border-emerald-400/60 text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/30 hover:border-emerald-500 bg-white/30 dark:bg-white/5 transition-all"
                            onClick={addPlayer}
                        >
                            <Plus className="mr-1 h-4 w-4" /> Ajouter
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Carte Seuil */}
            <Card className="glass-premium dark:glass-dark shadow-xl">
                <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">🎯 Seuil de fin</span>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Fin quand un joueur atteint ce score</p>
                        </div>
                        <Input
                            type="number"
                            value={threshold}
                            onChange={(e) => setThreshold(Number(e.target.value) || 100)}
                            className="w-24 text-xl font-bold text-center bg-white/90 dark:bg-white/10 border-slate-300 dark:border-white/20 focus:bg-white dark:focus:bg-white/20 focus:border-emerald-400 shadow-sm h-11 text-slate-900 dark:text-white"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Bouton Démarrer */}
            <Button
                size="lg"
                className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-500 text-white font-bold shadow-xl shadow-emerald-900/25 border border-white/20 h-12 text-base animate-pulse-glow"
                onClick={handleStart}
            >
                🚀 Commencer la partie
            </Button>

            {/* Modal Emoji Picker - RENDU EN DEHORS DE LA BOUCLE */}
            {openEmojiPicker !== null && selectedPlayerForPicker && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm"
                        onClick={() => setOpenEmojiPicker(null)}
                    />
                    {/* Modal centré */}
                    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-600 p-4 animate-in zoom-in-95 duration-150 w-[200px]">
                        <h3 className="text-center text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Choisis ton avatar</h3>
                        <div className="grid grid-cols-4 gap-2">
                            {PLAYER_EMOJIS.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => updateEmoji(openEmojiPicker, emoji)}
                                    className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center text-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all hover:scale-110",
                                        selectedPlayerForPicker.emoji === emoji && "bg-emerald-100 dark:bg-emerald-900 ring-2 ring-emerald-500"
                                    )}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
