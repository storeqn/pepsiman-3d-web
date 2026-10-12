import { describe, it, expect } from "vitest";
import {
  encounter,
  FixedClock,
  initialRunner,
  LEVEL_LENGTH,
  overlaps,
  STEP,
  stepRunner,
} from "../src/core/simulation";
import { decode, SaveSystem } from "../src/systems/save";
const neutral = { axis: 0, jump: false, slide: false };
describe("fixed timestep movement", () => {
  it("produces equal travel at different render rates", () => {
    const simulate = (fps: number) => {
      const p = initialRunner(),
        clock = new FixedClock();
      for (let i = 0; i < fps * 10; i++)
        clock.advance(1 / fps, () => stepRunner(p, neutral, STEP));
      return p.z;
    };
    expect(simulate(30)).toBeCloseTo(simulate(60), 8);
    expect(simulate(60)).toBeCloseTo(simulate(120), 8);
  });
  it("clamps lateral travel and supports positions between lanes", () => {
    const p = initialRunner();
    for (let i = 0; i < 180; i++) stepRunner(p, { ...neutral, axis: 1 }, STEP);
    expect(p.x).toBe(4.1);
    for (let i = 0; i < 120; i++)
      stepRunner(p, { ...neutral, target: 1.35 }, STEP);
    expect(p.x).toBeCloseTo(1.35, 2);
  });
  it("jumps, lands and cannot double jump", () => {
    const p = initialRunner();
    stepRunner(p, { ...neutral, jump: true }, STEP);
    const first = p.vy;
    stepRunner(p, { ...neutral, jump: true }, STEP);
    expect(p.vy).toBeLessThan(first);
    for (let i = 0; i < 100; i++) stepRunner(p, neutral, STEP);
    expect(p.y).toBe(0);
    expect(p.vy).toBe(0);
  });
  it("expires slide and blocks jumping while sliding", () => {
    const p = initialRunner();
    stepRunner(p, { ...neutral, slide: true }, STEP);
    stepRunner(p, { ...neutral, jump: true }, STEP);
    expect(p.y).toBe(0);
    for (let i = 0; i < 60; i++) stepRunner(p, neutral, STEP);
    expect(p.slide).toBe(0);
  });
  it("caps background catch-up work", () => {
    let ticks = 0;
    new FixedClock().advance(120, () => ticks++);
    expect(ticks).toBeLessThanOrEqual(6);
  });
});
describe("fair collision and level completion", () => {
  it("sweeps forward movement without tunneling", () => {
    const p = { ...initialRunner(), z: 46 };
    expect(overlaps(p, encounter(0)[0], 43)).toBe(false);
    p.x = -2.8;
    expect(overlaps(p, encounter(0)[0], 43)).toBe(true);
    p.y = 1.1;
    expect(overlaps(p, encounter(0)[0], 43)).toBe(false);
  });
  it("slides below overhead obstacles but not vehicles", () => {
    const p = { ...initialRunner(), z: 99, x: 2.8, slide: 0.5 };
    expect(overlaps(p, encounter(2)[0], 98)).toBe(false);
    p.slide = 0;
    expect(overlaps(p, encounter(2)[0], 98)).toBe(true);
  });
  it("has a reachable safe route through every encounter to the finish", () => {
    const p = initialRunner();
    const obstacles = Array.from({ length: 88 }, (_, i) => encounter(i)[0]);
    let hits = 0;
    for (let i = 0; i < 15000 && p.z < LEVEL_LENGTH; i++) {
      const next = obstacles.find((o) => o.z >= p.z - 1);
      const prev = p.z;
      stepRunner(
        p,
        { ...neutral, target: next && next.x > 0 ? -4.1 : 4.1 },
        STEP,
      );
      for (const o of obstacles) if (overlaps(p, o, prev)) hits++;
    }
    expect(hits).toBe(0);
    expect(p.z).toBe(LEVEL_LENGTH);
    expect(p.elapsed).toBeGreaterThan(180);
    expect(p.elapsed).toBeLessThan(300);
  });
});
describe("versioned save validation", () => {
  it("recovers corrupt, missing and outdated saves", () => {
    for (const s of [null, "{broken", '{"version":9}', "null"])
      expect(decode(s).best).toBe(0);
  });
  it("sanitizes persisted fields", () => {
    const s = decode(
      '{"version":1,"best":-2,"music":3,"effects":-1,"quality":"ultra","completed":"yes"}',
    );
    expect(s).toMatchObject({
      best: 0,
      music: 1,
      effects: 0,
      quality: "auto",
      completed: false,
    });
  });
  it("round-trips valid results", () => {
    const raw = { ...decode(null), best: 9800, completed: true };
    expect(decode(JSON.stringify(raw))).toEqual(raw);
  });
  it("remains playable when storage is unavailable", () => {
    const save = new SaveSystem();
    expect(save.data.best).toBe(0);
    expect(save.persist()).toBe(false);
  });
});
