import { Engine } from "@babylonjs/core/Engines/engine";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import type { Save } from "./save";
export class QualityManager {
  mode: Save["quality"] = "auto";
  private seconds = 0;
  private frames = 0;
  constructor(
    private engine: Engine,
    private shadows: ShadowGenerator,
  ) {}
  apply(mode: Save["quality"]) {
    this.mode = mode;
    const small = window.innerWidth < 800;
    const level = mode === "auto" ? (small ? "low" : "medium") : mode;
    this.engine.setHardwareScalingLevel(
      Math.max(
        level === "high" ? 1 : level === "medium" ? 1.25 : 1.8,
        window.devicePixelRatio / (level === "high" ? 1.6 : 1.2),
      ),
    );
    this.shadows
      .getShadowMap()
      ?.resize(level === "high" ? 2048 : level === "medium" ? 1024 : 512);
    this.shadows.setDarkness(level === "low" ? 0.35 : 0.2);
  }
  update(dt: number) {
    if (this.mode !== "auto") return;
    this.seconds += dt;
    this.frames++;
    if (this.seconds > 5) {
      const fps = this.frames / this.seconds;
      if (fps < 35)
        this.engine.setHardwareScalingLevel(
          Math.min(2.5, this.engine.getHardwareScalingLevel() + 0.2),
        );
      this.seconds = 0;
      this.frames = 0;
    }
  }
}
