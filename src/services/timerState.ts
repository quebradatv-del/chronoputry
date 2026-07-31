import type { AudioTiming, CycleState } from "../types";

export function createInitialCycle(
  duration: number,
  now = performance.now(),
): CycleState {
  return {
    status: "paused",
    directionIndex: 0,
    startedAt: now,
    duration,
    remaining: duration,
    audioPlayed: false,
  };
}

export function remainingAt(endTime: number, now: number) {
  return Math.max(0, (endTime - now) / 1_000);
}

export function durationWithProportionalProgress(
  remaining: number,
  previousDuration: number,
  nextDuration: number,
) {
  const progressRemaining =
    previousDuration > 0 ? remaining / previousDuration : 1;
  return Math.min(nextDuration, Math.max(0, nextDuration * progressRemaining));
}

export function elapsedCycleCount(
  endTime: number,
  now: number,
  duration: number,
) {
  if (now < endTime) return 0;
  return Math.floor((now - endTime) / (duration * 1_000)) + 1;
}

export function shouldPlayPreCue(cycle: CycleState, audioTiming: AudioTiming) {
  return (
    cycle.status === "running" &&
    !cycle.audioPlayed &&
    audioTiming > 0 &&
    cycle.remaining <= audioTiming
  );
}
