import { describe, expect, it, vi } from "vitest";

import { defaultSettings } from "./settingsService";
import {
  registerHotkeys,
  validateHotkeys,
  type HotkeyApi,
} from "./hotkeyService";

const handlers = {
  toggle: vi.fn(),
  sync: vi.fn(),
  next: vi.fn(),
  previous: vi.fn(),
  clickThrough: vi.fn(),
};

describe("hotkeyService", () => {
  it("rejeita atalhos vazios e duplicados", () => {
    expect(() =>
      validateHotkeys({
        ...defaultSettings.hotkeys,
        next: defaultSettings.hotkeys.previous,
      }),
    ).toThrow(/duplicado/);
    expect(() =>
      validateHotkeys({ ...defaultSettings.hotkeys, next: " " }),
    ).toThrow(/vazio/);
  });

  it("remove todos os atalhos após falha parcial", async () => {
    const api: HotkeyApi = {
      unregisterAll: vi.fn().mockResolvedValue(undefined),
      register: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("ocupado")),
    };

    await expect(
      registerHotkeys(defaultSettings.hotkeys, handlers, api),
    ).rejects.toThrow(/Nenhum atalho foi mantido/);
    expect(api.unregisterAll).toHaveBeenCalledTimes(2);
  });
});
