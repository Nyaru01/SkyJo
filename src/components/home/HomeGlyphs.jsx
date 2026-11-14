// Emblèmes du menu : petites scènes isométriques au crépuscule, dans le langage de l'île
// (dessus clair, face gauche moyenne, face droite soutenue, touches dorées et fenêtres éclairées).

// Prisme isométrique : x, y = point haut du losange supérieur ; w = demi-largeur ; h = hauteur.
function Prism({ x, y, w, h, top, left, right }) {
    const d = w / 2;
    return <g>
        <path d={`M${x} ${y} L${x + w} ${y + d} L${x} ${y + w} L${x - w} ${y + d} Z`} fill={top} />
        <path d={`M${x - w} ${y + d} L${x} ${y + w} L${x} ${y + w + h} L${x - w} ${y + d + h} Z`} fill={left} />
        <path d={`M${x} ${y + w} L${x + w} ${y + d} L${x + w} ${y + d + h} L${x} ${y + w + h} Z`} fill={right} />
    </g>;
}
// Étoile à quatre branches (étincelle).
const spark = (x, y, r) => `M${x} ${y - r} L${x + r * 0.24} ${y - r * 0.24} L${x + r} ${y} L${x + r * 0.24} ${y + r * 0.24} L${x} ${y + r} L${x - r * 0.24} ${y + r * 0.24} L${x - r} ${y} L${x - r * 0.24} ${y - r * 0.24} Z`;

const STONE = { top: '#f1ebe2', left: '#d6cdc1', right: '#bdb2a6' };
const INDIGO = { top: '#a3a9c8', left: '#737a9e', right: '#5a6084' };
const CORAL = { top: '#e6bfae', left: '#c99482', right: '#a97767' };
const SAGE = { top: '#cad8c7', left: '#a1b5a1', right: '#829781' };
const GOLD = '#e3c08f';
const GLOW = '#ffd9a0';
const IVORY = '#f4ede3';
const NAVY = '#3d4466';

// Contre l'IA : deux cartes dressées face à face sur un socle, une étincelle entre elles.
function Duel() {
    return <svg viewBox="0 0 48 48" aria-hidden="true">
        <Prism x={24} y={30} w={17} h={3} {...INDIGO} />
        {/* Dos de carte (marine, losange doré) */}
        <path d="M9 17 L19 12 L19 32 L9 37 Z" fill={NAVY} stroke={IVORY} strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M14 20.5 L16.2 23.6 L14 27.6 L11.8 24.5 Z" fill="none" stroke={GOLD} strokeWidth="1" />
        {/* Face de carte (ivoire, pastille corail) */}
        <path d="M29 12 L39 17 L39 37 L29 32 Z" fill="#7fae98" stroke={IVORY} strokeWidth="1.3" strokeLinejoin="round" />
        <ellipse cx="34" cy="24.5" rx="2.4" ry="3.4" transform="rotate(26 34 24.5)" fill={IVORY} />
        <path d={spark(24, 9, 4.6)} fill={GOLD} />
        <circle cx="24" cy="9" r="7" fill={GLOW} opacity=".16" />
    </svg>;
}

// En ligne : deux tours éclairées reliées par une passerelle, signal au-dessus.
function Bridge() {
    return <svg viewBox="0 0 48 48" aria-hidden="true">
        <Prism x={13} y={15} w={6} h={19} {...INDIGO} />
        <Prism x={13} y={12} w={4} h={3} {...STONE} />
        <Prism x={35} y={19} w={6} h={15} {...CORAL} />
        <Prism x={35} y={16} w={4} h={3} {...STONE} />
        <path d="M9 23.5 L11.4 24.7 L11.4 29 L9 27.8 Z" fill={GLOW} />
        <path d="M31 27.5 L33.4 28.7 L33.4 33 L31 31.8 Z" fill={GLOW} />
        <path d="M18 23 Q24.5 15.5 30.5 25" fill="none" stroke={IVORY} strokeWidth="3.2" strokeLinecap="round" />
        <path d="M18 25.4 Q24.5 18 30.5 27.4" fill="none" stroke="#bdb2a6" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M20.5 9.5 Q24 6.4 27.5 9.5" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M22.3 12 Q24 10.6 25.7 12" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" />
    </svg>;
}

// Défis : pyramide à degrés, fanion doré, étoile.
function Summit() {
    return <svg viewBox="0 0 48 48" aria-hidden="true">
        <Prism x={24} y={25} w={18} h={4} {...STONE} />
        <Prism x={24} y={20} w={12} h={4} {...SAGE} />
        <Prism x={24} y={16} w={6} h={3} {...CORAL} />
        <path d="M24 18 V4.5" stroke={IVORY} strokeWidth="1.4" strokeLinecap="round" />
        <path d="M24 4.5 L32 7.2 L24 10 Z" fill={GOLD} />
        <path d={spark(37, 11, 3.4)} fill={GOLD} opacity=".9" />
        <path d={spark(11, 15, 2.2)} fill={IVORY} opacity=".7" />
    </svg>;
}

// Reprendre : un sablier à cadre indigo, sable doré qui s'écoule.
function Hourglass() {
    return <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="30" r="8" fill={GLOW} opacity=".12" />
        <path d="M16.5 14 L31.5 14 L26 24 L31.5 34 L16.5 34 L22 24 Z" fill={IVORY} fillOpacity=".9" stroke="#d6cdc1" strokeWidth="1" strokeLinejoin="round" />
        <path d="M18.8 15.8 L29.2 15.8 L25.6 22.4 L22.4 22.4 Z" fill={GOLD} />
        <path d="M24 24 V31" stroke={GOLD} strokeWidth="1" strokeLinecap="round" />
        <path d="M18.8 33.4 L29.2 33.4 L24 28.4 Z" fill={GOLD} />
        <path d="M15 12 V36 M33 12 V36" stroke={INDIGO.left} strokeWidth="1.8" strokeLinecap="round" />
        <Prism x={24} y={5} w={9} h={2} {...INDIGO} />
        <Prism x={24} y={34} w={9} h={2} {...INDIGO} />
    </svg>;
}

const GLYPHS = { quick: Hourglass, ai: Duel, online: Bridge, challenges: Summit };

export default function HomeGlyph({ id }) {
    const Glyph = GLYPHS[id];
    return Glyph ? <Glyph /> : null;
}
