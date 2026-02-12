import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw } from 'lucide-react';
import PlayerHand from './PlayerHand';

/**
 * SandboxBoard
 * A self-contained game view for testing animations and effects.
 * 
 * @param {boolean} isOpen - Whether the sandbox is visible
 * @param {function} onClose - Function to close the sandbox
 * @param {boolean} autoTrigger - Whether to auto-trigger the effect on mount
 */
const SandboxBoard = ({ isOpen, onClose, autoTrigger = false }) => {
    // Mock Player State
    const [mockPlayer, setMockPlayer] = useState({
        id: 'sandbox-player',
        name: 'Simulateur',
        avatarId: '1',
        hand: Array(12).fill(null), // Start empty
        isBot: false
    });

    const [status, setStatus] = useState('Prêt');

    // Helper to generate a dummy card
    const createDummyCard = (id, val = 5) => ({
        id: `card-${id}-${Date.now()}`,
        value: val,
        color: 'yellow',
        isRevealed: true
    });

    // Sequence: Fill Column -> Wait -> Clear Column
    const runCleanSequence = useCallback(() => {
        setStatus('Préparation de la colonne...');

        // 1. Fill Column 1 (indexes 1, 4, 7)
        // Let's use Column 2 (indexes 1, 4, 7) for better visibility (centered-ish)
        // Or Column 1 (0, 1, 2 ? No, skyjo is col-first in data but grid is row-col?)
        // PlayerHand.jsx says: getCardIndex = (row, col) => col * 3 + row;
        // So Column 0 is indices 0, 1, 2.

        const filledHand = [...mockPlayer.hand];
        [0, 1, 2].forEach(i => {
            filledHand[i] = createDummyCard(i, 8); // Value 8 (Yellow)
        });

        setMockPlayer(prev => ({ ...prev, hand: filledHand }));

        // 2. Clear after delay
        setTimeout(() => {
            setStatus('Nettoyage ! 💥');
            const clearedHand = [...filledHand];
            [0, 1, 2].forEach(i => {
                clearedHand[i] = null;
            });
            setMockPlayer(prev => ({ ...prev, hand: clearedHand }));

            setTimeout(() => setStatus('Terminé'), 1500);
        }, 800); // 800ms wait to see the cards before they vanish
    }, []);

    // Auto-run effect when opened
    useEffect(() => {
        if (isOpen && autoTrigger) {
            // Small delay to let the modal animation finish
            const timer = setTimeout(() => {
                runCleanSequence();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isOpen, autoTrigger, runCleanSequence]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-visible flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                        <h3 className="text-white font-bold">Environnement de Test</h3>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {status}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Game Area */}
                <div className="p-8 bg-[url('/textures/felt.png')] bg-slate-900/80 flex flex-col items-center justify-center min-h-[400px] relative">

                    {/* The Player Hand Component */}
                    <div className="scale-125 transform transition-transform">
                        <PlayerHand
                            player={mockPlayer}
                            isCurrentPlayer={true}
                            isLocalPlayer={true}
                            canInteract={false} // Disable interaction, just visual
                        />
                    </div>

                    <div className="mt-12 flex gap-4">
                        <button
                            onClick={runCleanSequence}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold shadow-lg hover:shadow-indigo-500/25 transition-all active:scale-95"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Relancer l'effet
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SandboxBoard;
