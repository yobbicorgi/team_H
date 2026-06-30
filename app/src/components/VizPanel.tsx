"use client";

import { useState } from "react";
import { Box, BarChart3, MapPin, Info, Waves, Building2, Layers } from "lucide-react";
import { regionLabel, type Scenario, type ScenarioParams } from "@/lib/types";
import { StageRail } from "./StageRail";
import { cn } from "./ui";

const DEPTH = [
  { c: "#d8eef7", t: "0" },
  { c: "#a9d6ec", t: "0.5" },
  { c: "#6fb8de", t: "1" },
  { c: "#3a90c8", t: "2" },
  { c: "#1f63a6", t: "3" },
  { c: "#163e7a", t: "4" },
  { c: "#0d2a5c", t: "≥4" },
];

function depthColor(d: number): string {
  const stops = ["#d8eef7", "#a9d6ec", "#6fb8de", "#3a90c8", "#1f63a6", "#163e7a", "#0d2a5c"];
  const idx = Math.min(stops.length - 1, Math.max(0, Math.round((d / 5) * (stops.length - 1))));
  return stops[idx];
}

export function VizPanel({
  selected,
  doneScenarios,
}: {
  selected: Scenario | null;
  doneScenarios: Scenario[];
}) {
  const [tab, setTab] = useState<"view" | "compare">("view");

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-canvas">
      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-border bg-panel px-3">
        <Tab active={tab === "view"} icon={<Box size={15} />} label="3D 뷰" onClick={() => setTab("view")} />
        <Tab
          active={tab === "compare"}
          icon={<BarChart3 size={15} />}
          label="시나리오 비교"
          count={doneScenarios.length}
          onClick={() => setTab("compare")}
        />
        <div className="ml-auto flex items-center gap-1.5 pr-1 text-[14px] font-medium text-muted">
          <MapPin size={14} className="text-faint" />
          부산 · 마린시티 · 해운대해수욕장
        </div>
      </div>

      {tab === "view" ? (
        <ViewTab selected={selected} />
      ) : (
        <CompareTab scenarios={doneScenarios} />
      )}
    </main>
  );
}

