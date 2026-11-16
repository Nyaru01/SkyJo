import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { AdditiveBlending, CanvasTexture, Color, MathUtils, SRGBColorSpace } from 'three';

// =====================================================================
// Mascotte de l'IA en 3D temps réel, style « belvédère » détaillé :
// tête-écran avec reflet et ligne de balayage, oreilles à LED, antenne à
// spirale, cou articulé, torse à cœur lumineux, bras articulés, propulseur.
// Chaque difficulté a sa couleur et son humeur. Elle flotte, cligne des
// yeux, suit le doigt du regard ; un tap la fait sauter, tourner et saluer.
// =====================================================================

const MOODS = {
    normal: { accent: '#8fae9f', deep: '#5d7f70', eye: '#cfe4d8', brow: 0, eyeH: 1, mouth: 'smile', cheeks: true },
    hard: { accent: '#c4a07a', deep: '#8f6c49', eye: '#ecdcc2', brow: 0, eyeH: 0.55, mouth: 'flat', cheeks: false },
    hardcore: { accent: '#959bc0', deep: '#5f648c', eye: '#dcdff0', brow: 0.42, eyeH: 0.62, mouth: 'smirk', cheeks: false },
    bonus: { accent: '#b97f78', deep: '#8a4f49', eye: '#ecd2cd', brow: 0.3, eyeH: 0.8, mouth: 'grin', cheeks: true },
    fury: { accent: '#e2643c', deep: '#9c3517', eye: '#ffd3ba', brow: 0.6, eyeH: 0.55, mouth: 'grin', cheeks: false },
};

const SHELL = '#efe9e1';
const SHELL_SHADE = '#d9d0c6';
const METAL = '#4a4e63';

const HEAD = new RoundedBoxGeometry(1.6, 1.3, 1.3, 5, 0.42);
const BEZEL = new RoundedBoxGeometry(1.36, 0.98, 0.1, 4, 0.12);
const FACE = new RoundedBoxGeometry(1.24, 0.86, 0.12, 4, 0.08);
const BAND = new RoundedBoxGeometry(1.64, 0.18, 1.34, 4, 0.09);
const EYE = new RoundedBoxGeometry(0.22, 0.3, 0.05, 3, 0.1);
const TORSO = new RoundedBoxGeometry(1.12, 0.78, 0.86, 5, 0.3);
const CHEST = new RoundedBoxGeometry(0.66, 0.46, 0.08, 3, 0.1);

function radialTexture(stops) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    stops.forEach(([o, col]) => g.addColorStop(o, col));
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
}
// Reflet diagonal de l'écran
function glareTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 128, 128);
    g.addColorStop(0, 'rgba(255,255,255,0.22)'); g.addColorStop(0.35, 'rgba(255,255,255,0.06)'); g.addColorStop(0.36, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
}

function Mouth({ kind, color }) {
    if (kind === 'flat') return <mesh position={[0, -0.2, 0.07]}><boxGeometry args={[0.26, 0.05, 0.03]} /><meshBasicMaterial color={color} /></mesh>;
    if (kind === 'smirk') return <mesh position={[0.03, -0.2, 0.07]} rotation-z={0.25}><boxGeometry args={[0.24, 0.05, 0.03]} /><meshBasicMaterial color={color} /></mesh>;
    const arc = kind === 'grin' ? Math.PI * 0.9 : Math.PI * 0.7;
    return <mesh position={[0, -0.12, 0.07]} rotation-z={Math.PI + (Math.PI - arc) / 2}>
        <torusGeometry args={[0.13, 0.03, 8, 24, arc]} />
        <meshBasicMaterial color={color} />
    </mesh>;
}

