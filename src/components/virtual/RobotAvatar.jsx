import React, { useState, useEffect } from 'react';

/**
 * RobotAvatar - A sleek, minimal drone head for the AI
 * Mobile-focused, no hover needed, subtle idle animations.
 */
const RobotAvatar = ({ className = "", difficulty = 'NORMAL', size = "md" }) => {
  const [blink, setBlink] = useState(false);

  // Difficulty to Color Theme Mapping (Matching values in AI_DIFFICULTY enum)
  const themes = {
    'normal': {
      eye: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
      aura: 'border-emerald-500/20',
      side: 'bg-emerald-500/50'
    },
    'hard': {
      eye: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
      aura: 'border-amber-500/20',
      side: 'bg-amber-500/50'
    },
    'hardcore': {
      eye: 'bg-purple-500 shadow-[0_0_8px_#a855f7]',
      aura: 'border-purple-500/20',
      side: 'bg-purple-500/50'
    },
    'bonus': {
      eye: 'bg-red-500 shadow-[0_0_8px_#ef4444]',
      aura: 'border-red-500/20',
      side: 'bg-red-500/50'
    }
  };

  const theme = themes[difficulty] || themes.NORMAL;

  // Random eye blinking
  useEffect(() => {
    const triggerBlink = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
      setTimeout(triggerBlink, Math.random() * 4000 + 2000); // Less frequent blinking
    };

    const timeoutId = setTimeout(triggerBlink, 3000);
    return () => clearTimeout(timeoutId);
  }, []);

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32"
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      <style>{`
                @keyframes drone-float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-5px); }
                }
                @keyframes pulse-ring {
                    0% { transform: scale(0.8); opacity: 0.5; }
                    100% { transform: scale(1.2); opacity: 0; }
                }
                .drone-main {
                    animation: drone-float 3s ease-in-out infinite;
                }
                .eye-blink { transform: scaleY(0.1); }
            `}</style>

      {/* Subtle Aura (Pulse) */}
      <div className={`absolute inset-0 rounded-full border-2 transition-colors duration-500 ${theme.aura} animate-[pulse-ring_2s_infinite]`} />

      <div className="relative drone-main flex flex-col items-center">
        {/* Head Body - Sleek Metal Sphere */}
        <div className={`w-16 h-14 rounded-[2rem] bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 shadow-2xl border-t border-slate-500 flex items-center justify-center relative z-10 overflow-hidden`}>

          {/* Face Plate */}
          <div className="w-12 h-8 bg-black/90 rounded-full flex items-center justify-center gap-2 border border-white/5 relative">
            {/* Eyes */}
            <div className={`w-3 h-1.5 transition-all duration-300 rounded-full ${theme.eye} ${blink ? 'eye-blink' : ''}`} />
            <div className={`w-3 h-1.5 transition-all duration-300 rounded-full ${theme.eye} ${blink ? 'eye-blink' : ''}`} />

            {/* Internal Reflection */}
            <div className="absolute top-1 left-3 w-4 h-1 bg-white/10 rounded-full blur-[1px]" />
          </div>

          {/* Side Decorative Lights */}
          <div className={`absolute left-1 top-1/2 -translate-y-1/2 w-1 h-3 rounded-full ${theme.side}`} />
          <div className={`absolute right-1 top-1/2 -translate-y-1/2 w-1 h-3 rounded-full ${theme.side}`} />
        </div>

        {/* Drone Stand/Bottom Detail */}
        <div className="w-8 h-2 bg-slate-800 rounded-full -mt-1 opacity-80" />

        {/* Bottom Shadow (Floating) */}
        <div className="w-6 h-1 bg-black/40 rounded-full blur-[2px] mt-2 animate-pulse" />
      </div>
    </div>
  );
};

export default RobotAvatar;
