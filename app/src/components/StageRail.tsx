import { PIPELINE_STEPS, currentStep } from "@/lib/types";
import { cn } from "./ui";

// 시그니처: 10단계 파이프라인 스테이지 레일.
// 시나리오가 수행되면 01→10 스테이션이 순차로 채워진다 (수작업 10단계 자동화의 시각화).
export function StageRail({
  progress,
  done = false,
  compact = false,
}: {
  progress: number;
  done?: boolean;
  compact?: boolean;
}) {
  const total = PIPELINE_STEPS.length;
  const reached = done ? total : Math.min(total, Math.floor((progress / 100) * total) + (progress > 0 ? 1 : 0));
  const activeIdx = done ? total - 1 : Math.max(0, reached - 1);

  return (
    <div className={cn("w-full", compact ? "" : "select-none")}>
      <div className="flex items-center">
        {PIPELINE_STEPS.map((step, i) => {
          const state =
            i < reached - 1 || done ? "done" : i === activeIdx && progress > 0 && !done ? "active" : i < reached ? "done" : "pending";
          const code = step.code;
          return (
            <div key={step.code} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "tabular flex items-center justify-center rounded-md font-mono font-semibold transition-colors",
                    compact ? "h-5 w-5 text-[14px]" : "h-7 w-7 text-[14px]",
                    state === "done" && "bg-accent text-white",
                    state === "active" && "bg-accent text-white ring-4 ring-accent/20",
                    state === "pending" && "bg-panel-2 text-faint ring-1 ring-border"
                  )}
                >
                  {code}
                </span>
              </div>
              {i < total - 1 && (
                <span
                  className={cn(
                    "h-[3px] flex-1 rounded-full transition-colors",
                    i < reached - 1 || done ? "bg-accent" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      {!compact && (
        <div className="tabular mt-2 flex justify-between text-[14px]">
          <span className="font-medium text-ink-2">
            {done ? "완료 · 10/10 단계" : progress > 0 ? currentStep(progress) : "대기 · 01 지반 변형"}
          </span>
          <span className="font-mono text-muted">{done ? 100 : Math.round(progress)}%</span>
        </div>
      )}
    </div>
  );
}
