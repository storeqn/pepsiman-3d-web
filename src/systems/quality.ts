import { Engine } from "@babylonjs/core/Engines/engine";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import type { Save } from "./save";

type Level = "low" | "medium" | "high";

/** Auto uses measured frame time with hysteresis; manual modes never self-adjust. */
export class QualityManager {
  mode: Save["quality"] = "auto";
  private level: Level = "medium";
  private seconds = 0;
  private frames = 0;
  private cooldown = 0;
  constructor(private engine: Engine, private shadows: ShadowGenerator) {}

  private setLevel(level: Level) {
    this.level = level;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const desired = level === "high" ? 1 : level === "medium" ? 1.35 : 1.9;
    this.engine.setHardwareScalingLevel(Math.max(desired, dpr / (level === "high" ? 1.8 : level === "medium" ? 1.4 : 1.1)));
    this.shadows.getShadowMap()?.resize(level === "high" ? 2048 : level === "medium" ? 1024 : 512);
    this.shadows.setDarkness(level === "low" ? 0.38 : 0.22);
  }

  apply(mode: Save["quality"]) {
    this.mode = mode;
    this.seconds = 0;
    this.frames = 0;
    this.cooldown = 10;
    this.setLevel(mode === "auto" ? (window.innerWidth < 800 ? "low" : "medium") : mode);
  }

  update(dt: number) {
    if (this.mode !== "auto" || dt <= 0) return;
    this.seconds += Math.min(dt, 0.1);
    this.frames++;
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.seconds < 5) return;
    const fps = this.frames / this.seconds;
    this.seconds = 0;
    this.frames = 0;
    if (this.cooldown > 0) return;
    if (fps < 38 && this.level !== "low") {
      this.setLevel(this.level === "high" ? "medium" : "low");
      this.cooldown = 12;
    } else if (fps > 57 && this.level !== "high") {
      this.setLevel(this.level === "low" ? "medium" : "high");
      this.cooldown = 18;
    }
  }
}
