import { describe, expect, it, vi } from "vitest";

import { TypedEmitter } from "./emitter";

interface Events {
  ping: number;
  done: undefined;
}

describe("TypedEmitter", () => {
  it("delivers payloads to subscribers and supports unsubscribe", () => {
    const emitter = new TypedEmitter<Events>();
    const listener = vi.fn();
    const off = emitter.on("ping", listener);

    emitter.emit("ping", 1);
    off();
    emitter.emit("ping", 2);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(1);
  });

  it("fires once listeners a single time", () => {
    const emitter = new TypedEmitter<Events>();
    const listener = vi.fn();
    emitter.once("done", listener);

    emitter.emit("done", undefined);
    emitter.emit("done", undefined);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("tolerates listeners that unsubscribe during dispatch", () => {
    const emitter = new TypedEmitter<Events>();
    const second = vi.fn();
    const off = emitter.on("ping", () => off());
    emitter.on("ping", second);

    emitter.emit("ping", 1);

    expect(second).toHaveBeenCalledTimes(1);
  });

  it("counts listeners per event and in total", () => {
    const emitter = new TypedEmitter<Events>();
    const off = emitter.on("ping", () => undefined);
    emitter.on("ping", () => undefined);
    emitter.on("done", () => undefined);

    expect(emitter.listenerCount("ping")).toBe(2);
    expect(emitter.listenerCount("done")).toBe(1);
    expect(emitter.listenerCount()).toBe(3);

    off();
    expect(emitter.listenerCount("ping")).toBe(1);
    expect(emitter.listenerCount()).toBe(2);
  });

  it("clear removes every listener", () => {
    const emitter = new TypedEmitter<Events>();
    const listener = vi.fn();
    emitter.on("ping", listener);

    emitter.clear();
    emitter.emit("ping", 1);

    expect(listener).not.toHaveBeenCalled();
  });
});
