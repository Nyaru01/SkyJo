import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield as ShieldIcon, Shield, Zap, TrendingUp, Trophy, Play, Store, RotateCcw, Pause, Heart, Sparkles, Globe, X, ArrowLeft, Volume2, VolumeX, AlertTriangle, Music } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { auth } from '../../lib/firebase';
import app from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { useGameStore } from '../../store/gameStore';

// --- CONFIGURATION FIREBASE ---
const db = getFirestore(app);
const appId = 'pufferfish-mobile';

// --- CONSTANTES ---
const FRICTION = 0.90;
const MOVE_FORCE = 0.8;
const BASE_SPEED = 5.0;
const SHOCKWAVE_RADIUS = 120;

// --- COMPOSANTS SVG ---

const SkyjoMalusBot = React.memo(({ value }) => {
    const isNegative = value < 0;
    const isZero = value === 0;

    return (
        <div className="relative group animate-float">
            {/* Anti-Grav Pulse */}
            <div className={cn(
                "absolute inset-0 rounded-full blur-xl animate-breathing",
                isNegative ? "bg-emerald-500/20" : isZero ? "bg-sky-500/20" : "bg-rose-500/10"
            )} />

            {/* Card Body */}
            <div className={cn(
                "w-18 h-18 rounded-2xl bg-slate-900 border-2 shadow-2xl flex items-center justify-center relative overflow-hidden transition-colors",
                isNegative ? "border-emerald-500/40" : isZero ? "border-sky-500/40" : "border-rose-900/40"
            )}>
                {/* Visual Details */}
                <div className={cn(
                    "absolute inset-1 border border-dashed rounded-xl animate-spin-slow",
                    isNegative ? "border-emerald-500/20" : "border-rose-500/20"
                )} />

                {/* Score Display */}
                <div className={cn(
                    "w-12 h-12 rounded-xl bg-black border flex items-center justify-center shadow-inner relative z-10",
                    isNegative ? "border-emerald-500/30" : "border-rose-500/30"
                )}>
                    <span className={cn(
                        "text-2xl font-black italic drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] leading-none",
                        isNegative ? "text-emerald-400" : isZero ? "text-sky-400" : "text-rose-500"
                    )}>
                        {value}
                    </span>
                </div>
            </div>
        </div>
    );
});

const AdvancedThruster = ({ thrustIntensity = 0, isFiring = false }) => {
    const totalThrust = 1 + (isFiring ? 0.5 : 0) + (thrustIntensity * 1.5);
    return (
        <div className="relative flex flex-col items-center">
            <motion.div
                className="absolute top-0 w-6 h-16 bg-blue-600 rounded-full blur-md opacity-40"
                animate={{ scaleY: [totalThrust, totalThrust * 1.3, totalThrust], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 0.1, repeat: Infinity }}
            />
            <motion.div
                className="absolute top-0 w-3 h-10 bg-cyan-300 rounded-full blur-[2px]"
                animate={{ height: [30 * totalThrust, 45 * totalThrust, 35 * totalThrust] }}
                transition={{ duration: 0.05, repeat: Infinity }}
            />
            <motion.div
                className="absolute top-0 w-1.5 h-6 bg-white rounded-full blur-[1px]"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 0.08, repeat: Infinity }}
            />
        </div>
    );
};

const ShipShield = ({ active }) => (
    <AnimatePresence>
        {active && (
            <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 0.5, scale: 1.15 }}
                exit={{ opacity: 0, scale: 1.4 }}
                className="absolute inset-0 z-10 pointer-events-none"
            >
                <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-cyan-400">
                    <circle cx="50" cy="50" r="46" strokeWidth="0.5" strokeDasharray="4 2" className="animate-[spin_10s_linear_infinite]" />
                    <motion.circle cx="50" cy="50" r={49} initial={{ r: 49 }} strokeWidth="1.5" className="opacity-30" animate={{ r: [47, 51, 47], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 1.5, repeat: Infinity }} />
                </svg>
            </motion.div>
        )}
    </AnimatePresence>
);

const Spaceship = ({ tilt = 0, isFiring = false, showShield = false, thrustIntensity = 0 }) => {
    return (
        <motion.div
            className="relative w-20 h-20 flex items-center justify-center"
            animate={{ rotateZ: tilt, y: [-2, 2, -2], scale: isFiring ? 0.98 : 1 }}
            transition={{ y: { duration: 4, repeat: Infinity, ease: "easeInOut" }, rotateZ: { type: "spring", stiffness: 120, damping: 20 } }}
        >
            <ShipShield active={showShield} />
            <div className="absolute bottom-2 flex gap-4">
                <AdvancedThruster thrustIntensity={thrustIntensity} isFiring={isFiring} />
                <AdvancedThruster thrustIntensity={thrustIntensity} isFiring={isFiring} />
            </div>
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)]">
                <defs>
                    <linearGradient id="body-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: '#0f172a' }} />
                        <stop offset="50%" style={{ stopColor: '#334155' }} />
                        <stop offset="100%" style={{ stopColor: '#0f172a' }} />
                    </linearGradient>
                    <linearGradient id="wing-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#1e293b' }} />
                        <stop offset="100%" style={{ stopColor: '#020617' }} />
                    </linearGradient>
                </defs>
                <path d="M5 80 L30 40 L45 35 L45 85 L25 90 Z" fill="url(#wing-grad)" stroke="#22d3ee" strokeWidth="0.5" />
                <path d="M95 80 L70 40 L55 35 L55 85 L75 90 Z" fill="url(#wing-grad)" stroke="#22d3ee" strokeWidth="0.5" />
                <rect x="22" y="45" width="5" height="18" fill="#1e293b" rx="1" stroke="#475569" strokeWidth="0.5" />
                <rect x="73" y="45" width="5" height="18" fill="#1e293b" rx="1" stroke="#475569" strokeWidth="0.5" />
                <path d="M50 5 L65 30 L65 85 L50 95 L35 85 L35 30 Z" fill="url(#body-grad)" stroke="#64748b" strokeWidth="0.5" />
                <path d="M42 35 Q50 25 58 35 L56 55 Q50 60 44 55 Z" fill="#0891b2" stroke="#22d3ee" strokeWidth="0.5">
                    <animate attributeName="fill" values="#0891b2;#155e75;#0891b2" dur="3s" repeatCount="indefinite" />
                </path>
            </svg>
        </motion.div>
    );
};

const SkyjoEnergyCore = React.memo(() => (
    <div className="w-10 h-10 relative flex items-center justify-center">
        <div className="absolute inset-0 bg-sky-400/30 rounded-full blur-md animate-ping" />
        <div className="w-6 h-6 rotate-45 bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)] border-2 border-amber-200 flex items-center justify-center">
            <span className="text-[10px] text-amber-900 -rotate-45 font-black uppercase tracking-tighter">SC</span>
        </div>
    </div>
));

const SkyjoMine = React.memo(() => (
    <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="absolute inset-0 bg-rose-600/40 rounded-full blur-xl animate-ping" />
        <div className="absolute inset-2 bg-rose-500 rounded-full border-4 border-rose-950 shadow-[0_0_20px_rgba(244,63,94,0.8)]" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
            <div key={deg} className="absolute w-1 h-3 bg-rose-950 rounded-full bottom-1/2 left-1/2 origin-bottom" style={{ transform: `translateX(-50%) rotate(${deg}deg) translateY(-8px)` }} />
        ))}
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
    </div>
));

