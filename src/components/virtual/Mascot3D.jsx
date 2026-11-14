import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { CanvasTexture, MathUtils, SRGBColorSpace } from 'three';

// =====================================================================
// Mascotte de l'IA en 3D temps réel, dans le style « belvédère » :
// volumes pastel en aplats, visage-écran prune, gemme sur l'antenne.
// Chaque difficulté a sa couleur et son humeur. Elle flotte, cligne des
// yeux, suit le doigt du regard ; un tap la fait sauter et tourner.
// =====================================================================

const MOODS = {
    normal: { accent: '#8fae9f', eye: '#cfe4d8', brow: 0, eyeH: 1, mouth: 'smile' },
    hard: { accent: '#c4a07a', eye: '#ecdcc2', brow: 0, eyeH: 0.55, mouth: 'flat' },
    hardcore: { accent: '#959bc0', eye: '#dcdff0', brow: 0.42, eyeH: 0.62, mouth: 'smirk' },
    bonus: { accent: '#b97f78', eye: '#ecd2cd', brow: 0.3, eyeH: 0.8, mouth: 'grin' },
    fury: { accent: '#e2643c', eye: '#ffd3ba', brow: 0.6, eyeH: 0.55, mouth: 'grin' },
};

const BODY = new RoundedBoxGeometry(1.6, 1.36, 1.3, 5, 0.42);
const FACE = new RoundedBoxGeometry(1.24, 0.86, 0.12, 4, 0.06);
const BAND = new RoundedBoxGeometry(1.64, 0.2, 1.34, 4, 0.1);
const EYE = new RoundedBoxGeometry(0.22, 0.3, 0.05, 3, 0.1);

function shadowTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(94,75,124,0.35)'); g.addColorStop(1, 'rgba(94,75,124,0)');
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

