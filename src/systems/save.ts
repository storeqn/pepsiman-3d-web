export interface Save {
  version: 1;
  best: number;
  completed: boolean;
  quality: "auto" | "low" | "medium" | "high";
  music: number;
  effects: number;
}
export const defaults = (): Save => ({
  version: 1,
  best: 0,
  completed: false,
  quality: "auto",
  music: 0.2,
  effects: 0.6,
});
export function decode(raw: string | null): Save {
  try {
    const d = JSON.parse(raw || "null");
    if (!d || d.version !== 1) return defaults();
    return {
      version: 1,
      best: Number.isFinite(d.best) ? Math.max(0, d.best) : 0,
      completed: d.completed === true,
      quality: ["auto", "low", "medium", "high"].includes(d.quality)
        ? d.quality
        : "auto",
      music: Number.isFinite(d.music) ? Math.max(0, Math.min(1, d.music)) : 0.2,
      effects: Number.isFinite(d.effects)
        ? Math.max(0, Math.min(1, d.effects))
        : 0.6,
    };
  } catch {
    return defaults();
  }
}
export class SaveSystem {
  data: Save;
  constructor() {
    try {
      this.data = decode(localStorage.getItem("silver-rush-v1"));
    } catch {
      this.data = defaults();
    }
  }
  persist() {
    try {
      localStorage.setItem("silver-rush-v1", JSON.stringify(this.data));
      return true;
    } catch {
      return false;
    }
  }
}
