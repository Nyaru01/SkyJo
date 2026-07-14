import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';
import ModalShell, { ModalCloseButton } from './ModalShell';

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
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            labelledBy="confirm-modal-title"
            describedBy="confirm-modal-message"
            maxWidth="max-w-sm"
            zIndex="z-[100]"
        >
                        {/* Ambient Glow Background */}
                        <div className={cn(
                            "absolute -top-20 -left-20 w-40 h-40 blur-[70px] rounded-full pointer-events-none opacity-15",
                            variant === 'danger' ? "bg-rose-500" : "bg-emerald-500"
                        )} />

                        <div className="p-6 pt-8 sm:p-8 sm:pt-10">
                            {/* Abstract Icon Container */}
                            <div className="flex flex-col items-center text-center">
                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center mb-5 relative",
                                    variant === 'danger'
                                        ? "bg-rose-500/10 border border-rose-500/20"
                                        : "bg-emerald-500/10 border border-emerald-500/20"
                                )}>
                                    <AlertTriangle className={cn(
                                        "h-7 w-7 relative z-10",
                                        variant === 'danger' ? "text-rose-400" : "text-emerald-400"
                                    )} />
                                </div>

                                <h3 id="confirm-modal-title" className="text-2xl font-black text-white tracking-tight leading-tight mb-2">
                                    {title}
                                </h3>
                                <p id="confirm-modal-message" className="text-slate-400 text-sm sm:text-base font-medium leading-relaxed max-w-[260px]">
                                    {message}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 mt-8">
                                <Button
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className={cn(
                                        "premium-focus-ring w-full rounded-2xl h-[3.25rem] font-black text-base shadow-lg transition-all active:scale-[0.98] relative overflow-hidden group border-none",
                                        variant === 'danger'
                                            ? "bg-gradient-to-r from-rose-400 via-rose-500 to-rose-600 text-white shadow-rose-500/40"
                                            : "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 text-white shadow-emerald-500/40"
                                    )}
                                >
                                    {confirmText}
                                </Button>

                                <button
                                    onClick={onClose}
                                    className="premium-focus-ring w-full h-12 rounded-xl text-slate-400 font-bold hover:text-white hover:bg-white/5 transition-all text-xs uppercase tracking-[0.16em]"
                                >
                                    {cancelText}
                                </button>
                            </div>
                        </div>

                        <ModalCloseButton onClick={onClose} className="absolute top-3 right-3" />
        </ModalShell>
    );
}
