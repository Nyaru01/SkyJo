import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Smile, Loader2, ArrowLeft } from 'lucide-react';
import { useSocialStore } from '../store/socialStore';
import { useGameStore } from '../store/gameStore';
import { Button } from './ui/Button';
import { AVATARS } from '../lib/avatars';
import { cn } from '../lib/utils';

export default function ChatPopup({ friend, onClose }) {
    const { directMessages, sendPrivateMessage, setTyping, typingStatus } = useSocialStore();
    const { userProfile } = useGameStore();
    const [message, setMessage] = useState('');
    const [replyTo, setReplyTo] = useState(null); // Message being replied to
    const scrollRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const messages = directMessages[String(friend.id)] || [];
    const isTyping = typingStatus[friend.id];

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        sendPrivateMessage(friend.id, message.trim(), replyTo);
        setMessage('');
        setReplyTo(null);

        // Clear typing status immediately
        setTyping(friend.id, false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            handleSend(e);
        } else {
            // Send typing notification
            setTyping(friend.id, true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                setTyping(friend.id, false);
            }, 2000);
        }
    };

    const getAvatarPath = (id) => {
        return AVATARS.find(a => a.id === id)?.path || '/avatars/cat.png';
    };

    const formatTime = (ts) => {
        return new Intl.DateTimeFormat('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(ts);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50, transition: { duration: 0.2 } }}
            className="fixed inset-x-4 bottom-[108px] top-20 z-[100] bg-slate-950/95 backdrop-blur-3xl border border-white/30 rounded-[2.5rem] shadow-[0_20px_60px_-10px_rgba(26,72,105,0.5)] flex flex-col overflow-hidden lg:max-w-md lg:left-auto lg:right-6 lg:bottom-28 lg:top-auto lg:h-[600px] ring-1 ring-white/10"
        >
            {/* Ambient Top Glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-skyjo-blue/50 to-transparent z-50" />

            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden border border-white/10">
                            <img src={getAvatarPath(friend.avatar_id)} alt="" className="w-full h-full object-cover" />
                        </div>
                        {friend.isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 shadow-sm" />
                        )}
                    </div>
                    <div>
                        <h4 className="font-black text-white text-sm">{friend.name}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                            {isTyping ? <span className="text-skyjo-blue animate-pulse">En train d'écrire...</span> : (friend.isOnline ? 'En ligne' : 'Hors ligne')}
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="hidden lg:block p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages body */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
                style={{ scrollBehavior: 'smooth' }}
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 px-8 text-center">
                        <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center mb-4">
                            <Smile className="w-8 h-8" />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-widest text-white mb-1">Dites bonjour !</p>
                        <p className="text-[10px] text-slate-400">Envoyez un message pour commencer la conversation avec {friend.name}.</p>
                    </div>
                ) : (
                    messages.map((m, i) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, x: m.isMe ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={cn(
                                "flex flex-col max-w-[85%] group relative",
                                m.isMe ? "ml-auto items-end" : "items-start"
                            )}
                        >
                            {/* Reply Button on hover */}
                            <button
                                onClick={() => setReplyTo(m)}
                                className={cn(
                                    "absolute top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-800 border border-white/10 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity z-10",
                                    m.isMe ? "-left-12" : "-right-12"
                                )}
                            >
                                <ArrowLeft className={cn("w-4 h-4", m.isMe ? "" : "rotate-180")} />
                            </button>

                            <div
                                onClick={() => setReplyTo(m)}
                                className={cn(
                                    "flex flex-col rounded-2xl shadow-lg border relative overflow-hidden active:scale-[0.98] transition-transform cursor-pointer",
                                    m.isMe
                                        ? "bg-skyjo-blue text-white rounded-tr-none border-transparent"
                                        : "bg-slate-900 text-slate-200 rounded-tl-none border-white/5"
                                )}>
                                {/* Quoted Message Display */}
                                {m.replyTo && (
                                    <div className={cn(
                                        "px-3 py-1.5 border-l-4 mb-1 text-[11px] opacity-80 bg-black/20",
                                        m.isMe ? "border-white/30" : "border-skyjo-blue/50"
                                    )}>
                                        <p className="font-black truncate max-w-[150px]">
                                            {m.replyTo.fromId === userProfile?.id ? "Vous" : friend.name}
                                        </p>
                                        <p className="truncate italic">"{m.replyTo.text}"</p>
                                    </div>
                                )}

                                <div className="px-4 py-2.5 text-sm font-medium">
                                    {m.text}
                                </div>
                            </div>
                            <span className="text-[9px] text-slate-500 mt-1 font-bold">
                                {formatTime(m.timestamp)}
                            </span>
                        </motion.div>
                    ))
                )}
                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex gap-1 p-2 bg-slate-800/50 rounded-2xl w-fit border border-white/5"
                    >
                        <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                        <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                    </motion.div>
                )}
            </div>

            {/* Input Footer */}
            <div className="border-t border-white/5 bg-white/5 backdrop-blur-md">
                {/* Reply Indicator */}
                <AnimatePresence>
                    {replyTo && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-4 py-2 bg-slate-900 border-b border-white/5 flex items-center justify-between overflow-hidden"
                        >
                            <div className="flex flex-col border-l-2 border-skyjo-blue pl-3 py-1">
                                <span className="text-[10px] font-black text-skyjo-blue uppercase tracking-widest">
                                    Répondre à {replyTo.fromId === userProfile?.id ? "vous-même" : friend.name}
                                </span>
                                <span className="text-xs text-slate-400 truncate max-w-[250px] italic">
                                    "{replyTo.text}"
                                </span>
                            </div>
                            <button
                                onClick={() => setReplyTo(null)}
                                className="p-1 text-slate-500 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSend} className="p-4 flex items-center gap-3">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        placeholder="Écrivez un message..."
                        className="flex-1 bg-slate-800/50 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-skyjo-blue/30 transition-all placeholder:text-slate-600"
                    />
                    <Button
                        type="submit"
                        disabled={!message.trim()}
                        className="w-12 h-12 p-0 rounded-2xl bg-skyjo-blue hover:bg-skyjo-blue/80 text-white shadow-lg shadow-skyjo-blue/20 flex items-center justify-center shrink-0 active:scale-90 transition-all"
                    >
                        <Send className="w-5 h-5 ml-0.5" />
                    </Button>
                </form>
            </div>
        </motion.div>
    );
}
