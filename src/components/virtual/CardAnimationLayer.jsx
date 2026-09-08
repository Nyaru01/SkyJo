import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion } from 'framer-motion';
import SkyjoCard from './SkyjoCard';

/**
 * CardAnimationLayer
 * Handles "flying card" animations by overlaying a motion component
 * that moves from a source element to a target element.
 * 
 * @param {Object} props
 * @param {Object} props.pendingAnimation - Animation object { sourceId, targetId, card, onComplete, type }
 * @param {Function} props.onClear - Callback to clear animation
 */
export default function CardAnimationLayer({ pendingAnimation, onClear }) {

    const [animationState, setAnimationState] = useState(null);

    // Random rotation for natural card toss effect
    const randomRotation = 2;

    useEffect(() => {
        if (pendingAnimation) {
            const { sourceId, targetId, card, onComplete, type } = pendingAnimation;

            // Find elements
            const sourceEl = document.getElementById(sourceId);
            const targetEl = document.getElementById(targetId);

            if (sourceEl && targetEl) {
                const startRect = sourceEl.getBoundingClientRect();
                const endRect = targetEl.getBoundingClientRect();

                // Measure the committed source and target before animating.
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setAnimationState({
                    startRect,
                    endRect,
                    card,
                    onComplete,
                    type: type || 'default', // 'slide-to-discard', 'draw', 'default'
                });
            } else {
                // Fallback if elements not found: just complete immediately
                onComplete?.();
                onClear();
            }
        }
    }, [pendingAnimation, onClear]);

    const handleAnimationComplete = () => {
        if (animationState?.onComplete) {
            animationState.onComplete();
        }
        setAnimationState(null);
        onClear();
    };

    if (!animationState) return null;

    // Determine animation config based on type
    const isSlideToDiscard = animationState.type === 'slide-to-discard' ||
        animationState.endRect?.left === document.getElementById('discard-pile')?.getBoundingClientRect()?.left;

    const animationConfig = isSlideToDiscard ? {
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1], // Ease-out cubic for natural card toss
    } : {
        duration: 0.6,
        ease: "easeInOut",
    };

    return createPortal(
        <div data-card-flight className="fixed inset-0 pointer-events-none z-[100]">
            <Motion.div
                initial={{
                    position: 'absolute',
                    top: animationState.startRect.top,
                    left: animationState.startRect.left,
                    width: animationState.startRect.width,
                    height: animationState.startRect.height,
                    opacity: 1,
                    scale: 1,
                    rotate: 0,
                }}
                animate={{
                    top: animationState.endRect.top,
                    left: animationState.endRect.left,
                    width: animationState.endRect.width,
                    height: animationState.endRect.height,
                    scale: 1,
                    rotate: isSlideToDiscard ? randomRotation : 0,
                    transition: animationConfig,
                }}
                onAnimationComplete={handleAnimationComplete}
            >
                <SkyjoCard
                    card={animationState.card}
                    size="custom"
                    style={{ width: '100%', height: '100%' }}
                />
            </Motion.div>
        </div>, document.body
    );
}
