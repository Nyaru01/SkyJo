import { motion as Motion } from 'framer-motion';
import '../../styles/Tabletop.css';

const PARTICLES = Array.from({ length: 10 }, (_, i) => ({
    x: Math.cos(i * Math.PI / 5) * 22,
    y: Math.sin(i * Math.PI / 5) * 38,
}));

export default function ColumnBeam({ bonus = false }) {
    return (
        <div className="skyjo-clear" aria-hidden="true">
            <Motion.div className="skyjo-clear-flash"
                initial={{ opacity: 0, scaleX: .8 }}
                animate={{ opacity: [0, .65, 0], scaleX: [0.8, 1, .6] }}
                transition={{ duration: .6, times: [0, .28, 1] }} />
            {PARTICLES.map((particle, i) => (
                <Motion.i key={i} className="skyjo-clear-spark"
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                    animate={{ x: particle.x, y: particle.y, opacity: [0, 1, 0], scale: [0, 1, .2] }}
                    transition={{ duration: .35, delay: .25 }} />
            ))}
            <Motion.span className="skyjo-clear-result"
                initial={{ opacity: 0, y: 6, scale: .9 }}
                animate={{ opacity: [0, 1, 1, 0], y: [6, 0, -3, -12], scale: [0.9, 1, 1, 1] }}
                transition={{ duration: .6, times: [0, .4, .75, 1] }}>
                {bonus ? '−3' : '✓'}
            </Motion.span>
        </div>
    );
}
