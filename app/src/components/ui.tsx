import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export const cn = clsx;

/* 섹션 헤더 */
export function SectionHeader({
  title,
  desc,
  right,
}: {
  title: string;
  desc?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-[1rem] font-semibold tracking-tight text-ink">{title}</h2>
        {desc && <p className="mt-0.5 text-[0.875rem] leading-snug text-muted">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

/* 파라미터 그룹 라벨 (좌측 액센트 바 + 캡션) */
export function GroupLabel({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="h-3.5 w-[3px] rounded-full bg-accent" />
      {icon}
      <span className="text-[0.875rem] font-semibold tracking-tight text-ink-2">{children}</span>
    </div>
  );
}

/* 라벨 + 컨트롤 */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[0.875rem] font-medium text-ink-2">{label}</span>
        {hint && <span className="text-[0.875rem] font-medium text-muted">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

/* 버튼 — 솔리드 primary(단일 액센트 순간), 또렷한 outline */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md";
};
export function Button({
  variant = "outline",
  size = "md",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:bg-panel-2 disabled:text-faint disabled:shadow-none disabled:ring-0",
        size === "sm" ? "h-8 px-3 text-[0.875rem]" : "h-9 px-4 text-[0.938rem]",
        variant === "primary" &&
          "bg-accent text-white shadow-[0_1px_2px_rgba(10,37,64,0.18)] hover:bg-accent-hover active:bg-accent-hover",
        variant === "outline" &&
          "border border-border-strong bg-panel text-ink-2 hover:bg-panel-2 hover:text-ink",
        variant === "ghost" && "text-muted hover:bg-panel-2 hover:text-ink",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* 상태 배지 — 연한 배경 + 진한 텍스트 + 1px ring + 솔리드 dot */
type Tone = "ok" | "info" | "warn" | "danger" | "neutral";
const BADGE: Record<Tone, { cls: string; dot: string }> = {
  ok: { cls: "bg-ok-soft text-ok ring-ok-ring", dot: "#0f8a6b" },
  info: { cls: "bg-accent-soft text-accent-hover ring-[#bcd9f2]", dot: "#0e76c4" },
  warn: { cls: "bg-warn-soft text-warn ring-warn-ring", dot: "#e8920c" },
  danger: { cls: "bg-danger-soft text-danger ring-danger-ring", dot: "#d32f2f" },
  neutral: { cls: "bg-panel-2 text-ink-2 ring-border", dot: "#8497a8" },
};
export function Badge({
  tone = "neutral",
  dot = false,
  live = false,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  live?: boolean; // 라이브(실행중) — 솔리드 액센트
  children: ReactNode;
}) {
  if (live) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-accent px-2 py-0.5 text-[0.875rem] font-semibold text-white">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-cyan)]" />
        {children}
      </span>
    );
  }
  const m = BADGE[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[0.875rem] font-semibold ring-1 ring-inset",
        m.cls
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.dot }} />}
      {children}
    </span>
  );
}

/* 네이티브 select (커스텀 화살표) */
export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-10 w-full appearance-none rounded-lg border border-border-strong bg-panel pl-3 pr-9 text-[0.938rem] font-medium text-ink",
          "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25",
          className
        )}
        {...rest}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}

/* 세그먼트 컨트롤 — 활성은 솔리드 액센트(또렷) */
export function Segmented({
  options,
  value,
  onChange,
}: {
  options: readonly { value: string; label: string }[] | readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const opts = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  return (
    <div className="inline-flex w-full rounded-lg border border-border-strong bg-panel p-1" role="radiogroup">
      {opts.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-8 flex-1 rounded-md px-2 text-[0.875rem] font-semibold transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
              active
                ? "bg-accent text-white shadow-[0_1px_2px_rgba(10,37,64,0.18)]"
                : "text-muted hover:text-ink-2"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