function Bot({ difficulty, poke, still, pointer }) {
    const mood = MOODS[difficulty] || MOODS.normal;
    const root = useRef();
    const head = useRef();
    const eyes = useRef();
    const gem = useRef();
    const hands = useRef([]);
    const anim = useRef({ t: 0, hop: 0, spin: 0, blinkAt: 2.2 });
    const accent = mood.accent;
    const eyeColor = mood.eye;
    const shadow = useMemo(() => shadowTexture(), []);

    // Un tap (ou un changement de difficulté) : saut et tour sur soi-même.
    useEffect(() => { if (poke > 0) { anim.current.hop = 1; anim.current.spin += Math.PI * 2; } }, [poke]);
    useEffect(() => { anim.current.hop = Math.max(anim.current.hop, 0.6); }, [difficulty]);

    useFrame((_, delta) => {
        const a = anim.current;
        a.t += Math.min(delta, 0.05);
        const t = a.t;
        a.hop = Math.max(0, a.hop - delta * 1.6);
        const hopY = Math.sin((1 - a.hop) * Math.PI) * (a.hop > 0 ? 0.55 : 0);
        const bob = still ? 0 : Math.sin(t * 1.8) * 0.07;
        if (root.current) {
            root.current.position.y = bob + hopY;
            root.current.rotation.y = MathUtils.damp(root.current.rotation.y, a.spin, 5, delta);
            // Écrasement / étirement au saut
            const squash = a.hop > 0 ? 1 + Math.sin(a.hop * Math.PI) * 0.08 : 1;
            root.current.scale.set(2 - squash, squash, 2 - squash);
        }
        if (head.current && !still) {
            head.current.rotation.y = MathUtils.damp(head.current.rotation.y, pointer.current.x * 0.35, 4, delta);
            head.current.rotation.x = MathUtils.damp(head.current.rotation.x, pointer.current.y * 0.18 + Math.sin(t * 0.9) * 0.03, 4, delta);
            head.current.rotation.z = Math.sin(t * 1.1) * 0.04;
        }
        if (eyes.current) {
            // Clignement : rapide, toutes les ~3 s
            let blink = 1;
            if (!still && t > a.blinkAt) {
                const k = (t - a.blinkAt) / 0.16;
                blink = k < 1 ? Math.abs(1 - 2 * k) : 1;
                if (k >= 1) a.blinkAt = t + 2.2 + Math.random() * 2.4;
            }
            eyes.current.scale.y = MathUtils.damp(eyes.current.scale.y, mood.eyeH * Math.max(blink, 0.08), 18, delta);
        }
        if (gem.current) { gem.current.rotation.y = t * 1.6; gem.current.position.y = 1.22 + Math.sin(t * 2.4) * 0.03; }
        hands.current.forEach((h, i) => { if (h) h.position.y = -0.42 + Math.sin(t * 2 + i * Math.PI) * 0.06; });
    });

    return <group>
        <group ref={root}>
            <group ref={head}>
                <mesh geometry={BODY}><meshLambertMaterial color="#efe9e1" /></mesh>
                <mesh geometry={BAND} position-y={-0.5}><meshLambertMaterial color={accent} /></mesh>
                {/* Oreilles-disques */}
                {[-1, 1].map(s => <mesh key={s} position={[s * 0.83, 0.05, 0]} rotation-z={Math.PI / 2}>
                    <cylinderGeometry args={[0.22, 0.22, 0.12, 24]} />
                    <meshLambertMaterial color={accent} />
                </mesh>)}
                {/* Visage-écran */}
                <group position={[0, 0.06, 0.62]}>
                    <mesh geometry={FACE}><meshLambertMaterial color="#2f3348" /></mesh>
                    <group ref={eyes} position={[0, 0.07, 0.06]}>
                        {[-0.24, 0.24].map(x => <mesh key={x} geometry={EYE} position-x={x}><meshBasicMaterial color={eyeColor} /></mesh>)}
                    </group>
                    {mood.brow > 0 && [-1, 1].map(s => <mesh key={s} position={[s * 0.24, 0.3, 0.07]} rotation-z={-s * mood.brow}>
                        <boxGeometry args={[0.24, 0.05, 0.03]} /><meshBasicMaterial color={eyeColor} />
                    </mesh>)}
                    <Mouth kind={mood.mouth} color={eyeColor} />
                </group>
                {/* Antenne et gemme (flamme en mode Tourment) */}
                <mesh position={[0, 0.88, 0]}><cylinderGeometry args={[0.035, 0.035, 0.42, 8]} /><meshLambertMaterial color="#e6d6cc" /></mesh>
                <group ref={gem} position={[0, 1.22, 0]}>
                    {(difficulty === 'bonus' || difficulty === 'fury')
                        ? <mesh><coneGeometry args={[0.13, 0.34, 10]} /><meshBasicMaterial color={accent} /></mesh>
                        : <mesh><octahedronGeometry args={[0.15]} /><meshLambertMaterial color={accent} /></mesh>}
                </group>
            </group>
            {/* Petites mains flottantes */}
            {[-1, 1].map((s, i) => <mesh key={s} ref={el => { hands.current[i] = el; }} position={[s * 1.02, -0.42, 0.25]}>
                <sphereGeometry args={[0.17, 16, 12]} />
                <meshLambertMaterial color="#efe9e1" />
            </mesh>)}
        </group>
        <sprite position={[0, -1.18, 0]} scale={[2.2, 0.55, 1]}><spriteMaterial map={shadow} transparent depthWrite={false} /></sprite>
    </group>;
}

export default function Mascot3D({ difficulty = 'normal', poke = 0 }) {
    const still = useMemo(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false, []);
    const pointer = useRef({ x: 0, y: 0 });
    useEffect(() => {
        const onMove = e => { pointer.current.x = (e.clientX / innerWidth) * 2 - 1; pointer.current.y = (e.clientY / innerHeight) * 2 - 1; };
        addEventListener('pointermove', onMove, { passive: true });
        return () => removeEventListener('pointermove', onMove);
    }, []);
    return <Canvas flat dpr={[1, 2]} gl={{ antialias: true, alpha: true }} camera={{ position: [0, 0.32, 5.1], fov: 32 }} style={{ pointerEvents: 'none' }}>
        <ambientLight intensity={1.3} />
        <directionalLight position={[-2, 6, 5]} intensity={1.2} color="#fff7ee" />
        <Bot difficulty={(difficulty || 'normal').toLowerCase()} poke={poke} still={still} pointer={pointer} />
    </Canvas>;
}
