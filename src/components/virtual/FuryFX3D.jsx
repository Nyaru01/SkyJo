// Effets three.js des cartes Fury : une scène par carte (Séisme, Malédiction, Brouillard, Tornade, Gel, Bouclier).
// Chargé à la demande (lazy) pour ne pas alourdir le reste du jeu.
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const PALETTES = {
    quake: [0xff8a3d, 0xffc06a, 0xd9461c],
    curse: [0xff2e55, 0x9b1d5c, 0x5b0f3a],
    fog: [0xb7b1cf, 0x8c86a8, 0x6d6788],
    tornado: [0x6fcfbf, 0xc8fff4, 0x2e9c8c],
    freeze: [0x9fdcff, 0xffffff, 0x4fa3e0],
    shield: [0x9fefc6, 0x5fd39a, 0xffffff],
};

function dotTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,.55)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

// Nuage de particules générique : couleurs atténuées vers le noir pour « fondre » en mélange additif.
function makePoints(count, size, texture) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    const mat = new THREE.PointsMaterial({ size, map: texture, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    return { pts, pos: geo.attributes.position, col: geo.attributes.color, base: new Float32Array(count * 3), count };
}
const setBase = (p, i, hex) => { const c = new THREE.Color(hex); p.base[i * 3] = c.r; p.base[i * 3 + 1] = c.g; p.base[i * 3 + 2] = c.b; };
const shade = (p, i, k) => { p.col.array[i * 3] = p.base[i * 3] * k; p.col.array[i * 3 + 1] = p.base[i * 3 + 1] * k; p.col.array[i * 3 + 2] = p.base[i * 3 + 2] * k; };
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// Chaque scène renvoie update(t, dt, fade) ; `burst` rejoue l'explosion à intervalle régulier quand l'effet boucle.
const SCENES = {
    quake(scene, tex, pal, ctx) {
        const debris = makePoints(260, 0.22, tex);
        const vel = new Float32Array(debris.count * 3);
        const life = new Float32Array(debris.count);
        const burst = () => {
            for (let i = 0; i < debris.count; i++) {
                const a = Math.random() * Math.PI * 2, s = rnd(2.5, 8);
                debris.pos.array.set([rnd(-0.3, 0.3), rnd(-0.6, -0.2), 0], i * 3);
                vel.set([Math.cos(a) * s, Math.abs(Math.sin(a)) * s * 0.9 + 1.5, rnd(-1, 1)], i * 3);
                life[i] = rnd(0.9, 1.7);
                setBase(debris, i, pick(pal));
            }
            ctx.shake = 0.35;
        };
        const rings = [0, 1, 2].map(k => {
            const m = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 64), new THREE.MeshBasicMaterial({ color: pal[k % pal.length], transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
            m.userData.delay = k * 0.18;
            scene.add(m);
            return m;
        });
        scene.add(debris.pts);
        burst();
        let since = 0;
        return (t, dt, fade) => {
            since += dt;
            if (ctx.loop && since > 2.8) { since = 0; burst(); }
            for (let i = 0; i < debris.count; i++) {
                life[i] -= dt;
                vel[i * 3 + 1] -= 9 * dt;
                debris.pos.array[i * 3] += vel[i * 3] * dt;
                debris.pos.array[i * 3 + 1] += vel[i * 3 + 1] * dt;
                debris.pos.array[i * 3 + 2] += vel[i * 3 + 2] * dt;
                shade(debris, i, Math.max(0, Math.min(1, life[i])) * fade);
            }
            debris.pos.needsUpdate = debris.col.needsUpdate = true;
            rings.forEach(r => {
                const k = Math.max(0, since - r.userData.delay) / 1.1;
                r.scale.setScalar(0.2 + k * 6);
                r.material.opacity = Math.max(0, 1 - k) * 0.9 * fade;
            });
        };
    },
    curse(scene, tex, pal) {
        const p = makePoints(420, 0.2, tex);
        const ang = new Float32Array(p.count), rad = new Float32Array(p.count), spd = new Float32Array(p.count), z = new Float32Array(p.count);
        const spawn = i => { ang[i] = Math.random() * Math.PI * 2; rad[i] = rnd(3.2, 5.2); spd[i] = rnd(1.2, 2.6); z[i] = rnd(-1, 1); setBase(p, i, pick(pal)); };
        for (let i = 0; i < p.count; i++) { spawn(i); rad[i] = rnd(0.3, 5.2); }
        const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: pal[0], transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
        scene.add(p.pts, core);
        return (t, dt, fade) => {
            for (let i = 0; i < p.count; i++) {
                rad[i] -= spd[i] * dt;
                ang[i] += (2.6 / Math.max(rad[i], 0.4)) * dt;
                if (rad[i] < 0.25) spawn(i);
                p.pos.array.set([Math.cos(ang[i]) * rad[i], Math.sin(ang[i]) * rad[i] * 0.8, z[i]], i * 3);
                shade(p, i, Math.min(1, rad[i] / 1.2) * Math.min(1, (5.2 - rad[i]) * 1.5) * fade);
            }
            p.pos.needsUpdate = p.col.needsUpdate = true;
            const pulse = 1.6 + Math.sin(t * 6) * 0.35;
            core.scale.setScalar(pulse * 1.6);
            core.material.opacity = 0.85 * fade;
        };
    },
    fog(scene, tex, pal) {
        const p = makePoints(90, 3.4, tex);
        const vx = new Float32Array(p.count), ph = new Float32Array(p.count);
        for (let i = 0; i < p.count; i++) {
            p.pos.array.set([rnd(-6, 6), rnd(-4, 4), rnd(-2, 1)], i * 3);
            vx[i] = rnd(0.2, 0.7) * (Math.random() < 0.5 ? -1 : 1);
            ph[i] = Math.random() * 6;
            setBase(p, i, pick(pal));
        }
        scene.add(p.pts);
        return (t, dt, fade) => {
            for (let i = 0; i < p.count; i++) {
                let x = p.pos.array[i * 3] + vx[i] * dt;
                if (x > 7) x = -7; else if (x < -7) x = 7;
                p.pos.array[i * 3] = x;
                p.pos.array[i * 3 + 1] += Math.sin(t * 0.8 + ph[i]) * 0.15 * dt;
                shade(p, i, (0.18 + 0.1 * Math.sin(t + ph[i])) * Math.min(1, t * 1.5) * fade);
            }
            p.pos.needsUpdate = p.col.needsUpdate = true;
        };
    },
    tornado(scene, tex, pal) {
        const p = makePoints(520, 0.18, tex);
        const h = new Float32Array(p.count), a = new Float32Array(p.count), w = new Float32Array(p.count);
        for (let i = 0; i < p.count; i++) { h[i] = rnd(-3.5, 3.5); a[i] = Math.random() * Math.PI * 2; w[i] = rnd(3, 6); setBase(p, i, pick(pal)); }
        scene.add(p.pts);
        return (t, dt, fade) => {
            for (let i = 0; i < p.count; i++) {
                h[i] += 1.6 * dt;
                if (h[i] > 3.5) h[i] = -3.5;
                a[i] += w[i] * dt;
                const r = 0.3 + (h[i] + 3.5) * 0.42 + Math.sin(t * 3 + h[i]) * 0.12;
                p.pos.array.set([Math.cos(a[i]) * r + Math.sin(t * 2 + h[i] * 0.6) * 0.3, h[i], Math.sin(a[i]) * r], i * 3);
                shade(p, i, (0.45 + 0.55 * (Math.sin(a[i]) * 0.5 + 0.5)) * fade);
            }
            p.pos.needsUpdate = p.col.needsUpdate = true;
        };
    },
    freeze(scene, tex, pal, ctx) {
        const shardGeo = new THREE.OctahedronGeometry(0.22, 0);
        const shards = Array.from({ length: 36 }, () => {
            const m = new THREE.Mesh(shardGeo, new THREE.MeshBasicMaterial({ color: pick(pal), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, wireframe: Math.random() < 0.4 }));
            m.scale.set(1, rnd(1.6, 3.2), 1);
            scene.add(m);
            return m;
        });
        const burst = () => shards.forEach(m => {
            const a = Math.random() * Math.PI * 2, s = rnd(3, 7);
            m.position.set(0, 0, 0);
            m.userData = { v: new THREE.Vector3(Math.cos(a) * s, Math.sin(a) * s, rnd(-2, 2)), r: new THREE.Vector3(rnd(-6, 6), rnd(-6, 6), rnd(-6, 6)), life: 1.4 };
        });
        burst();
        const snow = makePoints(260, 0.12, tex);
        for (let i = 0; i < snow.count; i++) { snow.pos.array.set([rnd(-6, 6), rnd(-5, 5), rnd(-2, 2)], i * 3); setBase(snow, i, pick(pal)); }
        const flash = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ color: 0xdff4ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
        scene.add(snow.pts, flash);
        let since = 0;
        return (t, dt, fade) => {
            since += dt;
            if (ctx.loop && since > 3) { since = 0; burst(); }
            shards.forEach(m => {
                const u = m.userData;
                u.life -= dt;
                u.v.multiplyScalar(1 - 2.2 * dt);
                m.position.addScaledVector(u.v, dt);
                m.rotation.x += u.r.x * dt; m.rotation.y += u.r.y * dt; m.rotation.z += u.r.z * dt;
                m.material.opacity = Math.max(0, Math.min(1, u.life + 0.6)) * fade;
            });
            for (let i = 0; i < snow.count; i++) {
                let y = snow.pos.array[i * 3 + 1] - (0.5 + (i % 5) * 0.12) * dt;
                if (y < -5) y = 5;
                snow.pos.array[i * 3 + 1] = y;
                snow.pos.array[i * 3] += Math.sin(t + i) * 0.2 * dt;
                shade(snow, i, 0.7 * fade);
            }
            snow.pos.needsUpdate = snow.col.needsUpdate = true;
            const k = Math.min(1, since / 0.5);
            flash.scale.setScalar(0.3 + k * 4);
            flash.material.opacity = (1 - k) * 0.7 * fade;
        };
    },
    shield(scene, tex, pal) {
        const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 1), new THREE.MeshBasicMaterial({ color: pal[0], wireframe: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
        const glow = new THREE.Mesh(new THREE.IcosahedronGeometry(2.35, 3), new THREE.MeshBasicMaterial({ color: pal[1], transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false }));
        const sparks = makePoints(160, 0.16, tex);
        const a = new Float32Array(sparks.count), e = new Float32Array(sparks.count), w = new Float32Array(sparks.count);
        for (let i = 0; i < sparks.count; i++) { a[i] = Math.random() * Math.PI * 2; e[i] = rnd(-1.2, 1.2); w[i] = rnd(0.6, 1.6); setBase(sparks, i, pick(pal)); }
        scene.add(dome, glow, sparks.pts);
        return (t, dt, fade) => {
            const grow = Math.min(1, t / 0.6);
            const s = grow < 1 ? 1 - Math.pow(1 - grow, 3) * Math.cos(grow * 9) : 1 + Math.sin(t * 3) * 0.03;
            dome.scale.setScalar(s); glow.scale.setScalar(s);
            dome.rotation.y += dt * 0.6; dome.rotation.x = Math.sin(t * 0.7) * 0.3;
            dome.material.opacity = (0.55 + Math.sin(t * 4) * 0.15) * fade;
            glow.material.opacity = 0.1 * fade;
            for (let i = 0; i < sparks.count; i++) {
                a[i] += w[i] * dt;
                const r = 2.5 * s;
                sparks.pos.array.set([Math.cos(a[i]) * Math.cos(e[i]) * r, Math.sin(e[i]) * r, Math.sin(a[i]) * Math.cos(e[i]) * r], i * 3);
                shade(sparks, i, (0.5 + 0.5 * Math.sin(t * 5 + i)) * fade);
            }
            sparks.pos.needsUpdate = sparks.col.needsUpdate = true;
        };
    },
};

/**
 * Effet three.js d'une carte Fury, plein cadre dans son parent.
 * - loop : l'effet tourne en continu (écran d'annonce) ; sinon il s'éteint après `duration` secondes.
 */
export default function FuryFX3D({ type, loop = false, duration = 2.4, className = '' }) {
    const host = useRef(null);
    useEffect(() => {
        const el = host.current;
        if (!el || !SCENES[type]) return undefined;
        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
        } catch { return undefined; } // WebGL indisponible : pas d'effet, le reste fonctionne
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setClearColor(0x000000, 0);
        el.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
        camera.position.set(0, 0, 10);
        const tex = dotTexture();
        const ctx = { loop, shake: 0 };
        const update = SCENES[type](scene, tex, PALETTES[type], ctx);
        const resize = () => {
            const w = el.clientWidth || 1, h = el.clientHeight || 1;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(el);
        let raf = 0, last = performance.now(), t = 0;
        const frame = now => {
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now; t += dt;
            const fade = loop ? Math.min(1, t * 3) : Math.max(0, Math.min(1, t * 4, (duration - t) / 0.6));
            if (ctx.shake > 0) { ctx.shake = Math.max(0, ctx.shake - dt); camera.position.x = (Math.random() - 0.5) * ctx.shake; camera.position.y = (Math.random() - 0.5) * ctx.shake; }
            else camera.position.set(0, 0, 10);
            update(t, dt, fade);
            renderer.render(scene, camera);
            if (loop || t < duration) raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            scene.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
            tex.dispose();
            renderer.dispose();
            renderer.forceContextLoss();
            renderer.domElement.remove();
        };
    }, [type, loop, duration]);
    return <div ref={host} className={`fury-fx3d ${className}`} aria-hidden="true" />;
}
