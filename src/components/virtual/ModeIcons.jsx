// Icônes dessinées des modes contre l'IA (duotone : trait + aplat léger de la couleur du mode).
const base = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
const tint = { fill: 'currentColor', fillOpacity: 0.18 };

// Normal : deux cartes en éventail, une étoile sur celle du dessus.
export function NormalIcon(props) {
    return <svg {...base} {...props}>
        <rect x="3.2" y="5.6" width="10" height="14" rx="2.2" transform="rotate(-10 8.2 12.6)" {...tint} />
        <rect x="10" y="4" width="10" height="14" rx="2.2" transform="rotate(8 15 11)" fill="currentColor" fillOpacity="0.32" />
        <path d="M15.2 8.4l.8 1.7 1.8.2-1.4 1.2.4 1.8-1.6-.9-1.6.9.4-1.8-1.4-1.2 1.8-.2z" fill="currentColor" stroke="none" />
    </svg>;
}

// Difficile : un sommet escarpé et son fanion.
export function HardIcon(props) {
    return <svg {...base} {...props}>
        <path d="M2.5 20l6.3-10.5 3.2 5 2.6-3.8L21.5 20z" {...tint} />
        <path d="M8.8 9.5l1.9 3.1-1.3 1.2-1.2-1" />
        <path d="M14.6 11.2V4.2" />
        <path d="M14.6 4.4l4 1.4-4 1.5" fill="currentColor" fillOpacity="0.45" />
    </svg>;
}

// Tourment : une flamme logée dans une carte.
export function TourmentIcon(props) {
    return <svg {...base} {...props}>
        <rect x="5" y="2.8" width="14" height="18.4" rx="2.6" {...tint} />
        <path d="M12 7.4c.4 1.8 2.9 3 2.9 5.8a2.9 2.9 0 01-5.8 0c0-1.1.5-1.9 1.1-2.5.2 1 .8 1.5 1.3 1.6-.4-1.6-.1-3.4.5-4.9z" fill="currentColor" fillOpacity="0.55" />
        <path d="M8 5.6h1.4M14.6 18.4H16" />
    </svg>;
}

// Fury : un éclair dans une onde de choc.
export function FuryIcon(props) {
    return <svg {...base} {...props}>
        <path d="M12 2.6l2 3.3 3.8-1-1 3.8 3.3 2-3.3 2 1 3.8-3.8-1-2 3.3-2-3.3-3.8 1 1-3.8-3.3-2 3.3-2-1-3.8 3.8 1z" {...tint} />
        <path d="M12.9 6.8l-3.4 5.6h3l-1.4 4.8 4-6.2h-3z" fill="currentColor" fillOpacity="0.7" />
    </svg>;
}
