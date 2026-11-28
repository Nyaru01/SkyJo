import { memo } from 'react';
import { motion as Motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import SkyjoCard from './SkyjoCard';
import { useGameStore } from '../../store/gameStore';
import { getCardSkinPath } from '../../lib/skinUtils';
import DiscardHistoryOverlay from './DiscardHistoryOverlay';
import { useDiscardHistory } from '../../hooks/useDiscardHistory';

// Simple haptic feedback for pile touches
const triggerHaptic = (duration = 50) => {
    if (navigator.vibrate) {
        navigator.vibrate(duration);
    }
};

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
    isAIThinking = false,
    drawnCardSource = null,
    recapText = '', // Dernier coup de l'IA, en clair
    drawnCardInPopup = false, // La fenêtre de pioche montre déjà la carte : on la masque ici (sinon deux cartes à l'écran)
}) {
    const cardSkin = useGameStore(s => (s && s.cardSkin) ? s.cardSkin : 'classic');

    const hasDrawnCard = !!drawnCard;
    // Logique Visibilité Défausse (Mode H included)
    // Permet l'affichage pour Normal, Difficile ET H
    const showDiscardPreview = discardTop && !hasDrawnCard;

    const { showHistory, openHistory, closeHistory, pressHandlers } = useDiscardHistory(
        discardPile.length,
        canInteract ? () => { triggerHaptic(); (onDiscardAction || onClick)?.(); } : undefined,
        () => triggerHaptic(30),
    );

    // Determine button state
    const isDrawPhase = turnPhase === 'DRAW';
    // À votre tour de piocher, les deux piles parlent d'elles-mêmes : pas de bouton « Piochez ou prenez la défausse ».
    const hideDrawLabel = isDrawPhase && canInteract;

    return (
        <>
            <div className="skyjo-pile-wrap relative flex flex-col items-center gap-1 w-full">
                <div className={cn('skyjo-pile-zone relative flex items-center justify-center gap-3 w-full', !hasDrawnCard && 'skyjo-pile-zone--choosing')}>
                    {/* Draw pile section */}
                    <div className="skyjo-pile-group skyjo-pile-group--draw relative flex flex-col items-center gap-1.5 shrink-0">
                        <span className="skyjo-pile-label">Pioche</span>
                        <Motion.div
                            className={cn(
                                "skyjo-draw-pile w-10 h-14 rounded-lg flex items-center justify-center relative",
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
                            <img
                                src={getCardSkinPath(cardSkin)}
                                alt="Deck"
                                className="w-full h-full object-cover"
                            />
                        </Motion.div>
                        <span aria-label={`${drawPileCount} cartes dans la pioche`} className="skyjo-pile-count text-[11px] font-black text-white/90 bg-slate-900/60 px-2 py-0.5 rounded-md border border-white/10 backdrop-blur-sm min-w-[20px] text-center shadow-lg uppercase tracking-widest">
                            {drawPileCount}
                        </span>
                    </div>

                    {hasDrawnCard ? (
                        // Show the actual drawn card in the center
                        <div className="flex flex-col items-center gap-1.5">
                            <Motion.div
                                className={cn(
                                    "relative z-10",
                                    canInteract ? "cursor-pointer" : "cursor-default"
                                )}
                                onClick={onClick}
                                whileHover={canInteract ? { scale: 1.05 } : undefined}
                                whileTap={canInteract ? { scale: 0.95 } : undefined}
                                id="drawn-card-slot"
                                style={drawnCardInPopup ? { visibility: 'hidden' } : undefined}
                                aria-hidden={drawnCardInPopup || undefined}
                            >
                                <SkyjoCard
                                    card={{ ...drawnCard, isRevealed: true }}
                                    size="md"
                                    isHighlighted={canInteract}
                                />
                            </Motion.div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0 max-w-[240px]">
                            {!hideDrawLabel && <Motion.button
                                onClick={onClick}
                                disabled={!canInteract}
                                className={cn(
                                    "skyjo-draw-button flex items-center justify-center gap-3 w-full h-14 px-2 py-1.5 rounded-xl transition-all relative z-10 overflow-hidden",
                                    canInteract
                                        ? (instructionText && turnPhase === 'MUST_REVEAL' ? "cursor-default bg-indigo-600/80 backdrop-blur-md border border-indigo-400/50" : "cursor-pointer bg-slate-800/80 backdrop-blur-md hover:bg-slate-700/80 border border-emerald-500/50")
                                        : "cursor-not-allowed bg-slate-800/40 backdrop-blur-sm opacity-60 border border-slate-700/30",
                                    !canInteract && 'skyjo-draw-button--waiting'
                                )}
                                style={{
                                    boxShadow: canInteract
                                        ? '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(255, 255, 255, 0.05)'
                                        : '0 4px 15px rgba(0, 0, 0, 0.3)',
                                }}
                                whileHover={canInteract ? { scale: 1.02, y: -2 } : undefined}
                                whileTap={canInteract ? { scale: 0.98 } : undefined}
                            >
                                {/* Premium Shimmer Overlay */}
                                <Motion.div
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
                                    <Motion.div
                                        className="text-emerald-400 font-black flex items-center relative z-20"
                                        animate={{
                                            x: [-2, 2, -2],
                                            opacity: [0.7, 1, 0.7],
                                            filter: ["drop-shadow(0 0 2px rgba(52, 211, 153, 0.3))", "drop-shadow(0 0 8px rgba(52, 211, 153, 0.6))", "drop-shadow(0 0 2px rgba(52, 211, 153, 0.3))"]
                                        }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <ArrowLeft strokeWidth={2.5} className="h-5 w-5" />
                                    </Motion.div>
                                )}

                                {/* Label area */}
                                <div className="flex items-center justify-center relative z-20 mx-2">
                                    <span className={cn(
                                        "font-black text-white uppercase tracking-[0.2em] whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]",
                                        isAIThinking ? "text-[11px] animate-pulse" : "text-[11px]"
                                    )}>
                                        {isAIThinking ? 'L’IA réfléchit' : (instructionText || 'Piocher')}
                                    </span>
                                    {!canInteract && isAIThinking && (
                                        <span className="skyjo-thinking-dots" aria-hidden="true"><i /><i /><i /></span>
                                    )}
                                </div>

                                {/* Right Arrow - pointing to discard pile */}
                                {isDrawPhase && canInteract && (
                                    <Motion.div
                                        className="text-amber-400 font-black flex items-center relative z-20"
                                        animate={{
                                            x: [2, -2, 2],
                                            opacity: [0.7, 1, 0.7],
                                            filter: ["drop-shadow(0 0 2px rgba(245, 158, 11, 0.3))", "drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))", "drop-shadow(0 0 2px rgba(245, 158, 11, 0.3))"]
                                        }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <ArrowRight strokeWidth={2.5} className="h-5 w-5" />
                                    </Motion.div>
                                )}
                            </Motion.button>}
                            {/* Dernier coup de l’IA, sous le bouton (hors du cadre, pour ne pas être rogné) */}
                            {hideDrawLabel && <div className="skyjo-turn-cue" role="status" aria-label="À vous : piochez ou prenez la défausse"><i className="skyjo-cue-arrow skyjo-cue-arrow--l" aria-hidden="true" /><span><small>Votre tour</small>À vous</span><i className="skyjo-cue-arrow skyjo-cue-arrow--r" aria-hidden="true" /></div>}
                            {recapText && <p className="skyjo-ai-recap">{recapText}</p>}
                        </div>
                    )}

                    {/* Discard pile section */}
                    <div className="skyjo-pile-group skyjo-pile-group--discard relative flex flex-col items-center gap-1.5 shrink-0">
                        <span className="skyjo-pile-label">Défausse</span>
                        <div className="w-10 h-14 flex items-center justify-center relative">
                            {showDiscardPreview ? (
                                <Motion.div
                                    className={cn(
                                        "w-full h-full rounded-lg flex items-center justify-center relative overflow-hidden",
                                        canInteract ? "cursor-pointer" : "cursor-default"
                                    )}
                                    style={{
                                        boxShadow: activeActionSource === 'discard-pile'
                                            ? '0 0 20px 5px rgba(245, 158, 11, 0.7)' // Amber Glow
                                            : '0 4px 12px rgba(0,0,0,0.5)',
                                        outline: activeActionSource === 'discard-pile' ? '2px solid #f59e0b' : undefined,
                                        transition: 'box-shadow 0.3s ease',
                                        userSelect: 'none',
                                        WebkitUserSelect: 'none',
                                        WebkitTouchCallout: 'none',
                                        touchAction: 'manipulation',
                                    }}
                                    {...pressHandlers}
                                    whileHover={canInteract ? { scale: 1.1, rotate: 5 } : undefined}
                                    whileTap={canInteract ? { scale: 0.95 } : undefined}
                                    animate={activeActionSource === 'discard-pile' ? { scale: [1, 1.1, 1] } : {}}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                    id="discard-pile"
                                >
                                    <SkyjoCard card={{ ...discardTop, isRevealed: true }} size="xs" style={{ width: "100%", height: "100%" }} />
                                </Motion.div>
                            ) : (
                                <div className="skyjo-empty-pile w-full h-full rounded-lg border-2 border-dashed border-slate-700/50 flex items-center justify-center" />
                            )}
                        </div>
                        <button type="button" onClick={openHistory} disabled={!discardPile.length} aria-haspopup="dialog" aria-label={`Consulter la défausse, ${discardPileCount} carte${discardPileCount === 1 ? '' : 's'}`} className="skyjo-discard-history-trigger skyjo-pile-count text-[11px] font-black text-white/90 bg-slate-900/60 px-2 py-0.5 rounded-md border border-white/10 backdrop-blur-sm min-w-[20px] text-center shadow-lg uppercase tracking-widest">
                            {discardPileCount}
                        </button>
                    </div>
                </div>

                {hasDrawnCard && (
                    // Helper text below the cards
                    <div className="skyjo-card-source-wrap whitespace-nowrap flex flex-col items-center gap-1 animate-in fade-in">
                        <span className={cn(
                            "skyjo-card-source text-[12px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border shadow-lg backdrop-blur-sm transition-colors duration-300",
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
            <DiscardHistoryOverlay
                cards={discardPile}
                isVisible={showHistory}
                onClose={closeHistory}
            />
        </>
    );
});

export default DrawDiscardTrigger;
