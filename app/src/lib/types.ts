// ───────────────────────────────────────────────────────────────
// 시나리오 파라미터 스키마 (프론트 임시 정의)
// ⚠️ 최종 필드/검증/기본값은 backend(Han)의 STEP_ANALYSIS 기반 JSON 스키마로 확정.
//    이 파일은 그 스키마가 나오면 교체/동기화한다. (PLAN.md 5절 인터페이스)
// ───────────────────────────────────────────────────────────────

// 시뮬레이션·시각화 대상 = 부산권(해운대·마린시티). 그 외는 모델 예시 지역(참고).
export const REGIONS = [
  { value: "Busan", label: "부산 · 해운대·마린시티" },
  { value: "Ulsan", label: "울산 (Ulsan)" },
  { value: "Jeju_north", label: "제주 북부 (Jeju_north)" },
  { value: "Jeju_south", label: "제주 남부 (Jeju_south)" },
  { value: "Jindo_Wando", label: "진도·완도 (Jindo_Wando)" },
] as const;

export const SSPS = ["2.6", "4.5", "7.0", "8.5"] as const;

export const DISTANCES = [
  { value: "near", label: "Near" },
  { value: "far", label: "Far" },
] as const;

export const PERIODS = [
  { value: "near", label: "Near · 2021–2040" },
  { value: "mid", label: "Mid · 2041–2060" },
  { value: "long", label: "Long · 2061–2080" },
  { value: "far", label: "Far · 2081–2100" },
] as const;

export const MANNING_MODES = [
  { value: "graded", label: "수심 차등" },
  { value: "uniform", label: "균일(0.15)" },
] as const;

// 지진원(지진해일 단층) — 01_Deform_Plane 시트(방향)·규모. 세부 단층값은 Excel.
export const DIRECTIONS = [
  { value: "EAST", label: "동(EAST)" },
  { value: "WEST", label: "서(WEST)" },
  { value: "SOUTH", label: "남(SOUTH)" },
] as const;

export const MAGNITUDES = [8.0, 8.5, 9.0] as const; // Mw

// 자동화 대상 10단계 — 진행상태 표시용 (파일명 대신 친화적 라벨)
export const PIPELINE_STEPS = [
  { code: "01", name: "지반 변형" },
  { code: "02", name: "해저 변위" },
  { code: "03", name: "격자 생성" },
  { code: "04", name: "조위 보정" },
  { code: "05", name: "노드 속성" },
  { code: "06", name: "해일 실행준비" },
  { code: "07", name: "해수면 시나리오" },
  { code: "08", name: "SLR 격자결합" },
  { code: "09", name: "수심+SLR 합산" },
  { code: "10", name: "최종 실행준비" },
] as const;

export type ScenarioParams = {
  // 지진원(Tsunami source)
  direction: string; // EAST | WEST | SOUTH (단층 방향 시트)
  mw: number; // 지진규모
  caseNo: number; // 지진해일 case 1~9
  // 해수면상승(SLR)
  ssp: string;
  distance: string;
  period: string;
  // 영역/격자
  region: string;
  manningMode: "uniform" | "graded";
};

export const DEFAULT_PARAMS: ScenarioParams = {
  direction: "SOUTH",
  mw: 9.0,
  caseNo: 1,
  ssp: "8.5",
  distance: "far",
  period: "far",
  region: "Busan",
  manningMode: "graded",
};

export type ScenarioStatus = "queued" | "running" | "done" | "failed";

// 시나리오 결과(Mock) — 실제로는 backend(Han) 수치모델 산출(최대 침수심/범람 등)로 대체
export type ScenarioResult = {
  maxDepth: number; // 최대 침수심 (m)
  floodedArea: number; // 침수 면적 (km²)
  affectedBuildings: number; // 침수 영향 건물 수 (추정)
};

export type Scenario = {
  id: string;
  params: ScenarioParams;
  status: ScenarioStatus;
  progress: number; // 0~100
  createdAt: number;
  result?: ScenarioResult;
};

// 파라미터로부터 결정론적 Mock 결과 생성 (데모 비교용 — 난수 미사용)
export function mockResult(p: ScenarioParams): ScenarioResult {
  const sspW: Record<string, number> = { "2.6": 0, "4.5": 0.5, "7.0": 1.0, "8.5": 1.5 };
  const base =
    1.4 +
    (sspW[p.ssp] ?? 0.8) +
    (p.distance === "far" ? 0.7 : 0) +
    (p.mw - 8) * 0.9 +
    p.caseNo * 0.12;
  const maxDepth = Math.round(base * 10) / 10;
  const floodedArea = Math.round(base * 1.8 * 10) / 10;
  const affectedBuildings = Math.round(base * 320);
  return { maxDepth, floodedArea, affectedBuildings };
}

export type ChatRole = "user" | "assistant";
export type ChatMessage = { id: string; role: ChatRole; text: string };

// 에이전트가 수행할 수 있는 액션(=함수호출 결과). 실제로는 Claude function-calling 툴에 매핑.
export type AgentAction =
  | { type: "set"; patch: Partial<ScenarioParams> } // 현재 파라미터 설정
  | { type: "queue"; scenarios: ScenarioParams[] } // 여러 실험을 큐에 추가(스윕/자동설계)
  | { type: "run"; mode: "single" | "all" }; // 실행(단일/전체)

export function regionLabel(value: string): string {
  return REGIONS.find((r) => r.value === value)?.label ?? value;
}

// 진행률(0~100) → 현재 단계 객체
export function stepAt(progress: number) {
  const i = Math.min(
    PIPELINE_STEPS.length - 1,
    Math.floor((progress / 100) * PIPELINE_STEPS.length)
  );
  return PIPELINE_STEPS[i];
}

// 진행률 → "06 해일 실행준비"
export function currentStep(progress: number): string {
  const s = stepAt(progress);
  return `${s.code} ${s.name}`;
}

// 파라미터 한 줄 요약 (큐/뷰 라벨)
export function summarize(p: ScenarioParams): string {
  return `${p.region} · SSP${p.ssp} · ${p.distance} · case ${p.caseNo}`;
}
