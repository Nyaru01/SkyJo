import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, RepeatWrapping, BoxGeometry, BufferAttribute, BufferGeometry, CanvasTexture, CatmullRomCurve3, Color, DataTexture, LinearFilter, LinearMipmapLinearFilter, MathUtils, RGBAFormat, PlaneGeometry, SRGBColorSpace, Vector3 } from 'three';
import { backTexture, pastelFaceTexture } from './cardTextures';
import { useGameStore } from '../../store/gameStore';
import { getCardSkinPath } from '../../lib/skinUtils';
import { currentSeason } from '../../lib/season';
import { useSeasonalClock } from '../../hooks/useSeasonalClock';
import { FallingLeaves, ShootingStars, Snowfall } from './SeasonEffects';
import { MascotBot } from '../virtual/Mascot3D';

// Couleurs qui changent avec la saison (feuillage, coupole, eau du bassin).
const SEASON_TINT = {
    autumn: { leaf: '#c9844e', dome: '#c9b2a5', water: null },
    winter: { leaf: '#e7ecf1', dome: '#f1f4f7', water: [0.7, 0.8, 0.84] },
    spring: { leaf: '#b9cdb0', dome: '#d6bcb6', water: null },
    summer: { leaf: '#a8b9a6', dome: '#c9b2a5', water: null },
};
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
extend({ RoundedBoxGeometry });

const StoneContext = createContext(null);

// One shared, deterministic mineral grain for the architecture; no image request.
// Built as a DataTexture (pixels kept in JS memory) rather than a 2D canvas: on Android, Chrome may clear
// canvases while the app is in the background, and the re-uploaded texture then turned the whole island black.
function makeStoneTexture() {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    let seed = 37;
    for (let i = 0; i < data.length; i += 4) {
        seed = (seed * 16807) % 2147483647;
        const shade = 224 + Math.floor(seed / 2147483647 * 30);
        data[i] = shade; data[i + 1] = shade; data[i + 2] = shade; data[i + 3] = 255;
    }
    const texture = new DataTexture(data, size, size, RGBAFormat);
    texture.colorSpace = SRGBColorSpace;
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
}

// Dos du skin choisi par le joueur (même dos qu'en partie).
function usePlayerBack() {
    const skin = useGameStore(state => state.cardSkin);
    const path = getCardSkinPath(skin || 'classic');
    return useMemo(() => backTexture(path), [path]);
}

// Accueil belvédère : île, tour et cartes dans le ciel de crépuscule.
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = t => Math.min(1, Math.max(0, t));
const haptic = () => { try { navigator.vibrate?.(10); } catch { /* indisponible */ } };
const setPointer = on => { document.body.style.cursor = on ? 'pointer' : ''; };

const C = {
    stone: '#ece5db', stoneEdge: '#dcd2c6',
    coral1: '#d3c6db', coral2: '#bfb1cc', coral3: '#a99bb9', coral4: '#968aa8',
    lilac: '#adb3c6', lilacDark: '#9299b0', dome: '#c9b2a5',
    water: '#aec5c4', leaf: '#a8b9a6', trunk: '#a48c7c', gold: '#d9b77e',
};

// Grille du parvis : null = carte face cachée.
const GRID = [5, null, -1, null, null, 0, null, 9, 3, null, 12, null];
const CARD = { w: 0.62, h: 0.86, t: 0.035 };
const CARD_GEO = new BoxGeometry(CARD.w, CARD.t, CARD.h);
const CARD_FACE = new PlaneGeometry(CARD.w - 0.02, CARD.h - 0.02);

function Block({ size, position, color, rotation }) {
    const stone = useContext(StoneContext);
    return <mesh position={position} rotation={rotation} castShadow receiveShadow>
        <roundedBoxGeometry args={[...size, 2, Math.min(...size, 0.18) * 0.2]} />
        <meshStandardMaterial color={color} map={stone} roughness={0.92} />
    </mesh>;
}

// Carte posée à plat ; se retourne (vague d'intro puis au tap).
function PlazaCard({ value, x, z, order, clock, still, onTouch, index, register }) {
    const ref = useRef();
    const [shown, setShown] = useState(value);
    const state = useRef({ faceUp: false, angle: Math.PI, introDone: false });
    useEffect(() => {
        register(index, () => {
            const s = state.current;
            if (!s.introDone) return;
            if (!s.faceUp) setShown(Math.floor(Math.random() * 15) - 2);
            s.faceUp = !s.faceUp;
        });
    }, [register, index]);
    const front = useMemo(() => (shown === null ? null : pastelFaceTexture(shown)), [shown]);
    const back = usePlayerBack();
    useFrame((_, delta) => {
        const g = ref.current;
        if (!g) return;
        const s = state.current;
        const t = clock.current;
        if (!s.introDone) {
            const k = still ? 1 : easeInOut(clamp01((t - 1.7 - order * 0.07) / 0.5));
            if (value !== null) s.angle = Math.PI * (1 - k);
            if (k >= 1) { s.introDone = true; s.faceUp = value !== null; }
        } else {
            s.angle = MathUtils.damp(s.angle, s.faceUp ? 0 : Math.PI, 9, delta);
        }
        const lift = Math.sin(clamp01(s.angle / Math.PI) * Math.PI) * 0.35;
        g.position.set(x, CARD.t / 2 + 0.005 + lift, z);
        g.rotation.set(0, 0, s.angle);
    });
    return <group ref={ref}
        onClick={e => {
            e.stopPropagation();
            const s = state.current;
            if (!s.introDone) return;
            if (!s.faceUp && shown === null) setShown(Math.floor(Math.random() * 15) - 2);
            s.faceUp = !s.faceUp; onTouch();
        }}
        onPointerOver={() => setPointer(true)} onPointerOut={() => setPointer(false)}>
        <mesh geometry={CARD_GEO} castShadow receiveShadow><meshLambertMaterial color="#fffaf3" /></mesh>
        {front && <mesh geometry={CARD_FACE} rotation-x={-Math.PI / 2} position-y={CARD.t / 2 + 0.001}>
            <meshBasicMaterial map={front} transparent alphaTest={0.5} />
        </mesh>}
        <mesh geometry={CARD_FACE} rotation-x={Math.PI / 2} position-y={-CARD.t / 2 - 0.001}>
            <meshBasicMaterial map={back} transparent alphaTest={0.5} />
        </mesh>
    </group>;
}


