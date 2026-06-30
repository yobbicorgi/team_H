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
        <h2 className="text-[13px] font-semibold tracking-tight text-ink">{title}</h2>
        {desc && <p className="mt-0.5 text-[12px] leading-snug text-muted">{desc}</p>}
      </div>
      {right}
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
        <span className="text-[12px] font-medium text-ink-2">{label}</span>
        {hint && <span className="text-[11px] text-faint">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

/* 버튼 */
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
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-7 px-2.5 text-[12px]" : "h-9 px-3.5 text-[13px]",
        variant === "primary" &&
          "bg-accent text-white hover:bg-accent-hover active:bg-accent-hover",
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
          "h-9 w-full appearance-none rounded-md border border-border-strong bg-panel pl-3 pr-9 text-[13px] text-ink",
          "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20",
          className
        )}
        {...rest}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}

/* 세그먼트 컨트롤 (라디오 대체) */
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
    <div className="inline-flex w-full rounded-md border border-border-strong bg-panel-2 p-0.5">
      {opts.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "h-7 flex-1 rounded-[5px] px-2 text-[12px] font-medium transition-colors",
              active
                ? "bg-panel text-accent shadow-[0_1px_2px_rgba(16,24,40,0.08)]"
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
