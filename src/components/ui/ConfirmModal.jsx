import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirmation",
    message = "Êtes-vous sûr ?",
    confirmText = "Confirmer",
    cancelText = "Annuler",
    variant = "danger"
}) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                    />

                    {/* Modal Content - Ultra Soft Glass */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 30 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-sm bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] overflow-hidden z-10"
                    >
                        {/* Ambient Glow Background */}
                        <div className={cn(
                            "absolute -top-24 -left-24 w-48 h-48 blur-[80px] rounded-full pointer-events-none opacity-20",
                            variant === 'danger' ? "bg-rose-500" : "bg-emerald-500"
                        )} />

                        <div className="p-10 pt-12">
                            {/* Abstract Icon Container */}
                            <div className="flex flex-col items-center text-center">
                                <div className={cn(
                                    "w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 relative group",
                                    variant === 'danger'
                                        ? "bg-rose-500/5 border border-rose-500/10"
                                        : "bg-emerald-500/5 border border-emerald-500/10"
                                )}>
                                    {/* Pulsing Aura */}
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                        className={cn(
                                            "absolute inset-0 rounded-[2rem] blur-xl",
                                            variant === 'danger' ? "bg-rose-500" : "bg-emerald-500"
                                        )}
                                    />
                                    <AlertTriangle className={cn(
                                        "h-8 w-8 relative z-10",
                                        variant === 'danger' ? "text-rose-400" : "text-emerald-400"
                                    )} />
                                </div>

                                <h3 className="text-3xl font-black text-white tracking-tighter leading-tight mb-3">
                                    {title}
                                </h3>
                                <p className="text-slate-400 text-base font-medium leading-relaxed max-w-[240px]">
                                    {message}
                                </p>
                            </div>

                            <div className="flex flex-col gap-4 mt-10">
                                <Button
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className={cn(
                                        "w-full rounded-[1.8rem] h-14 font-black text-xl shadow-2xl transition-all active:scale-95 relative overflow-hidden group border-none",
                                        variant === 'danger'
                                            ? "bg-gradient-to-r from-rose-400 via-rose-500 to-rose-600 text-white shadow-rose-500/40"
                                            : "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 text-white shadow-emerald-500/40"
                                    )}
                                >
                                    {/* Glass Shine Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                    {confirmText}
                                </Button>

                                <button
                                    onClick={onClose}
                                    className="w-full h-12 text-slate-400 font-black hover:text-white transition-all text-xs uppercase tracking-[0.3em]"
                                >
                                    {cancelText}
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-1 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
