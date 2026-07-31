import { useEffect } from "react";
import {
  availableMonitors,
  getCurrentWindow,
  PhysicalPosition,
  PhysicalSize,
} from "@tauri-apps/api/window";

import type { WindowGeometry } from "../types";

const GEOMETRY_KEY = "putrefactory-timer.window.v2";
const MIN_WIDTH = 280;
const MIN_HEIGHT = 250;

export function isValidGeometry(
  value: unknown,
  monitors: Array<{
    position: { x: number; y: number };
    size: { width: number; height: number };
  }>,
): value is WindowGeometry {
  if (!value || typeof value !== "object") return false;
  const geometry = value as WindowGeometry;
  if (
    ![geometry.x, geometry.y, geometry.width, geometry.height].every(
      Number.isFinite,
    )
  ) {
    return false;
  }
  if (geometry.width < MIN_WIDTH || geometry.height < MIN_HEIGHT) return false;

  return monitors.some((monitor) => {
    const monitorRight = monitor.position.x + monitor.size.width;
    const monitorBottom = monitor.position.y + monitor.size.height;
    const windowRight = geometry.x + geometry.width;
    const windowBottom = geometry.y + geometry.height;
    return (
      geometry.x < monitorRight &&
      windowRight > monitor.position.x &&
      geometry.y < monitorBottom &&
      windowBottom > monitor.position.y
    );
  });
}

export function useWindowGeometry(onError: (message: string) => void) {
  useEffect(() => {
    const appWindow = getCurrentWindow();
    let cleanupMove = () => undefined;
    let cleanupResize = () => undefined;
    let saveTimeout: number | undefined;

    async function restore() {
      try {
        const monitors = await availableMonitors();
        const stored = localStorage.getItem(GEOMETRY_KEY);
        const geometry = stored ? JSON.parse(stored) : null;
        if (!isValidGeometry(geometry, monitors)) {
          await appWindow.center();
          return;
        }
        await appWindow.setSize(
          new PhysicalSize(geometry.width, geometry.height),
        );
        await appWindow.setPosition(
          new PhysicalPosition(geometry.x, geometry.y),
        );
      } catch (error) {
        console.error("Falha ao restaurar a geometria da janela.", error);
        onError(
          "Não foi possível restaurar a posição da janela. Usando a posição padrão.",
        );
        await appWindow
          .center()
          .catch((centerError) =>
            console.error("Falha ao centralizar a janela.", centerError),
          );
      }
    }

    function scheduleSave() {
      globalThis.clearTimeout(saveTimeout);
      saveTimeout = globalThis.setTimeout(async () => {
        try {
          const [position, size] = await Promise.all([
            appWindow.outerPosition(),
            appWindow.outerSize(),
          ]);
          localStorage.setItem(
            GEOMETRY_KEY,
            JSON.stringify({
              x: position.x,
              y: position.y,
              width: size.width,
              height: size.height,
            }),
          );
        } catch (error) {
          console.error("Falha ao salvar a geometria da janela.", error);
        }
      }, 350);
    }

    void restore();
    Promise.all([
      appWindow.onMoved(scheduleSave),
      appWindow.onResized(scheduleSave),
    ])
      .then(([unlistenMove, unlistenResize]) => {
        cleanupMove = unlistenMove;
        cleanupResize = unlistenResize;
      })
      .catch((error) => {
        console.error("Falha ao observar posição/tamanho da janela.", error);
        onError("Não foi possível monitorar a posição e o tamanho da janela.");
      });

    return () => {
      cleanupMove();
      cleanupResize();
      globalThis.clearTimeout(saveTimeout);
    };
  }, [onError]);
}
