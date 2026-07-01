"use client";

import { useEffect, useRef, useState } from "react";
import { MessagesSquare, ArrowUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { interpret } from "@/lib/parseIntent";
import type { AgentAction, ChatMessage, ScenarioParams } from "@/backend/types";
import { cn } from "./ui";

// ── 실제 Claude(/api/agent) 응답 → 검증된 액션 변환 ──
const VDIR = new Set(["EAST", "WEST", "SOUTH"]);
const VSSP = new Set(["2.6", "4.5", "7.0", "8.5"]);
const VPER = new Set(["near", "mid", "long", "far"]);
const VREG = new Set(["Busan", "Haeundae", "MarineCity"]);
function coerce(p: Record<string, unknown> | null | undefined): Partial<ScenarioParams> {
  const o: Partial<ScenarioParams> = {};
  if (p && VDIR.has(p.direction as string)) o.direction = p.direction as string;
  const mw = Number(p?.mw);
  if (isFinite(mw)) o.mw = [8, 8.5, 9].reduce((a, b) => (Math.abs(b - mw) < Math.abs(a - mw) ? b : a));
  const c = Number(p?.caseNo);
  if (Number.isFinite(c)) o.caseNo = Math.min(9, Math.max(1, Math.round(c)));
  if (p && VSSP.has(String(p.ssp))) o.ssp = String(p.ssp);
  if (p && VPER.has(p.period as string)) o.period = p.period as string;
  if (p && VREG.has(p.region as string)) o.region = p.region as string;
  if (p && (p.manningMode === "graded" || p.manningMode === "uniform")) o.manningMode = p.manningMode;
  return o;
}
function toActions(data: Record<string, unknown>, base: ScenarioParams): { actions: AgentAction[]; reply: string } {
  const set = coerce(data?.set as Record<string, unknown>);
  const workBase: ScenarioParams = { ...base, ...set };
  const actions: AgentAction[] = [];
  if (Object.keys(set).length) actions.push({ type: "set", patch: set });
  const rawQ = Array.isArray(data?.queue) ? (data.queue as Record<string, unknown>[]) : [];
  const queue = rawQ.map((q) => coerce(q)).filter((q) => Object.keys(q).length);
  if (queue.length) {
    const scenarios = queue.slice(0, 12).map((q) => ({ ...workBase, ...q }));
    actions.push({ type: "queue", scenarios });
  }
  if (data?.run === "single" || data?.run === "all") actions.push({ type: "run", mode: data.run });
  const reply = typeof data?.reply === "string" && data.reply.trim() ? (data.reply as string) : "요청을 반영했습니다.";
  return { actions, reply };
}

const SEED = [
  "원하는 실험 조건을 말로 알려주세요.",
  "",
  "- **단일 설정·실행** — “남쪽 규모 9.0 케이스 3 SSP8.5 far 부산, 실행”",
  "- **여러 실험(스윕)** — “SSP 전부 비교”, “케이스 1~5”, “방향 전부”",
  "- **자동 설계** — “알아서 다양하게 만들어줘”",
  "- **일괄 수행** — “전부 자동 실행”",
  "",
  "저는 좌측 파라미터를 채우고 시나리오를 구성하기만 하며, 수치모델을 직접 실행하지는 않습니다.",
].join("\n");

// 빠른 예시 칩 — 클릭하면 그대로 전송(유연 모드: 대충 눌러도 동작)
const CHIPS = [
  "남해 규모 9.0 케이스 3 SSP8.5, 즉시 실행",
  "SSP 전부 비교",
  "케이스 1~5 큐에 추가",
  "알아서 다양하게 만들어줘",
];

const md: Components = {
  p: ({ children }) => <p className="my-1 text-[0.938rem] leading-relaxed text-ink-2">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  em: ({ children }) => <em className="text-[0.875rem] not-italic text-muted">{children}</em>,
  ul: ({ children }) => <ul className="my-1 space-y-1 pl-1">{children}</ul>,
  li: ({ children }) => (
    <li className="relative pl-3.5 text-[0.938rem] leading-relaxed text-ink-2 before:absolute before:left-0 before:top-[9px] before:h-1 before:w-1 before:rounded-full before:bg-accent">
      {children}
    </li>
  ),
  code: ({ children }) => (
    <code className="rounded bg-panel-2 px-1 py-0.5 text-[0.875rem] text-ink-2">{children}</code>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-[0.875rem]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-panel-2">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-border px-2 py-1.5 text-left font-semibold text-ink-2">{children}</th>
  ),
  td: ({ children }) => (
    <td className="tabular border-b border-border px-2 py-1.5 text-ink-2">{children}</td>
  ),
};

export function AgentChat({
  baseParams,
  onActions,
}: {
  baseParams: ScenarioParams;
  onActions: (actions: import("@/backend/types").AgentAction[]) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "seed", role: "assistant", text: SEED },
  ]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(textArg?: string) {
    const text = (textArg ?? input).trim();
    if (!text) return;
    setInput("");

    const pendId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text },
      { id: pendId, role: "assistant", text: "_요청 해석 중…_" },
    ]);
    const finish = (reply: string) =>
      setMessages((prev) => prev.map((m) => (m.id === pendId ? { ...m, text: reply } : m)));

    try {
      // ① 실제 Claude(구독 CLI) — 서버 /api/agent
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "agent-failed");
      const { actions, reply } = toActions(data, baseParams);
      if (actions.length > 0) onActions(actions);
      finish(reply);
    } catch {
      // ② 폴백 — 로컬 규칙 파서 (claude CLI 없거나 오류 시)
      const { actions, reply } = interpret(text, baseParams);
      if (actions.length > 0) onActions(actions);
      finish(reply + "\n\n_※ 실제 Claude 연결 실패 → 로컬 파서로 처리했습니다._");
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-panel">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <MessagesSquare size={15} className="text-accent" />
        <span className="text-[0.938rem] font-semibold text-ink">에이전트 · 실험 설계</span>
        <span className="ml-auto rounded-md bg-panel-2 px-1.5 py-0.5 text-[0.875rem] font-medium text-muted ring-1 ring-inset ring-border">
          설정·구성 전용
        </span>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
        {messages.map((m) => (
          <MessageBubble key={m.id} m={m} />
        ))}
      </div>

      <div className="border-t border-border p-2.5">
        {/* 빠른 예시(칩) — 대충 눌러도 바로 동작하도록 */}
        <div className="mb-2 flex flex-wrap gap-1.5">
          {CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => send(c)}
              className="rounded-full border border-border-strong bg-panel px-2.5 py-1 text-[0.8125rem] font-medium text-ink-2 transition-colors hover:bg-accent-soft hover:text-accent-hover"
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2 rounded-lg border border-border-strong bg-panel px-2.5 py-2 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="예: SSP 전부 비교, 케이스 1~5, 전부 자동 실행"
            className="max-h-28 flex-1 resize-none bg-transparent text-[0.938rem] text-ink outline-none placeholder:text-faint"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim()}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors",
              input.trim()
                ? "bg-accent text-white shadow-[0_1px_2px_rgba(10,37,64,0.18)] hover:bg-accent-hover"
                : "bg-panel-2 text-faint"
            )}
            aria-label="보내기"
          >
            <ArrowUp size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </section>
  );
}

function MessageBubble({ m }: { m: ChatMessage }) {
  const isUser = m.role === "user";
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lg bg-accent-soft px-3 py-2 text-[0.938rem] leading-relaxed text-ink ring-1 ring-inset ring-[#bcd9f2]">
          {m.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="w-full max-w-full rounded-lg border border-border bg-panel-2 px-3 py-2">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
          {m.text}
        </ReactMarkdown>
      </div>
    </div>
  );
}
