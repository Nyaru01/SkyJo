import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { BoxGeometry, CanvasTexture, MathUtils, PlaneGeometry, SRGBColorSpace } from 'three';
import { backTexture, pastelFaceTexture } from './cardTextures';
import { useGameStore } from '../../store/gameStore';
import { getCardSkinPath } from '../../lib/skinUtils';

// Dos du skin choisi par le joueur (même dos qu'en partie).
function usePlayerBack() {
    const skin = useGameStore(state => state.cardSkin);
    const path = getCardSkinPath(skin || 'classic');
    return useMemo(() => backTexture(path), [path]);
}

// =====================================================================
// Accueil « belvédère » : un diorama isométrique original qui flotte dans
// un ciel pastel. Aplats colorés (dessus clair, côtés plus soutenus), formes
// pures, beaucoup d'air. Le parvis est la grille de 12 cartes ; une grande
// carte pivote au sommet de la tour comme un mécanisme.
// =====================================================================

const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = t => Math.min(1, Math.max(0, t));
const haptic = () => { try { navigator.vibrate?.(10); } catch { /* indisponible */ } };
const setPointer = on => { document.body.style.cursor = on ? 'pointer' : ''; };

// Palette : pierre crème, corail, rose, lavande, menthe d'eau.
const C = {
    stone: '#f6e7d7', stoneEdge: '#efd8c4',
    coral1: '#eeb1a2', coral2: '#e49b98', coral3: '#d48ea3', coral4: '#bf8fb3',
    lilac: '#d2b8e4', lilacDark: '#b89dd2', dome: '#f4c3b6',
    water: '#a9e0d6', leaf: '#a6d6bd', trunk: '#c79c8a',
};

// Grille du parvis : null = carte face cachée.
const GRID = [5, null, -1, null, null, 0, null, 9, 3, null, 12, null];
const CARD = { w: 0.62, h: 0.86, t: 0.035 };
const CARD_GEO = new BoxGeometry(CARD.w, CARD.t, CARD.h);
const CARD_FACE = new PlaneGeometry(CARD.w - 0.02, CARD.h - 0.02);

function Block({ size, position, color, rotation }) {
    return <mesh position={position} rotation={rotation}>
        <boxGeometry args={size} />
        <meshLambertMaterial color={color} />
    </mesh>;
}

// Carte posée à plat ; se retourne (vague d'intro puis au tap).
function PlazaCard({ value, x, z, order, clock, still, onTouch, index, register }) {
    const ref = useRef();
    const [shown, setShown] = useState(value);
    const state = useRef({ faceUp: false, angle: Math.PI, introDone: false });
    // Permet à l'île de retourner cette carte d'elle-même (animation d'ambiance).
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
        <mesh geometry={CARD_GEO}><meshLambertMaterial color="#fffaf3" /></mesh>
        {front && <mesh geometry={CARD_FACE} rotation-x={-Math.PI / 2} position-y={CARD.t / 2 + 0.001}>
            <meshBasicMaterial map={front} transparent alphaTest={0.5} />
        </mesh>}
        <mesh geometry={CARD_FACE} rotation-x={Math.PI / 2} position-y={-CARD.t / 2 - 0.001}>
            <meshBasicMaterial map={back} transparent alphaTest={0.5} />
        </mesh>
    </group>;
}

// La grande carte au sommet : pivote lentement, un tap la fait tourner d'un tour.
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

// Petits blocs qui flottent autour de l'île.
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
        <boxGeometry args={[it.s, it.s, it.s]} />
        <meshLambertMaterial color={it.c} />
    </mesh>);
}

