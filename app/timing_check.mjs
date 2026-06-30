// 시연 타이밍 점검 — 수행 중(결과 숨김) → 완료(결과·재생 등장).
import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const p = await b.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 1.3 });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
await p.waitForSelector("canvas", { timeout: 45000 });
await p.waitForTimeout(8000);
// 큐에 2건 추가 → 전체 큐 실행(순차)
await p.getByRole("button", { name: "큐에 추가" }).click(); await p.waitForTimeout(300);
await p.getByRole("button", { name: "동(E)", exact: true }).click().catch(() => {});
await p.getByRole("button", { name: "큐에 추가" }).click(); await p.waitForTimeout(300);
await p.locator('button:has-text("전체 큐 실행")').first().click().catch(() => {});
await p.waitForTimeout(2500);
await p.screenshot({ path: "shot_running.png" }); // 수행 중 — 결과 숨김
await p.waitForTimeout(11000);
await p.screenshot({ path: "shot_done.png" });    // 완료 — 결과·재생 등장
console.log("pageerrors:", errs.length);
await b.close(); console.log("done");
