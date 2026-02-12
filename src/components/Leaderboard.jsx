import React from 'react';
import { Trophy, Medal, Crown, Star, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './ui/Card';
import { AVATARS } from '../lib/avatars';

const PodiumStep = ({ user, rank, delay }) => {
    const isFirst = rank === 1;
    const avatar = AVATARS.find(a => a.id === user?.avatar_id)?.path || '/avatars/cat.png';

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, type: 'spring' }}
            className={`flex flex-col items-center relative ${isFirst ? 'z-10 -mt-20' : 'mt-0'}`}
        >
            <motion.div
                className="relative mb-4 group"
                animate={isFirst ? {
                    y: [0, -10, 0]
                } : {}}
                transition={isFirst ? {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                } : {}}
            >
                {/* 3D Depth Stack for First Place */}
                {isFirst && (
                    <>
                        <div className="absolute inset-[-10px] rounded-full bg-amber-600/20 blur-xl animate-pulse" />
                        {/* 3D Rings */}
                        <div className="absolute inset-[-6px] rounded-full bg-gradient-to-b from-amber-400 to-amber-900 border border-white/20 shadow-lg" />
                        <div className="absolute inset-[-3px] rounded-full bg-gradient-to-tr from-amber-500 via-amber-200 to-amber-600 border border-white/30" />
                    </>
                )}

                <div className={`relative rounded-full border-4 overflow-hidden bg-slate-900 shadow-2xl transition-all duration-700 ${isFirst ? 'w-32 h-32 border-amber-400 shadow-[0_20px_50px_rgba(251,191,36,0.3)]' :
                    rank === 2 ? 'w-20 h-20 border-slate-300 shadow-slate-300/10' :
                        'w-20 h-20 border-amber-600 shadow-amber-600/10'
                    }`}>
                    {user ? (
                        <>
                            <img src={avatar} alt={user.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                            {isFirst && <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-white/5 to-transparent pointer-events-none" />}
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">?</div>
                    )}
                </div>

                {/* 3D Crown Badge */}
                <div className={`absolute -top-5 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border-2 border-slate-900 z-20 ${isFirst ? 'bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 scale-110 ring-4 ring-amber-500/20' :
                    rank === 2 ? 'bg-gradient-to-br from-slate-200 to-slate-400' :
                        'bg-gradient-to-br from-amber-500 to-amber-800'
                    }`}>
                    {isFirst ? <Crown className="w-7 h-7 text-amber-950 drop-shadow-md" /> : <span className="text-sm font-black text-slate-950">{rank}</span>}
                </div>
            </motion.div>

            <div className="text-center relative z-10">
                <p className={`font-black truncate w-24 mb-0.5 ${isFirst ? 'text-lg text-white' : 'text-sm text-slate-300'}`}>
                    {user?.name || '---'}
                </p>
                <div className="flex flex-col items-center gap-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isFirst ? 'text-amber-300' : 'text-slate-500'}`}>
                        Niveau {user?.level || 1}
                    </span>
                    <div className="flex items-center justify-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-inner">
                        <span className="text-[9px] font-black text-skyjo-blue tracking-tighter mr-0.5">XP</span>
                        <span className={`font-black ${isFirst ? 'text-sm text-white' : 'text-[10px] text-slate-300'}`}>
                            {user?.xp || 0}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default function Leaderboard({ data, currentUserId, type, setType }) {
    const top3Arr = [
        data[1] || null, // Silver (2nd)
        data[0] || null, // Gold (1st)
        data[2] || null  // Bronze (3rd)
    ];

    const others = data.slice(3);

    return (
        <div className="space-y-6">
            {/* Header with Title */}
            <div className="flex items-center justify-center gap-3 px-4 py-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-skyjo-blue drop-shadow-[0_0_10px_rgba(56,189,248,0.3)]">
                    Classement Mondial
                </h3>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>

            {/* Podium - Increased padding-top and changed to overflow-visible to prevent clipping of animated 3D elements */}
            {data.length > 0 && (
                <div className="flex items-end justify-center gap-4 pt-32 pb-10 px-2 bg-gradient-to-b from-skyjo-blue/10 to-transparent rounded-3xl border border-white/5 relative overflow-visible shadow-2xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.1),transparent)] pointer-events-none" />
                    {top3Arr[0] && <PodiumStep user={top3Arr[0]} rank={2} delay={0.2} />}
                    <PodiumStep user={top3Arr[1]} rank={1} delay={0.1} />
                    {top3Arr[2] && <PodiumStep user={top3Arr[2]} rank={3} delay={0.3} />}
                </div>
            )}

            {/* List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span>Rang & Joueur</span>
                    <span>Niveau & XP</span>
                </div>

                <div className="space-y-2">
                    {others.map((user, index) => {
                        const rank = index + 4;
                        const isMe = user.id === currentUserId;
                        const avatar = AVATARS.find(a => a.id === user.avatar_id)?.path || '/avatars/cat.png';

                        return (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + index * 0.05 }}
                            >
                                <Card className={`glass-premium border-white/5 overflow-hidden transition-all duration-300 ${isMe ? 'bg-skyjo-blue/10 border-skyjo-blue/30 scale-[1.02] shadow-lg shadow-skyjo-blue/10' : 'hover:bg-white/5'}`}>
                                    <CardContent className="p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-6 text-center font-black text-slate-500 text-xs">
                                                {rank}
                                            </div>
                                            <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-slate-800">
                                                <img src={avatar} alt={user.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className={`font-bold text-sm ${isMe ? 'text-white' : 'text-slate-200'}`}>
                                                    {user.name} {isMe && <span className="text-[8px] bg-skyjo-blue text-white px-1.5 py-0.5 rounded-full ml-1">VOUS</span>}
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-medium">@{user.vibe_id.replace('#', '')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <span className="text-[9px] font-black text-skyjo-blue mr-0.5">XP</span>
                                                <span className="text-xs font-black text-white">{user.xp}</span>
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Niveau {user.level}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}

                    {data.length === 0 && (
                        <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
                            <TrendingUp className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                            <p className="text-sm text-slate-500 font-bold">Aucun classement disponible</p>
                            <p className="text-[10px] text-slate-600 uppercase mt-1">Ajoutez des amis pour vous comparer !</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
