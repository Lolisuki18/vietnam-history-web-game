"use client";

import { useEffect } from "react";

import { useProgressStore } from "@/stores/progress-store";

/** Loads persisted progress from localStorage once the app has mounted in the browser. */
export function StoreHydrator() {
  useEffect(() => {
    void useProgressStore.persist.rehydrate();
  }, []);

  return null;
}
