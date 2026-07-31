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

  it("inicia com ciclo de oito segundos e aviso dois segundos antes", () => {
    expect(loadSettings()).toMatchObject({
      interval: 8,
      audioTiming: 2,
      clickThrough: false,
    });
  });

  it("aceita aviso decimal e limita o valor ao intervalo", () => {
    expect(validateSettings({ interval: 8, audioTiming: 2.7 })).toMatchObject({
      interval: 8,
      audioTiming: 2.7,
    });
    expect(validateSettings({ interval: 3, audioTiming: 9 })).toMatchObject({
      interval: 3,
      audioTiming: 3,
    });
    expect(validateSettings({ interval: 8, audioTiming: -1 })).toMatchObject({
      audioTiming: 0,
    });
  });

  it("migra o padrão anterior para o novo ritmo e áudio", () => {
    localStorage.setItem(
      "putrefactory-timer.settings.v2",
      JSON.stringify({
        ...defaultSettings,
        interval: 6,
        volume: 0.8,
        audioTiming: 0,
      }),
    );

    expect(loadSettings()).toMatchObject({
      interval: 8,
      volume: 0.6,
      audioTiming: 2,
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
      interval: 8,
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