function PivotCard({ still, onTouch, mechanism }) {
    const ref = useRef();
    const spin = useRef({ target: 0, angle: 0, seen: 0 });
    const back = usePlayerBack();
    const face = useMemo(() => pastelFaceTexture(12), []);
    useFrame((state, delta) => {
        if (!ref.current) return;
        const s = spin.current;
        // Le mécanisme de la tour fait faire un tour complet à la carte.
        if (mechanism.current.count !== s.seen) { s.seen = mechanism.current.count; s.target += Math.PI * 2; }
        if (!still) s.target += delta * 0.35;
        s.angle = MathUtils.damp(s.angle, s.target, 4, delta);
        ref.current.rotation.y = s.angle;
        ref.current.position.y = 4.12 + (still ? 0 : Math.sin(state.clock.elapsedTime * 1.2) * 0.04);
    });
    return <group ref={ref} position={[1.75, 4.12, -1.2]} scale={0.8}
        onClick={e => { e.stopPropagation(); spin.current.target += Math.PI * 2; onTouch(); }}
        onPointerOver={() => setPointer(true)} onPointerOut={() => setPointer(false)}>
        <mesh><boxGeometry args={[0.78, 1.08, 0.04]} /><meshLambertMaterial color="#fffaf3" /></mesh>
        <mesh position-z={0.021}><planeGeometry args={[0.76, 1.06]} /><meshBasicMaterial map={face} transparent alphaTest={0.5} /></mesh>
        <mesh position-z={-0.021} rotation-y={Math.PI}><planeGeometry args={[0.76, 1.06]} /><meshBasicMaterial map={back} transparent alphaTest={0.5} /></mesh>
    </group>;
}
function TowerTop({ still, mechanism, onTrigger, season = 'autumn' }) {
    const ref = useRef();
    const turn = useRef({ target: 0, last: 0, seen: 0 });
    useFrame((state, delta) => {
        if (!ref.current) return;
        const t = state.clock.elapsedTime;
        const s = turn.current;
        // Un toucher déclenche un quart de tour immédiat ; sinon, un quart de tour toutes les ~6 s.
        if (mechanism.current.count !== s.seen) { s.seen = mechanism.current.count; s.target += Math.PI / 2; s.last = t; }
        else if (!still && t > 4 && t - s.last > 6) { s.target += Math.PI / 2; s.last = t; }
        ref.current.rotation.y = MathUtils.damp(ref.current.rotation.y, s.target, 3.5, delta);
    });
    return <group ref={ref} position={[1.75, 0, -1.2]}
        onClick={e => { e.stopPropagation(); onTrigger(); }}
        onPointerOver={() => setPointer(true)} onPointerOut={() => setPointer(false)}>
        {/* Salle haute : murs, pilastres d'angle et une fenêtre en arc éclairée sur chaque face */}
        <Block size={[0.92, 0.62, 0.92]} position={[0, 2.56, 0]} color={C.lilac} />
        {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz]) => <Block key={`p${sx}${sz}`} size={[0.13, 0.7, 0.13]} position={[sx * 0.46, 2.56, sz * 0.46]} color={C.lilacDark} />)}
        {[0, 1, 2, 3].map(i => <group key={`w${i}`} rotation-y={i * Math.PI / 2}><ArchWindow z={0.463} y={2.5} /></group>)}
        {/* Corniche, balcon et tambour octogonal */}
        <Block size={[1.14, 0.08, 1.14]} position={[0, 2.92, 0]} color={C.stone} />
        <Block size={[1.02, 0.05, 1.02]} position={[0, 2.99, 0]} color={C.stoneEdge} />
        <mesh position={[0, 3.1, 0]} castShadow><cylinderGeometry args={[0.36, 0.38, 0.18, 8]} /><meshLambertMaterial color={C.lilac} flatShading /></mesh>
        <mesh position={[0, 3.19, 0]} castShadow><sphereGeometry args={[0.36, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshLambertMaterial color={SEASON_TINT[season].dome} /></mesh>
        {/* Épi de faîtage doré */}
        <mesh position={[0, 3.58, 0]}><cylinderGeometry args={[0.016, 0.028, 0.06, 8]} /><meshLambertMaterial color={C.gold} /></mesh>
        <mesh position={[0, 3.63, 0]}><sphereGeometry args={[0.035, 16, 10]} /><meshLambertMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.25} /></mesh>
    </group>;
}
// Fenêtre en plein cintre : rectangle et demi-disque lumineux, appui en pierre.
function ArchWindow({ z, y }) {
    return <group position={[0, y, z]}>
        <mesh position-y={-0.04}><planeGeometry args={[0.2, 0.24]} /><meshBasicMaterial color="#ffd9a0" /></mesh>
        <mesh position-y={0.08}><circleGeometry args={[0.1, 16, 0, Math.PI]} /><meshBasicMaterial color="#ffe6bd" /></mesh>
        <mesh position={[0, 0.0, 0.01]}><circleGeometry args={[0.24, 24]} /><meshBasicMaterial color="#ffcf8a" transparent opacity={0.16} depthWrite={false} blending={AdditiveBlending} /></mesh>
        <mesh position={[0, -0.18, 0.02]}><boxGeometry args={[0.28, 0.035, 0.06]} /><meshLambertMaterial color={C.stone} /></mesh>
    </group>;
}
// Anneau doré qui tourne sous la carte du sommet, comme un engrenage du mécanisme.
function HaloRing({ still, mechanism }) {
    const ref = useRef();
    const spin = useRef({ speed: 0.4, seen: 0 });
    useFrame((state, delta) => {
        if (!ref.current) return;
        const s = spin.current;
        if (mechanism.current.count !== s.seen) { s.seen = mechanism.current.count; s.speed = 6; }
        s.speed = MathUtils.damp(s.speed, 0.4, 1.5, delta);
        if (!still) ref.current.rotation.z += delta * s.speed;
        ref.current.position.y = 3.72 + (still ? 0 : Math.sin(state.clock.elapsedTime * 1.2) * 0.04);
    });
    return <group ref={ref} position={[1.75, 3.72, -1.2]} rotation-x={-Math.PI / 2}>
        <mesh><torusGeometry args={[0.34, 0.016, 8, 48]} /><meshLambertMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.8} /></mesh>
        <mesh><torusGeometry args={[0.34, 0.05, 8, 48]} /><meshBasicMaterial color="#ffd58a" transparent opacity={0.18} depthWrite={false} blending={AdditiveBlending} /></mesh>
        {[0, 1, 2, 3, 4, 5].map(i => <mesh key={i} position={[Math.cos(i * Math.PI / 3) * 0.34, Math.sin(i * Math.PI / 3) * 0.34, 0]}>
            <sphereGeometry args={[0.03, 10, 8]} /><meshLambertMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.3} />
        </mesh>)}
    </group>;
}
// Arche du rez-de-chaussée, avec une lanterne suspendue qui se balance.
function TowerArch({ still, mechanism, clock }) {
    const lamp = useRef();
    const halo = useRef();
    const glow = useMemo(() => glowTexture('rgba(255,226,170,0.75)', 'rgba(255,190,110,0.12)'), []);
    useEffect(() => () => glow.dispose(), [glow]);
    useFrame(state => {
        const t = state.clock.elapsedTime;
        const since = clock.current - mechanism.current.at;
        const burst = since >= 0 && since < 1.6 ? Math.sin((since / 1.6) * Math.PI) : 0;
        if (lamp.current) lamp.current.rotation.z = still ? 0 : Math.sin(t * 1.3) * 0.08 + burst * Math.sin(t * 9) * 0.12;
        if (halo.current) halo.current.material.opacity = 0.75 + (still ? 0 : Math.sin(t * 6) * 0.05) + burst * 0.35;
    });
    return <group position={[1.75, 0, -1.2]}>
        <mesh position-y={1.75} scale-z={1.25} castShadow><torusGeometry args={[0.35, 0.13, 8, 24, Math.PI]} /><meshLambertMaterial color={C.lilac} /></mesh>
        <Block size={[1.0, 0.12, 1.0]} position={[0, 0.31, 0]} color={C.stoneEdge} />
        <Block size={[0.4, 0.1, 0.4]} position={[-0.35, 0.42, 0]} color={C.lilacDark} />
        <Block size={[0.4, 0.1, 0.4]} position={[0.35, 0.42, 0]} color={C.lilacDark} />
        <Block size={[0.38, 0.08, 0.38]} position={[-0.35, 1.72, 0]} color={C.lilacDark} />
        <Block size={[0.38, 0.08, 0.38]} position={[0.35, 1.72, 0]} color={C.lilacDark} />
        <group ref={lamp} position-y={2.0}>
            <mesh position-y={-0.15}><cylinderGeometry args={[0.006, 0.006, 0.3, 4]} /><meshBasicMaterial color="#6f6878" /></mesh>
            <mesh position-y={-0.36}><boxGeometry args={[0.1, 0.14, 0.1]} /><meshBasicMaterial color="#ffe3ac" /></mesh>
            <mesh position-y={-0.28}><coneGeometry args={[0.09, 0.06, 4]} /><meshLambertMaterial color={C.gold} /></mesh>
            <sprite ref={halo} position-y={-0.36} scale={[0.75, 0.75, 1]}><spriteMaterial map={glow} transparent depthWrite={false} blending={AdditiveBlending} /></sprite>
        </group>
    </group>;
}
function Water({ still, season = 'autumn' }) {
    const mat = useRef();
    const ripples = useRef([]);
    useFrame(state => {
        if (!mat.current || still) return;
        const k = (Math.sin(state.clock.elapsedTime * 1.4) + 1) / 2;
        const ice = SEASON_TINT[season].water;
        if (ice) mat.current.color.setRGB(ice[0] + k * 0.02, ice[1] + k * 0.02, ice[2] + k * 0.02);
        else mat.current.color.setRGB(0.22 + k * 0.03, 0.47 + k * 0.04, 0.48 + k * 0.04);
        ripples.current.forEach((ring, i) => {
            if (!ring) return;
            const phase = (state.clock.elapsedTime * 0.22 + i / 3) % 1;
            ring.scale.setScalar(0.15 + phase * 0.8);
            ring.material.opacity = (1 - phase) * 0.35;
        });
    });
    return <group position={[1.75, 0.012, 1.05]}>
        <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[1.05, 1.5]} /><meshStandardMaterial ref={mat} color="#568e91" roughness={0.24} metalness={0.3} /></mesh>
        {[0, 1, 2].map(i => <mesh key={i} ref={el => { ripples.current[i] = el; }} rotation-x={-Math.PI / 2} position={[0, 0.004 + i * 0.001, 0]} scale={0.3 + i * 0.25}>
            <ringGeometry args={[0.43, 0.445, 48]} /><meshBasicMaterial color="#d5f4e7" transparent opacity={0.2} depthWrite={false} />
        </mesh>)}
        {[-1, 1].map(side => <Block key={'side'+side} size={[0.08, 0.08, 1.65]} position={[side * 0.565, 0.02, 0]} color={C.stoneEdge} />)}
        {[-1, 1].map(side => <Block key={'end'+side} size={[1.2, 0.08, 0.08]} position={[0, 0.02, side * 0.79]} color={C.stoneEdge} />)}
    </group>;
}
// Lanternes : vacillent doucement, et s'embrasent un instant quand le mécanisme de la tour joue.
function Lanterns({ still, mechanism, clock }) {
    const glow = useMemo(() => glowTexture('rgba(255,231,183,0.7)', 'rgba(255,194,115,0.12)'), []);
    useEffect(() => () => glow.dispose(), [glow]);
    const halos = useRef([]);
    useFrame(state => {
        const t = state.clock.elapsedTime;
        const since = clock.current - mechanism.current.at;
        const burst = since >= 0 && since < 1.6 ? Math.sin((since / 1.6) * Math.PI) : 0;
        halos.current.forEach((h, i) => {
            if (!h) return;
            const flicker = still ? 0 : Math.sin(t * 7 + i * 2.1) * 0.06 + Math.sin(t * 13 + i) * 0.04;
            h.material.opacity = 0.82 + flicker + burst * 0.4;
            h.scale.setScalar(0.85 + burst * 0.55);
        });
    });
    return [[-2.35, 1.8], [2.35, 1.8], [0.85, -0.5]].map(([x, z], i) => <group key={i} position={[x, 0, z]}>
        <Block size={[0.18, 0.12, 0.18]} position={[0, 0.06, 0]} color={C.lilacDark} />
        <mesh position-y={0.23}><boxGeometry args={[0.11, 0.22, 0.11]} /><meshBasicMaterial color="#ffe3ac" /></mesh>
        <Block size={[0.2, 0.05, 0.2]} position={[0, 0.36, 0]} color={C.stone} />
        <sprite ref={el => { halos.current[i] = el; }} position-y={0.23} scale={[0.85, 0.85, 1]}><spriteMaterial map={glow} transparent depthWrite={false} blending={AdditiveBlending} /></sprite>
    </group>);
}

