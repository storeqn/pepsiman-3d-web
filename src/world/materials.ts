import { Color3 } from "@babylonjs/core/Maths/math.color";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Scene } from "@babylonjs/core/scene";
export function material(
  scene: Scene,
  name: string,
  color: string,
  metal = 0,
  rough = 0.7,
) {
  const m = new PBRMaterial(name, scene);
  m.albedoColor = Color3.FromHexString(color);
  m.metallic = metal;
  m.roughness = rough;
  m.useRadianceOverAlpha = false;
  m.backFaceCulling = true;
  return m;
}
export function asphalt(scene: Scene) {
  const m = material(scene, "asphalt", "#727c81", 0, 0.94);
  const t = new DynamicTexture("road-grain", 256, scene, true);
  const c = t.getContext();
  let seed = 17;
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const v = 46 + ((seed >>> 24) % 14);
      c.fillStyle = `rgb(${v},${v + 3},${v + 5})`;
      c.fillRect(x, y, 1, 1);
    }
  t.update();
  t.wrapU = 1;
  t.wrapV = 1;
  t.uScale = 3;
  t.vScale = 8;
  m.albedoTexture = t;
  return m;
}
