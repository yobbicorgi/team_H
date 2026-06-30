// 생성한 시나리오를 영속 저장/복원하는 클라이언트 헬퍼.
// 1순위: 서버 DB(/api/scenarios → database/scenarios.json) — src 복사 시 데이터 동행.
// 2순위(폴백): 브라우저 localStorage — 서버 라우트가 없는 정적 배포에서도 새로고침 유지.
import type { Scenario } from "@/backend/types";

const LS_KEY = "teamH.scenarios.v1";

// 저장 시 일시적인 running 상태는 queued로 환원(새로고침 후 '대기'로 깔끔히 복원).
function serialize(list: Scenario[]): Scenario[] {
  return list.map((s) =>
    s.status === "running" ? { ...s, status: "queued" as const, progress: 0 } : s
  );
}

export async function loadScenarios(): Promise<Scenario[]> {
  try {
    const res = await fetch("/api/scenarios", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data as Scenario[];
    }
  } catch {
    /* 서버 라우트 없음 → 폴백 */
  }
  try {
    const raw =
      typeof window !== "undefined" ? window.localStorage.getItem(LS_KEY) : null;
    if (raw) {
      const d = JSON.parse(raw);
      if (Array.isArray(d)) return d as Scenario[];
    }
  } catch {
    /* 무시 */
  }
  return [];
}

export async function saveScenarios(list: Scenario[]): Promise<void> {
  const data = serialize(list);
  try {
    if (typeof window !== "undefined")
      window.localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    /* 무시 */
  }
  try {
    await fetch("/api/scenarios", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    /* 서버 없으면 localStorage만으로 유지 */
  }
}
