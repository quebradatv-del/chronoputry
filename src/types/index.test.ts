import { describe, expect, it } from "vitest";

import { moveDirection } from "../services/directionService";
import { directions } from ".";

describe("navegação das direções", () => {
  it("mantém a ordem especificada", () => {
    expect(directions.map(({ label }) => label)).toEqual([
      "Norte",
      "Direita",
      "Sul",
      "Esquerda",
    ]);
  });

  it("avança por um ciclo completo e retorna ao Norte", () => {
    expect([1, 2, 3, 4].reduce((index) => moveDirection(index, 1), 0)).toBe(0);
  });

  it("volta por um ciclo completo e retorna ao Norte", () => {
    expect([1, 2, 3, 4].reduce((index) => moveDirection(index, -1), 0)).toBe(0);
    expect(moveDirection(0, -1)).toBe(3);
  });
});
