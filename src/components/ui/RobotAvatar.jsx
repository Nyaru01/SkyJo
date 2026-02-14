import React, { useState, useEffect } from 'react';

const RobotAvatar = ({ customMessage, showBubble }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [blink, setBlink] = useState(false);
    const [internalMessage, setInternalMessage] = useState("Bonne chance !");

    const displayMessage = customMessage || internalMessage;
    const isActive = showBubble || isHovered;

    const MESSAGES = [
        "Bonne chance !",
        "Bon défi !",
        "Prêt ?",
        "En garde !",
        "À toi de jouer !",
        "Go !",
        "Pas de pitié !"
    ];

    // Gestion du message au survol/toucher
    useEffect(() => {
        if (isHovered && !customMessage) {
            const randomMsg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
            setInternalMessage(randomMsg);
        }
    }, [isHovered, customMessage]);

    // Gestion du clignotement des yeux aléatoire
    useEffect(() => {
        const triggerBlink = () => {
            setBlink(true);
            setTimeout(() => setBlink(false), 200);
            setTimeout(triggerBlink, Math.random() * 3000 + 1000);
        };

        const timeoutId = setTimeout(triggerBlink, 2000);
        return () => clearTimeout(timeoutId);
    }, []);

    return (
        <div className="flex items-center justify-center overflow-visible font-sans cursor-crosshair relative select-none scale-75 origin-center">

            <style>{`
        @keyframes boxer-bounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(10px); }
        }
        @keyframes glow-red {
          0%, 100% { opacity: 0.8; box-shadow: 0 0 15px #f87171, inset 0 0 10px #f87171; }
          50% { opacity: 1; box-shadow: 0 0 25px #ef4444, inset 0 0 20px #ef4444; }
        }
        @keyframes float-hand-left {
          0%, 100% { transform: translate(0, 0) rotate(-10deg); }
          50% { transform: translate(-5px, 10px) rotate(-5deg); }
        }
        @keyframes float-hand-right {
          0%, 100% { transform: translate(0, 0) rotate(10deg); }
          50% { transform: translate(5px, 10px) rotate(5deg); }
        }
        @keyframes punch-left {
          0% { transform: translate(0, 0) rotate(-10deg); }
          50% { transform: translate(20px, -20px) rotate(10deg) scale(1.1); }
          100% { transform: translate(0, 0) rotate(-10deg); }
        }
        @keyframes punch-right {
          0% { transform: translate(0, 0) rotate(10deg); }
          50% { transform: translate(-20px, -20px) rotate(-10deg) scale(1.1); }
          100% { transform: translate(0, 0) rotate(10deg); }
        }

        .robot-boxer {
          animation: boxer-bounce 0.8s ease-in-out infinite;
        }
        .eye-angry-left {
          clip-path: polygon(0% 20%, 100% 0%, 100% 100%, 0% 100%);
          transform: rotate(15deg);
        }
        .eye-angry-right {
          clip-path: polygon(0% 0%, 100% 20%, 100% 100%, 0% 100%);
          transform: rotate(-15deg);
        }
        .eye-blink { transform: scaleY(0.1); }
        .ai-core-glow-angry { animation: glow-red 2s infinite ease-in-out; }
        .hand-left { animation: float-hand-left 2s ease-in-out infinite; }
        .hand-right { animation: float-hand-right 2s ease-in-out infinite; }
        
        /* Animation déclenchée par la classe .fighting-mode */
        .fighting-mode .hand-left {
          animation: punch-left 0.4s ease-in-out infinite alternate !important;
        }
        .fighting-mode .hand-right {
          animation: punch-right 0.4s ease-in-out infinite alternate-reverse !important;
        }
      `}</style>

            {/* Zone Interactive gérant Souris ET Toucher */}
            <div
                className={`relative w-80 h-96 flex flex-col items-center justify-center transition-transform duration-200 active:scale-95 ${isActive ? 'fighting-mode' : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onTouchStart={() => setIsHovered(true)}
                onTouchEnd={() => setIsHovered(false)}
                // Empêche le menu contextuel sur mobile
                onContextMenu={(e) => e.preventDefault()}
            >

                {/* --- MAIN GAUCHE --- */}
                <div className="absolute left-4 top-40 z-30 hand-left">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-slate-600 to-black border-2 border-slate-500 shadow-xl flex items-center justify-center">
                        <div className="w-12 h-10 border-r-2 border-slate-700/50 rounded-r-lg"></div>
                        <div className="absolute inset-0 rounded-3xl bg-cyan-400/10 mix-blend-overlay"></div>
                    </div>
                </div>

                {/* --- MAIN DROITE --- */}
                <div className="absolute right-4 top-40 z-30 hand-right">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-bl from-slate-600 to-black border-2 border-slate-500 shadow-xl flex items-center justify-center">
                        <div className="w-12 h-10 border-l-2 border-slate-700/50 rounded-l-lg"></div>
                        <div className="absolute inset-0 rounded-3xl bg-cyan-400/10 mix-blend-overlay"></div>
                    </div>
                </div>

                {/* Conteneur Corps + Tête + Bulle */}
                <div className="relative robot-boxer flex flex-col items-center">

                    {/* BULLE DE DIALOGUE */}
                    <div className={`absolute -top-28 right-[-20px] sm:-right-32 z-40 transition-all duration-300 origin-bottom-left ${isActive ? 'opacity-100 scale-125' : 'opacity-0 scale-50'}`}>
                        <div className="bg-slate-800/90 backdrop-blur-md text-cyan-100 px-6 py-4 rounded-2xl rounded-bl-sm border border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.3)] whitespace-nowrap">
                            <span className="font-bold text-xl font-mono tracking-wide">{displayMessage}</span>
                            <div className="absolute -bottom-[6px] -left-[1px] w-4 h-4 bg-slate-800 border-b border-l border-cyan-400/50 transform rotate-45"></div>
                        </div>
                    </div>

                    {/* --- TÊTE --- */}
                    <div className="relative z-20 w-40 h-36">
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-8 h-8 flex flex-col items-center justify-end z-0 rotate-12">
                            <div className="w-1 h-4 bg-slate-600"></div>
                            <div className="w-3 h-3 rounded-full bg-red-500 border border-red-400 shadow-[0_0_10px_#ef4444]"></div>
                        </div>

                        <div className="w-full h-full rounded-[2.5rem] bg-gradient-to-br from-slate-600 via-slate-800 to-black shadow-2xl flex items-center justify-center border-t border-slate-500 relative z-10">
                            <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-4 h-12 bg-slate-700 rounded-l-lg border-r border-black shadow-lg"></div>
                            <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-4 h-12 bg-slate-700 rounded-r-lg border-l border-black shadow-lg"></div>

                            <div className="w-32 h-24 bg-black/80 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-sm border border-slate-700/50 shadow-inner">
                                <div className="flex gap-4 mb-1">
                                    <div className={`w-10 h-3 bg-cyan-400 shadow-[0_0_15px_#22d3ee] eye-angry-left transition-all duration-100 ${blink ? 'eye-blink' : ''} ${isActive ? 'bg-red-500 shadow-[0_0_15px_#ef4444]' : ''}`}></div>
                                    <div className={`w-10 h-3 bg-cyan-400 shadow-[0_0_15px_#22d3ee] eye-angry-right transition-all duration-100 ${blink ? 'eye-blink' : ''} ${isActive ? 'bg-red-500 shadow-[0_0_15px_#ef4444]' : ''}`}></div>
                                </div>
                                <div className={`w-4 h-1 bg-cyan-400 rounded-full mt-2 transition-all duration-300 ${isActive ? 'w-8 h-3 rounded-sm bg-transparent border-2 border-red-500 rotate-3' : ''}`}></div>
                            </div>
                        </div>
                    </div>

                    {/* --- CORPS --- */}
                    <div className="relative z-10 -mt-6 w-32 h-40">
                        <div className="w-16 h-8 bg-slate-800 mx-auto rounded-full relative top-2 z-0"></div>
                        <div className="w-full h-full bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 rounded-[3rem] shadow-xl border-t border-slate-600 flex items-center justify-center relative overflow-hidden">
                            <div className="w-20 h-20 bg-slate-900 rounded-2xl border-4 border-slate-600 flex items-center justify-center relative shadow-inner">
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-slate-500"></div>
                                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-slate-500"></div>
                                <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 h-1 w-3 bg-slate-500"></div>
                                <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 h-1 w-3 bg-slate-500"></div>

                                <div className={`w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center border transition-colors duration-300 ${isActive ? 'ai-core-glow-angry border-red-500/30' : 'ai-core-glow border-cyan-500/30'}`}>
                                    <span className={`font-bold text-xl drop-shadow-[0_0_5px_currentColor] transition-colors duration-300 ${isActive ? 'text-red-500' : 'text-cyan-400'}`}>
                                        {isActive ? 'KO' : 'AI'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-10 w-24 h-4 bg-black/50 rounded-[100%] blur-md transition-all duration-100 transform scale-x-90 animate-pulse"></div>
            </div>

        </div>
    );
};

export default RobotAvatar;
