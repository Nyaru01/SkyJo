import { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import SkyjoLoader from '../SkyjoLoader';

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
    '/Wallpapers/bg-skyjo.png',
    '/Wallpapers/Eau.png',
    '/Wallpapers/Mystique.png',
    '/Wallpapers/Noir premium.png',
    '/Wallpapers/stellaire.png',
    '/Wallpapers/Cyber_nature.png',
    '/Wallpapers/Cyber_City.png',
    '/virtual-logo.jpg',
    '/logo.jpg',
    '/virtual-logo2.jpg',
    // Avatar images
    '/avatars/cat.png?v=2',
    '/avatars/dog.png?v=2',
    '/avatars/fox.png?v=2',
    '/avatars/bear.png?v=2',
    '/avatars/panda.png?v=2',
    '/avatars/lion.png?v=2',
    '/avatars/frog.png?v=2',
    '/avatars/monkey.png?v=2'
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

export default function ImagePreloader({ children }) {
    const [isLoading, setIsLoading] = useState(true);
    const [realProgress, setRealProgress] = useState(0);
    const [visualProgress, setVisualProgress] = useState(0);

    useEffect(() => {
        let mounted = true;
        let loadedCount = 0;
        const total = CRITICAL_IMAGES.length + CRITICAL_AUDIO.length;
        const startTime = Date.now();
        const minLoadingTime = 1500; // Keep a short transition while assets finish loading

        // Simulation timer for visual progress (0 -> 100 over minLoadingTime)
        const progressInterval = setInterval(() => {
            if (!mounted) return;
            const elapsedTime = Date.now() - startTime;
            const timeRatio = Math.min(1, elapsedTime / minLoadingTime);
            setVisualProgress(Math.round(timeRatio * 100));
        }, 50);

        const handleAssetLoad = () => {
            if (!mounted) return;
            loadedCount++;
            setRealProgress(Math.round((loadedCount / total) * 100));

            if (loadedCount === total) {
                const elapsedTime = Date.now() - startTime;
                const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

                setTimeout(() => {
                    if (mounted) setIsLoading(false);
                    clearInterval(progressInterval);
                }, remainingTime);
            }
        };

        // Start loading all images
        CRITICAL_IMAGES.forEach(src => {
            const img = new Image();
            img.src = src;
            img.onload = handleAssetLoad;
            img.onerror = handleAssetLoad;
        });

        // Start loading all audio
        CRITICAL_AUDIO.forEach(src => {
            const audio = new Audio();
            audio.src = src;
            audio.oncanplaythrough = handleAssetLoad;
            audio.onerror = handleAssetLoad;
            audio.load(); // Force load
        });

        return () => {
            mounted = false;
        };
    }, []);

    const displayProgress = Math.min(realProgress, visualProgress);

    return (
        <>
            <AnimatePresence mode="wait">
                {isLoading && (
                    <Motion.div
                        key="loader"
                        initial={{ opacity: 1 }}
                        // Sortie : l'écran s'éclaire, grandit légèrement et se floute en s'effaçant, pour laisser place à l'accueil.
                        exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px) brightness(1.15)' }}
                        transition={{ duration: 0.85, ease: [0.4, 0, 0.2, 1] }}
                        className="fixed inset-0 z-[9999]"
                        style={{ willChange: 'opacity' }}
                    >
                        <SkyjoLoader progress={displayProgress} />
                    </Motion.div>
                )}
            </AnimatePresence>

            {/* Pas de fondu d'opacité sur toute l'app : sur mobile, il coupe puis rallume les flous
                (backdrop-filter) des menus, ce qui faisait clignoter l'écran. C'est l'écran de
                chargement, posé par-dessus, qui s'efface pour révéler les menus déjà en place. */}
            <div className="w-full h-full">
                {children}
            </div>
        </>
    );
}
