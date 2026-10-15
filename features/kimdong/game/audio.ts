import type Phaser from "phaser";
import { Synth } from "@/lib/game/synth";
import { AUDIO_KEYS } from "./assets/manifest";

/** Kim Đồng's sound effects: a cuckoo call (chim tu hú), a thud, a rifle shot and forest ambience. */
export class GameAudio extends Synth {
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    super(scene);
    this.scene = scene;
  }

  private playSound(key: string, volume: number): boolean {
    if (this.scene.cache.audio.has(key)) {
      this.scene.sound.play(key, { volume });
      return true;
    }
    return false;
  }

  /** The "tu-hú" call: two falling notes. */
  cuckoo(volume = 0.25): void {
    if (this.playSound(AUDIO_KEYS.cuckoo, volume * 1.5)) return;
    this.tone({ from: 720, to: 660, offset: 0, duration: 0.2, volume });
    this.tone({ from: 560, to: 500, offset: 0.26, duration: 0.34, volume });
  }

  /** A guard spots the player ("!"). No synthesized stand-in: the sting is only played if loaded. */
  alert(): void {
    this.playSound(AUDIO_KEYS.alert, 0.45);
  }

  /** A guard heard something and goes to look ("?"). */
  question(): void {
    this.playSound(AUDIO_KEYS.question, 0.4);
  }

  /** A secret letter is picked up (paper rustle). */
  pickupLetter(): void {
    this.playSound(AUDIO_KEYS.pickupLetter, 0.6);
  }

  /** Out of air in the stream. */
  gasp(): void {
    this.playSound(AUDIO_KEYS.gasp, 0.6);
  }

  /** Three long cuckoo calls: the safe signal (rhythm game passed without a miss). */
  cuckooSignal(): void {
    if (!this.playSound(AUDIO_KEYS.cuckooSignal, 0.5)) this.cuckoo();
  }

  /** One short, two long: "something is wrong" (rhythm game with misses). */
  cuckooWarning(): void {
    if (!this.playSound(AUDIO_KEYS.cuckooWarning, 0.5)) this.cuckoo(0.3);
  }

  /** Footsteps heard in the fog (louder and closer than on a clear day). */
  fogFootstep(): void {
    if (!this.playSound(AUDIO_KEYS.fogFootsteps, 0.5)) this.footstep(0.35);
  }

  /** Heartbeat loop for the 5 second decision; returns the function that stops it. */
  startHeartbeat(): () => void {
    if (!this.scene.cache.audio.has(AUDIO_KEYS.heartbeatCountdown)) return () => undefined;
    const sound = this.scene.sound.add(AUDIO_KEYS.heartbeatCountdown, { loop: true, volume: 0.6 });
    sound.play();
    return () => {
      sound.stop();
      sound.destroy();
    };
  }

  /** Picking a pebble up: a small click (the pebble sound if there is no pickup sound). */
  pebblePickup(): void {
    if (this.playSound(AUDIO_KEYS.pebblePickup, 0.5)) return;
    this.tone({ from: 1500, to: 1100, offset: 0, duration: 0.05, volume: 0.1 });
    this.noise({ duration: 0.05, lowpassHz: 2400, volume: 0.12 });
  }

  /** A pebble landing on the ground / thrown. */
  thud(): void {
    if (this.playSound(AUDIO_KEYS.pebble, 0.45)) return;
    this.noise({ duration: 0.14, lowpassHz: 320, volume: 0.5 });
  }

  /** Footsteps on forest ground / dry leaves. */
  footstep(volume = 0.3): void {
    if (this.playSound(AUDIO_KEYS.footsteps, volume)) return;
    this.noise({ duration: 0.1, lowpassHz: 1200, volume: volume * 0.4 });
  }

  /** Wading in water / stream splash. */
  splash(volume = 0.4): void {
    if (this.playSound(AUDIO_KEYS.splash, volume)) return;
    this.noise({ duration: 0.25, lowpassHz: 600, volume: volume * 0.5 });
  }

  /** A rifle shot: a sharp crack followed by a low boom. */
  gunshot(): void {
    if (this.playSound(AUDIO_KEYS.gunshot, 0.7)) return;
    this.noise({ duration: 0.3, lowpassHz: 6000, volume: 0.6 });
    this.noise({ duration: 0.55, lowpassHz: 180, volume: 0.7 });
  }

  /**
   * Forest ambience: plays real ambience track if loaded, or synthesized wind + crickets fallback.
   */
  startAmbience(): () => void {
    // The stream and the birds (the design's first stage), else the crickets and wind loop.
    const track = [AUDIO_KEYS.bgmStreamBirds, AUDIO_KEYS.bgmExplore].find((key) =>
      this.scene.cache.audio.has(key),
    );
    if (track) {
      const music = this.scene.sound.add(track, { loop: true, volume: 0.3 });
      music.play();
      return () => {
        music.stop();
        music.destroy();
      };
    }

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

  /** Play tension BGM loop during stealth alert or rhythm confrontation. */
  playTensionBGM(): () => void {
    if (this.scene.cache.audio.has(AUDIO_KEYS.bgmTension)) {
      const music = this.scene.sound.add(AUDIO_KEYS.bgmTension, { loop: true, volume: 0.35 });
      music.play();
      return () => {
        music.stop();
        music.destroy();
      };
    }
    return () => undefined;
  }

  /** Play runner BGM loop during climax phase 3. */
  playRunnerBGM(): () => void {
    if (this.scene.cache.audio.has(AUDIO_KEYS.bgmRunner)) {
      const music = this.scene.sound.add(AUDIO_KEYS.bgmRunner, { loop: true, volume: 0.4 });
      music.play();
      return () => {
        music.stop();
        music.destroy();
      };
    }
    return () => undefined;
  }
}
