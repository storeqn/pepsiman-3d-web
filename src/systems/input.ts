import type { Input } from "../core/simulation";
export class InputManager {
  keys = new Set<string>();
  target: number | undefined;
  jump = false;
  slide = false;
  active = false;
  constructor(canvas: HTMLCanvasElement, pause: () => void) {
    window.addEventListener("keydown", (e) => {
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          e.code,
        )
      )
        e.preventDefault();
      if (e.repeat) return;
      this.keys.add(e.code);
      if (e.code === "Escape") pause();
      if (["Space", "KeyW", "ArrowUp"].includes(e.code)) this.jump = true;
      if (["KeyS", "ArrowDown"].includes(e.code)) this.slide = true;
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("blur", () => this.clear());
    let startX = 0,
      startY = 0,
      anchor = 0,
      origin = 0;
    canvas.addEventListener("pointerdown", (e) => {
      if (!this.active) return;
      canvas.setPointerCapture(e.pointerId);
      startX = e.clientX;
      startY = e.clientY;
      anchor = this.target ?? this.currentX;
      origin = anchor;
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!canvas.hasPointerCapture(e.pointerId)) return;
      const dx = e.clientX - startX,
        dy = e.clientY - startY;
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
        this.target = Math.max(
          -4.1,
          Math.min(4.1, origin + (dx / canvas.clientWidth) * 12),
        );
      }
      if (dy < -38) {
        this.jump = true;
        startY = e.clientY;
      }
      if (dy > 38) {
        this.slide = true;
        startY = e.clientY;
      }
    });
    const release = () => {
      this.target = undefined;
    };
    canvas.addEventListener("pointerup", release);
    canvas.addEventListener("pointercancel", release);
  }
  currentX = 0;
  read(): Input {
    const axis =
      Number(this.keys.has("KeyD") || this.keys.has("ArrowRight")) -
      Number(this.keys.has("KeyA") || this.keys.has("ArrowLeft"));
    const i = { axis, jump: this.jump, slide: this.slide, target: this.target };
    this.jump = false;
    this.slide = false;
    return i;
  }
  clear() {
    this.keys.clear();
    this.target = undefined;
    this.jump = false;
    this.slide = false;
  }
}
