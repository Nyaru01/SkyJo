import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color, DoubleSide, Object3D, PlaneGeometry, SRGBColorSpace, Shape, ShapeGeometry } from 'three';

// =====================================================================
// Effets de saison pour l'accueil : feuilles d'automne, pétales de printemps,
// neige d'hiver, et étoiles filantes toute l'année.
// =====================================================================

function softDot(inner, outer) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, inner); g.addColorStop(0.45, outer); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
}

// ---------- Feuilles / pétales : une forme de feuille, instanciée ----------
function leafGeometry() {
    const s = new Shape();
    s.moveTo(0, -0.09);
    s.quadraticCurveTo(0.075, -0.02, 0, 0.09);
    s.quadraticCurveTo(-0.075, -0.02, 0, -0.09);
    return new ShapeGeometry(s, 6);
}
const PALETTES = {
    autumn: ['#c9733f', '#d99a4a', '#a8532f', '#e0b25e', '#8f4a2c'],
    spring: ['#f2c6cf', '#f6dbe0', '#e9b4c2', '#fbe9ec'],
};
const LEAF_COUNT = 34;

function createLeaves(season) {
    const colors = PALETTES[season];
    const items = Array.from({ length: LEAF_COUNT }, () => ({
        x: (Math.random() - 0.5) * 11, y: Math.random() * 9 - 3, z: (Math.random() - 0.5) * 8,
        fall: 0.35 + Math.random() * 0.35, sway: 0.4 + Math.random() * 0.6, phase: Math.random() * 10,
        spin: (Math.random() - 0.5) * 3, tilt: Math.random() * Math.PI, scale: 0.8 + Math.random() * 0.7,
    }));
    return { items, colors, dummy: new Object3D() };
}
function stepLeaves(mesh, state, delta, t) {
    state.items.forEach((it, i) => {
        it.y -= it.fall * delta;
        if (it.y < -4.5) { it.y = 5.5; it.x = (Math.random() - 0.5) * 11; it.z = (Math.random() - 0.5) * 8; }
        const d = state.dummy;
        d.position.set(it.x + Math.sin(t * it.sway + it.phase) * 0.6, it.y, it.z + Math.cos(t * it.sway * 0.7 + it.phase) * 0.3);
        d.rotation.set(it.tilt + t * it.spin * 0.6, t * it.spin, Math.sin(t * 2 + it.phase) * 0.8);
        d.scale.setScalar(it.scale);
        d.updateMatrix();
        mesh.setMatrixAt(i, d.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
}
function paintLeaves(mesh, state) {
    const c = new Color();
    state.items.forEach((_, i) => mesh.setColorAt(i, c.set(state.colors[i % state.colors.length])));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}
export function FallingLeaves({ season, still }) {
    const ref = useRef();
    const geometry = useMemo(() => leafGeometry(), []);
    const [state] = useState(() => createLeaves(season));
    useEffect(() => { if (ref.current) { paintLeaves(ref.current, state); stepLeaves(ref.current, state, 0, 0); } }, [state]);
    useEffect(() => () => geometry.dispose(), [geometry]);
    useFrame((s, delta) => { if (ref.current && !still) stepLeaves(ref.current, state, Math.min(delta, 0.05), s.clock.elapsedTime); });
    return <instancedMesh ref={ref} args={[geometry, undefined, LEAF_COUNT]}>
        <meshLambertMaterial side={DoubleSide} />
    </instancedMesh>;
}

// ---------- Neige ----------
const SNOW_COUNT = 220;
function createSnow() {
    const positions = new Float32Array(SNOW_COUNT * 3);
    const seeds = new Float32Array(SNOW_COUNT);
    for (let i = 0; i < SNOW_COUNT; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 14;
        positions[i * 3 + 1] = Math.random() * 11 - 4.5;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        seeds[i] = Math.random() * 10;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    return { geometry, seeds, texture: softDot('rgba(255,255,255,1)', 'rgba(240,246,255,0.55)') };
}
function stepSnow({ geometry, seeds }, delta, t) {
    const p = geometry.attributes.position.array;
    for (let i = 0; i < SNOW_COUNT; i++) {
        p[i * 3 + 1] -= delta * (0.35 + (seeds[i] % 1) * 0.45);
        p[i * 3] += Math.sin(t * 0.9 + seeds[i]) * delta * 0.18;
        if (p[i * 3 + 1] < -4.5) { p[i * 3 + 1] = 6.5; p[i * 3] = (Math.random() - 0.5) * 14; }
    }
    geometry.attributes.position.needsUpdate = true;
}
export function Snowfall({ still }) {
    const [snow] = useState(createSnow);
    useFrame((s, delta) => { if (!still) stepSnow(snow, Math.min(delta, 0.05), s.clock.elapsedTime); });
    return <points geometry={snow.geometry}>
        <pointsMaterial map={snow.texture} size={7} sizeAttenuation={false} transparent depthWrite={false} opacity={0.9} />
    </points>;
}

// ---------- Étoiles filantes : une traînée lumineuse de temps en temps ----------
function trailTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 16;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 256, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.85, 'rgba(255,240,215,0.75)'); g.addColorStop(1, 'rgba(255,255,255,1)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(250, 4); ctx.lineTo(256, 8); ctx.lineTo(250, 12); ctx.closePath(); ctx.fill();
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
}
const TRAIL = new PlaneGeometry(2.6, 0.08);
function launch(star, t) {
    star.start = t + 4 + Math.random() * 9;
    star.x = -6 + Math.random() * 10;
    star.y = 7 + Math.random() * 5;
    star.angle = -0.35 - Math.random() * 0.3;
}
export function ShootingStars({ still }) {
    const ref = useRef();
    const mat = useRef();
    const texture = useMemo(() => trailTexture(), []);
    const [star] = useState(() => ({ start: 3, x: -4, y: 9, angle: -0.45 }));
    useFrame(s => {
        const m = ref.current;
        if (!m || still) { if (m) m.visible = false; return; }
        const t = s.clock.elapsedTime;
        const k = (t - star.start) / 0.9;
        if (k > 1) { launch(star, t); m.visible = false; return; }
        m.visible = k >= 0;
        if (k < 0) return;
        const dist = k * 9;
        m.position.set(star.x + Math.cos(star.angle) * dist, star.y + Math.sin(star.angle) * dist, -16);
        m.rotation.z = star.angle;
        mat.current.opacity = Math.sin(k * Math.PI);
    });
    return <mesh ref={ref} geometry={TRAIL} visible={false} renderOrder={-1}>
        <meshBasicMaterial ref={mat} map={texture} transparent depthWrite={false} blending={AdditiveBlending} />
    </mesh>;
}
