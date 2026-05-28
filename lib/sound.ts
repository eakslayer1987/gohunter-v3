/**
 * Lightweight Web Audio synth for cyber UI SFX. Generates tones in
 * code so we don't ship any audio assets — keeps bundle small and
 * lets us tune timbres without round-tripping through a DAW.
 *
 * Browser autoplay policy: AudioContext starts in 'suspended' state
 * until the first user gesture. getCtx() resumes on every call so
 * the first button click unlocks audio for the session.
 *
 * Mute state is mirrored from store/soundStore.ts via setMuted() so
 * the lib stays decoupled from zustand. Default: NOT muted (cyber
 * vibe wants sound on); user can flip via TopBar speaker toggle.
 */

let _ctx: AudioContext | null = null;
let _muted = false;

export function setMuted(m: boolean) {
  _muted = m;
}

export function isMuted() {
  return _muted;
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!_ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try {
      _ctx = new AC();
    } catch {
      return null;
    }
  }
  if (_ctx.state === 'suspended') {
    void _ctx.resume();
  }
  return _ctx;
}

interface ToneOpts {
  type?: OscillatorType;
  freq: number;
  freqEnd?: number;
  durationMs: number;
  gain?: number;
  /** Schedule offset in ms from now — used to layer triads / arpeggios. */
  delay?: number;
}

function tone(opts: ToneOpts) {
  if (_muted) return;
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime + (opts.delay ?? 0) / 1000;
  const dur = opts.durationMs / 1000;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(opts.freq, now);
  if (opts.freqEnd && opts.freqEnd !== opts.freq) {
    // exponentialRamp can't hit 0 — clamp endpoint to a tiny positive value.
    const endFreq = Math.max(opts.freqEnd, 1);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + dur);
  }
  const peak = opts.gain ?? 0.12;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(peak, now + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + dur + 0.05);
}

/** Subtle button blip — used on every Button click. Tuned low so 5
 *  clicks in a row don't grate. */
export function playClick() {
  tone({ type: 'square', freq: 880, durationMs: 35, gain: 0.05 });
}

/** Deeper thump for pin placement on the guess map. */
export function playPinDrop() {
  tone({ type: 'sine', freq: 220, freqEnd: 80, durationMs: 160, gain: 0.16 });
}

/** Sweep up for score reveal on /result. */
export function playScoreReveal() {
  tone({ type: 'sawtooth', freq: 420, freqEnd: 1300, durationMs: 480, gain: 0.09 });
}

/** Triad chime for achievement unlock — three sine tones stacked. */
export function playUnlock() {
  tone({ type: 'sine', freq: 660, durationMs: 140, gain: 0.12 });
  tone({ type: 'sine', freq: 880, durationMs: 140, gain: 0.12, delay: 100 });
  tone({ type: 'sine', freq: 1320, durationMs: 260, gain: 0.14, delay: 200 });
}

/** LOCK_TARGET // FIRE — bass thump + treble snap. */
export function playFire() {
  tone({ type: 'sawtooth', freq: 90, freqEnd: 40, durationMs: 220, gain: 0.18 });
  tone({ type: 'square', freq: 420, durationMs: 50, gain: 0.1, delay: 25 });
}

/** Generic toast appear — soft high blip. */
export function playToastInfo() {
  tone({ type: 'sine', freq: 1000, durationMs: 60, gain: 0.07 });
}

/** Error toast — low square buzz. */
export function playToastError() {
  tone({ type: 'square', freq: 200, durationMs: 140, gain: 0.09 });
}

/** Success toast — short upward sweep. */
export function playToastSuccess() {
  tone({ type: 'sine', freq: 800, freqEnd: 1400, durationMs: 180, gain: 0.11 });
}
