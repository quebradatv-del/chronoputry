import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

import type { DirectionId } from "../types";

interface AudioSelectorProps {
  direction: DirectionId;
  label: string;
  value: string;
  onChange: (fileName: string) => void;
  onError: (message: string) => void;
}

export function AudioSelector({
  direction,
  label,
  value,
  onChange,
  onError,
}: AudioSelectorProps) {
  async function chooseFile() {
    try {
      const path = await open({
        multiple: false,
        filters: [{ name: "Áudio", extensions: ["wav", "mp3", "ogg"] }],
      });
      if (typeof path !== "string") return;

      const fileName = await invoke<string>("import_audio", {
        direction,
        sourcePath: path,
      });
      onChange(fileName);
      onError("");
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : `Não foi possível importar o áudio de ${label}.`,
      );
    }
  }

  async function removeFile() {
    try {
      await invoke("remove_audio", { direction });
      onChange("");
      onError("");
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : `Não foi possível remover o áudio de ${label}.`,
      );
    }
  }

  return (
    <div className="audio-row">
      <span>{label}</span>
      <button type="button" onClick={chooseFile}>
        Selecionar
      </button>
      <span className="file" title={value}>
        {value || "Voz do Windows"}
      </span>
      {value && (
        <button
          type="button"
          onClick={removeFile}
          aria-label={`Remover áudio de ${label}`}
        >
          ×
        </button>
      )}
    </div>
  );
}
