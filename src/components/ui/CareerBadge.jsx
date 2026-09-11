import { Shield, Crown, Sparkles } from 'lucide-react';
import { getCareerIdentity, getCareerTier } from '../../lib/masterCareer';
import '../../styles/CareerBadge.css';

export default function CareerBadge({ level = 1 }) {
    const tier = getCareerTier(level);
    const identity = getCareerIdentity(level);
    const Icon = tier === 'prestige' ? Sparkles : tier === 'master' ? Crown : Shield;
    const label = tier === 'prestige' ? `Prestige ${identity.cycle - 1}` : tier === 'master' ? 'Maître' : 'Joueur';
    return <span className={`career-identity career-${tier}`}>
        <span className="career-badge"><Icon size={12} aria-hidden="true" />{label}</span>
        <span className="career-level">{tier === 'prestige' ? `Palier ${identity.masterLevel} · Niv. ${level}` : `Niveau ${level}`}</span>
    </span>;
}
