import { memo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, HelpCircle } from 'lucide-react';
import SkyjoCard from './SkyjoCard';
import { cn } from '../../lib/utils';
import { getAvatarPath } from '../../lib/avatars';
import ColumnBeam from './ColumnBeam';

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
        .reduce((sum, c) => sum + (typeof c.value === 'number' ? c.value : 0), 0);

    const chestCount = player.hand.filter(c => c && c.isRevealed && (c.specialType === 'CH' || c.value === 'CH')).length;

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
                // Play specific clean sound for Protocol OMEGA
                const audio = new Audio('/Sounds/clean.mp3');
                audio.play().catch(e => console.log("Audio play blocked", e));
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
                    ? "border-2 border-emerald-400"
                    : isCurrentPlayer && isOpponent
                        ? "border-2 border-blue-400"
                        : "border border-white/10", // Default subtle border
                isLocalPlayer && !isCurrentPlayer && "border-2 border-amber-400/50"
            )}
            style={{
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                padding: '8px 6px 2px 6px',
                borderRadius: '20px',
                // 3D RELIEF BOX SHADOWS
                boxShadow: `
                    0 20px 50px rgba(0, 0, 0, 0.6),                    /* External Deep Shadow */
                    inset 0 2px 4px rgba(255, 255, 255, 0.1),         /* Top Interior Highlight */
                    inset 0 -2px 10px rgba(0, 0, 0, 0.4),              /* Bottom Interior Depth */
                    ${isCurrentPlayer
                        ? (isOpponent ? '0 0 25px rgba(96, 165, 250, 0.3)' : '0 0 25px rgba(52, 211, 153, 0.3)')
                        : '0 5px 15px rgba(0, 0, 0, 0.3)'}
                `
            }}
        >
            {/* DIVINE LIGHT AMBIENCE (Soft Golden Glow) */}
            <AnimatePresence>
                {clearedCols.length > 0 && (
                    <motion.div
                        key="ambient-glow"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 bg-gradient-to-b from-amber-900/20 to-transparent z-[45] pointer-events-none rounded-[20px]"
                    />
                )}
            </AnimatePresence>

            {/* NEON BEAM OVERLAY */}
            <div className="absolute inset-0 pointer-events-none z-50 overflow-visible rounded-[16px]">
                {/* 1. LASER BEAMS PER COLUMN */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '5px',
                    height: '100%',
                    padding: '10px 6px 2px 6px', // Sync with cards grid (8px padding + 2px margin)
                }}>
                    {[0, 1, 2, 3].map(col => (
                        <div key={col} className="relative w-full h-full overflow-hidden rounded-xl">
                            {clearedCols.some(c => c.col === col) && (
                                <ColumnBeam />
                            )}
                        </div>
                    ))}
                </div>

                <AnimatePresence>
                    {clearedCols.length > 0 && (
                        <motion.div
                            key="clean-text-divine"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05, filter: "blur(4px)" }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-[80] pointer-events-none"
                        >
                            {/* Ligne décorative haut */}
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: "80%", opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.1 }}
                                className="h-[1px] bg-gradient-to-r from-transparent via-amber-200/40 to-transparent"
                            />

                            <span
                                className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-50 to-amber-300 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-[0.2em] pl-[0.2em] uppercase"
                            >
                                Clean
                            </span>

                            {/* Ligne décorative bas */}
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: "80%", opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.1 }}
                                className="h-[1px] bg-gradient-to-r from-transparent via-amber-200/40 to-transparent"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Player label with score - 16px margin from grid */}
            {showName && (
                <div
                    className={cn(
                        "absolute left-1/2 -translate-x-1/2 px-6 py-0 rounded-full font-bold shadow-xl whitespace-nowrap uppercase tracking-widest flex items-center justify-center gap-4 min-w-[200px] w-fit max-w-[90vw] transition-all duration-300 border-2 backdrop-blur-xl",
                        isCurrentPlayer && !isOpponent
                            ? "bg-emerald-500/80 border-emerald-400 text-white shadow-emerald-500/30"
                            : isCurrentPlayer && isOpponent
                                ? "bg-blue-600/80 border-blue-400 text-white shadow-blue-500/30"
                                : isOpponent
                                    ? "bg-slate-900/60 border-slate-700 text-slate-200"
                                    : "bg-emerald-700/80 border-emerald-500 text-white shadow-emerald-600/20"
                    )}
                    style={{
                        fontSize: '10px',
                        height: '24px',
                        zIndex: 50,
                        ...(isOpponent ? { bottom: '-30px' } : { top: '-30px' }),
                        boxShadow: `
                            0 8px 24px rgba(0,0,0,0.4),
                            inset 0 1px 1px rgba(255,255,255,0.1),
                            ${isCurrentPlayer ? (isOpponent ? '0 0 15px rgba(96, 165, 250, 0.3)' : '0 0 15px rgba(52, 211, 153, 0.3)') : ''}
                        `
                    }}
                    id={`player-badge-${player.id}`}
                >
                    {/* AVATAR + NAME SECTION */}
                    <div className="flex items-center gap-2 min-w-0">
                        {isOpponent ? (
                            isOnlineOpponent ? (
                                <>
                                    <div className="w-4 h-4 rounded-full overflow-hidden border border-white/20 shrink-0">
                                        <img
                                            src={getAvatarPath(player.avatarId || player.emoji)}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <span className="text-[10px] font-black truncate max-w-[120px]">{player.name}</span>
                                </>
                            ) : (
                                <span className="text-[10px] flex items-center gap-1 font-black">
                                    <Bot className="w-3 h-3 text-purple-400 shrink-0" /> IA
                                </span>
                            )
                        ) : (
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-4 h-4 rounded-full overflow-hidden border border-white/20 shrink-0">
                                    <img
                                        src={getAvatarPath(player.avatarId || player.emoji) || '/avatars/cat.png'}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className="text-[10px] font-black truncate max-w-[120px]">VOUS</span>
                            </div>
                        )}
                    </div>

                    {/* SLIM DIVIDER */}
                    <div className="w-[1px] h-3 bg-white/20 shrink-0" />

                    {/* SCORE SECTION */}
                    <div className="flex items-center gap-3 shrink-0">
                        <span
                            className="font-black"
                            style={{
                                fontSize: '16px',
                                fontFamily: "'Outfit', system-ui, sans-serif",
                            }}
                        >
                            {currentScore}
                        </span>

                        {(chestCount > 0 || isCurrentPlayer) && (
                            <div className="flex items-center gap-1.5 ml-1">
                                {chestCount > 0 && (
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-200 text-[10px] font-black">
                                        <HelpCircle className="w-3 h-3" />
                                        {chestCount}
                                    </div>
                                )}
                                {isCurrentPlayer && (
                                    <span className="animate-pulse text-sm">🎯</span>
                                )}
                            </div>
                        )}
                    </div>
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



export default PlayerHand;