// Brume douce sous l'île : l'île naît d'une mer de lumière, qui dérive lentement.
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
        g.addColorStop(0, 'rgba(255,248,242,0.95)'); g.addColorStop(0.5, 'rgba(255,240,236,0.55)'); g.addColorStop(1, 'rgba(255,240,236,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
        const t = new CanvasTexture(c);
        t.colorSpace = SRGBColorSpace;
        return t;
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

// Haut de la tour : pivote d'un quart de tour à intervalles réguliers, comme un mécanisme.
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
        {/* Balcon et porte : rendent la rotation visible */}
        <Block size={[0.56, 0.14, 0.34]} position={[0, 2.25, 0.72]} color={C.lilacDark} />
        <Block size={[0.26, 0.4, 0.04]} position={[0, 2.55, 0.57]} color={C.coral3} />
        <mesh position={[0, 2.95, 0]}>
            <sphereGeometry args={[0.46, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshLambertMaterial color={C.dome} />
        </mesh>
        <Block size={[0.05, 0.45, 0.05]} position={[0, 3.4, 0]} color={C.stoneEdge} />
    </group>;
}

// Bassin dont la couleur ondule doucement.
function Water({ still }) {
    const mat = useRef();
    useFrame(state => {
        if (!mat.current || still) return;
        const k = (Math.sin(state.clock.elapsedTime * 1.4) + 1) / 2;
        mat.current.color.setRGB(0.6 + k * 0.08, 0.86 + k * 0.05, 0.82 + k * 0.06);
    });
    return <mesh rotation-x={-Math.PI / 2} position={[1.75, 0.006, 1.05]}>
        <planeGeometry args={[1.05, 1.5]} />
        <meshBasicMaterial ref={mat} color={C.water} />
    </mesh>;
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
        // Ambiance : une carte se retourne d'elle-même toutes les ~2 s.
        if (!still && t > 3.4 && t - lastFlip.current > 2.1) {
            lastFlip.current = t;
            const pick = flippers.current[Math.floor(Math.random() * flippers.current.length)];
            pick?.();
        }
        if (!ref.current) return;
        const rise = still ? 1 : easeOut(clamp01((t - 0.15) / 1.8));
        ref.current.position.y = (rise - 1) * 5;
    });
    const cards = GRID.map((value, i) => {
        const col = i % 4, row = Math.floor(i / 4);
        return { value, x: -2.05 + col * 0.8, z: -0.95 + row * 1.04, order: col + row * 2 };
    });
    return <group ref={ref}>
        {/* Parvis et assises de l'île, de plus en plus étroites vers la brume */}
        <Block size={[5.2, 0.5, 4.2]} position={[0, -0.25, 0]} color={C.stone} />
        <Block size={[5.36, 0.14, 4.36]} position={[0, -0.57, 0]} color={C.stoneEdge} />
        <Block size={[4.3, 1.1, 3.4]} position={[0, -1.19, 0]} color={C.coral1} />
        <Block size={[3.2, 1.3, 2.5]} position={[0.1, -2.39, 0.1]} color={C.coral2} />
        <Block size={[2.0, 1.4, 1.5]} position={[0.2, -3.74, 0.2]} color={C.coral3} />

        {/* Grille de cartes */}
        {cards.map((c, i) => <PlazaCard key={i} {...c} index={i} register={register} clock={clock} still={still} onTouch={onTouch} />)}

        <Water still={still} />

        {/* Tour à arche ; le haut pivote ; carte au sommet */}
        <Block size={[1.2, 0.25, 1.2]} position={[1.75, 0.125, -1.2]} color={C.stone} />
        <Block size={[0.3, 1.5, 0.3]} position={[1.4, 1.0, -1.2]} color={C.lilac} />
        <Block size={[0.3, 1.5, 0.3]} position={[2.1, 1.0, -1.2]} color={C.lilac} />
        <Block size={[1.1, 0.4, 0.42]} position={[1.75, 1.95, -1.2]} color={C.lilacDark} />
        <TowerTop still={still} />
        <PivotCard still={still} onTouch={onTouch} />

        {/* Escalier qui descend du parvis vers le vide */}
        {[0, 1, 2, 3, 4].map(i => <Block key={i} size={[0.8, 0.2, 0.34]} position={[1.75, -0.1 - i * 0.2, 2.27 + i * 0.34]} color={C.stone} />)}

        {/* Deux petits arbres ronds */}
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

function Turntable({ still, children }) {
    const ref = useRef();
    const tilt = useTilt();
    useFrame((state, delta) => {
        if (!ref.current || still) return;
        const idle = Math.sin(state.clock.elapsedTime * 0.25) * 0.05;
        ref.current.rotation.y = MathUtils.damp(ref.current.rotation.y, tilt.current.x * 0.14 + idle, 2, delta);
    });
    return <group ref={ref}>{children}</group>;
}

// Caméra orthographique isométrique ; l'île occupe la largeur et se place sous le titre.
function frameCamera(camera, size, compact) {
    const span = compact ? 12.5 : 9.6;
    camera.zoom = size.width / span;
    camera.position.set(10, 8.2, 10);
    camera.lookAt(0, 0.2, 0);
    const target = compact ? 0.355 : 0.39;
    camera.setViewOffset(size.width, size.height, 0, (0.5 - target) * size.height, size.width, size.height);
    camera.updateProjectionMatrix();
}
function CameraRig({ compact }) {
    const { camera, size } = useThree();
    useEffect(() => frameCamera(camera, size, compact), [camera, size, compact]);
    return null;
}

export default function HomeWorldScene3D({ compact = false }) {
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
            orthographic flat
            frameloop={onScreen ? 'always' : 'never'}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true }}
            camera={{ position: [10, 8.2, 10], zoom: 45, near: -50, far: 100 }}
        >
            <CameraRig compact={compact} />
            {/* Aplats : dessus très clair, face gauche moyenne, face droite plus soutenue */}
            <ambientLight intensity={1.35} />
            <directionalLight position={[2, 10, 5]} intensity={1.25} color="#fff7ee" />
            <Turntable still={still}>
                <Island still={still} onTouch={onTouch} />
                <Floaters still={still} />
            </Turntable>
            <Mist still={still} />
        </Canvas>
    </div>;
}
