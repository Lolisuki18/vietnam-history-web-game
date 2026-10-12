export { TypedEmitter } from "./emitter";
export { clamp } from "./math";
export { CHAPTER_IDS, createChapterProgress, isChapterId } from "./chapter";
export type { ChapterId, ChapterOutcome, ChapterProgress } from "./chapter";
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
