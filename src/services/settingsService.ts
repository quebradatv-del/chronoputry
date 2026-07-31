import { directions, type Settings } from "../types";

export const SETTINGS_KEY = "putrefactory-timer.settings.v3";
const LEGACY_SETTINGS_KEYS = [
  "putrefactory-timer.settings.v2",
  "putrefactory-timer.settings.v1",
] as const;

export const defaultSettings: Settings = {
  interval: 8,
  volume: 0.6,
  opacity: 0.92,
  scale: 1,
  audioTiming: 2,
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
  const interval = finiteNumber(
    input.interval,
    defaultSettings.interval,
    1,
    30,
  );

  return {
    ...defaultSettings,
    interval,
    volume: finiteNumber(input.volume, defaultSettings.volume, 0, 1),
    opacity: finiteNumber(input.opacity, defaultSettings.opacity, 0.3, 1),
    scale: finiteNumber(input.scale, defaultSettings.scale, 0.75, 1.75),
    audioTiming: finiteNumber(
      input.audioTiming,
      defaultSettings.audioTiming,
      0,
      interval,
    ),
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

function migrateLegacySettings(settings: Settings): Settings {
  return {
    ...settings,
    interval: settings.interval === 6 ? 8 : settings.interval,
    volume: settings.volume === 0.8 ? 0.6 : settings.volume,
    audioTiming: settings.audioTiming === 0 ? 2 : settings.audioTiming,
  };
}

export function loadSettings(): Settings {
  try {
    const current = localStorage.getItem(SETTINGS_KEY);
    if (current) return validateSettings(JSON.parse(current));

    for (const legacyKey of LEGACY_SETTINGS_KEYS) {
      const stored = localStorage.getItem(legacyKey);
      if (stored) {
        const parsed = validateSettings(JSON.parse(stored));
        return migrateLegacySettings(parsed);
      }
    }

    return { ...defaultSettings };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({ ...settings, clickThrough: false }),
  );
  for (const legacyKey of LEGACY_SETTINGS_KEYS) {
    localStorage.removeItem(legacyKey);
  }
}
