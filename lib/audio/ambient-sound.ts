"use client";

/**
 * Web Audio-based ambient atmospheric soundscape for the Vietnam History Web Game.
 * Generates an ethereal, ancient Vietnamese pentatonic drone (warm bronze bell and flute harmonics)
 * using oscillators and low-pass filters with gentle LFO modulation.
 * Requires no external audio files, works offline, and respects browser autoplay policies.
 */

/** Seconds the music takes to fade out before its oscillators are released. */
const FADE_OUT_MS = 1300;

class AmbientSoundManager {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private masterGain: GainNode | null = null;
  private activeNodes: { stop: () => void }[] = [];
  private stopTimer: number | undefined;
  private readonly listeners = new Set<() => void>();

  /** For `useSyncExternalStore`: called whenever music starts or stops. */
  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** For `useSyncExternalStore`: is the music on (a fading-out track counts as off)? */
  public getStatus = (): boolean => this.isPlaying;

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  /** Release the oscillators of the current / fading track right now. */
  private teardown(): void {
    window.clearTimeout(this.stopTimer);
    this.stopTimer = undefined;
    this.activeNodes.forEach((node) => node.stop());
    this.activeNodes = [];
    this.masterGain?.disconnect();
    this.masterGain = null;
  }

  private initContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.play();
      return true;
    }
  }

  public play(): void {
    const ctx = this.initContext();
    if (!ctx) return;
    if (this.isPlaying) return;

    // Started again while the previous track was still fading out: drop it first.
    this.teardown();
    this.isPlaying = true;
    this.notify();

    // Master Gain with gentle fade-in
    const masterGain = ctx.createGain();
    const now = ctx.currentTime;
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.12, now + 3);
    masterGain.connect(ctx.destination);
    this.masterGain = masterGain;

    // Ancient pentatonic root and fifth frequencies (D minor / Điệu Nam: D2, A2, D3, F3, A3, C4)
    const baseFreqs = [73.42, 110.0, 146.83, 174.61, 220.0];

    baseFreqs.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = index % 2 === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, now);

      // Filter to create warm resonance
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(600 + index * 120, now);

      // Subtle detune for shimmer
      osc.detune.setValueAtTime((index - 2) * 5, now);

      // Individual gain levels
      const level = 0.08 / (index * 0.5 + 1);
      gain.gain.setValueAtTime(level, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      this.activeNodes.push({
        stop: () => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {
            // Already stopped
          }
        },
      });
    });
  }

  public stop(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.notify();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    this.stopTimer = window.setTimeout(() => this.teardown(), FADE_OUT_MS);
  }

  /** Soft bronze chime sound played when picking up a secret letter */
  public playChime(): void {
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.3); // A5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.3);
    } catch {
      // Audio autoplay policy
    }
  }
}

export const ambientSound = new AmbientSoundManager();
