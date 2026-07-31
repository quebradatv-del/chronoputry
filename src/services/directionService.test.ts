import { describe, expect, it } from "vitest";

import {
  followingImpactIndex,
  lastImpactIndexForUpcoming,
  upcomingImpactIndex,
} from "./directionService";

describe("directionService", () => {
  it("mostra e anuncia a direção do próximo impacto", () => {
    const lastImpactNorth = 0;

    expect(upcomingImpactIndex(lastImpactNorth)).toBe(1);
    expect(followingImpactIndex(lastImpactNorth)).toBe(2);
  });

  it("converte a direção escolhida para o último impacto interno", () => {
    const upcomingNorth = 0;
    const lastImpact = lastImpactIndexForUpcoming(upcomingNorth);

    expect(lastImpact).toBe(3);
    expect(upcomingImpactIndex(lastImpact)).toBe(upcomingNorth);
  });
});
