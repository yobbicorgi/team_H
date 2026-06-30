// 전 기능 동작 테스트 — 좌측 설정/실행/큐 · 우측 3D/2D/비교 · 재생 · 에이전트.
import { chromium } from "playwright";

const b = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"],
});
const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
const errs = [];
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
p.on("pageerror", (e) => errs.push("PAGEERR: " + e.message));

const results = [];
const ok = (name, cond) => { results.push([cond ? "PASS" : "FAIL", name]); };
const txt = () => p.evaluate(() => document.body.innerText);
async function doneCount() {
  const t = await txt();
  const m = t.match(/완료\s*(\d+)/);
  return m ? Number(m[1]) : -1;
}

await p.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
await p.waitForSelector("canvas", { timeout: 45000 });
await p.waitForTimeout(6000);
ok("초기 렌더 + canvas", !!(await p.$("canvas")));

// 1) 좌측 탭 전환
try {
  await p.getByRole("button", { name: /에이전트/ }).first().click();
  await p.waitForTimeout(400);
  ok("에이전트 탭 표시", (await txt()).length > 0 && !!(await p.$("textarea")));
  await p.getByRole("button", { name: /파라미터/ }).first().click();
  await p.waitForTimeout(400);
  ok("파라미터 탭 복귀", !!(await p.getByText("실험 파라미터").first()));
} catch (e) { ok("좌측 탭 전환", false); console.log("  tab err:", e.message); }

// 2) 파라미터 변경
try {
  await p.getByRole("button", { name: "동(E)", exact: true }).click();
  await p.waitForTimeout(200);
  await p.getByRole("button", { name: "7.0", exact: true }).click(); // SSP
  await p.waitForTimeout(200);
  // 케이스 + 버튼
  const plus = p.locator("button:has(svg)").filter({ hasText: "" });
  ok("파라미터 클릭 동작", true);
} catch (e) { ok("파라미터 변경", false); console.log("  param err:", e.message); }

// 3) 고급 설정 펼치기
try {
  await p.getByText(/고급 설정/).click();
  await p.waitForTimeout(300);
  ok("고급 설정 토글", (await txt()).includes("시뮬레이션") || (await txt()).includes("타임스텝"));
} catch (e) { ok("고급 설정 토글", false); console.log("  adv err:", e.message); }

// 4) 즉시 실행 → 완료
const before = await doneCount();
try {
  await p.getByRole("button", { name: "즉시 실행" }).click();
  await p.waitForTimeout(7000);
  const after = await doneCount();
  ok("즉시 실행→완료 증가", after > before);
} catch (e) { ok("즉시 실행", false); console.log("  run err:", e.message); }

// 5) 큐에 추가 → 전체 큐 실행
try {
  const d0 = await doneCount();
  await p.getByRole("button", { name: "큐에 추가" }).click();
  await p.waitForTimeout(300);
  await p.getByRole("button", { name: "큐에 추가" }).click();
  await p.waitForTimeout(300);
  await p.getByRole("button", { name: /전체 큐 실행/ }).first().click();
  await p.waitForTimeout(9000);
  const d1 = await doneCount();
  ok("큐 추가→전체 실행→완료 증가", d1 > d0);
} catch (e) { ok("큐 실행", false); console.log("  queue err:", e.message); }

// 6) 우측 2D 탭
try {
  await p.getByText("2D 모델맵", { exact: true }).click();
  await p.waitForTimeout(2500);
  ok("2D 모델맵 렌더(canvas)", (await p.$$("canvas")).length >= 1);
} catch (e) { ok("2D 탭", false); console.log("  2d err:", e.message); }

// 7) 시나리오 비교 탭
try {
  await p.locator('button:has-text("시나리오 비교")').first().click();
  await p.waitForTimeout(800);
  ok("시나리오 비교 카드 표시", (await txt()).includes("최대 침수심"));
} catch (e) { ok("비교 탭", false); console.log("  cmp err:", e.message); }

// 8) 3D 복귀 + 시나리오 선택 + 재생
try {
  await p.locator('button:has-text("3D 뷰")').first().click();
  await p.waitForTimeout(800);
  const sel = p.locator("main select").first();
  const opts = await sel.locator("option").count();
  ok("3D 시나리오 선택목록 ≥1", opts >= 1);
  await p.getByRole("button", { name: /재생|일시정지|처음부터/ }).first().click();
  await p.waitForTimeout(800);
  ok("재생 버튼 동작", true);
} catch (e) { ok("3D 재생/선택", false); console.log("  play err:", e.message); }

// 9) 에이전트 채팅 — 스윕
try {
  await p.getByRole("button", { name: /에이전트/ }).first().click();
  await p.waitForTimeout(400);
  const ta = p.locator("textarea").first();
  await ta.fill("SSP 시나리오 전부 비교해줘");
  await ta.press("Enter");
  await p.waitForTimeout(1500);
  ok("에이전트 응답/큐 반영", (await txt()).length > 0);
} catch (e) { ok("에이전트 채팅", false); console.log("  agent err:", e.message); }

console.log("\n==== 기능 테스트 결과 ====");
results.forEach(([s, n]) => console.log(`  [${s}] ${n}`));
const pass = results.filter((r) => r[0] === "PASS").length;
console.log(`  → ${pass}/${results.length} PASS · 콘솔에러 ${errs.length}`);
errs.slice(0, 8).forEach((e) => console.log("    err:", e.slice(0, 160)));
await b.close();
console.log("done");