// Oiseaux de papier : de petits origamis ivoire qui font le tour de l'île en battant des ailes.
const BIRD_WING = new BufferGeometry();
BIRD_WING.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, -0.09, 0, 0, 0.09, 0.34, 0, 0.02]), 3));
BIRD_WING.computeVertexNormals();
const BIRD_BODY = new BufferGeometry();
BIRD_BODY.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, -0.16, 0.05, 0.02, 0.12, -0.05, 0.02, 0.12, 0, -0.04, 0.1]), 3));
BIRD_BODY.setIndex([0, 1, 2, 0, 3, 1, 0, 2, 3, 1, 3, 2]);
BIRD_BODY.computeVertexNormals();
const BIRDS = [
    { r: 6.2, y: 2.4, speed: 0.16, phase: 0, flap: 7.5, s: 1 },
    { r: 7.1, y: 3.3, speed: 0.12, phase: 2.2, flap: 6.4, s: 0.85 },
    { r: 5.6, y: 1.5, speed: 0.19, phase: 4.1, flap: 8.2, s: 0.75 },
];
function Bird({ r, y, speed, phase, flap, s, still }) {
    const ref = useRef();
    const left = useRef();
    const right = useRef();
    useFrame(state => {
        const t = state.clock.elapsedTime;
        const a = still ? phase : phase + t * speed;
        if (ref.current) {
            ref.current.position.set(Math.cos(a) * r, y + Math.sin(t * 0.9 + phase) * 0.35, Math.sin(a) * r * 0.75);
            ref.current.rotation.set(0, -a, Math.sin(t * 0.7 + phase) * 0.15);
        }
        // Battement par à-coups, avec de courtes glissades
        const glide = Math.sin(t * 0.5 + phase) > 0.55;
        const w = still || glide ? 0.12 : Math.sin(t * flap + phase) * 0.7;
        if (left.current) left.current.rotation.z = w;
        if (right.current) right.current.rotation.z = -w;
    });
    return <group ref={ref} scale={s}>
        <mesh geometry={BIRD_BODY}><meshLambertMaterial color="#efe8dc" side={2} /></mesh>
        <group ref={left}><mesh geometry={BIRD_WING}><meshLambertMaterial color="#f4eee4" side={2} /></mesh></group>
        <group ref={right} rotation-y={Math.PI}><mesh geometry={BIRD_WING}><meshLambertMaterial color="#e6ddcf" side={2} /></mesh></group>
    </group>;
}
function Birds({ still }) {
    return BIRDS.map((b, i) => <Bird key={i} {...b} still={still} />);
}

