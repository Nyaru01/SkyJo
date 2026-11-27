import { useEffect } from 'react';
import { AVATARS } from '../../lib/avatars';

const CRITICAL_IMAGES = [
    '/card-backs/classic.svg',
    '/card-backs/papyrus.svg',
    '/card-backs/neon.svg',
    '/card-backs/cyberpunk.svg',
    '/card-backs/carbon.svg',
    '/card-backs/obsidian.svg',
    '/card-backs/gold.svg',
    '/card-backs/galaxy.svg',
    '/card-snow.png',
    '/Wallpapers/bg-vesper.png',
    '/Wallpapers/Eau.png',
    '/Wallpapers/Mystique.png',
    '/Wallpapers/Noir premium.png',
    '/Wallpapers/stellaire.png',
    '/Wallpapers/Cyber_nature.png',
    '/Wallpapers/Cyber_City.png',
    '/virtual-logo.jpg',
    '/logo.jpg',
    '/virtual-logo2.jpg',
    ...AVATARS.map(avatar => avatar.path)
];

const CRITICAL_AUDIO = [
    '/Sounds/Start.mp3',
    '/Sounds/victory.mp3',
    '/Sounds/whoosh-radio-ready-219487.mp3',
    '/Music/stranger-things-124008.mp3',
    '/Music/bathroom-chill-background-music-14977.mp3',
    '/Music/chill-lofi-347217.mp3',
    '/Music/reveil-239031.mp3',
    '/Music/scizzie - aquatic ambience.mp3',
    '/Music/lofi-piano-soulful-slow-music-260273.mp3',
    '/Music/GW1.mp3',
    '/Music/GW2.mp3',
    '/Music/fassounds-cutie-japan-lofi-402355.mp3',
    '/Music/lofi-chil.mp3',
    '/Music/postal-card-lofi-186313.mp3',
    '/Music/nostalgic.mp3',
    '/Music/Japanese Spring.mp3',
    '/Music/Down the Kuma.mp3',
    '/Music/Dosi & Aisake.mp3',
    '/Music/springs.mp3',
    '/Music/shuffling-cards-01-86984.mp3'
];

// Préchargement des images et sons essentiels, en arrière-plan : plus d'écran de chargement.
// L'accueil apparaît directement sous le fondu de l'intro ; les fichiers arrivent pendant ce temps.
export default function ImagePreloader({ children }) {
    useEffect(() => {
        CRITICAL_IMAGES.forEach(src => { const img = new Image(); img.src = src; });
        CRITICAL_AUDIO.forEach(src => { const audio = new Audio(); audio.preload = 'auto'; audio.src = src; audio.load(); });
    }, []);
    return <div className="w-full h-full">{children}</div>;
}
