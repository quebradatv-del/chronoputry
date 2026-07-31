import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect, useRef, useState } from "react";

import { Controls } from "./components/Controls";
import { Countdown } from "./components/Countdown";
import { DirectionDisplay } from "./components/DirectionDisplay";
import { Overlay } from "./components/Overlay";
import { SettingsPanel } from "./components/SettingsPanel";
import { useAccurateTimer } from "./hooks/useAccurateTimer";
import { useAudioCue } from "./hooks/useAudioCue";
import { useSettings } from "./hooks/useSettings";
import { useWindowGeometry } from "./hooks/useWindowGeometry";
import {
  followingImpactIndex,
  lastImpactIndexForUpcoming,
  moveDirection,
  upcomingImpactIndex,
} from "./services/directionService";
import { registerHotkeys } from "./services/hotkeyService";
import { shouldPlayPreCue } from "./services/timerState";
import { directions, type FrontendHotkeyAction } from "./types";

type FrontendHandlers = Record<FrontendHotkeyAction, () => void>;

export default function App() {
  const { settings, setSettings } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [syncFlash, setSyncFlash] = useState(false);
  const handlersRef = useRef<FrontendHandlers | null>(null);
  const hotkeyQueueRef = useRef<Promise<void>>(Promise.resolve());
  const { play, audioMessage } = useAudioCue(settings);

  const handleElapsed = useCallback(
    (_elapsedCycles: number, impactDirectionIndex: number) => {
      // No instante da batida, anuncia a direção que acabou de atingir o totem.
      if (settings.audioTiming === 0) void play(impactDirectionIndex);
    },
    [play, settings.audioTiming],
  );

  const {
    cycle,
    start,
    pause,
    reset,
    adjust,
    changeDirection,
    markAudioPlayed,
  } = useAccurateTimer(settings.interval, handleElapsed);

  const showTemporaryMessage = useCallback((text: string) => {
    setMessage(text);
    globalThis.setTimeout(
      () => setMessage((current) => (current === text ? "" : current)),
      1_800,
    );
  }, []);

  const handleNativeError = useCallback((text: string) => setMessage(text), []);
  useWindowGeometry(handleNativeError);

  const navigate = useCallback(
    (delta: number) => {
      changeDirection((currentIndex) => moveDirection(currentIndex, delta));
    },
    [changeDirection],
  );

  const synchronize = useCallback(() => {
    reset();
    setSyncFlash(true);
    showTemporaryMessage("Sincronizado");
    globalThis.setTimeout(() => setSyncFlash(false), 450);
  }, [reset, showTemporaryMessage]);

  const toggleTimer = useCallback(() => {
    if (cycle.status === "running") pause();
    else start();
  }, [cycle.status, pause, start]);

  const toggleClickThrough = useCallback(() => {
    setSettings((current) => {
      const clickThrough = !current.clickThrough;
      showTemporaryMessage(
        clickThrough
          ? "Ignorar cliques ativado — F10 para sair"
          : "Cliques reativados",
      );
      return { ...current, clickThrough };
    });
  }, [setSettings, showTemporaryMessage]);

  handlersRef.current = {
    toggle: toggleTimer,
    sync: synchronize,
    next: () => navigate(1),
    previous: () => navigate(-1),
    clickThrough: toggleClickThrough,
  };

  useEffect(() => {
    if (shouldPlayPreCue(cycle, settings.audioTiming)) {
      void play(upcomingImpactIndex(cycle.directionIndex));
      markAudioPlayed();
    }
  }, [cycle, markAudioPlayed, play, settings.audioTiming]);

  useEffect(() => {
    const appWindow = getCurrentWindow();
    appWindow.setAlwaysOnTop(settings.alwaysOnTop).catch((error) => {
      console.error("Falha ao alterar sempre no topo.", error);
      setMessage("Não foi possível alterar a opção Sempre no topo.");
    });
  }, [settings.alwaysOnTop]);

  useEffect(() => {
    const appWindow = getCurrentWindow();
    appWindow.setIgnoreCursorEvents(settings.clickThrough).catch((error) => {
      console.error("Falha ao alterar passagem de cliques.", error);
      setSettings((current) => ({ ...current, clickThrough: false }));
      setMessage("Não foi possível ativar Ignorar cliques.");
    });
  }, [settings.clickThrough, setSettings]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--opacity",
      String(settings.opacity),
    );
    document.documentElement.style.setProperty(
      "--scale",
      String(settings.scale),
    );
  }, [settings.opacity, settings.scale]);

  useEffect(() => {
    let disposed = false;
    let unregister: (() => Promise<void>) | null = null;
    const handlers = Object.fromEntries(
      (["toggle", "sync", "next", "previous", "clickThrough"] as const).map(
        (action) => [action, () => handlersRef.current?.[action]()],
      ),
    ) as FrontendHandlers;

    async function setupHotkeys() {
      try {
        unregister = await registerHotkeys(settings.hotkeys, handlers);
        if (disposed) {
          await unregister();
          unregister = null;
          return;
        }
        await invoke("set_visibility_shortcut", {
          shortcut: settings.hotkeys.visibility,
        });
        if (!disposed) setMessage("");
      } catch (error) {
        await invoke("set_visibility_shortcut", {
          shortcut: settings.hotkeys.visibility,
        }).catch((visibilityError) =>
          console.error(
            "Falha ao restaurar o atalho nativo de visibilidade.",
            visibilityError,
          ),
        );
        if (!disposed) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Falha ao registrar atalhos globais.",
          );
        }
      }
    }

    hotkeyQueueRef.current = hotkeyQueueRef.current
      .catch((error) =>
        console.error("Falha na fila de atalhos globais.", error),
      )
      .then(setupHotkeys);
    return () => {
      disposed = true;
      hotkeyQueueRef.current = hotkeyQueueRef.current
        .catch((error) =>
          console.error("Falha na fila de atalhos globais.", error),
        )
        .then(async () => {
          if (unregister) await unregister();
        })
        .catch((error) =>
          console.error("Falha ao remover atalhos globais.", error),
        );
    };
  }, [settings.hotkeys]);

  const targetDirectionIndex = upcomingImpactIndex(cycle.directionIndex);
  const targetDirection = directions[targetDirectionIndex];
  const followingDirection = directions[followingImpactIndex(cycle.directionIndex)];

  return (
    <Overlay locked={settings.lockPosition} compact={settings.compact}>
      <div className={`${cycle.status} content ${syncFlash ? "synced" : ""}`}>
        <DirectionDisplay
          index={targetDirectionIndex}
          showLabel={settings.showDirection}
        />
        {settings.showCountdown && <Countdown remaining={cycle.remaining} />}
        {settings.showNext && (
          <div className="next">
            Depois: <strong>{followingDirection.label}</strong>{" "}
            {followingDirection.arrow}
          </div>
        )}
        <div className="state" aria-live="polite">
          {cycle.status === "paused" ? "PAUSADO" : "EM EXECUÇÃO"}
        </div>
        <Controls
          running={cycle.status === "running"}
          onToggle={toggleTimer}
          onSync={synchronize}
          onPrevious={() => navigate(-1)}
          onNext={() => navigate(1)}
          onReset={() => reset()}
          onAdjust={adjust}
          onSettings={() => setSettingsOpen(true)}
        />
        <select
          className="manual"
          aria-label="Próximo impacto"
          value={targetDirection.id}
          onChange={(event) => {
            const selectedIndex = directions.findIndex(
              ({ id }) => id === event.target.value,
            );
            reset(lastImpactIndexForUpcoming(selectedIndex));
          }}
        >
          {directions.map((direction) => (
            <option key={direction.id} value={direction.id}>
              {direction.label}
            </option>
          ))}
        </select>
        {(message || audioMessage) && (
          <div className="message" role="status">
            {audioMessage || message}
          </div>
        )}
      </div>
      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          onError={setMessage}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </Overlay>
  );
}