/* ───────────────── 3D 뷰 ───────────────── */
function ViewTab({ selected }: { selected: Scenario | null }) {
  return (
    <div className="relative min-h-0 flex-1 p-4">
      <div className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-[#e7eef4]">
        <GridBackdrop />
        <Bezel />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-panel shadow-[0_1px_3px_rgba(10,37,64,0.10)]">
            <Box size={22} className="text-accent" strokeWidth={1.9} />
          </div>
          <div>
            <p className="text-[16px] font-semibold text-ink">지진해일 3D 침수 시뮬레이션</p>
            <p className="mx-auto mt-1 max-w-sm text-[14px] leading-relaxed text-muted">
              Kim · <span className="font-mono text-[14px] text-ink-2">viz/</span> 모듈이 이 영역에 마운트됩니다.
              위성·항공 basemap + 3D 건물 + 정밀 지형고도 + 침수 오버레이.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-warn-soft px-2.5 py-1 text-[14px] font-semibold text-warn ring-1 ring-inset ring-warn-ring">
            <Info size={13} />
            사용자 지정 조건 → Mock 데이터 생성 → 3D 시뮬레이션
          </span>
        </div>

        <Pin className="left-[30%] top-[70%]" label="마린시티" />
        <Pin className="left-[62%] top-[62%]" label="해운대" />
        <DepthLegend />

        {selected && (
          <div className="absolute left-4 top-4 w-60 rounded-lg border border-border bg-panel px-3 py-2.5 shadow-[0_1px_3px_rgba(10,37,64,0.10)]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[14px] font-semibold uppercase tracking-wide text-faint">
                표시 중
              </span>
              {selected.status === "running" ? (
                <span className="text-[14px] font-semibold text-accent">실행 중</span>
              ) : selected.status === "done" ? (
                <span className="text-[14px] font-semibold text-ok">완료</span>
              ) : (
                <span className="text-[14px] font-semibold text-muted">대기</span>
              )}
            </div>
            <div className="mt-0.5 text-[15px] font-semibold text-ink">
              {regionLabel(selected.params.region)}
            </div>
            <SourceLine p={selected.params} />
            {selected.status === "done" && selected.result && (
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <Metric label="최대 침수심" value={`${selected.result.maxDepth.toFixed(1)} m`} accent />
                <Metric label="침수 면적" value={`${selected.result.floodedArea.toFixed(1)} km²`} />
              </div>
            )}
          </div>
        )}

        {/* 시그니처: 10단계 파이프라인 레일 */}
        {selected && (
          <div className="absolute inset-x-4 bottom-4 rounded-lg border border-border bg-panel px-4 py-3 shadow-[0_1px_3px_rgba(10,37,64,0.10)]">
            <StageRail
              progress={selected.progress}
              done={selected.status === "done"}
            />
          </div>
        )}
      </div>
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
          <p className="text-[15px] font-semibold text-ink-2">비교할 완료 시나리오가 없습니다</p>
          <p className="max-w-xs text-[14px] leading-relaxed text-muted">
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
  return (
    <div className="rounded-xl border border-border bg-panel p-3.5 shadow-[0_1px_3px_rgba(10,37,64,0.06)]">
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-semibold text-ink">{regionLabel(s.params.region)}</span>
        <span
          className="h-3 w-3 rounded-sm ring-1 ring-inset ring-black/10"
          style={{ background: depthColor(r.maxDepth) }}
        />
      </div>
      <SourceLine p={s.params} />

      <div className="mt-3 flex items-end gap-1.5">
        <span className="tabular font-mono text-[26px] font-semibold leading-none text-ink">
          {r.maxDepth.toFixed(1)}
        </span>
        <span className="mb-0.5 text-[14px] text-muted">m 최대 침수심</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-panel-2">
        <div
          className="h-full rounded-full"
          style={{ width: `${(r.maxDepth / maxDepth) * 100}%`, background: depthColor(r.maxDepth) }}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Metric label="침수 면적" value={`${r.floodedArea.toFixed(1)} km²`} icon={<Waves size={13} />} />
        <Metric label="영향 건물" value={`${r.affectedBuildings.toLocaleString()}`} icon={<Building2 size={13} />} />
      </div>
    </div>
  );
}

/* ───────────────── 공용 ───────────────── */
function SourceLine({ p }: { p: ScenarioParams }) {
  return (
    <div className="tabular mt-1 font-mono text-[14px] text-muted">
      {p.direction}·Mw{p.mw.toFixed(1)}·c{p.caseNo} · SSP{p.ssp}·{p.distance}·{p.period}
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-md bg-panel-2 px-2 py-1.5 ring-1 ring-inset ring-border">
      <div className="flex items-center gap-1 text-[14px] text-muted">
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "tabular mt-0.5 font-mono text-[15px] font-semibold",
          accent ? "text-accent" : "text-ink"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function Tab({
  active,
  icon,
  label,
  count,
  onClick,
}: {
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[15px] font-semibold transition-colors",
        active ? "bg-accent-soft text-accent-hover" : "text-muted hover:bg-panel-2 hover:text-ink"
      )}
    >
      {icon}
      {label}
      {count !== undefined && count > 0 && (
        <span className="tabular rounded bg-panel px-1.5 font-mono text-[14px] ring-1 ring-inset ring-border">
          {count}
        </span>
      )}
    </button>
  );
}

function GridBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #cfe0ee 0%, #b9d2e7 100%)",
          clipPath: "polygon(0 58%, 22% 51%, 46% 61%, 68% 50%, 100% 46%, 100% 100%, 0 100%)",
          opacity: 0.9,
        }}
      />
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cdd9e3" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </>
  );
}

// 계기판 베젤 — 네 모서리 L자 등록마크
function Bezel() {
  const base = "absolute h-4 w-4 border-border-strong";
  return (
    <>
      <span className={cn(base, "left-2 top-2 border-l-2 border-t-2")} />
      <span className={cn(base, "right-2 top-2 border-r-2 border-t-2")} />
      <span className={cn(base, "bottom-2 left-2 border-b-2 border-l-2")} />
      <span className={cn(base, "bottom-2 right-2 border-b-2 border-r-2")} />
    </>
  );
}

function Pin({ className, label }: { className?: string; label: string }) {
  return (
    <div className={cn("absolute flex flex-col items-center", className)}>
      <MapPin size={20} className="text-accent" fill="#0e76c4" fillOpacity={0.2} />
      <span className="mt-0.5 rounded bg-panel px-1.5 py-0.5 text-[14px] font-semibold text-ink-2 ring-1 ring-inset ring-border">
        {label}
      </span>
    </div>
  );
}

function DepthLegend() {
  return (
    <div className="absolute right-4 top-4 rounded-lg border border-border bg-panel px-3 py-2 shadow-[0_1px_3px_rgba(10,37,64,0.10)]">
      <div className="mb-1.5 flex items-center gap-1 text-[14px] font-semibold text-ink-2">
        <Waves size={13} className="text-accent" />
        침수심 (m)
      </div>
      <div className="flex items-center">
        {DEPTH.map((s) => (
          <div key={s.t} className="flex w-8 flex-col items-center">
            <span className="h-3 w-full" style={{ background: s.c }} />
            <span className="tabular mt-1 font-mono text-[14px] text-muted">{s.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
