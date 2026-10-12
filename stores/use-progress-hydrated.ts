"use client";

import { useSyncExternalStore } from "react";

import { useProgressStore } from "./progress-store";

/**
 * True once the persisted progress has been loaded from localStorage on the client.
 * Use it to avoid flashing "locked" UI before the saved state is known.
 */
export function useProgressHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useProgressStore.persist.onFinishHydration(onChange),
    () => useProgressStore.persist.hasHydrated(),
    () => false,
  );
}
