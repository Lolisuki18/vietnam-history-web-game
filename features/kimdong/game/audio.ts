import { Synth } from "@/lib/game/synth";

/** Kim Đồng's sound effects: a cuckoo call (chim tu hú), a thud, a rifle shot and forest ambience. */
export class GameAudio extends Synth {
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
}
