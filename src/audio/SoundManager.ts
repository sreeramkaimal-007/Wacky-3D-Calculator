import { ButtonRole, SoundPackId, SoundPackMeta } from '../types/calculator';

export const SOUND_PACKS: SoundPackMeta[] = [
  {
    id: 'mechanical',
    name: 'Classic Mechanical',
    description: 'Crisp tactile calculator keyswitch click',
    category: 'Tactile',
    isPremium: false,
  },
  {
    id: 'cartoon_pop',
    name: 'Funny Cartoon Pop',
    description: 'Playful rubbery cork pop',
    category: 'Playful',
    isPremium: false,
  },
  {
    id: 'bubble_pop',
    name: 'Bubble Popping',
    description: 'Clean aquatic upward chirp pop',
    category: 'Nature',
    isPremium: false,
  },
  {
    id: 'rubber_duck',
    name: 'Rubber Duck Squeak',
    description: 'Silly squeaky toy honk',
    category: 'Playful',
    isPremium: false,
  },
  {
    id: 'water_drop',
    name: 'Water Drop',
    description: 'Resonant droplet plink',
    category: 'Nature',
    isPremium: false,
  },
  {
    id: 'wooden_click',
    name: 'Wooden Click',
    description: 'Warm hollow marimba block tap',
    category: 'Tactile',
    isPremium: false,
  },
  {
    id: 'soft_keyboard',
    name: 'Soft Keyboard Click',
    description: 'Gentle damped studio key tap',
    category: 'Tactile',
    isPremium: false,
  },
  {
    id: 'arcade',
    name: 'Arcade Game Sound',
    description: 'Punchy 8-bit coin & blip synth',
    category: 'Arcade',
    isPremium: true,
  },
  {
    id: 'robotic_beep',
    name: 'Robotic Digital Beep',
    description: 'FM-modulated sci-fi telemetry chirp',
    category: 'Arcade',
    isPremium: true,
  },
  {
    id: 'spring_boing',
    name: 'Funny Spring Boing',
    description: 'Wobbly cartoon coil spring bounce',
    category: 'Playful',
    isPremium: true,
  },
  {
    id: 'magical_sparkle',
    name: 'Magical Sparkle',
    description: 'Crystal chime harmonic shimmer',
    category: 'Playful',
    isPremium: true,
  },
  {
    id: 'cute_animal',
    name: 'Cute Animal Sound',
    description: 'Friendly playful toy chirp',
    category: 'Nature',
    isPremium: true,
  },
  {
    id: 'retro_game',
    name: 'Retro Game Sound',
    description: 'Classic handheld console pulse',
    category: 'Arcade',
    isPremium: true,
  },
  {
    id: 'bubble_wrap',
    name: 'Bubble Wrap Popping',
    description: 'Snappy blister-pack pop burst',
    category: 'Tactile',
    isPremium: true,
  },
  {
    id: 'silent',
    name: 'Silent Mode',
    description: 'Mute all keycap audio effects',
    category: 'Quiet',
    isPremium: false,
  },
];

const RANDOMIZABLE_PACKS: SoundPackId[] = SOUND_PACKS.filter(
  (p) => p.id !== 'silent'
).map((p) => p.id);

