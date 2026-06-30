// 전 기능 화면 캡처 — 사용자 점검용 스크린샷 세트.
import { chromium } from "playwright";

const b = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"],
});
const p = await b.newPage({ viewport: { width: 1620, height: 960 }, deviceScaleFactor: 1.4 });
const errs = [];
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
p.on("pageerror", (e) => errs.push("PAGEERR: " + e.message));

const shot = (n) => p.screenshot({ path: `cap_${n}.png` });
async function scrub(v) {
  await p.evaluate((val) => {
    const r = document.querySelector('input[type="range"]');
    if (!r) return;
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    set.call(r, String(Math.round(val * 1000)));
    r.dispatchEvent(new Event("input", { bubbles: true }));
  }, v);
  await p.waitForTimeout(900);
}

await p.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
await p.waitForSelector("canvas", { timeout: 45000 });
await p.waitForTimeout(8000);
await shot("01_main_3d_initial");

// 즉시 실행 → 완료 → 3D 침수
await p.getByRole("button", { name: "즉시 실행" }).click();
await p.waitForTimeout(7000);
await scrub(0.5);
await shot("02_3d_flood");

// 큐에 2건 추가 → 전체 실행(시나리오 비교용)
await p.getByRole("button", { name: "큐에 추가" }).click();
await p.waitForTimeout(300);
await p.getByRole("button", { name: "동(E)", exact: true }).click().catch(() => {});
await p.waitForTimeout(200);
await p.getByRole("button", { name: "큐에 추가" }).click();
await p.waitForTimeout(300);
await p.locator('button:has-text("전체 큐 실행")').first().click().catch(() => {});
await p.waitForTimeout(10000);

// 2D 모델맵
await p.locator('button:has-text("2D 모델맵")').first().click();
await p.waitForTimeout(3000);
await shot("03_2d_modelmap");

// 시나리오 비교
await p.locator('button:has-text("시나리오 비교")').first().click();
await p.waitForTimeout(1000);
await shot("04_compare");

// 3D 복귀 (시나리오 선택 카드)
await p.locator('button:has-text("3D 뷰")').first().click();
await p.waitForTimeout(1200);
await scrub(0.45);
await shot("05_3d_view_card");

// 에이전트 채팅
await p.getByRole("button", { name: /에이전트/ }).first().click();
await p.waitForTimeout(500);
const ta = p.locator("textarea").first();
await ta.fill("SSP 시나리오 전부 비교해줘");
await ta.press("Enter");
await p.waitForTimeout(1800);
await shot("06_agent_chat");

// 좌측 파라미터 + 고급 설정 펼침
await p.getByRole("button", { name: /파라미터/ }).first().click();
await p.waitForTimeout(400);
await p.getByText(/고급 설정/).click().catch(() => {});
await p.waitForTimeout(500);
await shot("07_params_advanced");

console.log("console errors:", errs.length);
errs.slice(0, 8).forEach((e) => console.log("  -", e.slice(0, 160)));
await b.close();
console.log("done");
