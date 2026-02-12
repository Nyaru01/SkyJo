import { memo, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles, HelpCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import SkyjoCard from './SkyjoCard';
import { useGameStore } from '../../store/gameStore';
import { getCardSkinPath } from '../../lib/skinUtils';
import DiscardHistoryOverlay from './DiscardHistoryOverlay';

// Simple haptic feedback for pile touches
const triggerHaptic = (duration = 50) => {
    if (navigator.vibrate) {
        navigator.vibrate(duration);
    }
};

// Mosaic color schemes for each card color (same as SkyjoCard)
const MOSAIC_COLORS = {
    indigo: {
        primary: '#4338ca',
        secondary: '#6366f1',
        tertiary: '#818cf8',
        light: '#a5b4fc',
        lines: 'rgba(255,255,255,0.3)',
    },
    blue: {
        primary: '#2563eb',
        secondary: '#3b82f6',
        tertiary: '#60a5fa',
        light: '#93c5fd',
        lines: 'rgba(255,255,255,0.3)',
    },
    cyan: {
        primary: '#0891b2',
        secondary: '#06b6d4',
        tertiary: '#22d3ee',
        light: '#67e8f9',
        lines: 'rgba(255,255,255,0.3)',
    },
    green: {
        primary: '#059669',
        secondary: '#10b981',
        tertiary: '#34d399',
        light: '#6ee7b7',
        lines: 'rgba(255,255,255,0.25)',
    },
    yellow: {
        primary: '#ca8a04',
        secondary: '#eab308',
        tertiary: '#facc15',
        light: '#fde047',
        lines: 'rgba(255,255,255,0.2)',
    },
    orange: {
        primary: '#ea580c',
        secondary: '#f97316',
        tertiary: '#fb923c',
        light: '#fdba74',
        lines: 'rgba(255,255,255,0.25)',
    },
    red: {
        primary: '#dc2626',
        secondary: '#ef4444',
        tertiary: '#f87171',
        light: '#fca5a5',
        lines: 'rgba(255,255,255,0.25)',
    },
    violet: {
        primary: '#7c3aed',
        secondary: '#8b5cf6',
        tertiary: '#a78bfa',
        light: '#c4b5fd',
        lines: 'rgba(255,255,255,0.3)',
    },
    darkred: {
        primary: '#7f1d1d',
        secondary: '#991b1b',
        tertiary: '#b91c1c',
        light: '#dc2626',
        lines: 'rgba(255,255,255,0.4)',
    },
    special: {
        primary: '#1e1b4b',
        secondary: '#312e81',
        tertiary: '#4338ca',
        light: '#818cf8',
        lines: 'rgba(255,255,255,0.4)',
    },
    gold: {
        primary: '#78350f',
        secondary: '#d97706',
        tertiary: '#f59e0b',
        light: '#fcd34d',
        lines: 'rgba(255,255,255,0.5)',
    },
};

// Mini mosaic pattern for discard preview
const MiniMosaicPattern = ({ colors, id }) => (
    <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, borderRadius: '6px' }}>
        <defs>
            <pattern id={`mini-mosaic-${id}`} patternUnits="userSpaceOnUse" width="20" height="20">
                <rect width="20" height="20" fill={colors.secondary} />
                <polygon points="0,0 10,3 7,10 0,8" fill={colors.primary} stroke={colors.lines} strokeWidth="0.5" />
                <polygon points="10,3 20,0 20,7 13,10 7,10" fill={colors.tertiary} stroke={colors.lines} strokeWidth="0.5" />
                <polygon points="0,8 7,10 4,20 0,20" fill={colors.tertiary} stroke={colors.lines} strokeWidth="0.5" />
                <polygon points="7,10 13,10 10,20 4,20" fill={colors.light} stroke={colors.lines} strokeWidth="0.5" />
                <polygon points="13,10 20,7 20,17 17,20 10,20" fill={colors.secondary} stroke={colors.lines} strokeWidth="0.5" />
                <polygon points="20,17 20,20 17,20" fill={colors.primary} stroke={colors.lines} strokeWidth="0.5" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#mini-mosaic-${id})`} />
    </svg>
);

/**
 * Compact trigger button for Draw/Discard popup
 * Placed between BOT and VOUS grids
 */
