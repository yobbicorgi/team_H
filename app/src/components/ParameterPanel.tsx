import { Zap, Waves, Map, Plus, Minus, Play, SlidersHorizontal } from "lucide-react";
import {
  REGIONS,
  SSPS,
  DISTANCES,
  PERIODS,
  MANNING_MODES,
  DIRECTIONS,
  MAGNITUDES,
  type ScenarioParams,
} from "@/lib/types";
import { Button, Field, GroupLabel, SectionHeader, Segmented, Select, cn } from "./ui";

export function ParameterPanel({
  params,
  onChange,
  onRunSingle,
  onAddToQueue,
}: {
  params: ScenarioParams;
  onChange: (patch: Partial<ScenarioParams>) => void;
  onRunSingle: () => void;
  onAddToQueue: () => void;
}) {
  return (
    <section className="border-b border-border px-4 py-4">
      <SectionHeader
        title="실험 파라미터"
        right={
          <span className="inline-flex items-center gap-1 rounded-md bg-accent-soft px-2 py-0.5 text-[14px] font-semibold text-accent-hover ring-1 ring-inset ring-[#bcd9f2]">
            <SlidersHorizontal size={12} />
            backend 연동
          </span>
        }
      />

      {/* 지진원 (Tsunami source) */}
      <div className="mt-4 rounded-xl border border-border bg-panel-2 p-3.5">
        <GroupLabel icon={<Zap size={14} className="text-accent" />}>지진원 (Tsunami)</GroupLabel>
        <div className="space-y-3">
          <Field label="단층 방향">
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
          <Field label="Manning 계수" hint="육상부">
            <Segmented
              options={MANNING_MODES}
              value={params.manningMode}
              onChange={(v) => onChange({ manningMode: v as ScenarioParams["manningMode"] })}
            />
          </Field>
        </div>
      </div>

      {/* 실행 — 단일 / 다중(큐) 두 모드 */}
      <div className="mt-5 flex gap-2">
        <Button variant="primary" className="flex-1" onClick={onRunSingle}>
          <Play size={15} strokeWidth={2.4} />
          실행
        </Button>
        <Button variant="outline" className="flex-1" onClick={onAddToQueue}>
          <Plus size={15} strokeWidth={2.4} />
          큐에 추가
        </Button>
      </div>
      <p className="mt-2 text-[14px] leading-snug text-muted">
        <span className="font-medium text-ink-2">실행</span> = 이 설정 즉시 수행 ·{" "}
        <span className="font-medium text-ink-2">큐에 추가</span> 후 상단{" "}
        <span className="font-medium text-ink-2">전체 자동 실행</span>으로 여러 시나리오 일괄 수행
      </p>
    </section>
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
      <div className="tabular flex-1 text-center font-mono text-[15px] font-semibold text-ink">
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
