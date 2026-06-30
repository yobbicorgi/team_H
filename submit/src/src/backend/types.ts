// ───────────────────────────────────────────────────────────────
// 시나리오 파라미터 스키마 (프론트 임시 정의)
// ⚠️ 최종 필드/검증/기본값은 backend(Han)의 STEP_ANALYSIS 기반 JSON 스키마로 확정.
//    이 파일은 그 스키마가 나오면 교체/동기화한다. (PLAN.md 5절 인터페이스)
// ───────────────────────────────────────────────────────────────

// 시뮬레이션·시각화 대상 = 부산권(해운대·마린시티).
export const REGIONS = [
  { value: "Busan", label: "부산 전체 (해운대·마린시티)" },
  { value: "Haeundae", label: "해운대 해수욕장" },
  { value: "MarineCity", label: "마린시티" },
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

// 지진원(지진해일 단층) 방위 — 부산 기준 원거리 진앙 방면. 세부 단층값은 Excel.
// from = 진앙이 위치한 방면(부산에서 멀리 떨어진 발생 해역).
export const DIRECTIONS = [
  { value: "EAST", label: "동(E)", from: "일본·동해" },
  { value: "WEST", label: "서(W)", from: "서해" },
  { value: "SOUTH", label: "남(S)", from: "남해·대한해협" },
] as const;

export function directionFrom(value: string): string {
  return DIRECTIONS.find((d) => d.value === value)?.from ?? "";
}

export const MAGNITUDES = [8.0, 8.5, 9.0] as const; // Mw

// 바닥마찰 유형 (ADCIRC NOLIBF)
export const NOLIBF_OPTIONS = [
  { value: 0, label: "선형" },
  { value: 1, label: "Manning" },
  { value: 2, label: "하이브리드" },
] as const;

// 고급 설정 — ADCIRC fort.15 · STEP 세부 (Han fort15_params.py 대응). backend 연동 예정.
export type AdvancedParams = {
  rnday: number; // 시뮬레이션 기간 (일)
  dtdp: number; // 타임스텝 (초)
  rampDays: number; // 램프업 (일)
  h0: number; // 최소 수심 (m)
  nolibf: number; // 바닥마찰 (0 선형 / 1 Manning / 2 하이브리드)
  fort63Min: number; // 전격자 수면 출력 간격 (분)
  fort61Min: number; // 관측소 출력 간격 (분)
  fort64: boolean; // 유속 출력 (fort.64)
  maxele: boolean; // 최대수면 출력 (maxele)
  avgStartYear: number; // SLR 평균 시작 연도 (STEP07)
  avgEndYear: number; // SLR 평균 종료 연도
  searchRadiusKm: number; // MSL 보정 반경 km (STEP04)
  stationCount: number; // 관측소 수 (마린시티·해운대·동백·외해 등)
};

export const DEFAULT_ADVANCED: AdvancedParams = {
  rnday: 1.0,
  dtdp: 2.0,
  rampDays: 0.5,
  h0: 0.05,
  nolibf: 1,
  fort63Min: 10,
  fort61Min: 1,
  fort64: false,
  maxele: true,
  avgStartYear: 2021,
  avgEndYear: 2040,
  searchRadiusKm: 10,
  stationCount: 5,
};

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
  // 고급(ADCIRC·STEP 세부)
  advanced: AdvancedParams;
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
  advanced: DEFAULT_ADVANCED,
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
  archived?: boolean; // 큐에서 '완료 비우기' 했지만 우측 뷰어에서는 계속 조회 가능
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