// --- COMPOSANT PRINCIPAL ---
export default function ArcadeGame({ onBack }) {
    const background = useGameStore(state => state.background);
    const [gameState, setGameState] = useState('MENU');
    const [user, setUser] = useState(null);
    const [points, setPoints] = useState(0); // SkyJo points (goal: < 100)
    const [distance, setDistance] = useState(0); // Survival distance
    const [coins, setCoins] = useState(() => {
        const saved = localStorage.getItem('puffer_coins');
        const val = saved ? Number(saved) : 500;
        return Math.max(val, 500); // Minimum 500 pour tout le monde
    });
    const [inventory, setInventory] = useState(() => {
        const saved = localStorage.getItem('arcade_inventory');
        return saved ? JSON.parse(saved) : { shield: 0, mult: 0, invincible: 0 };
    });
    const [wave, setWave] = useState(1);
    const [lives, setLives] = useState(3);
    const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('puffer_highscore')) || 0);
    const [leaderboard, setLeaderboard] = useState([]);

    // Refs for optimization
    const inputRef = useRef({ x: 0, y: 0, active: false });
    const playerPosRef = useRef({ x: 0, y: 0, vx: 0 });
    const shakeRef = useRef(0);

    const [playerPos, setPlayerPos] = useState({ x: 0, y: 0, vx: 0 });
    const [isPuffed, setIsPuffed] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const lastTouch = useRef({ x: 0, y: 0, time: Date.now() });
    const [cards, setCards] = useState([]); // Replaced enemies with cards
    const [collectibles, setCollectibles] = useState([]);
    const [floatingTexts, setFloatingTexts] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [activeBuffs, setActiveBuffs] = useState({ shield: false, multiplier: 1, invincible: false });
    const [waveAnnounce, setWaveAnnounce] = useState(null);
    const [mines, setMines] = useState([]);
    const [shipState, setShipState] = useState({ tilt: 0, thrust: 0 });
    const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem('arcade_tutorial_done'));
    const [shake, setShake] = useState(0);
    const [countdown, setCountdown] = useState(null);
    const [trails, setTrails] = useState([]); // Positions précédentes pour l'effet de traînée
    const [energy, setEnergy] = useState(0); // Jauge EMP (0-100)
    const [empActive, setEmpActive] = useState(false); // État visuel de l'onde de choc
    const [empOrigin, setEmpOrigin] = useState({ x: 0, y: 0 });
    const [boss, setBoss] = useState(null); // { hp, maxHp, x, behavior }
    const [lastPatternDist, setLastPatternDist] = useState(0); // Only for UI if needed
    const lastPatternDistRef = useRef(0); // For logic
    const distanceRef = useRef(0); // For logic consistency

    const containerRef = useRef(null);
    const audioCtxRef = useRef(null);
    const musicRef = useRef(null);

    // Initialisation Audio Context & SFX Manager
    const getAudioCtx = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtxRef.current;
    };

    const playSFX = (type) => {
        // SFX are now permanent as per user request
        const ctx = getAudioCtx();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        switch (type) {
            case 'coin':
                // Higher pitched, double-beep for coins
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start();
                osc.stop(now + 0.1);
                break;
            case 'diamond': // For power-ups
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(1000, now);
                osc.frequency.exponentialRampToValueAtTime(2000, now + 0.05);
                osc.frequency.exponentialRampToValueAtTime(1500, now + 0.15);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start();
                osc.stop(now + 0.15);
                break;
            case 'collect': // For cards
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start();
                osc.stop(now + 0.1);
                break;
            case 'damage':
                osc.type = 'square';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.2);
                osc.start();
                osc.stop(now + 0.2);
                break;
            case 'emp_charge':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220 + energy * 2, now);
                osc.frequency.exponentialRampToValueAtTime(440 + energy * 2, now + 0.05);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.05);
                osc.start();
                osc.stop(now + 0.05);
                break;
            case 'emp_blast':
                // Sub-bass thump
                const sub = ctx.createOscillator();
                const subGain = ctx.createGain();
                sub.connect(subGain);
                subGain.connect(ctx.destination);
                sub.frequency.setValueAtTime(100, now);
                sub.frequency.exponentialRampToValueAtTime(20, now + 0.5);
                subGain.gain.setValueAtTime(0.5, now);
                subGain.gain.linearRampToValueAtTime(0, now + 0.5);
                sub.start();
                sub.stop(now + 0.5);
                // Noise burst for shockwave
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.exponentialRampToValueAtTime(110, now + 0.3);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.3);
                osc.start();
                osc.stop(now + 0.3);
                break;
            case 'gameover':
                osc.type = 'square';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(55, now + 0.5);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.5);
                osc.start();
                osc.stop(now + 0.5);
                break;
        }
    };

    // Sauvegarde auto
    useEffect(() => {
        localStorage.setItem('puffer_coins', coins.toString());
    }, [coins]);

    useEffect(() => {
        localStorage.setItem('arcade_inventory', JSON.stringify(inventory));
    }, [inventory]);

    // Initialisation Musique
    useEffect(() => {
        musicRef.current = new Audio('/Music arcade/stranger-things-124008.mp3');
        musicRef.current.loop = true;
        musicRef.current.volume = 0.5;
        return () => {
            if (musicRef.current) {
                musicRef.current.pause();
                musicRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!musicRef.current) return;
        if (gameState === 'PLAYING' && !isMuted) {
            musicRef.current.play().catch(e => console.log("Music play blocked by browser", e));
        } else {
            musicRef.current.pause();
        }
    }, [gameState, isMuted]);

    // 1. Firebase Auth
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, setUser);
        return () => unsubscribe();
    }, []);

    // 2. Leaderboard
    useEffect(() => {
        if (!db || !user) return;
        const q = collection(db, 'artifacts', appId, 'public', 'data', 'scores');
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(d => d.data());
            setLeaderboard(docs.sort((a, b) => b.score - a.score).slice(0, 5));
        }, (err) => console.error(err));
        return () => unsubscribe();
    }, [user]);

    // 3. Game Loop
    useEffect(() => {
        if (gameState !== 'PLAYING') return;

        const gameLoop = setInterval(() => {
            // Dynamic speed based on wave (starts at 5, increases by 0.4 per wave, more aggressive after wave 5)
            const currentSpeed = 5 + (wave * 0.4) + (wave > 5 ? (wave - 5) * 0.2 : 0);

            setPlayerPos(prev => {
                let targetX = prev.x;
                let targetY = prev.y;
                let newVx = prev.vx * FRICTION;

                if (inputRef.current.active) {
                    const dx = inputRef.current.x - lastTouch.current.x;
                    const dy = inputRef.current.y - lastTouch.current.y;
                    targetX += dx;
                    targetY += dy;
                    lastTouch.current = { x: inputRef.current.x, y: inputRef.current.y, time: Date.now() };
                    newVx = dx * 0.5;
                }

                const finalX = Math.max(-window.innerWidth / 2 + 50, Math.min(window.innerWidth / 2 - 50, targetX));
                const verticalLimit = -window.innerHeight / 2 + 180;
                const finalY = Math.max(verticalLimit, Math.min(100, targetY));

                playerPosRef.current = { x: finalX, y: finalY, vx: newVx };
                setShipState(s => ({ ...s, tilt: newVx * 2, thrust: inputRef.current.active ? 0.8 : s.thrust }));

                // Trails logic (limit to 5 segments)
                setTrails(t => [{ x: finalX, y: finalY, tilt: newVx * 2, id: `trail-${Date.now()}-${Math.random()}` }, ...t].slice(0, 5));

                return { x: finalX, y: finalY, vx: newVx };
            });

            setDistance(d => {
                const nextDist = d + 1;
                distanceRef.current = nextDist;
                const currentWaveDistance = Math.floor(nextDist / 10);
                const nextWave = Math.floor(currentWaveDistance / 200) + 1;

                if (nextWave > wave) {
                    setWave(nextWave);
                    setWaveAnnounce(`VAGUE ${nextWave}`);
                    setShake(15);
                    setTimeout(() => setWaveAnnounce(null), 2000);
                }
                return nextDist;
            });

            // Correct decay for screen shake (using ref for value but keeping state for render)
            setShake(s => {
                const next = Math.max(0, s - 2.0);
                shakeRef.current = next;
                return next;
            });

            setCards(prev => {
                const next = prev.map(e => {
                    let nextX = e.x;
                    if (e.behavior === 'sine') {
                        nextX = e.startX + Math.sin(e.y / 50) * 50;
                    }
                    return { ...e, y: e.y + currentSpeed, x: nextX };
                }).filter(e => e.y < window.innerHeight + 100);

                // BOSS LOGIC
                if (wave % 5 === 0 && !boss) {
                    setBoss({ hp: 10 + wave * 2, maxHp: 10 + wave * 2, x: window.innerWidth / 2, dir: 1, lastFire: Date.now() });
                }

                if (boss) {
                    if (boss.hp <= 0) {
                        setBoss(null);
                        setFloatingTexts(p => [...p, { id: `boss-defeat-${Date.now()}`, text: "BOSS VAINCU! +100 SC", x: window.innerWidth / 2, y: 150 }]);
                        setCoins(c => c + 100);
                    } else {
                        // Boss Movement (Side to side)
                        setBoss(b => {
                            if (!b) return null;
                            let nx = b.x + (b.dir * 2);
                            let ndir = b.dir;
                            if (nx > window.innerWidth - 100 || nx < 100) ndir *= -1;

                            // Boss Firing Pattern
                            if (Date.now() - b.lastFire > 2000) {
                                const val = Math.floor(Math.random() * 5) + 3;
                                next.push({ y: 150, x: b.x, startX: b.x, id: Math.random(), value: val, behavior: 'sine' });
                                return { ...b, x: nx, dir: ndir, lastFire: Date.now() };
                            }
                            return { ...b, x: nx, dir: ndir };
                        });
                    }
                }

                // PATTERN SPAWNING (Every ~500 distance units)
                if (!boss && distanceRef.current - lastPatternDistRef.current > 500) {
                    lastPatternDistRef.current = distanceRef.current;
                    setLastPatternDist(distanceRef.current);
                    const patterns = ['WALL', 'VShape', 'ZigZag'];
                    const type = patterns[Math.floor(Math.random() * patterns.length)];

                    if (type === 'WALL') {
                        const count = 5;
                        const spacing = window.innerWidth / (count + 1);
                        const holeIndex = Math.floor(Math.random() * count) + 1;
                        for (let i = 1; i <= count; i++) {
                            if (i === holeIndex && wave < 3) continue;
                            next.push({ y: -100, x: i * spacing, startX: i * spacing, id: Math.random(), value: 5, behavior: 'linear' });
                        }
                    } else if (type === 'VShape') {
                        const offsets = [-100, -50, 0, -50, -100];
                        const count = 5;
                        const spacing = window.innerWidth / (count + 1);
                        for (let j = 0; j < count; j++) {
                            next.push({ y: -100 + offsets[j], x: (j + 1) * spacing, startX: (j + 1) * spacing, id: Math.random(), value: 3, behavior: 'linear' });
                        }
                    }
                    return next;
                }

                // Regular optimized spawn
                const maxCards = boss ? 5 : Math.min(15 + wave, 25);
                if (prev.length < maxCards && Math.random() < Math.min(0.012 + (wave * 0.002), 0.05)) {
                    const classicValues = [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
                    let val;
                    const rand = Math.random();
                    if (rand < 0.05) val = -10;
                    else if (rand < 0.15) val = classicValues[Math.floor(Math.random() * 3)];
                    else val = classicValues[Math.floor(Math.random() * classicValues.length)];

                    const x = Math.random() * (window.innerWidth - 100) + 50;
                    const behavior = (wave >= 3 && Math.random() < 0.3) ? 'sine' : 'linear';

                    next.push({
                        y: -100,
                        x,
                        startX: x,
                        id: Math.random(),
                        value: val,
                        behavior
                    });
                }
                return next;
            });

            setCollectibles(prev => {
                const next = prev.map(c => ({ ...c, y: c.y + currentSpeed })).filter(c => c.y < window.innerHeight + 50);

                // Spawn coins
                if (Math.random() < 0.008) {
                    next.push({ type: 'coin', y: -100, x: Math.random() * (window.innerWidth - 100) + 50, id: Math.random() });
                }

                // Rare spawn power-ups in-game
                if (Math.random() < 0.0015) {
                    const types = ['shield', 'mult', 'invincible'];
                    const type = types[Math.floor(Math.random() * types.length)];
                    next.push({ type: 'powerup', powerType: type, y: -100, x: Math.random() * (window.innerWidth - 100) + 50, id: Math.random() });
                }

                return next;
            });

            setMines(prev => {
                const next = prev.map(m => ({ ...m, y: m.y + currentSpeed * 1.2 })).filter(m => m.y < window.innerHeight + 50);
                // Mines spawn starting from wave 2
                if (wave >= 2 && Math.random() < 0.005 + (wave * 0.002)) {
                    next.push({ y: -100, x: Math.random() * (window.innerWidth - 100) + 50, id: Math.random() });
                }
                return next;
            });
        }, 1000 / 60);

        return () => clearInterval(gameLoop);
    }, [gameState, wave]);

    // 4. Collisions
    useEffect(() => {
        if (gameState !== 'PLAYING') return;

        let currentShield = activeBuffs.shield;

        cards.forEach(c => {
            const playerScreenX = window.innerWidth / 2 + playerPosRef.current.x;
            const playerScreenY = window.innerHeight - 180 + playerPosRef.current.y;
            const dist = Math.sqrt(Math.pow(playerScreenX - c.x, 2) + Math.pow(playerScreenY - c.y, 2));

            if (dist < 45) {
                // Shield / Invincibility protection for negative/null cards
                if ((activeBuffs.invincible || currentShield) && c.value > 0) {
                    if (currentShield && !activeBuffs.invincible && c.value > 0) {
                        setActiveBuffs(b => ({ ...b, shield: false }));
                        currentShield = false; // Consumed for this frame
                    }
                    setCards(prev => prev.filter(p => p.id !== c.id));
                    const id = `pt-block-${Date.now()}-${Math.random()}`;
                    setFloatingTexts(p => [...p, { id, text: "BLOQUÉ!", x: playerScreenX, y: playerScreenY }]);
                    setTimeout(() => setFloatingTexts(p => p.filter(t => t.id !== id)), 600);
                    return;
                }

                setPoints(prev => {
                    const next = prev + c.value;
                    if (next >= 100) {
                        if (lives > 1) {
                            setLives(l => l - 1);
                            setShake(20);
                            const id = `life-loss-${Date.now()}`;
                            setFloatingTexts(p => [...p, { id, text: "-1 VIE!", x: playerScreenX, y: playerScreenY }]);
                            setTimeout(() => setFloatingTexts(p => p.filter(t => t.id !== id)), 1500);
                            return 0; // Reset total au lieu de 80
                        } else {
                            setGameState('GAMEOVER');
                            setShake(25);
                            return 100;
                        }
                    }
                    if (c.value > 0) setShake(2.0 + c.value * 0.5);
                    // CHARGE EMP SUR LES CARTES NÉGATIVES / NULL
                    if (c.value <= 0) {
                        let gain = 0;
                        if (c.value === -2) gain = 15;
                        else if (c.value === -1) gain = 10;
                        else if (c.value === 0) gain = 5;

                        if (gain > 0) {
                            setEnergy(prev => Math.min(100, prev + gain));
                            playSFX('emp_charge');
                            const energyId = `energy-gain-${Date.now()}`;
                            setFloatingTexts(p => [...p, { id: energyId, text: `EMP +${gain}%`, x: playerScreenX, y: playerScreenY - 30 }]);
                            setTimeout(() => setFloatingTexts(p => p.filter(t => t.id !== energyId)), 800);
                        }
                    }
                    return next;
                });
                setCards(prev => prev.filter(p => p.id !== c.id));
                playSFX('collect');
                const id = `pt-${Date.now()}-${Math.random()}`;
                setFloatingTexts(p => [...p, { id, text: c.value >= 0 ? `+${c.value}` : `${c.value}`, x: playerScreenX, y: playerScreenY }]);
                setTimeout(() => setFloatingTexts(p => p.filter(t => t.id !== id)), 600);
                return;
            }

        });

        collectibles.forEach(c => {
            const playerScreenX = window.innerWidth / 2 + playerPosRef.current.x;
            const playerScreenY = window.innerHeight - 180 + playerPosRef.current.y;
            const dist = Math.sqrt(Math.pow(playerScreenX - c.x, 2) + Math.pow(playerScreenY - c.y, 2));
            if (dist < 45) {
                if (c.type === 'powerup') {
                    // Activate powerup directly (by-passing inventory count check)
                    if (c.powerType === 'shield') setActiveBuffs(b => ({ ...b, shield: true }));
                    if (c.powerType === 'mult') setActiveBuffs(b => ({ ...b, multiplier: 3 }));
                    if (c.powerType === 'invincible') {
                        setActiveBuffs(b => ({ ...b, invincible: true }));
                        setTimeout(() => setActiveBuffs(b => ({ ...b, invincible: false })), 15000);
                    }

                    const labels = { shield: 'BOUCLIER ACTIF', mult: 'COMBO X3', invincible: 'IMMUNITÉ' };
                    const id = `pu-${Date.now()}`;
                    setFloatingTexts(p => [...p, { id, text: labels[c.powerType], x: playerScreenX, y: playerScreenY }]);
                    setTimeout(() => setFloatingTexts(p => p.filter(t => t.id !== id)), 1500);

                    setCollectibles(prev => prev.filter(p => p.id !== c.id));
                    playSFX('diamond');
                    return;
                }

                const gain = activeBuffs.multiplier;
                setCoins(p => {
                    const newTotal = p + gain;
                    localStorage.setItem('puffer_coins', newTotal);
                    return newTotal;
                });
                setCollectibles(prev => prev.filter(p => p.id !== c.id));
                playSFX('coin');
                const id = `coin-${Date.now()}-${Math.random()}`;
                setFloatingTexts(p => [...p, { id, text: `+${gain} SkyCredits`, x: playerScreenX, y: playerScreenY }]);
                setTimeout(() => setFloatingTexts(p => p.filter(t => t.id !== id)), 800);
            }
        });

        mines.forEach(m => {
            const playerScreenX = window.innerWidth / 2 + playerPosRef.current.x;
            const playerScreenY = window.innerHeight - 180 + playerPosRef.current.y;
            const dist = Math.sqrt(Math.pow(playerScreenX - m.x, 2) + Math.pow(playerScreenY - m.y, 2));
            if (dist < 40) {
                // Shield / Invincibility protection
                if (activeBuffs.invincible || currentShield) {
                    if (currentShield && !activeBuffs.invincible) {
                        setActiveBuffs(b => ({ ...b, shield: false }));
                        currentShield = false; // Consumed
                    }
                    setMines(prev => prev.filter(p => p.id !== m.id));
                    const id = `boom-block-${Date.now()}-${Math.random()}`;
                    setFloatingTexts(p => [...p, { id, text: "BLOQUÉ!", x: playerScreenX, y: playerScreenY }]);
                    setTimeout(() => setFloatingTexts(p => p.filter(t => t.id !== id)), 1000);
                    return;
                }

                // DIRECT LIFE LOSS FOR MINES
                if (lives > 1) {
                    setLives(l => l - 1);
                    setShake(30);
                    const id = `life-loss-boom-${Date.now()}`;
                    setFloatingTexts(p => [...p, { id, text: "BOOM! -1 HP", x: playerScreenX, y: playerScreenY }]);
                    playSFX('damage');
                    setTimeout(() => setFloatingTexts(p => p.filter(t => t.id !== id)), 1500);
                } else {
                    setLives(0);
                    setPoints(100);
                    setGameState('GAMEOVER');
                    playSFX('gameover');
                    setShake(40);
                }
                setMines(prev => prev.filter(p => p.id !== m.id));
                return;
            }
        });
    }, [cards, collectibles, mines, playerPos, activeBuffs, gameState]);

    // Reset progressif du thrust quand on s'arrête
    useEffect(() => {
        const timer = setInterval(() => {
            setShipState(prev => ({
                ...prev,
                thrust: Math.max(0, prev.thrust - 0.05)
            }));
        }, 50);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (gameState === 'GAMEOVER' || gameState === 'MENU') {
            const currentDist = Math.floor(distance / 10);
            if (currentDist > highScore) {
                setHighScore(currentDist);
                localStorage.setItem('puffer_highscore', currentDist);
            }
            // ARRÊTER TOUTES LES VIBRATIONS
            setShake(0);
            shakeRef.current = 0;
        }
    }, [gameState]);


    const handleMove = useCallback((e) => {
        if (gameState !== 'PLAYING' || !isDragging) return;

        // Optimization: Just update Ref, do not trigger Render
        inputRef.current = {
            x: e.clientX,
            y: e.clientY,
            active: true
        };

        // We still need to calculate tilt for visual feedback if possible, but let's leave it to game loop for now to save resources
    }, [gameState, isDragging]);

    const handlePointerDown = (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
        if (gameState !== 'PLAYING') return;

        try {
            e.target.setPointerCapture(e.pointerId);
        } catch (err) { }

        const touchX = e.clientX;
        const touchY = e.clientY;

        lastTouch.current = { x: touchX, y: touchY, time: Date.now() };
        inputRef.current = { x: touchX, y: touchY, active: true }; // Sync input ref immediately
        setIsDragging(true);
        setIsPuffed(true);
        setTimeout(() => setIsPuffed(false), 200);

        // Shockwave repulse cards on interaction based on player current position
        setCards(prev => prev.map(en => {
            const playerScreenX = window.innerWidth / 2 + playerPos.x;
            const playerScreenY = (window.innerHeight - 180) + playerPos.y;
            const dx = en.x - playerScreenX;
            const dy = en.y - playerScreenY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < SHOCKWAVE_RADIUS) {
                return { ...en, y: en.y - 120, x: en.x + (dx > 0 ? 60 : -60) };
            }
            return en;
        }));
    };

    const startGame = () => {
        setPoints(0);
        setWave(1);
        setLives(3);
        setDistance(0);
        setCards([]);
        setCollectibles([]);
        setMines([]);
        setPlayerPos({ x: 0, y: 0, vx: 0 }); // Start in center
        playerPosRef.current = { x: 0, y: 0, vx: 0 };
        inputRef.current.active = false;

        // Start Countdown
        setCountdown(3);
        setGameState('COUNTDOWN');
        setEnergy(0);
        setBoss(null);
        distanceRef.current = 0;
        lastPatternDistRef.current = 0;
    };

    const triggerEMP = () => {
        if (energy < 100 || gameState !== 'PLAYING') return;

        setEmpOrigin({ x: playerPosRef.current.x, y: playerPosRef.current.y });
        setEmpActive(true);
        playSFX('emp_blast');
        setEnergy(0);
        setShake(50);

        // Damage Boss
        if (boss) {
            setBoss(b => ({ ...b, hp: Math.max(0, b.hp - 5) }));
        }

        // Destroy all hurdles
        setCards([]);
        setMines([]);

        setTimeout(() => setEmpActive(false), 800);
    };

    // Countdown Logic
    useEffect(() => {
        if (gameState === 'COUNTDOWN' && countdown !== null) {
            if (countdown > 0) {
                const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
                return () => clearTimeout(timer);
            } else {
                setGameState('PLAYING');
                setCountdown(null);
            }
        }
    }, [gameState, countdown]);

    const activateItem = (type) => {
        if (inventory[type] <= 0) return;
        if (type === 'shield' && activeBuffs.shield) return;
        if (type === 'invincible' && activeBuffs.invincible) return;

        setInventory(prev => ({ ...prev, [type]: prev[type] - 1 }));

        if (type === 'shield') setActiveBuffs(b => ({ ...b, shield: true }));
        if (type === 'mult') setActiveBuffs(b => ({ ...b, multiplier: 3 }));
        if (type === 'invincible') {
            setActiveBuffs(b => ({ ...b, invincible: true }));
            setTimeout(() => setActiveBuffs(b => ({ ...b, invincible: false })), 15000);
        }

        const id = `${Date.now()}-${Math.random()}`;
        const labels = { shield: 'BOUCLIER ACTIF', mult: 'COMBO X3', invincible: 'IMMUNITÉ' };
        setFloatingTexts(p => [...p, { id, text: labels[type], x: 0, y: -100 }]);
        setTimeout(() => setFloatingTexts(p => p.filter(t => t.id !== id)), 1500);
    };

    return (
        <div
            className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center overflow-hidden touch-none select-none font-sans text-white z-[9999] retro-container"
            onPointerDown={handlePointerDown}
            onPointerMove={handleMove}
            onPointerUp={() => { setIsDragging(false); inputRef.current.active = false; }}
            onPointerLeave={() => { setIsDragging(false); inputRef.current.active = false; }}
            style={{
                height: '100dvh',
                fontFamily: 'Outfit, sans-serif',
                transform: shake > 0.5 ? `translate(${(Math.random() - 0.5) * shake}px, ${(Math.random() - 0.5) * shake}px)` : 'none'
            }}
        >
            <style>{`
                @keyframes vertical-scroll {
                    from { background-position-y: 0; }
                    to { background-position-y: 1000px; }
                }
                @keyframes speed-streak {
                    0% { transform: translateY(0) scaleY(0.1); opacity: 0; }
                    50% { transform: translateY(50px) scaleY(1); opacity: 0.5; }
                    100% { transform: translateY(100px) scaleY(0.1); opacity: 0; }
                }
                @keyframes vibration {
                    0% { transform: translate(0, 0); }
                    25% { transform: translate(0.5px, -0.5px); }
                    50% { transform: translate(-0.5px, 0.5px); }
                    75% { transform: translate(0.5px, 0.5px); }
                    100% { transform: translate(0, 0); }
                }
                @keyframes glitch-anim {
                    0% { clip: rect(44px, 450px, 56px, 0); transform: skew(0.35deg); }
                    5% { clip: rect(31px, 450px, 2px, 0); transform: skew(0.1deg); }
                    10% { clip: rect(56px, 450px, 44px, 0); transform: skew(0.5deg); }
                    15% { clip: rect(2px, 450px, 12px, 0); transform: skew(0.2deg); }
                    20% { clip: rect(12px, 450px, 31px, 0); transform: skew(0.85deg); }
                    100% { clip: rect(0, 0, 0, 0); transform: skew(0); }
                }
                @keyframes flicker {
                    0% { opacity: 0.8; }
                    5% { opacity: 0.5; }
                    10% { opacity: 0.9; }
                    15% { opacity: 0.3; }
                    20% { opacity: 0.8; }
                    100% { opacity: 1; }
                }
                .animate-speed-streak { animation: speed-streak 0.6s linear infinite; }
                .animate-vibration { animation: vibration 0.1s linear infinite; }
                .glitch-text::before, .glitch-text::after {
                    content: attr(data-text);
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0.8;
                }
                .glitch-text::before {
                    left: 2px;
                    text-shadow: -1px 0 #ff00c1;
                    clip: rect(44px, 450px, 56px, 0);
                    animation: glitch-anim 5s infinite linear alternate-reverse;
                }
                .glitch-text::after {
                    left: -2px;
                    text-shadow: -1px 0 #00fff9, 1px 1px #ff00c1;
                    animation: glitch-anim 2s infinite linear alternate-reverse;
                }
                .flicker-element {
                    animation: flicker 1.2s infinite;
                }
                @keyframes parallax-stars {
                    from { background-position-y: 0; }
                    to { background-position-y: 2000px; }
                }
                @keyframes parallax-nebula {
                    from { background-position-y: 0; }
                    to { background-position-y: 1000px; }
                }
                @keyframes nebula-float {
                    0% { transform: scale(1) translate(0, 0) rotate(0deg); }
                    50% { transform: scale(1.1) translate(-2%, -2%) rotate(2deg); }
                    100% { transform: scale(1) translate(0, 0) rotate(0deg); }
                }
                .animate-nebula-float { animation: nebula-float 20s ease-in-out infinite; }
                
                .ship-trail {
                    pointer-events: none;
                    filter: blur(4px);
                    box-shadow: 0 0 15px currentColor;
                    mix-blend-mode: screen;
                }
            `}</style>
            {/* Dynamic Background Sync with Overlay */}
            <div className="absolute inset-0 bg-slate-950 overflow-hidden pointer-events-none">
                {/* Space Dust & Distant Nebula */}
                <div className="absolute inset-0 opacity-40 bg-slate-950">
                    <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.1),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.1),transparent_50%),radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.05),transparent_60%)] animate-nebula-float" />
                </div>

                {/* Layer 1: Stars (Far) */}
                <div className={cn(
                    "absolute inset-0 opacity-20 bg-repeat bg-center animate-stars",
                    gameState === 'PLAYING' ? "" : "paused"
                )} style={{ backgroundImage: "radial-gradient(1.2px 1.2px at 20px 30px, #fff, rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 100px 150px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 250px 350px, #fff, rgba(0,0,0,0))", backgroundSize: '600px 600px' }} />

                {/* Layer 2: Middle Dust */}
                <div className={cn(
                    "absolute inset-0 opacity-10 bg-repeat bg-top animate-nebula",
                    gameState === 'PLAYING' ? "" : "paused"
                )} style={{ backgroundImage: `radial-gradient(2px 2px at 40px 40px, rgba(255,255,255,0.5), transparent), radial-gradient(3px 3px at 150px 150px, rgba(14,165,233,0.3), transparent)`, backgroundSize: '400px 400px' }} />

                {/* Overlay Gradient for depth */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-transparent to-slate-950/90" />
                <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[0.5px]" />
            </div>

            {/* HUD PRINCIPAL - BADGE UNIFIÉ (Visible en jeu et pause) */}
            {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
                <div className="absolute top-0 inset-x-0 p-2 pt-10 flex justify-center z-50 pointer-events-none">
                    <div className="glass-premium flex items-center gap-2 px-3 py-2 rounded-[2rem] border border-white/10 shadow-2xl pointer-events-auto">
                        <div className="flex flex-col items-center w-[70px] border-r border-white/5">
                            <span className="text-xl font-black italic tracking-tighter leading-none text-rose-500 [font-variant-numeric:tabular-nums]">
                                {lives}<span className="text-[9px] ml-0.5 opacity-50 uppercase font-bold">HP</span>
                            </span>
                            <span className="text-[7px] font-bold text-white/40 uppercase tracking-widest leading-none">Coques</span>
                        </div>

                        <div className="flex flex-col items-center w-[70px] border-r border-white/5">
                            <span className="text-xl font-black italic tracking-tighter leading-none text-sky-400 [font-variant-numeric:tabular-nums]">
                                {wave}<span className="text-[9px] ml-0.5 opacity-50 uppercase font-bold">wv</span>
                            </span>
                            <span className="text-[7px] font-bold text-white/40 uppercase tracking-widest">Secteur</span>
                        </div>

                        {/* SkyJo Points */}
                        <div className="flex flex-col items-center w-[70px] border-r border-white/5">
                            <span className={cn(
                                "text-xl font-black italic tracking-tighter leading-none transition-colors [font-variant-numeric:tabular-nums]",
                                points > 80 ? "text-rose-500 animate-pulse" : points > 50 ? "text-amber-400" : "text-emerald-400"
                            )}>
                                {points}<span className="text-[9px] ml-0.5 opacity-50 uppercase font-bold">pts</span>
                            </span>
                            <span className="text-[7px] font-bold text-white/40 uppercase tracking-widest leading-none">Score</span>
                        </div>

                        {/* Distance */}
                        <div className="flex flex-col items-center w-[80px] border-r border-white/5">
                            <span className="text-sm font-black italic text-slate-300 [font-variant-numeric:tabular-nums]">
                                {Math.floor(distance / 10)}
                            </span>
                            <span className="text-[7px] font-bold text-sky-400/60 uppercase tracking-widest leading-none">Dist.</span>
                        </div>

                        {/* Interaction Group */}
                        <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-white/5">
                            <button
                                onPointerDown={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                                className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full border border-white/5 text-slate-300 active:scale-90 transition-all"
                                title="Toggle Music"
                            >
                                {isMuted ? <VolumeX size={16} className="text-slate-500" /> : <Volume2 size={16} className="text-sky-400" />}
                            </button>
                            <button
                                onPointerDown={(e) => { e.stopPropagation(); setGameState('PAUSED'); }}
                                className="w-10 h-10 flex items-center justify-center bg-slate-900 rounded-full border border-white/10 text-white active:scale-90 transition-all shadow-xl"
                            >
                                <Pause size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* INVENTAIRE BAS PREMIUM */}
            {
                (gameState === 'PLAYING' || gameState === 'PAUSED') && (
                    <div className="absolute bottom-12 inset-x-0 z-[100] flex justify-center gap-6 pointer-events-none">
                        {[
                            { id: 'shield', icon: <ShieldIcon size={24} />, count: inventory.shield, color: "emerald", action: () => activateItem('shield') },
                            { id: 'mult', icon: <TrendingUp size={24} />, count: inventory.mult, color: "sky", action: () => activateItem('mult') },
                            { id: 'invincible', icon: <Heart size={24} />, count: inventory.invincible, color: "rose", action: () => activateItem('invincible') }
                        ].map(item => (
                            <button
                                key={item.id}
                                onPointerDown={(e) => { e.stopPropagation(); item.action(); }}
                                className={cn(
                                    "relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 pointer-events-auto shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden group border",
                                    item.count > 0
                                        ? `bg-slate-900/60 backdrop-blur-xl border-${item.color}-500/50 active:scale-90`
                                        : "bg-slate-950/20 border-white/5 opacity-20 grayscale cursor-not-allowed"
                                )}
                            >
                                <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-t", `from-${item.color}-500 to-transparent`)} />
                                <div className={cn("transition-all duration-300 group-active:scale-110", item.count > 0 ? `text-${item.color}-400 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]` : "text-white/20")}>
                                    {item.icon}
                                </div>

                                {/* Badge Quantité */}
                                {item.count > 0 && (
                                    <div className={cn("absolute -top-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-lg border border-slate-900 animate-in zoom-in", `bg-${item.color}-500`)}>
                                        {item.count}
                                    </div>
                                )}

                                {/* Lueur si chargé */}
                                {item.count > 0 && (
                                    <div className={cn("absolute inset-0 rounded-2xl animate-pulse blur-xl -z-10", `bg-${item.color}-500/20`)} />
                                )}
                            </button>
                        ))}
                    </div>
                )
            }

            {/* BOUTON EMP PREMIUM (Style Cyberpunk/Arcade) */}
            {
                (gameState === 'PLAYING' || gameState === 'PAUSED') && (
                    <div className="absolute bottom-32 right-6 z-[110] flex flex-col items-center gap-3 pointer-events-none">
                        <div className="relative group pointer-events-auto">
                            {/* Halos de lueur dynamiques */}
                            {energy === 100 && (
                                <>
                                    <div className="absolute inset-[-15px] rounded-full bg-amber-500/30 blur-2xl animate-pulse" />
                                    <div className="absolute inset-[-5px] rounded-full border border-amber-400/50 animate-[ping_2s_linear_infinite]" />
                                </>
                            )}

                            <button
                                onPointerDown={(e) => { e.stopPropagation(); triggerEMP(); }}
                                className={cn(
                                    "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 border-2 shadow-2xl relative overflow-hidden outline-none",
                                    energy === 100
                                        ? "bg-gradient-to-br from-amber-400 to-amber-600 border-white/40 text-slate-950 scale-110 active:scale-95 shadow-[0_0_30px_rgba(245,158,11,0.6)]"
                                        : "bg-slate-900/80 backdrop-blur-xl border-white/10 text-white/20 grayscale opacity-60"
                                )}
                            >
                                {/* Inner Glow Layer */}
                                {energy === 100 && (
                                    <div className="absolute inset-0 bg-white/20 animate-pulse mix-blend-overlay" />
                                )}

                                <Zap
                                    size={32}
                                    className={cn(
                                        "relative z-10 transition-transform duration-300",
                                        energy === 100 ? "rotate-[11deg] drop-shadow-lg scale-110" : "scale-90 opacity-50"
                                    )}
                                />

                                {/* Percentage Center (Charging) */}
                                {energy > 0 && energy < 100 && (
                                    <div className="absolute inset-x-0 bottom-4 flex justify-center">
                                        <span className="text-[11px] font-black text-amber-500 bg-slate-950/90 px-1.5 py-0.5 rounded-md border border-amber-500/40 shadow-xl">
                                            {Math.floor(energy)}%
                                        </span>
                                    </div>
                                )}

                                {/* Circle Progress Rail Premium */}
                                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                                    <circle
                                        cx="40" cy="40" r="36"
                                        fill="none"
                                        stroke="rgba(255,255,255,0.05)"
                                        strokeWidth="6"
                                    />
                                    <circle
                                        cx="40" cy="40" r="36"
                                        fill="none"
                                        stroke={energy === 100 ? "white" : "#f59e0b"}
                                        strokeWidth="6"
                                        strokeLinecap="round"
                                        strokeDasharray={2 * Math.PI * 36}
                                        strokeDashoffset={2 * Math.PI * 36 * (1 - energy / 100)}
                                        className="transition-all duration-300"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* READY Badge Premium */}
                        <AnimatePresence>
                            {energy === 100 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    className="pointer-events-none"
                                >
                                    <div className="bg-amber-500 text-slate-950 px-3 py-1 rounded-full text-[10px] font-black italic tracking-[0.2em] shadow-lg border border-white/30 animate-bounce shadow-amber-500/40 uppercase">
                                        EMP Ready
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )
            }

            {/* Game Content - Visible in PLAYING, PAUSED, and GAMEOVER */}
            {
                (gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'GAMEOVER') && (
                    <>
                        {/* Wave overlay removed as requested */}

                        {/* Floating Feedback */}
                        {floatingTexts.map(t => (
                            <div key={t.id} className="absolute pointer-events-none animate-float-text text-amber-400 font-black text-2xl italic tracking-tighter" style={{ left: t.x, top: t.y }}>
                                {t.text}
                            </div>
                        ))}


                        {/* Wave Announcement Overlay */}
                        {waveAnnounce && (
                            <div className="absolute inset-0 flex items-center justify-center z-[100] pointer-events-none">
                                <div className="bg-white/10 backdrop-blur-3xl px-12 py-6 rounded-full border border-white/20 animate-in zoom-in slide-in-from-top-12 duration-500">
                                    <h2 className="text-6xl font-black italic tracking-tighter text-white drop-shadow-2xl">
                                        {waveAnnounce}
                                    </h2>
                                </div>
                            </div>
                        )}
                        {/* EMP Effect Overlay */}
                        <AnimatePresence>
                            {empActive && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0.8, x: "-50%", y: "50%" }}
                                    animate={{ scale: 4, opacity: 0, x: "-50%", y: "50%" }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="absolute z-50 rounded-full border-[20px] border-amber-400/50 shadow-[0_0_100px_rgba(251,191,36,0.4)] pointer-events-none"
                                    style={{
                                        left: `calc(50% + ${empOrigin.x}px)`,
                                        bottom: `calc(180px + ${empOrigin.y}px)`,
                                        width: '500px',
                                        height: '500px'
                                    }}
                                />
                            )}
                        </AnimatePresence>

                        {/* Boss Rendering */}
                        {boss && (
                            <motion.div
                                className="absolute top-[80px] z-40 will-change-transform"
                                style={{ left: 0, transform: `translate3d(${boss.x}px, 0, 0) translateX(-50%)` }}
                            >
                                <div className="relative group">
                                    <div className="absolute inset-[-40px] bg-rose-600/20 blur-3xl animate-pulse rounded-full" />
                                    <div className="w-[120px] h-[100px] bg-slate-900 border-4 border-rose-500 rounded-[2rem] flex flex-col items-center justify-center shadow-[0_0_50px_rgba(244,63,94,0.4)]">
                                        <div className="w-full h-2 bg-slate-950 px-1 pt-1 rounded-t-xl mb-4">
                                            <div className="h-0.5 bg-rose-500 transition-all duration-300" style={{ width: `${(boss.hp / boss.maxHp) * 100}%` }} />
                                        </div>
                                        <AlertTriangle className="text-rose-500 animate-bounce mb-1" size={32} />
                                        <span className="text-[10px] font-black italic tracking-[0.2em] text-rose-500/80">CORE CORROMPU</span>
                                    </div>
                                    {/* Boss Spikes */}
                                    <div className="absolute top-0 inset-x-0 h-full">
                                        {[0, 1, 2].map(i => (
                                            <div key={i} className="absolute -top-4 bg-rose-900 w-2 h-6 rounded-full" style={{ left: `${25 + i * 25}%` }} />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Trails effect */}
                        {trails.map((t, i) => (
                            <div
                                key={t.id}
                                className="absolute z-20 ship-trail"
                                style={{
                                    left: '50%',
                                    bottom: '180px',
                                    transform: `translate3d(${t.x}px, ${t.y}px, 0) translateX(-50%) rotate(${t.tilt}deg) scale(${1 - i * 0.1})`,
                                    opacity: (5 - i) * 0.04,
                                    color: activeBuffs.invincible ? '#f43f5e' : activeBuffs.shield ? '#10b981' : '#0ea5e9'
                                }}
                            >
                                {/* Silhouette simplifiée au lieu du vaisseau complet pour la perf et le look */}
                                <div className="w-16 h-16 bg-current rounded-full blur-xl opacity-50" />
                            </div>
                        ))}

                        {/* Player - Dynamic Position */}
                        {/* Player - Dynamic Position with GPU Transform */}
                        <div
                            className="absolute z-30 will-change-transform"
                            style={{
                                left: '50%',
                                bottom: '180px',
                                transform: `translate3d(${playerPos.x}px, ${playerPos.y}px, 0) translateX(-50%)`
                            }}
                        >
                            {/* HALOS DE PUISSANCE V2 */}
                            {activeBuffs.shield && (
                                <>
                                    <div className="absolute inset-[-25px] rounded-full bg-emerald-500/30 blur-xl animate-pulse -z-10" />
                                    <div className="absolute inset-[-10px] rounded-full border-2 border-emerald-400/50 animate-[spin_3s_linear_infinite] -z-10 opacity-70" />
                                </>
                            )}
                            {activeBuffs.multiplier > 1 && (
                                <>
                                    <div className="absolute inset-[-35px] rounded-full bg-sky-500/30 blur-2xl animate-pulse -z-10" style={{ animationDuration: '1s' }} />
                                    <div className="absolute inset-[-15px] rounded-full border border-sky-400/60 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite] -z-10 opacity-60" />
                                </>
                            )}
                            {activeBuffs.invincible && (
                                <>
                                    <div className="absolute inset-[-40px] rounded-full bg-gradient-to-t from-rose-500 via-purple-500 to-sky-500 opacity-40 blur-3xl animate-spin -z-10" style={{ animationDuration: '3s' }} />
                                    <div className="absolute inset-[-20px] rounded-full border-4 border-rose-500/30 animate-[spin_1s_linear_infinite_reverse] -z-10" />
                                </>
                            )}

                            <Spaceship
                                tilt={shipState.tilt}
                                isFiring={isDragging}
                                showShield={activeBuffs.shield || activeBuffs.invincible}
                                thrustIntensity={shipState.thrust}
                            />
                        </div>

                        {/* Cards - Vertical Scroll GPU Optimized */}
                        {cards.map(c => (
                            <div key={c.id} className="absolute will-change-transform" style={{ left: 0, top: 0, transform: `translate3d(${c.x}px, ${c.y}px, 0) translateX(-50%)` }}>
                                <SkyjoMalusBot value={c.value} />
                            </div>
                        ))}

                        {/* Coins & Powerups - Vertical Scroll GPU Optimized */}
                        {collectibles.map(c => (
                            <div key={c.id} className="absolute will-change-transform" style={{ left: 0, top: 0, transform: `translate3d(${c.x}px, ${c.y}px, 0) translateX(-50%)` }}>
                                {c.type === 'powerup' ? (
                                    <div className="relative group">
                                        <div className={cn("absolute inset-0 rounded-full blur-md animate-ping opacity-50",
                                            c.powerType === 'shield' ? "bg-emerald-400" : c.powerType === 'mult' ? "bg-sky-400" : "bg-rose-400"
                                        )} />
                                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border-2 shadow-2xl animate-bounce",
                                            c.powerType === 'shield' ? "bg-emerald-900/80 border-emerald-400 text-emerald-400" :
                                                c.powerType === 'mult' ? "bg-sky-900/80 border-sky-400 text-sky-400" :
                                                    "bg-rose-900/80 border-rose-400 text-rose-400"
                                        )}>
                                            {c.powerType === 'shield' ? <ShieldIcon size={24} /> : c.powerType === 'mult' ? <TrendingUp size={24} /> : <Heart size={24} />}
                                        </div>
                                    </div>
                                ) : (
                                    <SkyjoEnergyCore />
                                )}
                            </div>
                        ))}

                        {/* Mines Rendering GPU Optimized */}
                        {mines.map(m => (
                            <div key={m.id} className="absolute will-change-transform" style={{ left: 0, top: 0, transform: `translate3d(${m.x}px, ${m.y}px, 0) translateX(-50%)` }}>
                                <SkyjoMine />
                            </div>
                        ))}
                    </>
                )
            }

            {/* OVERLAY PAUSE */}
            {
                gameState === 'PAUSED' && (
                    <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center p-8">
                        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />
                        <div className="relative z-10 glass-premium p-10 rounded-[3rem] border border-white/10 flex flex-col items-center gap-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                            <div className="flex flex-col items-center gap-2">
                                <h2 className="text-5xl font-black italic tracking-tighter text-white">PAUSE</h2>
                                <div className="h-1 w-20 bg-sky-500 rounded-full" />
                            </div>

                            <div className="flex flex-col gap-4 w-64">
                                <button
                                    onPointerDown={() => setGameState('PLAYING')}
                                    className="w-full flex items-center justify-center gap-4 bg-gradient-to-br from-sky-500 to-indigo-600 p-6 rounded-3xl font-black text-2xl text-white shadow-xl border-b-8 border-sky-800 active:translate-y-2 active:border-b-0 transition-all hover:scale-105"
                                >
                                    <Play fill="white" size={24} /> REPRENDRE
                                </button>

                                <button
                                    onPointerDown={() => setGameState('MENU')}
                                    className="w-full flex items-center justify-center gap-3 bg-slate-800 p-4 rounded-2xl font-black text-xs text-slate-400 uppercase tracking-widest border border-white/5 active:scale-95 transition-all"
                                >
                                    <X size={16} /> Quitter la partie
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* MENU PRINCIPAL */}
            {
                gameState === 'MENU' && (
                    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-8">
                        {/* WARNING BANNER */}
                        {/* WARNING BANNER CLEAN */}
                        <div className="absolute top-6 z-50 px-6 py-2 rounded-full border border-rose-500/30 bg-rose-950/40 backdrop-blur-md shadow-[0_0_20px_rgba(244,63,94,0.2)] flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-rose-200/90 drop-shadow-sm">
                                PROTOTYPE ALPHA <span className="text-rose-500 mx-2">//</span> GAMEPLAY NON DÉFINITIF
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                        </div>

                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl" />

                        <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
                            <div className="mb-8 scale-150 drop-shadow-[0_0_30px_rgba(45,212,191,0.4)]">
                                <Spaceship tilt={0} isFiring={true} showShield={true} thrustIntensity={1} />
                            </div>

                            <div className="text-center mb-8 space-y-2">
                                <h1
                                    className="text-6xl font-black italic tracking-tighter leading-none text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] relative glitch-text flicker-element"
                                    data-text="SKY THEM UP"
                                >
                                    SKY<br />THEM UP
                                </h1>
                                <div className="h-1.5 w-24 bg-skyjo-blue mx-auto rounded-full overflow-hidden relative">
                                    <div className="absolute inset-0 bg-cyan-400 blur-sm animate-pulse" />
                                    <div className="h-full w-full bg-gradient-to-r from-sky-400 via-white to-sky-400 animate-shimmer relative z-10" />
                                </div>
                            </div>

                            <div className="w-full space-y-4">
                                <button
                                    onPointerDown={startGame}
                                    className="w-full flex items-center justify-center gap-4 bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-[2rem] font-black text-3xl text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)] border-b-8 border-emerald-800 active:translate-y-2 active:border-b-0 transition-all hover:scale-[1.02]"
                                >
                                    <Play fill="white" size={32} /> JOUER
                                </button>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onPointerDown={() => setGameState('SHOP')}
                                        className="flex items-center justify-center gap-3 bg-slate-900/90 p-4 rounded-3xl font-black border-b-[6px] border-slate-950 active:translate-y-1 active:border-b-0 transition-all uppercase tracking-widest text-[11px] text-slate-200 border border-white/5"
                                    >
                                        <Store size={18} className="text-sky-400" /> BOUTIQUE
                                    </button>

                                    <button
                                        onPointerDown={() => setShowTutorial(true)}
                                        className="flex items-center justify-center gap-3 bg-slate-900/90 p-4 rounded-3xl font-black border-b-[6px] border-slate-950 active:translate-y-1 active:border-b-0 transition-all uppercase tracking-widest text-[11px] text-slate-300 border border-white/5"
                                    >
                                        <Heart size={18} className="text-rose-400" /> AIDE
                                    </button>
                                </div>

                                <button
                                    onPointerDown={onBack}
                                    className="w-full mt-4 flex items-center justify-center gap-3 bg-rose-500/90 p-5 rounded-[2rem] font-black border-b-[6px] border-rose-800 active:translate-y-1 active:border-b-0 transition-all uppercase tracking-widest text-[11px] text-white border border-rose-400/20"
                                >
                                    <X size={18} strokeWidth={3} /> QUITTER
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* BOUTIQUE DESIGN PREMIUM */}
            {
                gameState === 'SHOP' && (
                    <div className="absolute inset-0 z-50 flex flex-col">
                        <div className="absolute inset-0 bg-slate-950" />
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_0%,#475569,transparent)]" />

                        <div className="relative z-10 flex flex-col h-full p-8 pb-12">
                            <div className="flex justify-between items-start mb-10 pt-10">
                                <div className="space-y-1">
                                    <h2 className="text-5xl font-black italic tracking-tighter leading-none text-white">SHOP</h2>
                                    <div className="h-1.5 w-16 bg-sky-500 rounded-full" />
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="bg-slate-900/80 backdrop-blur-xl px-5 py-2.5 rounded-[2rem] border border-white/10 shadow-2xl flex items-center gap-3">
                                        <span className="text-amber-400 font-black text-2xl tracking-tighter">{coins.toLocaleString()}</span>
                                        <div className="bg-gradient-to-tr from-amber-600 to-amber-400 px-3 py-1 rounded-xl flex items-center justify-center shadow-lg">
                                            <span className="text-[10px] text-amber-900 font-black uppercase tracking-widest">SKYCREDITS</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pb-6 mask-linear-fade">
                                {[
                                    { id: 'shield', name: 'BOUCLIER', cost: 100, icon: <Shield className="text-emerald-400" />, desc: 'Bloque 1 impact malussien. (1 Unité)', effect: () => setInventory(prev => ({ ...prev, shield: prev.shield + 1 })), color: "emerald" },
                                    { id: 'mult', name: 'COMBO X3', cost: 300, icon: <TrendingUp className="text-sky-400" />, desc: 'Triple les gains de SkyCredits récoltés.', effect: () => setInventory(prev => ({ ...prev, mult: prev.mult + 1 })), color: "sky" },
                                    {
                                        id: 'wave', name: 'IMMUNITÉ', cost: 800, icon: <Heart className="text-rose-400" />, desc: 'Invincibilité totale pendant 15 secondes.', effect: () => setInventory(prev => ({ ...prev, invincible: prev.invincible + 1 })), color: "rose"
                                    },
                                ].map(item => (
                                    <button
                                        key={item.id}
                                        onPointerDown={() => { if (coins >= item.cost) { setCoins(c => c - item.cost); item.effect(); } }}
                                        className={cn(
                                            "flex items-center gap-6 p-6 rounded-[2.5rem] border-b-8 transition-all w-full relative group overflow-hidden",
                                            coins >= item.cost
                                                ? "glass-premium border-slate-950 active:translate-y-2 active:border-b-0"
                                                : "opacity-40 grayscale cursor-not-allowed border-black bg-slate-900/50"
                                        )}
                                    >
                                        <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
                                        <div className="p-5 bg-slate-900/50 rounded-2xl border border-white/10 group-active:scale-90 transition-transform">{item.icon}</div>
                                        <div className="flex-1 text-left space-y-0.5">
                                            <div className="font-black text-xl italic leading-none text-white">{item.name}</div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.desc}</div>
                                        </div>
                                        <div className="text-2xl font-black text-amber-400 italic tracking-tighter">{item.cost}</div>
                                    </button>
                                ))}
                            </div>
                            {/* Back Button */}
                            <div className="mt-auto pt-8 pb-4">
                                <button
                                    onPointerDown={() => setGameState('MENU')}
                                    className="w-full py-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-black italic uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 group overflow-hidden relative"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                    <span>RETOUR AU MENU</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* GAME OVER DESIGN SKYJO */}
            {
                gameState === 'GAMEOVER' && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-10 overflow-hidden">
                        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-3xl" />
                        <div className="absolute inset-0 bg-gradient-to-b from-rose-950/80 via-transparent to-slate-950" />

                        <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
                            <div className="mb-4 animate-float">
                                <div className="w-24 h-24 bg-rose-950/50 rounded-3xl border border-white/20 flex items-center justify-center rotate-45 shadow-glow-rose drop-shadow-2xl">
                                    <X size={48} className="text-rose-500 -rotate-45" strokeWidth={5} />
                                </div>
                            </div>

                            <h2 className="text-6xl font-black italic mb-2 tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] text-center leading-[0.8]">
                                SCORE : {points}<br /><span className="text-2xl opacity-40 uppercase tracking-[0.3em]">Sur 100</span>
                            </h2>

                            <div className="flex flex-wrap justify-center gap-2 mb-8">
                                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-xl overflow-hidden relative">
                                    <Trophy size={14} className="text-amber-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Vague {wave}</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-xl overflow-hidden relative">
                                    <Sparkles size={14} className="text-amber-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-200">Session : {Math.floor(distance / 50)} 🪙</span>
                                </div>
                            </div>

                            <div className="glass-premium border border-white/10 p-8 rounded-[3rem] w-full mb-8 text-center shadow-[0_15px_40px_rgba(0,0,0,0.5)] relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/10 to-transparent" />
                                <div className="relative z-10">
                                    <div className="text-[10px] text-white/30 font-black uppercase mb-2 tracking-[0.5em]">Abysse total</div>
                                    <div className="text-7xl font-black italic tracking-tighter text-white">{Math.floor(distance / 10)}<span className="text-xl ml-0.5 text-sky-400">M</span></div>
                                    <div className="mt-4 flex items-center justify-center gap-3 opacity-40">
                                        <div className="h-px w-4 bg-white/20" />
                                        <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest">RECORD : {highScore}M</div>
                                        <div className="h-px w-4 bg-white/20" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 w-full">
                                <button
                                    onPointerDown={startGame}
                                    className="w-full bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 py-5 rounded-[2rem] font-black text-xl border-b-4 border-emerald-800 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(16,185,129,0.2)]"
                                >
                                    <RotateCcw strokeWidth={4} size={24} /> RETENTER
                                </button>
                                <button
                                    onPointerDown={() => setGameState('MENU')}
                                    className="w-full py-4 rounded-[1.5rem] bg-white/5 border border-white/10 text-white/60 font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all text-center"
                                >
                                    MENU PRINCIPAL
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* COUNTDOWN OVERLAY */}
            <AnimatePresence mode="wait">
                {gameState === 'COUNTDOWN' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[150] flex items-center justify-center bg-slate-950/20 backdrop-blur-sm pointer-events-none"
                    >
                        <motion.div
                            key={countdown}
                            initial={{ scale: 2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ duration: 0.5, ease: "backOut" }}
                            className="text-9xl font-black italic tracking-tighter text-white drop-shadow-[0_0_50px_rgba(34,211,238,0.5)]"
                        >
                            {countdown === 0 ? "START!" : countdown}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* TUTORIAL OVERLAY */}
            {
                showTutorial && (
                    <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 pb-20 overflow-y-auto no-scrollbar">
                        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-3xl" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="relative bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[4rem] border border-white/10 w-full max-w-sm shadow-[0_40px_100px_rgba(0,0,0,0.8)] space-y-10"
                        >
                            <div className="text-center space-y-3">
                                <div className="w-20 h-20 bg-gradient-to-tr from-sky-600 to-cyan-400 rounded-3xl mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.3)] rotate-[15deg] border-2 border-white/20">
                                    <Sparkles className="text-white drop-shadow-lg" size={40} />
                                </div>
                                <h2 className="text-4xl font-black italic tracking-tighter text-white pt-6 leading-none">MAITRISE<br />L&apos;ABYSSE</h2>
                            </div>

                            <div className="space-y-8">
                                {[
                                    { icon: <TrendingUp className="text-rose-500" />, title: "Survis", desc: "Évite les cartes pour rester sous la barre des 100 points." },
                                    { icon: <Sparkles className="text-amber-400" />, title: "Fortune", desc: "Collecte les diamants pour accumuler des SkyCredits." },
                                    { icon: <Zap className="text-rose-600" />, title: "Danger", desc: "Évite les mines (Secteur 2+) : Malus critique +15." },
                                    { icon: <Play className="text-sky-400" />, title: "Contrôle", desc: "Drag & drop partout pour piloter ton vaisseau." }
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-6 items-center">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10 shadow-inner">
                                            {step.icon}
                                        </div>
                                        <div className="space-y-0.5">
                                            <h3 className="font-black text-sm text-white uppercase tracking-widest">{step.title}</h3>
                                            <p className="text-[11px] text-white/40 leading-tight font-bold">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onPointerDown={() => {
                                    setShowTutorial(false);
                                    localStorage.setItem('arcade_tutorial_done', 'true');
                                }}
                                className="w-full bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-[0_15px_40px_rgba(16,185,129,0.3)] border-b-4 border-emerald-800"
                            >
                                Démarrage
                            </button>
                        </motion.div>
                    </div>
                )
            }
        </div >
    );
}
