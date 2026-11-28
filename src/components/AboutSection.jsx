import { useState, useRef } from 'react';
import { ChevronDown, Shield } from 'lucide-react';

export function AboutSection({ onAdminUnlock, appVersion = 'v2.1.0' }) {
    const [clickCount, setClickCount] = useState(0);
    const [showAdminInput, setShowAdminInput] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [adminCode, setAdminCode] = useState('');
    const [adminError, setAdminError] = useState('');
    const [adminPending, setAdminPending] = useState(false);
    const clickTimeout = useRef(null);

    // In production, this should be validated via API call to avoid exposing hash in frontend bundle
    // For MVP/Local, we can use a simple client-side check or verify via the API immediately
    // Here we will use the API verification pattern to be secure

    const handleVersionClick = () => {
        setClickCount(prev => prev + 1);

        // Reset after 2s of inactivity
        if (clickTimeout.current) clearTimeout(clickTimeout.current);
        clickTimeout.current = setTimeout(() => setClickCount(0), 2000);

        if (clickCount + 1 >= 5) {
            setShowAdminInput(true);
            setClickCount(0);
        }
    };

    const handleAdminSubmit = async () => {
        if (adminPending || !adminCode.trim()) return;
        setAdminPending(true);
        setAdminError('');
        try {
            const response = await fetch('/api/feedback/admin/verify', {
                headers: { 'x-admin-auth': adminCode.trim() },
                cache: 'no-store',
            });
            if (!response.ok) {
                setAdminError(response.status === 401 || response.status === 403
                    ? 'Mot de passe refusé par le serveur. En production, utilisez le secret configuré sur Railway.'
                    : 'Vérification indisponible. Réessayez dans un instant.');
                return;
            }
            onAdminUnlock(adminCode.trim());
            setAdminCode('');
        } catch {
            setAdminError('Serveur injoignable. Vérifiez votre connexion.');
        } finally {
            setAdminPending(false);
        }
    };

    return (
        <section aria-labelledby="about-title" className="glass-premium w-full max-w-md mx-auto rounded-3xl border border-white/10 p-5 shadow-xl sm:p-6">
            <header className="flex items-center gap-4">
                <img src="/brand/vesper-v-512.png" alt="" className="size-14 shrink-0 rounded-xl border border-white/10 bg-[#1e1b31] object-contain" />
                <div>
                    <h2 id="about-title" className="text-xl font-bold !text-[#fbf3e7]">À propos de Vesper</h2>
                    <p className="mt-1 text-sm text-[#c4bacb]">Un jeu de Nyaru Studio</p>
                </div>
            </header>
            <p className="mt-4 text-sm leading-relaxed text-[#ded5e1]">Jouez en Tourment ou en Fury, contre l’IA ou avec vos amis en ligne.</p>

            <div className="mt-5 space-y-2">
                <button
                    type="button"
                    onClick={handleVersionClick}
                    className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 text-left text-sm text-[#f1e9e1] transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e3cfa8]"
                >
                    <span>Version</span>
                    <span className="font-mono font-semibold text-[#e3cfa8]">{appVersion}</span>
                </button>
                <button
                    type="button" aria-expanded={showPrivacy} aria-controls="about-privacy"
                    onClick={() => setShowPrivacy(current => !current)}
                    className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 text-left text-sm text-[#f1e9e1] transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e3cfa8]"
                >
                    <span>Politique de confidentialité</span>
                    <ChevronDown size={17} className={showPrivacy ? 'rotate-180 shrink-0 text-[#c4bacb]' : 'shrink-0 text-[#c4bacb]'} aria-hidden="true" />
                </button>

                {/* Privacy Content (Expandable) */}
                {showPrivacy && (
                    <div id="about-privacy" className="rounded-xl border border-white/10 bg-slate-950/40 p-4 text-left text-xs leading-relaxed text-white/80">
                        <h3 className="text-white font-bold mb-3 uppercase tracking-wider text-xs">Données & Confidentialité</h3>

                        <div className="space-y-4 font-medium">
                            <section>
                                <p className="text-indigo-400 font-bold mb-1 uppercase tracking-tighter">1. Informations que nous collectons</p>
                                <p className="mb-2 italic opacity-60">Certains partenaires tiers peuvent collecter automatiquement :</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>Identifiants d'appareil (Advertising ID).</li>
                                    <li>Localisation approximative (IP).</li>
                                    <li>Données d'utilisation (sessions, progression, crashs).</li>
                                </ul>
                            </section>

                            <section>
                                <p className="text-indigo-400 font-bold mb-1 uppercase tracking-tighter">2. Utilisation des données</p>
                                <p>Fonctionnement du jeu, analyse technique, publicité non intrusive (si applicable) et équilibrage de l'expérience.</p>
                            </section>

                            <section>
                                <p className="text-indigo-400 font-bold mb-1 uppercase tracking-tighter">3. Partage & Tiers</p>
                                <p className="mb-2">Nous ne vendons pas vos données.</p>
                                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                                    <p className="mb-1 opacity-60">Service tiers utilisé :</p>
                                    <a href="https://railway.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                                        Railway.com <span className="text-[8px]">↗</span>
                                    </a>
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </div>
            <p className="mt-4 text-xs text-[#b8aebf]">© 2026 Nyaru Studio</p>

            {/* Easter Egg / Admin Input */}
            {showAdminInput && (
                <div className="mt-8 p-5 bg-slate-950/40 rounded-2xl border border-white/20 backdrop-blur-md animate-in slide-in-from-top-6 duration-300">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <Shield className="w-5 h-5 text-indigo-400" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-indigo-300">Auth Terminal</span>
                    </div>

                    <div className="relative">
                        <input
                            id="admin-input"
                            type="password"
                            value={adminCode}
                            onChange={(e) => setAdminCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdminSubmit()}
                            placeholder="ADMIN_KEY"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono tracking-[0.3em] uppercase"
                            autoFocus
                        />
                    </div>

                    <button
                        onClick={handleAdminSubmit}
                        disabled={adminPending || !adminCode.trim()}
                        className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                    >
                        {adminPending ? 'Vérification…' : 'Connexion'}
                    </button>
                    {adminError && <p role="alert" className="mt-3 text-sm text-amber-200">{adminError}</p>}
                </div>
            )}
        </section>
    );
}
