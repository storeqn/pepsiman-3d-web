import { LEVEL_LENGTH, type Runner, type Status } from "../core/simulation";
import type { Save } from "./save";
export class UIManager {
  root = document.querySelector<HTMLDivElement>("#app")!;
  hud!: HTMLElement;
  panel!: HTMLElement;
  message!: HTMLElement;
  constructor(
    private actions: {
      start: () => void;
      pause: () => void;
      menu: () => void;
      settings: (s: Partial<Save>) => void;
      jump: () => void;
      slide: () => void;
      move: (axis: number) => void;
    },
    private save: Save,
  ) {
    this.root.innerHTML = `<header class="brand"><span class="brand-icon">$<span>↗</span></span><div dir="rtl">صايد <span>الدولار</span><small>3D · الْحِق الدولار قبل لا يطير!</small></div></header><div id="hud" hidden><div class="stats"><span>النقاط <b id="score">0</b></span><span>الدولارات <b id="coins">$0</b></span><span>الفرص <b id="lives">●●●</b></span></div><div class="progress"><i id="progress"></i></div><button id="pause" aria-label="إيقاف مؤقت">Ⅱ</button><div id="hint"></div></div><main id="panel"></main><div id="toast" role="status"></div><div id="touch" hidden><button data-move="-1" aria-label="يسار">←</button><button data-move="1" aria-label="يمين">→</button><span></span><button id="slide">انزلاق ↓</button><button id="jump">قفز ↑</button></div><footer>صايد الدولار 3D · لعبة عراقية أصلية <span>IRAQI DOLLAR RUNNER</span></footer>`;
    this.hud = this.root.querySelector("#hud")!;
    this.panel = this.root.querySelector("#panel")!;
    this.message = this.root.querySelector("#toast")!;
    this.root.querySelector("#pause")!.addEventListener("click", actions.pause);
    this.root
      .querySelector("#jump")!
      .addEventListener("pointerdown", actions.jump);
    this.root
      .querySelector("#slide")!
      .addEventListener("pointerdown", actions.slide);
    this.root
      .querySelectorAll<HTMLButtonElement>("[data-move]")
      .forEach((b) => {
        b.addEventListener("pointerdown", (e) => {
          b.setPointerCapture(e.pointerId);
          actions.move(Number(b.dataset.move));
        });
        ["pointerup", "pointercancel", "lostpointercapture"].forEach((event) =>
          b.addEventListener(event, () => actions.move(0)),
        );
      });
  }
  toast(text: string) {
    this.message.textContent = text;
    window.setTimeout(() => {
      if (this.message.textContent === text) this.message.textContent = "";
    }, 2600);
  }
  show(status: Status, p: Runner) {
    this.hud.hidden = status !== "playing";
    (this.root.querySelector("#touch") as HTMLElement).hidden =
      status !== "playing";
    this.panel.hidden = status === "playing";
    if (status === "menu") {
      this.panel.innerHTML = `<div class="eyebrow">01 — شوارع العراق</div><h1>صايد الدولار <em>3D</em></h1><p class="tagline">الحق الدولار قبل لا يطير!</p><p>اركض بالدشداشة والشماغ بين أسواقنا، اجمع رزم الدولارات وراوغ التكاسي والحواجز!</p><div class="level-tag"><span>◈</span><div><strong>صايد الدولار — شارع السوق</strong><small>٢٫٤ كم · شوارع وأسواق عراقية</small></div></div><button class="primary" id="start">يلا نركض! <span>↗</span></button><div class="menu-links"><button id="levels">المراحل</button><button id="settings">الإعدادات</button><button id="help">التحكم والتثبيت</button></div><div class="best">أفضل نتيجة <b>${this.save.best.toLocaleString("en")}</b></div>`;
      this.bind("start", this.actions.start);
      this.bind("levels", () => this.levels());
      this.bind("settings", () => this.settings());
      this.bind("help", () => this.help());
    }
    if (status === "paused") {
      this.panel.innerHTML = `<div class="eyebrow">استراحة</div><h1>استراحة قصيرة</h1><p>المسافة: ${Math.floor(p.z)} متر</p><button class="primary" id="resume">متابعة الركض</button><button id="menu">القائمة الرئيسية</button>`;
      this.bind("resume", this.actions.pause);
      this.bind("menu", this.actions.menu);
    }
    if (status === "won" || status === "lost") {
      this.panel.innerHTML = `<div class="eyebrow">${status === "won" ? "تمت الجولة" : "جاهز للمحاولة؟"}</div><h1>${status === "won" ? "وصلت بسلام!" : "جرّب مرة أخرى"}</h1><p>${status === "won" ? "وصلت نهاية شارع السوق وجمعت الدولارات!" : "انتهت المحاولات. انتبه للحواجز والمسار المفتوح."}</p><div class="result"><b>${p.score}</b><span>نقطة · ${p.coins * 100} دولار · ${Math.floor(p.z)} متر</span></div><button class="primary" id="retry">اركض من جديد ↗</button><button id="menu">القائمة الرئيسية</button>`;
      this.bind("retry", this.actions.start);
      this.bind("menu", this.actions.menu);
    }
  }
  bind(id: string, fn: () => void) {
    this.root.querySelector("#" + id)?.addEventListener("click", fn);
  }
  private back() {
    this.panel.insertAdjacentHTML(
      "beforeend",
      '<button id="back">رجوع</button>',
    );
    this.bind("back", this.actions.menu);
  }
  levels() {
    this.panel.innerHTML =
      '<div class="eyebrow">THE ROUTE</div><h2>اختر المرحلة</h2><button id="level1" class="primary">01 · شارع السوق العراقي ↗</button>' +
      ["طريق البصرة", "ورشة المقاولات", "ليالي بغداد", "طريق القرنة"]
        .map(
          (n, i) =>
            `<div class="locked">0${i + 2} · ${n}<small>قيد التطوير — غير قابلة للعب بعد</small></div>`,
        )
        .join("");
    this.bind("level1", this.actions.start);
    this.back();
  }
  settings() {
    this.panel.innerHTML = `<h2>الإعدادات</h2><label>جودة الرسومات<select id="quality"><option value="auto">تلقائية</option><option value="low">منخفضة</option><option value="medium">متوسطة</option><option value="high">عالية</option></select></label><label>الموسيقى<input id="music" type="range" min="0" max="1" step="0.05" value="${this.save.music}"></label><label>المؤثرات<input id="effects" type="range" min="0" max="1" step="0.05" value="${this.save.effects}"></label><p class="fine">الصوت مولّد برمجياً وأصلي. الأداء على أجهزة الهاتف الفعلية لم يُعتمد بعد.</p>`;
    (this.root.querySelector("#quality") as HTMLSelectElement).value =
      this.save.quality;
    this.root.querySelector("#quality")!.addEventListener("change", (e) =>
      this.actions.settings({
        quality: (e.target as HTMLSelectElement).value as Save["quality"],
      }),
    );
    for (const key of ["music", "effects"] as const)
      this.root.querySelector("#" + key)!.addEventListener("input", (e) =>
        this.actions.settings({
          [key]: Number((e.target as HTMLInputElement).value),
        }),
      );
    this.back();
  }
  help() {
    this.panel.innerHTML = `<h2>خطوتك الأولى</h2><div class="instructions"><p><b>اسحب يميناً ويساراً</b><br>تحرّك بحرية ضمن عرض الطريق. أو استخدم أزرار اللمس.</p><p><b>اسحب للأعلى ↑</b> للقفز فوق الحواجز.<br><b>اسحب للأسفل ↓</b> للانزلاق تحت العوارض.</p><p><b>الكمبيوتر</b><br>A / D أو الأسهم للحركة · Space للقفز<br>S للانزلاق · Esc للإيقاف</p><p><b>التثبيت</b><br>iPhone: افتح في Safari ← مشاركة ← إضافة إلى الشاشة الرئيسية.<br>Android والكمبيوتر: اختر تثبيت التطبيق من قائمة المتصفح عند توفره.</p></div>`;
    this.back();
  }
  update(p: Runner, fps: number) {
    this.root.querySelector("#score")!.textContent =
      p.score.toLocaleString("en");
    this.root.querySelector("#coins")!.textContent = "$" + (p.coins * 100).toLocaleString("en-US");
    this.root.querySelector("#lives")!.textContent = "●".repeat(
      Math.max(0, p.lives),
    );
    (this.root.querySelector("#progress") as HTMLElement).style.width =
      `${(p.z / LEVEL_LENGTH) * 100}%`;
    this.root.querySelector("#hint")!.textContent =
      p.z < 35
        ? "اسحب للحركة · ↑ قفز · ↓ انزلاق"
        : `${Math.floor(p.z)} / ${LEVEL_LENGTH} م · ${Math.round(p.speed * 3.6)} كم/س · ${Math.round(fps)} FPS`;
  }
}
