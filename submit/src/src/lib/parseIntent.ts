// ───────────────────────────────────────────────────────────────
// 에이전트 해석기 (로컬, 데모용) — 자연어 → 액션 목록 + 마크다운 응답
// 능력(=함수호출 툴): set_parameters / queue_scenarios(스윕·자동설계) / run
// ⚠️ 실제 제품: Claude API function-calling으로 교체. 이 파일은 그 툴들의
//    로컬 스탠드인. 툴 스키마는 AGENT_TOOLS 참고. (에이전트는 '설정·구성'만 하고
//    수치모델을 직접 실행하지 않는다 — 실행은 사용자/파이프라인 몫)
// ───────────────────────────────────────────────────────────────
import {
  REGIONS,
  SSPS,
  DISTANCES,
  PERIODS,
  MAGNITUDES,
  DIRECTIONS,
  type AgentAction,
  type ScenarioParams,
} from "@/backend/types";

type Dim = "ssp" | "case" | "direction" | "distance" | "region" | "mw" | "period";

const MAX_SCENARIOS = 12;

// 실제 Claude 연동 시 사용할 툴 스키마(문서/참고용)
export const AGENT_TOOLS = [
  {
    name: "set_parameters",
    description: "좌측 실험 파라미터를 설정한다(수치모델은 실행하지 않음).",
    input: "direction?, mw?, caseNo?, ssp?, distance?, period?, region?, manningMode?",
  },
  {
    name: "queue_scenarios",
    description:
      "여러 실험을 시나리오 큐에 추가한다. 한 차원(ssp/case/direction/distance/region/mw)을 펼치는 스윕 또는 직접 조합.",
    input: "scenarios: ScenarioParams[]  (또는 sweepDim + base)",
  },
  { name: "run", description: "실행한다.", input: "mode: 'single' | 'all'" },
] as const;

// ── 단일 파라미터 추출 ──
function extractPatch(text: string): Partial<ScenarioParams> {
  const patch: Partial<ScenarioParams> = {};

  for (const r of REGION_HINTS) {
    if (r.keys.some((k) => text.includes(k))) {
      patch.region = r.value;
      break;
    }
  }
  for (const s of SSPS) {
    if (text.includes(`ssp${s}`) || text.includes(`ssp ${s}`) || text.includes(s)) {
      patch.ssp = s;
      break;
    }
  }
  if (/\bfar\b|먼\s*거리|원거리|먼바다/.test(text)) patch.distance = "far";
  else if (/\bnear\b|가까|근거리|근접/.test(text)) patch.distance = "near";

  const caseMatch = text.match(/(?:case|케이스)\s*0*([1-9])(?!\s*[-~])/);
  if (caseMatch) patch.caseNo = Number(caseMatch[1]);

  if (/균일|uniform/.test(text)) patch.manningMode = "uniform";
  else if (/차등|graded/.test(text)) patch.manningMode = "graded";

  if (/\beast\b|동쪽|동향|방향\s*동/.test(text)) patch.direction = "EAST";
  else if (/\bwest\b|서쪽|서향|방향\s*서/.test(text)) patch.direction = "WEST";
  else if (/\bsouth\b|남쪽|남향|방향\s*남/.test(text)) patch.direction = "SOUTH";

  const mwMatch = text.match(/(?:규모|mw|magnitude)\s*0*([89](?:\.\d)?)/);
  if (mwMatch) {
    const v = Number(mwMatch[1]);
    patch.mw = [8.0, 8.5, 9.0].reduce((a, b) =>
      Math.abs(b - v) < Math.abs(a - v) ? b : a
    );
  }
  return patch;
}

const REGION_HINTS: { value: string; keys: string[] }[] = [
  { value: "Haeundae", keys: ["haeundae", "해운대"] },
  { value: "MarineCity", keys: ["marinecity", "marine", "마린시티", "마린"] },
  { value: "Busan", keys: ["busan", "부산", "전체"] },
];

// ── 차원별 전체 값 ──
function dimValues(dim: Dim): Partial<ScenarioParams>[] {
  switch (dim) {
    case "ssp":
      return SSPS.map((v) => ({ ssp: v }));
    case "case":
      return [1, 2, 3, 4, 5, 6, 7, 8, 9].map((v) => ({ caseNo: v }));
    case "direction":
      return DIRECTIONS.map((d) => ({ direction: d.value }));
    case "distance":
      return DISTANCES.map((d) => ({ distance: d.value }));
    case "region":
      return REGIONS.map((r) => ({ region: r.value }));
    case "mw":
      return MAGNITUDES.map((v) => ({ mw: v }));
    case "period":
      return PERIODS.map((p) => ({ period: p.value }));
  }
}

