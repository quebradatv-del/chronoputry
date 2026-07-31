import { directions } from "../types";

export function moveDirection(currentIndex: number, delta: number) {
  return (
    (((currentIndex + delta) % directions.length) + directions.length) %
    directions.length
  );
}
