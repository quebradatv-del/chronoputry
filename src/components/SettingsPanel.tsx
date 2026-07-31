import type { Dispatch, SetStateAction } from "react";

import { directions, type Settings } from "../types";
import { AudioSelector } from "./AudioSelector";
import { HotkeyEditor } from "./HotkeyEditor";

interface SettingsPanelProps {
  settings: Settings;
  onChange: Dispatch<SetStateAction<Settings>>;
  onError: (message: string) => void;
  onClose: () => void;
}

export function SettingsPanel({
  settings,
  onChange,
  onError,
  onClose,
}: SettingsPanelProps) {
  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    onChange((current) => ({ ...current, [key]: value }));
  }

  function setInterval(value: number) {
    const interval = Math.min(
      30,
      Math.max(1, Number.isFinite(value) ? value : 8),
    );
    onChange((current) => ({
      ...current,
      interval,
      audioTiming: Math.min(current.audioTiming, interval),
    }));
  }

  function setAudioTiming(value: number) {
    set(
      "audioTiming",
      Math.min(
        settings.interval,
        Math.max(0, Number.isFinite(value) ? value : 0),
      ),
    );
  }

  function checkbox(key: keyof Settings, label: string) {
    return (
      <label className="check">
        <input
          type="checkbox"
          checked={settings[key] as boolean}
          onChange={(event) => set(key, event.target.checked as never)}
        />
        {label}
      </label>
    );
  }

  return (
    <div className="settings">
      <header>
        <h2>Configurações</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar configurações"
        >
          ×
        </button>
      </header>
      <div className="settings-scroll">
        <label>
          Intervalo (1–30 s)
          <input
            type="number"
            min="1"
            max="30"
            step="0.1"
            value={settings.interval}
            onChange={(event) => setInterval(event.target.valueAsNumber)}
          />
        </label>
        <label>
          Volume ({Math.round(settings.volume * 100)}%)
          <input
            type="range"
            min="0"
            max="1"
            step=".05"
            value={settings.volume}
            onChange={(event) => set("volume", event.target.valueAsNumber)}
          />
        </label>
        <label>
          Transparência ({Math.round(settings.opacity * 100)}%)
          <input
            type="range"
            min=".3"
            max="1"
            step=".05"
            value={settings.opacity}
            onChange={(event) => set("opacity", event.target.valueAsNumber)}
          />
        </label>
        <label>
          Escala ({Math.round(settings.scale * 100)}%)
          <input
            type="range"
            min=".75"
            max="1.75"
            step=".05"
            value={settings.scale}
            onChange={(event) => set("scale", event.target.valueAsNumber)}
          />
        </label>
        <label>
          Aviso antes da troca (0–{settings.interval} s)
          <input
            type="number"
            min="0"
            max={settings.interval}
            step="0.1"
            value={settings.audioTiming}
            onChange={(event) => setAudioTiming(event.target.valueAsNumber)}
          />
          <span className="hint">
            Use 0 para tocar exatamente na troca. Aceita valores como 1,5 ou 2,7
            segundos.
          </span>
        </label>
        <fieldset>
          <legend>Áudios personalizados</legend>
          {directions.map((direction) => (
            <AudioSelector
              key={direction.id}
              direction={direction.id}
              label={direction.label}
              value={settings.audioFiles[direction.id]}
              onChange={(fileName) =>
                set("audioFiles", {
                  ...settings.audioFiles,
                  [direction.id]: fileName,
                })
              }
              onError={onError}
            />
          ))}
        </fieldset>
        <div className="checks">
          {checkbox("soundEnabled", "Ativar som")}
          {checkbox("showDirection", "Mostrar nome")}
          {checkbox("showCountdown", "Mostrar contador")}
          {checkbox("showNext", "Mostrar próxima")}
          {checkbox("compact", "Modo compacto")}
          {checkbox("lockPosition", "Bloquear posição")}
          {checkbox("alwaysOnTop", "Sempre no topo")}
          {checkbox("clickThrough", "Ignorar cliques")}
        </div>
        <HotkeyEditor
          value={settings.hotkeys}
          onChange={(value) => set("hotkeys", value)}
        />
        <p className="hint">
          Arraste a barra superior para mover a janela. No modo compacto, a
          engrenagem continua visível. Com “ignorar cliques”, use F10 para
          recuperar a interação. Use F11 para ocultar ou reabrir o overlay.
        </p>
      </div>
    </div>
  );
}
