import { Check, CheckCircle2, Cloud, Copy, Edit2 } from 'lucide-react';
import { getAvatarPath } from '../lib/avatars';

export default function SocialProfileCard({ profile, isEditing, name, onNameChange, onEdit, onSave, onCancel, onAvatar, onCopy, copied, onGoogleLink }) {
    return <section className="social-profile-panel" aria-label="Votre profil social">
        <div className="social-profile-identity">
            <button type="button" onClick={onAvatar} className="social-profile-avatar" aria-label="Modifier mon avatar">
                <img src={getAvatarPath(profile.avatarId) || '/avatars/cat.png'} alt="" width="72" height="72" /><span><Edit2 size={13} aria-hidden="true" /></span>
            </button>
            <div className="social-profile-name"><p>VOTRE PROFIL</p>
                {isEditing ? <form onSubmit={event => { event.preventDefault(); onSave(); }}>
                    <input autoFocus aria-label="Votre pseudo" value={name} onChange={event => onNameChange(event.target.value)} onBlur={onSave} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); onCancel(); } }} />
                    <button type="submit" aria-label="Enregistrer mon pseudo" onMouseDown={event => event.preventDefault()}><Check size={20} aria-hidden="true" /></button>
                </form> : <h2><button type="button" onClick={onEdit} aria-label="Modifier mon pseudo"><span>{profile.name || 'Votre profil'}</span><Edit2 size={16} aria-hidden="true" /></button></h2>}
            </div>
        </div>
        <div className="social-profile-id"><span>Votre SkyID</span><code>{profile.vibeId || 'En attente'}</code><button type="button" onClick={onCopy} disabled={!profile.vibeId} aria-label={copied ? 'SkyID copié' : 'Copier mon SkyID'}>{copied ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}</button><span className="sr-only" role="status">{copied ? 'SkyID copié' : ''}</span></div>
        <div className="social-account">
            <div className="social-account-row">
                <div className="social-account-heading"><Cloud size={19} aria-hidden="true" /><div><h3>Sauvegarde</h3><p>{profile.isLinked ? 'Compte Google lié' : 'Compte non lié'}</p></div></div>
                {profile.isLinked ? <span className="social-account-linked"><CheckCircle2 size={19} aria-hidden="true" />Lié</span> : <button type="button" className="social-google-link" onClick={onGoogleLink} aria-label="Lier mon compte Google"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" width="16" height="16" /><span>Lier Google</span></button>}
            </div>
            {!profile.isLinked && <button type="button" className="social-account-restore" onClick={onGoogleLink}>Restaurer un compte existant</button>}
        </div>
    </section>;
}
