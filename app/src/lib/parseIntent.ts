// ───────────────────────────────────────────────────────────────
// 에이전트 채팅 → 파라미터 셋팅 (로컬 키워드 파서, 데모용)
// ⚠️ 실제 제품에서는 Claude API function-calling으로 대체:
//    사용자 발화 → 모델이 set_parameters(region, ssp, ...) 툴 호출 →
//    그 인자로 좌측 폼을 채움. 여기서는 의존성 없이 흐름만 보여주는 간이 파서.
//    (에이전트는 '셋팅값'만 설정하고 모델을 직접 실행하지 않는다 — 주제 규칙)
// ───────────────────────────────────────────────────────────────
import {
  REGIONS,
  SSPS,
  type ScenarioParams,
} from "./types";

export type Intent = {
  patch: Partial<ScenarioParams>;
  reply: string;
};

const REGION_HINTS: { value: string; keys: string[] }[] = [
  { value: "Ulsan", keys: ["ulsan", "울산"] },
  { value: "Jeju_north", keys: ["jeju_north", "제주 북", "제주북", "북제주"] },
  { value: "Jeju_south", keys: ["jeju_south", "제주 남", "제주남", "남제주"] },
  { value: "Jindo_Wando", keys: ["jindo", "wando", "진도", "완도"] },
];

export function parseIntent(textRaw: string): Intent {
  const text = textRaw.toLowerCase();
  const patch: Partial<ScenarioParams> = {};

  // 지역
  for (const r of REGION_HINTS) {
    if (r.keys.some((k) => text.includes(k))) {
      patch.region = r.value;
      break;
    }
  }

  // SSP (2.6 / 4.5 / 7.0 / 8.5)
  for (const s of SSPS) {
    if (text.includes(s) || text.includes(`ssp${s}`) || text.includes(`ssp ${s}`)) {
      patch.ssp = s;
      break;
    }
  }

  // 거리 near/far
  if (/\bfar\b|먼\s*거리|원거리|먼바다/.test(text)) patch.distance = "far";
  else if (/\bnear\b|가까|근거리|근접/.test(text)) patch.distance = "near";

  // 케이스 번호 1~9
  const caseMatch = text.match(/(?:case|케이스)\s*0*([1-9])/);
  if (caseMatch) patch.caseNo = Number(caseMatch[1]);

  // Manning 모드
  if (/균일|uniform/.test(text)) patch.manningMode = "uniform";
  else if (/차등|graded/.test(text)) patch.manningMode = "graded";

  const reply = buildReply(patch);
  return { patch, reply };
}

function buildReply(patch: Partial<ScenarioParams>): string {
  const parts: string[] = [];
  if (patch.region) {
    const label = REGIONS.find((r) => r.value === patch.region)?.label ?? patch.region;
    parts.push(`지역 ${label}`);
  }
  if (patch.ssp) parts.push(`SSP ${patch.ssp}`);
  if (patch.distance) parts.push(`거리 ${patch.distance}`);
  if (patch.caseNo) parts.push(`케이스 ${patch.caseNo}`);
  if (patch.manningMode)
    parts.push(`Manning ${patch.manningMode === "uniform" ? "균일" : "차등"}`);

  if (parts.length === 0) {
    return (
      "설정할 값을 못 찾았어요. 예시처럼 말씀해 주세요 — " +
      "“SSP8.5 진도·완도, 케이스 3, far 시나리오로 설정해줘”. " +
      "(저는 좌측 파라미터를 채우기만 하고 모델을 직접 실행하지는 않아요.)"
    );
  }
  return (
    `좌측 파라미터를 다음으로 설정했어요 — ${parts.join(", ")}. ` +
    "확인 후 [실행]을 누르면 시나리오 큐에 추가됩니다."
  );
}
