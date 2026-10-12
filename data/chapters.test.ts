import { describe, expect, it } from "vitest";

import { CHAPTER_IDS } from "@/lib/engine";

import { CHAPTERS } from "./chapters";

const playable = CHAPTERS.filter((chapter) => chapter.id !== undefined);

describe("chapter list", () => {
  it("lists every chapter id exactly once", () => {
    const ids = playable.map((chapter) => chapter.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual([...CHAPTER_IDS].sort());
  });

  it("gives each playable chapter a game route and a Codex route under it", () => {
    for (const chapter of playable) {
      expect(chapter.href, chapter.id).toMatch(/^\/[a-z0-9-]+$/);
      expect(chapter.codexHref, chapter.id).toBe(`${chapter.href}/codex`);
    }
  });

  it("uses a different route for every chapter", () => {
    const hrefs = playable.map((chapter) => chapter.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("leaves coming-soon slots without routes", () => {
    for (const chapter of CHAPTERS.filter((entry) => entry.id === undefined)) {
      expect(chapter.href).toBeUndefined();
      expect(chapter.codexHref).toBeUndefined();
    }
  });
});