const DrawDiscardTrigger = memo(function DrawDiscardTrigger({
    onClick,
    onDrawAction,
    onDiscardAction,
    discardTop,
    discardPile = [], // Full discard pile for history
    drawnCard,
    drawPileCount,
    discardPileCount = 0,
    canInteract = false,
    turnPhase,
    instructionText = '', // Instruction text to display
    activeActionSource, // 'deck-pile' or 'discard-pile' when an animation is starting from here
    isDrawing = false,
    isAIThinking = false,
    drawnCardSource = null,
}) {
    const cardSkin = useGameStore(s => (s && s.cardSkin) ? s.cardSkin : 'classic');
    const gameMode = useGameStore(s => (s && s.gameMode) ? s.gameMode : 'normal');

    const hasDrawnCard = !!drawnCard;
    // Logique Visibilité Défausse (Mode H included)
    // Permet l'affichage pour Normal, Difficile ET H
    const showDiscardPreview = discardTop && !hasDrawnCard;

    // Disable interaction if drawing
    const effectiveCanInteract = canInteract && !isDrawing;

    // Long-press state for discard history
    const [showHistory, setShowHistory] = useState(false);
    const longPressTimer = useRef(null);
    const LONG_PRESS_DURATION = 400; // ms

    // Long-press handlers
    const handleDiscardPointerDown = useCallback(() => {
        longPressTimer.current = setTimeout(() => {
            triggerHaptic(30); // Short haptic on trigger
            setShowHistory(true);
        }, LONG_PRESS_DURATION);
    }, []);

    const handleDiscardPointerUp = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        setShowHistory(false);
    }, []);

    const handleDiscardPointerLeave = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        // Don't hide if already showing (user might have moved finger slightly)
    }, []);

    // Determine button state
    const isDrawPhase = turnPhase === 'DRAW';
    const isReplacePhase = turnPhase === 'REPLACE_OR_DISCARD' || turnPhase === 'MUST_REPLACE';

    // Mini card preview for discard - use mosaic colors
    let mosaicColors = null;
    if (discardTop) {
        const numericValue = parseInt(discardTop.value);
        if (numericValue === 20) mosaicColors = MOSAIC_COLORS.darkred;
        else if (numericValue === -10) mosaicColors = MOSAIC_COLORS.violet;
        else if (discardTop.specialType === 'S' || numericValue === 15) mosaicColors = MOSAIC_COLORS.special;
        else if (discardTop.specialType === 'C' || (numericValue === 0 && discardTop.color === 'special')) mosaicColors = MOSAIC_COLORS.special;
        else if (discardTop.specialType === 'CH' || discardTop.value === 'CH' || discardTop.color === 'gold') mosaicColors = MOSAIC_COLORS.gold;
        else mosaicColors = MOSAIC_COLORS[discardTop.color] || MOSAIC_COLORS.green;
    }
    const patternId = discardTop ? `discard-${discardTop.color}` : 'discard-default';

    return (
        <>
            <div className="flex flex-col items-center gap-1 w-full">
                <div className="relative flex items-center justify-center gap-3 w-full">
                    {/* Draw pile card preview - Face-down card on the LEFT - CLICKABLE */}
                    <motion.div
                        className={cn(
                            "w-10 h-14 rounded-lg flex items-center justify-center shrink-0 relative",
                            canInteract ? "cursor-pointer" : "cursor-not-allowed opacity-80"
                        )}
                        style={{
                            backgroundColor: '#1e293b', // Fallback
                            boxShadow: activeActionSource === 'deck-pile'
                                ? '0 0 20px 5px rgba(52, 211, 153, 0.7)' // Intense Green Glow if active
                                : canInteract ? '0 4px 12px rgba(0,0,0,0.5)' : 'none',
                            border: activeActionSource === 'deck-pile'
                                ? '2px solid #34d399' // Green border
                                : '2px solid rgba(100, 116, 139, 0.4)',
                            transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
                            overflow: 'hidden'
                        }}
                        onClick={canInteract ? () => { triggerHaptic(); (onDrawAction || onClick)?.(); } : undefined}
                        whileHover={canInteract ? { scale: 1.1, rotate: -5 } : undefined}
                        whileTap={canInteract ? { scale: 0.95 } : undefined}
                        animate={
                            activeActionSource === 'deck-pile'
                                ? { scale: [1, 1.1, 1] }
                                : canInteract
                                    ? { scale: [1, 1.03, 1] }
                                    : {}
                        }
                        transition={{ duration: canInteract ? 1.5 : 0.8, repeat: Infinity }}
                        id="deck-pile"
                    >
                        {/* Card back design */}
                        <img
                            src={getCardSkinPath(cardSkin)}
                            alt="Deck"
                            className="w-full h-full object-cover"
                        />

                        {/* Count Badge for Draw Pile (Optional - usually on button but good to have here too maybe? No, kept on button) */}
                    </motion.div>

                    {hasDrawnCard ? (
                        // Show the actual drawn card in the center
                        <motion.div
                            className={cn(
                                "relative z-10",
                                canInteract ? "cursor-pointer" : "cursor-default"
                            )}
                            onClick={onClick}
                            whileHover={canInteract ? { scale: 1.05 } : undefined}
                            whileTap={canInteract ? { scale: 0.95 } : undefined}
                            id="drawn-card-slot"
                        >
                            <SkyjoCard
                                card={{ ...drawnCard, isRevealed: true }}
                                size="md"
                                isHighlighted={canInteract}
                            // Add a label below or above?
                            />
                        </motion.div>
                    ) : (
                        <motion.button
                            onClick={onClick}
                            disabled={!canInteract}
                            className={cn(
                                "flex items-center justify-center gap-3 w-full px-2 py-1.5 rounded-xl transition-all relative z-10 overflow-hidden",
                                canInteract
                                    ? (instructionText && turnPhase === 'MUST_REVEAL' ? "cursor-default bg-indigo-600/80 backdrop-blur-md border border-indigo-400/50" : "cursor-pointer bg-slate-800/80 backdrop-blur-md hover:bg-slate-700/80 border border-emerald-500/50")
                                    : "cursor-not-allowed bg-slate-800/40 backdrop-blur-sm opacity-60 border border-slate-700/30"
                            )}
                            style={{
                                boxShadow: canInteract
                                    ? '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(255, 255, 255, 0.05)'
                                    : '0 4px 15px rgba(0, 0, 0, 0.3)',
                                maxWidth: '280px'
                            }}
                            whileHover={canInteract ? { scale: 1.02, y: -2 } : undefined}
                            whileTap={canInteract ? { scale: 0.98 } : undefined}
                        >
                            {/* Premium Shimmer Overlay */}
                            <motion.div
                                className="absolute inset-0 z-0 pointer-events-none"
                                initial={{ x: '-100%' }}
                                animate={{ x: '250%' }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    repeatDelay: 2
                                }}
                                style={{
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                                }}
                            />

                            {/* Left Arrow - pointing to draw pile */}
                            {isDrawPhase && canInteract && (
                                <motion.div
                                    className="text-emerald-400 font-black flex items-center relative z-20"
                                    animate={{
                                        x: [-2, 2, -2],
                                        opacity: [0.7, 1, 0.7],
                                        filter: ["drop-shadow(0 0 2px rgba(52, 211, 153, 0.3))", "drop-shadow(0 0 8px rgba(52, 211, 153, 0.6))", "drop-shadow(0 0 2px rgba(52, 211, 153, 0.3))"]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <ArrowLeft strokeWidth={2.5} className="h-5 w-5" />
                                </motion.div>
                            )}

                            {/* Label area */}
                            <div className="flex items-center justify-center relative z-20 mx-2">
                                <span className={cn(
                                    "font-black text-white uppercase tracking-[0.2em] whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]",
                                    (instructionText?.includes('DERNIER TOUR') || isAIThinking) ? "text-[11px] animate-pulse" : (instructionText ? "text-[11px]" : "text-[10px]")
                                )}>
                                    {instructionText?.includes('DERNIER TOUR')
                                        ? instructionText
                                        : (isDrawPhase && canInteract ? 'CHOISIR UNE CARTE' : (instructionText || 'Piocher'))}
                                </span>
                            </div>

                            {/* Right Arrow - pointing to discard pile */}
                            {isDrawPhase && canInteract && (
                                <motion.div
                                    className="text-amber-400 font-black flex items-center relative z-20"
                                    animate={{
                                        x: [2, -2, 2],
                                        opacity: [0.7, 1, 0.7],
                                        filter: ["drop-shadow(0 0 2px rgba(245, 158, 11, 0.3))", "drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))", "drop-shadow(0 0 2px rgba(245, 158, 11, 0.3))"]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <ArrowRight strokeWidth={2.5} className="h-5 w-5" />
                                </motion.div>
                            )}
                        </motion.button>
                    )}

                    {/* Discard card preview - positioned to the right - CLICKABLE */}
                    {/* Always render a placeholder to keep alignment symmetric if user wants "aligned all time" */}
                    <div className="w-10 h-14 flex items-center justify-center shrink-0 relative">
                        {showDiscardPreview ? (
                            <motion.div
                                className={cn(
                                    "w-full h-full rounded-lg flex items-center justify-center relative overflow-hidden",
                                    canInteract ? "cursor-pointer" : "cursor-default"
                                )}
                                style={{
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    boxShadow: activeActionSource === 'discard-pile'
                                        ? '0 0 20px 5px rgba(245, 158, 11, 0.7)' // Amber Glow
                                        : '0 4px 12px rgba(0,0,0,0.5)',
                                    border: activeActionSource === 'discard-pile'
                                        ? '2px solid #f59e0b' // Amber border
                                        : '2px solid rgba(255,255,255,0.5)',
                                    background: mosaicColors.secondary,
                                    transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
                                    // Prevent text selection on long-press (mobile)
                                    userSelect: 'none',
                                    WebkitUserSelect: 'none',
                                    WebkitTouchCallout: 'none',
                                    touchAction: 'manipulation',
                                }}
                                onClick={canInteract ? () => { triggerHaptic(); (onDiscardAction || onClick)?.(); } : undefined}
                                onPointerDown={handleDiscardPointerDown}
                                onPointerUp={handleDiscardPointerUp}
                                onPointerLeave={handleDiscardPointerLeave}
                                onPointerCancel={handleDiscardPointerUp}
                                whileHover={canInteract ? { scale: 1.1, rotate: 5 } : undefined}
                                whileTap={canInteract ? { scale: 0.95 } : undefined}
                                animate={activeActionSource === 'discard-pile' ? { scale: [1, 1.1, 1] } : {}}
                                transition={{ duration: 0.8, repeat: Infinity }}
                                id="discard-pile"
                            >
                                {/* Mosaic texture pattern */}
                                <MiniMosaicPattern colors={mosaicColors} id={patternId} />

                                {/* Card value - white text */}
                                <span
                                    className="relative z-10"
                                    style={{
                                        color: '#ffffff',
                                        textShadow: '1px 1px 3px rgba(0,0,0,0.5)',
                                    }}
                                >
                                    {discardTop.specialType === 'S' || discardTop.value === 15
                                        ? 'S'
                                        : (discardTop.specialType === 'C' || (discardTop.value === 0 && discardTop.color === 'special'))
                                            ? <Sparkles className="w-5 h-5 text-white" strokeWidth={3} />
                                            : (discardTop.specialType === 'CH' || discardTop.value === 'CH' || discardTop.color === 'gold')
                                                ? <HelpCircle className="w-5 h-5 text-white" strokeWidth={3} />
                                                : discardTop.value}
                                </span>

                                {/* Discard Pile Count Badge */}
                                <div className="absolute -bottom-2 -right-2 bg-slate-800 text-slate-300 text-[9px] px-1.5 py-0.5 rounded-full border border-slate-600 shadow-md z-20">
                                    {discardPileCount}
                                </div>
                            </motion.div>
                        ) : (
                            /* Empty placeholder when no discard visible to maintain symmetry if desired */
                            <div className="w-full h-full rounded-lg border-2 border-dashed border-slate-700/50 flex items-center justify-center">
                                <span className="text-[9px] text-slate-600">{discardPileCount}</span>
                            </div>
                        )}
                    </div>
                </div>

                {hasDrawnCard && (
                    // Helper text below the cards
                    <div className="whitespace-nowrap flex flex-col items-center gap-1 animate-in fade-in slide-in-from-top-2">
                        <span className={cn(
                            "text-[12px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border shadow-lg backdrop-blur-sm transition-colors duration-300",
                            drawnCardSource === 'discard'
                                ? "bg-amber-500/30 border-amber-500/50 text-amber-300 shadow-amber-500/10"
                                : (drawnCardSource === 'pile'
                                    ? "bg-emerald-500/30 border-emerald-500/50 text-emerald-300 shadow-emerald-500/10"
                                    : (turnPhase === 'MUST_REPLACE'
                                        ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                                        : "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"))
                        )}>
                            {drawnCardSource === 'pile' ? 'Pris dans la pioche' : (drawnCardSource === 'discard' ? 'Pris dans la défausse' : (instructionText || (turnPhase === 'MUST_REPLACE' ? 'Pris dans la défausse' : 'Pris dans la pioche')))}
                        </span>
                    </div>
                )}
            </div >

            {/* Discard History Overlay */}
            < DiscardHistoryOverlay
                cards={discardPile}
                isVisible={showHistory}
                onClose={handleDiscardPointerUp}
            />
        </>
    );
});

export default DrawDiscardTrigger;

