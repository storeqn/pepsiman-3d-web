import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Runner } from "../core/simulation";

/** Damped third-person tracking; keep the playable road visible on narrow screens. */
export class CameraController {
  camera: FreeCamera;
  private focus = new Vector3(0, 1.8, 14);
  constructor(scene: Scene) {
    this.camera = new FreeCamera("chase", new Vector3(0, 4.5, -9), scene);
    this.camera.minZ = 0.15;
    this.camera.maxZ = 260;
    this.camera.fov = 0.91;
    this.camera.setTarget(this.focus);
  }
  update(p: Runner, dt: number) {
    const portrait = window.innerHeight > window.innerWidth;
    const follow = 1 - Math.exp(-Math.min(dt, 0.1) * 6.5);
    const aimFollow = 1 - Math.exp(-Math.min(dt, 0.1) * 9);
    const desired = new Vector3(
      p.x * 0.5,
      (portrait ? 5.5 : 4.65) + Math.min(0.55, p.y * 0.16),
      p.z - (portrait ? 11.2 : 9.2),
    );
    Vector3.LerpToRef(this.camera.position, desired, follow, this.camera.position);
    const target = new Vector3(p.x * 0.3, 1.65 + p.y * 0.16, p.z + (portrait ? 16 : 19));
    Vector3.LerpToRef(this.focus, target, aimFollow, this.focus);
    this.camera.setTarget(this.focus);
    const boost = Math.min(0.075, Math.max(0, (p.speed - 14) * 0.011));
    const wantedFov = (portrait ? 0.95 : 0.87) + boost;
    this.camera.fov += (wantedFov - this.camera.fov) * Math.min(1, dt * 4);
  }
  reset() {
    this.camera.position.set(0, 4.5, -9);
    this.focus.set(0, 1.8, 14);
    this.camera.setTarget(this.focus);
  }
}
