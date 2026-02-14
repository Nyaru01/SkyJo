import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Sparkles, Command, Zap, Activity, Box, ShieldCheck } from 'lucide-react';

// --- Configuration Premium ---
const MESSAGES = [
  { text: "Initialisation sécurisée", icon: <ShieldCheck strokeWidth={1.5} className="w-4 h-4" /> },
  { text: "Calibrage de l'expérience", icon: <Command strokeWidth={1.5} className="w-4 h-4" /> },
  { text: "Optimisation des atouts", icon: <Sparkles strokeWidth={1.5} className="w-4 h-4" /> },
  { text: "Synchronisation cloud", icon: <Activity strokeWidth={1.5} className="w-4 h-4" /> },
  { text: "Préparation de la table", icon: <Layers strokeWidth={1.5} className="w-4 h-4" /> },
  { text: "Prêt", icon: <Zap strokeWidth={1.5} className="w-4 h-4" /> }
];

// --- Composant Particules Flottantes (Renforcé) ---
const FloatingParticles = () => {
  // Plus de particules
  const particles = Array.from({ length: 35 });
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((_, i) => {
        // Couleurs plus vibrantes
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
              y: [null, Math.random() * -100 - 50 + "%"], // Monte
              x: [null, (Math.random() - 0.5) * 80 + "%"], // Dérive latérale plus large
              opacity: [0, Math.random() * 0.7 + 0.3, 0], // Opacité augmentée (0.3 à 1.0)
              scale: [0, Math.random() * 1.5 + 0.8, 0], // Échelle un peu plus grande
            }}
            transition={{
              duration: Math.random() * 10 + 8, // Un peu plus rapide
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear"
            }}
            style={{
              width: Math.random() * 5 + 2 + "px", // Taille augmentée (2px à 7px)
              height: Math.random() * 5 + 2 + "px",
              backgroundColor: color,
              // Ombre portée brillante (Glow) sur TOUTES les particules
              boxShadow: `0 0 ${Math.random() * 15 + 5}px ${color}`
            }}
          />
        );
      })}
    </div>
  );
};

// --- Arrière-plan "Mesh Gradient" Subtil avec touches couleurs ---
const PremiumBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#050505]">
    {/* Glows d'ambiance Cyan (#30eeff) - Un peu plus forts */}
    <motion.div 
      animate={{ opacity: [0.15, 0.25, 0.15], scale: [1, 1.1, 1] }}
      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-[#30eeff] rounded-full blur-[150px] opacity-25" 
    />
    {/* Glows d'ambiance Magenta (#ff50ff) - Un peu plus forts */}
    <motion.div 
      animate={{ opacity: [0.15, 0.25, 0.15], scale: [1, 1.2, 1] }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] bg-[#ff50ff] rounded-full blur-[150px] opacity-25" 
    />
    
    {/* Grain fin pour la texture "papier" */}
    <div className="absolute inset-0 opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
  </div>
);

// --- Typographie de chargement élégante ---
const ElegantLoaderText = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % MESSAGES.length);
    }, 2000); // Plus lent pour le côté calme/luxe
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-10 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} // Courbe de Bézier sophistiquée
          className="flex flex-col items-center gap-2"
        >
          <div className="text-slate-400">{MESSAGES[index].icon}</div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">
            {MESSAGES[index].text}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

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
        // Progression très fluide
        return Math.min(prev + (Math.random() * 2 + 0.5), 100);
      });
    }, 50);
    return () => clearInterval(timer);
  }, [progress]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] flex flex-col items-center justify-center z-[100] font-sans text-slate-200 overflow-hidden bg-black selection:bg-white/20">
      
      <PremiumBackground />
      <FloatingParticles />

      <div className="relative z-10 w-full max-w-[320px] flex flex-col items-center">
        
        {/* LOGO Minimaliste */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="mb-16 flex flex-col items-center"
        >
          <div className="w-px h-12 bg-gradient-to-b from-transparent via-slate-600 to-transparent mb-6" />
          
          <h1 className="text-4xl font-bold tracking-[0.25em] text-white/90">
            SKYJO
          </h1>
          <span className="text-[9px] uppercase tracking-[0.4em] text-slate-500 mt-3 font-medium">
            Virtuel
          </span>
        </motion.div>

        {/* CERCLE DE PROGRESSION CENTRAL (Style montre connectée luxe) */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative w-48 h-48 mb-12 flex items-center justify-center"
        >
          {/* Cercle de fond */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle 
              cx="50" cy="50" r="44" 
              fill="none" 
              stroke="rgba(255,255,255,0.03)" 
              strokeWidth="1" 
            />
            {/* Cercle de progression */}
            <motion.circle 
              cx="50" cy="50" r="44" 
              fill="none" 
              stroke="url(#gradient)" 
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="276" // 2 * PI * 44
              strokeDashoffset={276 - (276 * internalProgress) / 100}
              initial={{ strokeDashoffset: 276 }}
              animate={{ strokeDashoffset: 276 - (276 * internalProgress) / 100 }}
              transition={{ ease: "linear", duration: 0.2 }} // Mise à jour fluide
            />
            {/* Définition du gradient Cyan/Magenta */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#30eeff" />
                <stop offset="100%" stopColor="#ff50ff" />
              </linearGradient>
            </defs>
          </svg>

          {/* Contenu central */}
          <div className="flex flex-col items-center">
            <span className="text-4xl font-thin tabular-nums tracking-tighter text-white">
              {Math.round(internalProgress)}
            </span>
          </div>

          {/* Particules orbitales décoratives */}
          <motion.div 
            className="absolute inset-0 rounded-full border border-white/5"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[1px] w-[3px] h-[3px] bg-white rounded-full shadow-[0_0_10px_white]" />
          </motion.div>
        </motion.div>

        {/* TEXTE DYNAMIQUE */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full text-center"
        >
          <ElegantLoaderText />
        </motion.div>

      </div>

    </div>
  );
}