import { Color3 } from "@babylonjs/core/Maths/math.color";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { material } from "./materials";
import type { Runner } from "../core/simulation";

/** Original articulated Iraqi outfit rig. An artist-made skinned GLB remains a future upgrade. */
export class AnimationSystem {
  root: TransformNode;
  hinges: TransformNode[] = [];
  limbs: TransformNode[] = [];
  private impactPulse = 0;
  private lastInvincible = 0;
  constructor(scene: Scene) {
    this.root = new TransformNode("iraqi-runner-rig", scene);
    const thobe = material(scene, "cotton-thobe", "#f7f2e6", 0, 0.88);
    const seams = material(scene, "stitched-cotton", "#c9c2b4", 0, 0.88);
    const skin = material(scene, "warm-skin", "#bc8764", 0, 0.84);
    const black = material(scene, "black-agal", "#191917", 0.05, 0.7);
    const red = material(scene, "shemagh-red", "#ac2428", 0, 0.87);
    const shoe = material(scene, "brown-shoes", "#483126", 0.08, 0.8);
    const eye = material(scene, "eyes", "#211815", 0.04, 0.55);
    const el = (name: string, x: number, y: number, z: number, a: number, b: number, c: number, mat = thobe, parent = this.root) => {
      const m = MeshBuilder.CreateSphere(name, {diameter: 1, segments: 16}, scene);
      m.parent = parent; m.position.set(x,y,z); m.scaling.set(a,b,c); m.material = mat; return m;
    };
    const box = (name: string, x: number,y: number,z: number,w: number,h: number,d: number,mat=thobe,parent=this.root) => {
      const m=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);
      m.parent=parent;m.position.set(x,y,z);m.material=mat;return m;
    };
    const cone = (name:string,x:number,y:number,z:number,top:number,bottom:number,h:number,mat=thobe,parent=this.root) => {
      const m=MeshBuilder.CreateCylinder(name,{diameterTop:top,diameterBottom:bottom,height:h,tessellation:24},scene);
      m.parent=parent;m.position.set(x,y,z);m.material=mat;return m;
    };
    cone("flowing-long-white-dishdasha",0,1.2,0,0.7,1.12,1.5);
    cone("shoulders",0,1.86,0,0.64,0.7,0.23);
    cone("collar",0,2.03,0,0.34,0.4,0.14,seams);
    box("front-placket",0,1.72,0.36,0.06,0.4,0.03,seams);
    for(const y of [1.6,1.72,1.84]) el("button",0,y,0.386,0.022,0.022,0.02,seams);
    for(let i=0;i<12;i++){
      const angle=i*Math.PI/6;
      const fold=box("hem-pleat",Math.sin(angle)*0.53,0.59,Math.cos(angle)*0.53,0.025,0.35,0.028,seams);
      fold.rotation.y=angle;
    }
    el("face",0,2.36,0.045,0.32,0.4,0.3,skin);
    for(const side of [-1,1]){
      el("ear",side*0.3,2.32,0.02,0.085,0.13,0.07,skin);
      el("eye",side*0.13,2.38,0.323,0.047,0.032,0.026,eye);
      el("brow",side*0.13,2.44,0.302,0.105,0.025,0.03,black);
      el("mustache",side*0.067,2.17,0.339,0.085,0.036,0.044,black);
    }
    el("nose",0,2.28,0.348,0.065,0.11,0.085,skin);
    el("chin",0,2.08,0.25,0.18,0.06,0.1,skin);
    cone("white-shemagh-crown",0,2.68,0,0.65,0.72,0.24);
    // Alternating broad red woven panels and long hanging corners of the shemagh.
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6;
      const stripe=box("shemagh-red-head-weave",Math.sin(a)*0.342,2.68,Math.cos(a)*0.342,0.047,0.22,0.032,i%3===0?red:thobe);
      stripe.rotation.y=a;
    }
    for(const side of [-1,1]){
      const drop=box("shemagh-side-tail",side*0.34,2.35,-0.13,0.19,0.61,0.28,thobe);
      drop.rotation.z=side*0.09;
      box("shemagh-red-tail-stripe",side*0.35,2.24,-0.287,0.07,0.52,0.025,red);
    }
    box("shemagh-back-cloth",0,2.37,-0.29,0.65,0.69,0.065);
    for(const x of [-0.24,0,0.24]) box("red-back-pattern",x,2.36,-0.33,0.045,0.65,0.015,red);
    for(const y of [2.15,2.38,2.58])box("red-back-cross-stitch",0,y,-0.34,0.62,0.035,0.015,red);
    for(const y of [2.72,2.78]){
      const ring=MeshBuilder.CreateTorus("double-black-agal",{diameter:0.7,thickness:0.085,tessellation:32},scene);
      ring.parent=this.root;ring.position.y=y;ring.material=black;
    }
    for(const side of [-1,1]){
      for(const arm of [true,false]){
        const pivot=new TransformNode(arm?"shoulder":"hip",scene);
        pivot.parent=this.root;pivot.position.set(side*(arm?0.41:0.23),arm?1.78:0.73,0);
        this.limbs.push(pivot);
        cone(arm?"long-thobe-sleeve":"trouser",0,-0.21,0,arm?0.37:0.31,arm?0.28:0.26,0.43,thobe,pivot);
        const hinge=new TransformNode(arm?"elbow":"knee",scene);
        hinge.parent=pivot;hinge.position.y=-0.4;this.hinges.push(hinge);
        cone("lower-limb",0,-0.16,0,0.26,0.22,0.32,thobe,hinge);
        el(arm?"hand":"leather-shoe",0,-0.36,arm?0:0.12,arm?0.12:0.18,arm?0.13:0.12,arm?0.13:0.28,arm?skin:shoe,hinge);
      }
    }
  }
  update(p:Runner,moving:boolean){
    this.root.position.set(p.x,p.y,p.z);
    if(p.invincible>this.lastInvincible+0.3)this.impactPulse=1;
    this.lastInvincible=p.invincible;this.impactPulse*=0.86;
    const phase=p.elapsed*Math.min(20,12+p.speed*0.26);
    this.root.rotation.z=-p.vx*0.035+Math.sin(phase)*0.1*this.impactPulse;
    const pitch=p.slide>0?-0.94:p.y>0.1?0.16:moving?0.07:0;
    this.root.rotation.x+=(pitch-this.root.rotation.x)*0.22;
    this.root.scaling.y+=((p.slide>0?0.57:1)-this.root.scaling.y)*0.28;
    this.limbs.forEach((l,i)=>{
      const stride=Math.sin(phase+(i<2?0:Math.PI))*0.78;
      l.rotation.x=p.slide>0?-0.6:p.y>0?0.45:moving?stride*(i%2?-1:1):0;
    });
    this.hinges.forEach((h,i)=>{
      h.rotation.x=p.slide>0?1.12:p.y>0?0.6:moving?0.2+Math.max(0,Math.sin(phase+(i<2?0:Math.PI)))*0.9:0.2;
    });
  }
}
