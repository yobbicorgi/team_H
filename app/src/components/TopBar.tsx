import { Waves, PlayCircle, Layers } from "lucide-react";
import { Button, cn } from "./ui";

export function TopBar({
  queuedCount,
  runningCount,
  doneCount,
  onRunAll,
}: {
  queuedCount: number;
  runningCount: number;
  doneCount: number;
  onRunAll: () => void;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-panel px-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink">
          <Waves size={18} className="text-white" strokeWidth={2.2} />
        </div>
        <h1 className="text-[16px] font-semibold tracking-tight text-ink">
          지진해일 수치모델 자동화 콘솔
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* 시나리오 큐 상태 — 가시성 강화(굵은 컬러 숫자) */}
        <div className="flex items-center gap-3 rounded-lg border border-border bg-panel-2 px-3 py-1.5">
          <span className="flex items-center gap-1.5 text-[14px] font-medium text-muted">
            <Layers size={15} className="text-faint" />
            큐
          </span>
          <span className="h-4 w-px bg-border" />
          <Stat label="대기" value={queuedCount} tone="neutral" />
          <Stat label="실행" value={runningCount} tone="live" />
          <Stat label="완료" value={doneCount} tone="done" />
        </div>
        <Button variant="primary" onClick={onRunAll} disabled={queuedCount === 0}>
          <PlayCircle size={16} strokeWidth={2.2} />
          전체 자동 실행
          {queuedCount > 0 && (
            <span className="tabular ml-0.5 rounded bg-white/20 px-1.5 font-mono text-[14px]">
              {queuedCount}
            </span>
          )}
        </Button>
      </div>
    </header>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "live" | "done";
}) {
  const on = value > 0;
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          tone === "neutral" && "bg-faint",
          tone === "live" && (on ? "animate-pulse bg-[var(--color-cyan)]" : "bg-faint"),
          tone === "done" && (on ? "bg-ok" : "bg-faint")
        )}
      />
      <span className="text-[14px] text-muted">{label}</span>
      <span
        className={cn(
          "tabular font-mono text-[17px] font-bold leading-none",
          tone === "neutral" && "text-ink",
          tone === "live" && (on ? "text-accent" : "text-faint"),
          tone === "done" && (on ? "text-ok" : "text-faint")
        )}
      >
        {value}
      </span>
    </div>
  );
}
