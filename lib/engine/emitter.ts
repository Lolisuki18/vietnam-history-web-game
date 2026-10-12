type Listener<T> = (payload: T) => void;

/** Minimal strongly-typed event emitter. `E` maps event names to payload types. */
export class TypedEmitter<E extends { [K in keyof E]: unknown }> {
  private readonly listeners = new Map<keyof E, Set<Listener<never>>>();

  /** Subscribe to an event. Returns an unsubscribe function. */
  on<K extends keyof E>(event: K, listener: Listener<E[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener as Listener<never>);
    return () => this.off(event, listener);
  }

  /** Subscribe to an event for a single emission. */
  once<K extends keyof E>(event: K, listener: Listener<E[K]>): () => void {
    const unsubscribe = this.on(event, (payload) => {
      unsubscribe();
      listener(payload);
    });
    return unsubscribe;
  }

  off<K extends keyof E>(event: K, listener: Listener<E[K]>): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.delete(listener as Listener<never>);
    if (set.size === 0) this.listeners.delete(event);
  }

  emit<K extends keyof E>(event: K, payload: E[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    // Copy so listeners may unsubscribe while the event is being dispatched.
    for (const listener of [...set]) (listener as Listener<E[K]>)(payload);
  }

  /** Number of listeners for `event`, or for all events when omitted (for leak checks). */
  listenerCount(event?: keyof E): number {
    if (event !== undefined) return this.listeners.get(event)?.size ?? 0;
    let total = 0;
    for (const set of this.listeners.values()) total += set.size;
    return total;
  }

  /** Remove every listener (call when tearing a game down). */
  clear(): void {
    this.listeners.clear();
  }
}
