"use client";

import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, MessagesSquare } from "lucide-react";
import {
  DEFAULT_PARAMS,
  PIPELINE_STEPS,
  mockResult,
  type AgentAction,
  type Scenario,
  type ScenarioParams,
  type ScenarioStatus,
} from "@/backend/types";
import { TopBar } from "./TopBar";
import { ParameterPanel } from "./ParameterPanel";
import { ScenarioQueue } from "./ScenarioQueue";
import { AgentChat } from "./AgentChat";
import { VizPanel } from "./VizPanel";
import { cn } from "./ui";

export default function AppShell() {
  const [params, setParams] = useState<ScenarioParams>(DEFAULT_PARAMS);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [autoRun, setAutoRun] = useState(false); // 전체 큐 순차 실행 모드
  const [leftTab, setLeftTab] = useState<"params" | "agent">("params");

  const patchParams = (patch: Partial<ScenarioParams>) =>
    setParams((p) => ({ ...p, ...patch }));

  function add(status: ScenarioStatus): string {
    const id = crypto.randomUUID();
    const s: Scenario = { id, params, status, progress: 0, createdAt: Date.now() };
    setScenarios((prev) => [s, ...prev]);
    if (status === "running") setSelectedId(id); // 큐 추가(queued)는 우측 3D에 표출하지 않음
    return id;
  }

  // ① 단일 실행 — 현재 설정을 바로 수행
  const runSingle = () => add("running");
  // ② 다중용 — 큐에 추가(대기)
  const addToQueue = () => add("queued");
  // ② 전체 자동 실행 — 대기 시나리오를 순차(한 번에 하나씩) 자동 수행
  const runAll = () => setAutoRun(true);

  const removeScenario = (id: string) =>
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  const clearDone = () =>
    setScenarios((prev) => prev.filter((s) => s.status !== "done"));

  // 임의 파라미터로 시나리오 추가(에이전트 스윕/자동설계용)
  function addParams(p: ScenarioParams, status: ScenarioStatus) {
    const id = crypto.randomUUID();
    setScenarios((prev) => [
      { id, params: p, status, progress: 0, createdAt: Date.now() },
      ...prev,
    ]);
    if (status === "running") setSelectedId(id); // 에이전트 큐 추가는 3D에 표출하지 않음
  }

  // 에이전트 액션 디스패처 (set / queue / run) — 실제로는 Claude function-calling 결과를 그대로 처리
  function runAgent(actions: AgentAction[]) {
    let working = { ...params };
    for (const a of actions) {
      if (a.type === "set") {
        working = { ...working, ...a.patch };
        setParams(working);
      } else if (a.type === "queue") {
        a.scenarios.forEach((s) => addParams(s, "queued"));
      } else if (a.type === "run") {
        if (a.mode === "single") addParams(working, "running");
        else runAll();
      }
    }
  }

  // Mock 파이프라인 — 실행 중 시나리오의 10단계를 순차 진행. 완료 시 Mock 결과 부여.
  // ⚠️ 실제: backend(Han) /api/scenarios → 단계별 진행/결과 수신으로 교체.
  const running = scenarios.some((s) => s.status === "running");
  useEffect(() => {
    if (!running) return;
    const inc = 100 / (PIPELINE_STEPS.length * 2);
    const t = setInterval(() => {
      setScenarios((prev) =>
        prev.map((s) => {
          if (s.status !== "running") return s;
          const next = Math.min(100, s.progress + inc);
          return next >= 100
            ? { ...s, progress: 100, status: "done", result: mockResult(s.params) }
            : { ...s, progress: next };
        })
      );
    }, 240);
    return () => clearInterval(t);
  }, [running]);

  // 전체 큐 자동 실행 — running이 없고 queued가 있으면 가장 오래된 것 하나만 실행(순차)
  useEffect(() => {
    if (!autoRun) return;
    if (scenarios.some((s) => s.status === "running")) return;
    const q = scenarios
      .filter((s) => s.status === "queued")
      .sort((a, b) => a.createdAt - b.createdAt);
    if (q.length === 0) { setAutoRun(false); return; }
    setSelectedId(q[0].id);
    setScenarios((prev) => prev.map((s) => (s.id === q[0].id ? { ...s, status: "running" } : s)));
  }, [scenarios, autoRun]);

  const queuedCount = scenarios.filter((s) => s.status === "queued").length;
  const runningCount = scenarios.filter((s) => s.status === "running").length;
  const doneCount = scenarios.filter((s) => s.status === "done").length;
  const selected = useMemo(
    () => scenarios.find((s) => s.id === selectedId) ?? null,
    [scenarios, selectedId]
  );
  const doneScenarios = useMemo(
    () => scenarios.filter((s) => s.status === "done"),
    [scenarios]
  );

  return (
    <div className="flex h-screen flex-col">
      <TopBar
        queuedCount={queuedCount}
        runningCount={runningCount}
        doneCount={doneCount}
        onRunAll={runAll}
      />

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[26.25rem] shrink-0 flex-col border-r border-border bg-panel">
          {/* 좌측 탭 전환 — 파라미터 / 에이전트 (가림 없이 각 전체 높이) */}
          <div className="flex shrink-0 gap-1 border-b border-border p-1.5">
            <LeftTab
              active={leftTab === "params"}
              icon={<SlidersHorizontal size={15} />}
              label="파라미터"
              onClick={() => setLeftTab("params")}
            />
            <LeftTab
              active={leftTab === "agent"}
              icon={<MessagesSquare size={15} />}
              label="에이전트"
              onClick={() => setLeftTab("agent")}
            />
          </div>

          {leftTab === "params" ? (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ParameterPanel
                params={params}
                onChange={patchParams}
                onRunSingle={runSingle}
                onAddToQueue={addToQueue}
                onRunAll={runAll}
                queuedCount={queuedCount}
              />
              <ScenarioQueue
                scenarios={scenarios}
                selectedId={selectedId}
                queuedCount={queuedCount}
                onSelect={setSelectedId}
                onRemove={removeScenario}
                onRunAll={runAll}
                onClearDone={clearDone}
              />
            </div>
          ) : (
            <div className="min-h-0 flex-1">
              <AgentChat baseParams={params} onActions={runAgent} />
            </div>
          )}
        </aside>

        <VizPanel selected={selected} doneScenarios={doneScenarios} />
      </div>
    </div>
  );
}

function LeftTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-[0.938rem] font-semibold transition-colors",
        active
          ? "bg-accent-soft text-accent-hover ring-1 ring-inset ring-[#bcd9f2]"
          : "text-muted hover:bg-panel-2 hover:text-ink"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
