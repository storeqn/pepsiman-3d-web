import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Scene } from "@babylonjs/core/scene";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import {
  FixedClock,
  initialRunner,
  LEVEL_LENGTH,
  overlaps,
  STEP,
  stepRunner,
  type Status,
} from "./simulation";
import { AnimationSystem } from "../world/character";
import { WorldStreaming } from "../world/world";
import { InputManager } from "../systems/input";
import { CameraController } from "../systems/camera";
import { AudioManager } from "../systems/audio";
import { SaveSystem, type Save } from "../systems/save";
import { QualityManager } from "../systems/quality";
import { UIManager } from "../systems/ui";
export class Game {
  engine: Engine;
  scene: Scene;
  runner = initialRunner();
  status: Status = "menu";
  clock = new FixedClock();
  save = new SaveSystem();
  audio = new AudioManager();
  input: InputManager;
  camera: CameraController;
  character: AnimationSystem;
  world: WorldStreaming;
  quality: QualityManager;
  ui: UIManager;
  private hudClock = 0;
  private touchAxis = 0;
  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: false,
      stencil: true,
      powerPreference: "high-performance",
    });
    if (this.engine.webGLVersion < 2)
      throw new Error("تحتاج اللعبة إلى متصفح يدعم WebGL2.");
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.62, 0.81, 0.98, 1);
    this.scene.fogMode = Scene.FOGMODE_LINEAR;
    this.scene.fogStart = 118;
    this.scene.fogEnd = 245;
    this.scene.fogColor = new Color3(0.62, 0.81, 0.98);
    this.scene.imageProcessingConfiguration.toneMappingEnabled = true;
    this.scene.imageProcessingConfiguration.exposure = 1.1;
    this.scene.imageProcessingConfiguration.contrast = 1.12;
    this.scene.environmentTexture = CubeTexture.CreateFromImages(
      ["px", "py", "pz", "nx", "ny", "nz"].map(
        (n) => "/environment/" + n + ".png",
      ),
      this.scene,
    );
    this.scene.environmentIntensity = 0.75;
    const ambient = new HemisphericLight("sky", Vector3.Up(), this.scene);
    ambient.intensity = 0.98;
    ambient.groundColor = new Color3(0.33, 0.36, 0.32);
    const sun = new DirectionalLight(
      "sun",
      new Vector3(-0.6, -1, 0.5),
      this.scene,
    );
    sun.position.set(30, 55, -30);
    sun.intensity = 1.55;
    sun.diffuse = new Color3(1, 0.9, 0.74);
    sun.autoCalcShadowZBounds = true;
    sun.shadowMinZ = 1;
    sun.shadowMaxZ = 150;
    this.camera = new CameraController(this.scene);
    this.character = new AnimationSystem(this.scene);
    this.world = new WorldStreaming(this.scene);
    const shadows = new ShadowGenerator(1024, sun);
    shadows.usePercentageCloserFiltering = true;
    shadows.bias = 0.001;
    this.character.root
      .getChildMeshes()
      .forEach((m) => shadows.addShadowCaster(m));
    this.quality = new QualityManager(this.engine, shadows);
    this.quality.apply(this.save.data.quality);
    this.input = new InputManager(canvas, () => this.pause());
    this.audio.music = this.save.data.music;
    this.audio.effects = this.save.data.effects;
    this.ui = new UIManager(
      {
        start: () => this.start(),
        pause: () => this.pause(),
        menu: () => this.menu(),
        settings: (s) => this.settings(s),
        jump: () => {
          this.input.jump = true;
        },
        slide: () => {
          this.input.slide = true;
        },
        move: (axis) => {
          this.touchAxis = axis;
        },
      },
      this.save.data,
    );
    this.ui.show("menu", this.runner);
    window.addEventListener("resize", () => this.engine.resize());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.status === "playing") this.pause();
    });
    window.addEventListener("blur", () => {
      if (this.status === "playing") this.pause();
    });
    this.engine.runRenderLoop(() => {
      const dt = Math.min(0.1, this.engine.getDeltaTime() / 1000);
      if (this.status === "playing") this.clock.advance(dt, () => this.tick());
      this.character.update(this.runner, this.status === "playing");
      this.camera.update(this.runner, dt);
      sun.position.set(this.runner.x + 30, 55, this.runner.z - 30);
      this.quality.update(dt);
      this.hudClock += dt;
      if (this.hudClock > 0.1) {
        this.ui.update(this.runner, this.engine.getFps());
        this.hudClock = 0;
      }
      this.scene.render();
    });
  }
  start() {
    this.runner = initialRunner();
    this.world.reset();
    this.clock.reset();
    this.camera.reset();
    this.input.clear();
    this.touchAxis = 0;
    this.status = "playing";
    this.input.active = true;
    this.audio.start();
    this.ui.show(this.status, this.runner);
  }
  menu() {
    this.status = "menu";
    this.input.active = false;
    this.input.clear();
    this.touchAxis = 0;
    this.ui.show("menu", this.runner);
  }
  pause() {
    if (this.status !== "playing" && this.status !== "paused") return;
    this.status = this.status === "playing" ? "paused" : "playing";
    this.clock.reset();
    this.input.clear();
    this.touchAxis = 0;
    this.input.active = this.status === "playing";
    this.ui.show(this.status, this.runner);
  }
  settings(s: Partial<Save>) {
    Object.assign(this.save.data, s);
    if (!this.save.persist())
      this.ui.toast("تعذر حفظ الإعدادات في هذا المتصفح");
    this.audio.music = this.save.data.music;
    this.audio.effects = this.save.data.effects;
    this.quality.apply(this.save.data.quality);
  }
  private tick() {
    if (this.status !== "playing") return;
    const oldZ = this.runner.z;
    this.input.currentX = this.runner.x;
    const input = this.input.read();
    if (this.touchAxis) input.axis = this.touchAxis;
    const oldY = this.runner.y;
    stepRunner(this.runner, input, STEP);
    if (this.runner.y > 0 && oldY === 0) this.audio.tone(300, 0.16);
    if (input.slide) this.audio.tone(90, 0.22);
    this.world.update(this.runner.z);
    for (const obstacle of this.world.obstacles) {
      if (!overlaps(this.runner, obstacle, oldZ)) continue;
      if (obstacle.kind === "coin") {
        obstacle.hit = true;
        this.runner.coins++;
        this.world.collect(obstacle.id);
        this.audio.tone(1100, 0.08);
        this.audio.tone(1460, 0.1, this.audio.effects * 0.55);
      } else if (this.runner.invincible === 0) {
        obstacle.hit = true;
        this.runner.lives--;
        this.runner.invincible = 1.5;
        this.audio.tone(55, 0.28, this.audio.effects, "sawtooth");
        this.ui.toast("اصطدام! راقب الطريق المفتوح");
      }
    }
    this.runner.score = Math.floor(this.runner.z) * 2 + this.runner.coins * 100;
    this.audio.update(this.runner.elapsed);
    if (this.runner.lives <= 0) this.finish("lost");
    else if (this.runner.z >= LEVEL_LENGTH) this.finish("won");
  }
  private finish(status: "lost" | "won") {
    this.status = status;
    this.input.active = false;
    this.save.data.best = Math.max(this.save.data.best, this.runner.score);
    if (status === "won") this.save.data.completed = true;
    if (!this.save.persist())
      this.ui.toast("النتيجة متاحة الآن، لكن تعذر حفظها محلياً");
    this.ui.show(status, this.runner);
    this.audio.tone(status === "won" ? 660 : 90, 0.5);
  }
}
