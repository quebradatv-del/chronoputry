import { invoke } from "@tauri-apps/api/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { playCue } from "./audioService";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

describe("audioService", () => {
  const speak = vi.fn();

  beforeEach(() => {
    vi.mocked(invoke).mockReset();
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: { cancel: vi.fn(), speak },
    });
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      class {
        lang = "";
        volume = 1;
        constructor(public text: string) {}
      },
    );
  });

  it("usa voz do sistema e retorna aviso quando o arquivo personalizado falha", async () => {
    vi.mocked(invoke).mockRejectedValue(new Error("arquivo ausente"));
    const result = await playCue("north", "Norte", "north.wav", 0.8);
    expect(result.warning).toMatch(/Usando voz do sistema/);
    expect(speak).toHaveBeenCalledTimes(1);
  });

  it("fala uma única vez quando não há arquivo personalizado", async () => {
    await playCue("north", "Norte", "", 0.8);
    expect(speak).toHaveBeenCalledTimes(1);
    expect(invoke).not.toHaveBeenCalled();
  });
});
