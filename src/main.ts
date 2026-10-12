import "./style.css";
import { Game } from "./core/game";
const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML =
  '<div class="loading"><b>SILVER RUSH</b><p>جارٍ تجهيز شوارع المدينة…</p></div>';
requestAnimationFrame(() =>
  setTimeout(() => {
    try {
      const game = new Game(
        document.querySelector<HTMLCanvasElement>("#game")!,
      );
      if (import.meta.env.DEV)
        (window as Window & { __silverRush?: Game }).__silverRush = game;
    } catch (error) {
      app.innerHTML =
        '<div class="loading"><h1>تعذر تشغيل اللعبة</h1><p>جرّب متصفحاً حديثاً مع تفعيل تسريع الرسومات.</p><button onclick="location.reload()">إعادة المحاولة</button></div>';
      console.error(error);
    }
  }, 30),
);
if ("serviceWorker" in navigator && import.meta.env.PROD)
  window.addEventListener("load", () => {
    void navigator.serviceWorker
      .register("/sw.js")
      .then((r) => {
        r.addEventListener("updatefound", () => {
          const worker = r.installing;
          worker?.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              const notice = document.createElement("button");
              notice.className = "update-notice";
              notice.textContent = "تحديث جاهز — أغلق اللعبة وافتحها لتطبيقه";
              notice.onclick = () => notice.remove();
              document.body.append(notice);
            }
          });
        });
      })
      .catch(console.warn);
  });
