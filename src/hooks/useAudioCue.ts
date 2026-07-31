import { useCallback, useState } from "react";

import { playCue } from "../services/audioService";
import { directions, type Settings } from "../types";

export function useAudioCue(settings: Settings) {
  const [audioMessage, setAudioMessage] = useState("");

  const play = useCallback(
    async (index: number) => {
      if (!settings.soundEnabled) return;

      const direction = directions[index];
      try {
        const result = await playCue(
          direction.id,
          direction.label,
          settings.audioFiles[direction.id],
          settings.volume,
        );
        setAudioMessage(result.warning ?? "");
      } catch (error) {
        setAudioMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível reproduzir o aviso sonoro.",
        );
      }
    },
    [settings.audioFiles, settings.soundEnabled, settings.volume],
  );

  return { play, audioMessage };
}
