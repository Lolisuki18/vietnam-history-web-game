import Phaser from "phaser";

export interface ToneSpec {
  from: number;
  to: number;
  /** Seconds after "now". */
  offset: number;
  duration: number;
  volume: number;
}

/**
 * Web Audio building blocks (tones, filtered noise) so a game needs no sound files. It reuses the
 * AudioContext of Phaser's sound manager; browsers keep that suspended until the player
 * interacts, so every call tries to resume it first. Games extend it with their own sound effects.
 */
export class Synth {
  private readonly context: AudioContext | null;
  private noiseBuffer: AudioBuffer | null = null;

  constructor(scene: Phaser.Scene) {
    const manager = scene.sound;
    this.context = manager instanceof Phaser.Sound.WebAudioSoundManager ? manager.context : null;
  }

  protected ready(): AudioContext | null {
    const context = this.context;
    if (!context) return null;
    if (context.state === "suspended") void context.resume();
    return context;
  }

  protected tone({ from, to, offset, duration, volume }: ToneSpec): void {
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

  protected noise(spec: { duration: number; lowpassHz: number; volume: number }): void {
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
  protected getNoiseBuffer(context: AudioContext): AudioBuffer {
    if (!this.noiseBuffer) {
      const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buffer;
    }
    return this.noiseBuffer;
  }
}
