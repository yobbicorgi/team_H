"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_PARAMS,
  PIPELINE_STEPS,
  type Scenario,
  type ScenarioParams,
} from "@/lib/types";
import { TopBar } from "./TopBar";
import { ParameterPanel } from "./ParameterPanel";
import { ScenarioQueue } from "./ScenarioQueue";
import { AgentChat } from "./AgentChat";
import { VizPanel } from "./VizPanel";

export default function AppShell() {
  const [params, setParams] = useState<ScenarioParams>(DEFAULT_PARAMS);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const patchParams = (patch: Partial<ScenarioParams>) =>
    setParams((p) => ({ ...p, ...patch }));

  function runScenario() {
    const s: Scenario = {
      id: crypto.randomUUID(),
      params,
      status: "running",
      progress: 0,
      createdAt: Date.now(),
    };
    setScenarios((prev) => [s, ...prev]);
    setSelectedId(s.id);
  }

  // Mock 파이프라인 진행 — 10단계를 순차로 도는 것처럼 진행률 증가
  // ⚠️ 실제: backend(Han) /api/scenarios 호출 → SSE/폴링으로 단계별 진행 수신
  const running = scenarios.some((s) => s.status === "running");
  useEffect(() => {
    if (!running) return;
    const stepInc = 100 / (PIPELINE_STEPS.length * 2);
    const t = setInterval(() => {
      setScenarios((prev) =>
        prev.map((s) => {
          if (s.status !== "running") return s;
          const next = Math.min(100, s.progress + stepInc);
          return next >= 100
            ? { ...s, progress: 100, status: "done" }
            : { ...s, progress: next };
        })
      );
    }, 260);
    return () => clearInterval(t);
  }, [running]);

  const runningCount = scenarios.filter((s) => s.status === "running").length;
  const selected = useMemo(
    () => scenarios.find((s) => s.id === selectedId) ?? null,
    [scenarios, selectedId]
  );

  return (
    <div className="flex h-screen flex-col">
      <TopBar runningCount={runningCount} onRun={runScenario} />

      <div className="flex min-h-0 flex-1">
        {/* 좌측: 파라미터 + 큐 (스크롤) / 에이전트 채팅 (하단 고정) */}
        <aside className="flex w-[408px] shrink-0 flex-col border-r border-border bg-panel">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ParameterPanel params={params} onChange={patchParams} />
            <ScenarioQueue
              scenarios={scenarios}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
          <div className="h-[42%] min-h-[260px]">
            <AgentChat onApplyParams={patchParams} />
          </div>
        </aside>

        {/* 우측: 3D 뷰 (Kim viz/ 슬롯) */}
        <VizPanel scenario={selected} />
      </div>
    </div>
  );
}