// ── 스윕 감지 (전부 키워드 OR 명시적 값 목록 ≥2개) ──
function detectSweeps(text: string): { dim: Dim; values: Partial<ScenarioParams>[] }[] {
  const out: { dim: Dim; values: Partial<ScenarioParams>[] }[] = [];
  // '전부/전체/모두'만 전 범위 스윕. '비교'는 전 범위로 보지 않음(지정한 값 목록 존중).
  const all = /(전부|전체|모두|스윕|sweep|각각|골고루)/.test(text);
  const uniq = <T,>(a: T[]) => [...new Set(a)];

  // SSP
  if (/ssp/.test(text) && all) out.push({ dim: "ssp", values: dimValues("ssp") });
  else {
    const found = SSPS.filter((s) => text.includes(s));
    if (found.length >= 2) out.push({ dim: "ssp", values: found.map((v) => ({ ssp: v })) });
  }

  // 케이스 — 범위 / 전부 / 목록
  const range = text.match(/케이스\s*([1-9])\s*[-~]\s*([1-9])/);
  if (range) {
    const lo = Math.min(+range[1], +range[2]);
    const hi = Math.max(+range[1], +range[2]);
    out.push({
      dim: "case",
      values: Array.from({ length: hi - lo + 1 }, (_, i) => ({ caseNo: lo + i })),
    });
  } else if (/케이스/.test(text) && all) {
    out.push({ dim: "case", values: dimValues("case") });
  } else {
    // "케이스 1 3 5" / "케이스 1, 3" 등 다중 숫자
    const m = text.match(/케이스\s*([1-9](?:[\s,.및과·]+[1-9])*)/);
    const nums = m ? uniq((m[1].match(/[1-9]/g) ?? []).map(Number)) : [];
    if (nums.length >= 2) out.push({ dim: "case", values: nums.map((c) => ({ caseNo: c })) });
  }

  // 방향 — 전부 / 목록
  if (/(방향|동서남)/.test(text) && all) {
    out.push({ dim: "direction", values: dimValues("direction") });
  } else {
    const dirs: string[] = [];
    if (/\beast\b|동쪽|동향/.test(text)) dirs.push("EAST");
    if (/\bwest\b|서쪽|서향/.test(text)) dirs.push("WEST");
    if (/\bsouth\b|남쪽|남향/.test(text)) dirs.push("SOUTH");
    if (dirs.length >= 2) out.push({ dim: "direction", values: dirs.map((d) => ({ direction: d })) });
  }

  // 거리 — 전부/둘다 / near+far 동시 언급
  if (/거리/.test(text) && (all || /둘\s*다/.test(text))) {
    out.push({ dim: "distance", values: dimValues("distance") });
  } else {
    const ds: string[] = [];
    if (/\bnear\b|가까|근거리|근접/.test(text)) ds.push("near");
    if (/\bfar\b|먼|원거리|먼바다/.test(text)) ds.push("far");
    if (ds.length >= 2) out.push({ dim: "distance", values: ds.map((d) => ({ distance: d })) });
  }

  // 지역 — 전부 / 목록
  if (/지역/.test(text) && all) {
    out.push({ dim: "region", values: dimValues("region") });
  } else {
    const regs = uniq(
      REGION_HINTS.filter((r) => r.keys.some((k) => text.includes(k))).map((r) => r.value)
    );
    if (regs.length >= 2) out.push({ dim: "region", values: regs.map((r) => ({ region: r })) });
  }

  // 규모 — 전부 / 목록
  if (/(규모|mw)/.test(text) && all) {
    out.push({ dim: "mw", values: dimValues("mw") });
  } else {
    const ms = uniq(MAGNITUDES.filter((m) => text.includes(m.toFixed(1))));
    if (ms.length >= 2) out.push({ dim: "mw", values: ms.map((m) => ({ mw: m })) });
  }

  return out;
}

function buildScenarios(
  base: ScenarioParams,
  sweeps: { dim: Dim; values: Partial<ScenarioParams>[] }[]
): ScenarioParams[] {
  let combos: Partial<ScenarioParams>[] = [{}];
  for (const sw of sweeps) {
    const next: Partial<ScenarioParams>[] = [];
    for (const c of combos) for (const v of sw.values) next.push({ ...c, ...v });
    combos = next;
  }
  return combos.map((c) => ({ ...base, ...c }));
}

// 다양한 실험 자동 설계: SSP 4종 × 거리 2종 (기후·거리 민감도)
function autoDesign(base: ScenarioParams): ScenarioParams[] {
  return buildScenarios(base, [
    { dim: "ssp", values: dimValues("ssp") },
    { dim: "distance", values: dimValues("distance") },
  ]);
}

