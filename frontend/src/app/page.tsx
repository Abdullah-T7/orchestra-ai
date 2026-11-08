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
  Code2,
  Box,
  Layers,
  ChevronDown,
  Users,
  MessageSquare,
} from "lucide-react";

interface ActivityItem {
  agent: string;
  time: string;
  text: string;
  iconType: "globe" | "chart" | "edit" | "code" | "box";
  active?: boolean;
}

export default function OrchestraAIDashboard() {
  const [chatInput, setChatInput] = useState("");
  const [status, setStatus] = useState<"IDLE" | "RUNNING" | "COMPLETED">("IDLE");
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [currentTask, setCurrentTask] = useState("Market Analysis");
  const [researchCount, setResearchCount] = useState(0);

  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      agent: "Researcher",
      time: "10:24 PM",
      text: "Fetched 12 relevant sources from web. Starting market trend analysis...",
      iconType: "globe",
      active: true,
    },
    {
      agent: "Analyst",
      time: "10:23 PM",
      text: "Analyzed data. Key insights: growing demand in AI sector.",
      iconType: "chart",
    },
    {
      agent: "Writer",
      time: "10:22 PM",
      text: "Drafting report section: Executive Summary...",
      iconType: "edit",
    },
    {
      agent: "Coder",
      time: "10:21 PM",
      text: "Running analysis script for visualization...",
      iconType: "code",
    },
    {
      agent: "Complex",
      time: "10:20 PM",
      text: "Planning next steps based on findings.",
      iconType: "box",
    },
  ]);

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

    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setActivities((prev) => [
      {
        agent: "Supervisor",
        time: nowTime,
        text: `Mission started: "${missionGoal}". Coordinating agent workflow graph...`,
        iconType: "box",
        active: true,
      },
      ...prev,
    ]);

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/missions";
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ objective: missionGoal }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "NODE_UPDATE") {
        setActiveAgent(data.active_agent);

        let iconType: ActivityItem["iconType"] = "globe";
        let taskLabel = "Market Analysis";
        let messageText = "";

        if (data.active_agent === "researcher") {
          taskLabel = "Web Indexing";
          iconType = "globe";
          const count = data.research_count || 4;
          setResearchCount(count);
          messageText = `Fetched ${count} relevant sources from live web search.`;
        } else if (data.active_agent === "analyst") {
          taskLabel = "Market Analysis";
          iconType = "chart";
          messageText = "Analyzed competitor pricing models and market opportunities.";
        } else if (data.active_agent === "writer") {
          taskLabel = "GTM Strategy";
          iconType = "edit";
          messageText = "Drafting final strategic execution roadmap with citations.";
        }

        setCurrentTask(taskLabel);

        if (messageText) {
          const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          setActivities((prev) => [
            {
              agent: data.active_agent.charAt(0).toUpperCase() + data.active_agent.slice(1),
              time: timestamp,
              text: messageText,
              iconType,
              active: true,
            },
            ...prev,
          ]);
        }
      }

      if (data.type === "MISSION_COMPLETE") {
        setStatus("COMPLETED");
        setActiveAgent(null);
        setCurrentTask("Market Analysis");
        const finishTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        setActivities((prev) => [
          {
            agent: "Supervisor",
            time: finishTime,
            text: "All agent deliverables completed. Strategy roadmap ready.",
            iconType: "box",
            active: false,
          },
          ...prev,
        ]);
      }
    };

    socket.onerror = () => {
      setStatus("IDLE");
      setActiveAgent(null);
      setCurrentTask("Standby");
    };
  };

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatInput("");
    executeMission(msg);
  };

  return (
    <div className="flex h-screen bg-[#070b14] text-slate-100 font-sans overflow-hidden">
      {/* 1. FAR-LEFT NAVIGATION SIDEBAR */}
      <aside className="w-56 bg-[#0a0e1a] border-r border-[#1a2333] flex flex-col justify-between p-4 select-none">
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3 px-1 pt-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-white font-bold text-base">
              ▲
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-none">Orchestra AI</h1>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide">AI Agent Orchestration</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 text-xs font-medium">
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 transition-colors">
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

        {/* Bottom System Status */}
        <div className="flex flex-col gap-2 pt-4 border-t border-[#1a2333]">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-white font-semibold text-xs">System Online</span>
          </div>
          <span className="text-[10px] text-slate-500">All systems operational</span>
        </div>
      </aside>

      {/* MAIN APPLICATION CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP HEADER BAR */}
        <header className="h-14 border-b border-[#1a2333] bg-[#090d18] px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            {/* Current Task Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e1424] border border-[#1e293b] text-slate-300">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Current Task: <strong className="text-white">{currentTask}</strong></span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-1" />
            </div>

            {/* LangGraph Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e1424] border border-[#1e293b] text-slate-300">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>LangGraph 2.0</span>
            </div>
          </div>

          {/* Right Header: Search + Notifications + Profile */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-[#0e1424] border border-[#1e293b] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-slate-500 w-44"
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

        {/* 3-COLUMN WORKSPACE BODY */}
        <main className="flex-1 p-5 grid grid-cols-12 gap-4 overflow-hidden bg-[#070b14]">
          {/* COLUMN 1: AGENT PANEL (Cols 3) */}
          <div className="col-span-3 flex flex-col bg-[#0b101d] border border-[#1b263b] rounded-2xl p-4 shadow-lg overflow-hidden">
            <div className="flex items-center gap-2 pb-3 border-b border-[#1b263b]/70 text-xs font-bold text-white">
              <Users className="w-4 h-4 text-slate-400" />
              <span>Agent Panel</span>
            </div>

            <div className="flex-1 flex flex-col gap-2.5 pt-3 overflow-y-auto pr-1">
              {/* Agent 1: Researcher */}
              <div
                className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                  activeAgent === "researcher"
                    ? "border-emerald-500/80 bg-[#0c1822]"
                    : "border-[#1b263b] bg-[#0d1424]/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Researcher</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{activeAgent === "researcher" ? "Active" : "Ready"}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Fetching latest data...</span>
                  </div>
                </div>
                {/* Mini SVG Sparkline */}
                <svg className="w-12 h-6 text-emerald-400 stroke-current fill-none stroke-2">
                  <path d="M 2 18 Q 6 4 14 12 T 26 8 T 38 4 T 46 10" />
                </svg>
              </div>

              {/* Agent 2: Analyst */}
              <div
                className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                  activeAgent === "analyst"
                    ? "border-emerald-500/80 bg-[#0c1822]"
                    : "border-[#1b263b] bg-[#0d1424]/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-300">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Analyst</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{activeAgent === "analyst" ? "Active" : "Ready"}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Processing insights...</span>
                  </div>
                </div>
                <svg className="w-12 h-6 text-emerald-400 stroke-current fill-none stroke-2">
                  <path d="M 2 16 Q 10 20 18 8 T 32 12 T 46 4" />
                </svg>
              </div>

              {/* Agent 3: Writer */}
              <div
                className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                  activeAgent === "writer"
                    ? "border-emerald-500/80 bg-[#0c1822]"
                    : "border-[#1b263b] bg-[#0d1424]/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-300">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Writer</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full border border-slate-400" />
                      <span>{activeAgent === "writer" ? "Active" : "Idle"}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Waiting for input...</span>
                  </div>
                </div>
                <svg className="w-12 h-6 text-slate-500 stroke-current fill-none stroke-2">
                  <path d="M 2 12 L 14 12 L 26 8 L 38 14 L 46 10" />
                </svg>
              </div>

              {/* Agent 4: Coder */}
              <div className="p-3 rounded-xl border border-[#1b263b] bg-[#0d1424]/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-300">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Coder</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Active</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Generating code...</span>
                  </div>
                </div>
                <svg className="w-12 h-6 text-emerald-400 stroke-current fill-none stroke-2">
                  <path d="M 2 18 Q 12 6 22 14 T 36 6 T 46 8" />
                </svg>
              </div>

              {/* Agent 5: Complex */}
              <div className="p-3 rounded-xl border border-[#1b263b] bg-[#0d1424]/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-300">
                    <Box className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Complex</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full border border-slate-400" />
                      <span>Pending</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Planning next steps...</span>
                  </div>
                </div>
                <svg className="w-12 h-6 text-slate-500 stroke-current fill-none stroke-2">
                  <path d="M 2 14 L 14 8 L 26 14 L 38 10 L 46 12" />
                </svg>
              </div>
            </div>
          </div>

          {/* COLUMN 2: CENTER WORKFLOW GRAPH & TIMELINE (Cols 6) */}
          <div className="col-span-6 flex flex-col gap-4 overflow-hidden">
            {/* Top Graph with dynamic expanding lines */}
            <WorkflowGraph
              activeAgent={activeAgent}
              isRunning={status === "RUNNING"}
              researchCount={researchCount}
            />

            {/* Bottom Task Timeline */}
            <div className="flex-1 bg-[#0b101d] border border-[#1b263b] rounded-2xl p-4 shadow-lg flex flex-col justify-between">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-[#1b263b]/70">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Task Timeline</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0e1424] border border-[#1e293b] text-[10px] text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Real-time</span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </div>
              </div>

              {/* Progress Bar Rows */}
              <div className="flex flex-col gap-2.5 text-xs pt-1">
                {/* Researcher */}
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="w-20 text-[11px] font-medium text-slate-300">Researcher</span>
                  <div className="flex-1 bg-[#131b2c] h-2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400 w-4/5" />
                  </div>
                  <span className="text-[11px] text-emerald-400 font-medium w-24 text-right">Completed ✔</span>
                </div>

                {/* Analyst */}
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="w-20 text-[11px] font-medium text-slate-300">Analyst</span>
                  <div className="flex-1 bg-[#131b2c] h-2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-slate-400 w-3/5" />
                  </div>
                  <span className="text-[11px] text-emerald-400 font-medium w-24 text-right">Completed ✔</span>
                </div>

                {/* Writer */}
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="w-20 text-[11px] font-medium text-slate-300">Writer</span>
                  <div className="flex-1 bg-[#131b2c] h-2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-slate-500 w-2/5" />
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium w-24 text-right">In Progress... ⚪</span>
                </div>

                {/* Coder */}
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="w-20 text-[11px] font-medium text-slate-300">Coder</span>
                  <div className="flex-1 bg-[#131b2c] h-2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-slate-600 w-1/5" />
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium w-24 text-right">Pending ⏱</span>
                </div>

                {/* Complex */}
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border border-slate-600" />
                  <span className="w-20 text-[11px] font-medium text-slate-400">Complex</span>
                  <div className="flex-1 bg-[#131b2c] h-2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-slate-700 w-2/5" />
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium w-24 text-right">Queued ⏱</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 3: ACTIVITY FEED & CHAT (Cols 3) */}
          <div className="col-span-3 flex flex-col bg-[#0b101d] border border-[#1b263b] rounded-2xl p-4 shadow-lg overflow-hidden justify-between">
            <div className="flex justify-between items-center pb-3 border-b border-[#1b263b]/70 text-xs font-bold text-white">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <span>Activity Feed</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </div>

            {/* Vertical Connected Feed */}
            <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-4 pr-1">
              {activities.map((item, idx) => (
                <div key={idx} className="relative flex items-start gap-3 text-xs">
                  {/* Vertical connecting line */}
                  {idx !== activities.length - 1 && (
                    <div className="absolute left-1.5 top-5 w-px h-full bg-[#1e293b]" />
                  )}

                  {/* Dot */}
                  <div
                    className={`relative z-10 w-3 h-3 rounded-full mt-0.5 ${
                      item.active ? "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" : "bg-slate-600"
                    }`}
                  />

                  {/* Content Card */}
                  <div className="flex-1 bg-[#0d1424]/70 border border-[#1b263b] rounded-xl p-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-white">{item.agent}</span>
                      <span className="text-slate-500 text-[10px]">{item.time}</span>
                    </div>

                    <div className="flex items-start gap-2 text-[11px] text-slate-300 leading-snug">
                      <div className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 mt-0.5">
                        {item.iconType === "globe" && <Globe className="w-3 h-3" />}
                        {item.iconType === "chart" && <BarChart3 className="w-3 h-3" />}
                        {item.iconType === "edit" && <Edit3 className="w-3 h-3" />}
                        {item.iconType === "code" && <Code2 className="w-3 h-3" />}
                        {item.iconType === "box" && <Box className="w-3 h-3" />}
                      </div>
                      <p className="flex-1">{item.text}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={activityScrollRef} />
            </div>

            {/* Bottom Message Input Field */}
            <form onSubmit={handleMessageSubmit} className="pt-3 border-t border-[#1b263b]/70 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={status === "RUNNING"}
                placeholder="Send a message..."
                className="flex-1 bg-[#0e1424] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={status === "RUNNING" || !chatInput.trim()}
                className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition-colors disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
