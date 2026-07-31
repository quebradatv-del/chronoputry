import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAccurateTimer } from "./useAccurateTimer";

describe("useAccurateTimer", () => {
  let now = 0;
  let frames: FrameRequestCallback[];

  beforeEach(() => {
    frames = [];
    vi.spyOn(performance, "now").mockImplementation(() => now);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  function runNextFrame() {
    const callback = frames.shift();
    if (!callback) throw new Error("Nenhum frame pendente");
    act(() => callback(now));
  }

  it("pausa e retoma do tempo restante real", () => {
    const { result } = renderHook(() => useAccurateTimer(6, vi.fn()));
    act(() => result.current.start());
    now = 2_000;
    runNextFrame();
    expect(result.current.cycle.remaining).toBeCloseTo(4);

    now = 3_000;
    act(() => result.current.pause());
    expect(result.current.cycle.remaining).toBeCloseTo(3);
    now = 4_000;
    act(() => result.current.start());
    now = 5_000;
    runNextFrame();
    expect(result.current.cycle.remaining).toBeCloseTo(2);
  });

  it("reseta direção e limita ajustes para não ficarem negativos", () => {
    const { result } = renderHook(() => useAccurateTimer(6, vi.fn()));
    act(() => result.current.reset(2));
    expect(result.current.cycle).toMatchObject({
      directionIndex: 2,
      remaining: 6,
    });
    act(() => result.current.adjust(-10));
    expect(result.current.cycle.remaining).toBe(0);
  });

  it("preserva proporcionalmente o progresso ao alterar o intervalo", () => {
    const { result, rerender } = renderHook(
      ({ duration }) => useAccurateTimer(duration, vi.fn()),
      { initialProps: { duration: 6 } },
    );
    act(() => result.current.adjust(-3));
    rerender({ duration: 10 });
    expect(result.current.cycle.remaining).toBeCloseTo(5);
  });

  it("faz uma única troca por frame após uma suspensão longa", () => {
    const elapsed = vi.fn();
    const { result } = renderHook(() => useAccurateTimer(6, elapsed));
    act(() => result.current.start());
    now = 25_000;
    runNextFrame();
    expect(elapsed).toHaveBeenCalledTimes(1);
    expect(elapsed).toHaveBeenCalledWith(4, 0);
    runNextFrame();
    expect(elapsed).toHaveBeenCalledTimes(1);
  });
});
