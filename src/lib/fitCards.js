// Taille des cartes en partie : on mesure la place réellement libre et on agrandit
// (ou réduit) les cartes pour la remplir, sans jamais faire défiler l'écran.
// S'utilise comme ref de rappel sur .skyjo-game-container (React 19 : la fonction renvoie le nettoyage).
const MIN_H = 40;
const MAX_H = 78;

function fit(el) {
    const area = el.querySelector('.skyjo-action-area');
    const card = el.querySelector('.skyjo-hand [style*="skyjo-card-h"]');
    if (!area || !card) return;
    const rows = el.querySelectorAll('.skyjo-hand').length * 3 + 1;
    let h = card.getBoundingClientRect().height;
    for (let pass = 0; pass < 3; pass++) {
        const box = area.getBoundingClientRect();
        let top = Infinity, bottom = -Infinity, rails = 0;
        for (const child of area.children) {
            // Rails Fury (absolus, sur les côtés) : la zone doit au moins les contenir.
            if (child.classList.contains('fury-rail')) { rails = Math.max(rails, child.getBoundingClientRect().height); continue; }
            if (getComputedStyle(child).position === 'absolute') continue;
            const r = child.getBoundingClientRect();
            if (!r.height) continue;
            top = Math.min(top, r.top);
            bottom = Math.max(bottom, r.bottom);
        }
        if (top === Infinity) return;
        // Place libre dans la zone centrale, moins ce qui dépasse du conteneur.
        const slack = box.height - Math.max(bottom - top, rails + 4) - 12 - Math.max(0, el.scrollHeight - el.clientHeight);
        if (Math.abs(slack) < 6) return;
        const next = Math.max(MIN_H, Math.min(MAX_H, h + slack / rows));
        if (Math.abs(next - h) < 1) return;
        h = next;
        el.style.setProperty('--skyjo-card-h', `${h.toFixed(1)}px`);
        el.style.setProperty('--skyjo-card-w', `${Math.min(h * 0.74, 62).toFixed(1)}px`);
    }
}

export function fitCardsRef(el) {
    if (!el) return undefined;
    let frame = 0;
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => fit(el)); };
    const timers = [0, 300, 1200].map(ms => setTimeout(schedule, ms));
    const resize = new ResizeObserver(schedule);
    resize.observe(el);
    // Un élément qui apparaît ou disparaît au centre (réserve Fury, bandeau de ciblage…) : on réajuste.
    const mutations = new MutationObserver(schedule);
    const area = el.querySelector('.skyjo-action-area');
    if (area) mutations.observe(area, { childList: true });
    return () => { timers.forEach(clearTimeout); cancelAnimationFrame(frame); resize.disconnect(); mutations.disconnect(); };
}
