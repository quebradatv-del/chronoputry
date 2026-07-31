import { useCallback, useEffect, useRef, useState } from "react";

import type { CycleState } from "../types";
import { moveDirection } from "../services/directionService";
import {
  createInitialCycle,
  durationWithProportionalProgress,
  elapsedCycleCount,
  remainingAt,
} from "../services/timerState";

export interface AccurateTimer {
  cycle: CycleState;
  start: () => void;
  pause: () => void;
  reset: (directionIndex?: number) => void;
  adjust: (seconds: number) => void;
  changeDirection: (updater: (currentIndex: number) => number) => void;
  markAudioPlayed: () => void;
}

export function useAccurateTimer(
  duration: number,
  onElapsed: (elapsedCycles: number, nextDirectionIndex: number) => void,
): AccurateTimer {
  const [cycle, setCycle] = useState(() => createInitialCycle(duration));
  const endTimeRef = useRef(performance.now() + duration * 1_000);
  const cycleRef = useRef(cycle);
  const durationRef = useRef(duration);
  const onElapsedRef = useRef(onElapsed);

  cycleRef.current = cycle;
  onElapsedRef.current = onElapsed;

  const start = useCallback(() => {
    const now = performance.now();
    setCycle((current) => {
      if (current.status === "running") return current;
      endTimeRef.current = now + current.remaining * 1_000;
      return { ...current, status: "running", startedAt: now };
    });
  }, []);

  const pause = useCallback(() => {
    const now = performance.now();
    setCycle((current) => {
      if (current.status === "paused") return current;
      return {
        ...current,
        status: "paused",
        remaining: remainingAt(endTimeRef.current, now),
      };
    });
  }, []);

  const reset = useCallback((directionIndex?: number) => {
    const now = performance.now();
    endTimeRef.current = now + durationRef.current * 1_000;
    setCycle((current) => ({
      ...current,
      directionIndex: directionIndex ?? current.directionIndex,
      startedAt: now,
      duration: durationRef.current,
      remaining: durationRef.current,
      audioPlayed: false,
    }));
  }, []);

  const changeDirection = useCallback(
    (updater: (currentIndex: number) => number) => {
      const now = performance.now();
      endTimeRef.current = now + durationRef.current * 1_000;
      setCycle((current) => ({
        ...current,
        directionIndex: updater(current.directionIndex),
        startedAt: now,
        remaining: durationRef.current,
        audioPlayed: false,
      }));
    },
    [],
  );

  const adjust = useCallback((seconds: number) => {
    const now = performance.now();
    endTimeRef.current = Math.max(now, endTimeRef.current + seconds * 1_000);
    setCycle((current) => ({
      ...current,
      remaining: Math.max(0, current.remaining + seconds),
    }));
  }, []);

  const markAudioPlayed = useCallback(() => {
    setCycle((current) => ({ ...current, audioPlayed: true }));
  }, []);

  useEffect(() => {
    const previousDuration = durationRef.current;
    if (previousDuration === duration) return;

    const now = performance.now();
    const current = cycleRef.current;
    const exactRemaining =
      current.status === "running"
        ? remainingAt(endTimeRef.current, now)
        : current.remaining;
    const nextRemaining = durationWithProportionalProgress(
      exactRemaining,
      previousDuration,
      duration,
    );

    durationRef.current = duration;
    endTimeRef.current = now + nextRemaining * 1_000;
    setCycle((state) => ({
      ...state,
      duration,
      remaining: nextRemaining,
      startedAt: now - (duration - nextRemaining) * 1_000,
      audioPlayed: false,
    }));
  }, [duration]);

  useEffect(() => {
    if (cycle.status !== "running") return;

    let animationFrame = 0;
    const tick = () => {
      const now = performance.now();
      const elapsedCycles = elapsedCycleCount(
        endTimeRef.current,
        now,
        durationRef.current,
      );

      if (elapsedCycles > 0) {
        endTimeRef.current += elapsedCycles * durationRef.current * 1_000;
        const nextDirectionIndex = moveDirection(
          cycleRef.current.directionIndex,
          elapsedCycles,
        );
        onElapsedRef.current(elapsedCycles, nextDirectionIndex);
        setCycle((current) => ({
          ...current,
          directionIndex: nextDirectionIndex,
          startedAt: now,
          remaining: remainingAt(endTimeRef.current, now),
          audioPlayed: false,
        }));
      } else {
        setCycle((current) => ({
          ...current,
          remaining: remainingAt(endTimeRef.current, now),
        }));
      }

      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [cycle.status]);

  return {
    cycle,
    start,
    pause,
    reset,
    adjust,
    changeDirection,
    markAudioPlayed,
  };
}
