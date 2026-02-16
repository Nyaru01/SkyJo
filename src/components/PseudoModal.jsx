import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { cn } from '../lib/utils';

/**
 * Pseudo Entry Modal
 * A premium modal to invite users to enter a valid pseudo.
 */
export default function PseudoModal({ isOpen, onClose, onConfirm, initialValue = '' }) {
    const [pseudo, setPseudo] = useState(initialValue);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setPseudo(initialValue === 'Joueur' ? '' : initialValue);
            setError('');
        }
    }, [isOpen, initialValue]);

    const handleConfirm = () => {
        const trimmed = pseudo.trim();
        if (!trimmed) {
            setError('Veuillez entrer un pseudo');
            return;
        }
        if (trimmed.toLowerCase() === 'joueur') {
            setError('Ce pseudo est réservé');
            return;
        }
        onConfirm(trimmed);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-sm:max-w-[320px] max-w-sm glass-premium dark:glass-dark rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden p-8"
                    >
                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <Bot className="w-8 h-8 text-white" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-white tracking-tight uppercase">Indique ton pseudo</h3>
                                <p className="text-xs text-slate-400 font-medium">Choisis un nom unique pour commencer l'aventure !</p>
                            </div>

                            <div className="w-full space-y-4">
                                <div className="space-y-1.5">
                                    <Input
                                        value={pseudo}
                                        onChange={(e) => {
                                            setPseudo(e.target.value);
                                            setError('');
                                        }}
                                        placeholder="Ton pseudo..."
                                        className={cn(
                                            "h-14 bg-white/5 border-white/10 rounded-2xl text-center text-lg font-bold placeholder:text-slate-600 focus:ring-2 focus:ring-purple-500/50 transition-all",
                                            error && "border-red-500/50 focus:ring-red-500/50"
                                        )}
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                                    />
                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-[10px] font-bold text-red-500 uppercase tracking-widest"
                                        >
                                            {error}
                                        </motion.p>
                                    )}
                                </div>

                                <Button
                                    onClick={handleConfirm}
                                    className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-2xl font-black text-lg shadow-xl shadow-purple-500/25 active:scale-[0.98] transition-all"
                                >
                                    C'EST PARTI !
                                </Button>

                                <button
                                    onClick={onClose}
                                    className="text-[10px] font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors"
                                >
                                    Plus tard
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
