import Phaser from "phaser";

interface ToneSpec {
  from: number;
  to: number;
  /** Seconds after "now". */
  offset: number;
  duration: number;
  volume: number;
}

/**
 * Small Web Audio synthesiser so the game needs no sound files: a cuckoo call (chim tu hú)
 * and a dull thud. It reuses the AudioContext of Phaser's sound manager; browsers keep that
 * suspended until the player interacts, so every call tries to resume it first.
 */
export class GameAudio {
  private readonly context: AudioContext | null;
  private noiseBuffer: AudioBuffer | null = null;

  constructor(scene: Phaser.Scene) {
    const manager = scene.sound;
    this.context = manager instanceof Phaser.Sound.WebAudioSoundManager ? manager.context : null;
  }

  /** The "tu-hú" call: two falling notes. */
  cuckoo(volume = 0.25): void {
    this.tone({ from: 720, to: 660, offset: 0, duration: 0.2, volume });
    this.tone({ from: 560, to: 500, offset: 0.26, duration: 0.34, volume });
  }

  /** A pebble landing on the ground. */
  thud(): void {
    this.noise({ duration: 0.14, lowpassHz: 320, volume: 0.5 });
  }

  /** A rifle shot: a sharp crack followed by a low boom. */
  gunshot(): void {
    this.noise({ duration: 0.3, lowpassHz: 6000, volume: 0.6 });
    this.noise({ duration: 0.55, lowpassHz: 180, volume: 0.7 });
  }

  /**
   * Forest ambience: filtered wind noise with crickets. Returns a function that fades it out
   * and releases the audio nodes; call it when the scene ends.
   */
  startAmbience(): () => void {
    const context = this.ready();
    if (!context) return () => undefined;

    const source = context.createBufferSource();
    source.buffer = this.getNoiseBuffer(context);
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 900;
    filter.Q.value = 0.4;
    const gain = context.createGain();
    const now = context.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 1.5);
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();

    const crickets = window.setInterval(() => {
      for (let i = 0; i < 3; i++) {
        this.tone({ from: 4300, to: 4100, offset: i * 0.11, duration: 0.07, volume: 0.025 });
      }
    }, 900);

    return () => {
      window.clearInterval(crickets);
      const end = context.currentTime;
      gain.gain.cancelScheduledValues(end);
      gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), end);
      gain.gain.exponentialRampToValueAtTime(0.0001, end + 1.5);
      source.stop(end + 1.6);
    };
  }

  private ready(): AudioContext | null {
    const context = this.context;
    if (!context) return null;
    if (context.state === "suspended") void context.resume();
    return context;
  }

  private tone({ from, to, offset, duration, volume }: ToneSpec): void {
    const context = this.ready();
    if (!context) return;
    const start = context.currentTime + offset;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  private noise(spec: { duration: number; lowpassHz: number; volume: number }): void {
    const context = this.ready();
    if (!context) return;
    const source = context.createBufferSource();
    source.buffer = this.getNoiseBuffer(context);
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = spec.lowpassHz;
    const gain = context.createGain();
    const start = context.currentTime;
    gain.gain.setValueAtTime(spec.volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + spec.duration);
    source.connect(filter).connect(gain).connect(context.destination);
    source.start(start);
    source.stop(start + spec.duration + 0.05);
  }

  /** One second of white noise, created once and shared by every noise effect. */
  private getNoiseBuffer(context: AudioContext): AudioBuffer {
    if (!this.noiseBuffer) {
      const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buffer;
    }
    return this.noiseBuffer;
  }
}
