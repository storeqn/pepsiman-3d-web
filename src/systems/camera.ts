import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Runner } from "../core/simulation";
export class CameraController {
  camera: FreeCamera;
  constructor(scene: Scene) {
    this.camera = new FreeCamera("chase", new Vector3(0, 4.1, -8), scene);
    this.camera.minZ = 0.15;
    this.camera.maxZ = 245;
    this.camera.fov = 0.88;
  }
  update(p: Runner, dt: number) {
    const portrait = innerHeight > innerWidth;
    const desired = new Vector3(
      p.x * 0.45,
      portrait ? 4.8 : 4.1,
      p.z - (portrait ? 10 : 8),
    );
    this.camera.position = Vector3.Lerp(
      this.camera.position,
      desired,
      1 - Math.exp(-dt * 9),
    );
    this.camera.setTarget(new Vector3(p.x * 0.3, 1.4, p.z + 14));
    this.camera.fov = 0.88 + Math.min(0.1, p.z / 24000);
  }
  reset() {
    this.camera.position.set(0, 4.1, -8);
  }
}
