import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SkyjoCard from './SkyjoCard';

/**
 * DiscardHistoryOverlay
 * Shows the last 3 cards from discard pile in a fan layout
 * Triggered by long-press on discard pile
 */
const DiscardHistoryOverlay = memo(function DiscardHistoryOverlay({
    cards = [],
    isVisible = false,
    onClose,
}) {
    if (!isVisible || cards.length === 0) return null;

    // Fan layout configuration for up to 4 cards
    const fanConfig = [
        { rotation: -20, offsetX: -75, offsetY: 12, zIndex: 1 },  // Oldest
        { rotation: -6, offsetX: -25, offsetY: 0, zIndex: 2 },
        { rotation: 6, offsetX: 25, offsetY: 0, zIndex: 3 },
        { rotation: 20, offsetX: 75, offsetY: 12, zIndex: 4 },    // Newest
    ];

    // Get up to 4 most recent cards
    const displayCards = cards.slice(-4);

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Backdrop with blur - covers entire screen */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md flex items-center justify-center"
                        onPointerUp={onClose}
                        onPointerLeave={onClose}
                        onTouchEnd={onClose}
                    >
                        {/* Centered container */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.7, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.7, y: 30 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className="relative pointer-events-none"
                        >
                            {/* Label */}
                            <div className="text-center mb-6">
                                <span className="text-sm font-bold text-white uppercase tracking-wider bg-black/40 px-4 py-2 rounded-full">
                                    📜 Dernières défaussées
                                </span>
                            </div>

                            {/* Cards in fan */}
                            <div className="relative flex items-center justify-center" style={{ width: 240, height: 130 }}>
                                {displayCards.map((card, index) => {
                                    // Calculate layout index based on count
                                    let configIndex;
                                    const count = displayCards.length;
                                    const configCount = fanConfig.length; // 4

                                    // Center the cards based on how many we have
                                    // 1 card -> index 1 or 2 (middle)
                                    // 2 cards -> index 1 and 2
                                    // 3 cards -> index 0, 1.5, 3? approximating to 0, 1, 3 or 0, 2, 3
                                    // Let's use specific mappings for perfect look:

                                    if (count === 1) configIndex = 1; // slightly left of center? or maybe create specific config for 1
                                    else if (count === 2) configIndex = index + 1; // 1, 2
                                    else if (count === 3) configIndex = index > 0 ? index + 1 : index; // 0, 2, 3 (skip 1) -> nice wide spread
                                    else configIndex = index; // 0, 1, 2, 3

                                    // Fallback for 3 cards to be equidistant: 
                                    // Actually, let's just map 0,1,2 to the 4 slots if needed.
                                    // A better approach for 3 cards might be indices 0, 2 (interpolated?), 3. 
                                    // Simple logic:
                                    if (count === 3 && index === 1) {
                                        // For the middle card of 3, we want it centered. 
                                        // Our config 1 is -6deg, config 2 is +6deg.
                                        // We could make a custom intermediate config or just pick one.
                                        // Let's pick '1' for left-mid.
                                    }

                                    // Re-defining simplistic mapping:
                                    // 1 card: [1] (near center)
                                    // 2 cards: [1, 2] (center pair)
                                    // 3 cards: [0, 2, 3] (spread) - wait 2 is right-center. 1 is left-center.
                                    // [0, 1, 3] might be better?
                                    // Let's rely on the array directly.

                                    const finalConfigIndex = count === 1 ? 2 // actually index 2 is slight right. 
                                        : count === 2 ? index + 1
                                            : count === 3 ? (index === 1 ? 1 : (index === 2 ? 3 : 0)) // 0, 1, 3
                                                : index;

                                    // Override for single card to be perfectly centered (0,0)
                                    const config = count === 1
                                        ? { rotation: 0, offsetX: 0, offsetY: 0, zIndex: 5 }
                                        : fanConfig[finalConfigIndex] || fanConfig[index];

                                    return (
                                        <motion.div
                                            key={card.id || index}
                                            initial={{
                                                rotate: 0,
                                                x: 0,
                                                y: 40,
                                                opacity: 0,
                                                scale: 0.6
                                            }}
                                            animate={{
                                                rotate: config.rotation,
                                                x: config.offsetX,
                                                y: config.offsetY,
                                                opacity: 1,
                                                scale: 1,
                                            }}
                                            exit={{
                                                rotate: 0,
                                                x: 0,
                                                y: 40,
                                                opacity: 0,
                                                scale: 0.6
                                            }}
                                            transition={{
                                                type: 'spring',
                                                damping: 18,
                                                stiffness: 250,
                                                delay: index * 0.06
                                            }}
                                            className="absolute"
                                            style={{
                                                zIndex: config.zIndex,
                                                transformOrigin: 'center bottom',
                                            }}
                                        >
                                            <SkyjoCard
                                                card={{ ...card, isRevealed: true }}
                                                size="lg"
                                                isClickable={false}
                                            />
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Card count indicator */}
                            <div className="text-center mt-6">
                                <span className="text-sm text-white/70">
                                    {displayCards.length} / {cards.length} cartes
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
});

export default DiscardHistoryOverlay;
