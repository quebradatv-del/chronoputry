import { describe, expect, it } from "vitest";

import {
  createInitialCycle,
  durationWithProportionalProgress,
  elapsedCycleCount,
  remainingAt,
  shouldPlayPreCue,
} from "./timerState";

describe("estado do timer", () => {
  it("inicia pausado, em Norte, sem áudio e com duração completa", () => {
    expect(createInitialCycle(5.8, 100)).toEqual({
      status: "paused",
      directionIndex: 0,
      startedAt: 100,
      duration: 5.8,
      remaining: 5.8,
      audioPlayed: false,
    });
  });

  it("calcula tempo restante sem retornar negativos", () => {
    expect(remainingAt(6_000, 5_900)).toBeCloseTo(0.1);
    expect(remainingAt(6_000, 7_000)).toBe(0);
  });

  it("preserva proporcionalmente o progresso ao trocar a duração", () => {
    expect(durationWithProportionalProgress(3, 6, 10)).toBe(5);
    expect(durationWithProportionalProgress(0, 6, 10)).toBe(0);
  });

  it("recalcula suspensões longas em uma única passagem", () => {
    expect(elapsedCycleCount(6_000, 6_000, 6)).toBe(1);
    expect(elapsedCycleCount(6_000, 31_000, 6)).toBe(5);
    expect(elapsedCycleCount(6_000, 5_999, 6)).toBe(0);
  });

  it("impede áudio antecipado duplicado no mesmo estágio", () => {
    const cycle = {
      ...createInitialCycle(6),
      status: "running" as const,
      remaining: 0.9,
    };
    expect(shouldPlayPreCue(cycle, 1)).toBe(true);
    expect(shouldPlayPreCue({ ...cycle, audioPlayed: true }, 1)).toBe(false);
  });
});
