// 트윈 검증 — 시나리오 실행→3D 침수 단계/2D 모델맵/비교 캡처 + 콘솔에러 수집.
import { chromium } from "playwright";

const b = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"],
});
const p = await b.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 1.4 });
const errs = [];
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
p.on("pageerror", (e) => errs.push("PAGEERR: " + e.message));

await p.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
await p.waitForSelector("canvas", { timeout: 45000 });
await p.waitForTimeout(8000);

const info = await p.evaluate(() => {
  const c = document.querySelector("canvas");
  return { w: c?.width, h: c?.height };
});
console.log("canvas:", JSON.stringify(info));

await p.screenshot({ path: "shot_noscn.png" }); // 미실행(기본 3D 객체) 상태

// 시나리오 1건 즉시 실행 → 완료 대기(Mock 파이프라인 ~5s)
try {
  await p.getByRole("button", { name: "즉시 실행" }).click();
  await p.waitForTimeout(7000);
} catch (e) { console.log("run fail:", e.message); }

async function scrub(v) {
  await p.evaluate((val) => {
    const r = document.querySelector('input[type="range"]');
    if (!r) return;
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    set.call(r, String(Math.round(val * 1000)));
    r.dispatchEvent(new Event("input", { bubbles: true }));
  }, v);
  await p.waitForTimeout(1000);
}

for (const [i, v] of [[0, 0.0], [1, 0.4], [2, 0.55], [3, 0.72]]) { await scrub(v); await p.screenshot({ path: `shot_twin_${i}.png` }); }

// 줌인(연안 침수 확인) — 휠 dolly-in
try {
  const box = await p.locator("canvas").boundingBox();
  await p.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.48);
  await p.mouse.wheel(0, -1500);
  await p.waitForTimeout(600);
  await p.mouse.wheel(0, -1100);
  await p.waitForTimeout(1000);
  await p.screenshot({ path: "shot_zoom.png" });
} catch (e) { console.log("zoom fail:", e.message); }

// 2D 모델맵
try {
  await p.getByText("2D 모델맵", { exact: true }).click();
  await p.waitForTimeout(3000);
  await p.screenshot({ path: "shot_2d.png" });
} catch (e) { console.log("2D tab fail:", e.message); }

// 시나리오 비교
try {
  await p.getByText("시나리오 비교", { exact: true }).click();
  await p.waitForTimeout(900);
  await p.screenshot({ path: "shot_compare.png" });
} catch (e) { console.log("compare tab fail:", e.message); }

console.log("console errors:", errs.length);
errs.slice(0, 10).forEach((e) => console.log("  -", e.slice(0, 180)));
await b.close();
console.log("done");
