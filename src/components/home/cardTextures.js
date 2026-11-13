import { CanvasTexture, SRGBColorSpace } from 'three';

// Textures de cartes dessinées sur canvas : aucun fichier image à charger.
const TONES = {
    indigo: ['#7a77f5', '#4338ca'],
    sky: ['#62cdf4', '#1e8fd0'],
    mint: ['#52da9a', '#13a066'],
    sun: ['#ffd655', '#f0a000'],
    rose: ['#ff8174', '#e0344a'],
};
export const toneOf = value => value < 0 ? 'indigo' : value === 0 ? 'sky' : value <= 4 ? 'mint' : value <= 8 ? 'sun' : 'rose';

const W = 256, H = 358, R = 26;
const cache = new Map();

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function makeTexture(draw) {
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    draw(ctx);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
}

export function faceTexture(value) {
    const key = `face:${value}`;
    if (cache.has(key)) return cache.get(key);
    const [a, b] = TONES[toneOf(value)];
    const texture = makeTexture(ctx => {
        ctx.fillStyle = '#fffaf3';
        roundRect(ctx, 0, 0, W, H, R); ctx.fill();
        const gradient = ctx.createLinearGradient(0, 0, W, H);
        gradient.addColorStop(0, a); gradient.addColorStop(1, b);
        ctx.fillStyle = gradient;
        roundRect(ctx, 12, 12, W - 24, H - 24, R - 10); ctx.fill();
        // Reflet doux en haut à gauche
        const sheen = ctx.createLinearGradient(0, 0, W * .7, H * .6);
        sheen.addColorStop(0, '#ffffff55'); sheen.addColorStop(1, '#ffffff00');
        ctx.fillStyle = sheen;
        roundRect(ctx, 12, 12, W - 24, H - 24, R - 10); ctx.fill();
        // Médaillon central
        ctx.fillStyle = '#ffffff2e';
        ctx.beginPath(); ctx.ellipse(W / 2, H / 2, 82, 104, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = '#00000040'; ctx.shadowOffsetY = 4; ctx.shadowBlur = 6;
        ctx.font = `800 ${String(value).length > 1 ? 118 : 138}px 'Bricolage Grotesque', system-ui, sans-serif`;
        ctx.fillText(String(value), W / 2, H / 2 + 6);
        ctx.shadowColor = 'transparent';
        ctx.font = "800 38px 'Bricolage Grotesque', system-ui, sans-serif";
        ctx.fillText(String(value), 44, 48);
        ctx.save(); ctx.translate(W - 44, H - 48); ctx.rotate(Math.PI); ctx.fillText(String(value), 0, 0); ctx.restore();
    });
    cache.set(key, texture);
    return texture;
}

// Dos de carte : on dessine l'image du skin choisi par le joueur (SVG de public/card-backs),
// avec un repli lilas immédiat le temps que l'image charge.
function drawBackFallback(ctx) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff1c9';
    roundRect(ctx, 0, 0, W, H, R); ctx.fill();
    const gradient = ctx.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, '#a592e0'); gradient.addColorStop(1, '#6a55b4');
    ctx.fillStyle = gradient;
    roundRect(ctx, 8, 8, W - 16, H - 16, R - 6); ctx.fill();
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = '#fff8ec'; ctx.lineWidth = 7; ctx.strokeRect(-46, -46, 92, 92);
    ctx.restore();
}

export function backTexture(src = '/card-backs/classic.svg') {
    const key = `back:${src}`;
    if (cache.has(key)) return cache.get(key);
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    drawBackFallback(ctx);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
        ctx.clearRect(0, 0, W, H);
        ctx.save();
        roundRect(ctx, 0, 0, W, H, R); ctx.clip();
        ctx.drawImage(image, 0, 0, W, H);
        ctx.restore();
        texture.needsUpdate = true;
    };
    image.src = src;
    cache.set(key, texture);
    return texture;
}

// Fond du plateau 3D : bac menthe à rebord blanc, comme la main du joueur en partie.
export function feltTexture() {
    if (cache.has('felt')) return cache.get('felt');
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 360;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 360);
    gradient.addColorStop(0, '#d6f2e8'); gradient.addColorStop(1, '#a9dcc9');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 512, 360);
    const light = ctx.createRadialGradient(256, 0, 10, 256, 0, 300);
    light.addColorStop(0, '#ffffff88'); light.addColorStop(1, '#ffffff00');
    ctx.fillStyle = light; ctx.fillRect(0, 0, 512, 360);
    ctx.strokeStyle = '#ffffffcc'; ctx.lineWidth = 6;
    roundRect(ctx, 12, 12, 488, 336, 22); ctx.stroke();
    ctx.strokeStyle = '#7cc3a866'; ctx.lineWidth = 2;
    roundRect(ctx, 18, 18, 476, 324, 18); ctx.stroke();
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    cache.set('felt', texture);
    return texture;
}

// ---------------------------------------------------------------------
// Direction premium « écrin de nuit » : dos nuit à filigrane or, carte héros.
// ---------------------------------------------------------------------
function goldGradient(ctx, x0, y0, x1, y1) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, '#fff1c4'); g.addColorStop(.35, '#e2b65a'); g.addColorStop(.6, '#fbe3a1'); g.addColorStop(1, '#b8862f');
    return g;
}

function drawFiligree(ctx, w, h) {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.strokeStyle = goldGradient(ctx, -w / 2, -h / 2, w / 2, h / 2);
    for (const [r, lw] of [[w * .42, 3], [w * .34, 1.5], [w * .2, 5]]) {
        ctx.lineWidth = lw;
        ctx.save(); ctx.rotate(Math.PI / 4); ctx.strokeRect(-r / 1.414, -r / 1.414, r * 1.414, r * 1.414); ctx.restore();
    }
    ctx.lineWidth = 1.2; ctx.globalAlpha = .55;
    for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * w * .22, Math.sin(a) * w * .22); ctx.lineTo(Math.cos(a) * w * .5, Math.sin(a) * w * .5); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = goldGradient(ctx, -20, -20, 20, 20);
    ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(18, 0); ctx.lineTo(0, 18); ctx.lineTo(-18, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
}

