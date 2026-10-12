import { Color3 } from "@babylonjs/core/Maths/math.color";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { encounter, LEVEL_LENGTH, type Obstacle } from "../core/simulation";
import { asphalt, material } from "./materials";
export class WorldStreaming {
  chunks: TransformNode[] = [];
  obstacles: Obstacle[] = [];
  visuals = new Map<number, TransformNode>();
  nextEncounter = 0;
  private pools = new Map<string, TransformNode[]>();
  private road: PBRMaterial;
  private concrete: PBRMaterial;
  private glass: PBRMaterial;
  private white: PBRMaterial;
  private orange: PBRMaterial;
  private blue: PBRMaterial;
  private rubber: PBRMaterial;
  private gold: PBRMaterial;
  private green: PBRMaterial;
  constructor(private scene: Scene) {
    this.road = asphalt(scene);
    this.concrete = material(scene, "limestone", "#b7ad9c");
    this.glass = material(scene, "blue glass", "#1c485b", 0.55, 0.22);
    this.white = material(scene, "ivory", "#eee9d6");
    this.orange = material(scene, "safety orange", "#f18a3f");
    this.blue = material(scene, "petrol", "#2c7888", 0.4, 0.33);
    this.rubber = material(scene, "rubber", "#16252b");
    this.gold = material(scene, "energy", "#9aefca", 0.55, 0.25);
    this.gold.emissiveColor = Color3.FromHexString("#3a8869");
    this.green = material(scene, "foliage", "#537765");
    for (let i = 0; i < 8; i++) {
      const root = new TransformNode("city-segment-" + i, scene);
      root.position.z = (i - 1) * 40;
      this.buildChunk(root, i);
      this.chunks.push(root);
    }
    const finish = new TransformNode("finish", scene);
    finish.position.z = LEVEL_LENGTH;
    this.box(finish, "finish crossbar", 0, 4.8, 0, 10, 0.35, 0.5, this.blue);
    for (const x of [-4.7, 4.7])
      this.box(finish, "finish pole", x, 2.4, 0, 0.22, 4.8, 0.22, this.white);
    this.sign(finish, "FINISH / SILVER DISTRICT", 0, 4.8, -0.28, 7, 0.6);
    this.update(0);
  }
  box(
    root: TransformNode,
    name: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat: PBRMaterial,
  ) {
    const m = MeshBuilder.CreateBox(
      name,
      { width: w, height: h, depth: d },
      this.scene,
    );
    m.position.set(x, y, z);
    m.parent = root;
    m.material = mat;
    m.receiveShadows = true;
    return m;
  }
  private sign(
    root: TransformNode,
    text: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
  ) {
    const t = new DynamicTexture(
      text,
      { width: 512, height: 128 },
      this.scene,
      false,
    );
    t.drawText(
      text,
      null,
      83,
      "bold 40px sans-serif",
      "#def4e8",
      "#12333b",
      true,
    );
    const m = material(this.scene, text, "#ffffff");
    m.albedoTexture = t;
    m.emissiveColor = new Color3(0.18, 0.18, 0.18);
    const plane = MeshBuilder.CreatePlane(
      text,
      { width: w, height: h, sideOrientation: Mesh.DOUBLESIDE },
      this.scene,
    );
    plane.parent = root;
    plane.position.set(x, y, z);
    plane.material = m;
  }
  private buildChunk(root: TransformNode, index: number) {
    this.box(root, "road", 0, -0.13, 20, 10, 0.25, 40, this.road);
    for (const side of [-1, 1]) {
      this.box(
        root,
        "raised sidewalk",
        side * 6.1,
        0.1,
        20,
        2.2,
        0.35,
        40,
        this.concrete,
      );
      this.box(root, "curb", side * 5, 0.18, 20, 0.12, 0.35, 40, this.white);
      for (let n = 0; n < 2; n++) {
        const z = n * 20 + 10;
        const height = 7 + ((index * 7 + n * 3) % 5) * 2;
        const facade = material(
          this.scene,
          "facade " + index + " " + n + " " + side,
          ["#bcac92", "#7d9696", "#a88069", "#738997", "#c5bdae"][
            (index + n + (side + 1)) % 5
          ],
        );
        this.box(
          root,
          "building",
          side * 10.5,
          height / 2,
          z,
          6.5,
          height,
          17,
          facade,
        );
        this.box(
          root,
          "cornice",
          side * 10.5,
          height,
          z,
          6.8,
          0.28,
          17.3,
          this.white,
        );
        for (let floor = 0; floor < Math.floor(height / 2.5); floor++)
          for (let col = 0; col < 5; col++) {
            this.box(
              root,
              "window",
              side * 7.22,
              1.5 + floor * 2.5,
              z - 6 + col * 3,
              0.055,
              1.25,
              1.6,
              this.glass,
            );
          }
        this.box(
          root,
          "storefront",
          side * 7.16,
          1.5,
          z,
          0.1,
          2.4,
          12,
          this.glass,
        );
        this.box(
          root,
          "awning",
          side * 6.8,
          3.1,
          z,
          1.15,
          0.15,
          13,
          index % 2 ? this.orange : this.blue,
        );
        // Street-facing fascia plus perpendicular corner shop signage.
        this.sign(
          root,
          ["NORTH / COFFEE", "SILVER WORKS", "FRESH MARKET", "ARCADE"][
            index % 4
          ],
          side * 9.8,
          3.8,
          z - 8.56,
          5,
          0.75,
        );
        this.box(
          root,
          "lamp pole",
          side * 5.7,
          2.4,
          z - 6,
          0.1,
          4.8,
          0.1,
          this.rubber,
        );
        this.box(
          root,
          "lamp arm",
          side * 5.2,
          4.75,
          z - 6,
          1.1,
          0.09,
          0.09,
          this.rubber,
        );
        this.box(
          root,
          "lamp",
          side * 4.8,
          4.65,
          z - 6,
          0.45,
          0.12,
          0.4,
          this.white,
        );
        const trunk = MeshBuilder.CreateCylinder(
          "trunk",
          { height: 2.3, diameter: 0.22, tessellation: 8 },
          this.scene,
        );
        trunk.parent = root;
        trunk.position.set(side * 6, 1.3, z + 6);
        trunk.material = this.concrete;
        for (let crown = 0; crown < 3; crown++) {
          const tree = MeshBuilder.CreateSphere(
            "crown",
            { diameter: 2.1, segments: 6 },
            this.scene,
          );
          tree.scaling.set(1, 1.3, 1);
          tree.parent = root;
          tree.position.set(
            side * 6 + (crown - 1) * 0.35,
            3 + crown * 0.25,
            z + 6,
          );
          tree.material = this.green;
          tree.addLODLevel(100, null);
        }
        this.box(
          root,
          "planter",
          side * 6,
          0.35,
          z + 6,
          1.3,
          0.5,
          1.3,
          this.concrete,
        );
        this.box(
          root,
          "waste bin",
          side * 6,
          0.65,
          z + 1,
          0.55,
          1,
          0.55,
          this.blue,
        );
      }
    }
    // Non-interactive roadside dressing stays outside the runner's collision lanes.
    // All components join the existing per-material static batching below.
    if (index % 2 === 0) {
      const side = index % 4 === 0 ? -1 : 1;
      const x = side * 6.45;
      this.box(root, "signal pole", x, 2.9, 35, 0.13, 5.6, 0.13, this.rubber);
      this.box(root, "signal arm", side * 5.8, 5.55, 35, 1.4, 0.12, 0.12, this.rubber);
      this.box(root, "signal housing", side * 5.2, 5.15, 35, 0.48, 1.24, 0.42, this.rubber);
      this.box(root, "signal red", side * 5.2, 5.48, 34.77, 0.22, 0.22, 0.03, this.orange);
      this.box(root, "signal amber", side * 5.2, 5.14, 34.77, 0.22, 0.22, 0.03, this.gold);
      this.box(root, "signal green", side * 5.2, 4.8, 34.77, 0.22, 0.22, 0.03, this.green);
    }
    if (index % 3 === 1) {
      const side = index % 2 ? 1 : -1;
      // Parked delivery vehicle on the outside of the raised sidewalk.
      const x = side * 8.1;
      this.box(root, "delivery truck box", x, 1.58, 15, 1.85, 2.15, 4.1, this.white);
      this.box(root, "delivery truck cab", x, 1.03, 11.9, 1.8, 1.55, 1.8, this.blue);
      this.box(root, "delivery windshield", x, 1.38, 10.97, 1.42, 0.72, 0.05, this.glass);
      for (const z of [12, 16]) {
        this.box(root, "wheel left", x - 0.92, 0.44, z, 0.17, 0.72, 0.72, this.rubber);
        this.box(root, "wheel right", x + 0.92, 0.44, z, 0.17, 0.72, 0.72, this.rubber);
      }
    }
    // Repeated facade details share materials so the merge step avoids excess draw calls.
    for (const side of [-1, 1]) {
      this.box(root, "store threshold", side * 6.95, 0.28, 20, 0.8, 0.12, 7, this.white);
      this.box(root, "street bollard", side * 5.55, 0.52, 28, 0.17, 1.04, 0.17, this.rubber);
      this.box(root, "street bollard highlight", side * 5.55, 0.85, 28, 0.18, 0.12, 0.18, this.orange);
    }
    for (let z = 2; z < 40; z += 6)
      this.box(root, "lane marking", 0, 0.015, z, 0.12, 0.018, 2.6, this.white);
    if (index % 3 === 0)
      for (let x = -4; x <= 4; x++)
        this.box(root, "crosswalk", x, 0.023, 34, 0.5, 0.015, 3, this.white);
    // Merge static geometry per material to bound draw calls; tree LOD remains separate.
    const groups = new Map<PBRMaterial, Mesh[]>();
    for (const m of root.getChildMeshes()) {
      if (
        m instanceof Mesh &&
        m.name !== "crown" &&
        m.material instanceof PBRMaterial
      ) {
        const list = groups.get(m.material) ?? [];
        list.push(m);
        groups.set(m.material, list);
      }
    }
    const offset = root.position.z;
    root.position.z = 0;
    root.computeWorldMatrix(true);
    for (const list of groups.values())
      if (list.length > 1) {
        list.forEach((m) => m.computeWorldMatrix(true));
        const merged = Mesh.MergeMeshes(
          list,
          true,
          true,
          undefined,
          false,
          false,
        );
        if (merged) {
          merged.parent = root;
          merged.receiveShadows = true;
        }
      }
    root.position.z = offset;
  }
  private visual(o: Obstacle) {
    const existing = this.pools.get(o.kind)?.pop();
    if (existing) {
      existing.setEnabled(true);
      existing.position.set(o.x, 0, o.z);
      return existing;
    }
    const root = new TransformNode(o.kind, this.scene);
    root.position.set(o.x, 0, o.z);
    if (o.kind === "coin") {
      const ring = MeshBuilder.CreateTorus(
        "energy ring",
        { diameter: 0.62, thickness: 0.13, tessellation: 16 },
        this.scene,
      );
      ring.parent = root;
      ring.position.y = 1;
      ring.rotation.x = Math.PI / 2;
      ring.material = this.gold;
    } else if (o.kind === "barrier") {
      this.box(root, "barrier body", 0, 0.58, 0, 2.4, 0.65, 0.28, this.orange);
      for (const x of [-0.9, 0.9])
        this.box(root, "barrier foot", x, 0.3, 0, 0.13, 0.6, 0.6, this.rubber);
      for (let x = -0.9; x < 1.1; x += 0.45) {
        const m = this.box(
          root,
          "reflective stripe",
          x,
          0.6,
          -0.15,
          0.18,
          0.6,
          0.02,
          this.white,
        );
        m.rotation.z = -0.35;
      }
    } else if (o.kind === "beam") {
      for (const x of [-1.3, 1.3])
        this.box(root, "gantry post", x, 1.4, 0, 0.12, 2.8, 0.25, this.orange);
      this.box(root, "low beam", 0, 1.72, 0, 2.6, 1.1, 0.55, this.orange);
      this.sign(root, "SLIDE ↓", 0, 2, -0.3, 2, 0.45);
    } else {
      this.box(root, "car chassis", 0, 0.62, 0, 1.9, 0.6, 3.9, this.blue);
      this.box(root, "car cabin", 0, 1.1, -0.15, 1.65, 0.7, 2.1, this.glass);
      this.box(root, "car roof", 0, 1.49, -0.15, 1.7, 0.1, 2.1, this.blue);
      for (const side of [-1, 1])
        for (const z of [-1.25, 1.25]) {
          const wheel = MeshBuilder.CreateCylinder(
            "wheel",
            { diameter: 0.67, height: 0.22, tessellation: 12 },
            this.scene,
          );
          wheel.parent = root;
          wheel.position.set(side * 0.94, 0.36, z);
          wheel.rotation.z = Math.PI / 2;
          wheel.material = this.rubber;
        }
      for (const x of [-0.64, 0.64])
        this.box(
          root,
          "tail light",
          x,
          0.77,
          -1.98,
          0.4,
          0.15,
          0.04,
          this.orange,
        );
    }
    return root;
  }
  update(z: number) {
    for (const chunk of this.chunks)
      if (chunk.position.z + 40 < z - 45) chunk.position.z += 320;
    while (
      45 + this.nextEncounter * 27 <
      Math.min(z + 210, LEVEL_LENGTH - 35)
    ) {
      for (const o of encounter(this.nextEncounter++)) {
        this.obstacles.push(o);
        this.visuals.set(o.id, this.visual(o));
      }
    }
    this.obstacles = this.obstacles.filter((o) => {
      if (o.z < z - 15) {
        const v = this.visuals.get(o.id);
        if (v) {
          v.setEnabled(false);
          const pool = this.pools.get(o.kind) ?? [];
          pool.push(v);
          this.pools.set(o.kind, pool);
          this.visuals.delete(o.id);
        }
        return false;
      }
      return true;
    });
    for (const o of this.obstacles) {
      const v = this.visuals.get(o.id);
      if (v) {
        v.setEnabled(!o.hit);
        if (o.kind === "coin") v.rotation.y = z * 0.045;
      }
    }
  }
  reset() {
    for (const o of this.obstacles) {
      const v = this.visuals.get(o.id);
      if (v) {
        v.setEnabled(false);
        const pool = this.pools.get(o.kind) ?? [];
        pool.push(v);
        this.pools.set(o.kind, pool);
      }
    }
    this.visuals.clear();
    this.obstacles = [];
    this.nextEncounter = 0;
    this.chunks.forEach((c, i) => (c.position.z = (i - 1) * 40));
    this.update(0);
  }
}
