import { Component, Suspense, lazy, useEffect, useState } from 'react';
import '../../styles/HomeWorld.css';

const load3D = () => import('./HomeWorldScene3D');
const HomeWorldScene3D = lazy(load3D);

// Scène d'accueil en 3D CSS : une table SKYJO qui flotte dans le ciel.
// Grille de 12 cartes en perspective, pioche en relief, une carte qui se retourne
// et quelques cartes lointaines qui dérivent pour donner de la profondeur.
// (L'ancienne illustration reste disponible : /artwork/home-pavilion-v1.png)
const GRID = [
    null, 5, null, null,
    -1, null, 0, null,
    null, null, 9, 3,
];
const tone = value => value < 0 ? 'indigo' : value === 0 ? 'sky' : value <= 4 ? 'mint' : value <= 8 ? 'sun' : 'rose';

function Face({ value }) {
    return <div className={`s3-card s3-card--${tone(value)}`}><small>{value}</small><b>{value}</b><small>{value}</small></div>;
}

function Back() {
    return <div className="s3-card s3-card--back"><i /></div>;
}

const DRIFTERS = [
    { value: 7, x: '6%', y: '14%', r: -18, d: 0.55, t: 0 },
    { value: -2, x: '84%', y: '6%', r: 14, d: 0.45, t: -3 },
    { value: 11, x: '88%', y: '58%', r: -10, d: 0.6, t: -6 },
    { value: 2, x: '2%', y: '62%', r: 12, d: 0.5, t: -9 },
];

function HomeWorldSceneCss() {
    return <div className="lobby-world s3" aria-hidden="true">
        <div className="s3-glow" />
        <div className="s3-haze s3-haze--1" />
        <div className="s3-haze s3-haze--2" />
        {DRIFTERS.map(({ value, x, y, r, d, t }) => (
            <div key={value} className="s3-drifter" style={{ left: x, top: y, '--r': `${r}deg`, '--d': d, animationDelay: `${t}s` }}>
                <Face value={value} />
            </div>
        ))}
        <div className="s3-stage">
            <div className="s3-island">
                <div className="s3-board">
                    {GRID.map((value, index) => value === null
                        ? <Back key={index} />
                        : <Face key={index} value={value} />)}
                </div>
                <div className="s3-pile">
                    {[0, 1, 2, 3, 4].map(i => <div key={i} className="s3-card s3-card--back" style={{ '--z': i }}><i /></div>)}
                </div>
            </div>
        </div>
        <div className="s3-flyer">
            <div className="s3-flyer-inner">
                <div className="s3-card s3-card--back s3-side"><i /></div>
                <div className="s3-side s3-side--front"><Face value={12} /></div>
            </div>
        </div>
        <div className="s3-shadow" />
        {[0, 1, 2, 3, 4, 5].map(i => <i key={i} className="sky-world-spark" style={{ '--s': i }} />)}
    </div>;
}

function supportsWebGL() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
    } catch {
        return false;
    }
}

// Si la scène 3D plante (contexte WebGL perdu, pilote capricieux), on garde la scène CSS.
class SceneBoundary extends Component {
    constructor(props) { super(props); this.state = { failed: false }; }
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch(error) { console.warn('[HomeWorld] Scène 3D indisponible, repli CSS.', error); }
    render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

// Pendant le chargement de l'île 3D : rien que le ciel (pas l'ancienne table CSS, qui « flashait »).
function LoadingSky() {
    return <div className="lobby-world lobby-world--loading" aria-hidden="true" />;
}

export default function HomeWorldScene({ compact = false }) {
    const [ready, setReady] = useState(false);
    const [webgl] = useState(supportsWebGL);
    // On lance le téléchargement de la scène 3D en même temps que l'attente des polices.
    useEffect(() => { if (webgl) load3D().catch(() => {}); }, [webgl]);
    useEffect(() => {
        // Les textures des cartes utilisent Bricolage Grotesque : on attend la police avant de les dessiner.
        let alive = true;
        const fonts = document.fonts?.load ? Promise.all([document.fonts.load('800 100px "Bricolage Grotesque"'), document.fonts.load('500 100px "Cormorant Garamond"')]) : Promise.resolve();
        fonts.catch(() => {}).finally(() => { if (alive) setReady(true); });
        return () => { alive = false; };
    }, []);
    // La scène CSS ne sert plus que de secours : pas de WebGL, ou scène 3D en échec.
    const fallback = <HomeWorldSceneCss />;
    if (!webgl) return fallback;
    if (!ready) return <LoadingSky />;
    return <SceneBoundary fallback={fallback}>
        <Suspense fallback={<LoadingSky />}><HomeWorldScene3D compact={compact} /></Suspense>
    </SceneBoundary>;
}
