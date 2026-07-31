import { invoke } from "@tauri-apps/api/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { playCue } from "./audioService";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

describe("audioService", () => {
  const speak = vi.fn();

  beforeEach(() => {
    speak.mockReset();
    vi.mocked(invoke).mockReset();
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: { cancel: vi.fn(), getVoices: () => [], speak },
    });
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      class {
        lang = "";
        pitch = 1;
        rate = 1;
        voice: SpeechSynthesisVoice | null = null;
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

  it("fala um aviso curto quando não há arquivo personalizado", async () => {
    await playCue("left", "Esquerda", "", 0.6);
    const utterance = speak.mock.calls[0]?.[0] as SpeechSynthesisUtterance;

    expect(speak).toHaveBeenCalledTimes(1);
    expect(utterance.text).toBe("Cuidado, esquerda");
    expect(utterance.rate).toBeCloseTo(1.08);
    expect(invoke).not.toHaveBeenCalled();
  });
});
