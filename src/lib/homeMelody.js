// Mélodie douce de l'écran d'accueil, synthétisée en direct (Web Audio, aucun fichier, fonctionne hors ligne).
// Une nappe chaude suit une suite d'accords lente ; une petite cloche improvise par-dessus dans la gamme
// pentatonique de ré majeur, avec de l'espace (silences), un écho et une réverbération de « ciel du soir ».

const BPM = 66;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const LOOKAHEAD = 0.6; // secondes programmées à l'avance
const VOLUME = 0.22;

const midiToHz = m => 440 * 2 ** ((m - 69) / 12);

// Ré majeur : D – Bm – G – A, puis D – F#m – G – A (deux mesures par accord).
const CHORDS = [
    [50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61],
    [50, 57, 62, 66], [42, 49, 54, 57], [43, 50, 55, 59], [45, 52, 57, 64],
];
// Pentatonique de ré majeur (ré, mi, fa#, la, si) sur deux octaves.
const SCALE = [62, 64, 66, 69, 71, 74, 76, 78, 81, 83];

function makeImpulse(ctx, seconds, decay) {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    let seed = 20261127;
    for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        let smooth = 0;
        for (let i = 0; i < length; i++) {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            const noise = (seed / 4294967296) * 2 - 1;
            smooth += (noise - smooth) * (0.4 - 0.3 * (i / length));
            data[i] = smooth * (1 - i / length) ** decay;
        }
    }
    return buffer;
}

export function createHomeMelody() {
    let ctx = null;
    let out = null;
    let input = null;
    let timer = null;
    let playing = false;
    let nextBarTime = 0;
    let barIndex = 0;
    let melodyIndex = 4; // position dans SCALE (la)
    let stopTimeout = null;

    const ensure = () => {
        if (ctx) return true;
        const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Ctor) return false;
        try { ctx = new Ctor({ latencyHint: 'playback' }); } catch { return false; }
        out = ctx.createGain();
        out.gain.value = 0;
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -20;
        compressor.ratio.value = 3;
        out.connect(compressor);
        compressor.connect(ctx.destination);

        input = ctx.createGain();
        input.connect(out);
        // Écho doux et réverbération en parallèle
        const delay = ctx.createDelay(2);
        delay.delayTime.value = BEAT * 0.75;
        const feedback = ctx.createGain();
        feedback.gain.value = 0.28;
        const damp = ctx.createBiquadFilter();
        damp.type = 'lowpass';
        damp.frequency.value = 1800;
        const wet = ctx.createGain();
        wet.gain.value = 0.22;
        input.connect(delay);
        delay.connect(damp);
        damp.connect(feedback);
        feedback.connect(delay);
        damp.connect(wet);
        wet.connect(out);
        const reverb = ctx.createConvolver();
        reverb.buffer = makeImpulse(ctx, 4, 2.6);
        const reverbGain = ctx.createGain();
        reverbGain.gain.value = 0.45;
        input.connect(reverb);
        reverb.connect(reverbGain);
        reverbGain.connect(out);
        return true;
    };

    // Nappe : deux sinus légèrement désaccordés par note, filtrés, qui respirent sur deux mesures.
    const pad = (notes, time, duration) => {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 900;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.05, time + duration * 0.35);
        gain.gain.linearRampToValueAtTime(0.035, time + duration * 0.8);
        gain.gain.linearRampToValueAtTime(0, time + duration + 0.8);
        filter.connect(gain);
        gain.connect(input);
        notes.forEach(note => {
            [-4, 4].forEach(detune => {
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = midiToHz(note);
                osc.detune.value = detune;
                osc.connect(filter);
                osc.start(time);
                osc.stop(time + duration + 1);
            });
        });
    };

    // Cloche : sinus + harmonique aiguë qui s'éteint vite, attaque douce.
    const bell = (note, time, velocity) => {
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.11 * velocity, time + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 2.6);
        gain.connect(input);
        const partials = [[1, 1], [2, 0.25], [3.01, 0.08]];
        partials.forEach(([ratio, amp]) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = midiToHz(note) * ratio;
            const partialGain = ctx.createGain();
            partialGain.gain.value = amp;
            osc.connect(partialGain);
            partialGain.connect(gain);
            osc.start(time);
            osc.stop(time + 2.7);
        });
    };

    // Une mesure de mélodie : quelques notes sur les temps et demi-temps, avec des silences.
    const melodyBar = (time, chord) => {
        const chordPitchClasses = chord.map(n => n % 12);
        let step = 0;
        while (step < 8) {
            const play = Math.random() < (step % 2 === 0 ? 0.55 : 0.25);
            if (play) {
                const move = [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)];
                melodyIndex = Math.max(0, Math.min(SCALE.length - 1, melodyIndex + move));
                // Sur le premier temps, on se pose de préférence sur une note de l'accord.
                if (step === 0 && !chordPitchClasses.includes(SCALE[melodyIndex] % 12)) {
                    const near = SCALE.findIndex((n, i) => Math.abs(i - melodyIndex) <= 1 && chordPitchClasses.includes(n % 12));
                    if (near >= 0) melodyIndex = near;
                }
                bell(SCALE[melodyIndex], time + step * BEAT / 2, step === 0 ? 1 : 0.7 + Math.random() * 0.2);
                step += Math.random() < 0.4 ? 3 : 2;
            } else {
                step += 1;
            }
        }
    };

    const schedule = () => {
        if (!ctx) return;
        while (nextBarTime < ctx.currentTime + LOOKAHEAD) {
            const chord = CHORDS[Math.floor(barIndex / 2) % CHORDS.length];
            if (barIndex % 2 === 0) pad(chord, nextBarTime, BAR * 2);
            // Première mesure de chaque accord : mélodie ; la seconde est plus clairsemée.
            if (barIndex % 2 === 0 || Math.random() < 0.6) melodyBar(nextBarTime, chord);
            nextBarTime += BAR;
            barIndex++;
        }
    };

    return {
        start() {
            if (!ensure()) return;
            clearTimeout(stopTimeout);
            ctx.resume().catch(() => {});
            const now = ctx.currentTime;
            out.gain.cancelScheduledValues(now);
            out.gain.setValueAtTime(out.gain.value, now);
            out.gain.linearRampToValueAtTime(VOLUME, now + 3);
            if (playing) return;
            playing = true;
            nextBarTime = now + 0.1;
            barIndex = 0;
            schedule();
            timer = setInterval(schedule, 200);
        },
        stop() {
            if (!ctx || !playing) return;
            const now = ctx.currentTime;
            out.gain.cancelScheduledValues(now);
            out.gain.setValueAtTime(out.gain.value, now);
            out.gain.linearRampToValueAtTime(0, now + 1.5);
            clearTimeout(stopTimeout);
            stopTimeout = setTimeout(() => {
                clearInterval(timer);
                timer = null;
                playing = false;
                ctx.suspend().catch(() => {});
            }, 1600);
        },
    };
}
