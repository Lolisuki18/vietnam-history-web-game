"use client";

import { useEffect, useState } from "react";

/**
 * Reveal something in steps once `active` turns true: the returned stage becomes 1 after
 * `delays[0]` ms, 2 after `delays[1]` ms, and so on (delays are counted from the moment
 * `active` became true). It reads 0 while inactive and starts over the next time it activates.
 *
 * `delays` must be a stable reference (declare it at module level).
 */
export function useStagedReveal(active: boolean, delays: readonly number[]): number {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // State is only set from timers (never synchronously inside the effect).
    const timers = active
      ? delays.map((delay, index) => window.setTimeout(() => setStage(index + 1), delay))
      : [window.setTimeout(() => setStage(0), 0)];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [active, delays]);

  return active ? stage : 0;
}
