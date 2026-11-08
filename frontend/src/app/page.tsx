"use client";

import React, { useState, useRef, useEffect } from "react";
import WorkflowGraph from "@/components/WorkflowGraph";
import {
  LayoutDashboard,
  BarChart2,
  GitBranch,
  Settings,
  FileCode2,
  Search,
  Bell,
  CheckCircle2,
  Clock,
  Send,
  Globe,
  BarChart3,
  Edit3,
  Layers,
  ChevronDown,
  Users,
  MessageSquare,
  Loader2,
} from "lucide-react";

interface ActivityItem {
  agent: string;
  time: string;
  text: string;
  iconType: "globe" | "chart" | "edit" | "box";
  active?: boolean;
}

// Maps each backend agent name to a progress percentage for the timeline bar
const AGENT_PROGRESS: Record<string, Record<string, number>> = {
  supervisor: { researcher: 0,   analyst: 0,   writer: 0 },
  researcher:  { researcher: 100, analyst: 0,   writer: 0 },
  analyst:     { researcher: 100, analyst: 100, writer: 0 },
  writer:      { researcher: 100, analyst: 100, writer: 100 },
};

export default function OrchestraAIDashboard() {
  const [chatInput, setChatInput] = useState("");
  const [status, setStatus] = useState<"IDLE" | "RUNNING" | "COMPLETED">("IDLE");
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [currentTask, setCurrentTask] = useState("Standby");
  const [researchCount, setResearchCount] = useState(0);
  const [progress, setProgress] = useState({ researcher: 0, analyst: 0, writer: 0 });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [finalReport, setFinalReport] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const activityScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    activityScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activities]);

  const executeMission = (missionGoal: string) => {
    if (status === "RUNNING" || !missionGoal.trim()) return;

    setStatus("RUNNING");
    setActiveAgent("supervisor");
    setCurrentTask("Evaluating Plan");
    setResearchCount(0);
    setProgress({ researcher: 0, analyst: 0, writer: 0 });
    setFinalReport(null);

    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setActivities([{
      agent: "Supervisor",
      time: nowTime,
      text: `Mission started: "${missionGoal}". Routing to agent workforce...`,
      iconType: "box",
      active: true,
    }]);

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/missions";
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ objective: missionGoal }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "NODE_UPDATE") {
        const agent = data.active_agent as string;
        setActiveAgent(agent);

        // Update live timeline progress
        if (AGENT_PROGRESS[agent]) {
          setProgress(AGENT_PROGRESS[agent] as typeof progress);
        }

        let iconType: ActivityItem["iconType"] = "box";
        let taskLabel = currentTask;
        let messageText = "";

        if (agent === "researcher") {
          taskLabel = "Web Research";
          iconType = "globe";
          const count = data.research_count || 5;
          setResearchCount(count);
          messageText = `Fetched ${count} live sources from the web.`;
        } else if (agent === "analyst") {
          taskLabel = "Market Analysis";
          iconType = "chart";
          messageText = "Running SWOT analysis and competitor synthesis via Ollama...";
        } else if (agent === "writer") {
          taskLabel = "Writing Report";
          iconType = "edit";
          messageText = "Drafting strategic launch plan and MVP feature list...";
        }

        if (data.final_report) {
          setFinalReport(data.final_report);
        }

        setCurrentTask(taskLabel);

        if (messageText) {
          const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          setActivities((prev) => [
            ...prev,
            {
              agent: agent.charAt(0).toUpperCase() + agent.slice(1),
              time: timestamp,
              text: messageText,
              iconType,
              active: true,
            },
          ]);
        }
      }

      if (data.type === "MISSION_COMPLETE") {
        setStatus("COMPLETED");
        setActiveAgent(null);
        setCurrentTask("Completed");
        setProgress({ researcher: 100, analyst: 100, writer: 100 });
        const finishTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setActivities((prev) => [
          ...prev,
          {
            agent: "Supervisor",
            time: finishTime,
            text: "All agents completed. Full strategic report is ready.",
            iconType: "box",
            active: false,
          },
        ]);
      }

      if (data.type === "ERROR") {
        setStatus("IDLE");
        setActiveAgent(null);
        setCurrentTask("Error — retry");
        const errTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setActivities((prev) => [
          ...prev,
          {
            agent: "System",
            time: errTime,
            text: `Error: ${data.message}`,
            iconType: "box",
            active: false,
          },
        ]);
      }
    };

    socket.onerror = () => {
      setStatus("IDLE");
      setActiveAgent(null);
      setCurrentTask("Connection failed");
    };
  };

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatInput("");
    executeMission(msg);
  };

  // Derive per-agent timeline state label
  const agentLabel = (key: string) => {
    const pct = progress[key as keyof typeof progress];
    if (pct === 100) return { text: "Completed ✔", color: "text-emerald-400" };
    if (activeAgent === key) return { text: "In Progress...", color: "text-cyan-400" };
    return { text: "Pending", color: "text-slate-500" };
  };

  return (
    <div className="flex h-screen bg-[#070b14] text-slate-100 font-sans overflow-hidden">

      {/* LEFT NAVIGATION SIDEBAR */}
      <aside className="w-52 bg-[#0a0e1a] border-r border-[#1a2333] flex flex-col justify-between p-4 select-none">
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3 px-1 pt-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base">
              ▲
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-none">Orchestra AI</h1>
              <span className="text-[10px] text-slate-500 font-medium">AI Agent Orchestration</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col gap-1 text-xs font-medium">
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900/60 transition-colors">
              <BarChart2 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900/60 transition-colors">
              <GitBranch className="w-4 h-4" />
              <span>Workflows</span>
            </button>
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900/60 transition-colors">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900/60 transition-colors">
              <FileCode2 className="w-4 h-4" />
              <span>Logs</span>
            </button>
          </nav>
        </div>

        {/* System Status */}
        <div className="flex flex-col gap-1 pt-4 border-t border-[#1a2333]">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
            <span className="text-white font-semibold">System Online</span>
          </div>
          <span className="text-[10px] text-slate-500">All systems operational</span>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* TOP HEADER */}
        <header className="h-14 border-b border-[#1a2333] bg-[#090d18] px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e1424] border border-[#1e293b] text-slate-300">
              <div className={`w-2 h-2 rounded-full ${status === "RUNNING" ? "bg-emerald-400 animate-pulse" : status === "COMPLETED" ? "bg-emerald-400" : "bg-slate-500"}`} />
              <span>Current Task: <strong className="text-white">{currentTask}</strong></span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-1" />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e1424] border border-[#1e293b] text-slate-300">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>LangGraph 2.0</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-[#0e1424] border border-[#1e293b] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-slate-500 w-40"
              />
            </div>
            <button className="relative text-slate-400 hover:text-white transition-colors">
              <Bell className="w-4 h-4" />
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 absolute -top-0.5 -right-0.5" />
            </button>
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200">
              AT
            </div>
          </div>
        </header>

        {/* 3-COLUMN BODY */}
        <main className="flex-1 p-4 grid grid-cols-12 gap-4 overflow-hidden bg-[#070b14]">

          {/* COLUMN 1: AGENT PANEL */}
          <div className="col-span-3 flex flex-col bg-[#0b101d] border border-[#1b263b] rounded-2xl p-4 shadow-lg overflow-hidden">
            <div className="flex items-center gap-2 pb-3 border-b border-[#1b263b]/70 text-xs font-bold text-white">
              <Users className="w-4 h-4 text-slate-400" />
              <span>Agent Panel</span>
            </div>

            <div className="flex-1 flex flex-col gap-2.5 pt-3 overflow-y-auto pr-1">
              {/* Researcher */}
              <AgentCard
                name="Researcher"
                subtitle="Web search & indexing"
                isActive={activeAgent === "researcher"}
                isDone={progress.researcher === 100}
                icon={<Search className="w-4 h-4" />}
                sparkPath="M 2 18 Q 6 4 14 12 T 26 8 T 38 4 T 46 10"
              />
              {/* Analyst */}
              <AgentCard
                name="Analyst"
                subtitle="SWOT & market analysis"
                isActive={activeAgent === "analyst"}
                isDone={progress.analyst === 100}
                icon={<BarChart3 className="w-4 h-4" />}
                sparkPath="M 2 16 Q 10 20 18 8 T 32 12 T 46 4"
              />
              {/* Writer */}
              <AgentCard
                name="Writer"
                subtitle="Strategy & launch plan"
                isActive={activeAgent === "writer"}
                isDone={progress.writer === 100}
                icon={<Edit3 className="w-4 h-4" />}
                sparkPath="M 2 12 L 14 12 L 26 8 L 38 14 L 46 10"
              />
            </div>

            {/* Model info badge */}
            <div className="mt-3 pt-3 border-t border-[#1b263b]/70">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0d1424] border border-[#1b263b] text-[10px] text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>Ollama · llama3.2:1b</span>
              </div>
            </div>
          </div>

          {/* COLUMN 2: GRAPH + TIMELINE */}
          <div className="col-span-6 flex flex-col gap-4 overflow-hidden">
            <WorkflowGraph
              activeAgent={activeAgent}
              isRunning={status === "RUNNING"}
              researchCount={researchCount}
            />

            {/* Task Timeline — driven by real progress state */}
            <div className="flex-1 bg-[#0b101d] border border-[#1b263b] rounded-2xl p-4 shadow-lg flex flex-col">
              <div className="flex justify-between items-center text-xs pb-3 border-b border-[#1b263b]/70">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Task Timeline</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0e1424] border border-[#1e293b] text-[10px] text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Real-time</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 text-xs pt-3">
                {(["researcher", "analyst", "writer"] as const).map((key) => {
                  const pct = progress[key];
                  const lbl = agentLabel(key);
                  const isActive = activeAgent === key;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      {pct === 100 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : isActive ? (
                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
                      )}
                      <span className="w-20 text-[11px] font-medium text-slate-300 capitalize">{key}</span>
                      <div className="flex-1 bg-[#131b2c] h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: pct === 100 ? "#10b981" : isActive ? "#22d3ee" : "#334155",
                          }}
                        />
                      </div>
                      <span className={`text-[11px] font-medium w-24 text-right ${lbl.color}`}>{lbl.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* Final Report preview — appears when complete */}
              {finalReport && (
                <div className="mt-3 pt-3 border-t border-[#1b263b]/70">
                  <p className="text-[10px] text-slate-500 mb-1 font-medium">Report Preview</p>
                  <div className="bg-[#0a0f1c] border border-[#1b263b] rounded-xl p-3 text-[10px] text-slate-300 leading-relaxed max-h-24 overflow-y-auto font-mono">
                    {finalReport.slice(0, 400)}…
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 3: ACTIVITY FEED + CHAT INPUT */}
          <div className="col-span-3 flex flex-col bg-[#0b101d] border border-[#1b263b] rounded-2xl p-4 shadow-lg overflow-hidden justify-between">
            <div className="flex justify-between items-center pb-3 border-b border-[#1b263b]/70 text-xs font-bold text-white">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <span>Activity Feed</span>
              </div>
              {status === "RUNNING" && (
                <span className="text-[10px] text-cyan-400 font-medium animate-pulse">● Live</span>
              )}
            </div>

            {/* Feed or empty state */}
            <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-3 pr-1">
              {activities.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#0d1424] border border-[#1b263b] flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-slate-600" />
                  </div>
                  <p className="text-xs text-slate-500">Type a mission below to start the agent workforce.</p>
                </div>
              ) : (
                activities.map((item, idx) => (
                  <div key={idx} className="relative flex items-start gap-3 text-xs">
                    {idx !== activities.length - 1 && (
                      <div className="absolute left-1.5 top-5 w-px h-full bg-[#1e293b]" />
                    )}
                    <div className={`relative z-10 w-3 h-3 rounded-full mt-0.5 shrink-0 ${item.active ? "bg-emerald-400" : "bg-slate-600"}`} />
                    <div className="flex-1 bg-[#0d1424]/70 border border-[#1b263b] rounded-xl p-2.5 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-white">{item.agent}</span>
                        <span className="text-slate-500 text-[10px]">{item.time}</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-[11px] text-slate-300 leading-snug">
                        <div className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 mt-0.5 shrink-0">
                          {item.iconType === "globe" && <Globe className="w-3 h-3" />}
                          {item.iconType === "chart" && <BarChart3 className="w-3 h-3" />}
                          {item.iconType === "edit" && <Edit3 className="w-3 h-3" />}
                          {item.iconType === "box" && <Layers className="w-3 h-3" />}
                        </div>
                        <p className="flex-1">{item.text}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={activityScrollRef} />
            </div>

            {/* Mission input */}
            <form onSubmit={handleMessageSubmit} className="pt-3 border-t border-[#1b263b]/70 flex flex-col gap-2">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={status === "RUNNING"}
                placeholder="Describe your mission... e.g. Research 10 competitors for a restaurant SaaS, check pricing, write a SWOT and launch plan."
                rows={3}
                className="w-full bg-[#0e1424] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleMessageSubmit(e as unknown as React.FormEvent);
                  }
                }}
              />
              <button
                type="submit"
                disabled={status === "RUNNING" || !chatInput.trim()}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {status === "RUNNING" ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running mission...</>
                ) : (
                  <><Send className="w-3.5 h-3.5" /> Launch Mission</>
                )}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

// Reusable Agent Card component — reduces repetition from before
interface AgentCardProps {
  name: string;
  subtitle: string;
  isActive: boolean;
  isDone: boolean;
  icon: React.ReactNode;
  sparkPath: string;
}

function AgentCard({ name, subtitle, isActive, isDone, icon, sparkPath }: AgentCardProps) {
  const borderColor = isActive
    ? "border-cyan-500/70 bg-[#0c1822]"
    : isDone
    ? "border-emerald-500/50 bg-[#0c1a16]"
    : "border-[#1b263b] bg-[#0d1424]/60";

  const dotColor = isActive ? "bg-cyan-400" : isDone ? "bg-emerald-400" : "border border-slate-600";
  const statusText = isActive ? "Active" : isDone ? "Done" : "Idle";
  const statusColor = isActive ? "text-cyan-400" : isDone ? "text-emerald-400" : "text-slate-500";
  const sparkColor = isActive || isDone ? "text-emerald-400" : "text-slate-600";

  return (
    <div className={`p-3 rounded-xl border transition-all flex items-center justify-between ${borderColor}`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full border flex items-center justify-center ${isActive ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-400" : isDone ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400" : "bg-slate-900 border-slate-700 text-slate-400"}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-xs font-bold text-white">{name}</h3>
          <div className={`flex items-center gap-1.5 text-[10px] font-medium ${statusColor}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
            <span>{statusText}</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">{subtitle}</span>
        </div>
      </div>
      <svg className={`w-12 h-6 stroke-current fill-none stroke-2 ${sparkColor}`}>
        <path d={sparkPath} />
      </svg>
    </div>
  );
}