// Soleil couchant vivant : intensité et teinte qui respirent très lentement.
function SunLight() {
    const ref = useRef();
    const warm = useMemo(() => new Color('#ffe1ba'), []);
    const rose = useMemo(() => new Color('#ffc4b0'), []);
    useFrame(state => {
        if (!ref.current) return;
        const k = (Math.sin(state.clock.elapsedTime * 0.12) + 1) / 2;
        ref.current.intensity = 2.45 + k * 0.35;
        ref.current.color.copy(warm).lerp(rose, k * 0.6);
    });
    return <directionalLight ref={ref} position={[-3, 9, 6]} intensity={2.6} color="#ffe1ba" castShadow
        shadow-mapSize={[1024, 1024]} shadow-camera-left={-6} shadow-camera-right={6}
        shadow-camera-top={7} shadow-camera-bottom={-6} shadow-normalBias={0.035} shadow-bias={-0.0002} />;
}
// La mascotte de l'IA saute de carte en carte sur le parvis, et retourne parfois celle qu'elle quitte.
const cardPos = i => [-2.05 + (i % 4) * 0.8, -0.95 + Math.floor(i / 4) * 1.04];
const neighbours = i => [i - 4, i + 4, i % 4 ? i - 1 : -1, i % 4 < 3 ? i + 1 : -1].filter(n => n >= 0 && n < 12);
const BOT_SCALE = 0.27;
const BOT_FEET = 0.47;
// Un des robots rivaux (Tourment, Fury), tiré au hasard à chaque visite
const ISLAND_BOTS = ['bonus', 'fury'];
function IslandBot({ still, clock, flippers, botAtRef }) {
    const ref = useRef();
    const [botMode] = useState(() => ISLAND_BOTS[Math.floor(Math.random() * ISLAND_BOTS.length)]);
    const [poke, setPoke] = useState(0);
    const hop = useRef({ from: 5, to: 5, start: 0, next: 4.6, yaw: 0, landed: true, bounceAt: 0 });
    useFrame((_, delta) => {
        const g = ref.current;
        if (!g) return;
        const t = clock.current;
        const h = hop.current;
        // Apparition : petit saut d'arrivée après l'intro de l'île.
        const appear = still ? 1 : clamp01((t - 3.4) / 0.5);
        if (!still && t > h.next && t - h.start > 0.6) {
            const options = neighbours(h.to);
            h.from = h.to;
            h.to = options[Math.floor(Math.random() * options.length)];
            h.start = t;
            h.next = t + 0.6 + 0.5 + 1.1 + Math.random() * 1.6;
            botAtRef.current = h.to;
            h.landed = false;
        }
        const k = still ? 1 : clamp01((t - h.start) / 0.6);
        const [x0, z0] = cardPos(h.from);
        const [x1, z1] = cardPos(h.to);
        const e = easeInOut(k);
        const x = x0 + (x1 - x0) * e;
        const z = z0 + (z1 - z0) * e;
        // À l'atterrissage : la carte se retourne sous lui, et il rebondit le temps qu'elle pivote.
        if (!still && k >= 1 && !h.landed && t > 3.9) { h.landed = true; h.bounceAt = t; flippers.current[h.to]?.(); }
        const b = h.bounceAt ? clamp01((t - h.bounceAt) / 0.5) : 1;
        const arc = Math.sin(k * Math.PI) * 0.45 + Math.sin(b * Math.PI) * 0.42;
        if (k < 1 && (x1 !== x0 || z1 !== z0)) h.yaw = Math.atan2(x1 - x0, z1 - z0);
        g.position.set(x, BOT_FEET + arc + (1 - appear) * 1.2, z);
        g.rotation.y = MathUtils.damp(g.rotation.y, k < 1 ? h.yaw : h.yaw * 0.4 + 0.5, 6, delta);
        // Écrasement à l'atterrissage
        const land = k >= 1 ? Math.max(0, 1 - (t - h.start - 0.6) / 0.25, h.bounceAt ? 1 - (t - h.bounceAt - 0.5) / 0.25 : 0) * (b >= 1 || k < 1 ? 1 : 0) : 0;
        const sq = 1 + Math.sin(land * Math.PI) * 0.18;
        g.scale.set(BOT_SCALE * (2 - sq) * appear, BOT_SCALE * sq * appear, BOT_SCALE * (2 - sq) * appear);
    });
    return <group ref={ref} scale={0.0001}
        onClick={e => { e.stopPropagation(); setPoke(n => n + 1); }}
        onPointerOver={() => setPointer(true)} onPointerOut={() => setPointer(false)}>
        <MascotBot difficulty={botMode} poke={poke} still={still} shadow={false} />
    </group>;
}

// Cascade : le bassin déborde par un petit canal et tombe le long de l'île.
function waterfallTexture() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(190,232,226,0.55)'; g.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 46; i++) {
        g.fillStyle = `rgba(255,255,255,${0.15 + (i % 5) * 0.08})`;
        g.fillRect((i * 23) % 60, (i * 37) % 256, 2 + (i % 3), 18 + (i % 7) * 6);
    }
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.wrapS = t.wrapT = RepeatWrapping;
    return t;
}
function Waterfall({ still, season }) {
    const frozen = season === 'winter';
    const tex = useMemo(() => waterfallTexture(), []);
    const glow = useMemo(() => glowTexture('rgba(235,250,248,0.9)', 'rgba(200,236,232,0.15)'), []);
    useEffect(() => () => { tex.dispose(); glow.dispose(); }, [tex, glow]);
    const foam = useRef();
    const fall = useRef();
    useFrame((state, delta) => {
        if (still || frozen) return;
        if (fall.current?.map) fall.current.map.offset.y += delta * 0.9;
        if (foam.current) { const k = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.08; foam.current.scale.set(0.9 * k, 0.5 * k, 1); }
    });
    return <group position={[0, 0, 1.05]}>
        <mesh rotation-x={-Math.PI / 2} position={[2.46, 0.05, 0]}><planeGeometry args={[0.34, 0.26]} /><meshBasicMaterial map={tex} transparent depthWrite={false} /></mesh>
        <mesh rotation-y={Math.PI / 2} position={[2.64, -1.25, 0]}><planeGeometry args={[0.26, 2.6]} /><meshBasicMaterial ref={fall} map={tex} color={frozen ? '#cfe9f5' : '#ffffff'} transparent opacity={frozen ? 0.95 : 0.85} depthWrite={false} /></mesh>
        {frozen && [0, 1, 2, 3].map(i => <mesh key={i} position={[2.66, -2.58 - (i % 2) * 0.06, -0.09 + i * 0.06]} rotation-x={Math.PI}><coneGeometry args={[0.035, 0.22 + (i % 3) * 0.07, 6]} /><meshLambertMaterial color="#e6f5fc" /></mesh>)}
        {!frozen && <sprite ref={foam} position={[2.66, -2.5, 0]} scale={[0.9, 0.5, 1]}><spriteMaterial map={glow} transparent opacity={0.7} depthWrite={false} blending={AdditiveBlending} /></sprite>}
    </group>;
}
// Carpes koï qui tournent dans le bassin (cachées sous la glace en hiver).
function Koi({ still }) {
    const fish = useRef([]);
    useFrame(state => {
        const t = still ? 0 : state.clock.elapsedTime;
        fish.current.forEach((f, i) => {
            if (!f) return;
            const a = t * (0.55 + i * 0.12) + i * Math.PI;
            const x = Math.cos(a) * 0.28, z = Math.sin(a) * 0.5;
            f.position.set(1.75 + x, 0.03, 1.05 + z);
            f.rotation.y = -a + (i % 2 ? Math.PI : 0);
            f.rotation.z = Math.sin(t * 6 + i) * 0.15;
        });
    });
    return [['#f08a4b', '#fff3e6'], ['#fff3e6', '#e45c3a']].map(([body, spot], i) => <group key={i} ref={el => { fish.current[i] = el; }}>
        <mesh rotation-z={Math.PI / 2} scale={[1, 1, 0.7]}><capsuleGeometry args={[0.035, 0.1, 4, 8]} /><meshLambertMaterial color={body} /></mesh>
        <mesh position={[0.02, 0.025, 0]}><sphereGeometry args={[0.022, 8, 6]} /><meshLambertMaterial color={spot} /></mesh>
        <mesh position={[-0.1, 0, 0]} rotation-z={Math.PI / 2}><coneGeometry args={[0.035, 0.07, 6]} /><meshLambertMaterial color={body} /></mesh>
    </group>);
}

