import { create } from "zustand";

import { PAPER_TOTAL } from "../game/run-state";

import type { Act, ChapterPhase, ChoiceId, DialogueId, GameStats, VoThiSauOutcome } from "../types";

export type VoThiSauScreen = "menu" | "playing" | "interrogation" | "result";

export interface DialogueState {
  id: DialogueId;
  /** Index of the line currently displayed. */
  line: number;
}

export interface ToastState {
  /** Changes for every toast so the auto-hide timer restarts when a new one replaces the old. */
  key: number;
  /** Which paper (index into `LORE`) to display. */
  loreIndex: number;
}

export interface ChoiceState {
  id: ChoiceId;
  /** Changes for every question so the countdown restarts. */
  key: number;
}

interface RunState {
  act: Act | null;
  phase: ChapterPhase | null;
  collected: number;
  total: number;
  alert: number;
  hasGrenade: boolean;
  /** Content of the current/last dialogue; kept after closing so it can fade out. */
  dialogue: DialogueState | null;
  dialogueOpen: boolean;
  toast: ToastState | null;
  /** A timed question is waiting for an answer (the game is frozen meanwhile). */
  choice: ChoiceState | null;
  /** The "play the buyer" timing game is on. */
  qteKey: number | null;
  /** The act title card currently showing (a key that changes for every card). */
  actCard: { act: Act; key: number } | null;
  /** What acts 1 and 2 collected; kept for the interrogation and the result. */
  stats: GameStats | null;
  outcome: VoThiSauOutcome | null;
}

const initialRun: RunState = {
  act: null,
  phase: null,
  collected: 0,
  total: PAPER_TOTAL,
  alert: 0,
  hasGrenade: false,
  dialogue: null,
  dialogueOpen: false,
  toast: null,
  choice: null,
  qteKey: null,
  actCard: null,
  stats: null,
  outcome: null,
};

interface VoThiSauUiState extends RunState {
  /** The game has loaded and is waiting for `host:start`. */
  ready: boolean;
  screen: VoThiSauScreen;

  setReady: () => void;
  /** Back to the initial state (menu, not ready); used when the chapter page mounts/unmounts. */
  reset: () => void;
  /** Begin a (new) run: clears run state and switches to the gameplay screen. */
  startRun: () => void;
  setAct: (act: Act) => void;
  setPhase: (phase: ChapterPhase) => void;
  setCollected: (collected: number, total: number) => void;
  setAlert: (value: number) => void;
  setGrenade: (has: boolean) => void;
  openDialogue: (id: DialogueId) => void;
  setDialogueLine: (line: number) => void;
  closeDialogue: () => void;
  showToast: (loreIndex: number) => void;
  hideToast: (key: number) => void;
  openChoice: (id: ChoiceId) => void;
  closeChoice: () => void;
  openQte: () => void;
  closeQte: () => void;
  hideActCard: (key: number) => void;
  /** Acts 1 and 2 are over: on to the interrogation room. */
  enterInterrogation: (stats: GameStats) => void;
  finish: (outcome: VoThiSauOutcome) => void;
}

let counter = 0;

/** Transient UI state of the Võ Thị Sáu chapter (not persisted; see progress-store for that). */
export const useVoThiSauUiStore = create<VoThiSauUiState>()((set) => ({
  ...initialRun,
  ready: false,
  screen: "menu",

  setReady: () => set({ ready: true }),
  reset: () => set({ ...initialRun, ready: false, screen: "menu" }),
  startRun: () => set({ ...initialRun, screen: "playing" }),
  setAct: (act) => set({ act, actCard: { act, key: ++counter } }),
  setPhase: (phase) => set({ phase }),
  setCollected: (collected, total) => set({ collected, total }),
  setAlert: (alert) => set({ alert: Math.min(100, Math.max(0, alert)) }),
  setGrenade: (hasGrenade) => set({ hasGrenade }),
  openDialogue: (id) => set({ dialogue: { id, line: 0 }, dialogueOpen: true }),
  setDialogueLine: (line) =>
    set((state) => (state.dialogue ? { dialogue: { ...state.dialogue, line } } : state)),
  closeDialogue: () => set({ dialogueOpen: false }),
  showToast: (loreIndex) => set({ toast: { key: ++counter, loreIndex } }),
  // Ignore stale timers: only hide the toast that scheduled the call.
  hideToast: (key) => set((state) => (state.toast?.key === key ? { toast: null } : state)),
  openChoice: (id) => set({ choice: { id, key: ++counter } }),
  closeChoice: () => set({ choice: null }),
  openQte: () => set({ qteKey: ++counter }),
  closeQte: () => set({ qteKey: null }),
  hideActCard: (key) => set((state) => (state.actCard?.key === key ? { actCard: null } : state)),
  enterInterrogation: (stats) =>
    set({
      stats,
      act: 3,
      phase: "interrogation",
      screen: "interrogation",
      actCard: { act: 3, key: ++counter },
      dialogueOpen: false,
      toast: null,
      choice: null,
      qteKey: null,
    }),
  finish: (outcome) => set({ outcome, screen: "result", phase: "ending" }),
}));
