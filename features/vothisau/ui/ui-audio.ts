/**
 * Sounds of the React side (the interrogation room). Every file is optional: a missing file simply
 * stays silent. Returns a function that stops the sound (for loops).
 */
export function playUiSound(name: string, volume = 0.6, loop = false): () => void {
  try {
    const audio = new Audio(`/assets/vothisau/audio/${name}.wav`);
    audio.volume = volume;
    audio.loop = loop;
    void audio.play().catch(() => undefined);
    return () => audio.pause();
  } catch {
    return () => undefined;
  }
}