// Bras articulé : épaule, bras, coude, avant-bras, main à trois doigts.
function Arm({ side, accent, armRef, foreRef }) {
    return <group position={[side * 0.66, -0.5, 0.02]}>
        <mesh><sphereGeometry args={[0.15, 18, 14]} /><meshStandardMaterial color={accent} roughness={0.4} /></mesh>
        <group ref={armRef} rotation-z={side * 0.32}>
            <mesh position={[side * 0.02, -0.2, 0]}><capsuleGeometry args={[0.075, 0.26, 6, 12]} /><meshStandardMaterial color={SHELL} roughness={0.45} /></mesh>
            <group ref={foreRef} position={[side * 0.02, -0.4, 0]}>
                <mesh><sphereGeometry args={[0.085, 14, 10]} /><meshStandardMaterial color={METAL} roughness={0.35} metalness={0.4} /></mesh>
                <mesh position={[0, -0.17, 0.04]} rotation-x={-0.3}><capsuleGeometry args={[0.07, 0.2, 6, 12]} /><meshStandardMaterial color={SHELL} roughness={0.45} /></mesh>
                <group position={[0, -0.36, 0.1]}>
                    <mesh><sphereGeometry args={[0.12, 16, 12]} /><meshStandardMaterial color={SHELL_SHADE} roughness={0.5} /></mesh>
                    {[-0.06, 0, 0.06].map(x => <mesh key={x} position={[x, -0.1, 0.04]}><capsuleGeometry args={[0.025, 0.06, 4, 8]} /><meshStandardMaterial color={SHELL_SHADE} roughness={0.5} /></mesh>)}
                    <mesh position={[side * -0.1, -0.02, 0.05]} rotation-z={side * 0.8}><capsuleGeometry args={[0.028, 0.06, 4, 8]} /><meshStandardMaterial color={SHELL_SHADE} roughness={0.5} /></mesh>
                </group>
            </group>
        </group>
    </group>;
}

const NO_POINTER = { current: { x: 0, y: 0 } };
// Petites scènes de vie jouées au hasard quand on ne la touche pas.
const ACTS = ['look', 'tilt', 'happy', 'wave', 'scan', 'talk', 'look', 'dance', 'sleepy', 'tilt'];
// Rival (écran du duel) : un compétiteur concentré — il observe et analyse, sans danser ni saluer.
const RIVAL_ACTS = ['look', 'scan', 'look', 'tilt'];
const RIVAL_RANGE = 2.2;
const ACT_DURATION = { dance: 2.6, sleepy: 3.2 };
// Bulles d'émotion au-dessus de la tête : ♥ content, ! repère, ? curieux, ♪ danse, z sieste.
const EMOTE = { happy: '♥', scan: '!', look: '?', tilt: '?', dance: '♪', sleepy: 'z' };
function emoteTexture(glyph) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(255,250,242,0.96)';
    g.beginPath(); g.arc(64, 58, 44, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(52, 96); g.lineTo(64, 120); g.lineTo(74, 96); g.fill();
    g.fillStyle = glyph === '♥' ? '#e2643c' : '#3a3150';
    g.font = 'bold 56px Georgia, serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(glyph, 64, 60);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
}

