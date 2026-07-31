import type { FrontendHotkeyAction, Hotkeys } from "../types";

export interface HotkeyApi {
  register: (
    shortcut: string,
    handler: (event: { state: string }) => void,
  ) => Promise<void>;
  unregisterAll: () => Promise<void>;
}

export function validateHotkeys(hotkeys: Hotkeys) {
  const entries = Object.entries(hotkeys);
  const empty = entries.find(([, shortcut]) => !shortcut.trim());
  if (empty) {
    throw new Error(`O atalho de ${empty[0]} não pode ficar vazio.`);
  }

  const normalized = entries.map(([, shortcut]) =>
    shortcut.trim().toLowerCase(),
  );
  const duplicateIndex = normalized.findIndex(
    (shortcut, index) => normalized.indexOf(shortcut) !== index,
  );
  if (duplicateIndex >= 0) {
    throw new Error(`O atalho ${entries[duplicateIndex][1]} está duplicado.`);
  }
}

export async function registerHotkeys(
  hotkeys: Hotkeys,
  handlers: Record<FrontendHotkeyAction, () => void>,
  injectedApi?: HotkeyApi,
) {
  const api =
    injectedApi ??
    ((await import("@tauri-apps/plugin-global-shortcut")) as unknown as HotkeyApi);

  await api.unregisterAll();
  validateHotkeys(hotkeys);

  const actions = Object.keys(handlers) as FrontendHotkeyAction[];
  let currentShortcut = "";
  try {
    for (const action of actions) {
      currentShortcut = hotkeys[action].trim();
      await api.register(currentShortcut, (event) => {
        if (event.state === "Pressed") handlers[action]();
      });
    }
  } catch {
    await api.unregisterAll();
    throw new Error(
      `Não foi possível registrar ${currentShortcut}. A tecla pode estar em uso por outro aplicativo. Nenhum atalho foi mantido.`,
    );
  }

  return api.unregisterAll;
}
