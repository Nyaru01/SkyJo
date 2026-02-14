import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Sparkles, Command, Zap, Activity, ShieldCheck } from 'lucide-react';

// --- Configuration Premium ---
const MESSAGES = [
  { text: "Initialisation sécurisée", icon: <ShieldCheck strokeWidth={1} className="w-4 h-4" /> },
  { text: "Calibrage de l'expérience", icon: <Command strokeWidth={1} className="w-4 h-4" /> },
  { text: "Optimisation des atouts", icon: <Sparkles strokeWidth={1} className="w-4 h-4" /> },
  { text: "Synchronisation cloud", icon: <Activity strokeWidth={1} className="w-4 h-4" /> },
  { text: "Préparation de la table", icon: <Layers strokeWidth={1} className="w-4 h-4" /> },
  { text: "Prêt", icon: <Zap strokeWidth={1} className="w-4 h-4" /> }
];

// --- Composant Particules Flottantes ---
const FloatingParticles = () => {
  const particles = useMemo(() => Array.from({ length: 30 }), []);
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((_, i) => {
        const color = i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#30eeff' : '#ff50ff';
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            initial={{
              x: Math.random() * 100 + "%",
              y: Math.random() * 100 + "%",
              opacity: 0,
              scale: 0
            }}
            animate={{
              y: [null, Math.random() * -100 - 50 + "%"],
              x: [null, (Math.random() - 0.5) * 60 + "%"],
              opacity: [0, Math.random() * 0.4 + 0.2, 0],
              scale: [0, Math.random() * 1.2 + 0.5, 0],
            }}
            transition={{
              duration: Math.random() * 12 + 10,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear"
            }}
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              backgroundColor: color,
              boxShadow: `0 0 ${Math.random() * 8 + 4}px ${color}`
            }}
          />
        );
      })}
    </div>
  );
};

// --- Arrière-plan Dynamique ---
const PremiumBackground = ({ progress }) => {
  const cyanOpacity = Math.max(0.05, 0.25 - (progress / 100) * 0.2);
  const magentaOpacity = Math.min(0.25, 0.05 + (progress / 100) * 0.2);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#030303]">
      <motion.div 
        style={{ opacity: cyanOpacity }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-[#30eeff] rounded-full blur-[150px]" 
      />
      <motion.div 
        style={{ opacity: magentaOpacity }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] bg-[#ff50ff] rounded-full blur-[150px]" 
      />
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};

// --- Typographie de chargement ---
const ElegantLoaderText = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-12 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ y: 15, opacity: 0, filter: 'blur(8px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: -15, opacity: 0, filter: 'blur(8px)' }}
          transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
          className="flex flex-col items-center gap-1.5"
        >
          <div className="text-slate-500/60">{MESSAGES[index].icon}</div>
          <span className="text-[9px] uppercase tracking-[0.4em] text-slate-400 font-bold">
            {MESSAGES[index].text}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// --- Icône de carte avec Glare interne ---
const CardSilhouette = () => (
  <motion.div 
    animate={{ 
      rotateY: [0, 10, 0, -10, 0],
      rotateX: [5, 0, 5],
    }}
    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    className="w-14 h-20 border border-white/10 rounded-lg relative flex items-center justify-center bg-white/[0.03] overflow-hidden"
    style={{ perspective: '800px' }}
  >
    <motion.div 
      animate={{ x: ['-200%', '200%'] }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-20"
    />
    <div className="absolute inset-1.5 border border-white/5 rounded-[4px]" />
    <div className="w-5 h-5 rounded-full border border-white/10 bg-white/[0.01]" />
  </motion.div>
);

export default function SkyjoLoaderPremium({ progress = 0 }) {
  const [internalProgress, setInternalProgress] = useState(progress);

  useEffect(() => {
    if (progress > 0) {
      setInternalProgress(progress);
      return;
    }
    const timer = setInterval(() => {
      setInternalProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        const increment = prev > 85 ? 0.15 : (Math.random() * 1.2 + 0.4);
        return Math.min(prev + increment, 100);
      });
    }, 50);
    return () => clearInterval(timer);
  }, [progress]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] flex flex-col items-center justify-center z-[100] font-sans text-slate-200 overflow-hidden bg-[#030303] touch-none">
      
      <PremiumBackground progress={internalProgress} />
      <FloatingParticles />

      <div className="relative z-10 w-full max-w-[320px] flex flex-col items-center">
        
        {/* LOGO - Mélange de couleurs Cyan, Blanc et Magenta */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
          className="mb-12 flex flex-col items-center"
        >
          <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-700/50 to-transparent mb-8" />
          
          <div className="relative">
            <motion.h1 
              animate={{ 
                letterSpacing: ["0.2em", "0.26em", "0.2em"],
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
              }}
              transition={{ 
                letterSpacing: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                backgroundPosition: { duration: 10, repeat: Infinity, ease: "linear" }
              }}
              className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#30eeff] via-white to-[#ff50ff] bg-[length:200%_auto] drop-shadow-[0_0_20px_rgba(48,238,255,0.2)]"
            >
              SKYJO
            </motion.h1>
          </div>
          
          {/* Mot "Virtuel" agrandi et mis en valeur */}
          <motion.span 
            animate={{ 
              opacity: [0.4, 0.8, 0.4],
              letterSpacing: ["0.4em", "0.55em", "0.4em"]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-[14px] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#30eeff] via-white to-[#ff50ff] mt-6 font-black tracking-[0.5em]"
          >
            Virtuel
          </motion.span>
        </motion.div>

        {/* CERCLE DE PROGRESSION */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="relative w-60 h-60 mb-12 flex items-center justify-center"
        >
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle 
              cx="50" cy="50" r="47" 
              fill="none" 
              stroke="rgba(255,255,255,0.015)" 
              strokeWidth="0.5" 
            />
            <motion.circle 
              cx="50" cy="50" r="47" 
              fill="none" 
              stroke="url(#premiumGradient)" 
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="295"
              strokeDashoffset={295 - (295 * internalProgress) / 100}
              transition={{ ease: "easeOut", duration: 0.4 }}
            />
            <defs>
              <linearGradient id="premiumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#30eeff" />
                <stop offset="50%" stopColor="#9580ff" />
                <stop offset="100%" stopColor="#ff50ff" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute flex flex-col items-center">
            <CardSilhouette />
            <div className="mt-4 flex flex-col items-center">
               <span className="text-3xl font-extralight tabular-nums tracking-tighter text-white">
                {Math.round(internalProgress)}%
              </span>
              <div className="w-8 h-[1px] bg-white/10 mt-1" />
            </div>
          </div>

          <motion.div 
            className="absolute inset-0 pointer-events-none"
            style={{ rotate: `${(internalProgress / 100) * 360 - 90}deg` }}
          >
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[2px] w-2 h-2 bg-white rounded-full shadow-[0_0_15px_white,0_0_5px_#30eeff]" />
          </motion.div>
        </motion.div>

        {/* TEXTE DYNAMIQUE */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="w-full text-center"
        >
          <ElegantLoaderText />
        </motion.div>

      </div>
    </div>
  );
}