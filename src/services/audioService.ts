import { invoke } from "@tauri-apps/api/core";

import type { DirectionId } from "../types";

let currentAudio: HTMLAudioElement | null = null;
let currentAudioUrl: string | null = null;

export interface CueResult {
  warning?: string;
}

function mimeType(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension === "mp3" ? "audio/mpeg" : `audio/${extension ?? "wav"}`;
}

export async function playCustomAudio(
  direction: DirectionId,
  fileName: string,
  volume: number,
) {
  const bytes = await invoke<number[]>("read_audio", { direction, fileName });
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(bytes)], { type: mimeType(fileName) }),
  );
  const audio = new Audio(url);
  currentAudio = audio;
  currentAudioUrl = url;
  audio.volume = volume;
  audio.addEventListener("ended", () => URL.revokeObjectURL(url), {
    once: true,
  });
  audio.addEventListener("error", () => URL.revokeObjectURL(url), {
    once: true,
  });
  await audio.play();
}

export function speakDirection(label: string, volume: number) {
  if (!("speechSynthesis" in window)) {
    throw new Error("A síntese de voz do sistema não está disponível.");
  }

  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(label);
  utterance.lang = "pt-BR";
  utterance.volume = volume;
  speechSynthesis.speak(utterance);
}

export async function playCue(
  direction: DirectionId,
  label: string,
  fileName: string,
  volume: number,
): Promise<CueResult> {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }

  if (!fileName) {
    speakDirection(label, volume);
    return {};
  }

  try {
    await playCustomAudio(direction, fileName, volume);
    return {};
  } catch (error) {
    console.warn(`Falha no áudio personalizado de ${label}.`, error);
    speakDirection(label, volume);
    return {
      warning: `Falha ao reproduzir o áudio personalizado de ${label}. Usando voz do sistema.`,
    };
  }
}
