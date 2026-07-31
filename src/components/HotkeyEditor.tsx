import type { HotkeyAction, Hotkeys } from "../types";

const labels: Record<HotkeyAction, string> = {
  toggle: "Iniciar / pausar",
  sync: "Sincronizar",
  next: "Avançar",
  previous: "Voltar",
  clickThrough: "Ignorar cliques",
  visibility: "Mostrar / ocultar",
};

export function HotkeyEditor({
  value,
  onChange,
}: {
  value: Hotkeys;
  onChange: (value: Hotkeys) => void;
}) {
  return (
    <fieldset>
      <legend>Atalhos globais</legend>
      {(Object.keys(labels) as HotkeyAction[]).map((action) => (
        <label className="setting-row" key={action}>
          <span>{labels[action]}</span>
          <input
            className="hotkey"
            value={value[action]}
            onChange={(event) =>
              onChange({ ...value, [action]: event.target.value.trim() })
            }
          />
        </label>
      ))}
    </fieldset>
  );
}
