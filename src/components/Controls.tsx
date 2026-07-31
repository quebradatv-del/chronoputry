interface Props {
  running: boolean;
  onToggle(): void;
  onSync(): void;
  onPrevious(): void;
  onNext(): void;
  onReset(): void;
  onAdjust(n: number): void;
  onSettings(): void;
}
export function Controls(p: Props) {
  return (
    <div className="controls">
      <button
        onClick={p.onToggle}
        aria-label={p.running ? "Pausar" : "Iniciar"}
      >
        {p.running ? "⏸ Pausar" : "▶ Iniciar"}
      </button>
      <button className="primary" onClick={p.onSync}>
        ◎ Sincronizar
      </button>
      <button onClick={p.onPrevious} aria-label="Voltar direção">
        ←
      </button>
      <button onClick={p.onNext} aria-label="Avançar direção">
        →
      </button>
      <button onClick={p.onReset} title="Reiniciar contador">
        ↻
      </button>
      <button onClick={() => p.onAdjust(-0.1)} title="Adiantar 0,1 segundo">
        −0,1
      </button>
      <button onClick={() => p.onAdjust(0.1)} title="Atrasar 0,1 segundo">
        +0,1
      </button>
      <button onClick={p.onSettings} aria-label="Abrir configurações">
        ⚙
      </button>
    </div>
  );
}
