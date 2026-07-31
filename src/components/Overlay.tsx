import { getCurrentWindow } from "@tauri-apps/api/window";
import type { MouseEvent, ReactNode } from "react";

export function Overlay({
  children,
  locked,
  compact,
}: {
  children: ReactNode;
  locked: boolean;
  compact: boolean;
}) {
  function startDragging(event: MouseEvent<HTMLElement>) {
    if (locked || event.button !== 0) return;
    event.preventDefault();
    void getCurrentWindow().startDragging();
  }

  return (
    <main className={compact ? "overlay compact" : "overlay"}>
      <header
        className="titlebar"
        onMouseDown={startDragging}
        title={locked ? "Posição bloqueada" : "Arraste para mover a janela"}
      >
        <span>PUTREFACTORY TIMER</span>
        <i className="status-dot" aria-hidden="true" />
      </header>
      {children}
    </main>
  );
}
