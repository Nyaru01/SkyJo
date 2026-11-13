import { Crown, Trophy, TrendingUp } from 'lucide-react';
import { getAvatarPath } from '../lib/avatars';
import { getCareerTier } from '../lib/masterCareer';
import CareerBadge from './ui/CareerBadge';
import '../styles/SocialPanel.css';

function PodiumPlayer({ user, rank, currentUserId }) {
    if (!user) return <div aria-hidden="true" />;
    return <div className={`social-podium-player social-podium-player--${rank} career-${getCareerTier(user.level || 1)}`} aria-label={`${rank === 1 ? 'Premier' : rank === 2 ? 'Deuxième' : 'Troisième'} : ${user.name}`}>
        <div className="social-podium-portrait">
            <div className="career-frame"><img src={getAvatarPath(user.avatar_id) || '/avatars/cat.png'} alt="" width="88" height="88" /></div>
            <span className="social-podium-rank">{rank === 1 && <Crown size={15} aria-hidden="true" />}{rank}</span>
        </div>
        <p className="social-podium-name" title={user.name}>{user.name}</p>
        {String(user.id) === String(currentUserId) && <span className="social-leaderboard-me">Vous</span>}
        <CareerBadge level={user.level || 1} />
        <p className="social-podium-xp"><b>{user.xp || 0}</b> XP</p>
    </div>;
}

export default function Leaderboard({ data = [], currentUserId }) {
    const others = data.slice(3);
    return <section className="social-leaderboard" aria-label="Classement des joueurs">
        {data.length > 0 ? <>
            <div className="social-podium-panel">
                <header><div><p>LES JOUEURS EN TÊTE</p><h2>Le podium</h2></div><Trophy size={24} strokeWidth={1.6} aria-hidden="true" /></header>
                <div className="social-podium">
                    <PodiumPlayer user={data[1]} rank={2} currentUserId={currentUserId} />
                    <PodiumPlayer user={data[0]} rank={1} currentUserId={currentUserId} />
                    <PodiumPlayer user={data[2]} rank={3} currentUserId={currentUserId} />
                </div>
            </div>
            <div className="social-career-legend" aria-label="Grades de carrière"><span>Challenger <b>1–99</b></span><span>Maître <b>100–200</b></span><span>Prestige <b>201+</b></span></div>
            {others.length > 0 && <div className="social-ranking-list"><header><h3>La suite du classement</h3><span>{data.length} joueurs</span></header>
                {others.map((user,index) => {
                    const isMe = String(user.id) === String(currentUserId);
                    return <div key={user.id} className={`social-ranking-row ${isMe ? 'social-ranking-row--me' : ''}`}>
                        <span className="social-ranking-position">{index+4}</span>
                        <img src={getAvatarPath(user.avatar_id) || '/avatars/cat.png'} alt="" width="40" height="40" />
                        <div className="social-ranking-person"><p>{user.name}{isMe && <span className="social-leaderboard-me">Vous</span>}</p><span>{user.vibe_id || ''}</span></div>
                        <div className="social-ranking-career"><CareerBadge level={user.level || 1} /><span><b>{user.xp || 0}</b> XP</span></div>
                    </div>;
                })}
            </div>}
        </> : <div className="social-leaderboard-empty"><TrendingUp size={32} aria-hidden="true" /><h2>Aucun joueur à afficher</h2><p>Le classement apparaîtra ici dès que les données seront disponibles.</p></div>}
    </section>;
}
