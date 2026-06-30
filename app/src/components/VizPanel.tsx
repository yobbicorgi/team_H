import { Box, Waves, MapPin, Info } from "lucide-react";
import { regionLabel, summarize, type Scenario } from "@/lib/types";
import { cn } from "./ui";

export function VizPanel({ scenario }: { scenario: Scenario | null }) {
  return (
    <main className="flex min-w-0 flex-1 flex-col bg-canvas">
      {/* 뷰 헤더 */}
      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-border bg-panel px-3">
        <Tab active icon={<Box size={14} />} label="3D 뷰" />
        <Tab icon={<Waves size={14} />} label="시나리오 비교" />
        <div className="ml-auto flex items-center gap-2 pr-1 text-[12px] text-muted">
          <MapPin size={13} className="text-faint" />
          부산 · 마린시티 · 해운대
        </div>
      </div>

      {/* 캔버스 */}
      <div className="relative min-h-0 flex-1 p-4">
        <div className="relative h-full w-full overflow-hidden rounded-lg border border-border bg-[#eef1f4]">
          <GridBackdrop />

          {/* Kim viz/ 마운트 슬롯 안내 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-panel">
              <Box size={22} className="text-accent" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-ink">
                지진해일 3D 침수 시뮬레이션
              </p>
              <p className="mt-1 max-w-xs text-[12px] leading-relaxed text-muted">
                Kim · <span className="font-mono text-[11.5px]">viz/</span> 모듈이 이 영역에 마운트됩니다.
                <br />
                위성·항공 basemap + 3D 건물 + 정밀 지형고도 + 침수 오버레이.
              </p>
            </div>
            <span className="flex items-center gap-1 rounded-full border border-warn/30 bg-warn-soft px-2.5 py-1 text-[11.5px] font-medium text-warn">
              <Info size={12} />
              MOCK DATA · 실제 수치모델 결과 연동 예정
            </span>
          </div>

          {/* 위치 핀 */}
          <Pin className="left-[34%] top-[58%]" label="마린시티" />
          <Pin className="left-[57%] top-[46%]" label="해운대" />

          {/* 침수심 범례 */}
          <DepthLegend />

          {/* 선택 시나리오 배지 */}
          {scenario && (
            <div className="absolute left-4 top-4 rounded-md border border-border bg-panel/95 px-3 py-2 backdrop-blur-sm">
              <div className="text-[11px] font-medium uppercase tracking-wide text-faint">
                표시 중 시나리오
              </div>
              <div className="mt-0.5 text-[13px] font-semibold text-ink">
                {regionLabel(scenario.params.region)}
              </div>
              <div className="tabular mt-0.5 text-[11.5px] text-muted">
                {summarize(scenario.params)}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Tab({
  active,
  icon,
  label,
}: {
  active?: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
        active ? "bg-accent-soft text-accent" : "text-muted hover:bg-panel-2 hover:text-ink"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function GridBackdrop() {
  return (
    <>
      {/* 바다 영역 (하단, clip-path로 해안선 모사) */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #cfe0ee 0%, #bcd3e8 100%)",
          clipPath:
            "polygon(0 56%, 22% 50%, 46% 60%, 68% 49%, 100% 45%, 100% 100%, 0 100%)",
          opacity: 0.85,
        }}
      />
      {/* 격자 */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#d7dde3" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </>
  );
}

function Pin({ className, label }: { className?: string; label: string }) {
  return (
    <div className={cn("absolute flex flex-col items-center", className)}>
      <MapPin size={18} className="text-accent" fill="#1565c0" fillOpacity={0.15} />
      <span className="mt-0.5 rounded bg-panel/90 px-1.5 py-0.5 text-[11px] font-medium text-ink-2">
        {label}
      </span>
    </div>
  );
}

function DepthLegend() {
  const stops = [
    { c: "#dbeafe", t: "0" },
    { c: "#93c5fd", t: "1" },
    { c: "#3b82f6", t: "2" },
    { c: "#1d4ed8", t: "3" },
    { c: "#1e3a8a", t: "≥4" },
  ];
  return (
    <div className="absolute bottom-4 right-4 rounded-md border border-border bg-panel/95 px-3 py-2 backdrop-blur-sm">
      <div className="mb-1.5 text-[11px] font-medium text-ink-2">침수심 (m)</div>
      <div className="flex items-center gap-0">
        {stops.map((s) => (
          <div key={s.t} className="flex w-9 flex-col items-center">
            <span className="h-3 w-full" style={{ background: s.c }} />
            <span className="tabular mt-1 text-[10.5px] text-muted">{s.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
