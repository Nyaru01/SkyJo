import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion';
import { Edit2, Plus, X } from 'lucide-react';
import { getAvatarPath } from '../../lib/avatars';

export default function HomePlayerList({ players, onNameChange, onAvatar, onAdd, onRemove }) {
    const reduced = useReducedMotion();
    return <section className="lobby-players" aria-label="Joueurs de la feuille de score">
        <div className="lobby-section-heading"><h3>Votre table</h3><span>{players.length} / 8 joueurs</span></div>
        <div className="lobby-player-list"><AnimatePresence initial={false}>{players.map((player, index) => <Motion.div className="lobby-player" key={player.draftId}
            initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .16 }}>
            <button type="button" className="lobby-avatar" aria-label={`Modifier l’avatar du joueur ${index + 1}`} onClick={() => onAvatar(index)}>
                <img src={getAvatarPath(player.avatarId)} alt=""/><Edit2 size={11} aria-hidden="true"/>
            </button>
            <label className="lobby-player-name"><span className="sr-only">Pseudo du joueur {index + 1}</span><input value={player.name} placeholder={`Joueur ${index + 1}`} onChange={event => onNameChange(index, event.target.value)} autoComplete="off" spellCheck="false"/></label>
            {players.length > 2 && <button type="button" className="lobby-remove" aria-label={`Retirer le joueur ${index + 1}`} onClick={() => onRemove(index)}><X size={17} aria-hidden="true"/></button>}
        </Motion.div>)}</AnimatePresence></div>
        {players.length < 8 && <button type="button" className="lobby-add" onClick={onAdd}><Plus size={19} aria-hidden="true"/>Ajouter un joueur</button>}
    </section>;
}
