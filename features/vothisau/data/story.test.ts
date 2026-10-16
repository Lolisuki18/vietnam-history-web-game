import { describe, expect, it } from "vitest";

import { CHOICE_IDS, DIALOGUE_IDS } from "../types";

import {
  CHOICES,
  CODEX,
  DIALOGUES,
  INTERROGATION_ANSWERS,
  INTERROGATION_INTRO,
  INTERROGATION_VERDICT,
  LORE,
  PHASE_OBJECTIVES,
} from "./story";
import { CHAPTER_PHASES } from "../types";

describe("story data", () => {
  it("describes every phase", () => {
    for (const phase of CHAPTER_PHASES) expect(PHASE_OBJECTIVES[phase]).toBeTruthy();
  });

  it("has a script for every dialogue and choice", () => {
    for (const id of DIALOGUE_IDS) expect(DIALOGUES[id].lines.length).toBeGreaterThan(0);
    for (const id of CHOICE_IDS) expect(CHOICES[id].options.length).toBeGreaterThanOrEqual(2);
  });

  it("has exactly one right answer at the checkpoint, and it is option a", () => {
    const right = CHOICES.checkpoint.options.filter((option) => option.correct);
    expect(right).toHaveLength(1);
    expect(right[0]!.id).toBe("a");
  });

  it("gives every timed choice a short time limit (3-5 seconds)", () => {
    for (const id of CHOICE_IDS) {
      expect(CHOICES[id].seconds).toBeGreaterThanOrEqual(3);
      expect(CHOICES[id].seconds).toBeLessThanOrEqual(5);
    }
  });

  it("keeps five papers, the last one urgent", () => {
    expect(LORE).toHaveLength(5);
    expect(LORE[4]!.urgent).toBe(true);
  });

  it("offers two answers in the interrogation, both ending in Chị Sáu's words", () => {
    expect(INTERROGATION_ANSWERS.map((answer) => answer.id)).toEqual([1, 2]);
    for (const answer of INTERROGATION_ANSWERS) {
      expect(answer.lines.length).toBeGreaterThan(0);
      expect(answer.lines.at(-1)!.speaker).toBe("sau");
    }
    expect(INTERROGATION_INTRO[0]!.speaker).toBe("narrator");
    expect(INTERROGATION_VERDICT.at(-1)!.text).toContain("Côn Đảo");
  });

  it("states the dates of the dossier consistently", () => {
    expect(CODEX.years).toBe("1933 – 1952");
    expect(CODEX.timeline.at(-1)!.date).toBe("2/8/1993");
  });
});
