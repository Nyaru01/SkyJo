import { Check, Eye, Flag, Trophy } from 'lucide-react';
import SkyjoCard from './SkyjoCard';
import '../../styles/RoundResults.css';

export default function RoundResultsPlayers({ scores = [], gameState, totals }) {
    const ordered = [...scores].sort((a, b) => a.finalScore - b.finalScore);
    const bonusMode = gameState.isBonusMode || gameState.isHardcoreMode;
    return <div className="round-results-list">
        {ordered.map(score => {
            const player = gameState.players.find(p => p.id === score.playerId);
            const rank = 1 + ordered.filter(s => s.finalScore < score.finalScore).length;
            const cleared = [0, 1, 2, 3].filter(col => [0, 1, 2].every(row => player?.hand[col * 3 + row] === null)).length;
            return <article key={score.playerId} className={`round-player ${rank === 1 ? 'round-player--winner' : ''}`}>
                <header className="round-player-header">
                    <span className="round-rank">{rank === 1 ? <Trophy size={16} /> : String(rank).padStart(2, '0')}</span>
                    <div className="round-player-identity"><h3>{score.playerName}</h3><span>{rank === 1 ? 'MEILLEURE MANCHE' : `POSITION ${rank}`}</span></div>
                    {score.isFinisher && <span className="round-finisher"><Flag size={10} /> Finisseur</span>}
                </header>
                <div className="round-player-body">
                    <div className="round-board">
                        {[0, 1, 2, 3].map(col => {
                            const indices = [col * 3, col * 3 + 1, col * 3 + 2];
                            if (indices.every(i => player?.hand[i] === null)) return <div className="round-cleared" key={col} aria-label={bonusMode ? 'Colonne supprimée : bonus −3' : 'Colonne supprimée'}><Check size={16} /><span>{bonusMode ? '−3' : '✓'}</span><small>CLEAR</small></div>;
                            return <div className="round-column" key={col}>{indices.map(i => {
                                const card = player?.hand[i];
                                const result = gameState.chestResults?.[card?.id];
                                const resolved = card ? { ...card, isRevealed: true, value: result ?? card.value, specialType: result !== undefined ? null : card.specialType } : null;
                                return <div className="round-card-cell" key={i}><SkyjoCard card={resolved} size="xs" style={{ width: '100%', height: '100%' }} />{card && (card.wasAutoRevealed || !card.isRevealed) && <span className="round-auto-reveal" role="img" aria-label="Carte révélée en fin de manche" title="Carte révélée en fin de manche"><Eye size={11} strokeWidth={2.2} /></span>}</div>;
                            })}</div>;
                        })}
                    </div>
                    <div className="round-score-panel"><span className="round-score-label">CETTE MANCHE</span><strong className={score.finalScore < 0 ? 'good' : score.penalized ? 'penalty' : ''}>{score.finalScore > 0 ? '+' : ''}{score.finalScore}</strong>{score.penalized && <span className="round-penalty">Score doublé</span>}<div className="round-total"><span>TOTAL PARTIE</span><b className={totals[score.playerId] >= 100 ? 'penalty' : ''}>{totals[score.playerId]}</b></div></div>
                </div>
                <footer className="round-player-footer"><span>{cleared ? `${cleared} colonne${cleared > 1 ? 's' : ''} supprimée${cleared > 1 ? 's' : ''}` : 'Aucune colonne supprimée'}</span>{bonusMode && cleared > 0 && <b>Bonus −{cleared * 3}</b>}</footer>
            </article>;
        })}
        <p className="round-results-legend"><span className="round-reveal-key" aria-hidden="true"><Eye size={11} strokeWidth={2.2} /></span> Révélée en fin de manche</p>
    </div>;
}
