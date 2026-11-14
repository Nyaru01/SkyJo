import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, BoxGeometry, BufferAttribute, BufferGeometry, CanvasTexture, CatmullRomCurve3, MathUtils, PlaneGeometry, SRGBColorSpace, Vector3 } from 'three';
import { backTexture, pastelFaceTexture } from './cardTextures';
import { useGameStore } from '../../store/gameStore';
import { getCardSkinPath } from '../../lib/skinUtils';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
extend({ RoundedBoxGeometry });

const StoneContext = createContext(null);

// One shared, deterministic mineral grain for the architecture; no image request.
function makeStoneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const pixels = ctx.createImageData(256, 256);
    let seed = 37;
    for (let i = 0; i < pixels.data.length; i += 4) {
        seed = (seed * 16807) % 2147483647;
        const shade = 224 + Math.floor(seed / 2147483647 * 30);
        pixels.data.set([shade, shade, shade, 255], i);
    }
    ctx.putImageData(pixels, 0, 0);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;
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
    coral1: '#cdb7aa', coral2: '#bca398', coral3: '#a9938d', coral4: '#98868a',
    lilac: '#adb3c6', lilacDark: '#9299b0', dome: '#c9b2a5',
    water: '#aec5c4', leaf: '#a8b9a6', trunk: '#a48c7c',
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


