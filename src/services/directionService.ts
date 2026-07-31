import { directions } from "../types";

export function moveDirection(currentIndex: number, delta: number) {
  return (
    (((currentIndex + delta) % directions.length) + directions.length) %
    directions.length
  );
}

export function upcomingImpactIndex(lastImpactIndex: number) {
  return moveDirection(lastImpactIndex, 1);
}

export function followingImpactIndex(lastImpactIndex: number) {
  return moveDirection(lastImpactIndex, 2);
}

export function lastImpactIndexForUpcoming(upcomingIndex: number) {
  return moveDirection(upcomingIndex, -1);
}
