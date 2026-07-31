import { beforeEach, describe, expect, it } from "vitest";

import {
  defaultSettings,
  loadSettings,
  saveSettings,
  SETTINGS_KEY,
  validateSettings,
} from "./settingsService";

describe("settingsService", () => {
  beforeEach(() => localStorage.clear());

  it("inicia com estado seguro", () => {
    expect(loadSettings()).toMatchObject({
      interval: 6,
      clickThrough: false,
    });
  });

  it("migra configurações antigas, limita valores e preserva padrões aninhados", () => {
    localStorage.setItem(
      "putrefactory-timer.settings.v1",
      JSON.stringify({
        interval: 80,
        volume: -2,
        clickThrough: true,
        hotkeys: { toggle: "F2" },
      }),
    );
    expect(loadSettings()).toMatchObject({
      interval: 30,
      volume: 0,
      clickThrough: false,
      hotkeys: { ...defaultSettings.hotkeys, toggle: "F2" },
    });
  });

  it("descarta tipos inválidos", () => {
    expect(
      validateSettings({ interval: "rápido", audioFiles: { north: 12 } }),
    ).toMatchObject({
      interval: 6,
      audioFiles: defaultSettings.audioFiles,
    });
  });

  it("nunca persiste click-through ativo", () => {
    saveSettings({ ...defaultSettings, interval: 5.8, clickThrough: true });
    expect(
      JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}"),
    ).toMatchObject({
      interval: 5.8,
      clickThrough: false,
    });
  });
});
