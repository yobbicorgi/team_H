// ───────────────────────────────────────────────────────────────
// 시나리오 파라미터 스키마 (프론트 임시 정의)
// ⚠️ 최종 필드/검증/기본값은 backend(Han)의 STEP_ANALYSIS 기반 JSON 스키마로 확정.
//    이 파일은 그 스키마가 나오면 교체/동기화한다. (PLAN.md 5절 인터페이스)
// ───────────────────────────────────────────────────────────────

export const REGIONS = [
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

// 자동화 대상 10단계 (earthquake_model_setting 폴더명) — 진행상태 표시용
export const PIPELINE_STEPS = [
  "01 Deform_Plane",
  "02 Tsu_xyz",
  "03 fort14",
  "04 MSL_to_AHHW",
  "05 fort13",
  "06 AHHW_RUN",
  "07 SLR_Scenario",
  "08 Tsunami_SLR_fort14",
  "09 AHHW_to_SLR",
  "10 SLR_RUN",
] as const;

export type ScenarioParams = {
  region: string;
  ssp: string;
  distance: string;
  period: string;
  caseNo: number; // 지진해일 case 1~9
  manningMode: "uniform" | "graded";
};

export const DEFAULT_PARAMS: ScenarioParams = {
  region: "Jindo_Wando",
  ssp: "8.5",
  distance: "far",
  period: "far",
  caseNo: 1,
  manningMode: "graded",
};

export type ScenarioStatus = "queued" | "running" | "done" | "failed";

export type Scenario = {
  id: string;
  params: ScenarioParams;
  status: ScenarioStatus;
  progress: number; // 0~100
  createdAt: number;
};

export type ChatRole = "user" | "assistant";
export type ChatMessage = { id: string; role: ChatRole; text: string };

export function regionLabel(value: string): string {
  return REGIONS.find((r) => r.value === value)?.label ?? value;
}

// 진행률(0~100) → 현재 수행 중인 단계 이름
export function currentStep(progress: number): string {
  const i = Math.min(
    PIPELINE_STEPS.length - 1,
    Math.floor((progress / 100) * PIPELINE_STEPS.length)
  );
  return PIPELINE_STEPS[i];
}

// 파라미터 한 줄 요약 (큐/뷰 라벨)
export function summarize(p: ScenarioParams): string {
  return `${p.region} · SSP${p.ssp} · ${p.distance} · case ${p.caseNo}`;
}
