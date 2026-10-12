export const STEP = 1 / 60;
export const LEVEL_LENGTH = 2400;
export type Status = "menu" | "playing" | "paused" | "lost" | "won";
export interface Input {
  axis: number;
  jump: boolean;
  slide: boolean;
  target?: number;
}
export interface Runner {
  x: number;
  y: number;
  z: number;
  vy: number;
  vx: number;
  slide: number;
  lives: number;
  invincible: number;
  coins: number;
  score: number;
  elapsed: number;
  speed: number;
}
export type ObstacleKind = "barrier" | "beam" | "car" | "coin";
export interface Obstacle {
  id: number;
  x: number;
  z: number;
  width: number;
  kind: ObstacleKind;
  hit: boolean;
}
export const initialRunner = (): Runner => ({
  x: 0,
  y: 0,
  z: 0,
  vy: 0,
  vx: 0,
  slide: 0,
  lives: 3,
  invincible: 0,
  coins: 0,
  score: 0,
  elapsed: 0,
  speed: 14,
});
/** Fast launch plus restrained acceleration; enough road remains visible at top speed. */
export const speedAt = (z: number, elapsed: number): number =>
  14 + 3 * (1 - Math.exp(-Math.max(0, elapsed) * 0.7)) + Math.min(4, Math.max(0, z) / 550);

export function stepRunner(p: Runner, input: Input, dt: number) {
  p.elapsed += dt;
  p.invincible = Math.max(0, p.invincible - dt);
  p.slide = Math.max(0, p.slide - dt);
  const desired =
    input.target === undefined
      ? input.axis * 7.5
      : Math.max(-7.5, Math.min(7.5, (input.target - p.x) * 10));
  p.vx += (desired - p.vx) * Math.min(1, dt * 14);
  p.x = Math.max(-4.1, Math.min(4.1, p.x + p.vx * dt));
  if (input.jump && p.y === 0 && p.slide === 0) p.vy = 8.2;
  if (input.slide && p.y === 0) p.slide = 0.8;
  p.y = Math.max(0, p.y + p.vy * dt);
  p.vy = p.y > 0 ? p.vy - 22 * dt : 0;
  p.speed = speedAt(p.z, p.elapsed);
  p.z = Math.min(LEVEL_LENGTH, p.z + p.speed * dt);
  p.score = Math.floor(p.z) * 2 + p.coins * 100;
}
export function overlaps(p: Runner, o: Obstacle, previousZ: number) {
  const halfDepth = o.kind === "car" ? 2.2 : 0.8;
  if (
    o.hit ||
    Math.abs(p.x - o.x) > o.width / 2 + 0.27 ||
    o.z < previousZ - halfDepth ||
    o.z > p.z + halfDepth
  )
    return false;
  if (o.kind === "coin") return p.y < 1.8;
  if (o.kind === "barrier") return p.y < 0.95;
  if (o.kind === "beam") return p.y + (p.slide > 0 ? 0.72 : 1.95) > 1.08;
  return p.y < 1.5;
}
// Every encounter leaves at least 3.8 m of road clear, with > 1.5 s lead time.
export function encounter(index: number): Obstacle[] {
  // 38-metre gaps give at least 1.8 s between encounters even at maximum speed.
  const z = 45 + index * 38;
  const x = [-2.8, 0, 2.8, 0][index % 4];
  const kind: ObstacleKind = (
    ["barrier", "car", "beam", "barrier", "beam"] as const
  )[index % 5];
  return [
    { id: index * 10, x, z, width: kind === "car" ? 2 : 2.4, kind, hit: false },
    ...[0, 1, 2].map((n) => ({
      id: index * 10 + n + 1,
      x: x > 0 ? -2.8 : 2.8,
      z: z + 5 + n * 3,
      width: 0.8,
      kind: "coin" as const,
      hit: false,
    })),
  ];
}
export class FixedClock {
  private accumulator = 0;
  advance(seconds: number, step: () => void) {
    this.accumulator += Math.min(seconds, 0.1);
    while (this.accumulator >= STEP) {
      step();
      this.accumulator -= STEP;
    }
  }
  reset() {
    this.accumulator = 0;
  }
}
