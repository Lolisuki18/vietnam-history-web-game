import type { ChapterOutcome, ChapterPhase, DialogueId } from "@vhg/engine";
import { create } from "zustand";

export type KimDongScreen = "menu" | "playing" | "result";

export interface DialogueState {
  id: DialogueId;
  /** Index of the line currently displayed. */
  line: number;
}

export interface ToastState {
  /** Changes for every toast so the auto-hide timer restarts when a new one replaces the old. */
  key: number;
  /** Which letter (0-based pickup order) to display. */
  letterIndex: number;
}

const LETTER_TOTAL = 5;

interface RunState {
  phase: ChapterPhase | null;
  collected: number;
  total: number;
  alert: number;
  /** Content of the current/last dialogue; kept after closing so it can fade out. */
  dialogue: DialogueState | null;
  dialogueOpen: boolean;
  toast: ToastState | null;
  outcome: ChapterOutcome | null;
}

const initialRun: RunState = {
  phase: null,
  collected: 0,
  total: LETTER_TOTAL,
  alert: 0,
  dialogue: null,
  dialogueOpen: false,
  toast: null,
  outcome: null,
};

interface KimDongUiState extends RunState {
  /** The game iframe has loaded and is waiting for `host:start`. */
  ready: boolean;
  screen: KimDongScreen;

  setReady: () => void;
  /** Back to the initial state (menu, not ready); used when the chapter page mounts/unmounts. */
  reset: () => void;
  setScreen: (screen: KimDongScreen) => void;
  /** Begin a (new) run: clears run state and switches to the gameplay screen. */
  startRun: () => void;
  setPhase: (phase: ChapterPhase) => void;
  setCollected: (collected: number, total: number) => void;
  setAlert: (value: number) => void;
  openDialogue: (id: DialogueId) => void;
  setDialogueLine: (line: number) => void;
  closeDialogue: () => void;
  showToast: (letterIndex: number) => void;
  hideToast: (key: number) => void;
  finish: (outcome: ChapterOutcome) => void;
}

let toastCounter = 0;

/** Transient UI state of the Kim Đồng chapter (not persisted; see progress-store for that). */
export const useKimDongUiStore = create<KimDongUiState>()((set) => ({
  ...initialRun,
  ready: false,
  screen: "menu",

  setReady: () => set({ ready: true }),
  reset: () => set({ ...initialRun, ready: false, screen: "menu" }),
  setScreen: (screen) => set({ screen }),
  startRun: () => set({ ...initialRun, screen: "playing" }),
  setPhase: (phase) => set({ phase }),
  setCollected: (collected, total) => set({ collected, total }),
  setAlert: (alert) => set({ alert: Math.min(100, Math.max(0, alert)) }),
  openDialogue: (id) => set({ dialogue: { id, line: 0 }, dialogueOpen: true }),
  setDialogueLine: (line) =>
    set((state) => (state.dialogue ? { dialogue: { ...state.dialogue, line } } : state)),
  closeDialogue: () => set({ dialogueOpen: false }),
  showToast: (letterIndex) => set({ toast: { key: ++toastCounter, letterIndex } }),
  // Ignore stale timers: only hide the toast that scheduled the call.
  hideToast: (key) => set((state) => (state.toast?.key === key ? { toast: null } : state)),
  finish: (outcome) => set({ outcome, screen: "result", dialogueOpen: false, toast: null }),
}));