// Lanternes célestes : de petites lumières chaudes qui montent lentement autour de l'île.
const SKY_LANTERNS = Array.from({ length: 7 }, (_, i) => ({ r: 3.1 + (i % 3) * 0.55, a: i * 0.9, speed: 0.11 + (i % 4) * 0.025, phase: i / 7 }));
function SkyLanterns({ still }) {
    const glow = useMemo(() => glowTexture('rgba(255,214,150,0.95)', 'rgba(255,170,90,0.25)'), []);
    useEffect(() => () => glow.dispose(), [glow]);
    const refs = useRef([]);
    useFrame(state => {
        const t = still ? 6 : state.clock.elapsedTime;
        refs.current.forEach((g, i) => {
            if (!g) return;
            const l = SKY_LANTERNS[i];
            const k = (t * l.speed * 0.12 + l.phase) % 1;
            const a = l.a + t * 0.05;
            g.position.set(Math.cos(a) * l.r, -2.4 + k * 7.5, Math.sin(a) * l.r);
            g.rotation.z = Math.sin(t * 1.3 + i) * 0.12;
            const fade = Math.min(1, k * 6, (1 - k) * 4);
            g.children.forEach(c => { if (c.material) c.material.opacity = fade * (c.isSprite ? 0.75 : 1); });
        });
    });
    return SKY_LANTERNS.map((_, i) => <group key={i} ref={el => { refs.current[i] = el; }}>
        <mesh><cylinderGeometry args={[0.06, 0.045, 0.13, 8]} /><meshBasicMaterial color="#ffd49a" transparent /></mesh>
        <sprite scale={[0.55, 0.55, 1]}><spriteMaterial map={glow} transparent depthWrite={false} blending={AdditiveBlending} /></sprite>
    </group>);
}

// Buissons fleuris et lianes : un peu de vie sur la pierre.
const BUSHES = [[-1.6, 1.82, 1], [-0.35, 1.86, 0.8], [-1.25, -1.78, 0.9], [0.32, -1.84, 0.75], [2.45, -0.2, 0.7]];
const FLOWERS = ['#f4c7c3', '#f7e1a8', '#d9c6f0'];
function Greenery({ season }) {
    const leaf = SEASON_TINT[season].leaf;
    return <group>
        {BUSHES.map(([x, z, s], i) => <group key={i} position={[x, 0, z]} scale={s}>
            {[[0, 0.12, 0, 0.16], [0.14, 0.09, 0.05, 0.12], [-0.13, 0.08, -0.03, 0.11], [0.03, 0.08, -0.13, 0.1]].map(([bx, by, bz, r], k) =>
                <mesh key={k} position={[bx, by, bz]} castShadow><sphereGeometry args={[r, 14, 10]} /><meshLambertMaterial color={leaf} /></mesh>)}
            {season !== 'winter' && [[0.06, 0.25, 0.08], [-0.1, 0.19, 0.1], [0.16, 0.17, -0.06]].map(([fx, fy, fz], k) =>
                <mesh key={'f' + k} position={[fx, fy, fz]}><sphereGeometry args={[0.03, 8, 6]} /><meshBasicMaterial color={FLOWERS[(i + k) % 3]} /></mesh>)}
        </group>)}
        {/* Lianes qui pendent du rebord avant (stalactites de glace en hiver) */}
        {season === 'winter' ? [-2.3, -1.9, -1.4, -0.9, -0.4, 0.1, 0.6].map((x, i) => <mesh key={'ice' + i} position={[x, -0.6 - (i % 3) * 0.04, 2.13]} rotation-x={Math.PI}>
            <coneGeometry args={[0.04, 0.2 + (i % 4) * 0.08, 6]} /><meshLambertMaterial color="#eaf6fc" />
        </mesh>) : [-2.2, -1.5, -0.6, 0.3].map((x, i) => <group key={'v' + i} position={[x, -0.5, 2.13 + (i % 2) * 0.05]}>
            {Array.from({ length: 3 + (i % 3) }, (_, k) => <mesh key={k} position={[Math.sin(k * 1.7) * 0.03, -k * 0.13, 0]}>
                <sphereGeometry args={[0.055 - k * 0.006, 8, 6]} /><meshLambertMaterial color={leaf} />
            </mesh>)}
        </group>)}
    </group>;
}

// Arbre stylisé : tronc qui s'affine avec deux branches, feuillage en grappes de deux tons, fruits ou neige selon la saison.
function Tree({ position, scale = 1, season, seed = 0 }) {
    const leaf = SEASON_TINT[season].leaf;
    const shades = useMemo(() => {
        const base = new Color(leaf);
        return [base.clone().offsetHSL(0, 0, -0.07).getStyle(), leaf, base.clone().offsetHSL(0.01, 0, 0.07).getStyle()];
    }, [leaf]);
    const crowns = [[0, 0.62, 0, 0.24, 1], [0.17, 0.52, 0.06, 0.17, 0], [-0.16, 0.55, -0.04, 0.17, 2], [0.05, 0.78, -0.05, 0.16, 2], [-0.06, 0.48, 0.15, 0.14, 0]];
    return <group position={position} scale={scale} rotation-y={seed * 1.3}>
        <mesh position={[0, 0.03, 0]} receiveShadow><cylinderGeometry args={[0.17, 0.2, 0.06, 18]} /><meshLambertMaterial color={C.stoneEdge} /></mesh>
        <mesh position={[0, 0.27, 0]} castShadow><cylinderGeometry args={[0.035, 0.06, 0.48, 8]} /><meshLambertMaterial color={C.trunk} /></mesh>
        {[[-1, 0.7], [1, -0.6]].map(([side, tilt], k) => <mesh key={k} position={[side * 0.06, 0.4, 0]} rotation-z={tilt}><cylinderGeometry args={[0.015, 0.025, 0.18, 6]} /><meshLambertMaterial color={C.trunk} /></mesh>)}
        {crowns.map(([cx, cy, cz, r, tone], k) => <mesh key={k} position={[cx, cy, cz]} castShadow><icosahedronGeometry args={[r, 1]} /><meshLambertMaterial color={shades[tone]} flatShading /></mesh>)}
        {season === 'winter'
            ? <mesh position={[0, 0.84, -0.04]} scale={[1, 0.45, 1]}><sphereGeometry args={[0.17, 14, 10]} /><meshLambertMaterial color="#ffffff" /></mesh>
            : [[0.16, 0.6, 0.15], [-0.12, 0.7, 0.14], [0.02, 0.5, 0.22]].map(([fx, fy, fz], k) => <mesh key={'f' + k} position={[fx, fy, fz]}><sphereGeometry args={[0.025, 8, 6]} /><meshBasicMaterial color={season === 'autumn' ? '#f2c25a' : '#f4c7c3'} /></mesh>)}
    </group>;
}
// Guirlande de fanions entre les deux piliers de la tour.
const PENNANTS = ['#e8907a', '#f2d48a', '#9fc7b4', '#b9a8dc', '#e8907a', '#f2d48a'];
function Garland({ season }) {
    const flags = PENNANTS.map((color, i) => {
        const u = (i + 0.5) / PENNANTS.length;
        return { color: season === 'winter' ? ['#dff3fb', '#f6efe2'][i % 2] : color, x: 1.42 + u * 0.66, y: 1.62 - Math.sin(u * Math.PI) * 0.16 };
    });
    return <group position={[0, 0, -1.2]}>
        {flags.map((f, i) => <mesh key={i} position={[f.x, f.y - 0.05, 0.16]}><coneGeometry args={[0.04, 0.09, 3]} /><meshLambertMaterial color={f.color} /></mesh>)}
    </group>;
}

