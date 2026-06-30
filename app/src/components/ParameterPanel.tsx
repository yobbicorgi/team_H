import { SlidersHorizontal, Plus, Minus } from "lucide-react";
import {
  REGIONS,
  SSPS,
  DISTANCES,
  PERIODS,
  MANNING_MODES,
  type ScenarioParams,
} from "@/lib/types";
import { Field, SectionHeader, Segmented, Select, cn } from "./ui";

export function ParameterPanel({
  params,
  onChange,
}: {
  params: ScenarioParams;
  onChange: (patch: Partial<ScenarioParams>) => void;
}) {
  return (
    <section className="border-b border-border px-4 py-4">
      <SectionHeader
        title="실험 파라미터"
        desc="수치모델 시나리오 설정값"
        right={
          <span className="flex items-center gap-1 rounded bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent">
            <SlidersHorizontal size={11} />
            backend 스키마 연동
          </span>
        }
      />

      <div className="mt-4 space-y-3.5">
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

        <Field label="SSP 시나리오" hint="해수면 상승">
          <Segmented
            options={SSPS}
            value={params.ssp}
            onChange={(v) => onChange({ ssp: v })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="거리">
            <Segmented
              options={DISTANCES}
              value={params.distance}
              onChange={(v) => onChange({ distance: v })}
            />
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

        <Field label="Manning 계수" hint="육상부 처리">
          <Segmented
            options={MANNING_MODES}
            value={params.manningMode}
            onChange={(v) => onChange({ manningMode: v as ScenarioParams["manningMode"] })}
          />
        </Field>
      </div>
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
    <div className="flex h-9 items-center rounded-md border border-border-strong bg-panel">
      <StepBtn onClick={() => onChange(clamp(value - 1))} disabled={value <= min}>
        <Minus size={13} />
      </StepBtn>
      <div className="tabular flex-1 text-center text-[13px] font-medium text-ink">
        {value}
      </div>
      <StepBtn onClick={() => onChange(clamp(value + 1))} disabled={value >= max}>
        <Plus size={13} />
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
        "flex h-full w-9 items-center justify-center text-muted transition-colors",
        "hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
      )}
    >
      {children}
    </button>
  );
}
