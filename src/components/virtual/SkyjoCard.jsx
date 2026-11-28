import { memo, useId } from 'react';
import { Lock } from 'lucide-react';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';
import '../../styles/Tabletop.css';
import { useGameStore } from '../../store/gameStore';
import { getCardSkinPath } from '../../lib/skinUtils';

// Simple haptic feedback for card touches
const triggerHaptic = () => {
    if (navigator.vibrate) {
        navigator.vibrate(50); // Perceptible tap on Android
    }
};

const VALUE_STYLES = {
    '-2': ['#c5cfff', '#8796e0', '#bbc8ff', 'stars'],
    '-1': ['#a9ddff', '#57abe4', '#a4deff', 'stars'],
    0: ['#a0f1f1', '#50c5ce', '#97ecf4', 'moon'],
    1: ['#b0f4d6', '#63cfaa', '#a3efcd', 'sun', 'M4 24Q16 20 25 26T46 26Q54 22 60 25'],
    2: ['#c9f1b3', '#86c667', '#b9eb9e', 'sun', 'M4 28Q13 16 21 21Q29 27 34 27Q45 17 60 26'],
    3: ['#e5f09e', '#b9ca51', '#e4ed9a', 'sun', 'M4 29L15 17L26 28L35 23L43 28L51 18L60 26'],
    4: ['#fff3b3', '#e9c85f', '#ffed9e', 'sun', 'M4 28H18Q25 17 32 20Q39 20 46 28H60'],
    5: ['#ffe093', '#efa443', '#ffd977', 'sun', 'M4 17L13 18L20 24Q26 28 34 28L47 26L60 22'],
    6: ['#ffd3a5', '#f5894f', '#ffc690', 'sun', 'M4 25Q17 31 27 27Q42 14 53 19L60 21'],
    7: ['#ffbba5', '#ee7061', '#ffad92', 'sun', 'M4 26L14 24L20 27H33L39 23V18H52V23L60 26'],
    8: ['#ffced0', '#ec8298', '#ffb6cd', 'sun', 'M4 28Q13 18 20 28Q29 19 36 28Q44 19 51 27L60 25'],
    9: ['#f986aa', '#e85e91', '#ff9dba', 'sun', 'M4 28H11L16 18L21 28H39L47 22L52 12L60 26'],
    10: ['#ff9a70', '#ee654f', '#ffa085', 'sun', 'M4 19L11 16L19 22L20 29H44L46 22L55 17L60 20'],
    11: ['#ab3555', '#66152f', '#ff809c', 'sun', 'M4 25L12 25L18 29L27 29L32 24L40 27L46 20L53 24L60 19'],
    12: ['#b43728', '#781719', '#ff8a6a', 'sun', 'M4 27H22L28 24L32 23L37 24L42 27H60'],
    13: ['#ffa750', '#f17640', '#ffc17f', 'curse'],
    '-10': ['#d0c2fc', '#9273c9', '#e6c6ff', 'constellation'],
    20: ['#80283c', '#391526', '#ff9b7d', 'eclipse'],
    S: ['#517e94', '#183d56', '#c0fff0', 'exchange'],
    C: ['#776ea7', '#332956', '#f2eaff', 'joker'],
    CH: ['#71758c', '#30344a', '#ffdc9c', 'chest'],
    H: ['#645781', '#22192e', '#ddcdfa', 'blackHole'],
};

const ACTION_MARKS = {
    exchange: (
        <>
            <path d="M3.5 10a8.7 8.7 0 0 1 15-3.8l1.2 1.2m-.1-4v4.2h-4.3M20.5 14a8.7 8.7 0 0 1-15 3.8l-1.2-1.2m.1 4v-4.2h4.3" />
            <Star x={12} y={12} scale={.6} />
        </>
    ),
    joker: (
        <path d="M10.5 3q1.8 7.2 8.5 8.5-6.7 1.3-8.5 8.5Q8.7 12.8 2 11.5 8.7 10.2 10.5 3ZM19 3v5m-2.5-2.5h5m-2 10.5v4m-2-2h4" />
    ),
    chest: (
        <>
            <path d="M3 11V8q0-3 4-3h10q4 0 4 3v3M3 11v8h18v-8M3 11h6m6 0h6M7 5v3m10-3v3M7 16v3m10-3v3" />
            <path d="M12 9.5l3 3-3 4-3-4Z" fill="#1c2438" />
            <circle cx="12" cy="12.6" r=".8" fill="currentColor" stroke="none" />
        </>
    ),
    blackHole: (
        <>
            <path d="M2 9C5 4 10 3 15 5c4 2 5 7 2 10M22 15c-3 5-8 6-13 4-4-2-5-7-2-10" stroke="#e19a7c" />
            <path d="M3 15c1 3 3 5 6 6m12-12c-1-3-3-5-6-6" opacity=".85" />
            <circle cx="12" cy="12" r="5.35" fill="#080914" stroke="#f6ad77" />
            <path d="M7 10.2a5.35 5.35 0 0 1 7-3.25" stroke="#fff1bf" />
        </>
    ),
};