// ---- Touches « Vesper » (d'après l'icône) ----
function starTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const glow = g.createRadialGradient(64, 64, 0, 64, 64, 60);
    glow.addColorStop(0, 'rgba(255,240,205,0.9)'); glow.addColorStop(0.25, 'rgba(255,214,150,0.35)'); glow.addColorStop(1, 'rgba(255,200,130,0)');
    g.fillStyle = glow; g.fillRect(0, 0, 128, 128);
    g.fillStyle = 'rgba(255,248,230,1)';
    g.beginPath();
    for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 - Math.PI / 2;
        const r = k % 2 === 0 ? 46 : 9;
        g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r);
    }
    g.closePath(); g.fill();
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
}
// Arches sombres creusées dans les flancs visibles du socle, avec une lueur au fond.
function UnderArches() {
    const faces = [
        { pos: [2.152, -1.28, 0], rot: Math.PI / 2, xs: [-1.05, 0, 1.05] },
        { pos: [0, -1.28, 1.702], rot: 0, xs: [-1.4, -0.3, 0.8, 1.7] },
    ];
    return faces.map((f, i) => <group key={i} position={f.pos} rotation-y={f.rot}>
        {f.xs.map(x => <group key={x} position-x={x}>
            <mesh position-y={-0.08}><planeGeometry args={[0.36, 0.46]} /><meshBasicMaterial color="#5f5474" /></mesh>
            <mesh position-y={0.15}><circleGeometry args={[0.18, 18, 0, Math.PI]} /><meshBasicMaterial color="#5f5474" /></mesh>
            <mesh position={[0, -0.12, 0.002]}><planeGeometry args={[0.2, 0.22]} /><meshBasicMaterial color="#e7b98a" transparent opacity={0.35} /></mesh>
        </group>)}
    </group>);
}
// Étoile qui brille dans le bassin, et losanges dorés qui flottent autour de l'île.
const DIAMONDS = [[-2.9, 2.6, -0.4, 0.09], [3.1, 1.9, 0.6, 0.07], [-1.2, 3.6, -2.2, 0.06], [2.4, 3.4, -2.6, 0.08], [0.4, -4.6, 0.4, 0.11], [-3.3, 0.2, 2.4, 0.06]];
function VesperSparkles({ still, season }) {
    const star = useMemo(() => starTexture(), []);
    useEffect(() => () => star.dispose(), [star]);
    const pool = useRef();
    const gems = useRef([]);
    useFrame(state => {
        const t = still ? 0 : state.clock.elapsedTime;
        if (pool.current) { const k = 0.85 + Math.sin(t * 1.6) * 0.15; pool.current.scale.set(0.62 * k, 0.62 * k, 1); pool.current.material.opacity = 0.75 + Math.sin(t * 1.6) * 0.2; }
        gems.current.forEach((m, i) => {
            if (!m) return;
            const d = DIAMONDS[i];
            m.position.y = d[1] + Math.sin(t * 0.9 + i * 1.3) * 0.12;
            m.rotation.y = t * 0.8 + i;
            m.material.emissiveIntensity = 0.6 + Math.sin(t * 2 + i) * 0.3;
        });
    });
    return <group>
        {season !== 'winter' && <sprite ref={pool} position={[1.75, 0.06, 1.05]} scale={[0.62, 0.62, 1]}><spriteMaterial map={star} transparent depthWrite={false} blending={AdditiveBlending} /></sprite>}
        {DIAMONDS.map((d, i) => <mesh key={i} ref={el => { gems.current[i] = el; }} position={[d[0], d[1], d[2]]} scale={[d[3], d[3] * 1.5, d[3]]}>
            <octahedronGeometry args={[1, 0]} /><meshLambertMaterial color="#f6dca2" emissive="#f2c77a" emissiveIntensity={0.7} />
        </mesh>)}
    </group>;
}
// Mer de nuages sous l'île, qui dérive lentement.
function cloudPuff() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const g = c.getContext('2d');
    [[70, 76, 54], [128, 64, 64], [190, 78, 50], [100, 90, 46], [160, 92, 44]].forEach(([x, y, r]) => {
        const grad = g.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, 'rgba(255,255,255,0.55)'); grad.addColorStop(0.6, 'rgba(255,255,255,0.22)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = grad; g.fillRect(0, 0, 256, 128);
    });
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
}
const CLOUDS = Array.from({ length: 9 }, (_, i) => ({ a: (i / 9) * Math.PI * 2, r: 2.6 + (i % 3) * 0.9, y: -4.6 + (i % 2) * 0.5, s: 3.4 + (i % 3) * 0.8, tint: ['#d9cdea', '#efd6cf', '#cfc7e6'][i % 3] }));
function CloudSea({ still }) {
    const tex = useMemo(() => cloudPuff(), []);
    useEffect(() => () => tex.dispose(), [tex]);
    const refs = useRef([]);
    useFrame(state => {
        const t = still ? 0 : state.clock.elapsedTime;
        refs.current.forEach((sp, i) => {
            if (!sp) return;
            const c = CLOUDS[i];
            const a = c.a + t * 0.015;
            sp.position.set(Math.cos(a) * c.r, c.y + Math.sin(t * 0.3 + i) * 0.08, Math.sin(a) * c.r);
        });
    });
    return CLOUDS.map((c, i) => <sprite key={i} ref={el => { refs.current[i] = el; }} scale={[c.s, c.s * 0.5, 1]}>
        <spriteMaterial map={tex} color={c.tint} transparent opacity={0.7} depthWrite={false} />
    </sprite>);
}

function Island({ still, onTouch, season = 'autumn' }) {
    const clock = useRef(0);
    const ref = useRef();
    const flippers = useRef([]);
    const register = useCallback((i, fn) => { flippers.current[i] = fn; }, []);
    const lastFlip = useRef(0);
    const botAt = useRef(5);
    const [instantRise] = useState(() => !INTRO.fogPlayed);
    // Mécanisme : un toucher sur la tour la fait pivoter, fait tourner la carte du sommet
    // et ravive les lanternes. On garde l'instant du dernier déclenchement.
    const mechanism = useRef({ at: -100, count: 0 });
    const trigger = useCallback(() => { mechanism.current.at = clock.current; mechanism.current.count += 1; }, []);
    useFrame((_, delta) => {
        if (!introBlocked() || clock.current > 0.5) clock.current += Math.min(delta, 0.05);
        const t = clock.current;
        if (!still && t > 3.4 && t - lastFlip.current > 2.1) {
            lastFlip.current = t;
            const pick = Math.floor(Math.random() * flippers.current.length);
            if (pick !== botAt.current) flippers.current[pick]?.();
        }
        if (!ref.current) return;
        // Au lancement, l'île est déjà en place sous la brume ; aux retours sur l'accueil, elle remonte.
        const rise = still || instantRise ? 1 : easeOut(clamp01((t - 0.15) / 1.8));
        ref.current.position.y = (rise - 1) * 5;
    });
    return <group ref={ref}>
        <Block size={[5.2, 0.5, 4.2]} position={[0, -0.25, 0]} color={C.stone} />
        <Block size={[5.36, 0.14, 4.36]} position={[0, -0.57, 0]} color={C.stoneEdge} />
        <Block size={[4.3, 1.1, 3.4]} position={[0, -1.19, 0]} color={C.coral1} />
        <Block size={[3.2, 1.3, 2.5]} position={[0.1, -2.39, 0.1]} color={C.coral2} />
        <Block size={[2.0, 1.4, 1.5]} position={[0.2, -3.74, 0.2]} color={C.coral3} />
        <UnderArches />
        <VesperSparkles still={still} season={season} />
        {GRID.map((value, i) => <PlazaCard key={i} value={value} index={i} register={register}
            x={-2.05 + (i % 4) * 0.8} z={-0.95 + Math.floor(i / 4) * 1.04}
            order={i % 4 + Math.floor(i / 4) * 2} clock={clock} still={still} onTouch={onTouch} />)}
        {/* Hiver : manteau de neige sur le parvis */}
        {season === 'winter' && <mesh rotation-x={-Math.PI / 2} position-y={0.004} receiveShadow>
            <planeGeometry args={[5.16, 4.16]} /><meshLambertMaterial color="#eef2f6" />
        </mesh>}
        <Water still={still} season={season} /><Lanterns still={still} mechanism={mechanism} clock={clock} />
        <Block size={[1.2, 0.25, 1.2]} position={[1.75, 0.125, -1.2]} color={C.stone} />
        <Block size={[0.3, 1.5, 0.3]} position={[1.4, 1.0, -1.2]} color={C.lilac} />
        <Block size={[0.3, 1.5, 0.3]} position={[2.1, 1.0, -1.2]} color={C.lilac} />
        <Block size={[1.2, 0.14, 0.62]} position={[1.75, 2.18, -1.2]} color={C.stone} />
        <TowerArch still={still} mechanism={mechanism} clock={clock} />
        <TowerTop still={still} season={season} mechanism={mechanism} onTrigger={() => { trigger(); onTouch(); }} />
        <HaloRing still={still} mechanism={mechanism} />
        <PivotCard still={still} onTouch={onTouch} mechanism={mechanism} />
        <IslandBot still={still} clock={clock} flippers={flippers} botAtRef={botAt} />
        <Waterfall still={still} season={season} />
        {season !== 'winter' && <Koi still={still} />}
        <Greenery season={season} />
        {[0, 1, 2, 3, 4].map(i => <Block key={i} size={[0.8, 0.2, 0.34]} position={[1.75, -0.1 - i * 0.2, 2.27 + i * 0.34]} color={C.stone} />)}
        {[[-2.35, -1.75, 1], [0.85, -1.75, 0.85]].map(([x, z, k], i) => <Tree key={i} position={[x, 0, z]} scale={k} season={season} seed={i} />)}
        <Garland season={season} />
    </group>;
}

