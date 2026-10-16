import type Phaser from "phaser";

import { Synth } from "@/lib/game/synth";

import { AUDIO_KEYS, type AudioName } from "./assets/manifest";

/**
 * Võ Thị Sáu's sound. Each effect plays its file when it has been added to `public/assets/vothisau/audio`
 * and falls back to a small synthesized stand-in (footsteps, thuds, the blast, whistles) otherwise.
 * Music has no stand-in: it only plays when the file is there.
 */
export class GameAudio extends Synth {
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    super(scene);
    this.scene = scene;
  }

  private has(name: AudioName): boolean {
    return this.scene.cache.audio.has(AUDIO_KEYS[name]);
  }

  /** Play the file for `name` if it exists; returns whether it did. */
  private file(name: AudioName, volume: number): boolean {
    if (!this.has(name)) return false;
    this.scene.sound.play(AUDIO_KEYS[name], { volume });
    return true;
  }

  footstep(volume = 0.3): void {
    if (this.file("footstep", volume)) return;
    this.noise({ duration: 0.09, lowpassHz: 1300, volume: volume * 0.45 });
  }

  /** A pebble hitting the ground. */
  thud(): void {
    if (this.file("pebble", 0.45)) return;
    this.noise({ duration: 0.14, lowpassHz: 320, volume: 0.5 });
  }

  pickup(): void {
    if (this.file("pickup", 0.6)) return;
    this.noise({ duration: 0.18, lowpassHz: 3200, volume: 0.2 });
    this.tone({ from: 880, to: 1240, offset: 0.12, duration: 0.18, volume: 0.1 });
  }

  /** A guard spots the player ("!"). */
  alert(): void {
    if (this.file("alert", 0.45)) return;
    this.tone({ from: 880, to: 880, offset: 0, duration: 0.09, volume: 0.12 });
    this.tone({ from: 1180, to: 1180, offset: 0.11, duration: 0.12, volume: 0.12 });
  }

  /** A guard heard something ("?"). */
  question(): void {
    if (this.file("question", 0.4)) return;
    this.tone({ from: 520, to: 760, offset: 0, duration: 0.18, volume: 0.1 });
  }

  /** The whistle signal of the resistance (a rising two-note whistle). */
  whistle(): void {
    if (this.file("whistle", 0.5)) return;
    this.tone({ from: 1500, to: 1900, offset: 0, duration: 0.22, volume: 0.1 });
    this.tone({ from: 1900, to: 1500, offset: 0.26, duration: 0.3, volume: 0.1 });
  }

  /** The whistle of the French soldiers when the chase starts. */
  policeWhistle(): void {
    if (this.file("policeWhistle", 0.55)) return;
    for (let i = 0; i < 3; i++) {
      this.tone({ from: 2600, to: 2400, offset: i * 0.22, duration: 0.16, volume: 0.09 });
    }
  }

  ropeCut(): void {
    if (this.file("ropeCut", 0.5)) return;
    this.noise({ duration: 0.08, lowpassHz: 5000, volume: 0.3 });
  }

  crateFall(): void {
    if (this.file("crateFall", 0.6)) return;
    this.noise({ duration: 0.4, lowpassHz: 420, volume: 0.7 });
    this.noise({ duration: 0.2, lowpassHz: 2000, volume: 0.35 });
  }

  grenadeThrow(): void {
    if (this.file("grenadeThrow", 0.5)) return;
    this.noise({ duration: 0.3, lowpassHz: 1800, volume: 0.18 });
  }

  explosion(): void {
    if (this.file("explosion", 0.9)) return;
    this.noise({ duration: 0.5, lowpassHz: 6000, volume: 0.7 });
    this.noise({ duration: 1.2, lowpassHz: 160, volume: 0.9 });
  }

  /** One beat of the war drum that plays while the player is chased. */
  drum(volume = 0.35): void {
    this.tone({ from: 110, to: 50, offset: 0, duration: 0.22, volume });
  }

  /** Loop `name` as music; returns the function that stops it. Nothing plays without the file. */
  music(name: "bgmForest" | "bgmPatrol" | "bgmMarket" | "bgmChase", volume = 0.35): () => void {
    if (!this.has(name)) return () => undefined;
    const sound = this.scene.sound.add(AUDIO_KEYS[name], { loop: true, volume });
    sound.play();
    return () => {
      sound.stop();
      sound.destroy();
    };
  }

  /** Ambient murmur of the crowd in the market (only with the file). */
  crowdMurmur(): () => void {
    if (!this.has("crowd")) return () => undefined;
    const sound = this.scene.sound.add(AUDIO_KEYS.crowd, { loop: true, volume: 0.35 });
    sound.play();
    return () => {
      sound.stop();
      sound.destroy();
    };
  }

  /** Night insects and wind in the forest (synthesized: crickets over a band of noise). */
  forestAmbience(): () => void {
    const context = this.ready();
    if (!context) return () => undefined;

    const source = context.createBufferSource();
    source.buffer = this.getNoiseBuffer(context);
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 800;
    filter.Q.value = 0.4;
    const gain = context.createGain();
    const now = context.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.04, now + 1.5);
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();

    const crickets = window.setInterval(() => {
      for (let i = 0; i < 3; i++) {
        this.tone({ from: 4400, to: 4200, offset: i * 0.11, duration: 0.07, volume: 0.02 });
      }
    }, 1100);

    return () => {
      window.clearInterval(crickets);
      const end = context.currentTime;
      gain.gain.cancelScheduledValues(end);
      gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), end);
      gain.gain.exponentialRampToValueAtTime(0.0001, end + 1);
      source.stop(end + 1.1);
    };
  }
}
