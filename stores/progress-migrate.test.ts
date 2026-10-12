import { describe, expect, it } from "vitest";

import { emptyProgress, migrateProgress } from "./progress-migrate";

const progress = { chapterId: "kim-dong", collected: 3, total: 5, percent: 60, completed: false };
const completion = {
  completedAt: "2026-10-12T03:02:58.557Z",
  outcome: { lettersCollected: 5, survivedSeconds: 14, hits: 1 },
};

describe("migrateProgress", () => {
  it("keeps a valid unversioned save (version 0) as it is", () => {
    const saved = {
      chapters: { "kim-dong": progress },
      completions: { "kim-dong": completion },
      codexUnlocked: ["kim-dong"],
    };
    expect(migrateProgress(saved, 0)).toEqual(saved);
  });

  it("returns an empty save for anything that is not an object", () => {
    for (const junk of [null, undefined, 42, "text", [], true]) {
      expect(migrateProgress(junk, 0)).toEqual(emptyProgress());
    }
  });

  it("drops chapters that do not exist (a removed game) and unlocks nothing for them", () => {
    const saved = {
      chapters: { "kim-dong": progress, "old-game": { ...progress, chapterId: "old-game" } },
      completions: { "old-game": completion },
      codexUnlocked: ["old-game", "kim-dong", "kim-dong"],
    };
    const result = migrateProgress(saved, 0);
    expect(Object.keys(result.chapters)).toEqual(["kim-dong"]);
    expect(result.completions).toEqual({});
    expect(result.codexUnlocked).toEqual(["kim-dong"]);
  });

  it("drops malformed entries but keeps the valid ones", () => {
    const result = migrateProgress(
      {
        chapters: { "kim-dong": { collected: "three" } },
        completions: { "kim-dong": { completedAt: 5, outcome: {} } },
        codexUnlocked: "kim-dong",
      },
      0,
    );
    expect(result).toEqual(emptyProgress());
  });

  it("keeps only numeric outcome fields", () => {
    const result = migrateProgress(
      {
        completions: {
          "kim-dong": { completedAt: "x", outcome: { hits: 2, note: "text", nan: Number.NaN } },
        },
      },
      0,
    );
    expect(result.completions["kim-dong"]?.outcome).toEqual({ hits: 2 });
  });
});
