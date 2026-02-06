import { memo, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import SkyjoCard from './SkyjoCard';
import { cn } from '../../lib/utils';
import { getAvatarPath } from '../../lib/avatars';

/**
 * Player Hand Component
 * Displays a player's 12 cards in a 3x4 grid (4 columns, 3 rows)
 */
const PlayerHand = memo(function PlayerHand({
    player,
    isCurrentPlayer = false,
    isLocalPlayer = false,
    isOpponent = false,
    isOnlineOpponent = false, // True if this is an online opponent (show real name, not "BOT")
    selectedCardIndex,
    pendingRevealIndices = [], // Cards currently selected during initial reveal (for visual flip)
    onCardClick,
    canInteract = false,
    showName = true,

    size = 'md',
    shakingCardIndex = null,
}) {
    // Skyjo grid: 4 columns x 3 rows = 12 cards
    // Layout: column-first (0,1,2 = col1, 3,4,5 = col2, etc.)
    const getCardIndex = (row, col) => col * 3 + row;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
            },
        },
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    // Safety check for undefined player (e.g. during state transitions or sync issues)
    if (!player || !player.hand) {
        return null;
    }

    // Calculate score for display
    const currentScore = player.hand
        .filter((c) => c?.isRevealed)
        .reduce((sum, c) => sum + c.value, 0);

    // Track previous hand to detect cleared columns
    const prevHandRef = useRef(player.hand);
    const [clearedCols, setClearedCols] = useState([]);

    useEffect(() => {
        const currentHand = player.hand;
        const prevHand = prevHandRef.current;

        if (!prevHand) {
            prevHandRef.current = currentHand;
            return;
        }

        const newCleared = [];

        // Check each column (0-3)
        for (let col = 0; col < 4; col++) {
            const indices = [col * 3, col * 3 + 1, col * 3 + 2];

            // Check if it WAS full/present (at least one card) and NOW is all null
            // Tighter check: The engine removes them all at once.
            // So we check if all are null NOW, and at least one was NOT null BEFORE.

            const isAllNullHere = indices.every(i => currentHand[i] === null);
            const wasCardsThere = indices.some(i => prevHand[i] !== null);

            if (isAllNullHere && wasCardsThere) {
                newCleared.push(col);
                // Play sound check (only for local/current player to avoid overlapping noise? Or global?)
                // Let's play it for everyone to feel the impact
                const audio = new Audio('/Sounds/card-place.mp3'); // Placeholder, will try to find a better "slash" sound if available or pitch shift
                // Actually relying on the generic 'playVictory' might be too much, let's just use a quick swoosh if possible or standard sound
                // For now, no extra sound import to avoid 404, relying on visual.
            }
        }

        if (newCleared.length > 0) {
            // Add to cleared state to trigger animation
            setClearedCols(prev => [...prev, ...newCleared.map(col => ({ col, id: Date.now() + col }))]);

            // Remove from state after animation
            setTimeout(() => {
                setClearedCols(prev => prev.filter(item => !newCleared.some(nc => nc === item.col)));
            }, 1000);
        }

        prevHandRef.current = currentHand;
    }, [player.hand]); // Dependency on hand structure

    return (
        <div
            className={cn(
                "relative transition-all duration-300",
                isCurrentPlayer && !isOpponent
                    ? "border-[3px] border-emerald-400"
                    : isCurrentPlayer && isOpponent
                        ? "border-[3px] border-blue-400"
                        : "border border-[#333333]", // Default subtle border
                isLocalPlayer && !isCurrentPlayer && "border-2 border-amber-400/50" // Subtle highlight for self when not turn
            )}
            style={{
                // 55% black overlay + 20px blur + proper styling
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                padding: '16px 6px 2px 6px', // Reduced padding
                borderRadius: '16px',
                // Border handled by className for active state, remove inline default
                ...(isCurrentPlayer ? {
                    boxShadow: isOpponent
                        ? '0 0 15px rgba(96, 165, 250, 0.4)'
                        : '0 0 15px rgba(52, 211, 153, 0.4)'
                } : {})
            }}
        >
            {/* NEON BEAM OVERLAY */}
            <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden rounded-[16px]">
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '5px',
                    height: '100%',
                    padding: '16px 6px 2px 6px', // Match main padding
                }}>
                    {[0, 1, 2, 3].map(col => (
                        <div key={col} className="relative w-full h-full">
                            {clearedCols.some(c => c.col === col) && (
                                <ColumnBeam />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Player label with score - 16px margin from grid */}
            {showName && (
                <div
                    className={cn(
                        "absolute left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full font-bold shadow-lg whitespace-nowrap uppercase tracking-wide flex items-center gap-2",
                        isCurrentPlayer && !isOpponent
                            ? "bg-emerald-500 text-white"
                            : isCurrentPlayer && isOpponent
                                ? "bg-blue-500 text-white"
                                : isOpponent
                                    ? "bg-slate-600 text-slate-200"
                                    : "bg-emerald-600 text-white"
                    )}
                    style={{
                        fontSize: '10px',
                        zIndex: 50,
                        top: '-34px', // Positioned lower
                    }}
                    id={`player-badge-${player.id}`}
                >
                    {isOpponent ? (
                        isOnlineOpponent ? (
                            <div className="flex items-center gap-1.5">
                                {getAvatarPath(player.avatarId || player.emoji) ? (
                                    <img
                                        src={getAvatarPath(player.avatarId || player.emoji)}
                                        alt="Avatar"
                                        className="w-5 h-5 object-contain rounded-full"
                                    />
                                ) : (
                                    <span className="text-xs">{player.emoji}</span>
                                )}
                                <span className="text-xs">{player.name}</span>
                            </div>
                        ) : (
                            <span className="text-xs flex items-center gap-1 font-black">
                                <Bot className="w-3.5 h-3.5 text-purple-400" /> IA
                            </span>
                        )
                    ) : (
                        <div className="flex items-center gap-1.5">
                            {getAvatarPath(player.avatarId || player.emoji) ? (
                                <img
                                    src={getAvatarPath(player.avatarId || player.emoji)}
                                    alt="Avatar"
                                    className="w-5 h-5 object-contain rounded-full"
                                />
                            ) : (
                                <span className="text-xs">👤</span> // Fallback icon for self if no emoji/avatar
                            )}
                            <span className="text-xs">VOUS</span>
                        </div>
                    )}
                    {/* Score: 16pt minimum, bold */}
                    <span
                        className="font-black"
                        style={{
                            fontSize: '13pt',
                            fontFamily: "'Outfit', system-ui, sans-serif",
                        }}
                    >
                        {currentScore}
                    </span>
                    {isCurrentPlayer && (
                        <span className="animate-pulse text-sm">🎯</span>
                    )}
                </div>
            )}

            {/* Card grid: 10px margin from badge, strict 12px gap */}
            <motion.div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '5px', // Minimal gap
                    marginTop: '2px', // Minimal margin since padding handles badge space
                    justifyItems: 'center',
                }}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {[0, 1, 2].map((row) =>
                    [0, 1, 2, 3].map((col) => {
                        const cardIndex = getCardIndex(row, col);
                        const card = player.hand[cardIndex];

                        // Check if this card is pending reveal (selected but not yet confirmed)
                        const isPendingReveal = pendingRevealIndices.includes(cardIndex);

                        // Create a modified card for visual display if pending reveal
                        const displayCard = card && isPendingReveal && !card.isRevealed
                            ? { ...card, isRevealed: true }
                            : card;

                        return (
                            <motion.div
                                key={`${row}-${col}`}
                                variants={cardVariants}
                                style={{ position: 'relative', zIndex: 1 }}
                                id={`card-${player.id}-${cardIndex}`}
                            >
                                <SkyjoCard
                                    card={displayCard}
                                    size={size}
                                    isSelected={selectedCardIndex === cardIndex || isPendingReveal}
                                    isClickable={canInteract && card !== null}
                                    isHighlighted={canInteract && card && !card.isRevealed && !isPendingReveal}
                                    isShaking={shakingCardIndex === cardIndex}
                                    isLocked={card && card.lockCount > 0}
                                    onClick={() => onCardClick?.(cardIndex)}
                                />
                            </motion.div>
                        );
                    })
                )}
            </motion.div>
        </div>
    );
});

// Neon Beam Animation Component
const ColumnBeam = () => {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
            {/* Core Beam - White Hot Center */}
            <motion.div
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: [0, 1.5, 2], opacity: [0, 1, 0] }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-[4px] h-full bg-white blur-[2px] rounded-full"
            />

            {/* Outer Glow - Colored Plasma */}
            <motion.div
                initial={{ scaleY: 0, opacity: 0, width: "10%" }}
                animate={{ scaleY: [0, 1.2, 1.5], opacity: [0.8, 0], width: ["10%", "150%"] }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className="absolute h-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent blur-md"
            />

            {/* Shockwave Rings */}
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [0.5, 1.5], opacity: [1, 0] }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="absolute w-full aspect-square rounded-full border-2 border-cyan-200 blur-sm"
            />

            {/* Sparkles / Particles */}
            <motion.div
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: -100, opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute w-2 h-2 bg-white rounded-full blur-[1px]"
                style={{ top: '50%', left: '50%' }}
            />
        </div>
    );
};

export default PlayerHand;