// Inclinaison douce de l'île avec le doigt / le gyroscope.
function useTilt() {
    const tilt = useRef({ x: 0, y: 0 });
    useEffect(() => {
        const onPointer = e => { tilt.current.x = (e.clientX / innerWidth) * 2 - 1; tilt.current.y = (e.clientY / innerHeight) * 2 - 1; };
        const onOrientation = e => {
            if (e.gamma == null) return;
            tilt.current.x = MathUtils.clamp(e.gamma / 25, -1, 1);
        };
        addEventListener('pointermove', onPointer, { passive: true });
        addEventListener('deviceorientation', onOrientation, { passive: true });
        return () => { removeEventListener('pointermove', onPointer); removeEventListener('deviceorientation', onOrientation); };
    }, []);
    return tilt;
}

// Entrée cinéma : l'île arrive en pivotant puis se pose ; ensuite, légère oscillation et inclinaison.
function Turntable({ still, children }) {
    const ref = useRef();
    const tilt = useTilt();
    useFrame((state, delta) => {
        if (!ref.current || still) return;
        const t = state.clock.elapsedTime;
        const intro = (1 - easeOut(clamp01(t / 2.6))) * -0.75;
        const idle = Math.sin(t * 0.22) * 0.06;
        ref.current.rotation.y = MathUtils.damp(ref.current.rotation.y, intro + tilt.current.x * 0.14 + idle, 3, delta);
    });
    return <group ref={ref}>{children}</group>;
}

function glowTexture(inner, outer) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, inner); g.addColorStop(0.35, outer); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
}

function Floaters({ still, season = 'autumn' }) {
    const refs = useRef([]);
    const rocks = [
        { p: [3.6, -1.4, 2.2], s: 0.16, c: C.lilac },
        { p: [-2.6, -2.6, -1.8], s: 0.22, c: C.coral2 },
        { p: [2.9, 2.6, 1.9], s: 0.11, c: C.stone },
    ];
    useFrame(state => {
        if (still) return;
        const t = state.clock.elapsedTime;
        refs.current.forEach((m, i) => {
            if (!m) return;
            const base = i === 0 ? 0.7 : rocks[i - 1].p[1];
            m.position.y = base + Math.sin(t * 0.7 + i * 1.7) * 0.15;
            m.rotation.y = (i === 0 ? 0.15 : 0.25) * t + i;
        });
    });
    const leaf = SEASON_TINT[season].leaf;
    return <>
        {/* Petit îlot flottant : terre, rocher en pointe, mini-arbre et lanterne */}
        <group ref={el => { refs.current[0] = el; }} position={[-3.5, 0.7, 1.7]} scale={0.9}>
            <mesh position-y={0.02}><cylinderGeometry args={[0.42, 0.44, 0.06, 7]} /><meshLambertMaterial color={season === 'winter' ? '#eef2f6' : '#c7d3b8'} flatShading /></mesh>
            <mesh position-y={-0.08}><cylinderGeometry args={[0.44, 0.38, 0.14, 7]} /><meshLambertMaterial color={C.stone} flatShading /></mesh>
            <mesh position-y={-0.42} rotation-x={Math.PI}><coneGeometry args={[0.38, 0.6, 7]} /><meshLambertMaterial color={C.coral2} flatShading /></mesh>
            <mesh position-y={-0.82} rotation-x={Math.PI}><coneGeometry args={[0.12, 0.24, 6]} /><meshLambertMaterial color={C.coral3} flatShading /></mesh>
            <group position={[-0.12, 0.05, 0.05]} scale={0.55}><mesh position-y={0.2}><cylinderGeometry args={[0.03, 0.05, 0.4, 6]} /><meshLambertMaterial color={C.trunk} /></mesh>
                <mesh position-y={0.48}><icosahedronGeometry args={[0.22, 1]} /><meshLambertMaterial color={leaf} flatShading /></mesh></group>
            <mesh position={[0.18, 0.12, -0.06]}><boxGeometry args={[0.07, 0.12, 0.07]} /><meshBasicMaterial color="#ffe3ac" /></mesh>
            <mesh position={[0.08, 0.06, 0.2]}><icosahedronGeometry args={[0.07, 0]} /><meshLambertMaterial color={C.stoneEdge} flatShading /></mesh>
        </group>
        {rocks.map((it, i) => <mesh key={i} ref={el => { refs.current[i + 1] = el; }} position={it.p}>
            <icosahedronGeometry args={[it.s, 0]} /><meshLambertMaterial color={it.c} flatShading />
        </mesh>)}
    </>;
}
// L'intro (montée de l'île, brume) attend que l'accueil soit vraiment visible :
// ni écran de chargement, ni fenêtre « Nouveautés » par-dessus.
// La brume ne se joue qu'une fois par lancement de l'app, pas à chaque retour sur l'accueil.
const INTRO = { fogPlayed: false };
const introBlocked = () => typeof document !== 'undefined' && !!document.querySelector('.studio-intro, .sl-root, .da-news');

// Brume d'ouverture (au-dessus de la scène 3D) : un voile flou teinté du couchant, avec quelques nappes,
// qui se dissipe en ~3 s. Une seule fois par lancement, et seulement une fois l'accueil visible.
function IntroHaze({ still }) {
    const [phase, setPhase] = useState(() => (still || INTRO.fogPlayed ? 'done' : 'waiting'));
    useEffect(() => {
        if (phase !== 'waiting') return undefined;
        const id = setInterval(() => {
            if (!introBlocked()) { INTRO.fogPlayed = true; setPhase('lifting'); }
        }, 100);
        return () => clearInterval(id);
    }, [phase]);
    useEffect(() => {
        if (phase !== 'lifting') return undefined;
        const t = setTimeout(() => setPhase('done'), 3400);
        return () => clearTimeout(t);
    }, [phase]);
    if (phase === 'done') return null;
    return <div className={`intro-haze is-${phase}`} aria-hidden="true"><i /><i /><i /><i /></div>;
}

