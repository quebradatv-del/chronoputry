export const directions = [
  { id: "north", label: "Norte", arrow: "↑" },
  { id: "right", label: "Direita", arrow: "→" },
  { id: "south", label: "Sul", arrow: "↓" },
  { id: "left", label: "Esquerda", arrow: "←" },
] as const;

export type DirectionId = (typeof directions)[number]["id"];
export type TimerStatus = "paused" | "running";
export type AudioTiming = 0 | 1 | 2;
export type HotkeyAction = "toggle" | "sync" | "next" | "previous" | "clickThrough" | "visibility";
export type Hotkeys = Record<HotkeyAction, string>;

export interface Settings {
  interval: number; volume: number; opacity: number; scale: number; audioTiming: AudioTiming;
  audioFiles: Record<DirectionId, string>; hotkeys: Hotkeys; soundEnabled: boolean;
  showDirection: boolean; showCountdown: boolean; showNext: boolean; compact: boolean;
  lockPosition: boolean; alwaysOnTop: boolean; clickThrough: boolean;
}

export interface CycleState {
  status: TimerStatus; directionIndex: number; startedAt: number; duration: number;
  remaining: number; audioPlayed: boolean;
}
