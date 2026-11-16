import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Skull, RefreshCw, Eraser, Sparkles, Orbit, Flame } from 'lucide-react';
import SkyjoCard from './SkyjoCard';
import { FuryCard } from './FuryUI';
import { cn } from '../../lib/utils';
import '../../styles/DrawPopup.css';

// Simple haptic feedback function
const triggerHaptic = (pattern = 30) => {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};

/**
 * Draw/Discard Popup Modal
 * Full-screen modal with blur backdrop for draw/discard actions
 */
const DrawDiscardPopup = memo(function DrawDiscardPopup({
    isOpen,
    onClose,
    drawPileCount,
    discardPileCount,
    discardTop,
    discardPile = [], // Full discard pile for history
    drawnCard,
    canDraw = false,
    canTakeDiscard = false,
    canDiscardDrawn = false,
    onDrawClick,
    onDiscardClick,
    onDiscardDrawnCard,
    onConfirmPlacement,
    onUseAction,
    isBonusMode = false,
    isLoading = false,
    // Mode Fury : carte(s) Fury tirée(s) avec cette pioche, montrées dans la même fenêtre que la carte piochée.
    furyCards = [],
}) {
    const withFury = furyCards.length > 0;
    // Draw a card but DON'T close popup - let user decide to discard or place on grid
    const handleDrawClick = () => {
        triggerHaptic(40);
        onDrawClick?.();
        // Popup stays open to show drawn card and allow discard option
    };

    const handleDiscardClick = () => {
        triggerHaptic(40);
        onDiscardClick?.();
        // Popup stays open to show drawn card
    };

    const handleConfirmPlacement = () => {
        triggerHaptic([30, 50, 30]); // Double tap feedback for confirmation
        // Explicitly confirm placement - calls parent handler to close WITHOUT undoing
        onConfirmPlacement?.();
    };

    const handleDiscardDrawnCard = () => {
        triggerHaptic(50);
        onDiscardDrawnCard?.();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, pointerEvents: 'none' }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    onClick={() => {
                        if (isBonusMode && drawnCard?.value === 20) return; // Prevent backdrop close
                        onClose();
                    }}
                >
                    {/* Blur backdrop - darkened for better contrast while keeping low blur */}
                    <div
                        className={cn("absolute inset-0", drawnCard ? "bg-black/20" : "bg-black/45")}
                        style={{
                            backdropFilter: 'blur(1.5px)',
                            WebkitBackdropFilter: 'blur(1.5px)',
                        }}
                    />

                    {/* Modal content - vertically centered */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: drawnCard ? 64 : 50 }}
                        exit={{ scale: 0.9, opacity: 0, y: 30 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={cn("relative z-10 w-full mx-3 flex flex-col items-center justify-center overflow-hidden", drawnCard ? "dd-panel" : "p-6 rounded-[2.5rem] max-w-sm")}
                        style={drawnCard ? undefined : {
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                            minHeight: '300px',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* DRAWN CARD VIEW - Clean, centered layout */}
                        {drawnCard ? (
                            <div className={cn("dd-compact", withFury && "dd-compact--fury")}>
                                {/* Cartes : la Fury (vers la réserve) puis la carte à jouer */}
                                <div className="dd-cards">
                                    {furyCards.map((c, i) => (
                                        <motion.figure key={c.id} className="dd-fury"
                                            initial={{ opacity: 0, y: 10, rotate: -8 }} animate={{ opacity: 1, y: 0, rotate: -5 }}
                                            transition={{ duration: 0.4, delay: 0.05 + i * 0.1, ease: [0.2, 0.8, 0.25, 1] }}>
                                            <FuryCard type={c.furyType} size="mini" />
                                            <figcaption><Flame className="w-3 h-3" aria-hidden="true" />Réserve</figcaption>
                                        </motion.figure>
                                    ))}
                                    <motion.figure className="dd-main"
                                        initial={withFury ? { opacity: 0, y: 10 } : false} animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: withFury ? 0.18 : 0, ease: [0.2, 0.8, 0.25, 1] }}>
                                        <SkyjoCard card={drawnCard} size="md" isHighlighted />
                                        {withFury && <figcaption>À jouer</figcaption>}
                                    </motion.figure>
                                </div>

                                <div className="dd-side">
                                    <h3 className="dd-title">
                                        {(isBonusMode && drawnCard?.value === 20) ? (
                                            <span className="text-red-400 flex items-center gap-1.5"><Skull className="w-4 h-4" />Obligé de poser</span>
                                        ) : (drawnCard.specialType === 'S') ? (
                                            <span className="text-indigo-300 flex items-center gap-1.5"><RefreshCw className="w-4 h-4" />Échange possible</span>
                                        ) : (drawnCard.specialType === 'C') ? (
                                            <span className="text-emerald-300 flex items-center gap-1.5"><Sparkles className="w-4 h-4" />Joker nettoyage</span>
                                        ) : (drawnCard.specialType === 'H') ? (
                                            <span className="text-slate-200 flex items-center gap-1.5"><Orbit className="w-4 h-4" />Trou noir</span>
                                        ) : withFury ? (
                                            <span className="flex items-center gap-1.5 text-[#ffcbb0]"><Flame className="w-4 h-4 text-[#ff8a55]" />Deux cartes</span>
                                        ) : 'Carte en main'}
                                    </h3>
                                    {drawnCard.specialType === 'S' && <p className="dd-note">Échangez une de vos cartes avec un adversaire.</p>}
                                    {drawnCard.specialType === 'C' && <p className="dd-note">Complète une colonne pour la supprimer.</p>}
                                    {drawnCard.specialType === 'H' && <p className="dd-note">Aspire la défausse sous la pioche.</p>}
                                    {withFury && <p className="dd-note">La Fury va dans votre réserve.</p>}

                                    <div className="dd-actions">
                                        {drawnCard.specialType === 'S' ? (
                                            <button type="button" onClick={onUseAction} className="dd-btn dd-btn--swap"><RefreshCw className="w-4 h-4" />Échanger</button>
                                        ) : drawnCard.specialType === 'H' ? (
                                            <button type="button" onClick={onUseAction} className="dd-btn dd-btn--hole"><Orbit className="w-4 h-4" />Aspirer</button>
                                        ) : <>
                                            <button type="button" onClick={handleConfirmPlacement} className="dd-btn dd-btn--place">Placer</button>
                                            {canDiscardDrawn && <button type="button" onClick={handleDiscardDrawnCard} disabled={(isBonusMode && drawnCard?.value === 20)} className="dd-btn dd-btn--discard">Défausser</button>}
                                        </>}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* DRAW OPTIONS VIEW - Pioche and Défausse side by side */
                            <>
                                {/* Header */}
                                <h3 className="text-lg font-bold text-white mb-6">
                                    {isLoading ? "🔄 Synchronisation..." : "📥 Choisissez une carte"}
                                </h3>

                                <div className={cn("flex items-start justify-center gap-8", isLoading && "opacity-50 pointer-events-none")}>
                                    {/* Draw pile */}
                                    <div className="flex flex-col items-center gap-3">
                                        <motion.button
                                            onClick={handleDrawClick}
                                            disabled={!canDraw}
                                            className={cn(
                                                "relative rounded-xl transition-all",
                                                canDraw ? "cursor-pointer" : "cursor-not-allowed opacity-40"
                                            )}
                                            whileHover={canDraw ? { scale: 1.08, y: -4 } : undefined}
                                            whileTap={canDraw ? { scale: 0.95 } : undefined}
                                        >
                                            {/* 3D Stack effect */}
                                            <div className="relative">
                                                <div
                                                    className="absolute rounded-xl bg-slate-700"
                                                    style={{ width: '70px', height: '98px', top: '5px', left: '5px' }}
                                                />
                                                <div
                                                    className="absolute rounded-xl bg-slate-600"
                                                    style={{ width: '70px', height: '98px', top: '2.5px', left: '2.5px' }}
                                                />
                                                <div
                                                    className="relative flex items-center justify-center rounded-xl"
                                                    style={{
                                                        width: '70px',
                                                        height: '98px',
                                                        background: 'linear-gradient(135deg, #374151 0%, #1e293b 50%, #0f172a 100%)',
                                                        border: canDraw ? '2px solid rgba(52, 211, 153, 0.7)' : '1px solid rgba(100, 116, 139, 0.3)',
                                                        boxShadow: canDraw ? '0 0 25px rgba(52, 211, 153, 0.5)' : 'none',
                                                    }}
                                                >
                                                    <svg className="w-10 h-10 text-emerald-400" viewBox="0 0 24 24" fill="none">
                                                        <rect x="4" y="2" width="10" height="14" rx="2" fill="#475569" stroke="#64748b" strokeWidth="0.5" />
                                                        <rect x="7" y="5" width="10" height="14" rx="2" fill="#334155" stroke="#475569" strokeWidth="0.5" />
                                                        <rect x="10" y="8" width="10" height="14" rx="2" fill="currentColor" stroke="currentColor" strokeWidth="0.5" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </motion.button>
                                        <span className="text-sm font-bold text-slate-300">
                                            Pioche <span className="text-emerald-400">({drawPileCount})</span>
                                        </span>
                                        {canDraw && (
                                            <motion.button
                                                onClick={handleDrawClick}
                                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-full transition-colors shadow-lg"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                Piocher
                                            </motion.button>
                                        )}
                                    </div>

                                    {/* Discard pile */}
                                    <div className="flex flex-col items-center gap-3">
                                        <motion.button
                                            onClick={handleDiscardClick}
                                            disabled={!canTakeDiscard}
                                            className={cn(
                                                "relative rounded-xl transition-all",
                                                canTakeDiscard ? "cursor-pointer" : "cursor-not-allowed opacity-40"
                                            )}
                                            whileHover={canTakeDiscard ? { scale: 1.08, y: -4 } : undefined}
                                            whileTap={canTakeDiscard ? { scale: 0.95 } : undefined}
                                        >
                                            {discardTop ? (
                                                <div className={cn(
                                                    "rounded-xl",
                                                    canTakeDiscard && "ring-2 ring-blue-400 shadow-xl"
                                                )}>
                                                    <SkyjoCard card={discardTop} size="lg" />
                                                </div>
                                            ) : (
                                                <div
                                                    className="flex flex-col items-center justify-center rounded-xl"
                                                    style={{
                                                        width: '70px',
                                                        height: '98px',
                                                        background: 'rgba(71, 85, 105, 0.2)',
                                                        border: '2px dashed rgba(100, 116, 139, 0.4)',
                                                    }}
                                                >
                                                    <svg className="w-6 h-6 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M12 5v14M5 12l7 7 7-7" />
                                                    </svg>
                                                    <span className="text-[9px] text-slate-500 mt-1">Vide</span>
                                                </div>
                                            )}
                                        </motion.button>
                                        <span className="text-sm font-bold text-slate-300">
                                            Défausse <span className="text-blue-400">({discardPileCount})</span>
                                        </span>
                                        {canTakeDiscard && (
                                            <motion.button
                                                onClick={handleDiscardClick}
                                                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-full transition-colors shadow-lg"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                Récupérer
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Close button - always visible unless cursed */}
                        {!(isBonusMode && drawnCard?.value === 20) && (
                            <button
                                onClick={onClose}
                                className={cn("absolute flex items-center justify-center rounded-full bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-white transition-colors", drawnCard ? "top-2 right-2 w-7 h-7 text-xs" : "top-3 right-3 w-8 h-8")}
                            >
                                ✕
                            </button>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

export default DrawDiscardPopup;
