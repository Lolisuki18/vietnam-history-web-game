"use client";

import { useEffect, useRef } from "react";

/**
 * Hosts the Phaser canvas. Phaser touches `window` as soon as it loads, so it is imported inside
 * the effect (never during server rendering) and only on this page. The cleanup also covers React
 * StrictMode's extra mount/unmount in development: the first import resolves after `disposed`
 * is set and creates nothing.
 */
export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let destroy: (() => void) | undefined;

    void import("@/features/kimdong/game/main").then(({ createGame }) => {
      const container = containerRef.current;
      if (disposed || !container) return;
      destroy = createGame(container).destroy;
    });

    return () => {
      disposed = true;
      destroy?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-label="Trò chơi Kim Đồng"
      // The virtual joystick must not scroll, zoom or select text.
      className="absolute inset-0 touch-none overscroll-none select-none"
    />
  );
}