const CONSTELLATION = [[8, 19], [14, 12], [22, 15], [29, 7], [37, 11], [44, 7], [53, 13], [61, 8], [64, 17], [55, 22]];
const CONSTELLATION_LINE = CONSTELLATION.map(point => point.join(',')).join(' ');

function Star({ x, y, scale }) {
    return <path d="M0-5 Q.8-.8 5 0 Q.8.8 0 5 Q-.8.8-5 0 Q-.8-.8 0-5Z" fill="currentColor" stroke="none" transform={`translate(${x} ${y}) scale(${scale})`} />;
}

function CardSky({ value, motif, horizonProfile, horizonId }) {
    if (motif === 'sun') {
        const sunHeight = 8 + (value - 1) * 1.72;
        return (
            <svg className="vesper-card-sky vesper-card-sky--sun" viewBox="0 0 64 36" aria-hidden="true">
                <defs><clipPath id={horizonId}><path d={`${horizonProfile} V-6H4Z`} /></clipPath></defs>
                <g clipPath={`url(#${horizonId})`}>
                    <circle cx="32" cy={sunHeight} r="11.5" fill="#fff4d2" opacity=".55" />
                    <circle cx="32" cy={sunHeight} r="7.8" fill="var(--vesper-sun, #fff2bc)" stroke="currentColor" strokeWidth="1.45" />
                </g>
                <path d={`${horizonProfile} V35H4Z`} fill="currentColor" opacity=".20" />
                <path d={horizonProfile} fill="none" stroke="currentColor" strokeOpacity=".84" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }
    if (motif === 'eclipse') {
        return (
            <svg className="vesper-card-sky vesper-card-sky--eclipse" viewBox="0 0 70 32" aria-hidden="true">
                <circle cx="35" cy="16" r="13.2" fill="#9b3749" opacity=".42" />
                <path d="M18 16h-7m41 0h7M22 7l-5-3m31 3 5-3M23 25l-6 4m30-4 6 4" fill="none" stroke="#ff9b74" strokeWidth="1.15" strokeLinecap="round" />
                <circle cx="35" cy="16" r="10.1" fill="#1d1424" stroke="#ffe5a5" strokeWidth="1.6" />
                <path d="M25 15a10 10 0 0 1 14-8" fill="none" stroke="#fff8df" strokeLinecap="round" strokeWidth="1.45" />
            </svg>
        );
    }
    if (motif === 'curse') {
        return (
            <svg className="vesper-card-sky vesper-card-sky--curse" viewBox="0 0 70 30" aria-hidden="true">
                <path d="M35 2l11 7v11l-11 7-11-7V9Z" fill="#542339" stroke="#ffdb9c" strokeWidth="1.4" />
                <path d="M35 18c-6-1-6-6-3-8l2 4c0-4 2-6 4-7-1 4 4 6 1 10-1 1-2 2-4 1Z" fill="#ffd196" />
                <path d="M19 11l-7 4 8 4m31-8 7 4-8 4" fill="none" stroke="currentColor" strokeWidth="1.4" />
            </svg>
        );
    }

    return (
        <svg className={cn('vesper-card-sky', motif === 'constellation' && 'vesper-card-sky--constellation')} viewBox="0 0 70 25" aria-hidden="true">
            {motif === 'moon' && <>
                <path d="M39 2a10 10 0 1 0 6 15 9.4 9.4 0 0 1-6-15Z" fill="currentColor" />
                <path d="M22 23q5-2 9 0t9 0m4-1h5" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity=".65" />
            </>}
            {motif === 'stars' && (Number(value) === -2
                ? <><Star x={25} y={16} scale={1.28} /><Star x={44} y={12} scale={1.28} /></>
                : <Star x={35} y={15} scale={1.5} />)}
            {motif === 'constellation' && <>
                <path d="M6 23Q32 3 65 19" fill="none" stroke="#492f71" strokeWidth="1.1" opacity=".55" />
                <polyline points={CONSTELLATION_LINE} fill="none" stroke="#573665" strokeWidth="1.15" />
                {CONSTELLATION.map(([x, y], i) => <Star key={x} x={x} y={y} scale={i === 3 || i === 6 ? .9 : .54} />)}
            </>}
        </svg>
    );
}

const SkyjoCard = memo(function SkyjoCard({
    card,
    size = 'md',
    isSelected = false,
    isClickable = false,
    isHighlighted = false,
    isShaking = false,
    isLocked = false,
    onClick,
    className,
    style,
}) {
    const reducedMotion = useReducedMotion();
    const horizonId = 'vesper-horizon-' + useId();
    // Shake animation variants
    const shakeVariants = {
        shake: {
            x: [0, -5, 5, -5, 5, 0],
            transition: { duration: 0.4 }
        }
    };
    // Dynamic sizing - 2:3 ratio
    const sizeStyles = {
        xs: {
            width: 'clamp(2.25rem, 7vw, 3.25rem)',
            height: 'clamp(2.25rem, 7.5vh, 3.375rem)',
            fontSize: 'clamp(0.95rem, 2.8vw, 1.4rem)',
            cornerFont: '0.46rem',
        },
        sm: {
            // En partie, la table fixe --skyjo-card-h / -w pour que tout tienne sans défilement.
            width: 'var(--skyjo-card-w, clamp(2.5rem, 7vw, 3.5rem))',
            height: 'var(--skyjo-card-h, clamp(3.2rem, 9vh, 4.2rem))',
            fontSize: 'clamp(1.25rem, 3.4vw, 1.7rem)',
            cornerFont: '0.5rem',
        },
        md: {
            width: 'clamp(2.7rem, 7.5vw, 3.8rem)',
            height: 'clamp(3.6rem, 10vh, 4.8rem)',
            fontSize: 'clamp(1.5rem, 4vw, 2.1rem)',
            cornerFont: '0.62rem',
        },
        lg: {
            width: 'clamp(3.5rem, 9vw, 4.5rem)',
            height: 'clamp(5.25rem, 13.5vh, 6.75rem)',
            fontSize: 'clamp(2.1rem, 6vw, 3.2rem)',
            cornerFont: '0.75rem',
        },
    };

    const currentSize = sizeStyles[size] || sizeStyles.md;

    // Robust retrieval with fallback
    const cardSkin = useGameStore(s => (s && s.cardSkin) ? s.cardSkin : 'classic');

    if (card === null) {
        return (
            <div
                className={cn(
                    "skyjo-card-slot rounded-lg",
                    className
                )}
                style={{
                    width: currentSize.width,
                    height: currentSize.height,
                }}
            />
        );
    }

    const isRevealed = card.isRevealed;
    const rawValue = card.specialType ?? card.value;
    const hasKnownValue = Object.hasOwn(VALUE_STYLES, rawValue);
    const value = hasKnownValue ? rawValue
        : card.color === 'gold' ? 'CH' : card.color === 'black' ? 'H' : null;
    const [sky, horizon, accent, motif, horizonProfile] = value === null ? VALUE_STYLES[0] : VALUE_STYLES[value];
    const actionMark = ACTION_MARKS[motif];
    const numericValue = Number(value);
    const darkEnamel = numericValue === 11 || numericValue === 12 || numericValue === 20;
    const isCurse = motif === 'curse';
    const displayValue = isCurse ? '+13' : String(value ?? rawValue ?? '—').replace(/^-/, '−');
    const classicBack = cardSkin === 'classic';
    const isFrozen = isLocked && card.isFrozen;
    const lockLabel = isFrozen ? ', gelée' : isLocked ? ', verrouillée' : '';

    return (
        <Motion.div
            className={cn(
                "skyjo-card perspective-1000 relative",
                isSelected && "skyjo-card--selected",
                isHighlighted && "skyjo-card--target",
                isClickable ? "cursor-pointer" : "cursor-default",
                className
            )}
            style={{
                '--card-accent': isRevealed ? accent : '#66e0bd',
                '--vesper-face-accent': accent,
                '--vesper-sky': sky,
                '--vesper-horizon': horizon,
                '--vesper-number-size': currentSize.fontSize,
                '--vesper-corner-size': currentSize.cornerFont,
                width: size === 'custom' ? undefined : currentSize.width,
                height: size === 'custom' ? undefined : currentSize.height,
                ...style // Allow overriding style
            }}
            onClick={isClickable ? () => { triggerHaptic(); onClick?.(); } : undefined}
            role={isClickable ? 'button' : 'img'}
            tabIndex={isClickable ? 0 : undefined}
            aria-label={(isRevealed ? 'Carte ' + displayValue : 'Carte face cachée') + lockLabel}
            aria-pressed={isClickable ? isSelected : undefined}
            onKeyDown={isClickable ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onClick?.();
                }
            } : undefined}
            whileHover={isClickable && !reducedMotion ? { scale: 1.045, y: -5, rotate: -1 } : undefined}
            whileTap={isClickable && !reducedMotion ? { scale: 0.97, y: 0 } : undefined}
            animate={isShaking && !reducedMotion ? 'shake' : { y: isSelected && !reducedMotion ? -5 : 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            variants={shakeVariants}
        >
            {/* Extended touch area */}
            {isClickable && (
                <div
                    className="absolute pointer-events-auto"
                    style={{ top: '-8px', left: '-8px', right: '-8px', bottom: '-8px', zIndex: 10 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic();
                        onClick?.();
                    }}
                />
            )}

            <Motion.div
                className="relative w-full h-full preserve-3d"
                animate={{ rotateY: isRevealed ? 0 : 180 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                initial={false}
            >
                <div
                    aria-hidden={!isRevealed}
                    className={cn(
                        "skyjo-card-face vesper-card-face absolute inset-0 backface-hidden overflow-hidden",
                        actionMark && "vesper-card-face--action",
                        numericValue >= 9 && "vesper-card-face--hot",
                        darkEnamel && "vesper-card-face--dark",
                        (numericValue === -10 || isCurse) && "vesper-card-face--wide",
                    )}
                >
                    {actionMark ? (
                        <svg className="vesper-card-action" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            {actionMark}
                        </svg>
                    ) : (
                        <>
                            {value !== null && <CardSky value={value} motif={motif} horizonProfile={horizonProfile} horizonId={horizonId} />}
                            <span className="vesper-card-corner vesper-card-corner--top" aria-hidden="true">{displayValue}</span>
                            <span className="vesper-card-value" aria-hidden="true">{displayValue}</span>
                            <span className="vesper-card-corner vesper-card-corner--bottom" aria-hidden="true">{displayValue}</span>
                        </>
                    )}

                    {/* Lock overlay */}
                    {isLocked && !isFrozen && (
                        <div className={cn(
                            "absolute z-20",
                            isCurse ? "vesper-card-curse-lock" : "inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]",
                        )}>
                            <Motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={isCurse ? undefined : "bg-slate-900/80 p-1.5 rounded-full border border-white/20 shadow-lg"}
                            >
                                <Lock className={isCurse ? undefined : "w-5 h-5 text-amber-400"} aria-hidden="true" />
                            </Motion.div>
                        </div>
                    )}
                </div>

                {/* BACK FACE */}
                <div
                    aria-hidden={isRevealed}
                    className={cn(
                        "skyjo-card-back absolute inset-0 backface-hidden flex items-center justify-center rotate-y-180 overflow-hidden transition-all duration-200",
                        isSelected && "ring-2 ring-amber-400 ring-offset-1",
                    )}
                    style={{
                        borderRadius: '10px',
                        boxShadow: isHighlighted
                            ? '0 0 20px rgba(52, 211, 153, 0.6), 0 4px 16px rgba(0, 0, 0, 0.4)'
                            : '0 4px 16px rgba(0, 0, 0, 0.4)',
                        border: isHighlighted
                            ? '2px solid rgba(52, 211, 153, 0.9)'
                            : (classicBack ? '1px solid #bdab9f' : '2.5px solid rgba(100, 116, 139, 0.5)'),
                        backgroundColor: '#1e293b', // Fallback
                    }}
                >
                    <img
                        src={getCardSkinPath(cardSkin)}
                        alt=""
                        className={cn("w-full h-full", classicBack ? "object-fill" : "object-cover")}
                    />
                </div>
            </Motion.div>
            {isFrozen && (
                <span className={cn('vesper-card-freeze', isRevealed && 'vesper-card-freeze--face')} aria-hidden="true">
                    <span className="vesper-card-freeze-lock"><Lock /></span>
                </span>
            )}
        </Motion.div>
    );
});

export default SkyjoCard;
