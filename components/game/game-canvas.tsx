"use client";

import { Button, buttonStyles } from "@/components/ui";
import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { GameHandle } from "@/lib/game/phaser";

export type GameLoader = () => Promise<(parent: HTMLElement) => GameHandle>;

interface GameCanvasProps {
  /**
   * Loads the game's code with a dynamic `import()` and resolves to its `createGame`. Phaser
   * touches `window` as soon as it loads, so it must never be imported during server rendering.
   * Pass a stable (module-level) function.
   */
  load: GameLoader;
  /** Accessible name of the canvas area, e.g. "Trò chơi Kim Đồng". */
  label: string;
}

/**
 * Hosts a Phaser game that fills its parent. It creates the game in an effect and destroys it in
 * the cleanup (which also covers React StrictMode's extra mount/unmount in development: the first
 * import resolves after `disposed` is set and creates nothing). When the code cannot be loaded or
 * the game cannot start (offline, no graphics support, ...), it shows a retry screen.
 */
export function GameCanvas({ load, label }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let disposed = false;
    let handle: GameHandle | undefined;

    load()
      .then((createGame) => {
        const container = containerRef.current;
        if (disposed || !container) return;
        handle = createGame(container);
      })
      .catch((error: unknown) => {
        console.error("Game failed to start", error);
        // Tear down a half-created game (the constructor may have thrown after adding a canvas).
        handle?.destroy();
        containerRef.current?.replaceChildren();
        if (!disposed) setFailed(true);
      });

    return () => {
      disposed = true;
      handle?.destroy();
    };
  }, [load, attempt]);

  const retry = () => {
    setFailed(false);
    setAttempt((value) => value + 1);
  };

  return (
    <>
      <div
        ref={containerRef}
        aria-label={label}
        // The virtual joystick must not scroll, zoom or select text.
        className="absolute inset-0 touch-none overscroll-none select-none"
      />
      {failed && (
        <div
          role="alert"
          className="absolute inset-0 z-50 flex items-center justify-center bg-stone-950 p-6"
        >
          <div className="flex max-w-md flex-col items-center gap-5 text-center">
            <AlertTriangle className="size-10 text-amber-500" aria-hidden />
            <h1 className="font-serif text-2xl font-bold text-amber-500">
              Không thể khởi động trò chơi
            </h1>
            <p className="text-stone-300">
              Có thể do mất kết nối mạng hoặc thiết bị chưa hỗ trợ đồ họa cần thiết. Hãy kiểm tra
              mạng rồi thử lại, hoặc mở bằng trình duyệt khác.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button onClick={retry}>
                <RotateCcw className="size-4" aria-hidden /> Thử lại
              </Button>
              <Link href="/" className={buttonStyles({ variant: "secondary" })}>
                Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
