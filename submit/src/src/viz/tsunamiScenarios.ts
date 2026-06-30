// ───────────────────────────────────────────────────────────────
// 지진해일 시나리오 5종 + GPU 물 셰이더용 파라미터 매핑.
// 물리 근거(Han backend/physics/tsunami_sim.py): 선형 장파 전파 c=√(g·h),
//   Green's law 천해 증폭 (h_deep/h_shore)^0.25, 감쇠 다중파(주기≈20+2·Mw분),
//   침수심 = max(0, η − 지반고). 실제 침수범위는 셰이더가 DEM(dem.json)으로 판정.
// 좌표계: 씬 XZ(미터). +Z=남(외해), −Z=북(내륙). 쓰나미는 남→북 진입.
// ───────────────────────────────────────────────────────────────

export type TsunamiScenario = {
  id: string;
  name: string;
  subtitle: string;
  source: "SOUTH" | "EAST"; // 진앙 방면(외해)
  mw: number;
  ssp: string;
  distance: "near" | "far";
  arrival: number; // 0..1 — 파면이 해안에 닿는 정규화 시각
  peakDepth: number; // m — 최대 침수심
  runup: number; // 0..1 — 내륙 처오름 침투
  pulses: number; // 파 마루 개수
  durationMin: number; // 실제 표현 시간(분, HUD용)
};

// (미리 만든 5종 프리셋은 제거 — 좌측에서 사용자가 설정·실행한 시나리오를
//  paramsToTsunami()로 그대로 렌더한다.)

// ── 시나리오 → 물 셰이더 uniform 사양 ────────────────────────────
export type WaterSpec = {
  srcDir: [number, number]; // 정규화 진행방향 (씬 XZ, 외해→해안)
  srcDist: number; // 먼 발생원까지 거리(m) — 곡선(부채꼴) 파면 곡률
  baseHeight: number; // 정지 해수면(world Y, m)
  tsunamiAmp: number; // 마루 높이(m)
  drawdownAmp: number; // 선행 드로다운 깊이(m)
  crestWidth: number; // 마루 띠 반폭(m)
  drawWidth: number; // 드로다운 띠 폭(m)
  frontStart: number; // 진행축 s 시작(외해)
  frontEnd: number; // 진행축 s 끝(내륙)
  peakDepth: number; // 침수심 컬러 정규화 기준(m)
  pulses: number;
};

function norm2(x: number, z: number): [number, number] {
  const m = Math.hypot(x, z) || 1;
  return [x / m, z / m];
}

// 사용자 설정(ScenarioParams) → 렌더용 TsunamiScenario 파생(프리셋 없이 사용자값 그대로 반영).
// maxDepth가 주어지면(완료 결과) 그 값을 최대 침수심으로 사용 — 시나리오 비교와 일관.
import type { ScenarioParams } from "@/backend/types";
export function paramsToTsunami(p: ScenarioParams, maxDepth?: number): TsunamiScenario {
  const sspW: Record<string, number> = { "2.6": 0, "4.5": 0.5, "7.0": 1.0, "8.5": 1.5 };
  const base = 1.4 + (sspW[p.ssp] ?? 0.8) + (p.distance === "far" ? 0.7 : 0) + (p.mw - 8) * 0.9 + p.caseNo * 0.12;
  const peakDepth = Math.max(1.0, maxDepth != null ? maxDepth : Math.round(base * 10) / 10);
  const source: "SOUTH" | "EAST" = p.direction === "SOUTH" ? "SOUTH" : "EAST";
  const runup = Math.min(0.82, 0.22 + peakDepth / 9);
  const pulses = p.mw >= 9 ? 4 : p.mw >= 8.5 ? 3 : 2;
  const dirLabel = source === "EAST" ? "동해/일본" : "남해";
  return {
    id: "user",
    name: `${dirLabel} Mw${p.mw.toFixed(1)} · SSP${p.ssp}`,
    subtitle: `${source === "EAST" ? "동" : "남"}측 원거리 진앙 · case ${p.caseNo}`,
    source,
    mw: p.mw,
    ssp: p.ssp,
    distance: p.distance === "near" ? "near" : "far",
    arrival: 0.15,
    peakDepth,
    runup,
    pulses,
    durationMin: 60,
  };
}

export function scenarioWaterSpec(scn: TsunamiScenario, sizeW: number, sizeD: number): WaterSpec {
  // 진앙 방면: 남해=정남(+Z), 동해=남동(부산 기준 외해는 남/남동)
  const dir: [number, number] = scn.source === "EAST" ? norm2(-0.55, -1) : [0, -1];
  const hw = sizeW / 2, hd = sizeD / 2;
  // 먼 발생원(외해, -dir 방향) — 방사거리로 곡선 파면. 거리가 클수록 완만한 호.
  const srcDist = Math.max(6500, sizeD * 0.72);
  const sx = -dir[0] * srcDist, sz = -dir[1] * srcDist;
  const corners: [number, number][] = [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]];
  const ss = corners.map(([x, z]) => Math.hypot(x - sx, z - sz) - srcDist);
  const minS = Math.min(...ss), maxS = Math.max(...ss);
  const crestWidth = 185 + scn.peakDepth * 22;
  const sspW: Record<string, number> = { "2.6": 0, "4.5": 0.4, "7.0": 0.8, "8.5": 1.1 };
  const baseHeight = 1.3 + (sspW[scn.ssp] ?? 0.5) * 0.5; // 정상 해수면(+SSP·SLR). 이 높이까지는 바다색(침수색 X)
  return {
    srcDir: dir,
    srcDist,
    baseHeight,
    tsunamiAmp: scn.peakDepth,
    drawdownAmp: scn.peakDepth * 0.42,
    crestWidth,
    drawWidth: 300,
    frontStart: minS - crestWidth * 2,
    frontEnd: minS + (maxS - minS) * (0.64 + scn.runup * 0.3),
    peakDepth: Math.max(2.5, scn.peakDepth),
    pulses: scn.pulses,
  };
}

// 침수심 → 위험 컬러(작업현황 DEPTH_RISK / 범례와 동일 스톱). [r,g,b] 0..1
const RISK: { d: number; c: [number, number, number] }[] = [
  { d: 0.0, c: [0.173, 0.498, 0.722] }, // #2c7fb8
  { d: 0.3, c: [0.498, 0.804, 0.733] }, // #7fcdbb
  { d: 0.5, c: [0.992, 0.682, 0.380] }, // #fdae61
  { d: 1.0, c: [0.957, 0.427, 0.263] }, // #f46d43
  { d: 2.5, c: [0.843, 0.188, 0.153] }, // #d73027
  { d: 4.0, c: [0.478, 0.004, 0.467] }, // #7a0177
];
export function depthColor(depth: number): [number, number, number] {
  const d = Math.max(0, depth);
  for (let i = 0; i < RISK.length - 1; i++) {
    const a = RISK[i], b = RISK[i + 1];
    if (d <= b.d) {
      const f = (d - a.d) / (b.d - a.d + 1e-6);
      return [
        a.c[0] + (b.c[0] - a.c[0]) * f,
        a.c[1] + (b.c[1] - a.c[1]) * f,
        a.c[2] + (b.c[2] - a.c[2]) * f,
      ];
    }
  }
  return RISK[RISK.length - 1].c;
}
