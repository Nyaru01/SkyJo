import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color, DoubleSide, Object3D, PlaneGeometry, SRGBColorSpace } from 'three';

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

// ---------- Feuilles / pétales : vraies silhouettes dessinées, nervures, pli central ----------
// Les textures sont en niveaux de gris : la couleur de chaque feuille vient de l'instance.
function drawLeafTexture(kind) {
    const S = 128;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const ctx = c.getContext('2d');
    ctx.translate(S / 2, S / 2);
    ctx.beginPath();
    if (kind === 'maple') {
        // Érable : cinq lobes pointus, dentelés, autour du pétiole
        const pts = 90;
        for (let i = 0; i <= pts; i++) {
            const a = (i / pts) * Math.PI * 2 - Math.PI / 2;
            const lobe = Math.pow(Math.abs(Math.cos(2.5 * (a + Math.PI / 2))), 0.7);
            const tooth = i % 3 === 0 ? 0.06 : 0;
            const base = Math.sin(a) > 0.82 ? 0.45 : 1; // échancrure vers la tige
            const r = S * 0.46 * (0.5 + 0.5 * lobe + tooth) * base;
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
    } else if (kind === 'petal') {
        // Pétale : goutte arrondie, légère encoche au sommet
        ctx.moveTo(0, S * 0.44);
        ctx.bezierCurveTo(S * 0.42, S * 0.1, S * 0.32, -S * 0.42, S * 0.06, -S * 0.4);
        ctx.quadraticCurveTo(0, -S * 0.33, -S * 0.06, -S * 0.4);
        ctx.bezierCurveTo(-S * 0.32, -S * 0.42, -S * 0.42, S * 0.1, 0, S * 0.44);
    } else {
        // Feuille ovale à bord ondulé (chêne doux)
        const pts = 70;
        for (let i = 0; i <= pts; i++) {
            const u = i / pts;
            const a = u * Math.PI * 2;
            const wave = 1 + Math.sin(a * 7) * 0.07;
            ctx.lineTo(Math.sin(a) * S * 0.27 * wave * (1 - 0.25 * Math.cos(a)), -Math.cos(a) * S * 0.44);
        }
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(-S * 0.08, -S * 0.1, 0, 0, 0, S * 0.5);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, kind === 'petal' ? '#e4e4e4' : '#bdbdbd');
    ctx.fillStyle = g;
    ctx.fill();
    // Nervures : une centrale et des secondaires, plus sombres
    if (kind !== 'petal') {
        ctx.save(); ctx.clip();
        ctx.strokeStyle = 'rgba(70,70,70,0.45)'; ctx.lineCap = 'round';
        ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(0, S * 0.46); ctx.lineTo(0, -S * 0.4); ctx.stroke();
        ctx.lineWidth = 1.2;
        const veins = kind === 'maple' ? [[-0.95, 0.05], [0.95, 0.05], [-0.55, -0.32], [0.55, -0.32]] : [[-0.5, -0.25], [0.5, -0.25], [-0.5, -0.02], [0.5, -0.02], [-0.45, 0.2], [0.45, 0.2]];
        veins.forEach(([dx, dy]) => {
            ctx.beginPath(); ctx.moveTo(0, kind === 'maple' ? S * 0.1 : (dy + 0.12) * S);
            ctx.lineTo(dx * S * 0.42, dy * S); ctx.stroke();
        });
        ctx.restore();
    } else {
        ctx.save(); ctx.clip();
        const v = ctx.createLinearGradient(0, S * 0.44, 0, 0);
        v.addColorStop(0, 'rgba(120,120,120,0.35)'); v.addColorStop(1, 'rgba(120,120,120,0)');
        ctx.fillStyle = v; ctx.fillRect(-S / 2, 0, S, S / 2);
        ctx.restore();
    }
    // Tige
    if (kind !== 'petal') {
        ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(0, S * 0.36); ctx.lineTo(0, S * 0.5); ctx.stroke();
    }
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
    return t;
}
// Plan légèrement plié le long de la nervure centrale : la feuille accroche la lumière.
function foldedLeaf() {
    const g = new PlaneGeometry(0.24, 0.24, 2, 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) if (Math.abs(p.getX(i)) > 0.01) p.setZ(i, -0.035);
    g.computeVertexNormals();
    return g;
}
const PALETTES = {
    autumn: ['#c96a35', '#dc9a43', '#a9472b', '#e6b553', '#8c3f27', '#c5813a'],
    spring: ['#f4c4ce', '#f8dde2', '#ebb2c1', '#fdeef0'],
};
const LEAF_COUNT = 20; // par silhouette
const LAND_Y = 0.05;
// Zone du parvis où une feuille peut se poser (hors tour et escalier).
const onPlaza = (x, z) => Math.abs(x) < 2.45 && Math.abs(z) < 1.95 && !(x > 1.05 && x < 2.45 && z < -0.5);

function spawnLeaf(it, top) {
    it.x = (Math.random() - 0.5) * 11; it.z = (Math.random() - 0.5) * 8;
    it.y = top ? 5.5 + Math.random() * 1.5 : Math.random() * 9 - 3;
    it.mode = 'fall'; it.rest = 0; it.shrink = 1;
    it.lands = Math.random() < 0.55;
}
function createLeaves(season) {
    const items = Array.from({ length: LEAF_COUNT }, () => {
        const it = {
            fall: 0.32 + Math.random() * 0.3, sway: 0.7 + Math.random() * 0.7, amp: 0.35 + Math.random() * 0.45,
            phase: Math.random() * 10, spin: (Math.random() - 0.5) * 2.4, yaw: Math.random() * Math.PI * 2,
            scale: 0.75 + Math.random() * 0.6,
        };
        spawnLeaf(it, false);
        return it;
    });
    return { items, colors: PALETTES[season], dummy: new Object3D() };
}
function stepLeaves(mesh, state, delta, t) {
    const d = state.dummy;
    state.items.forEach((it, i) => {
        if (it.mode === 'fall') {
            // Chute en balancier : la feuille glisse d'un côté à l'autre en s'inclinant.
            const swing = Math.sin(t * it.sway + it.phase);
            const px = it.x + swing * it.amp;
            const pz = it.z + Math.cos(t * it.sway * 0.6 + it.phase) * 0.25;
            it.y -= it.fall * delta * (0.75 + 0.5 * Math.abs(swing));
            if (it.lands && it.y <= LAND_Y && onPlaza(px, pz)) {
                it.mode = 'rest'; it.rx = px; it.rz = pz; it.rest = 4 + Math.random() * 6; it.y = LAND_Y;
            } else if (it.y < -4.5) spawnLeaf(it, true);
            d.position.set(px, it.y, pz);
            d.rotation.set(-Math.PI / 2 + swing * 0.9, it.yaw + t * it.spin * 0.4, Math.cos(t * it.sway + it.phase) * 0.6);
            d.scale.setScalar(it.scale);
        } else {
            // Posée sur le parvis, puis s'efface doucement.
            it.rest -= delta;
            if (it.rest < 0) it.shrink -= delta;
            if (it.shrink <= 0) spawnLeaf(it, true);
            d.position.set(it.rx, LAND_Y, it.rz);
            d.rotation.set(-Math.PI / 2 + 0.05, it.yaw, 0, 'YXZ');
            d.scale.setScalar(it.scale * Math.max(0, it.shrink));
        }
        d.updateMatrix();
        d.rotation.order = 'XYZ';
        mesh.setMatrixAt(i, d.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
}
function paintLeaves(mesh, state, offset) {
    const c = new Color();
    state.items.forEach((_, i) => mesh.setColorAt(i, c.set(state.colors[(i + offset) % state.colors.length])));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}
function LeafLayer({ season, kind, offset, still }) {
    const ref = useRef();
    const geometry = useMemo(() => foldedLeaf(), []);
    const texture = useMemo(() => drawLeafTexture(kind), [kind]);
    const [state] = useState(() => createLeaves(season));
    useEffect(() => { if (ref.current) { paintLeaves(ref.current, state, offset); stepLeaves(ref.current, state, 0, 0); } }, [state, offset]);
    useEffect(() => () => { geometry.dispose(); texture.dispose(); }, [geometry, texture]);
    useFrame((s, delta) => { if (ref.current && !still) stepLeaves(ref.current, state, Math.min(delta, 0.05), s.clock.elapsedTime); });
    return <instancedMesh ref={ref} args={[geometry, undefined, LEAF_COUNT]} castShadow>
        <meshLambertMaterial map={texture} alphaTest={0.5} side={DoubleSide} />
    </instancedMesh>;
}
export function FallingLeaves({ season, still }) {
    if (season === 'spring') return <>
        <LeafLayer season={season} kind="petal" offset={0} still={still} />
        <LeafLayer season={season} kind="petal" offset={2} still={still} />
    </>;
    return <>
        <LeafLayer season={season} kind="maple" offset={0} still={still} />
        <LeafLayer season={season} kind="oval" offset={3} still={still} />
    </>;
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
