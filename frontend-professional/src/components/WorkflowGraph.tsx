"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";

interface WorkflowGraphProps {
  activeAgent: string | null;
  running: boolean;
  completed: boolean;
  signalCount: number;
  runId: number;
}

interface SignalNode {
  x: number;
  y: number;
  label: string;
  group: "research" | "analysis" | "strategy";
}

const signalPositions: SignalNode[] = [
  { x: 74, y: 104, label: "Market", group: "research" },
  { x: 173, y: 73, label: "Demand", group: "research" },
  { x: 82, y: 196, label: "Pricing", group: "research" },
  { x: 228, y: 126, label: "Players", group: "research" },
  { x: 132, y: 280, label: "Reviews", group: "research" },
  { x: 46, y: 325, label: "Trends", group: "research" },
  { x: 196, y: 353, label: "Segments", group: "research" },
  { x: 76, y: 442, label: "Pain points", group: "research" },
  { x: 225, y: 475, label: "Channels", group: "research" },
  { x: 115, y: 535, label: "Adoption", group: "research" },
  { x: 273, y: 278, label: "Sources", group: "research" },
  { x: 34, y: 505, label: "Competition", group: "research" },
  { x: 382, y: 77, label: "Market gap", group: "analysis" },
  { x: 465, y: 96, label: "Differentiation", group: "analysis" },
  { x: 418, y: 296, label: "Customer fit", group: "analysis" },
  { x: 511, y: 269, label: "Economics", group: "analysis" },
  { x: 375, y: 358, label: "Risks", group: "analysis" },
  { x: 523, y: 374, label: "Retention", group: "analysis" },
  { x: 720, y: 94, label: "Positioning", group: "strategy" },
  { x: 768, y: 168, label: "MVP scope", group: "strategy" },
  { x: 746, y: 255, label: "Pricing model", group: "strategy" },
  { x: 781, y: 443, label: "Launch", group: "strategy" },
  { x: 706, y: 508, label: "Growth loop", group: "strategy" },
  { x: 585, y: 520, label: "Milestones", group: "strategy" },
  { x: 314, y: 515, label: "Integrations", group: "research" },
  { x: 606, y: 78, label: "Opportunity", group: "analysis" },
  { x: 424, y: 469, label: "Execution", group: "strategy" },
  { x: 753, y: 328, label: "Acquisition", group: "strategy" },
  { x: 278, y: 75, label: "Workflows", group: "research" },
  { x: 603, y: 450, label: "North star", group: "strategy" },
  { x: 354, y: 143, label: "Customer pain", group: "analysis" },
  { x: 702, y: 195, label: "Value prop", group: "strategy" },
];

