// Génère la famille de dos de cartes SKYJO en SVG (public/card-backs/*.svg).
// Tous partagent la même structure — cadre métallique, double liseré, ornements
// d'angle et losange central (le motif de l'accueil) — et varient par matière.
// Usage : node scripts/generate-card-backs.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'card-backs');
const W = 500, H = 700;

// Aléatoire déterministe : les étoiles et facettes sont identiques à chaque génération.
function rng(seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const f = n => Math.round(n * 10) / 10;

function diamond(cx, cy, r, attrs) {
    return `<path d="M${cx} ${cy - r} L${cx + r} ${cy} L${cx} ${cy + r} L${cx - r} ${cy} Z" ${attrs}/>`;
}

// Emblème central commun : losange double, point central et petites perles.
function emblem({ stroke, fill = 'none', dot = stroke, glow }) {
    const cx = W / 2, cy = H / 2;
    const filter = glow ? ' filter="url(#glow)"' : '';
    return `<g${filter}>
        ${diamond(cx, cy, 92, `fill="${fill}" stroke="${stroke}" stroke-width="7" stroke-linejoin="round"`)}
        ${diamond(cx, cy, 124, `fill="none" stroke="${stroke}" stroke-opacity=".55" stroke-width="2.5"`)}
        ${diamond(cx, cy, 36, `fill="${dot}"`)}
        <circle cx="${cx}" cy="${cy - 160}" r="7" fill="${dot}"/>
        <circle cx="${cx}" cy="${cy + 160}" r="7" fill="${dot}"/>
        <circle cx="${cx - 160}" cy="${cy}" r="5" fill="${dot}" fill-opacity=".7"/>
        <circle cx="${cx + 160}" cy="${cy}" r="5" fill="${dot}" fill-opacity=".7"/>
    </g>`;
}

function cornerOrnaments(color) {
    const pts = [[64, 64], [W - 64, 64], [64, H - 64], [W - 64, H - 64]];
    return pts.map(([x, y]) => diamond(x, y, 11, `fill="${color}"`)).join('');
}

// Assemble un dos : fond, motif, cadre, emblème.
function card({ metal, metalStops, bg, pattern = '', emblemOpts, frame, extraDefs = '' }) {
    const stops = (metalStops || [metal, metal]).map((c, i, a) => `<stop offset="${i / (a.length - 1)}" stop-color="${c}"/>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <defs>
        <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient>
        <clipPath id="inner"><rect x="14" y="14" width="${W - 28}" height="${H - 28}" rx="30"/></clipPath>
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <radialGradient id="sheen" cx=".3" cy=".18" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></radialGradient>
        ${extraDefs}
    </defs>
    <rect width="${W}" height="${H}" rx="42" fill="url(#metal)"/>
    <g clip-path="url(#inner)">
        <rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="${bg}"/>
        ${pattern}
        <rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="url(#sheen)"/>
    </g>
    <rect x="36" y="36" width="${W - 72}" height="${H - 72}" rx="22" fill="none" stroke="${frame || 'url(#metal)'}" stroke-width="3.5"/>
    <rect x="48" y="48" width="${W - 96}" height="${H - 96}" rx="16" fill="none" stroke="${frame || 'url(#metal)'}" stroke-opacity=".45" stroke-width="1.5"/>
    ${cornerOrnaments(frame || 'url(#metal)')}
    ${emblem(emblemOpts)}
</svg>`;
}

// Palette du thème : tons moyens (jamais de noir), liserés crème et or clair,
// pour que les dos ressortent sur les bacs blancs sans se confondre avec les faces.
const GOLD = ['#fff1c9', '#f0cf86', '#fbe4ab', '#d9aa55'];
const CREAM = '#fff8ec';
const grad = (id, a, b, angle = 'x1="0" y1="0" x2="1" y2="1"') => `<linearGradient id="${id}" ${angle}><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;

const backs = {
    // Le dos par défaut : lilas profond, losange crème et or.
    // Le dos par défaut, style « belvédère » : dégradé corail → lavande, géométrie au trait blanc.
    classic: () => card({
        metalStops: ['#fffaf2', '#f6e7d7'],
        bg: 'url(#cl)',
        extraDefs: grad('cl', '#ee9f93', '#9d88d2', 'x1="0" y1="0" x2="0" y2="1"'),
        pattern: `<g fill="none" stroke="#fffaf2" stroke-opacity=".35" stroke-width="2">
            <path d="M250 60 L440 350 L250 640 L60 350 Z"/>
            <path d="M250 60 L250 640 M60 350 L440 350"/>
        </g>`,
        frame: '#fffaf2',
        emblemOpts: { stroke: '#fffaf2', fill: '#ffffff26', dot: '#fffaf2' },
    }),
    // Parchemin crème, fibres et encre sépia.
    papyrus: () => {
        const r = rng(3);
        const fibers = Array.from({ length: 70 }, () => {
            const y = f(r() * H); const x = f(r() * W * .6);
            return `<line x1="${x}" y1="${y}" x2="${f(x + 80 + r() * 200)}" y2="${f(y + (r() - .5) * 6)}" stroke="#8a6630" stroke-opacity="${f(.05 + r() * .08)}" stroke-width="${f(1 + r() * 2)}"/>`;
        }).join('');
        return card({
            metalStops: ['#d9aa66', '#a87a3c', '#d4a160'],
            bg: 'url(#pap)',
            extraDefs: '<radialGradient id="pap" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="#fbf1db"/><stop offset=".7" stop-color="#ecd9b2"/><stop offset="1" stop-color="#dcc296"/></radialGradient>',
            pattern: fibers,
            frame: '#a87a3c',
            emblemOpts: { stroke: '#8a5f26', dot: '#8a5f26' },
        });
    },
    // Crépuscule indigo-sarcelle, tracés lumineux corail et menthe.
    neon: () => card({
        metalStops: ['#ff9d8e', '#c9a2ff', '#8cefd6'],
        bg: 'url(#ne)',
        extraDefs: grad('ne', '#5a4fb0', '#2f7f96'),
        pattern: `<g filter="url(#glow)" fill="none" stroke-width="3.5">
            ${[0, 1, 2, 3].map(i => `<path d="M-20 ${120 + i * 150} Q 250 ${60 + i * 150} 520 ${150 + i * 150}" stroke="${i % 2 ? '#8cefd6' : '#ffb0a3'}" stroke-opacity=".55"/>`).join('')}
        </g>`,
        frame: '#8cefd6',
        emblemOpts: { stroke: '#ffb0a3', dot: '#8cefd6', glow: true },
    }),
    // Magenta-prune, circuits lavande et nœuds roses.
    cyberpunk: () => {
        const r = rng(11);
        let paths = '';
        for (let i = 0; i < 16; i++) {
            const x = f(30 + r() * 440), y = f(30 + r() * 640), dx = f((r() > .5 ? 1 : -1) * (40 + r() * 90)), dy = f(30 + r() * 70);
            paths += `<path d="M${x} ${y} h${dx} l${f(dy * .6)} ${dy}" fill="none" stroke="#e3d6ff" stroke-opacity=".45" stroke-width="2.5"/><circle cx="${f(x + dx + dy * .6)}" cy="${f(y + dy)}" r="5" fill="#ffc2dc" fill-opacity=".85"/>`;
        }
        return card({
            metalStops: ['#ffb3d4', '#b9a5ff', '#9fe6ff'],
            bg: 'url(#cy)',
            extraDefs: grad('cy', '#a2559e', '#5a43a3', 'x1="0" y1="0" x2="0" y2="1"'),
            pattern: paths,
            frame: '#e3d6ff',
            emblemOpts: { stroke: '#ffc2dc', dot: '#9fe6ff', glow: true },
        });
    },
    // Tissage ardoise bleutée, cadre argent.
    carbon: () => card({
        metalStops: ['#ffffff', '#b9bfcc', '#eef0f5', '#9aa0ad'],
        bg: 'url(#weave)',
        extraDefs: `<pattern id="weave" width="18" height="18" patternUnits="userSpaceOnUse">
            <rect width="18" height="18" fill="#5d6678"/>
            <rect width="9" height="9" fill="#6c768a"/><rect x="9" y="9" width="9" height="9" fill="#6c768a"/>
            <rect width="9" height="4" fill="#7a8599"/><rect x="9" y="9" width="4" height="9" fill="#7a8599"/>
        </pattern>`,
        frame: '#eef0f5',
        emblemOpts: { stroke: '#ffffff', dot: '#ffffff' },
    }),
    // Améthyste fumée à facettes, or clair.
    obsidian: () => {
        const r = rng(21);
        let facets = '';
        for (let i = 0; i < 26; i++) {
            const x = r() * W, y = r() * H, s = 60 + r() * 120;
            facets += `<polygon points="${f(x)},${f(y)} ${f(x + s)},${f(y + s * .3)} ${f(x + s * .4)},${f(y + s)}" fill="${['#7a64a8', '#5f4c8c', '#8c76b8', '#54447d'][i % 4]}" fill-opacity=".85"/>`;
        }
        return card({
            metalStops: GOLD,
            bg: '#665496',
            pattern: facets + '<path d="M60 -10 L520 420" stroke="#ffffff" stroke-opacity=".18" stroke-width="22"/>',
            emblemOpts: { stroke: 'url(#metal)', dot: '#fbe4ab' },
        });
    },
    // Or plein, rayons fins, emblème lilas.
    gold: () => card({
        metalStops: ['#6a55b4', '#8f7bc9'],
        bg: 'url(#au)',
        extraDefs: '<linearGradient id="au" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe3a0"/><stop offset=".45" stop-color="#e2b75e"/><stop offset=".7" stop-color="#f6d58a"/><stop offset="1" stop-color="#c9973f"/></linearGradient>',
        pattern: Array.from({ length: 36 }, (_, i) => {
            const a = (i / 36) * Math.PI * 2;
            return `<line x1="${W / 2}" y1="${H / 2}" x2="${f(W / 2 + Math.cos(a) * 600)}" y2="${f(H / 2 + Math.sin(a) * 600)}" stroke="#fff6d6" stroke-opacity=".25" stroke-width="3"/>`;
        }).join(''),
        frame: '#6a55b4',
        emblemOpts: { stroke: '#6a55b4', dot: '#6a55b4' },
    }),
    // Ciel de crépuscule étoilé, nébuleuses rose et bleu.
    galaxy: () => {
        const r = rng(7);
        const stars = Array.from({ length: 110 }, () => `<circle cx="${f(r() * W)}" cy="${f(r() * H)}" r="${f(.6 + r() * 2.2)}" fill="#fff" fill-opacity="${f(.4 + r() * .6)}"/>`).join('');
        return card({
            metalStops: GOLD,
            bg: 'url(#gx)',
            extraDefs: '<radialGradient id="gx" cx=".5" cy=".4" r=".85"><stop offset="0" stop-color="#7b6fd0"/><stop offset=".6" stop-color="#5367b8"/><stop offset="1" stop-color="#3f4f9a"/></radialGradient><radialGradient id="neb1" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb3d1" stop-opacity=".6"/><stop offset="1" stop-color="#ffb3d1" stop-opacity="0"/></radialGradient><radialGradient id="neb2" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#a9e6ff" stop-opacity=".55"/><stop offset="1" stop-color="#a9e6ff" stop-opacity="0"/></radialGradient>',
            pattern: `<ellipse cx="150" cy="220" rx="220" ry="140" fill="url(#neb1)"/><ellipse cx="360" cy="500" rx="220" ry="160" fill="url(#neb2)"/>${stars}`,
            emblemOpts: { stroke: 'url(#metal)', dot: '#fbe4ab', glow: true },
        });
    },
    // Sarcelle profonde, cercles concentriques et étoile dorée.
    'astral-sigil': () => card({
        metalStops: GOLD,
        bg: 'url(#as)',
        extraDefs: grad('as', '#3f8a96', '#4a5fa8'),
        pattern: `<g fill="none" stroke="#fbe4ab" stroke-opacity=".45">
            ${[120, 170, 215, 260].map((rad, i) => `<circle cx="${W / 2}" cy="${H / 2}" r="${rad}" stroke-width="${i % 2 ? 1.5 : 3}" ${i === 2 ? 'stroke-dasharray="4 10"' : ''}/>`).join('')}
            <path d="${Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8 - Math.PI / 2; const rr = i % 2 ? 110 : 250; return `${i ? 'L' : 'M'}${f(W / 2 + Math.cos(a) * rr)} ${f(H / 2 + Math.sin(a) * rr)}`; }).join(' ')} Z" stroke-width="2"/>
        </g>`,
        emblemOpts: { stroke: 'url(#metal)', dot: '#fff1c9', glow: true },
    }),
    // Nébuleuse pastel lumineuse, cœur doré.
    'nebula-core': () => card({
        metalStops: GOLD,
        bg: 'url(#nc)',
        extraDefs: '<radialGradient id="nc" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="#fff6e0"/><stop offset=".25" stop-color="#ffc9d9"/><stop offset=".55" stop-color="#c9b6f5"/><stop offset=".85" stop-color="#8fc7e6"/><stop offset="1" stop-color="#6a8fd1"/></radialGradient>',
        pattern: Array.from({ length: 5 }, (_, i) => `<ellipse cx="${W / 2}" cy="${H / 2}" rx="${70 + i * 55}" ry="${40 + i * 30}" transform="rotate(${-25 + i * 14} ${W / 2} ${H / 2})" fill="none" stroke="#fff" stroke-opacity="${f(.45 - i * .07)}" stroke-width="2"/>`).join(''),
        frame: '#b8862f',
        emblemOpts: { stroke: '#a8731f', dot: '#fff6e0' },
    }),
    // Jade, écailles dorées et courbe de serpent céleste.
    'cosmic-dragon': () => card({
        metalStops: GOLD,
        bg: 'url(#scales)',
        extraDefs: `<pattern id="scales" width="40" height="24" patternUnits="userSpaceOnUse">
            <rect width="40" height="24" fill="#3d8a78"/>
            <path d="M0 24 A20 20 0 0 1 40 24" fill="none" stroke="#fbe4ab" stroke-opacity=".3" stroke-width="2"/>
            <path d="M-20 12 A20 20 0 0 1 20 12 M20 12 A20 20 0 0 1 60 12" fill="none" stroke="#fbe4ab" stroke-opacity=".18" stroke-width="2"/>
        </pattern>`,
        pattern: '<path d="M60 640 C 60 460, 440 520, 440 340 S 60 220, 120 60" fill="none" stroke="url(#metal)" stroke-width="16" stroke-linecap="round" stroke-opacity=".85" filter="url(#glow)"/>',
        emblemOpts: { stroke: 'url(#metal)', fill: '#3d8a78', dot: '#fff1c9' },
    }),
    // Nacre irisée : triangles pastel translucides.
    'eternal-prism': () => {
        const cols = ['#a8e6d4', '#c9b6f5', '#ffd1bd', '#9fd3f0', '#f7c6dc'];
        const r = rng(31);
        let tris = '';
        for (let y = -40; y < H + 40; y += 80) {
            for (let x = -40; x < W + 40; x += 92) {
                const off = (Math.round(y / 80) % 2) * 46;
                tris += `<polygon points="${x + off},${y} ${x + off + 92},${y} ${x + off + 46},${y + 80}" fill="${cols[Math.floor(r() * cols.length)]}" fill-opacity="${f(.35 + r() * .4)}"/>`;
            }
        }
        return card({
            metalStops: ['#a8e6d4', '#c9b6f5', '#ffd1bd', '#9fd3f0'],
            bg: '#f3eefa',
            pattern: tris,
            frame: '#8f7bc9',
            emblemOpts: { stroke: '#6f5aa8', fill: '#ffffffaa', dot: '#6f5aa8' },
        });
    },
    // Indigo-violet, portail annulaire or, rayons.
    'transcendent-void': () => card({
        metalStops: ['#fbe4ab', '#b49bff', '#fbe4ab'],
        bg: 'url(#vd)',
        extraDefs: '<radialGradient id="vd" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#b9a5ff"/><stop offset=".4" stop-color="#6a4fc0"/><stop offset="1" stop-color="#3f3290"/></radialGradient><linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1c9"/><stop offset="1" stop-color="#d6c6ff"/></linearGradient>',
        pattern: Array.from({ length: 48 }, (_, i) => {
            const a = (i / 48) * Math.PI * 2;
            return `<line x1="${f(W / 2 + Math.cos(a) * 190)}" y1="${f(H / 2 + Math.sin(a) * 190)}" x2="${f(W / 2 + Math.cos(a) * 520)}" y2="${f(H / 2 + Math.sin(a) * 520)}" stroke="#ffffff" stroke-opacity="${i % 2 ? .1 : .2}" stroke-width="2"/>`;
        }).join('') + `<circle cx="${W / 2}" cy="${H / 2}" r="182" fill="none" stroke="url(#ring)" stroke-width="6" filter="url(#glow)"/>`,
        emblemOpts: { stroke: 'url(#metal)', dot: '#fff1c9', glow: true },
    }),
};

mkdirSync(OUT, { recursive: true });
for (const [id, build] of Object.entries(backs)) {
    writeFileSync(join(OUT, `${id}.svg`), build().replace(/\n\s+/g, '\n'));
}
console.log(`${Object.keys(backs).length} dos générés dans ${OUT}`);
