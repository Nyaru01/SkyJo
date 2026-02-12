import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * TiltCard - A component that tilts in 3D based on mouse position.
 * Includes a subtle glare effect.
 */
export const TiltCard = ({
    children,
    className,
    glareColor = "rgba(255, 255, 255, 0.1)",
    tiltMaxAngleX = 10,
    tiltMaxAngleY = 10,
    perspective = 1000,
    scaleOnHover = 1.05,
    contentZ = 20,
    ...props
}) => {
    const ref = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

    // Mouse position relative to the center of the card (0 to 1)
    const x = useMotionValue(0.5);
    const y = useMotionValue(0.5);

    // Smooth physics for the mouse movement
    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

    // Calculate rotation based on mouse position
    // If mouse is on left (0), rotate Y to negative angle. Right (1) -> positive.
    const rotateX = useTransform(mouseYSpring, [0, 1], [tiltMaxAngleX, -tiltMaxAngleX]);
    const rotateY = useTransform(mouseXSpring, [0, 1], [-tiltMaxAngleY, tiltMaxAngleY]);

    // Glare position moves opposite to the tilt
    const glareX = useTransform(mouseXSpring, [0, 1], ['0%', '100%']);
    const glareY = useTransform(mouseYSpring, [0, 1], ['0%', '100%']);
    const glareOpacity = useTransform(mouseXSpring, [0, 0.5, 1], [0.4, 0, 0.4]); // Glare visible on edges

    const handleMouseMove = (e) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();

        // Calculate normalized position (0 to 1)
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;

        const xPos = clientX / rect.width;
        const yPos = clientY / rect.height;

        x.set(xPos);
        y.set(yPos);
    };

    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        // Reset to center
        x.set(0.5);
        y.set(0.5);
    };

    // Mobile Gyroscope Support
    useEffect(() => {
        const handleOrientation = (e) => {
            const { beta, gamma } = e;
            if (beta === null || gamma === null) return;

            // Beta (x-axis tilt): -180 to 180. Gamma (y-axis tilt): -90 to 90.
            // We map a comfortable range (e.g., -20 to 20 degrees) to 0-1

            // Center points (simulate straight holding)
            const baseBeta = 45; // Typically held at ~45 degrees
            const baseGamma = 0;

            // Calculate offset
            const xTilt = (gamma - baseGamma) / 40; // Sensitivity 
            const yTilt = (beta - baseBeta) / 40;

            // Clamp and map to 0-1 (0.5 is center)
            const xVal = Math.min(Math.max(xTilt + 0.5, 0), 1);
            const yVal = Math.min(Math.max(yTilt + 0.5, 0), 1);

            // smooth updates are handled by the spring
            x.set(xVal);
            y.set(yVal);

            // On mobile, we always consider it "hovered" for the effects to be visible
            // if we have active sensor data
            setIsHovered(true);
        };

        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleOrientation);
        }

        return () => {
            if (window.DeviceOrientationEvent) {
                window.removeEventListener('deviceorientation', handleOrientation);
            }
        };
    }, [x, y]);

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                perspective: perspective,
                transformStyle: "preserve-3d",
            }}
            whileHover={{ scale: scaleOnHover }}
            className={cn("relative", className)}
            {...props}
        >
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                }}
                className="w-full h-full"
            >
                {/* Dynamic Depth Shadow (Premium 3D) */}
                <motion.div
                    className="absolute inset-0 bg-black/60 blur-xl rounded-[inherit] -z-10"
                    style={{
                        transform: "translateZ(-30px)",
                        opacity: useTransform(isHovered ? x : x, () => isHovered ? 0.6 : 0), // Only visible on hover/tilt
                        x: useTransform(mouseXSpring, [0, 1], [15, -15]), // Shadow moves opposite to light
                        y: useTransform(mouseYSpring, [0, 1], [15, -15]),
                    }}
                />

                {/* Content Layer */}
                <div className="relative z-10 w-full h-full backface-hidden" style={{ transform: `translateZ(${contentZ}px)` }}>
                    {children}
                </div>

                {/* Glare/Highlight Layer - Overlay */}
                <motion.div
                    className="absolute inset-0 z-20 pointer-events-none rounded-[inherit]"
                    style={{
                        background: `radial-gradient(circle at ${glareX.get()} ${glareY.get()}, ${glareColor}, transparent 80%)`,
                        opacity: isHovered ? 0.4 : 0,
                        mixBlendMode: 'overlay',
                        transform: "translateZ(30px)"
                    }}
                />

                {/* Holographic Rainbow Effect (Premium) */}
                <motion.div
                    className="absolute inset-0 z-10 pointer-events-none rounded-[inherit] opacity-40"
                    style={{
                        background: `linear-gradient(115deg, transparent 0%, #ff0080 30%, #ff8c00 50%, #40e0d0 70%, transparent 100%)`,
                        backgroundSize: '200% 200%',
                        mixBlendMode: 'color-dodge',
                        opacity: isHovered ? 0.15 : 0,
                        rotate: rotateY, // Dynamic light shift
                        transform: "translateZ(10px)"
                    }}
                />
            </motion.div>
        </motion.div>
    );
};