export default function WorkflowGraph({
  activeAgent,
  running,
  completed,
  signalCount,
  runId,
}: WorkflowGraphProps) {
  const [visibleSignals, setVisibleSignals] = useState(0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setVisibleSignals(0);
  }, [runId]);

  useEffect(() => {
    if (!running && !completed) return;

    const timer = window.setInterval(() => {
      setVisibleSignals((current) => {
        const target = signalPositions.length;
        if (current >= target) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, completed ? 170 : 480);

    return () => window.clearInterval(timer);
  }, [running, completed, runId]);

  const activeStage = activeAgent === "researcher"
    ? "Mapping the market"
    : activeAgent === "analyst"
      ? "Connecting insights"
      : activeAgent === "writer"
        ? "Forming strategy"
        : running
          ? "Orchestrating agents"
          : completed
            ? "Network assembled"
            : "Awaiting a mission";
  const researchNodes = signalPositions
    .slice(0, visibleSignals)
    .filter((node) => node.group === "research");
  const analysisNodes = signalPositions
    .slice(0, visibleSignals)
    .filter((node) => node.group === "analysis");
  const strategyNodes = signalPositions
    .slice(0, visibleSignals)
    .filter((node) => node.group === "strategy");
  const viewWidth = 820 / zoom;
  const viewHeight = 600 / zoom;
  const viewBox = `${(820 - viewWidth) / 2} ${(600 - viewHeight) / 2} ${viewWidth} ${viewHeight}`;

  return (
    <section className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
      <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
            <span className={`h-1.5 w-1.5 rounded-full ${running ? "animate-pulse bg-zinc-900" : "bg-zinc-300"}`} />
            {running ? "Simulation running" : "Simulation canvas"}
          </div>
          <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-zinc-900">Agent network</h2>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-medium text-zinc-800">{activeStage}</p>
          <p className="mt-0.5 text-[10px] text-zinc-400">
            {visibleSignals} nodes · {signalCount} sources
          </p>
        </div>
      </header>

      <div className="relative h-[min(62vh,660px)] min-h-[430px] bg-[#fdfdfc]">
        <svg
          viewBox={viewBox}
          className="h-full w-full"
          role="img"
          aria-label={`Live agent network visualization with ${visibleSignals} nodes mapped`}
        >
          <defs>
            <pattern id="canvas-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#e9e9e7" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="820" height="600" fill="url(#canvas-grid)" />

          <g className={running ? "graph-links graph-links-active" : "graph-links"}>
            {researchNodes.map((signal, index) => (
              <path
                key={`research-link-${index}`}
                d={`M ${signal.x} ${signal.y} Q ${(signal.x + 330) / 2} ${(signal.y + 205) / 2 - 16} 330 205`}
                fill="none"
                stroke="#27272a"
                strokeOpacity="0.32"
                strokeWidth="1.1"
                className="link-draw"
                style={{ animationDelay: `${Math.min(index * 35, 350)}ms` }}
              />
            ))}
            {analysisNodes.map((signal, index) => (
              <path
                key={`analysis-link-${index}`}
                d={`M 555 150 Q ${(signal.x + 555) / 2} ${(signal.y + 150) / 2} ${signal.x} ${signal.y}`}
                fill="none"
                stroke="#52525b"
                strokeOpacity="0.38"
                strokeWidth="1.1"
                className="link-draw"
                style={{ animationDelay: `${Math.min(index * 40, 360)}ms` }}
              />
            ))}
            {strategyNodes.map((signal, index) => (
              <path
                key={`strategy-link-${index}`}
                d={`M 665 365 Q ${(signal.x + 665) / 2} ${(signal.y + 365) / 2} ${signal.x} ${signal.y}`}
                fill="none"
                stroke="#52525b"
                strokeOpacity="0.38"
                strokeWidth="1.1"
                className="link-draw"
                style={{ animationDelay: `${Math.min(index * 40, 360)}ms` }}
              />
            ))}
            <path className="core-link" d="M 365 195 C 420 150 465 145 520 150" fill="none" stroke="#18181b" strokeWidth="1.5" />
            <path className="core-link" d="M 580 178 C 630 220 654 270 665 327" fill="none" stroke="#18181b" strokeWidth="1.5" />
            <path className="core-link" d="M 360 228 C 430 280 520 330 630 360" fill="none" stroke="#a1a1aa" strokeWidth="1.2" strokeDasharray="4 5" />
            <path className="core-link" d="M 555 190 C 560 280 605 340 642 360" fill="none" stroke="#a1a1aa" strokeWidth="1.2" strokeDasharray="4 5" />
          </g>

          {signalPositions.slice(0, visibleSignals).map((signal, index) => (
            <g
              key={`${runId}-${index}`}
              className={`signal-node signal-appear ${running ? "signal-node-moving" : ""}`}
              style={{ animationDelay: `${Math.min(index * 35, 420)}ms` }}
            >
              <g className={running ? "signal-node-moving" : ""}>
                <circle cx={signal.x} cy={signal.y} r="5" fill="white" stroke="#18181b" strokeWidth="1.4" />
                <circle cx={signal.x} cy={signal.y} r="1.5" fill="#18181b" />
                <text
                  x={signal.x}
                  y={signal.y - 10}
                  textAnchor="middle"
                  className="fill-zinc-500"
                  fontSize="9"
                >
                  {signal.label}
                </text>
              </g>
            </g>
          ))}

          <g>
            <circle cx="330" cy="205" r="44" fill={activeAgent === "researcher" ? "#f4f4f5" : "white"} stroke="#18181b" strokeWidth={activeAgent === "researcher" ? "2" : "1.4"} />
            <circle className={running && activeAgent === "researcher" ? "agent-pulse" : ""} cx="330" cy="205" r="50" fill="none" stroke="#18181b" strokeOpacity={activeAgent === "researcher" ? "0.12" : "0"} strokeWidth="1" />
            <text x="330" y="202" textAnchor="middle" className="fill-zinc-900" fontSize="12" fontWeight="600">Research</text>
            <text x="330" y="220" textAnchor="middle" className="fill-zinc-500" fontSize="9">market signals</text>
          </g>

          <g>
            <circle cx="555" cy="150" r="36" fill={activeAgent === "analyst" ? "#f4f4f5" : "white"} stroke="#18181b" strokeWidth={activeAgent === "analyst" ? "2" : "1.4"} />
            <text x="555" y="147" textAnchor="middle" className="fill-zinc-900" fontSize="11" fontWeight="600">Analysis</text>
            <text x="555" y="164" textAnchor="middle" className="fill-zinc-500" fontSize="9">opportunity</text>
          </g>

          <g>
            <circle cx="665" cy="365" r="42" fill={activeAgent === "writer" ? "#f4f4f5" : "white"} stroke="#18181b" strokeWidth={activeAgent === "writer" ? "2" : "1.4"} />
            <text x="665" y="362" textAnchor="middle" className="fill-zinc-900" fontSize="11" fontWeight="600">Strategy</text>
            <text x="665" y="379" textAnchor="middle" className="fill-zinc-500" fontSize="9">launch plan</text>
          </g>

          <g>
            <rect x="390" y="405" width="130" height="48" rx="14" fill="white" stroke="#d4d4d8" strokeWidth="1.2" />
            <text x="455" y="425" textAnchor="middle" className="fill-zinc-800" fontSize="10" fontWeight="600">Mission objective</text>
            <text x="455" y="440" textAnchor="middle" className="fill-zinc-400" fontSize="9">decision context</text>
          </g>

          <text x="32" y="568" className="fill-zinc-400" fontSize="9" letterSpacing="1.5">LIVE KNOWLEDGE GRAPH</text>
        </svg>
        <div className="graph-controls" aria-label="Graph zoom controls">
          <button
            type="button"
            aria-label="Zoom out"
            title="Zoom out"
            disabled={zoom <= 0.7}
            onClick={() => setZoom((current) => Math.max(0.7, Math.round((current - 0.15) * 100) / 100))}
          >
            <Minus size={14} />
          </button>
          <span aria-live="polite">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            aria-label="Zoom in"
            title="Zoom in"
            disabled={zoom >= 1.6}
            onClick={() => setZoom((current) => Math.min(1.6, Math.round((current + 0.15) * 100) / 100))}
          >
            <Plus size={14} />
          </button>
          <span className="graph-control-divider" />
          <button
            type="button"
            aria-label="Reset graph zoom"
            title="Reset zoom"
            onClick={() => setZoom(1)}
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>
    </section>
  );
}
