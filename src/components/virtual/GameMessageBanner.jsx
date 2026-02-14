import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, AlertCircle, RefreshCw, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * GameMessageBanner - A premium notification banner for game instructions.
 * Replaces intrusive toasts for persistent game state messages.
 */
const GameMessageBanner = ({ message, type = 'info' }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [message]);

    const getIcon = () => {
        if (!message) return null;
        const msg = message.toLowerCase();
        if (msg.includes('échange') || msg.includes('swap')) return <RefreshCw className="w-4 h-4 text-purple-400" />;
        if (msg.includes('pioche') || msg.includes('défausse')) return <Zap className="w-4 h-4 text-amber-400" />;
        if (msg.includes('votre tour')) return <Info className="w-4 h-4 text-cyan-400" />;
        return <Info className="w-4 h-4 text-blue-400" />;
    };

    return (
        <div className="absolute inset-x-0 top-[55%] -translate-y-1/2 z-[60] w-full pointer-events-none px-4">
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 5 }}
                        className={cn(
                            "mx-auto flex flex-col items-center text-center gap-2 px-8 py-4 rounded-3xl",
                            "bg-slate-900/90 backdrop-blur-2xl border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.5)]",
                            "transition-all duration-300 ring-1 ring-white/10"
                        )}
                    >
                        <div className="shrink-0 p-1.5 bg-white/5 rounded-xl border border-white/5">
                            {getIcon()}
                        </div>
                        <p className="text-sm font-bold text-slate-100 tracking-tight leading-tight">
                            {message}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GameMessageBanner;
