import { useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * ParallaxBackground
 * Creates a premium multi-layer background with parallax effect based on mouse/device movement.
 * Includes floating elements for atmosphere.
 */
export default function ParallaxBackground() {
    const ref = useRef(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth spring animation for mouse movement
    const springConfig = { damping: 25, stiffness: 100 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    // Calculate parallax offsets for different layers
    // Layer 1: Background (slowest)
    const x1 = useTransform(springX, value => value * 15);
    const y1 = useTransform(springY, value => value * 15);

    // Layer 2: Middle (medium)
    const x2 = useTransform(springX, value => value * 30);
    const y2 = useTransform(springY, value => value * 30);

    // Layer 3: Foreground particles (fastest)
    const x3 = useTransform(springX, value => value * 45);
    const y3 = useTransform(springY, value => value * 45);

    useEffect(() => {
        const handleMouseMove = (e) => {
            // Calculate normalized mouse position (-1 to 1)
            const { innerWidth, innerHeight } = window;
            const x = (e.clientX / innerWidth) - 0.5;
            const y = (e.clientY / innerHeight) - 0.5;

            mouseX.set(x);
            mouseY.set(y);
        };

        const handleDeviceOrientation = (e) => {
            if (e.gamma && e.beta) {
                // Normalize roughly to range -1 to 1 based on typical tilt
                const x = Math.min(Math.max(e.gamma / 45, -1), 1);
                const y = Math.min(Math.max(e.beta / 45, -1), 1);
                mouseX.set(x);
                mouseY.set(y);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        // Only add device orientation if supported/relevant (mobile)
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleDeviceOrientation);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('deviceorientation', handleDeviceOrientation);
        };
    }, [mouseX, mouseY]);

    return (
        <div ref={ref} className="fixed inset-0 overflow-hidden pointer-events-none -z-50 bg-[#0f172a]">
            {/* Base Gradient Layer - Deep Space */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] opacity-100" />

            {/* Layer 1: Distant Nebulas/Glows */}
            <motion.div
                style={{ x: x1, y: y1 }}
                className="absolute inset-0"
            >
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-900/20 rounded-full blur-[120px]" />
                <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-indigo-900/10 rounded-full blur-[100px]" />
            </motion.div>

            {/* Layer 2: Floating Shapes/Particles */}
            <motion.div
                style={{ x: x2, y: y2 }}
                className="absolute inset-0"
            >
                {/* Random particles */}
                <div className="absolute top-[15%] left-[25%] w-2 h-2 bg-white/10 rounded-full blur-[1px]" />
                <div className="absolute top-[75%] left-[15%] w-3 h-3 bg-purple-400/10 rounded-full blur-[2px]" />
                <div className="absolute bottom-[25%] right-[25%] w-4 h-4 bg-teal-400/10 rounded-full blur-[4px]" />
                <div className="absolute top-[30%] right-[30%] w-1 h-1 bg-white/20 rounded-full" />

                {/* SVG Decor */}
                <svg className="absolute top-[20%] left-[10%] w-24 h-24 text-white/5 opacity-20" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" />
                </svg>
                <svg className="absolute bottom-[20%] right-[10%] w-32 h-32 text-indigo-500/5 opacity-20" viewBox="0 0 100 100">
                    <rect x="20" y="20" width="60" height="60" rx="10" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(15 50 50)" />
                </svg>
            </motion.div>

            {/* Layer 3: Foreground Subtle Dust (Interactive) */}
            <motion.div
                style={{ x: x3, y: y3 }}
                className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"
            />

            {/* Vignette Overlay for focus */}
            <div className="absolute inset-0 bg-radial-gradient-vignette opacity-40 pointer-events-none" />
        </div>
    );
}
