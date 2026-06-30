"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Box,
  BarChart3,
  MapPin,
  Map,
  Waves,
  Building2,
  Layers,
  Play,
  Pause,
  ChevronDown,
} from "lucide-react";
import {
  regionLabel,
  currentStep,
  DEFAULT_PARAMS,
  type Scenario,
  type ScenarioParams,
} from "@/lib/types";
import { paramsToTsunami, type TsunamiScenario } from "@/lib/tsunamiScenarios";
import ModelMap2D from "./ModelMap2D";
import { cn } from "./ui";

const FloodTwin = dynamic(() => import("./FloodTwin"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#dbe6f1] text-[0.875rem] text-muted">
      3D 씬 로딩 중…
    </div>
  ),
});

// 침수심 위험 컬러 범례 (3D와 동일 — DEPTH_RISK)
const DEPTH = [
  { c: "#2c7fb8", t: "0" },
  { c: "#7fcdbb", t: "0.3" },
  { c: "#fdae61", t: "0.5" },
  { c: "#f46d43", t: "1" },
  { c: "#d73027", t: "2.5" },
  { c: "#7a0177", t: "≥4" },
];

const SHORT_REGION: Record<string, string> = { Busan: "부산", Haeundae: "해운대", MarineCity: "마린시티" };
const PERIOD_SHORT: Record<string, string> = { near: "근미래", mid: "중기", long: "장기", far: "원미래" };

function scenarioLabel(s: Scenario): string {
  const p = s.params;
  const dir = p.direction === "SOUTH" ? "남" : p.direction === "EAST" ? "동" : "서";
  const md = s.result ? ` · ${s.result.maxDepth.toFixed(1)}m` : "";
  return `${dir}·Mw${p.mw.toFixed(1)}·SSP${p.ssp}·c${p.caseNo}·${PERIOD_SHORT[p.period] ?? p.period}${md}`;
}

export function VizPanel({
  selected,
  doneScenarios,
}: {
  selected: Scenario | null;
  doneScenarios: Scenario[];
}) {
  const [tab, setTab] = useState<"view" | "map2d" | "compare">("view");
  const [viewId, setViewId] = useState<string | null>(null);

  // 완료된 시나리오가 생기면 최신을 표시 대상으로 선택
  useEffect(() => {
    if (selected?.status === "done") setViewId(selected.id);
  }, [selected?.id, selected?.status]);
  useEffect(() => {
    if ((!viewId || !doneScenarios.some((s) => s.id === viewId)) && doneScenarios.length) {
      setViewId(doneScenarios[0].id);
    }
  }, [doneScenarios, viewId]);

  const current = doneScenarios.find((s) => s.id === viewId) ?? selected ?? null;
  const hasScenario = current != null; // 실행(중/완료)된 시나리오가 있는가
  const curParams: ScenarioParams = current?.params ?? DEFAULT_PARAMS;
  const tsn = paramsToTsunami(curParams, current?.result?.maxDepth);
  const mapScn = {
    source: (curParams.direction === "SOUTH" ? "SOUTH" : "EAST") as "SOUTH" | "EAST",
    mw: curParams.mw,
    ssp: curParams.ssp,
    caseNo: curParams.caseNo,
  };

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-canvas">
      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-border bg-panel px-3">
        <Tab active={tab === "view"} icon={<Box size={15} />} label="3D 뷰" onClick={() => setTab("view")} />
        <Tab active={tab === "map2d"} icon={<Map size={15} />} label="2D 모델맵" onClick={() => setTab("map2d")} />
        <Tab
          active={tab === "compare"}
          icon={<BarChart3 size={15} />}
          label="시나리오 비교"
          count={doneScenarios.length}
          onClick={() => setTab("compare")}
        />
        <div className="ml-auto flex items-center gap-1.5 pr-1 text-[0.875rem] font-medium text-muted">
          <MapPin size={14} className="text-faint" />
          부산 · 마린시티 · 해운대해수욕장
        </div>
      </div>

      {tab === "view" ? (
        <ViewTab
          tsn={tsn}
          current={current}
          curParams={curParams}
          hasScenario={hasScenario}
          list={doneScenarios}
          viewId={viewId}
          onPick={setViewId}
          selected={selected}
        />
      ) : tab === "map2d" ? (
        <Map2DTab scenario={mapScn} curParams={curParams} hasScenario={hasScenario} list={doneScenarios} viewId={viewId} onPick={setViewId} />
      ) : (
        <CompareTab scenarios={doneScenarios} />
      )}
    </main>
  );
}

