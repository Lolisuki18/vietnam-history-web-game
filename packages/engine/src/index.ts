export { TypedEmitter } from "./emitter";
export { clamp } from "./math";
export {
  CHAPTER_IDS,
  CHAPTER_PHASES,
  DIALOGUE_IDS,
  createChapterProgress,
  isChapterId,
  isChapterPhase,
  isDialogueId,
} from "./chapter";
export type {
  ChapterId,
  ChapterOutcome,
  ChapterPhase,
  ChapterProgress,
  DialogueId,
} from "./chapter";
export {
  isChapterMessage,
  isHostMessage,
  listenChapterMessages,
  listenHostMessages,
  postChapterMessage,
  postHostMessage,
} from "./bridge";
export type { ChapterMessage, ChapterMessageInput, HostMessage, HostMessageInput } from "./bridge";
export {
  angleDifference,
  distanceToPolyline,
  distanceToSegment,
  isInsideCircle,
  isPointInCone,
  rotateToward,
  sampleCatmullRom,
  segmentIntersectsRect,
} from "./geometry";
export type { Point } from "./geometry";
export {
  createStickDirections,
  createStickState,
  resolveStick,
  stickDirections,
} from "./virtual-stick";
export type { StickDirections, StickState } from "./virtual-stick";
