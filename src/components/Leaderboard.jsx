import React from 'react';
import { Trophy, Medal, Crown, Star, TrendingUp } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { Card, CardContent } from './ui/Card';
import { AVATARS } from '../lib/avatars';
import { cn } from '../lib/utils'; // Assuming cn utility is available here
import { getCareerIdentity } from '../lib/masterCareer';

const PodiumStep = ({ user, rank, delay }) => {
    const isFirst = rank === 1;
    const isSecond = rank === 2;
    const avatar = AVATARS.find(a => a.id === user?.avatar_id)?.path || '/avatars/cat.png';
    const identity = getCareerIdentity(user?.level || 1);

    // Color Theme Mapping
    const theme = isFirst ? {
        border: 'border-amber-400',
        glow: 'shadow-[0_25px_60px_rgba(251,191,36,0.4)]',
        chrome: 'gold-chrome-border',
        aura: 'rgba(251,191,36,0.2)',
        particle: '#fbbf24'
    } : isSecond ? {
        border: 'border-slate-300',
        glow: 'shadow-[0_15px_40px_rgba(203,213,225,0.3)]',
        chrome: 'silver-chrome-border',
        aura: 'rgba(203,213,225,0.1)',
        particle: '#cbd5e1'
    } : {
        border: 'border-amber-700',
        glow: 'shadow-[0_15px_40px_rgba(180,83,9,0.2)]',
        chrome: 'bronze-chrome-border',
        aura: 'rgba(180,83,9,0.1)',
        particle: '#d97706'
    };

    return (
        <Motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
                delay, 
                type: "spring", 
                stiffness: 100, 
                damping: 15 
            }}
            className={cn(
                "flex flex-col items-center relative cursor-pointer group transform-gpu",
                isFirst ? 'z-10 -mt-20' : 'mt-8'
            )}
        >
            <div className="relative mb-4 perspective-1000 transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-105">
                {/* Divine Aura (Simplified) */}
                <div className="absolute inset-0 z-[-1]">
                    <div className="divine-aura" style={{
                        background: `radial-gradient(circle, ${theme.aura} 0%, transparent 70%)`,
                        opacity: isFirst ? 1 : 0.5
                    }} />
                    
                    {isFirst && (
                        <div className="absolute inset-0 animate-pulse opacity-50 bg-amber-400/20 blur-2xl rounded-full" />
                    )}
                </div>

                {/* Outer Rings & Chrome */}
                <div className="absolute inset-[-10px] rounded-full opacity-40 blur-sm flex items-center justify-center">
                    <div className={cn("absolute inset-0 rounded-full", theme.chrome)} />
                    <div className="absolute inset-[2px] rounded-full bg-slate-950" />
                </div>
                
                <div className={cn(
                    "relative rounded-full border-4 overflow-hidden bg-slate-900 transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(56,189,248,0.4)]",
                    theme.border,
                    theme.glow,
                    isFirst ? 'w-32 h-32' : 'w-20 h-20'
                )}>
                    {user ? (
                        <>
                            <img 
                                src={avatar} 
                                alt={user.name} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">?</div>
                    )}
                </div>

                {/* Rank Badge / Crown - Static for better performance */}
                <div className={cn(
                    "absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border-2 border-slate-900 z-20 transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-1",
                    isFirst ? "bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 scale-110 ring-4 ring-amber-500/10" :
                        isSecond ? "bg-gradient-to-br from-slate-200 via-slate-100 to-slate-400" :
                            "bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900"
                )}>
                    {isFirst ? <Crown className="w-7 h-7 text-amber-950 drop-shadow-md animate-pulse" /> : <span className="text-sm font-black text-slate-950">{rank}</span>}
                </div>
            </div>

            <div className="text-center relative z-10 transition-all duration-500 group-hover:scale-105">
                <p className={cn(
                    "font-black truncate w-24 mb-0.5 transition-colors",
                    isFirst ? 'text-lg text-white' : 'text-sm text-slate-300'
                )}>
                    {user?.name || '---'}
                </p>
                <div className="flex flex-col items-center gap-1">
                    <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider transition-colors",
                        isFirst ? 'text-amber-300' : 'text-slate-500',
                        "group-hover:text-amber-400"
                    )}>
                        {identity.label}
                    </span>
                    <div className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md transition-all group-hover:bg-skyjo-blue/20 group-hover:border-skyjo-blue/40">
                        <span className="text-[10px] font-black text-white tracking-tighter mr-0.5 opacity-80">XP</span>
                        <span className={isFirst ? 'text-sm text-white' : 'text-[11px] text-slate-200'}>
                            {user?.xp || 0}
                        </span>
                    </div>
                </div>
            </div>
        </Motion.div>
    );
};

export default function Leaderboard({ data, currentUserId }) {
    const top3Arr = [
        data[1] || null, // Silver (2nd)
        data[0] || null, // Gold (1st)
        data[2] || null  // Bronze (3rd)
    ];

    const others = data.slice(3);

    return (
        <div className="space-y-6 pb-6">
            {/* Podium - Reduced padding-top to move it up as requested */}
            {data.length > 0 && (
                <div className="flex items-end justify-center gap-4 pt-12 pb-10 px-2 bg-gradient-to-b from-skyjo-blue/10 to-transparent rounded-3xl border border-white/5 relative overflow-visible shadow-2xl">
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
                        const identity = getCareerIdentity(user.level);

                        return (
                            <Motion.div
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
                                            <p className="text-xs font-black text-white uppercase tracking-tighter">{identity.label}</p>
                                            <div className="flex items-center justify-end gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5">
                                                <span className="text-[9px] font-black text-white/60 mr-0.5">XP</span>
                                                <span className="text-[11px] font-bold text-slate-300">{user.xp}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Motion.div>
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
