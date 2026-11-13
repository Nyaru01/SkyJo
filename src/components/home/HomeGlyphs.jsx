// Emblèmes du menu, dessinés à la main en volumes isométriques pastel,
// dans le même langage que l'île : dessus clair, face gauche moyenne, face droite soutenue.

// Prisme isométrique : x, y = point haut du losange supérieur ; w = demi-largeur ; h = hauteur.
function Prism({ x, y, w, h, top, left, right }) {
    const d = w / 2;
    return <g>
        <path d={`M${x} ${y} L${x + w} ${y + d} L${x} ${y + w} L${x - w} ${y + d} Z`} fill={top} />
        <path d={`M${x - w} ${y + d} L${x} ${y + w} L${x} ${y + w + h} L${x - w} ${y + d + h} Z`} fill={left} />
        <path d={`M${x} ${y + w} L${x + w} ${y + d} L${x + w} ${y + d + h} L${x} ${y + w + h} Z`} fill={right} />
    </g>;
}

const STONE = { top: '#fff6ec', left: '#f2d9c6', right: '#e6c3b0' };
const CORAL = { top: '#f8c7bb', left: '#ec9f97', right: '#d98a92' };
const LILAC = { top: '#e6d6f2', left: '#c9b2e2', right: '#ac94d0' };
const MINT = { top: '#d3efe2', left: '#a9dcc6', right: '#86c4ab' };

// Contre l'IA : deux cartes dressées face à face, en duel.
function Duel() {
    return <svg viewBox="0 0 40 40" aria-hidden="true">
        <Prism x={20} y={30} w={13} h={3} {...STONE} />
        <path d="M9 13 L17 9 L17 25 L9 29 Z" fill="#f2b3a8" stroke="#fffaf3" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M23 9 L31 13 L31 29 L23 25 Z" fill="#b9a6e0" stroke="#fffaf3" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M13 17 l1.6 -0.8 v3.2 l-1.6 0.8 Z" fill="#fffaf3" />
        <path d="M27 17 l-1.6 -0.8 v3.2 l1.6 0.8 Z" fill="#fffaf3" />
    </svg>;
}

// En ligne : deux tours reliées par une passerelle.
function Bridge() {
    return <svg viewBox="0 0 40 40" aria-hidden="true">
        <Prism x={11} y={12} w={5} h={16} {...LILAC} />
        <Prism x={29} y={16} w={5} h={12} {...CORAL} />
        <path d="M14 17 Q20 11 26 19" fill="none" stroke="#fffaf3" strokeWidth="3" strokeLinecap="round" />
        <path d="M14 17 Q20 11 26 19" fill="none" stroke="#c9a4b8" strokeWidth="1.2" strokeLinecap="round" />
    </svg>;
}

// Défis : pyramide à degrés et fanion.
function Summit() {
    return <svg viewBox="0 0 40 40" aria-hidden="true">
        <Prism x={20} y={20} w={13} h={4} {...STONE} />
        <Prism x={20} y={15} w={8} h={4} {...MINT} />
        <Prism x={20} y={11} w={4} h={3} {...CORAL} />
        <path d="M20 12 V3" stroke="#8d7aa8" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M20 3 L26 5 L20 7.4 Z" fill="#e9a99b" />
    </svg>;
}

// Reprendre : un sablier.
function Hourglass() {
    return <svg viewBox="0 0 40 40" aria-hidden="true">
        <Prism x={20} y={4} w={8} h={2} {...LILAC} />
        <path d="M14 10 L26 10 L21.5 20 L26 30 L14 30 L18.5 20 Z" fill="#fff3ea" stroke="#d9b9c6" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M16.5 27 L23.5 27 L20 22 Z" fill="#f2b3a8" />
        <Prism x={20} y={28} w={8} h={2} {...LILAC} />
    </svg>;
}

const GLYPHS = { quick: Hourglass, ai: Duel, online: Bridge, challenges: Summit };

export default function HomeGlyph({ id }) {
    const Glyph = GLYPHS[id];
    return Glyph ? <Glyph /> : null;
}