export function interpret(
  textRaw: string,
  base: ScenarioParams
): { actions: AgentAction[]; reply: string } {
  const text = textRaw.toLowerCase();
  const actions: AgentAction[] = [];

  const patch = extractPatch(text);
  const workBase: ScenarioParams = { ...base, ...patch };

  const sweeps = detectSweeps(text);
  const wantAuto =
    sweeps.length === 0 && /알아서|다양하게|여러\s*가지|자동\s*설계|추천/.test(text);

  let queued: ScenarioParams[] | null = null;
  let truncated = false;

  if (sweeps.length) {
    let s = buildScenarios(workBase, sweeps);
    if (s.length > MAX_SCENARIOS) {
      s = s.slice(0, MAX_SCENARIOS);
      truncated = true;
    }
    queued = s;
    actions.push({ type: "queue", scenarios: s });
  } else if (wantAuto) {
    let s = autoDesign(workBase);
    if (s.length > MAX_SCENARIOS) {
      s = s.slice(0, MAX_SCENARIOS);
      truncated = true;
    }
    queued = s;
    actions.push({ type: "queue", scenarios: s });
  } else if (Object.keys(patch).length) {
    actions.push({ type: "set", patch });
  }

  const wantRun = /실행|돌려|수행|시작|run/.test(text);
  const wantAll = /(전부|전체|모두|일괄|싹|all)/.test(text);
  if (wantRun && (wantAll || queued)) actions.push({ type: "run", mode: "all" });
  else if (wantRun) actions.push({ type: "run", mode: "single" });

  return { actions, reply: buildReply({ actions, patch, queued, truncated }) };
}

// ── 마크다운 응답 (표·서식, 이모지 미사용) ──
function buildReply({
  actions,
  patch,
  queued,
  truncated,
}: {
  actions: AgentAction[];
  patch: Partial<ScenarioParams>;
  queued: ScenarioParams[] | null;
  truncated: boolean;
}): string {
  if (actions.length === 0) {
    return [
      "설정할 값을 찾지 못했어요. 이렇게 말씀해 주세요:",
      "",
      "- **단일 설정**: “남쪽 규모 9.0 케이스 3 SSP8.5 far 부산”",
      "- **여러 실험(스윕)**: “SSP 전부 비교”, “케이스 1~5”, “방향 전부”",
      "- **자동 설계**: “알아서 다양하게 만들어줘”",
      "- **실행**: “설정하고 실행”, “전부 자동 실행”",
    ].join("\n");
  }

  const runMode = actions.find((a) => a.type === "run") as
    | { type: "run"; mode: "single" | "all" }
    | undefined;
  const lines: string[] = [];

  if (queued) {
    lines.push(`**${queued.length}개 시나리오를 큐에 추가했습니다.**`);
    lines.push("");
    lines.push("| # | 지진원 | SLR | 지역 |");
    lines.push("|--:|---|---|---|");
    queued.forEach((p, i) => {
      lines.push(
        `| ${i + 1} | ${p.direction}·Mw${p.mw.toFixed(1)}·c${p.caseNo} | SSP${p.ssp}·${p.distance}·${p.period} | ${p.region} |`
      );
    });
    if (truncated) lines.push(`\n_상한 ${MAX_SCENARIOS}개까지만 추가했습니다._`);
  } else if (patch && Object.keys(patch).length) {
    lines.push("**파라미터를 설정했습니다.**");
    lines.push("");
    lines.push("| 항목 | 값 |");
    lines.push("|---|---|");
    if (patch.direction) lines.push(`| 단층 방향 | ${patch.direction} |`);
    if (patch.mw) lines.push(`| 지진규모 | Mw ${patch.mw.toFixed(1)} |`);
    if (patch.caseNo) lines.push(`| 케이스 | ${patch.caseNo} |`);
    if (patch.ssp) lines.push(`| SSP | ${patch.ssp} |`);
    if (patch.distance) lines.push(`| 거리 | ${patch.distance} |`);
    if (patch.period) lines.push(`| 기간 | ${patch.period} |`);
    if (patch.region) lines.push(`| 지역 | ${patch.region} |`);
    if (patch.manningMode)
      lines.push(`| Manning | ${patch.manningMode === "uniform" ? "균일" : "차등"} |`);
  }

  lines.push("");
  if (runMode?.mode === "all") lines.push("**전체 자동 실행을 시작합니다.**");
  else if (runMode?.mode === "single") lines.push("**실행을 시작합니다.**");
  else if (queued) lines.push("검토 후 상단 **전체 자동 실행**을 누르세요.");
  else lines.push("확인 후 **실행**(단일) 또는 **큐에 추가**(다중)를 누르세요.");

  return lines.join("\n");
}