class SoundManagerImpl {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private lastPlayTime = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.noiseBuffer = this.createNoiseBuffer(this.ctx);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * 0.25);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  public prewarm() {
    this.ensureContext();
  }

  public pickRandomPack(allowedPool?: SoundPackId[]): SoundPackId {
    const pool =
      allowedPool && allowedPool.length > 0 ? allowedPool : RANDOMIZABLE_PACKS;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  public play(
    packId: SoundPackId,
    volume: number,
    role: ButtonRole = 'number'
  ) {
    if (packId === 'silent' || volume <= 0.005) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    // Micro-debounce (<22ms) prevents overlapping muddy spikes on chorded mashing
    const nowMs = performance.now();
    if (nowMs - this.lastPlayTime < 22) return;
    this.lastPlayTime = nowMs;

    const now = ctx.currentTime;
    this.masterGain.gain.setValueAtTime(Math.min(1, Math.max(0, volume)), now);

    // Subtle pitch offset by button role for musical expressiveness
    const pitchFactor =
      role === 'operator'
        ? 1.12
        : role === 'clear'
        ? 0.86
        : role === 'equal'
        ? 1.25
        : 1 + (Math.random() * 0.06 - 0.03);

    switch (packId) {
      case 'mechanical':
        this.synthMechanical(ctx, now, pitchFactor);
        break;
      case 'cartoon_pop':
        this.synthCartoonPop(ctx, now, pitchFactor);
        break;
      case 'bubble_pop':
        this.synthBubblePop(ctx, now, pitchFactor);
        break;
      case 'rubber_duck':
        this.synthRubberDuck(ctx, now, pitchFactor);
        break;
      case 'water_drop':
        this.synthWaterDrop(ctx, now, pitchFactor);
        break;
      case 'wooden_click':
        this.synthWoodenClick(ctx, now, pitchFactor);
        break;
      case 'soft_keyboard':
        this.synthSoftKeyboard(ctx, now, pitchFactor);
        break;
      case 'arcade':
        this.synthArcade(ctx, now, pitchFactor);
        break;
      case 'robotic_beep':
        this.synthRoboticBeep(ctx, now, pitchFactor);
        break;
      case 'spring_boing':
        this.synthSpringBoing(ctx, now, pitchFactor);
        break;
      case 'magical_sparkle':
        this.synthMagicalSparkle(ctx, now, pitchFactor);
        break;
      case 'cute_animal':
        this.synthCuteAnimal(ctx, now, pitchFactor);
        break;
      case 'retro_game':
        this.synthRetroGame(ctx, now, pitchFactor);
        break;
      case 'bubble_wrap':
        this.synthBubbleWrap(ctx, now, pitchFactor);
        break;
      default:
        break;
    }
  }

  public playCelebration(volume: number) {
    if (volume <= 0.005) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    this.masterGain.gain.setValueAtTime(Math.min(1, volume * 0.85), now);

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.055;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.22, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
      osc.connect(gain).connect(this.masterGain!);
      osc.start(start);
      osc.stop(start + 0.24);
    });
  }

  private synthMechanical(ctx: AudioContext, now: number, p: number) {
    // Crisp high transient click + low housing thock
    if (this.noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2800 * p, now);
      filter.Q.setValueAtTime(2.5, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.42, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      noise.connect(filter).connect(gain).connect(this.masterGain!);
      noise.start(now);
      noise.stop(now + 0.03);
    }

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240 * p, now);
    osc.frequency.exponentialRampToValueAtTime(95 * p, now + 0.045);
    g.gain.setValueAtTime(0.32, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(g).connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  private synthCartoonPop(ctx: AudioContext, now: number, p: number) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260 * p, now);
    osc.frequency.exponentialRampToValueAtTime(880 * p, now + 0.065);
    g.gain.setValueAtTime(0.45, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(g).connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.085);
  }

  private synthBubblePop(ctx: AudioContext, now: number, p: number) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420 * p, now);
    osc.frequency.exponentialRampToValueAtTime(1450 * p, now + 0.055);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.42, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
    osc.connect(g).connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  private synthRubberDuck(ctx: AudioContext, now: number, p: number) {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(640 * p, now);
    osc1.frequency.exponentialRampToValueAtTime(860 * p, now + 0.04);
    osc1.frequency.exponentialRampToValueAtTime(590 * p, now + 0.13);

    osc2.frequency.setValueAtTime(654 * p, now);
    osc2.frequency.exponentialRampToValueAtTime(878 * p, now + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(604 * p, now + 0.13);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1500 * p, now);
    filter.Q.setValueAtTime(3.2, now);

    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.36, now + 0.018);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.145);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(g).connect(this.masterGain!);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.15);
    osc2.stop(now + 0.15);
  }

  private synthWaterDrop(ctx: AudioContext, now: number, p: number) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1180 * p, now);
    osc.frequency.exponentialRampToValueAtTime(520 * p, now + 0.045);
    osc.frequency.exponentialRampToValueAtTime(1420 * p, now + 0.11);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.38, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(g).connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.135);
  }

  private synthWoodenClick(ctx: AudioContext, now: number, p: number) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(760 * p, now);
    osc.frequency.exponentialRampToValueAtTime(510 * p, now + 0.038);
    g.gain.setValueAtTime(0.48, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.052);
    osc.connect(g).connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  private synthSoftKeyboard(ctx: AudioContext, now: number, p: number) {
    if (this.noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950 * p, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);
      noise.connect(filter).connect(gain).connect(this.masterGain!);
      noise.start(now);
      noise.stop(now + 0.035);
    }
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160 * p, now);
    osc.frequency.exponentialRampToValueAtTime(70 * p, now + 0.035);
    g.gain.setValueAtTime(0.25, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(g).connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  private synthArcade(ctx: AudioContext, now: number, p: number) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(520 * p, now);
    osc.frequency.setValueAtTime(780 * p, now + 0.04);
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(g).connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.115);
  }

  private synthRoboticBeep(ctx: AudioContext, now: number, p: number) {
    const carrier = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const g = ctx.createGain();

    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(920 * p, now);
    mod.type = 'square';
    mod.frequency.setValueAtTime(42, now);
    modGain.gain.setValueAtTime(140, now);

    g.gain.setValueAtTime(0.24, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    mod.connect(modGain).connect(carrier.frequency);
    carrier.connect(g).connect(this.masterGain!);
    carrier.start(now);
    mod.start(now);
    carrier.stop(now + 0.095);
    mod.stop(now + 0.095);
  }

  private synthSpringBoing(ctx: AudioContext, now: number, p: number) {
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const g = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(210 * p, now);
    osc.frequency.exponentialRampToValueAtTime(480 * p, now + 0.18);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(28, now);
    lfoGain.gain.setValueAtTime(65, now);

    g.gain.setValueAtTime(0.38, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    lfo.connect(lfoGain).connect(osc.frequency);
    osc.connect(g).connect(this.masterGain!);
    osc.start(now);
    lfo.start(now);
    osc.stop(now + 0.23);
    lfo.stop(now + 0.23);
  }

  private synthMagicalSparkle(ctx: AudioContext, now: number, p: number) {
    const freqs = [1046.5 * p, 1318.5 * p, 1567.98 * p];
    freqs.forEach((f, idx) => {
      const start = now + idx * 0.024;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, start);
      g.gain.setValueAtTime(0.001, start);
      g.gain.linearRampToValueAtTime(0.18, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
      osc.connect(g).connect(this.masterGain!);
      osc.start(start);
      osc.stop(start + 0.17);
    });
  }

  private synthCuteAnimal(ctx: AudioContext, now: number, p: number) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(680 * p, now);
    osc.frequency.exponentialRampToValueAtTime(1180 * p, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(920 * p, now + 0.12);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.32, now + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(g).connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.135);
  }

  private synthRetroGame(ctx: AudioContext, now: number, p: number) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'pulse' in osc ? 'square' : 'square';
    osc.frequency.setValueAtTime(330 * p, now);
    osc.frequency.setValueAtTime(440 * p, now + 0.03);
    osc.frequency.setValueAtTime(660 * p, now + 0.06);
    g.gain.setValueAtTime(0.16, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(g).connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.105);
  }

  private synthBubbleWrap(ctx: AudioContext, now: number, p: number) {
    if (this.noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1800 * p, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);
      noise.connect(filter).connect(gain).connect(this.masterGain!);
      noise.start(now);
      noise.stop(now + 0.032);
    }
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340 * p, now);
    osc.frequency.exponentialRampToValueAtTime(110 * p, now + 0.035);
    g.gain.setValueAtTime(0.35, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(g).connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.045);
  }
}

export const SoundManager = new SoundManagerImpl();
