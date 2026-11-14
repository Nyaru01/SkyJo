// Saison de l'accueil, d'après la date (hémisphère nord).
// Hiver à partir du solstice (21 décembre), printemps le 20 mars, été le 21 juin, automne le 22 septembre.
// Pour tester : ?saison=hiver|automne|printemps|ete dans l'adresse.

const ALIASES = { hiver: 'winter', automne: 'autumn', printemps: 'spring', ete: 'summer', été: 'summer' };

export function seasonForDate(date = new Date()) {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const md = m * 100 + d;
    if (md >= 1221 || md < 320) return 'winter';
    if (md < 621) return 'spring';
    if (md < 922) return 'summer';
    return 'autumn';
}

export function currentSeason(date = new Date()) {
    try {
        const forced = new URLSearchParams(window.location.search).get('saison');
        if (forced && ALIASES[forced.toLowerCase()]) return ALIASES[forced.toLowerCase()];
    } catch { /* adresse indisponible */ }
    return seasonForDate(date);
}