export function MascotBot({ difficulty = 'normal', poke = 0, still = false, rival = false, pointer = NO_POINTER, shadow: showShadow = true }) {
    const mood = MOODS[difficulty] || MOODS.normal;
    const { accent, deep, eye: eyeColor } = mood;
    const root = useRef();
    const head = useRef();
    const eyes = useRef();
    const gem = useRef();
    const halo = useRef();
    const scan = useRef();
    const core = useRef();
    const flame = useRef();
    const shadowRef = useRef();
    const leds = useRef([]);
    const arms = useRef([]);
    const fores = useRef([]);
    const happyEyes = useRef();
    const mouth = useRef();
    const torso = useRef();
    const emote = useRef();
    const emoteTextures = useMemo(() => Object.fromEntries([...new Set(Object.values(EMOTE))].map(g => [g, emoteTexture(g)])), []);
    const anim = useRef({ t: 0, hop: 0, spin: 0, wave: 0, blinkAt: 2.2, act: null, actAt: 0, nextAct: 3.2, look: { x: 0, y: 0 }, prevYaw: 0, spring: 0, springV: 0, x: 0, tx: 0, v: 0, walkAt: 1.2, y: 0, ty: 0, z: 0, tz: 0 });
    const shadow = useMemo(() => radialTexture([[0, 'rgba(94,75,124,0.38)'], [1, 'rgba(94,75,124,0)']]), []);
    const glow = useMemo(() => radialTexture([[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]), []);
    const glare = useMemo(() => glareTexture(), []);
    const coreColor = useMemo(() => new Color(eyeColor), [eyeColor]);
    const ledOn = useMemo(() => new Color(accent).offsetHSL(0, 0.1, 0.18), [accent]);
    const ledOff = useMemo(() => new Color(deep), [deep]);

    // Un tap (ou un changement de difficulté) : saut, tour sur soi-même et salut.
    useEffect(() => { if (poke > 0 && rival) { const a = anim.current; a.act = 'scan'; a.actAt = a.t; a.nextAct = a.t + 3; return; } if (poke > 0) { const a = anim.current; a.hop = 1; a.spin += Math.PI * 2; a.wave = 1.6; a.act = 'happy'; a.actAt = a.t; a.nextAct = a.t + 3; } }, [poke, rival]);
    useEffect(() => { if (rival) return; anim.current.hop = Math.max(anim.current.hop, 0.6); anim.current.wave = 1.2; }, [difficulty, rival]);

    useFrame((_, delta) => {
        const a = anim.current;
        const dt = Math.min(delta, 0.05);
        a.t += dt;
        const t = a.t;
        a.hop = Math.max(0, a.hop - dt * 1.6);
        a.wave = Math.max(0, a.wave - dt);
        // Scène de vie : une action toutes les 3 à 6 s, chacune dure environ 1,8 s.
        if (!still && t > a.nextAct) {
            const pool = rival ? RIVAL_ACTS : ACTS;
            a.act = pool[Math.floor(Math.random() * pool.length)];
            a.actAt = t; a.nextAct = t + 3 + Math.random() * 3;
            if (a.act === 'look') a.look = { x: (Math.random() * 2 - 1) * 0.6, y: (Math.random() * 2 - 1) * 0.25 };
            if (a.act === 'wave') a.wave = 1.6;
            if (a.act === 'happy') a.hop = Math.max(a.hop, 0.55);
        }
        const actK = a.act ? (t - a.actAt) / (ACT_DURATION[a.act] || 1.8) : 1;
        if (actK >= 1) a.act = null;
        // Rival : il glisse en lévitation (pas de jambes), s’arrête, observe, puis repart.
        if (rival && !still) {
            if (t > a.walkAt && Math.abs(a.tx - a.x) < 0.02) {
                let tx = a.x;
                for (let i = 0; i < 6 && Math.abs(tx - a.x) < 0.7; i++) tx = (Math.random() * 2 - 1) * RIVAL_RANGE;
                a.tx = Math.abs(tx - a.x) >= 0.7 ? tx : 0;
                // et change un peu d’altitude et de profondeur, pour occuper toute sa boîte
                a.ty = Math.random() * 0.4 - 0.2; a.tz = -Math.random() * 1.1 + 0.2;
                a.walkAt = Infinity;
            }
            const dx = a.tx - a.x;
            // Vitesse lissée : démarre et freine en douceur, comme un drone.
            a.v = MathUtils.damp(a.v, MathUtils.clamp(dx * 2.4, -1.4, 1.4), 3, dt);
            a.y = MathUtils.damp(a.y, a.ty, 1.6, dt); a.z = MathUtils.damp(a.z, a.tz, 1.4, dt);
            a.x += a.v * dt;
            if (Math.abs(dx) > 0.03 || Math.abs(a.v) > 0.04) a.act = null;
            else if (a.walkAt === Infinity) {
                a.x = a.tx; a.v = 0;
                a.walkAt = t + 1.2 + Math.random() * 2;
                a.act = Math.random() < 0.5 ? 'scan' : 'look'; a.actAt = t; a.nextAct = t + 2.4;
                a.look = { x: -a.x * 0.15, y: 0 };
            }
        }
        const act = a.act;
        const ptr = pointer.current;
        const hopY = Math.sin((1 - a.hop) * Math.PI) * (a.hop > 0 ? 0.5 : 0);
        const bob = still ? 0 : rival ? Math.sin(t * 1.6) * 0.06 : act === 'sleepy' ? Math.sin(t * 0.9) * 0.04 - 0.05 : act === 'dance' ? Math.abs(Math.sin(t * 7)) * 0.16 : Math.sin(t * 1.8) * 0.07;
        if (root.current) {
            root.current.position.y = bob + hopY + (rival ? a.y : 0);
            root.current.position.x = a.x;
            if (rival) root.current.position.z = a.z;
            root.current.rotation.y = MathUtils.damp(root.current.rotation.y, a.spin + (rival ? a.v * 0.28 : 0), 5, dt);
            root.current.rotation.z = MathUtils.damp(root.current.rotation.z, act === 'dance' ? Math.sin(t * 7) * 0.14 : rival ? -a.v * 0.13 : 0, 8, dt);
            const squash = a.hop > 0 ? 1 + Math.sin(a.hop * Math.PI) * 0.08 : 1;
            root.current.scale.set(2 - squash, squash, 2 - squash);
        }
        if (shadowRef.current) {
            const k = 1 - (bob + hopY) * 0.5;
            shadowRef.current.scale.set(2.3 * k, 0.55 * k, 1);
            shadowRef.current.material.opacity = Math.max(0.3, k);
            shadowRef.current.position.x = a.x;
            if (rival) shadowRef.current.position.z = a.z;
        }
        if (head.current && !still) {
            const scanYaw = act === 'scan' ? Math.sin(actK * Math.PI * 2) * 0.55 : 0;
            const yaw = act === 'look' ? a.look.x : ptr.x * 0.35 + scanYaw;
            const pitch = act === 'look' ? a.look.y : act === 'happy' ? -0.12 : act === 'sleepy' ? 0.28 : ptr.y * 0.18;
            head.current.rotation.y = MathUtils.damp(head.current.rotation.y, yaw, 4, dt);
            head.current.rotation.x = MathUtils.damp(head.current.rotation.x, pitch + Math.sin(t * 0.9) * 0.03, 4, dt);
            head.current.rotation.z = MathUtils.damp(head.current.rotation.z, (act === 'tilt' ? 0.26 : 0) + Math.sin(t * 1.1) * 0.04, 5, dt);
            // Ressort de l'antenne : elle traîne derrière les mouvements de tête.
            const yawV = (head.current.rotation.y - a.prevYaw) / Math.max(dt, 0.001);
            a.prevYaw = head.current.rotation.y;
            a.springV += (-a.spring * 60 - a.springV * 7 - yawV * 2.2) * dt;
            a.spring += a.springV * dt;
        }
        if (eyes.current) {
            let blink = 1;
            if (!still && t > a.blinkAt) {
                const k = (t - a.blinkAt) / 0.16;
                blink = k < 1 ? Math.abs(1 - 2 * k) : 1;
                if (k >= 1) a.blinkAt = t + 2.2 + Math.random() * 2.4;
            }
            const happy = act === 'happy';
            eyes.current.visible = !happy;
            if (happyEyes.current) happyEyes.current.visible = happy;
            eyes.current.scale.y = MathUtils.damp(eyes.current.scale.y, act === 'sleepy' ? 0.1 : mood.eyeH * Math.max(blink, 0.08) * (act === 'tilt' ? 0.8 : 1), act === 'sleepy' ? 4 : 18, dt);
            const eyeX = act === 'scan' ? Math.sin(actK * Math.PI * 2) * 0.09 : act === 'look' ? a.look.x * 0.12 : ptr.x * 0.05;
            if (!still) eyes.current.position.x = MathUtils.damp(eyes.current.position.x, eyeX, 6, dt);
            // Clin d'œil en penchant la tête : l'œil droit se plisse.
            const right = eyes.current.children[1];
            if (right) right.scale.y = MathUtils.damp(right.scale.y, act === 'tilt' ? 0.45 : 1, 12, dt);
        }
        if (mouth.current) {
            const talk = act === 'talk' ? 0.6 + Math.abs(Math.sin(t * 16)) * 0.9 : act === 'happy' ? 1.3 : 1;
            mouth.current.scale.y = MathUtils.damp(mouth.current.scale.y, talk, 20, dt);
            mouth.current.scale.x = MathUtils.damp(mouth.current.scale.x, act === 'happy' ? 1.2 : 1, 12, dt);
        }
        if (emote.current) {
            const glyph = act && !rival ? EMOTE[act] : null;
            const k = act ? Math.min(1, actK * 6, (1 - actK) * 5) : 0;
            if (glyph && emote.current.userData.glyph !== glyph) { emote.current.material.map = emoteTextures[glyph]; emote.current.material.needsUpdate = true; emote.current.userData.glyph = glyph; }
            emote.current.material.opacity = glyph ? k : 0;
            const pop = 0.55 + k * 0.1 + (act === 'sleepy' ? actK * 0.25 : 0);
            emote.current.scale.set(pop, pop, 1);
            emote.current.position.set(0.85 + (act === 'sleepy' ? actK * 0.25 : 0), 1.75 + (act === 'sleepy' ? actK * 0.4 : Math.sin(t * 3) * 0.04), 0.2);
        }
        if (torso.current) torso.current.scale.set(1 + Math.sin(t * 2) * 0.012, 1 + Math.sin(t * 2 + 0.4) * 0.018, 1);
        if (gem.current) { gem.current.rotation.y = t * (act === 'scan' ? 5 : 1.6); gem.current.position.y = 1.36 + Math.sin(t * 2.4) * 0.03; gem.current.position.x = a.spring * 0.6; gem.current.rotation.z = -a.spring * 1.4; }
        if (halo.current) { halo.current.rotation.z = t * 0.8; halo.current.rotation.x = Math.PI / 2 + Math.sin(t * 1.3) * 0.25; }
        if (scan.current) { const k = (t * 0.45) % 1; scan.current.position.y = 0.4 - k * 0.8; scan.current.material.opacity = Math.sin(k * Math.PI) * 0.16; }
        if (core.current) { const p = 1 + Math.sin(t * 3.2) * 0.12; core.current.scale.set(p, p, 1); core.current.material.opacity = 0.75 + Math.sin(t * 3.2) * 0.2; }
        if (flame.current) { const f = 1 + Math.sin(t * 31) * 0.08 + Math.sin(t * 17) * 0.06; flame.current.scale.set(1, f, 1); }
        leds.current.forEach((m, i) => { if (m) m.material.color.copy(Math.sin(t * 3 + i * 2.1) > 0.2 ? ledOn : ledOff); });
        // Bras : balancement doux ; le bras droit salue après un tap.
        arms.current.forEach((g, i) => {
            if (!g) return;
            const side = i === 0 ? -1 : 1;
            const waving = side === 1 && a.wave > 0;
            const dancing = act === 'dance';
            const target = waving ? side * 2.5 : dancing ? side * (1.4 + Math.sin(t * 7 + i * Math.PI) * 0.9) : act === 'sleepy' ? side * 0.12 : side * (0.32 + (still ? 0 : Math.sin(t * 2 + i * Math.PI) * 0.08));
            g.rotation.z = MathUtils.damp(g.rotation.z, target, 6, dt);
            if (fores.current[i]) fores.current[i].rotation.z = MathUtils.damp(fores.current[i].rotation.z, waving ? Math.sin(t * 14) * 0.5 : side * -0.15, 8, dt);
        });
    });

    return <group>
        <group ref={root}>
            {/* ---------- Tête ---------- */}
            <group ref={head} position-y={0.42}>
                <mesh geometry={HEAD}><meshStandardMaterial color={SHELL} roughness={0.42} /></mesh>
                <mesh geometry={BAND} position-y={-0.5}><meshStandardMaterial color={accent} roughness={0.35} /></mesh>
                {/* Grilles d'aération sur le dessus */}
                {[-0.22, 0, 0.22].map(x => <mesh key={x} position={[x, 0.655, -0.1]}><boxGeometry args={[0.1, 0.02, 0.5]} /><meshStandardMaterial color={SHELL_SHADE} roughness={0.6} /></mesh>)}
                {/* Oreilles : disque, anneau, LED */}
                {[-1, 1].map((s, i) => <group key={s} position={[s * 0.83, 0.02, 0]} rotation-z={Math.PI / 2}>
                    <mesh><cylinderGeometry args={[0.24, 0.24, 0.12, 28]} /><meshStandardMaterial color={accent} roughness={0.35} /></mesh>
                    <mesh position-y={s * 0.065} rotation-x={Math.PI / 2}><torusGeometry args={[0.15, 0.025, 8, 28]} /><meshStandardMaterial color={deep} roughness={0.3} metalness={0.3} /></mesh>
                    <mesh ref={el => { leds.current[i] = el; }} position-y={s * 0.075}><sphereGeometry args={[0.05, 12, 10]} /><meshBasicMaterial color={accent} /></mesh>
                </group>)}
                {/* Visage-écran : cadre, vis, écran, yeux, reflet, balayage */}
                <group position={[0, 0.06, 0.62]}>
                    <mesh geometry={BEZEL} position-z={-0.02}><meshStandardMaterial color={deep} roughness={0.35} metalness={0.2} /></mesh>
                    {[[-0.6, 0.41], [0.6, 0.41], [-0.6, -0.41], [0.6, -0.41]].map(([x, y]) => <mesh key={`${x}${y}`} position={[x, y, 0.04]} rotation-x={Math.PI / 2}>
                        <cylinderGeometry args={[0.03, 0.03, 0.03, 10]} /><meshStandardMaterial color={SHELL_SHADE} metalness={0.5} roughness={0.3} />
                    </mesh>)}
                    <mesh geometry={FACE}><meshStandardMaterial color="#232638" roughness={0.18} metalness={0.3} /></mesh>
                    <group ref={eyes} position={[0, 0.07, 0.06]}>
                        {[-0.24, 0.24].map(x => <group key={x} position-x={x}>
                            <mesh geometry={EYE}><meshBasicMaterial color={eyeColor} /></mesh>
                            <mesh position={[0.05, 0.08, 0.03]}><boxGeometry args={[0.05, 0.05, 0.01]} /><meshBasicMaterial color="#ffffff" /></mesh>
                            <sprite position-z={0.02} scale={[0.5, 0.6, 1]}><spriteMaterial map={glow} color={eyeColor} transparent opacity={0.35} blending={AdditiveBlending} depthWrite={false} /></sprite>
                        </group>)}
                    </group>
                    <group ref={happyEyes} position={[0, 0.06, 0.06]} visible={false}>
                        {[-0.24, 0.24].map(x => <mesh key={x} position-x={x} rotation-z={0}><torusGeometry args={[0.1, 0.035, 8, 20, Math.PI]} /><meshBasicMaterial color={eyeColor} /></mesh>)}
                    </group>
                    {mood.brow > 0 && [-1, 1].map(s => <mesh key={s} position={[s * 0.24, 0.3, 0.07]} rotation-z={-s * mood.brow}>
                        <boxGeometry args={[0.24, 0.05, 0.03]} /><meshBasicMaterial color={eyeColor} />
                    </mesh>)}
                    {mood.cheeks && [-1, 1].map(s => <mesh key={s} position={[s * 0.42, -0.14, 0.07]}><circleGeometry args={[0.06, 16]} /><meshBasicMaterial color="#f2a6a0" transparent opacity={0.7} /></mesh>)}
                    <group ref={mouth} position-y={-0.14}><group position-y={0.14}><Mouth kind={mood.mouth} color={eyeColor} /></group></group>
                    <mesh ref={scan} position-z={0.075}><planeGeometry args={[1.18, 0.035]} /><meshBasicMaterial color={eyeColor} transparent opacity={0.12} depthWrite={false} /></mesh>
                    <mesh position-z={0.08}><planeGeometry args={[1.2, 0.82]} /><meshBasicMaterial map={glare} transparent depthWrite={false} /></mesh>
                </group>
                {/* Antenne : socle, tige, spirale, gemme et halo */}
                <mesh position={[0, 0.68, 0]}><cylinderGeometry args={[0.14, 0.18, 0.08, 20]} /><meshStandardMaterial color={accent} roughness={0.35} /></mesh>
                <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.03, 0.03, 0.42, 8]} /><meshStandardMaterial color={METAL} metalness={0.5} roughness={0.3} /></mesh>
                {[0.8, 0.88, 0.96].map(y => <mesh key={y} position-y={y} rotation-x={Math.PI / 2}><torusGeometry args={[0.06, 0.015, 6, 16]} /><meshStandardMaterial color={SHELL_SHADE} metalness={0.4} roughness={0.3} /></mesh>)}
                <group ref={gem} position={[0, 1.36, 0]}>
                    {(difficulty === 'bonus' || difficulty === 'fury')
                        ? <mesh><coneGeometry args={[0.13, 0.34, 10]} /><meshBasicMaterial color={accent} /></mesh>
                        : <mesh><octahedronGeometry args={[0.15]} /><meshStandardMaterial color={accent} roughness={0.15} metalness={0.2} emissive={accent} emissiveIntensity={0.35} /></mesh>}
                    <sprite scale={[0.7, 0.7, 1]}><spriteMaterial map={glow} color={accent} transparent opacity={0.55} blending={AdditiveBlending} depthWrite={false} /></sprite>
                </group>
                <mesh ref={halo} position={[0, 0.94, 0]}><torusGeometry args={[0.24, 0.012, 6, 40]} /><meshBasicMaterial color={accent} transparent opacity={0.6} /></mesh>
            </group>
            {/* ---------- Cou ---------- */}
            <mesh position-y={-0.32}><cylinderGeometry args={[0.2, 0.24, 0.2, 20]} /><meshStandardMaterial color={METAL} metalness={0.45} roughness={0.35} /></mesh>
            {[-0.27, -0.36].map(y => <mesh key={y} position-y={y} rotation-x={Math.PI / 2}><torusGeometry args={[0.23, 0.02, 6, 24]} /><meshStandardMaterial color={SHELL_SHADE} roughness={0.4} /></mesh>)}
            {/* ---------- Torse ---------- */}
            <group ref={torso} position-y={-0.78}>
                <mesh geometry={TORSO}><meshStandardMaterial color={SHELL} roughness={0.42} /></mesh>
                <mesh geometry={CHEST} position={[0, 0.02, 0.43]}><meshStandardMaterial color={accent} roughness={0.35} /></mesh>
                <mesh position={[0, 0.05, 0.475]}><circleGeometry args={[0.12, 28]} /><meshStandardMaterial color="#232638" roughness={0.2} /></mesh>
                <mesh ref={core} position={[0, 0.05, 0.48]}><circleGeometry args={[0.085, 28]} /><meshBasicMaterial color={coreColor} transparent /></mesh>
                <sprite position={[0, 0.05, 0.5]} scale={[0.45, 0.45, 1]}><spriteMaterial map={glow} color={eyeColor} transparent opacity={0.45} blending={AdditiveBlending} depthWrite={false} /></sprite>
                {[-0.2, 0.2].map(x => <mesh key={x} position={[x, -0.14, 0.475]}><circleGeometry args={[0.035, 16]} /><meshBasicMaterial color={x < 0 ? '#ffd27a' : eyeColor} /></mesh>)}
                <mesh position-y={-0.3} rotation-x={Math.PI / 2}><torusGeometry args={[0.47, 0.035, 8, 40]} /><meshStandardMaterial color={accent} roughness={0.35} /></mesh>
                {/* Propulseur et flamme */}
                <mesh position-y={-0.46}><cylinderGeometry args={[0.18, 0.13, 0.16, 20]} /><meshStandardMaterial color={METAL} metalness={0.5} roughness={0.3} /></mesh>
                <mesh position-y={-0.54} rotation-x={Math.PI / 2}><torusGeometry args={[0.13, 0.025, 6, 20]} /><meshBasicMaterial color={accent} /></mesh>
                {!still && <group ref={flame} position-y={-0.6}>
                    <mesh position-y={-0.12} rotation-x={Math.PI}><coneGeometry args={[0.1, 0.3, 14]} /><meshBasicMaterial color={accent} transparent opacity={0.75} blending={AdditiveBlending} depthWrite={false} /></mesh>
                    <mesh position-y={-0.08} rotation-x={Math.PI}><coneGeometry args={[0.05, 0.18, 10]} /><meshBasicMaterial color="#fff6e8" transparent opacity={0.9} blending={AdditiveBlending} depthWrite={false} /></mesh>
                </group>}
            </group>
            <sprite ref={emote} position={[0.85, 1.75, 0.2]} scale={[0.55, 0.55, 1]}><spriteMaterial transparent opacity={0} depthWrite={false} /></sprite>
            {/* ---------- Bras ---------- */}
            {[-1, 1].map((s, i) => <Arm key={s} side={s} accent={accent} armRef={el => { arms.current[i] = el; }} foreRef={el => { fores.current[i] = el; }} />)}
        </group>
        {showShadow && <sprite ref={shadowRef} position={[0, -1.78, 0]} scale={[2.3, 0.55, 1]}><spriteMaterial map={shadow} transparent depthWrite={false} /></sprite>}
    </group>;
}

