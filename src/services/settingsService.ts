import { directions, type Settings } from "../types";

export const SETTINGS_KEY = "putrefactory-timer.settings.v2";
const LEGACY_SETTINGS_KEY = "putrefactory-timer.settings.v1";

export const defaultSettings: Settings = {
  interval: 6,
  volume: 0.8,
  opacity: 0.92,
  scale: 1,
  audioTiming: 0,
  audioFiles: { north: "", right: "", south: "", left: "" },
  hotkeys: {
    toggle: "F6",
    sync: "F7",
    next: "F8",
    previous: "F9",
    clickThrough: "F10",
    visibility: "F11",
  },
  soundEnabled: true,
  showDirection: true,
  showCountdown: true,
  showNext: true,
  compact: false,
  lockPosition: false,
  alwaysOnTop: true,
  clickThrough: false,
};

function finiteNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}

export function validateSettings(value: unknown): Settings {
  const input =
    value && typeof value === "object" ? (value as Partial<Settings>) : {};
  const inputAudio = (input.audioFiles ?? {}) as Partial<
    Settings["audioFiles"]
  >;
  const inputHotkeys = (input.hotkeys ?? {}) as Partial<Settings["hotkeys"]>;

  return {
    ...defaultSettings,
    interval: finiteNumber(input.interval, defaultSettings.interval, 1, 30),
    volume: finiteNumber(input.volume, defaultSettings.volume, 0, 1),
    opacity: finiteNumber(input.opacity, defaultSettings.opacity, 0.3, 1),
    scale: finiteNumber(input.scale, defaultSettings.scale, 0.75, 1.75),
    audioTiming: [0, 1, 2].includes(input.audioTiming ?? -1)
      ? (input.audioTiming as 0 | 1 | 2)
      : defaultSettings.audioTiming,
    audioFiles: Object.fromEntries(
      directions.map(({ id }) => [
        id,
        typeof inputAudio[id] === "string" ? inputAudio[id] : "",
      ]),
    ) as Settings["audioFiles"],
    hotkeys: {
      ...defaultSettings.hotkeys,
      ...Object.fromEntries(
        Object.entries(inputHotkeys).filter(
          ([, hotkey]) => typeof hotkey === "string",
        ),
      ),
    },
    soundEnabled:
      typeof input.soundEnabled === "boolean"
        ? input.soundEnabled
        : defaultSettings.soundEnabled,
    showDirection:
      typeof input.showDirection === "boolean"
        ? input.showDirection
        : defaultSettings.showDirection,
    showCountdown:
      typeof input.showCountdown === "boolean"
        ? input.showCountdown
        : defaultSettings.showCountdown,
    showNext:
      typeof input.showNext === "boolean"
        ? input.showNext
        : defaultSettings.showNext,
    compact:
      typeof input.compact === "boolean"
        ? input.compact
        : defaultSettings.compact,
    lockPosition:
      typeof input.lockPosition === "boolean"
        ? input.lockPosition
        : defaultSettings.lockPosition,
    alwaysOnTop:
      typeof input.alwaysOnTop === "boolean"
        ? input.alwaysOnTop
        : defaultSettings.alwaysOnTop,
    // Estado de segurança de sessão: nunca restaurar click-through.
    clickThrough: false,
  };
}

export function loadSettings(): Settings {
  try {
    const stored =
      localStorage.getItem(SETTINGS_KEY) ??
      localStorage.getItem(LEGACY_SETTINGS_KEY);
    return stored
      ? validateSettings(JSON.parse(stored))
      : { ...defaultSettings };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({ ...settings, clickThrough: false }),
  );
  localStorage.removeItem(LEGACY_SETTINGS_KEY);
}
