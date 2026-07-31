import { describe, expect, it } from "vitest";

import { isValidGeometry } from "./useWindowGeometry";

const monitors = [
  { position: { x: 0, y: 0 }, size: { width: 1920, height: 1080 } },
];

describe("isValidGeometry", () => {
  it("aceita uma geometria visível e com tamanho mínimo", () => {
    expect(
      isValidGeometry({ x: 100, y: 100, width: 390, height: 500 }, monitors),
    ).toBe(true);
  });

  it("rejeita números inválidos, tamanho pequeno e janela fora das telas", () => {
    expect(
      isValidGeometry(
        { x: Number.NaN, y: 0, width: 390, height: 500 },
        monitors,
      ),
    ).toBe(false);
    expect(
      isValidGeometry({ x: 0, y: 0, width: 100, height: 100 }, monitors),
    ).toBe(false);
    expect(
      isValidGeometry(
        { x: 3_000, y: 2_000, width: 390, height: 500 },
        monitors,
      ),
    ).toBe(false);
  });
});