export default function Mascot3D({ difficulty = 'normal', poke = 0, rival = false }) {
    const still = useMemo(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false, []);
    const pointer = useRef({ x: 0, y: 0 });
    useEffect(() => {
        const onMove = e => { pointer.current.x = (e.clientX / innerWidth) * 2 - 1; pointer.current.y = (e.clientY / innerHeight) * 2 - 1; };
        addEventListener('pointermove', onMove, { passive: true });
        return () => removeEventListener('pointermove', onMove);
    }, []);
    return <Canvas flat dpr={[1, rival ? 1.5 : 2]} gl={{ antialias: true, alpha: true }} camera={{ position: [0, 0.08, 6.9], fov: 32 }} style={{ pointerEvents: 'none' }}>
        <ambientLight intensity={0.9} />
        <hemisphereLight args={['#fff4ea', '#5e4b7c', 0.8]} />
        <directionalLight position={[-2, 6, 5]} intensity={1.5} color="#fff7ee" />
        <directionalLight position={[3, 2, -4]} intensity={1.1} color={(MOODS[(difficulty || 'normal').toLowerCase()] || MOODS.normal).accent} />
        <MascotBot difficulty={(difficulty || 'normal').toLowerCase()} poke={poke} still={still} rival={rival} pointer={pointer} />
    </Canvas>;
}
