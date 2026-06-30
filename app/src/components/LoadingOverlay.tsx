"use client";

// 수치모델 수행(약 5초) 중에 뜨는 모달 로딩 팝업.
// 해양·과학 운영 콘솔 톤(라이트 테마) · 순수 SVG/CSS 스피너(이모지 없음).
export function LoadingOverlay({
  open,
  title = "수치모델 수행 중",
  sub = "10단계 전처리·실행 준비를 자동 수행합니다",
  step,
  progress,
}: {
  open: boolean;
  title?: string;
  sub?: string;
  step?: string;
  progress?: number;
}) {
  if (!open) return null;

  const hasProgress = typeof progress === "number" && !Number.isNaN(progress);
  const pct = hasProgress ? Math.max(0, Math.min(100, progress)) : 0;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-6"
    >
      <div className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-border bg-panel px-8 py-7 text-center shadow-xl">
        {/* 빙글 도는 원형 스피너 — 트랙 + 회전 호 (지름 56px) */}
        <span className="relative inline-flex h-14 w-14 items-center justify-center">
          <svg
            className="h-14 w-14 animate-spin"
            viewBox="0 0 56 56"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="28"
              cy="28"
              r="24"
              stroke="#e1eff9"
              strokeWidth="5"
            />
            <circle
              cx="28"
              cy="28"
              r="24"
              stroke="#0e76c4"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="44 132"
            />
          </svg>
        </span>

        <h2 className="mt-5 text-[1rem] font-semibold text-ink">{title}</h2>
        <p className="mt-1.5 text-[0.875rem] leading-relaxed text-muted">{sub}</p>

        {step && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <span className="tabular text-[0.875rem] font-medium text-ink-2">
              {step}
            </span>
          </div>
        )}

        {hasProgress && (
          <div className="mt-5 w-full">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent-soft">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="tabular mt-1.5 text-right text-[0.875rem] font-medium text-muted">
              {Math.round(pct)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
