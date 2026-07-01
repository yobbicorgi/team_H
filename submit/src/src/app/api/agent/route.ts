// 실제 Claude 연동 — 사용자 구독 CLI(`claude -p`)를 서버에서 실행해 자연어 요청을
// 유효 파라미터(JSON)로 매핑한다. claude CLI가 없으면 프런트가 로컬 파서로 폴백.
import { spawn } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import os from "node:os";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYS = `너는 지진해일 시뮬레이션 콘솔의 '파라미터 설정 에이전트'다.
사용자의 한국어/영어 요청을 아래 스키마의 값으로 정확히 매핑해, 오직 JSON 하나만 출력한다(설명·코드펜스 금지).

유효값:
- direction(단층 발생 해역 방위) — 아래 매핑을 반드시 지켜라(절대 혼동 금지):
    "남"·"남해"·"남쪽"·"대한해협"·"쓰시마" → "SOUTH"
    "동"·"동해"·"일본" → "EAST"
    "서"·"서해"·"황해" → "WEST"
- mw: 8.0 | 8.5 | 9.0
- caseNo: 1~9 정수
- ssp: "2.6" | "4.5" | "7.0" | "8.5"
- period: "near"(근미래) | "mid"(중기) | "long"(장기) | "far"(원미래)
- region: "Busan" | "Haeundae" | "MarineCity"
- manningMode: "graded" | "uniform"

출력 형식(JSON):
{
  "set":   { 사용자가 지정한 필드만 },      // 현재 파라미터에 반영. 없으면 {}
  "queue": [ { 필드들 }, ... ],             // 여러 실험(스윕/목록)일 때만. 없으면 []
  "run":   "single" | "all" | null,         // 실행 요청이면. 단일=single, 전체/일괄=all
  "reply": "한국어 짧은 요약(마크다운 가능)"
}

규칙:
- 사용자가 말한 값만 넣어라. 지정 안 한 필드는 절대 넣지 마라(기본값은 시스템이 채운다).
- "SSP 전부", "케이스 1~5", "방향 전부", "여러 개 비교"처럼 여러 값이면 queue에 그 조합(곱집합)을 펼쳐라(최대 12개).
- 단일 조건이면 set에 넣어라. "실행/돌려/수행/시작"이 있으면 run 설정(스윕/큐면 all, 단일이면 single).
- 애매하면 가장 가까운 유효값으로 정규화(예: 규모 큰→9.0, 약한→8.0, 일본쪽→EAST).
- 반드시 유효한 JSON만. 코드펜스(\`\`\`) 쓰지 마라.`;

function runClaude(fullPrompt: string, timeoutMs = 90000): Promise<string> {
  // 프롬프트를 UTF-8 임시파일에 쓰고 `< file`로 주입 → Windows cmd 파이프의 한글 깨짐 방지.
  const tmp = join(os.tmpdir(), `agent-${process.pid}-${Date.now()}-${Math.floor(Math.random() * 1e6)}.txt`);
  writeFileSync(tmp, fullPrompt, "utf8");
  const cleanup = () => { try { unlinkSync(tmp); } catch { /* ignore */ } };
  return new Promise((resolve, reject) => {
    // shell:true → Windows claude.cmd도 PATH 해석. sonnet 고정(정확도). stdin은 파일 리다이렉션.
    const child = spawn(`claude -p --model sonnet --output-format json < "${tmp}"`, {
      shell: true,
      cwd: os.tmpdir(),
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "", err = "";
    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");
    const timer = setTimeout(() => { child.kill(); cleanup(); reject(new Error("timeout")); }, timeoutMs);
    child.stdout?.on("data", (d) => (out += d));
    child.stderr?.on("data", (d) => (err += d));
    child.on("error", (e) => { clearTimeout(timer); cleanup(); reject(e); }); // ENOENT = claude 미설치
    child.on("close", (code) => {
      clearTimeout(timer);
      cleanup();
      if (code === 0) resolve(out);
      else reject(new Error(`claude exit ${code}: ${err.slice(0, 200)}`));
    });
  });
}

function parseActions(stdout: string): unknown {
  let inner = stdout;
  let env: unknown = null;
  try { env = JSON.parse(stdout); } catch { /* 엔벌로프 아님 */ }
  if (env && typeof env === "object" && !Array.isArray(env)) {
    const e = env as Record<string, unknown>;
    if (e.is_error) throw new Error("claude reported error");
    if (typeof e.result === "string") inner = e.result;
  }
  const s = inner.indexOf("{"), t = inner.lastIndexOf("}");
  if (s < 0 || t <= s) throw new Error("no json in response");
  return JSON.parse(inner.slice(s, t + 1));
}

// 결정론적 안전망 — 사용자가 방위를 '명확히 하나만' 지정했으면 그 값으로 강제(모델 오매핑 방지)
function fixDirection(message: string, parsed: Record<string, unknown>): Record<string, unknown> {
  const t = message.toLowerCase();
  const dirs: string[] = [];
  if (/남해|남쪽|대한해협|쓰시마|대마도/.test(t)) dirs.push("SOUTH");
  if (/동해|일본|동쪽/.test(t)) dirs.push("EAST");
  if (/서해|황해|서쪽/.test(t)) dirs.push("WEST");
  if (dirs.length === 1) {
    if (parsed.set && typeof parsed.set === "object") (parsed.set as Record<string, unknown>).direction = dirs[0];
  }
  return parsed;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) return NextResponse.json({ ok: false, error: "no message" }, { status: 400 });
    const out = await runClaude(`${SYS}\n\n---\n[사용자 요청]\n${message}`);
    const parsed = fixDirection(message, parseActions(out) as Record<string, unknown>);
    return NextResponse.json({ ok: true, ...parsed });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String((e as Error)?.message || e) }, { status: 502 });
  }
}

// 헬스체크 — claude CLI 감지 여부(디버그용)
export async function GET() {
  try {
    const v = await new Promise<string>((resolve, reject) => {
      const c = spawn("claude", ["--version"], { shell: true });
      let o = "";
      const t = setTimeout(() => { c.kill(); reject(new Error("timeout")); }, 8000);
      c.stdout.on("data", (d) => (o += d));
      c.on("error", reject);
      c.on("close", (code) => { clearTimeout(t); code === 0 ? resolve(o.trim()) : reject(new Error("exit " + code)); });
    });
    return NextResponse.json({ available: true, version: v });
  } catch (e) {
    return NextResponse.json({ available: false, error: String((e as Error)?.message || e) });
  }
}