const MIST = [
    { p: [0, -3.3, 0.6], s: [12, 5], speed: 0.18, amp: 0.5 },
    { p: [-2.4, -2.9, 2.4], s: [6, 2.4], speed: 0.27, amp: 0.8 },
    { p: [2.8, -3.2, -1.6], s: [6, 2.2], speed: 0.22, amp: 0.7 },
];
function Mist({ still }) {
    const refs = useRef([]);
    const texture = useMemo(() => {
        const c = document.createElement('canvas');
        c.width = c.height = 256;
        const ctx = c.getContext('2d');
        const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        g.addColorStop(0, 'rgba(206,188,204,0.8)'); g.addColorStop(0.5, 'rgba(176,160,184,0.42)'); g.addColorStop(1, 'rgba(176,160,184,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
        const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t;
    }, []);
    useFrame(state => {
        if (still) return;
        const t = state.clock.elapsedTime;
        MIST.forEach((m, i) => { const s = refs.current[i]; if (s) s.position.x = m.p[0] + Math.sin(t * m.speed + i * 2) * m.amp; });
    });
    return MIST.map((m, i) => <sprite key={i} ref={el => { refs.current[i] = el; }} position={m.p} scale={[m.s[0], m.s[1], 1]}>
        <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>);
}
function createStars() {
    let s = 11;
    const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const positions = new Float32Array(90 * 3);
    for (let i = 0; i < 90; i++) {
        positions[i * 3] = (rand() - 0.5) * 34;
        positions[i * 3 + 1] = 3 + rand() * 12;
        positions[i * 3 + 2] = -14 - rand() * 6;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    return { geometry, texture: glowTexture('rgba(255,248,236,1)', 'rgba(255,240,220,0.35)') };
}
function Stars({ still }) {
    const [stars] = useState(createStars);
    const mat = useRef();
    useFrame(state => { if (mat.current && !still) mat.current.opacity = 0.65 + Math.sin(state.clock.elapsedTime * 1.3) * 0.25; });
    return <points geometry={stars.geometry}>
        <pointsMaterial ref={mat} map={stars.texture} size={6} sizeAttenuation={false} transparent depthWrite={false} blending={AdditiveBlending} opacity={0.8} />
    </points>;
}
const FIREFLIES = 26;
function createFireflies() {
    const positions = new Float32Array(FIREFLIES * 3);
    const seeds = new Float32Array(FIREFLIES);
    for (let i = 0; i < FIREFLIES; i++) {
        const a = Math.random() * Math.PI * 2, r = 2.4 + Math.random() * 2.2;
        positions[i * 3] = Math.cos(a) * r;
        positions[i * 3 + 1] = -3 + Math.random() * 6;
        positions[i * 3 + 2] = Math.sin(a) * r;
        seeds[i] = Math.random() * 10;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    return { geometry, seeds, texture: glowTexture('rgba(255,226,170,1)', 'rgba(255,200,140,0.45)') };
}
function stepFireflies({ geometry, seeds }, delta, t) {
    const p = geometry.attributes.position.array;
    for (let i = 0; i < FIREFLIES; i++) {
        p[i * 3 + 1] += delta * (0.18 + (seeds[i] % 1) * 0.2);
        p[i * 3] += Math.sin(t * 0.8 + seeds[i]) * delta * 0.12;
        if (p[i * 3 + 1] > 3.5) p[i * 3 + 1] = -3.2;
    }
    geometry.attributes.position.needsUpdate = true;
}
function Fireflies({ still }) {
    const [flies] = useState(createFireflies);
    useFrame((state, delta) => { if (!still) stepFireflies(flies, delta, state.clock.elapsedTime); });
    return <points geometry={flies.geometry}>
        <pointsMaterial map={flies.texture} size={14} sizeAttenuation={false} transparent depthWrite={false} blending={AdditiveBlending} opacity={0.9} />
    </points>;
}
const WANDER_PATH = new CatmullRomCurve3([
    new Vector3(1.75, -0.95, 3.75), new Vector3(1.75, -0.45, 2.95), new Vector3(1.75, 0.2, 2.15),
    new Vector3(1.1, 0.22, 1.1), new Vector3(0.95, 0.22, -0.2), new Vector3(1.75, 0.45, -0.55),
]);
function Wanderer({ still }) {
    const ref = useRef();
    const glow = useMemo(() => glowTexture('rgba(255,236,200,1)', 'rgba(255,205,150,0.5)'), []);
    useFrame(state => {
        if (!ref.current) return;
        const cycle = still ? 0.5 : (state.clock.elapsedTime * 0.06) % 2;
        const u = cycle < 1 ? cycle : 2 - cycle;
        const p = WANDER_PATH.getPointAt(easeInOut(u));
        ref.current.position.set(p.x, p.y + 0.12 + Math.sin(state.clock.elapsedTime * 3) * 0.03, p.z);
    });
    return <group ref={ref}>
        <mesh><sphereGeometry args={[0.07, 12, 8]} /><meshBasicMaterial color="#fff1d6" /></mesh>
        <sprite scale={[0.9, 0.9, 1]}><spriteMaterial map={glow} transparent depthWrite={false} blending={AdditiveBlending} /></sprite>
    </group>;
}

// Caméra orthographique isométrique ; entrée en léger zoom avant.
function frameCamera(camera, size, compact) {
    const span = compact ? 11.2 : 8.5;
    camera.userData.baseZoom = size.width / span;
    camera.zoom = camera.userData.baseZoom;
    camera.position.set(10, 8.2, 10);
    camera.lookAt(0, 0.6, 0);
    const target = compact ? 0.355 : 0.39;
    camera.setViewOffset(size.width, size.height, 0, (0.5 - target) * size.height, size.width, size.height);
    camera.updateProjectionMatrix();
}
function applyIntroZoom(camera, t) {
    const base = camera.userData.baseZoom;
    if (!base) return;
    const k = easeOut(clamp01(t / 2.6));
    const zoom = base * (0.82 + 0.18 * k);
    if (Math.abs(camera.zoom - zoom) > 0.01) { camera.zoom = zoom; camera.updateProjectionMatrix(); }
}
function CameraRig({ compact, still }) {
    const { camera, size } = useThree();
    useEffect(() => frameCamera(camera, size, compact), [camera, size, compact]);
    useFrame(state => { if (!still) applyIntroZoom(state.camera, state.clock.elapsedTime); });
    return null;
}

export default function HomeWorldScene3D({ compact = false }) {
    const stone = useMemo(() => makeStoneTexture(), []);
    useEffect(() => () => stone.dispose(), [stone]);
    const [still] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
    const now = useSeasonalClock();
    const season = currentSeason(now);
    const wrapper = useRef(null);
    const [onScreen, setOnScreen] = useState(true);
    useEffect(() => {
        const node = wrapper.current;
        if (!node || !('IntersectionObserver' in window)) return undefined;
        const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.05 });
        observer.observe(node);
        return () => observer.disconnect();
    }, []);
    const onTouch = haptic;
    return <div className="lobby-world s3d s3d--belvedere" ref={wrapper}>
        <Canvas
            orthographic shadows
            frameloop={onScreen ? 'always' : 'never'}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true }}
            camera={{ position: [10, 8.2, 10], zoom: 45, near: -50, far: 100 }}
        >
            <CameraRig compact={compact} still={still} />
            {/* Crépuscule : soleil couchant chaud à gauche, lumière froide du ciel à droite */}
            <hemisphereLight intensity={1.4} color="#c8d7f4" groundColor="#746276" />
            {still
                ? <directionalLight position={[-3, 9, 6]} intensity={2.6} color="#ffe1ba" castShadow
                    shadow-mapSize={[1024, 1024]} shadow-camera-left={-6} shadow-camera-right={6}
                    shadow-camera-top={7} shadow-camera-bottom={-6} shadow-normalBias={0.035} shadow-bias={-0.0002} />
                : <SunLight />}
            <directionalLight position={[6, 4, -2]} intensity={1.1} color="#a2b9ec" />
            <Stars still={still} />
            <ShootingStars still={still} />
            <StoneContext.Provider value={stone}>
            <Turntable still={still}>
                <Island still={still} onTouch={onTouch} season={season} />
                {(season === 'autumn' || season === 'spring') && <FallingLeaves season={season} still={still} />}
                {season === 'winter' && <Snowfall still={still} />}
                <Floaters still={still} season={season} />
                <CloudSea still={still} />
                <SkyLanterns still={still} />
                <Wanderer still={still} />
                <Birds still={still} />
                {!still && <Fireflies still={still} />}
            </Turntable>
            </StoneContext.Provider>
            <Mist still={still} />
        </Canvas>
        <IntroHaze still={still} />
    </div>;
}
