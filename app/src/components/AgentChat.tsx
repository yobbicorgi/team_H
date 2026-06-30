"use client";

import { useEffect, useRef, useState } from "react";
import { MessagesSquare, ArrowUp } from "lucide-react";
import { parseIntent } from "@/lib/parseIntent";
import type { ChatMessage, ScenarioParams } from "@/lib/types";
import { cn } from "./ui";

const SEED: ChatMessage[] = [
  {
    id: "seed",
    role: "assistant",
    text:
      "원하는 실험 조건을 말로 알려주세요. 예: “SSP8.5 진도·완도, 케이스 3, far 시나리오로 설정해줘”. " +
      "좌측 파라미터를 대신 채워드립니다. (모델을 직접 실행하지는 않고 설정만 합니다.)",
  },
];

export function AgentChat({
  onApplyParams,
}: {
  onApplyParams: (patch: Partial<ScenarioParams>) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(SEED);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function send() {
    const text = input.trim();
    if (!text) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", text };

    // 로컬 키워드 파서 (실제 제품: Claude API function-calling으로 교체)
    const { patch, reply } = parseIntent(text);
    if (Object.keys(patch).length > 0) onApplyParams(patch);

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: crypto.randomUUID(), role: "assistant", text: reply },
    ]);
    setInput("");
  }

  return (
    <section className="flex h-full min-h-0 flex-col border-t border-border bg-panel">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <MessagesSquare size={14} className="text-accent" />
        <span className="text-[12.5px] font-semibold text-ink">에이전트 · 파라미터 설정</span>
        <span className="ml-auto rounded bg-panel-2 px-1.5 py-0.5 text-[11px] text-muted">
          설정 전용
        </span>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
        {messages.map((m) => (
          <MessageBubble key={m.id} m={m} />
        ))}
      </div>

      <div className="border-t border-border p-2.5">
        <div className="flex items-end gap-2 rounded-md border border-border-strong bg-panel px-2.5 py-2 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
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
            placeholder="예: SSP4.5 울산, 케이스 2, near로 설정"
            className="max-h-28 flex-1 resize-none bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
              input.trim()
                ? "bg-accent text-white hover:bg-accent-hover"
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
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-lg px-3 py-2 text-[12.5px] leading-relaxed",
          isUser
            ? "bg-accent-soft text-ink"
            : "border border-border bg-panel-2 text-ink-2"
        )}
      >
        {m.text}
      </div>
    </div>
  );
}
