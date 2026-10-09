import { describe, expect, it } from "vitest";

import { isChapterMessage, isHostMessage } from "./bridge";

const progress = { chapterId: "kim-dong", collected: 1, total: 5, percent: 20, completed: false };

describe("isChapterMessage", () => {
  it("accepts every valid game message", () => {
    const messages = [
      { type: "chapter:ready" },
      { type: "chapter:progress", progress },
      { type: "chapter:letter", index: 0 },
      { type: "chapter:phase", phase: "runner" },
      { type: "chapter:dialogue", id: "intro" },
      { type: "chapter:alert", value: 40 },
      { type: "chapter:complete", outcome: { lettersCollected: 5, survivedSeconds: 12, hits: 1 } },
    ];
    for (const message of messages) {
      expect(isChapterMessage({ source: "vhg-chapter", ...message })).toBe(true);
    }
  });

  it("rejects a wrong source or unknown type", () => {
    expect(isChapterMessage({ source: "other", type: "chapter:ready" })).toBe(false);
    expect(isChapterMessage({ source: "vhg-chapter", type: "chapter:nope" })).toBe(false);
    expect(isChapterMessage(null)).toBe(false);
    expect(isChapterMessage("chapter:ready")).toBe(false);
  });

  it("rejects malformed payloads", () => {
    const base = { source: "vhg-chapter" } as const;
    expect(isChapterMessage({ ...base, type: "chapter:letter", index: "1" })).toBe(false);
    expect(isChapterMessage({ ...base, type: "chapter:alert", value: Number.NaN })).toBe(false);
    expect(isChapterMessage({ ...base, type: "chapter:phase", phase: "nope" })).toBe(false);
    expect(isChapterMessage({ ...base, type: "chapter:dialogue", id: "nope" })).toBe(false);
    expect(isChapterMessage({ ...base, type: "chapter:progress", progress: {} })).toBe(false);
    expect(isChapterMessage({ ...base, type: "chapter:complete", outcome: { hits: 1 } })).toBe(
      false,
    );
  });
});

describe("isHostMessage", () => {
  it("accepts valid host messages", () => {
    expect(isHostMessage({ source: "vhg-host", type: "host:hello" })).toBe(true);
    expect(isHostMessage({ source: "vhg-host", type: "host:start" })).toBe(true);
    expect(isHostMessage({ source: "vhg-host", type: "host:restart" })).toBe(true);
    expect(isHostMessage({ source: "vhg-host", type: "host:dialogue-closed", id: "intro" })).toBe(
      true,
    );
  });

  it("rejects game messages and bad payloads", () => {
    expect(isHostMessage({ source: "vhg-chapter", type: "chapter:ready" })).toBe(false);
    expect(isHostMessage({ source: "vhg-host", type: "host:dialogue-closed", id: "x" })).toBe(
      false,
    );
    expect(isHostMessage({ source: "vhg-host", type: "host:unknown" })).toBe(false);
  });
});