function PivotCard({ still, onTouch }) {
    const ref = useRef();
    const spin = useRef({ target: 0, angle: 0 });
    const back = usePlayerBack();
    const face = useMemo(() => pastelFaceTexture(12), []);
    useFrame((state, delta) => {
        if (!ref.current) return;
        const s = spin.current;
        if (!still) s.target += delta * 0.35;
        s.angle = MathUtils.damp(s.angle, s.target, 4, delta);
        ref.current.rotation.y = s.angle;
        ref.current.position.y = 3.75 + (still ? 0 : Math.sin(state.clock.elapsedTime * 1.2) * 0.04);
    });
    return <group ref={ref} position={[1.75, 3.75, -1.2]}
        onClick={e => { e.stopPropagation(); spin.current.target += Math.PI * 2; onTouch(); }}
        onPointerOver={() => setPointer(true)} onPointerOut={() => setPointer(false)}>
        <mesh><boxGeometry args={[0.78, 1.08, 0.04]} /><meshLambertMaterial color="#fffaf3" /></mesh>
        <mesh position-z={0.021}><planeGeometry args={[0.76, 1.06]} /><meshBasicMaterial map={face} transparent alphaTest={0.5} /></mesh>
        <mesh position-z={-0.021} rotation-y={Math.PI}><planeGeometry args={[0.76, 1.06]} /><meshBasicMaterial map={back} transparent alphaTest={0.5} /></mesh>
    </group>;
}
function TowerTop({ still }) {
    const ref = useRef();
    const turn = useRef({ target: 0, last: 0 });
    useFrame((state, delta) => {
        if (!ref.current || still) return;
        const t = state.clock.elapsedTime;
        const s = turn.current;
        if (t > 4 && t - s.last > 4.2) { s.target += Math.PI / 2; s.last = t; }
        ref.current.rotation.y = MathUtils.damp(ref.current.rotation.y, s.target, 3.5, delta);
    });
    return <group ref={ref} position={[1.75, 0, -1.2]}>
        <Block size={[1.1, 0.8, 1.1]} position={[0, 2.55, 0]} color={C.lilac} />
        <Block size={[0.56, 0.14, 0.34]} position={[0, 2.25, 0.72]} color={C.lilacDark} />
        <mesh position={[0, 2.55, 0.57]}><boxGeometry args={[0.26, 0.4, 0.04]} /><meshBasicMaterial color="#ffd9a0" /></mesh>
        <mesh position={[0, 2.95, 0]}><sphereGeometry args={[0.46, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshLambertMaterial color={C.dome} /></mesh>
        <Block size={[0.05, 0.45, 0.05]} position={[0, 3.4, 0]} color={C.stoneEdge} />
    </group>;
}
function Water({ still }) {
    const mat = useRef();
    const ripples = useRef([]);
    useFrame(state => {
        if (!mat.current || still) return;
        const k = (Math.sin(state.clock.elapsedTime * 1.4) + 1) / 2;
        mat.current.color.setRGB(0.22 + k * 0.03, 0.47 + k * 0.04, 0.48 + k * 0.04);
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
function Lanterns() {
    const glow = useMemo(() => glowTexture('rgba(255,231,183,0.7)', 'rgba(255,194,115,0.12)'), []);
    useEffect(() => () => glow.dispose(), [glow]);
    return [[-2.35, 1.8], [2.35, 1.8], [0.85, -0.5]].map(([x, z], i) => <group key={i} position={[x, 0, z]}>
        <Block size={[0.18, 0.12, 0.18]} position={[0, 0.06, 0]} color={C.lilacDark} />
        <mesh position-y={0.23}><boxGeometry args={[0.11, 0.22, 0.11]} /><meshBasicMaterial color="#ffe3ac" /></mesh>
        <Block size={[0.2, 0.05, 0.2]} position={[0, 0.36, 0]} color={C.stone} />
        <sprite position-y={0.23} scale={[0.85, 0.85, 1]}><spriteMaterial map={glow} transparent depthWrite={false} blending={AdditiveBlending} /></sprite>
    </group>);
}
function Island({ still, onTouch }) {
    const clock = useRef(0);
    const ref = useRef();
    const flippers = useRef([]);
    const register = useCallback((i, fn) => { flippers.current[i] = fn; }, []);
    const lastFlip = useRef(0);
    useFrame((_, delta) => {
        clock.current += Math.min(delta, 0.05);
        const t = clock.current;
        if (!still && t > 3.4 && t - lastFlip.current > 2.1) {
            lastFlip.current = t;
            flippers.current[Math.floor(Math.random() * flippers.current.length)]?.();
        }
        if (!ref.current) return;
        const rise = still ? 1 : easeOut(clamp01((t - 0.15) / 1.8));
        ref.current.position.y = (rise - 1) * 5;
    });
    return <group ref={ref}>
        <Block size={[5.2, 0.5, 4.2]} position={[0, -0.25, 0]} color={C.stone} />
        <Block size={[5.36, 0.14, 4.36]} position={[0, -0.57, 0]} color={C.stoneEdge} />
        <Block size={[4.3, 1.1, 3.4]} position={[0, -1.19, 0]} color={C.coral1} />
        <Block size={[3.2, 1.3, 2.5]} position={[0.1, -2.39, 0.1]} color={C.coral2} />
        <Block size={[2.0, 1.4, 1.5]} position={[0.2, -3.74, 0.2]} color={C.coral3} />
        {GRID.map((value, i) => <PlazaCard key={i} value={value} index={i} register={register}
            x={-2.05 + (i % 4) * 0.8} z={-0.95 + Math.floor(i / 4) * 1.04}
            order={i % 4 + Math.floor(i / 4) * 2} clock={clock} still={still} onTouch={onTouch} />)}
        <Water still={still} /><Lanterns />
        <Block size={[1.2, 0.25, 1.2]} position={[1.75, 0.125, -1.2]} color={C.stone} />
        <Block size={[0.3, 1.5, 0.3]} position={[1.4, 1.0, -1.2]} color={C.lilac} />
        <Block size={[0.3, 1.5, 0.3]} position={[2.1, 1.0, -1.2]} color={C.lilac} />
        <Block size={[1.1, 0.4, 0.42]} position={[1.75, 1.95, -1.2]} color={C.lilacDark} />
        <TowerTop still={still} /><PivotCard still={still} onTouch={onTouch} />
        {[0, 1, 2, 3, 4].map(i => <Block key={i} size={[0.8, 0.2, 0.34]} position={[1.75, -0.1 - i * 0.2, 2.27 + i * 0.34]} color={C.stone} />)}
        {[[-2.35, -1.75], [0.85, -1.75]].map(([x, z], i) => <group key={i} position={[x, 0, z]}>
            <Block size={[0.08, 0.35, 0.08]} position={[0, 0.17, 0]} color={C.trunk} />
            <mesh position={[0, 0.5, 0]}><sphereGeometry args={[0.24, 16, 12]} /><meshLambertMaterial color={C.leaf} /></mesh>
        </group>)}
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

function Floaters({ still }) {
    const refs = useRef([]);
    const items = [
        { p: [-3.4, 0.8, 1.6], s: 0.32, c: C.coral1 },
        { p: [3.6, -1.4, 2.2], s: 0.26, c: C.lilac },
        { p: [-2.6, -2.6, -1.8], s: 0.4, c: C.coral2 },
        { p: [2.9, 2.6, 1.9], s: 0.18, c: C.stone },
    ];
    useFrame(state => {
        if (still) return;
        const t = state.clock.elapsedTime;
        items.forEach((it, i) => {
            const m = refs.current[i];
            if (!m) return;
            m.position.y = it.p[1] + Math.sin(t * 0.7 + i * 1.7) * 0.15;
            m.rotation.y = t * 0.2 + i;
        });
    });
    return items.map((it, i) => <mesh key={i} ref={el => { refs.current[i] = el; }} position={it.p}>
        <boxGeometry args={[it.s, it.s, it.s]} /><meshLambertMaterial color={it.c} />
    </mesh>);
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
    const span = compact ? 12.5 : 9.6;
    camera.userData.baseZoom = size.width / span;
    camera.zoom = camera.userData.baseZoom;
    camera.position.set(10, 8.2, 10);
    camera.lookAt(0, 0.2, 0);
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
            <directionalLight position={[-3, 9, 6]} intensity={2.6} color="#ffe1ba" castShadow
                shadow-mapSize={[1024, 1024]} shadow-camera-left={-6} shadow-camera-right={6}
                shadow-camera-top={7} shadow-camera-bottom={-6} shadow-normalBias={0.035} shadow-bias={-0.0002} />
            <directionalLight position={[6, 4, -2]} intensity={1.1} color="#a2b9ec" />
            <Stars still={still} />
            <StoneContext.Provider value={stone}>
            <Turntable still={still}>
                <Island still={still} onTouch={onTouch} />
                <Floaters still={still} />
                <Wanderer still={still} />
                {!still && <Fireflies still={still} />}
            </Turntable>
            </StoneContext.Provider>
            <Mist still={still} />
        </Canvas>
    </div>;
}
