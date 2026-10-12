export class AudioManager {
  context?: AudioContext;
  music = 0.2;
  effects = 0.6;
  beat = 0;
  start() {
    this.context ??= new AudioContext();
    void this.context.resume();
  }
  tone(
    frequency: number,
    length = 0.1,
    volume = this.effects,
    type: OscillatorType = "sine",
  ) {
    const c = this.context;
    if (!c || c.state !== "running" || volume <= 0) return;
    const o = c.createOscillator(),
      g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(frequency, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      Math.max(30, frequency * 0.65),
      c.currentTime + length,
    );
    g.gain.setValueAtTime(volume * 0.12, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + length);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + length);
  }
  update(t: number) {
    const b = Math.floor(t * 3);
    if (b !== this.beat) {
      this.beat = b;
      this.tone(
        [110, 138.59, 164.81, 123.47][b % 4],
        0.16,
        this.music,
        "triangle",
      );
    }
  }
}
