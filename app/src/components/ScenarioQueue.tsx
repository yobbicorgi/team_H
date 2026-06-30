import { Layers, X, PlayCircle, Trash2, Waves } from "lucide-react";
import {
  currentStep,
  regionLabel,
  type Scenario,
  type ScenarioStatus,
} from "@/backend/types";
import { Badge, SectionHeader, cn } from "./ui";

export function ScenarioQueue({
  scenarios,
  selectedId,
  queuedCount,
  onSelect,
  onRemove,
  onRunAll,
  onClearDone,
}: {
  scenarios: Scenario[];
  selectedId: string | null;
  queuedCount: number;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onRunAll: () => void;
  onClearDone: () => void;
}) {
  const doneCount = scenarios.filter((s) => s.status === "done").length;

  return (
    <section className="px-4 py-4">
      <SectionHeader
        title="시나리오 큐"
        right={
          <span className="tabular rounded-md bg-panel-2 px-2 py-0.5 text-[0.875rem] font-semibold text-ink-2 ring-1 ring-inset ring-border">
            {scenarios.length}
          </span>
        }
      />

      {(queuedCount > 0 || doneCount > 0) && (
        <div className="mt-3 flex items-center gap-2">
          {queuedCount > 0 && (
            <button
              onClick={onRunAll}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-[0.875rem] font-semibold text-white shadow-[0_1px_2px_rgba(10,37,64,0.18)] transition-colors hover:bg-accent-hover"
            >
              <PlayCircle size={15} strokeWidth={2.3} />
              전체 자동 실행 ({queuedCount})
            </button>
          )}
          {doneCount > 0 && (
            <button
              onClick={onClearDone}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong bg-panel px-3 py-2 text-[0.875rem] font-semibold text-muted transition-colors hover:bg-panel-2 hover:text-ink-2"
            >
              <Trash2 size={14} />
              완료 비우기
            </button>
          )}
        </div>
      )}

      {scenarios.length === 0 ? (
        <div className="mt-3 flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong bg-panel-2 px-4 py-7 text-center">
          <Layers size={20} className="text-faint" />
          <p className="text-[0.875rem] leading-relaxed text-muted">
            추가된 시나리오가 없습니다.
            <br />
            파라미터 설정 후 <span className="font-semibold text-ink-2">실행</span> 또는{" "}
            <span className="font-semibold text-ink-2">큐에 추가</span>.
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
              onRemove={() => onRemove(s.id)}
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
  onRemove,
}: {
  s: Scenario;
  selected: boolean;
  onClick: () => void;
  onRemove: () => void;
}) {
  return (
    <li
      onClick={onClick}
      className={cn(
        "group cursor-pointer rounded-lg border bg-panel px-3 py-2.5 transition-colors",
        selected
          ? "border-accent ring-1 ring-accent/40"
          : "border-border hover:border-border-strong hover:bg-panel-2"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[0.938rem] font-semibold text-ink">
          {regionLabel(s.params.region)}
        </span>
        <div className="flex items-center gap-1.5">
          <StatusBadge status={s.status} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="flex h-5 w-5 items-center justify-center rounded text-faint opacity-0 transition group-hover:opacity-100 hover:bg-panel-2 hover:text-danger"
            aria-label="시나리오 삭제"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="tabular mt-1 text-[0.875rem] text-muted">
        {s.params.direction}·Mw{s.params.mw.toFixed(1)}·c{s.params.caseNo} ·
        SSP{s.params.ssp}·{s.params.distance}·{s.params.period}
      </div>

      {s.status === "running" && (
        <div className="mt-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-200"
              style={{ width: `${s.progress}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[0.875rem] text-muted">
            <span className="font-medium">{currentStep(s.progress)}</span>
            <span className="tabular">{Math.round(s.progress)}%</span>
          </div>
        </div>
      )}

      {s.status === "done" && s.result && (
        <div className="mt-2 flex items-center gap-2 rounded-md bg-panel-2 px-2.5 py-1.5 ring-1 ring-inset ring-border">
          <Waves size={14} className="text-accent" />
          <span className="text-[0.875rem] text-muted">최대 침수심</span>
          <span className="tabular text-[0.938rem] font-semibold text-ink">
            {s.result.maxDepth.toFixed(1)} m
          </span>
          <span className="tabular ml-auto text-[0.875rem] text-muted">
            {s.result.floodedArea.toFixed(1)} km²
          </span>
        </div>
      )}
    </li>
  );
}

function StatusBadge({ status }: { status: ScenarioStatus }) {
  if (status === "running") return <Badge live>실행 중</Badge>;
  if (status === "done")
    return (
      <Badge tone="ok" dot>
        완료
      </Badge>
    );
  if (status === "failed")
    return (
      <Badge tone="danger" dot>
        실패
      </Badge>
    );
  return (
    <Badge tone="neutral" dot>
      대기
    </Badge>
  );
}
