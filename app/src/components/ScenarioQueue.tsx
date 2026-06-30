import { ListChecks, Layers } from "lucide-react";
import {
  currentStep,
  regionLabel,
  type Scenario,
  type ScenarioStatus,
} from "@/lib/types";
import { SectionHeader, cn } from "./ui";

export function ScenarioQueue({
  scenarios,
  selectedId,
  onSelect,
}: {
  scenarios: Scenario[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="px-4 py-4">
      <SectionHeader
        title="시나리오 큐"
        desc="설정값으로 자동 수행되는 시나리오"
        right={
          <span className="tabular rounded bg-panel-2 px-1.5 py-0.5 text-[11px] font-medium text-muted">
            {scenarios.length}
          </span>
        }
      />

      {scenarios.length === 0 ? (
        <div className="mt-3 flex flex-col items-center gap-2 rounded-md border border-dashed border-border-strong bg-panel-2 px-4 py-7 text-center">
          <Layers size={20} className="text-faint" />
          <p className="text-[12px] leading-relaxed text-muted">
            추가된 시나리오가 없습니다.
            <br />
            파라미터 설정 후 <span className="font-medium text-ink-2">[시나리오 실행]</span>을 누르세요.
          </p>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {scenarios.map((s) => (
            <ScenarioRow
              key={s.id}
              s={s}
              selected={s.id === selectedId}
              onClick={() => onSelect(s.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ScenarioRow({
  s,
  selected,
  onClick,
}: {
  s: Scenario;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          "w-full rounded-md border bg-panel px-3 py-2.5 text-left transition-colors",
          selected
            ? "border-accent ring-1 ring-accent/30"
            : "border-border hover:border-border-strong hover:bg-panel-2"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink">
            <ListChecks size={13} className="text-faint" />
            {regionLabel(s.params.region)}
          </span>
          <StatusChip status={s.status} />
        </div>

        <div className="tabular mt-1 text-[11.5px] text-muted">
          SSP{s.params.ssp} · {s.params.distance} · {s.params.period} · case {s.params.caseNo}
        </div>

        {s.status === "running" && (
          <div className="mt-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-200"
                style={{ width: `${s.progress}%` }}
              />
            </div>
            <div className="tabular mt-1 flex justify-between text-[11px] text-muted">
              <span>{currentStep(s.progress)}</span>
              <span>{Math.round(s.progress)}%</span>
            </div>
          </div>
        )}
      </button>
    </li>
  );
}

const STATUS_META: Record<
  ScenarioStatus,
  { label: string; cls: string }
> = {
  queued: { label: "대기", cls: "bg-panel-2 text-muted" },
  running: { label: "실행 중", cls: "bg-accent-soft text-accent" },
  done: { label: "완료", cls: "bg-ok-soft text-ok" },
  failed: { label: "실패", cls: "bg-danger-soft text-danger" },
};

function StatusChip({ status }: { status: ScenarioStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", m.cls)}>
      {m.label}
    </span>
  );
}
