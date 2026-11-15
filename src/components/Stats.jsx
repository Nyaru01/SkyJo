import { useMemo, useRef, useState } from 'react';
import { Trophy, Target, Flame, Gamepad2, Download, Upload, ChevronDown, Bot, Wifi, Users, Hourglass } from 'lucide-react';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import { useGameStore, selectGameHistory } from '../store/gameStore';
import '../styles/Stats.css';

// Écran Statistiques, centré sur le joueur : taux de victoire, chiffres clés, derniers scores,
// parties récentes, puis le palmarès de tous les joueurs croisés.
const MODE = {
    ai: { label: 'Contre l’IA', icon: Bot },
    online: { label: 'En ligne', icon: Wifi },
    local: { label: 'Entre amis', icon: Users },
};
const modeOf = game => (String(game.id || '').startsWith('game-online') ? 'online' : game.gameType === 'ai' ? 'ai' : 'local');

function relativeDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (days <= 0) return 'Aujourd’hui';
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// Avant le suivi du temps réel, on estime : environ 4 minutes par manche jouée.
const MINUTES_PER_ROUND = 4;
function formatDuration(ms) {
    const min = Math.round(ms / 60000);
    if (min < 60) return { big: String(min), unit: 'min' };
    const h = Math.floor(min / 60);
    return { big: String(h), unit: `h ${String(min % 60).padStart(2, '0')}` };
}

function WinRing({ rate }) {
    const reduce = useReducedMotion();
    const r = 44;
    const c = 2 * Math.PI * r;
    return <svg className="st-ring" viewBox="0 0 110 110" aria-hidden="true">
        <circle cx="55" cy="55" r={r} className="st-ring-track" />
        <Motion.circle cx="55" cy="55" r={r} className="st-ring-value" strokeDasharray={c}
            initial={reduce ? false : { strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - rate) }}
            transition={{ duration: 1.1, ease: [0.2, 0.8, 0.25, 1], delay: 0.15 }} />
    </svg>;
}

function ScoreBars({ scores }) {
    const reduce = useReducedMotion();
    const max = Math.max(10, ...scores.map(s => Math.abs(s.score)));
    return <div className="st-bars" role="img" aria-label={`Vos ${scores.length} derniers scores : ${scores.map(s => s.score).join(', ')}`}>
        {scores.map((s, i) => <div key={i} className="st-bar-slot">
            <Motion.span className={`st-bar${s.won ? ' is-win' : ''}${s.score < 0 ? ' is-neg' : ''}`}
                style={{ height: `${Math.max(6, (Math.abs(s.score) / max) * 100)}%` }}
                initial={reduce ? false : { scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.2 + i * 0.04, duration: 0.4 }} />
            <small>{s.score}</small>
        </div>)}
    </div>;
}

