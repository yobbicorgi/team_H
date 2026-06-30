"use client";

import { useState } from "react";
import {
  Zap,
  Waves,
  Map,
  Plus,
  Minus,
  Play,
  PlayCircle,
  SlidersHorizontal,
  Settings2,
  ChevronDown,
  Check,
} from "lucide-react";
import {
  REGIONS,
  SSPS,
  DISTANCES,
  PERIODS,
  MANNING_MODES,
  DIRECTIONS,
  MAGNITUDES,
  NOLIBF_OPTIONS,
  directionFrom,
  type AdvancedParams,
  type ScenarioParams,
} from "@/lib/types";
import { Button, Field, GroupLabel, SectionHeader, Segmented, Select, cn } from "./ui";

export function ParameterPanel({
  params,
  onChange,
  onRunSingle,
  onAddToQueue,
  onRunAll,
  queuedCount,
}: {
  params: ScenarioParams;
  onChange: (patch: Partial<ScenarioParams>) => void;
  onRunSingle: () => void;
  onAddToQueue: () => void;
  onRunAll: () => void;
  queuedCount: number;
}) {
  const [advOpen, setAdvOpen] = useState(false);
  const adv = params.advanced;
  const setAdv = (patch: Partial<AdvancedParams>) =>
    onChange({ advanced: { ...adv, ...patch } });

  return (
    <section className="border-b border-border px-4 py-4">
      <SectionHeader
        title="실험 파라미터"
        right={
          <span className="inline-flex items-center gap-1 rounded-md bg-accent-soft px-2 py-0.5 text-[0.875rem] font-semibold text-accent-hover ring-1 ring-inset ring-[#bcd9f2]">
            <SlidersHorizontal size={12} />
            backend 연동
          </span>
        }
      />

      {/* 지진원 (Tsunami source) — 부산 기준 원거리 진앙 */}
      <div className="mt-4 rounded-xl border border-border bg-panel-2 p-3.5">
        <GroupLabel icon={<Zap size={14} className="text-accent" />}>지진원 (Tsunami)</GroupLabel>
        <div className="space-y-3">
          <Field label="지진원 방향" hint={directionFrom(params.direction)}>
            <Segmented
              options={DIRECTIONS}
              value={params.direction}
              onChange={(v) => onChange({ direction: v })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="지진규모" hint="Mw">
              <Select
                value={String(params.mw)}
                onChange={(e) => onChange({ mw: Number(e.target.value) })}
              >
                {MAGNITUDES.map((m) => (
                  <option key={m} value={m}>
                    {m.toFixed(1)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="지진해일 케이스" hint="1–9">
              <Stepper
                value={params.caseNo}
                min={1}
                max={9}
                onChange={(v) => onChange({ caseNo: v })}
              />
            </Field>
          </div>
          <p className="text-[0.875rem] leading-snug text-muted">
            진앙은 부산에서 <span className="font-medium text-ink-2">원거리</span>({directionFrom(params.direction)} 방면) · 3D 뷰는 부산 국지 침수.
          </p>
        </div>
      </div>

      {/* 해수면 상승 (SLR) */}
      <div className="mt-3 rounded-xl border border-border bg-panel-2 p-3.5">
        <GroupLabel icon={<Waves size={14} className="text-accent" />}>해수면 상승 (SLR)</GroupLabel>
        <div className="space-y-3">
          <Field label="SSP 시나리오">
            <Segmented options={SSPS} value={params.ssp} onChange={(v) => onChange({ ssp: v })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="거리">
              <Segmented
                options={DISTANCES}
                value={params.distance}
                onChange={(v) => onChange({ distance: v })}
              />
            </Field>
            <Field label="분석 기간">
              <Select
                value={params.period}
                onChange={(e) => onChange({ period: e.target.value })}
              >
                {PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
      </div>

      {/* 영역·격자 */}
      <div className="mt-3 rounded-xl border border-border bg-panel-2 p-3.5">
        <GroupLabel icon={<Map size={14} className="text-accent" />}>영역 · 격자</GroupLabel>
        <div className="space-y-3">
          <Field label="대상 지역">
            <Select
              value={params.region}
              onChange={(e) => onChange({ region: e.target.value })}
            >
              {REGIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Manning 계수">
            <Segmented
              options={MANNING_MODES}
              value={params.manningMode}
              onChange={(v) => onChange({ manningMode: v as ScenarioParams["manningMode"] })}
            />
          </Field>
        </div>
      </div>

      {/* 고급 설정 (ADCIRC fort.15 · STEP 세부) — 접이식 */}
      <button
        type="button"
        onClick={() => setAdvOpen((o) => !o)}
        className="mt-3 flex w-full items-center justify-between rounded-xl border border-border bg-panel-2 px-3.5 py-2.5 transition-colors hover:bg-[#e6edf3]"
      >
        <span className="flex items-center gap-2">
          <span className="h-3.5 w-[3px] rounded-full bg-accent" />
          <Settings2 size={14} className="text-accent" />
          <span className="text-[0.875rem] font-semibold tracking-tight text-ink-2">
            고급 설정 · ADCIRC·STEP
          </span>
        </span>
        <ChevronDown
          size={16}
          className={cn("text-muted transition-transform", advOpen && "rotate-180")}
        />
      </button>

      {advOpen && (
        <div className="mt-2 space-y-4 rounded-xl border border-border bg-panel-2 p-3.5">
          <AdvGroup label="시뮬레이션 제어">
            <div className="grid grid-cols-2 gap-2.5">
              <NumField label="기간" unit="일" value={adv.rnday} step={0.25} onChange={(v) => setAdv({ rnday: v })} />
              <NumField label="타임스텝" unit="s" value={adv.dtdp} step={0.5} onChange={(v) => setAdv({ dtdp: v })} />
              <NumField label="램프업" unit="일" value={adv.rampDays} step={0.1} onChange={(v) => setAdv({ rampDays: v })} />
              <NumField label="최소수심" unit="m" value={adv.h0} step={0.01} onChange={(v) => setAdv({ h0: v })} />
            </div>
            <Field label="바닥마찰 (NOLIBF)">
              <Select value={String(adv.nolibf)} onChange={(e) => setAdv({ nolibf: Number(e.target.value) })}>
                {NOLIBF_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
          </AdvGroup>

          <AdvGroup label="출력 제어">
            <div className="grid grid-cols-2 gap-2.5">
              <NumField label="전격자(fort.63)" unit="분" value={adv.fort63Min} step={1} onChange={(v) => setAdv({ fort63Min: v })} />
              <NumField label="관측소(fort.61)" unit="분" value={adv.fort61Min} step={1} onChange={(v) => setAdv({ fort61Min: v })} />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Toggle label="유속 (fort.64)" checked={adv.fort64} onChange={(v) => setAdv({ fort64: v })} />
              <Toggle label="최대수면 (maxele)" checked={adv.maxele} onChange={(v) => setAdv({ maxele: v })} />
            </div>
          </AdvGroup>

          <AdvGroup label="STEP 세부">
            <div className="grid grid-cols-2 gap-2.5">
              <NumField label="SLR 시작년" value={adv.avgStartYear} step={1} onChange={(v) => setAdv({ avgStartYear: v })} />
              <NumField label="SLR 종료년" value={adv.avgEndYear} step={1} onChange={(v) => setAdv({ avgEndYear: v })} />
              <NumField label="MSL 반경" unit="km" value={adv.searchRadiusKm} step={1} onChange={(v) => setAdv({ searchRadiusKm: v })} />
              <NumField label="관측소 수" value={adv.stationCount} step={1} onChange={(v) => setAdv({ stationCount: v })} />
            </div>
          </AdvGroup>
        </div>
      )}

      {/* 실행 — 즉시 실행 / 큐에 추가 / 전체 큐 실행 */}
      <div className="mt-5 space-y-2">
        <div className="flex gap-2">
          <Button variant="primary" className="flex-1" onClick={onRunSingle}>
            <Play size={15} strokeWidth={2.4} />
            즉시 실행
          </Button>
          <Button variant="outline" className="flex-1" onClick={onAddToQueue}>
            <Plus size={15} strokeWidth={2.4} />
            큐에 추가
          </Button>
        </div>
        <button
          onClick={onRunAll}
          disabled={queuedCount === 0}
          className={cn(
            "flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-[0.875rem] font-semibold ring-1 ring-inset transition-colors",
            queuedCount > 0
              ? "bg-accent-soft text-accent-hover ring-[#bcd9f2] hover:bg-[#d3e6f8]"
              : "cursor-not-allowed bg-panel-2 text-faint ring-border"
          )}
        >
          <PlayCircle size={15} strokeWidth={2.3} />
          전체 큐 실행
          {queuedCount > 0 && <span className="tabular">({queuedCount})</span>}
        </button>
      </div>
    </section>
  );
}

function AdvGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div className="text-[0.875rem] font-semibold text-faint">{label}</div>
      {children}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  step = 1,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  unit?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[0.875rem] font-medium text-ink-2">{label}</span>
        {unit && <span className="text-[0.875rem] font-medium text-muted">{unit}</span>}
      </div>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9 w-full rounded-lg border border-border-strong bg-panel px-2.5 text-[0.875rem] text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "flex h-9 items-center justify-between rounded-lg border px-2.5 text-[0.875rem] font-medium transition-colors",
        checked
          ? "border-accent bg-accent-soft text-accent-hover"
          : "border-border-strong bg-panel text-muted hover:text-ink-2"
      )}
    >
      {label}
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded border",
          checked ? "border-accent bg-accent" : "border-border-strong bg-panel"
        )}
      >
        {checked && <Check size={12} className="text-white" strokeWidth={3} />}
      </span>
    </button>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div className="flex h-10 items-center rounded-lg border border-border-strong bg-panel">
      <StepBtn onClick={() => onChange(clamp(value - 1))} disabled={value <= min}>
        <Minus size={14} />
      </StepBtn>
      <div className="tabular flex-1 text-center text-[0.938rem] font-semibold text-ink">
        {value}
      </div>
      <StepBtn onClick={() => onChange(clamp(value + 1))} disabled={value >= max}>
        <Plus size={14} />
      </StepBtn>
    </div>
  );
}

function StepBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-full w-10 items-center justify-center text-muted transition-colors",
        "hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
      )}
    >
      {children}
    </button>
  );
}
