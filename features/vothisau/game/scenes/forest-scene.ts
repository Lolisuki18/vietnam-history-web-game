import { BAY_KEY } from "../assets/manifest";
import { Npc } from "../entities/npc";
import type { Guard, GuardEvent } from "../entities/guard";
import { sendToHost } from "../host-bridge";
import { run, resetRun } from "../run-state";
import { FOREST, FOREST_THOUGHT_SPOTS, type PaperSpawn } from "../world-data";
import { GUARD_LINES, SAU_THOUGHTS } from "../../data/story";
import type { DialogueId } from "../../types";

import { LevelScene } from "./level-scene";

/**
 * Act 1 – the rubber forest at night. A corridor to walk from the bottom to the top: learn to
 * move, to hide in a bush while a guard looks away, to read the beams of the patrols, and to throw
 * pebbles to pull them away. It ends at comrade Bảy's hidden post.
 */
export class ForestScene extends LevelScene {
  private bay?: Npc;

  constructor() {
    super(FOREST);
  }

  protected override get usesPebbles(): boolean {
    return true;
  }

  protected override get chatterLines(): readonly string[] {
    return GUARD_LINES.patrol;
  }

  protected override onCreate(): void {
    this.bay = new Npc(this, BAY_KEY, 664, 250);
  }

  protected override onBegin(): void {
    // A fresh run starts here: the forest is the first scene of the game.
    resetRun();
    sendToHost({ type: "chapter:phase", phase: "forest" });
    sendToHost({ type: "chapter:grenade", has: false });
    this.cleanups.push(this.audio.music("bgmForest", 0.3), this.audio.forestAmbience());
    this.time.delayedCall(900, () => {
      if (this.mode === "play") this.think(SAU_THOUGHTS.forestStart[0]);
    });
  }

  protected override onAction(): void {
    this.throwPebbleForward();
  }

  protected override onFrame(): void {
    if (this.mode !== "play") return;
    // The first place where a guard stands in the way: say what to do about it.
    if (this.player.y <= FOREST_THOUGHT_SPOTS.gap.y) {
      this.thinkOnce("gap", SAU_THOUGHTS.hide[0]);
    }
  }

  protected override onFirstHide(): void {
    this.think(SAU_THOUGHTS.bushHint[0]);
  }

  protected override onHideAgain(): void {
    super.onHideAgain();
    const lines = SAU_THOUGHTS.hide;
    this.think(lines[Math.floor(Math.random() * lines.length)]!);
  }

  protected override onGuardReacted(event: GuardEvent, guard: Guard): void {
    const text = event === "alert" ? GUARD_LINES.alert[0] : GUARD_LINES.suspicious[0];
    this.bubbles.sayOnce(
      `guard-${event}`,
      `guard-${this.guards.indexOf(guard)}`,
      () => guard.head,
      text,
      {
        color: event === "alert" ? "#ff9f9f" : "#ffd9a0",
      },
    );
  }

  protected override onPaperCollected(spawn: PaperSpawn): void {
    if (!spawn.final) return;
    // The first secret letter of the mission is waiting at the hidden post: the briefing follows.
    this.setMode("frozen");
    sendToHost({ type: "chapter:phase", phase: "meet-bay" });
    this.time.delayedCall(900, () => sendToHost({ type: "chapter:dialogue", id: "bay" }));
  }

  protected override onDialogueClosed(id: DialogueId): void {
    if (id !== "bay" || this.mode !== "frozen") return;
    run.hasGrenade = true;
    sendToHost({ type: "chapter:grenade", has: true });
    this.stop();
    this.fadeThen(600, () => this.scene.start("market", { autostart: true }));
  }

  protected override debugTarget(target: string): boolean {
    if (target === "end") {
      this.player.teleport(600, 340);
      return true;
    }
    if (target === "act2") {
      run.hasGrenade = true;
      this.stop();
      this.scene.start("market", { autostart: true });
      return true;
    }
    return false;
  }

  protected override onShutdownExtra(): void {
    this.bay?.destroy();
    this.bay = undefined;
  }
}