/* ───────────────── 3D 뷰 (디지털 트윈) ───────────────── */
function ViewTab({
  tsn,
  current,
  curParams,
  hasScenario,
  list,
  viewId,
  onPick,
  selected,
}: {
  tsn: TsunamiScenario;
  current: Scenario | null;
  curParams: ScenarioParams;
  hasScenario: boolean;
  list: Scenario[];
  viewId: string | null;
  onPick: (id: string) => void;
  selected: Scenario | null;
}) {
  const [tNorm, setTNorm] = useState(0);
  const [playing, setPlaying] = useState(false);
  const tRef = useRef(0);
  const running = selected?.status === "running";

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setTNorm((p) => {
        const n = p + 0.006;
        if (n >= 1) { tRef.current = 1; setPlaying(false); return 1; }
        tRef.current = n;
        return n;
      });
    }, 40);
    return () => clearInterval(id);
  }, [playing]);

  const setT = (v: number) => { tRef.current = v; setTNorm(v); };
  const toggle = () => {
    if (!hasScenario) return; // 미실행 시 재생 불가
    if (!playing && tNorm >= 1) { setT(0); setPlaying(true); } // 끝까지 재생 후 다시 누르면 처음부터
    else setPlaying((p) => !p);
  };

  // 표시 시나리오가 새로 완료되면 처음부터 자동 재생
  const lastId = useRef<string | null>(null);
  useEffect(() => {
    if (current && current.status === "done" && lastId.current !== current.id) {
      lastId.current = current.id;
      setT(0);
      setPlaying(true);
    }
  }, [current?.id, current?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative min-h-0 flex-1">
      <FloodTwin scenario={tsn} timeRef={tRef} />

      {/* 시나리오 선택 + 주요 파라미터 (좌상단) */}
      <div className="pointer-events-auto absolute left-4 top-4 w-80 rounded-lg border border-border bg-panel/95 p-3 shadow-[0_2px_8px_rgba(10,37,64,0.12)] backdrop-blur-sm">
        <div className="mb-2 flex items-center gap-1.5 text-[0.875rem] font-semibold text-faint">
          <Waves size={13} className="text-accent" />
          수행 시나리오
        </div>
        <ScenarioPicker list={list} viewId={viewId} onPick={onPick} />
        {hasScenario ? (
          <>
            <p className="mt-1.5 text-[0.875rem] leading-snug text-muted">{tsn.subtitle}</p>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <Mini label="진앙" value={tsn.source === "EAST" ? "동해" : "남해"} />
              <Mini label="대상지역" value={SHORT_REGION[curParams.region] ?? regionLabel(curParams.region)} />
              <Mini label="규모" value={`Mw${curParams.mw.toFixed(1)}`} />
              <Mini label="SSP" value={curParams.ssp} />
              <Mini label="케이스" value={`#${curParams.caseNo}`} />
              <Mini label="분석기간" value={PERIOD_SHORT[curParams.period] ?? curParams.period} />
            </div>
            <div className="mt-1.5">
              <Mini label="최대 침수심" value={`${tsn.peakDepth.toFixed(1)} m`} accent />
            </div>
          </>
        ) : (
          <p className="mt-1.5 text-[0.875rem] leading-snug text-muted">
            좌측에서 파라미터를 설정하고 <span className="font-semibold text-ink-2">즉시 실행</span>하면 결과가 여기에 표시됩니다.
          </p>
        )}
      </div>

      {/* 침수심 범례 (우상단) */}
      <div className="absolute right-4 top-4 rounded-lg border border-border bg-panel/95 px-3 py-2 shadow-[0_2px_8px_rgba(10,37,64,0.12)] backdrop-blur-sm">
        <div className="mb-1.5 flex items-center gap-1 text-[0.875rem] font-semibold text-ink-2">
          <Waves size={13} className="text-accent" />
          침수심 (m)
        </div>
        <div className="flex items-center">
          {DEPTH.map((s) => (
            <div key={s.t} className="flex w-8 flex-col items-center">
              <span className="h-3 w-full" style={{ background: s.c }} />
              <span className="tabular mt-1 text-[0.875rem] text-muted">{s.t}</span>
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[0.8125rem] text-faint">
          <span>얕음 · 주의</span>
          <span>깊음 · 위험</span>
        </div>
      </div>

      {/* 재생 타임라인 (하단) — 실행된 시나리오가 있을 때만 */}
      <div className="absolute inset-x-4 bottom-4 rounded-lg border border-border bg-panel/95 px-4 py-3 shadow-[0_2px_8px_rgba(10,37,64,0.12)] backdrop-blur-sm">
        {hasScenario ? (
          <TwinPlayback
            tNorm={tNorm}
            playing={playing}
            durationMin={tsn.durationMin}
            onToggle={toggle}
            onScrub={setT}
          />
        ) : (
          <div className="flex items-center justify-center gap-1.5 py-1 text-[0.875rem] text-muted">
            <Play size={13} />
            시나리오를 실행하면 시간별 침수가 재생됩니다
          </div>
        )}
      </div>

      {/* 수치모델 진행 — 비차단 배지(작업 계속 가능). 상세 진행은 좌측 큐에도 표시 */}
      {running && selected && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2 flex items-center gap-2 rounded-full border border-border bg-panel/95 px-3.5 py-1.5 shadow-[0_2px_8px_rgba(10,37,64,0.12)] backdrop-blur-sm">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke="#e1eff9" strokeWidth="3" />
            <circle cx="12" cy="12" r="9" stroke="#0e76c4" strokeWidth="3" strokeLinecap="round" strokeDasharray="18 60" />
          </svg>
          <span className="tabular text-[0.875rem] font-medium text-ink-2">
            수치모델 진행 중 · {currentStep(selected.progress)} · {Math.round(selected.progress)}%
          </span>
        </div>
      )}
    </div>
  );
}

/* ───────────────── 2D 모델맵 탭 ───────────────── */
function Map2DTab({
  scenario,
  curParams,
  hasScenario,
  list,
  viewId,
  onPick,
}: {
  scenario: { source: "SOUTH" | "EAST"; mw: number; ssp: string; caseNo: number };
  curParams: ScenarioParams;
  hasScenario: boolean;
  list: Scenario[];
  viewId: string | null;
  onPick: (id: string) => void;
}) {
  return (
    <div className="relative min-h-0 flex-1">
      <ModelMap2D scenario={scenario} />
      <div className="pointer-events-auto absolute left-4 top-4 w-80 rounded-lg border border-border bg-panel/95 p-3 shadow-[0_2px_8px_rgba(10,37,64,0.12)] backdrop-blur-sm">
        <div className="mb-2 flex items-center gap-1.5 text-[0.875rem] font-semibold text-faint">
          <Map size={13} className="text-accent" />
          수행 시나리오
        </div>
        <ScenarioPicker list={list} viewId={viewId} onPick={onPick} />
        {hasScenario && (
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <Mini label="진앙" value={scenario.source === "EAST" ? "동해" : "남해"} />
            <Mini label="대상지역" value={SHORT_REGION[curParams.region] ?? regionLabel(curParams.region)} />
            <Mini label="규모" value={`Mw${scenario.mw.toFixed(1)}`} />
          </div>
        )}
      </div>
    </div>
  );
}

function ScenarioPicker({
  list,
  viewId,
  onPick,
}: {
  list: Scenario[];
  viewId: string | null;
  onPick: (id: string) => void;
}) {
  if (list.length === 0) {
    return (
      <div className="flex h-9 items-center rounded-lg border border-dashed border-border-strong bg-panel-2 px-2.5 text-[0.875rem] text-muted">
        실행된 시나리오 없음 — 좌측에서 실행하세요
      </div>
    );
  }
  return (
    <div className="relative">
      <select
        value={viewId ?? ""}
        onChange={(e) => onPick(e.target.value)}
        className="h-9 w-full appearance-none rounded-lg border border-border-strong bg-panel pl-2.5 pr-9 text-[0.875rem] font-semibold text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
      >
        {list.map((s) => (
          <option key={s.id} value={s.id}>{scenarioLabel(s)}</option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
    </div>
  );
}

function Mini({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md bg-panel-2 px-2 py-1 ring-1 ring-inset ring-border">
      <div className="text-[0.875rem] text-faint">{label}</div>
      <div className={cn("tabular text-[0.875rem] font-semibold", accent ? "text-accent" : "text-ink")}>{value}</div>
    </div>
  );
}

function TwinPlayback({
  tNorm,
  playing,
  durationMin,
  onToggle,
  onScrub,
}: {
  tNorm: number;
  playing: boolean;
  durationMin: number;
  onToggle: () => void;
  onScrub: (v: number) => void;
}) {
  const fmt = (norm: number) => {
    const m = norm * durationMin;
    return `${String(Math.floor(m)).padStart(2, "0")}:${String(Math.round((m % 1) * 60)).padStart(2, "0")}`;
  };
  const ended = tNorm >= 1;
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onToggle}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-white shadow-[0_1px_2px_rgba(10,37,64,0.18)] hover:bg-accent-hover"
        aria-label={playing ? "일시정지" : ended ? "처음부터 재생" : "재생"}
      >
        {playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
      </button>
      <span className="tabular shrink-0 text-[0.875rem] font-semibold text-ink">{fmt(tNorm)}</span>
      <input
        type="range"
        min={0}
        max={1000}
        value={Math.round(tNorm * 1000)}
        onChange={(e) => onScrub(Number(e.target.value) / 1000)}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-border accent-[#0e76c4]"
      />
      <span className="tabular shrink-0 text-[0.875rem] text-muted">{fmt(1)}</span>
      <span className="shrink-0 rounded-md bg-accent-soft px-2 py-0.5 text-[0.875rem] font-semibold text-accent-hover ring-1 ring-inset ring-[#bcd9f2]">
        모의 파동 전파
      </span>
    </div>
  );
}

/* ───────────────── 시나리오 비교 ───────────────── */
function CompareTab({ scenarios }: { scenarios: Scenario[] }) {
  if (scenarios.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <Layers size={24} className="text-faint" />
          <p className="text-[0.938rem] font-semibold text-ink-2">비교할 완료 시나리오가 없습니다</p>
          <p className="max-w-xs text-[0.875rem] leading-relaxed text-muted">
            시나리오를 큐에 담아 <span className="font-semibold text-ink-2">전체 자동 실행</span>하면,
            완료된 결과들이 여기에서 나란히 비교됩니다.
          </p>
        </div>
      </div>
    );
  }
  const maxDepth = Math.max(...scenarios.map((s) => s.result?.maxDepth ?? 0), 1);
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        {scenarios.map((s) => (
          <CompareCard key={s.id} s={s} maxDepth={maxDepth} />
        ))}
      </div>
    </div>
  );
}

function CompareCard({ s, maxDepth }: { s: Scenario; maxDepth: number }) {
  const r = s.result!;
  const col = depthBarColor(r.maxDepth);
  return (
    <div className="rounded-xl border border-border bg-panel p-3.5 shadow-[0_1px_3px_rgba(10,37,64,0.06)]">
      <div className="flex items-center justify-between">
        <span className="text-[0.938rem] font-semibold text-ink">{regionLabel(s.params.region)}</span>
        <span className="h-3 w-3 rounded-sm ring-1 ring-inset ring-black/10" style={{ background: col }} />
      </div>
      <SourceLine p={s.params} />
      <div className="mt-3 flex items-end gap-1.5">
        <span className="tabular text-[1.625rem] font-semibold leading-none text-ink">{r.maxDepth.toFixed(1)}</span>
        <span className="mb-0.5 text-[0.875rem] text-muted">m 최대 침수심</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-panel-2">
        <div className="h-full rounded-full" style={{ width: `${(r.maxDepth / maxDepth) * 100}%`, background: col }} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Metric label="침수 면적" value={`${r.floodedArea.toFixed(1)} km²`} icon={<Waves size={13} />} />
        <Metric label="영향 건물" value={`${r.affectedBuildings.toLocaleString()}`} icon={<Building2 size={13} />} />
      </div>
    </div>
  );
}

function depthBarColor(d: number): string {
  if (d >= 4) return "#7a0177";
  if (d >= 2.5) return "#d73027";
  if (d >= 1) return "#f46d43";
  if (d >= 0.5) return "#fdae61";
  return "#2c7fb8";
}

function SourceLine({ p }: { p: ScenarioParams }) {
  return (
    <div className="tabular mt-1 text-[0.875rem] text-muted">
      {p.direction}·Mw{p.mw.toFixed(1)}·c{p.caseNo} · SSP{p.ssp}·{p.period}
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-md bg-panel-2 px-2 py-1.5 ring-1 ring-inset ring-border">
      <div className="flex items-center gap-1 text-[0.875rem] text-muted">{icon}{label}</div>
      <div className="tabular mt-0.5 text-[0.938rem] font-semibold text-ink">{value}</div>
    </div>
  );
}

function Tab({ active, icon, label, count, onClick }: {
  active?: boolean; icon: React.ReactNode; label: string; count?: number; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.938rem] font-semibold transition-colors",
        active ? "bg-accent-soft text-accent-hover" : "text-muted hover:bg-panel-2 hover:text-ink"
      )}
    >
      {icon}
      {label}
      {count !== undefined && count > 0 && (
        <span className="tabular rounded bg-panel px-1.5 text-[0.875rem] ring-1 ring-inset ring-border">{count}</span>
      )}
    </button>
  );
}