export function premiumBackTexture() {
    if (cache.has('premium-back')) return cache.get('premium-back');
    const texture = makeTexture(ctx => {
        ctx.fillStyle = goldGradient(ctx, 0, 0, W, H);
        roundRect(ctx, 0, 0, W, H, R); ctx.fill();
        const bg = ctx.createRadialGradient(W * .5, H * .4, 10, W * .5, H * .5, H * .7);
        bg.addColorStop(0, '#26305a'); bg.addColorStop(.6, '#121836'); bg.addColorStop(1, '#090c1d');
        ctx.fillStyle = bg;
        roundRect(ctx, 7, 7, W - 14, H - 14, R - 5); ctx.fill();
        ctx.strokeStyle = '#e2b65a99'; ctx.lineWidth = 2;
        roundRect(ctx, 18, 18, W - 36, H - 36, R - 10); ctx.stroke();
        drawFiligree(ctx, W, H);
    });
    cache.set('premium-back', texture);
    return texture;
}

// Carte héros : grande carte nuit, filigrane or et mot SKYJO gravé.
export function heroTexture() {
    if (cache.has('hero')) return cache.get('hero');
    const canvas = document.createElement('canvas');
    const w = 512, h = 716, r = 48;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = goldGradient(ctx, 0, 0, w, h);
    roundRect(ctx, 0, 0, w, h, r); ctx.fill();
    const bg = ctx.createRadialGradient(w * .5, h * .38, 20, w * .5, h * .5, h * .75);
    bg.addColorStop(0, '#2b3566'); bg.addColorStop(.55, '#141a3d'); bg.addColorStop(1, '#080b1c');
    ctx.fillStyle = bg;
    roundRect(ctx, 12, 12, w - 24, h - 24, r - 10); ctx.fill();
    ctx.strokeStyle = '#e2b65aaa'; ctx.lineWidth = 3;
    roundRect(ctx, 34, 34, w - 68, h - 68, r - 20); ctx.stroke();
    ctx.save(); ctx.translate(0, -40); drawFiligree(ctx, w, h); ctx.restore();
    ctx.fillStyle = goldGradient(ctx, 0, h * .78, w, h * .88);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = "800 84px 'Bricolage Grotesque', system-ui, sans-serif";
    if ('letterSpacing' in ctx) ctx.letterSpacing = '14px';
    ctx.fillText('SKYJO', w / 2 + 7, h * .82);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    cache.set('hero', texture);
    return texture;
}

// ---------------------------------------------------------------------
// Direction « belvédère » (aplats pastel, géométrie pure)
// ---------------------------------------------------------------------
const PASTEL = {
    indigo: ['#bdbcd8', '#3d4170'],
    sky: ['#b8cdd8', '#2f5468'],
    mint: ['#bccfc1', '#3f5e4a'],
    sun: ['#e4d3b0', '#6e5527'],
    rose: ['#ddb6ae', '#6e3a3a'],
};

export function pastelFaceTexture(value) {
    const key = `pastel:${value}`;
    if (cache.has(key)) return cache.get(key);
    const [bg, ink] = PASTEL[toneOf(value)];
    const texture = makeTexture(ctx => {
        ctx.fillStyle = '#fbf6ef';
        roundRect(ctx, 0, 0, W, H, R); ctx.fill();
        ctx.fillStyle = bg;
        roundRect(ctx, 14, 14, W - 28, H - 28, R - 12); ctx.fill();
        ctx.fillStyle = ink;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `500 ${String(value).length > 1 ? 120 : 140}px 'Cormorant Garamond', Georgia, serif`;
        ctx.fillText(String(value), W / 2, H / 2 + 4);
        ctx.font = "600 34px 'Cormorant Garamond', Georgia, serif";
        ctx.fillText(String(value), 44, 50);
        ctx.save(); ctx.translate(W - 44, H - 50); ctx.rotate(Math.PI); ctx.fillText(String(value), 0, 0); ctx.restore();
    });
    cache.set(key, texture);
    return texture;
}

// Dos : crème, losanges et triangles au trait, très fins.
export function pastelBackTexture() {
    if (cache.has('pastel-back')) return cache.get('pastel-back');
    const texture = makeTexture(ctx => {
        ctx.fillStyle = '#fbf6ef';
        roundRect(ctx, 0, 0, W, H, R); ctx.fill();
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#f3c9bd'); g.addColorStop(1, '#c9b8e0');
        ctx.fillStyle = g;
        roundRect(ctx, 14, 14, W - 28, H - 28, R - 12); ctx.fill();
        ctx.strokeStyle = '#fffaf2'; ctx.lineWidth = 3;
        ctx.save(); ctx.translate(W / 2, H / 2);
        for (const s of [70, 46]) {
            ctx.beginPath(); ctx.moveTo(0, -s * 1.4); ctx.lineTo(s, 0); ctx.lineTo(0, s * 1.4); ctx.lineTo(-s, 0); ctx.closePath(); ctx.stroke();
        }
        ctx.beginPath(); ctx.moveTo(0, -150); ctx.lineTo(0, 150); ctx.stroke();
        ctx.restore();
        ctx.fillStyle = '#fffaf2';
        ctx.beginPath(); ctx.arc(W / 2, H / 2, 9, 0, Math.PI * 2); ctx.fill();
    });
    cache.set('pastel-back', texture);
    return texture;
}