export default function Stats() {
    const gameHistory = useGameStore(selectGameHistory);
    const profileId = useGameStore(s => s.userProfile?.id);
    const profileName = useGameStore(s => s.userProfile?.name);
    const playTimeMs = useGameStore(s => s.playTimeMs || 0);
    const playTimeSince = useGameStore(s => s.playTimeSince);
    const fileInputRef = useRef(null);
    const [showAllPlayers, setShowAllPlayers] = useState(false);

    const data = useMemo(() => {
        const isMe = p => p && (p.id === 'human-1' || (profileId && String(p.id) === String(profileId)) || (profileName && p.name === profileName));
        const mine = [];
        const players = {};
        gameHistory.forEach(game => {
            (game.players || []).forEach(p => {
                const key = p.name;
                if (!players[key]) players[key] = { name: p.name, wins: 0, games: 0, total: 0 };
                players[key].games += 1;
                players[key].total += p.finalScore;
                if (game.winner?.name === p.name) players[key].wins += 1;
            });
            const me = (game.players || []).find(isMe);
            if (me) {
                const won = game.winner?.name === me.name || (game.winner?.id && String(game.winner.id) === String(me.id));
                const opponents = (game.players || []).filter(p => p !== me).map(p => p.name);
                mine.push({ id: game.id, date: game.date, score: me.finalScore, won, mode: modeOf(game), opponents, rounds: game.roundsPlayed || game.rounds?.length || 0 });
            }
        });
        // Historique du plus récent au plus ancien
        let streak = 0;
        for (const g of mine) { if (g.won) streak += 1; else break; }
        const wins = mine.filter(g => g.won).length;
        return {
            mine,
            wins,
            rate: mine.length ? wins / mine.length : 0,
            best: mine.length ? Math.min(...mine.map(g => g.score)) : null,
            average: mine.length ? Math.round(mine.reduce((s, g) => s + g.score, 0) / mine.length) : null,
            streak,
            players: Object.values(players).sort((a, b) => b.wins - a.wins || a.total / a.games - b.total / b.games),
        };
    }, [gameHistory, profileId, profileName]);

    const handleExport = () => {
        const blob = new Blob([JSON.stringify({ version: 1, exportDate: new Date().toISOString(), gameHistory }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `skyjo-statistiques-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };
    const handleImport = event => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const parsed = JSON.parse(e.target.result);
                if (Array.isArray(parsed.gameHistory)) {
                    const existing = new Set(gameHistory.map(g => g.id));
                    const fresh = parsed.gameHistory.filter(g => !existing.has(g.id));
                    if (fresh.length) {
                        useGameStore.setState(state => ({ gameHistory: [...fresh, ...state.gameHistory].slice(0, 50) }));
                        alert(`${fresh.length} partie(s) importée(s) !`);
                    } else alert('Toutes les parties sont déjà présentes.');
                }
            } catch { alert('Erreur lors de la lecture du fichier.'); }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const { mine } = data;
    // Temps de jeu : temps réel mesuré + estimation pour les parties jouées avant le début du suivi.
    const since = playTimeSince ? Date.parse(playTimeSince) : Infinity;
    const estimatedMs = gameHistory.filter(g => !(Date.parse(g.date) >= since))
        .reduce((sum, g) => sum + (g.roundsPlayed || g.rounds?.length || 1) * MINUTES_PER_ROUND * 60000, 0);
    const playTime = formatDuration(playTimeMs + estimatedMs);
    const shownPlayers = showAllPlayers ? data.players : data.players.slice(0, 4);

    return <main className="st-screen">
        <header className="st-header"><p>VOTRE PARCOURS</p><h1>Statistiques.</h1></header>

        {mine.length === 0 ? <section className="st-empty">
            <span className="st-empty-icon"><Trophy size={26} strokeWidth={1.6} aria-hidden="true" /></span>
            <h2>Aucune partie pour l’instant</h2>
            <p>Terminez une partie contre l’IA, en ligne ou entre amis : vos statistiques apparaîtront ici.</p>
        </section> : <>
            {/* Taux de victoire */}
            <section className="st-hero" aria-label="Taux de victoire">
                <div className="st-ring-wrap">
                    <WinRing rate={data.rate} />
                    <div className="st-ring-label"><strong>{Math.round(data.rate * 100)}<small>%</small></strong><span>de victoires</span></div>
                </div>
                <div className="st-hero-copy">
                    <p><b>{data.wins}</b> victoire{data.wins > 1 ? 's' : ''} sur <b>{mine.length}</b> partie{mine.length > 1 ? 's' : ''}</p>
                    {data.streak >= 2 ? <span className="st-streak"><Flame size={14} aria-hidden="true" />{data.streak} victoires d’affilée</span>
                        : mine[0]?.won ? <span className="st-streak"><Flame size={14} aria-hidden="true" />Dernière partie gagnée</span>
                        : <span className="st-streak is-calm">La prochaine sera la bonne</span>}
                </div>
            </section>

            {/* Temps de jeu */}
            <section className="st-time" aria-label="Temps de jeu">
                <span className="st-time-icon"><Hourglass size={18} aria-hidden="true" /></span>
                <div className="st-time-copy"><span>Temps de jeu</span><strong>{playTime.big}<small> {playTime.unit}</small></strong></div>
                {estimatedMs > 0 && <p className="st-time-note">dont {formatDuration(estimatedMs).big} {formatDuration(estimatedMs).unit} estimées pour vos parties d’avant le suivi</p>}
            </section>

            {/* Chiffres clés */}
            <section className="st-tiles" aria-label="Chiffres clés">
                <div className="st-tile"><Gamepad2 size={16} aria-hidden="true" /><strong>{mine.length}</strong><span>Parties jouées</span></div>
                <div className="st-tile st-tile--gold"><Target size={16} aria-hidden="true" /><strong>{data.best}</strong><span>Meilleur score</span></div>
                <div className="st-tile"><Trophy size={16} aria-hidden="true" /><strong>{data.average}</strong><span>Score moyen</span></div>
                <div className="st-tile st-tile--coral"><Flame size={16} aria-hidden="true" /><strong>{data.streak}</strong><span>Série en cours</span></div>
            </section>

            {/* Derniers scores */}
            <section className="st-card" aria-label="Derniers scores">
                <h2>Vos derniers scores<span>plus bas = mieux</span></h2>
                <ScoreBars scores={mine.slice(0, 10).reverse()} />
                <p className="st-legend"><i className="is-win" />Victoire<i />Défaite</p>
            </section>

            {/* Parties récentes */}
            <section className="st-card" aria-label="Parties récentes">
                <h2>Parties récentes<span>{Math.min(mine.length, 6)} sur {mine.length}</span></h2>
                <ul className="st-games">
                    {mine.slice(0, 6).map(g => {
                        const M = MODE[g.mode];
                        return <li key={g.id}>
                            <span className={`st-game-mode st-game-mode--${g.mode}`} title={M.label}><M.icon size={15} aria-hidden="true" /></span>
                            <span className="st-game-main"><strong>{g.opponents.length ? `vs ${g.opponents.join(', ')}` : M.label}</strong><small>{M.label} · {relativeDate(g.date)}</small></span>
                            <span className={`st-game-result${g.won ? ' is-win' : ''}`}><b>{g.score}</b><small>{g.won ? 'Victoire' : 'Défaite'}</small></span>
                        </li>;
                    })}
                </ul>
            </section>
        </>}

        {/* Palmarès de tous les joueurs croisés */}
        {data.players.length > 0 && <section className="st-card" aria-label="Palmarès">
            <h2>Palmarès<span>{data.players.length} joueur{data.players.length > 1 ? 's' : ''}</span></h2>
            <ol className="st-ranking">
                {shownPlayers.map((p, i) => <li key={p.name}>
                    <span className={`st-rank st-rank--${i + 1}`}>{i + 1}</span>
                    <span className="st-game-main"><strong>{p.name}</strong><small>{p.games} partie{p.games > 1 ? 's' : ''} · moy. {Math.round(p.total / p.games)} pts</small></span>
                    <span className="st-wins"><b>{p.wins}</b><Trophy size={13} aria-hidden="true" /></span>
                </li>)}
            </ol>
            {data.players.length > 4 && <button type="button" className="st-more" onClick={() => setShowAllPlayers(v => !v)}>
                {showAllPlayers ? 'Réduire' : 'Voir tout le palmarès'}<ChevronDown size={15} className={showAllPlayers ? 'is-open' : ''} aria-hidden="true" />
            </button>}
        </section>}

        <div className="st-data">
            <input type="file" ref={fileInputRef} accept=".json" onChange={handleImport} hidden />
            <button type="button" onClick={() => fileInputRef.current?.click()}><Upload size={13} aria-hidden="true" />Importer</button>
            {gameHistory.length > 0 && <button type="button" onClick={handleExport}><Download size={13} aria-hidden="true" />Exporter</button>}
        </div>
    </main>;
}
