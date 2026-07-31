import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAccurateTimer } from "./useAccurateTimer";

describe("useAccurateTimer", () => {
  let now = 0;
  let frames: FrameRequestCallback[];

  beforeEach(() => {
    // O deadline é absoluto; cada teste precisa começar no mesmo relógio monotônico.
    now = 0;
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

  function startTimer(elapsed = vi.fn()) {
    const hook = renderHook(() => useAccurateTimer(6, elapsed));
    act(() => hook.result.current.start());
    return { ...hook, elapsed };
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
    const { elapsed } = startTimer();
    now = 25_000;
    runNextFrame();
    expect(elapsed).toHaveBeenCalledTimes(1);
    expect(elapsed).toHaveBeenCalledWith(4, 0);
    runNextFrame();
    expect(elapsed).toHaveBeenCalledTimes(1);
  });

  it("recalcula uma suspensão de exatamente três ciclos", () => {
    const { result, elapsed } = startTimer();
    now = 18_000;
    runNextFrame();
    expect(elapsed).toHaveBeenCalledOnce();
    expect(elapsed).toHaveBeenCalledWith(3, 3);
    expect(result.current.cycle).toMatchObject({
      directionIndex: 3,
      remaining: 6,
    });
  });

  it("recalcula três ciclos e meio sem arredondar para o próximo ciclo", () => {
    const { result, elapsed } = startTimer();
    now = 21_000;
    runNextFrame();
    expect(elapsed).toHaveBeenCalledOnce();
    expect(elapsed).toHaveBeenCalledWith(3, 3);
    expect(result.current.cycle.directionIndex).toBe(3);
    expect(result.current.cycle.remaining).toBeCloseTo(3);
  });

  it("conta o ciclo quando a retomada cai exatamente no próximo limite", () => {
    const { result, elapsed } = startTimer();
    now = 24_000;
    runNextFrame();
    expect(elapsed).toHaveBeenCalledOnce();
    expect(elapsed).toHaveBeenCalledWith(4, 0);
    expect(result.current.cycle).toMatchObject({
      directionIndex: 0,
      remaining: 6,
    });
  });

  it("não troca a direção quando a suspensão dura menos que um ciclo", () => {
    const { result, elapsed } = startTimer();
    now = 5_999;
    runNextFrame();
    expect(elapsed).not.toHaveBeenCalled();
    expect(result.current.cycle.directionIndex).toBe(0);
    expect(result.current.cycle.remaining).toBeCloseTo(0.001);
  });

  it("não dispara callback duplicado em dois frames consecutivos após retomar", () => {
    const { elapsed } = startTimer();
    now = 18_000;
    runNextFrame();
    runNextFrame();
    expect(elapsed).toHaveBeenCalledOnce();
    expect(elapsed).toHaveBeenCalledWith(3, 3);
  });
});
