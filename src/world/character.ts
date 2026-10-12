import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { material } from "./materials";
import type { Runner } from "../core/simulation";
export class AnimationSystem {
  root: TransformNode;
  hinges: TransformNode[] = [];
  limbs: TransformNode[] = [];
  private impactPulse = 0;
  private lastInvincible = 0;
  constructor(scene: Scene) {
    this.root = new TransformNode("silver-runner-procedural-rig", scene);
    const silver = material(scene, "silver armor", "#b9cbd3", 0.82, 0.28),
      blue = material(scene, "cobalt panels", "#07658e", 0.55, 0.3),
      dark = material(scene, "joints", "#13232d", 0.3, 0.5);
    const part = (
      name: string,
      position: Vector3,
      scale: Vector3,
      mat = silver,
      parent = this.root,
    ) => {
      const m = MeshBuilder.CreateSphere(
        name,
        { diameter: 1, segments: 24 },
        scene,
      );
      m.parent = parent;
      m.position = position;
      m.scaling = scale;
      m.material = mat;
      return m;
    };
    // Original procedural armor pass; no third-party meshes or unlicensed assets.
    const glow = material(scene, "reactor glow", "#18bdf1", 0.25, 0.16);
    glow.emissiveColor = blue.albedoColor.scale(0.8);
    part("chest reactor", new Vector3(0, 1.43, 0.36), new Vector3(0.2, 0.2, 0.07), glow);
    part("helmet crest", new Vector3(0, 2.31, -0.03), new Vector3(0.23, 0.08, 0.35), blue);
    // Self-authored aerodynamic plates and armor accents. No borrowed models.
    for (const side of [-1, 1]) {
      part("shoulder armor", new Vector3(side * 0.54, 1.64, 0), new Vector3(0.3, 0.24, 0.42), silver);
      part("shoulder blue inset", new Vector3(side * 0.57, 1.67, 0.19), new Vector3(0.19, 0.1, 0.085), blue);
      part("thigh accent", new Vector3(side * 0.22, 0.75, 0.18), new Vector3(0.13, 0.29, 0.065), blue);
      part("shin accent", new Vector3(side * 0.22, 0.38, 0.19), new Vector3(0.11, 0.2, 0.065), silver);
    }
    part("visor highlight", new Vector3(0, 2.025, 0.305), new Vector3(0.27, 0.045, 0.025), glow);
    part("upper chest plate", new Vector3(0, 1.54, 0.32), new Vector3(0.5, 0.19, 0.1), silver);
    part("collar", new Vector3(0, 1.79, 0), new Vector3(0.49, 0.15, 0.44), dark);
    part("rib armor", new Vector3(0, 1.37, 0), new Vector3(0.73, 0.69, 0.4));
    part(
      "abdominal suit",
      new Vector3(0, 1.06, 0),
      new Vector3(0.46, 0.42, 0.32),
      blue,
    );
    part("hips", new Vector3(0, 0.91, 0), new Vector3(0.55, 0.27, 0.36), dark);
    part("helmet", new Vector3(0, 1.92, 0), new Vector3(0.43, 0.51, 0.44));
    part(
      "visor",
      new Vector3(0, 1.98, 0.19),
      new Vector3(0.35, 0.16, 0.14),
      blue,
    );
    part(
      "spine light",
      new Vector3(0, 1.4, -0.215),
      new Vector3(0.12, 0.44, 0.07),
      blue,
    );
    for (const side of [-1, 1]) {
      for (const arm of [false, true]) {
        const pivot = new TransformNode(arm ? "shoulder" : "hip", scene);
        pivot.parent = this.root;
        pivot.position.set(side * (arm ? 0.43 : 0.19), arm ? 1.61 : 0.94, 0);
        this.limbs.push(pivot);
        part(
          "joint",
          Vector3.Zero(),
          new Vector3(0.19, 0.19, 0.19),
          dark,
          pivot,
        );
        part(
          "upper armor",
          new Vector3(0, -0.2, 0),
          new Vector3(arm ? 0.19 : 0.25, 0.43, 0.22),
          silver,
          pivot,
        );
        const lower = new TransformNode("hinge", scene);
        lower.parent = pivot;
        this.hinges.push(lower);
        lower.position.y = -0.4;
        lower.rotation.x = arm ? -0.5 : 0.25;
        part(
          "hinge",
          Vector3.Zero(),
          new Vector3(0.18, 0.18, 0.18),
          blue,
          lower,
        );
        part(
          "lower armor",
          new Vector3(0, -0.18, 0),
          new Vector3(0.18, 0.39, 0.21),
          silver,
          lower,
        );
        part(
          arm ? "glove" : "boot",
          new Vector3(0, -0.39, arm ? 0 : 0.09),
          new Vector3(0.21, 0.17, arm ? 0.21 : 0.39),
          dark,
          lower,
        );
      }
    }
  }
  update(p: Runner, moving: boolean) {
    this.root.position.set(p.x, p.y, p.z);
    const struck = p.invincible > this.lastInvincible + 0.3;
    if (struck) this.impactPulse = 1;
    this.lastInvincible = p.invincible;
    this.impactPulse *= 0.87;
    this.root.rotation.z = -p.vx * 0.025 + Math.sin(p.elapsed * 32) * 0.12 * this.impactPulse;
    const wantedPitch = p.slide > 0 ? -1.05 : p.y > 0.1 ? 0.13 : 0.04;
    this.root.rotation.x += (wantedPitch - this.root.rotation.x) * 0.22;
    this.root.scaling.y += ((p.slide > 0 ? 0.55 : 1) - this.root.scaling.y) * 0.28;
    const phase = p.elapsed * 13;
    const stride = moving && p.slide <= 0 ? 1 : 0;
    this.hinges.forEach((h, i) => {
      const airborne = p.y > 0.1;
      h.rotation.x = p.slide > 0 ? 1.1 : airborne ? (i % 2 ? 0.85 : 0.45) : 0.25 + Math.max(0, Math.sin(phase + i * Math.PI)) * 0.95 * stride;
    });
    this.limbs.forEach(
      (l, i) =>
        (l.rotation.x = moving
          ? p.y > 0
            ? i % 2
              ? 0.6
              : -0.6
            : Math.sin(phase + (i < 2 ? 0 : Math.PI) + (i % 2 ? Math.PI : 0)) *
              0.7
          : 0),
    );
  }
}
