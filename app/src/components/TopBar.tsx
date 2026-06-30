import { Activity, Play, Loader2 } from "lucide-react";
import { Button } from "./ui";

export function TopBar({
  runningCount,
  onRun,
}: {
  runningCount: number;
  onRun: () => void;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-panel px-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent">
          <Activity size={17} className="text-white" strokeWidth={2.4} />
        </div>
        <div className="leading-tight">
          <h1 className="text-[14px] font-semibold tracking-tight text-ink">
            지진해일 수치모델 자동화 플랫폼
          </h1>
          <p className="text-[11.5px] text-muted">
            파라미터 설정 → 다중 시나리오 자동 수행 → 부산권 3D 침수 시각화
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="flex items-center gap-1.5 rounded-md border border-border bg-panel-2 px-2.5 py-1 text-[12px] text-muted">
          {runningCount > 0 ? (
            <>
              <Loader2 size={13} className="animate-spin text-accent" />
              실행 중 {runningCount}건
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-ok" />
              대기 중
            </>
          )}
        </span>
        <Button variant="primary" onClick={onRun}>
          <Play size={14} strokeWidth={2.4} />
          시나리오 실행
        </Button>
      </div>
    </header>
  );
}
