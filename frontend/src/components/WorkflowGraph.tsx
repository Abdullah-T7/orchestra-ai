"use client";

import React, { useState } from "react";
import { Database, Search, Settings, Grid, BarChart3, Edit3, Share2, Maximize2 } from "lucide-react";

interface WorkflowGraphProps {
  activeAgent: string | null;
  isRunning: boolean;
  researchCount: number;
}

export default function WorkflowGraph({
  activeAgent,
  isRunning,
  researchCount,
}: WorkflowGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Generate dynamic search satellite nodes as search increases
  const dynamicSourceNodes = Array.from({ length: Math.min(researchCount, 8) }).map((_, i) => {
    const angle = (Math.PI * 0.7) + (i * 0.35);
    const radius = 65;
    return {
      id: `dyn-src-${i}`,
      label: `Src #${i + 1}`,
      x: 230 - Math.cos(angle) * radius,
      y: 155 - Math.sin(angle) * radius,
    };
  });

  return (
    <div className="relative w-full h-[370px] bg-[#0c1220] border border-[#1b263b] rounded-2xl overflow-hidden shadow-lg flex flex-col">
      {/* Card Header */}
      <div className="flex justify-between items-center px-5 py-3 border-b border-[#1b263b]/70 bg-[#0a0f1d]/50">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-white tracking-wide">Multi-Agent Workflow Graph</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live</span>
          </div>
          <button className="text-slate-500 hover:text-slate-300 transition-colors">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative flex-1">
        {/* Subtle Background Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
          <defs>
            <pattern id="wf-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#334155" strokeWidth="0.7" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wf-grid)" />
        </svg>

        <svg viewBox="0 0 760 310" className="w-full h-full">
          <defs>
            {/* Marker arrow definition */}
            <marker
              id="arrowhead"
              markerWidth="7"
              markerHeight="5"
              refX="6"
              refY="2.5"
              orient="auto"
            >
              <polygon points="0 0, 7 2.5, 0 5" fill="#475569" />
            </marker>
            <marker
              id="arrowhead-active"
              markerWidth="7"
              markerHeight="5"
              refX="6"
              refY="2.5"
              orient="auto"
            >
              <polygon points="0 0, 7 2.5, 0 5" fill="#10b981" />
            </marker>
          </defs>

          {/* Core Curved Connecting Bezier Edges */}
          {/* Supervisor (380, 155) -> Source Cache (380, 50) */}
          <path
            d="M 380 120 L 380 75"
            stroke={isRunning ? "#10b981" : "#334155"}
            strokeWidth={1.5}
            fill="none"
            markerEnd={isRunning ? "url(#arrowhead-active)" : "url(#arrowhead)"}
          />

          {/* Supervisor -> Search Engine (230, 155) */}
          <path
            d="M 345 155 Q 295 155 265 155"
            stroke={activeAgent === "researcher" ? "#10b981" : "#334155"}
            strokeWidth={activeAgent === "researcher" ? 2 : 1.5}
            fill="none"
            markerEnd={activeAgent === "researcher" ? "url(#arrowhead-active)" : "url(#arrowhead)"}
          />

          {/* Supervisor -> Strategy Planner (230, 245) */}
          <path
            d="M 350 175 Q 290 215 260 235"
            stroke="#334155"
            strokeWidth={1.5}
            fill="none"
            markerEnd="url(#arrowhead)"
          />

          {/* Supervisor -> SWOT Matrix (380, 255) */}
          <path
            d="M 380 190 L 380 235"
            stroke={activeAgent === "analyst" ? "#10b981" : "#334155"}
            strokeWidth={1.5}
            fill="none"
            markerEnd={activeAgent === "analyst" ? "url(#arrowhead-active)" : "url(#arrowhead)"}
          />

          {/* Supervisor -> Analyst (530, 155) */}
          <path
            d="M 415 155 Q 465 155 495 155"
            stroke={activeAgent === "analyst" ? "#10b981" : "#334155"}
            strokeWidth={activeAgent === "analyst" ? 2 : 1.5}
            fill="none"
            markerEnd={activeAgent === "analyst" ? "url(#arrowhead-active)" : "url(#arrowhead)"}
          />

          {/* Supervisor -> Writer (530, 245) */}
          <path
            d="M 410 175 Q 470 215 500 235"
            stroke={activeAgent === "writer" ? "#10b981" : "#334155"}
            strokeWidth={activeAgent === "writer" ? 2 : 1.5}
            fill="none"
            markerEnd={activeAgent === "writer" ? "url(#arrowhead-active)" : "url(#arrowhead)"}
          />

          {/* DYNAMIC BRANCHING LINES: Increase as search increases */}
          {dynamicSourceNodes.map((src, i) => (
            <g key={src.id}>
              {/* Line from Search Engine to Discovered Source */}
              <line
                x1={230}
                y1={155}
                x2={src.x}
                y2={src.y}
                stroke="#10b981"
                strokeWidth={1.2}
                strokeOpacity={0.8}
                strokeDasharray="2,3"
              />
              {/* Line connecting Source into Source Cache */}
              <line
                x1={src.x}
                y1={src.y}
                x2={380}
                y2={50}
                stroke="#06b6d4"
                strokeWidth={0.8}
                strokeOpacity={0.4}
              />
              {/* Source Circle Node */}
              <circle
                cx={src.x}
                cy={src.y}
                r={4}
                fill="#10b981"
                className="animate-pulse"
              />
              <text
                x={src.x}
                y={src.y - 7}
                textAnchor="middle"
                fontSize={8}
                fill="#94a3b8"
                className="select-none"
              >
                {src.label}
              </text>
            </g>
          ))}

          {/* --- SURROUNDING WORKFLOW NODES --- */}

          {/* 1. Source Cache (Top) */}
          <g className="cursor-pointer">
            <rect x={348} y={32} width={64} height={36} rx={18} fill="#131b2e" stroke="#1e293b" strokeWidth={1.5} />
            <circle cx={366} cy={50} r={10} fill="#1e293b" />
            <foreignObject x={358} y={42} width={16} height={16}>
              <Database className="w-4 h-4 text-slate-300" />
            </foreignObject>
            <text x={380} y={82} textAnchor="middle" fontSize={10} fontWeight={600} fill="#e2e8f0">Source Cache</text>
          </g>

          {/* 2. Search Engine (Left) */}
          <g className="cursor-pointer">
            <circle cx={230} cy={155} r={22} fill="#131b2e" stroke={activeAgent === "researcher" ? "#10b981" : "#1e293b"} strokeWidth={1.5} />
            <foreignObject x={221} y={146} width={18} height={18}>
              <Search className="w-4.5 h-4.5 text-slate-300" />
            </foreignObject>
            <text x={230} y={192} textAnchor="middle" fontSize={10} fontWeight={600} fill="#e2e8f0">Search Engine</text>
          </g>

          {/* 3. Strategy Planner (Bottom Left) */}
          <g className="cursor-pointer">
            <circle cx={230} cy={245} r={22} fill="#131b2e" stroke="#1e293b" strokeWidth={1.5} />
            <foreignObject x={221} y={236} width={18} height={18}>
              <Settings className="w-4.5 h-4.5 text-slate-300" />
            </foreignObject>
            <text x={230} y={282} textAnchor="middle" fontSize={10} fontWeight={600} fill="#e2e8f0">Strategy Planner</text>
          </g>

          {/* 4. SWOT Matrix (Bottom) */}
          <g className="cursor-pointer">
            <rect x={348} y={235} width={64} height={36} rx={18} fill="#131b2e" stroke="#1e293b" strokeWidth={1.5} />
            <circle cx={366} cy={253} r={10} fill="#1e293b" />
            <foreignObject x={358} y={245} width={16} height={16}>
              <Grid className="w-4 h-4 text-slate-300" />
            </foreignObject>
            <text x={380} y={286} textAnchor="middle" fontSize={10} fontWeight={600} fill="#e2e8f0">SWOT Matrix</text>
          </g>

          {/* 5. Analyst (Right) */}
          <g className="cursor-pointer">
            <circle cx={530} cy={155} r={22} fill="#131b2e" stroke={activeAgent === "analyst" ? "#10b981" : "#1e293b"} strokeWidth={1.5} />
            <foreignObject x={521} y={146} width={18} height={18}>
              <BarChart3 className="w-4.5 h-4.5 text-slate-300" />
            </foreignObject>
            <text x={530} y={192} textAnchor="middle" fontSize={10} fontWeight={600} fill="#e2e8f0">Analyst</text>
          </g>

          {/* 6. Writer (Bottom Right) */}
          <g className="cursor-pointer">
            <circle cx={530} cy={245} r={22} fill="#131b2e" stroke={activeAgent === "writer" ? "#10b981" : "#1e293b"} strokeWidth={1.5} />
            <foreignObject x={521} y={236} width={18} height={18}>
              <Edit3 className="w-4.5 h-4.5 text-slate-300" />
            </foreignObject>
            <text x={530} y={282} textAnchor="middle" fontSize={10} fontWeight={600} fill="#e2e8f0">Writer</text>
          </g>

          {/* --- CENTRAL SUPERVISOR CORE (The Glowing Hero) --- */}
          <g className="cursor-pointer">
            {/* Outer Emerald Glow Halo */}
            <circle
              cx={380}
              cy={155}
              r={38}
              fill="none"
              stroke="#10b981"
              strokeWidth={2}
              strokeOpacity={0.8}
              className={isRunning ? "animate-pulse" : ""}
            />
            {/* Inner Translucent Glow Ring */}
            <circle cx={380} cy={155} r={33} fill="#0d2e26" stroke="#10b981" strokeWidth={1.5} />
            <circle cx={380} cy={155} r={26} fill="#061f19" />
            <foreignObject x={368} y={143} width={24} height={24}>
              <Share2 className="w-6 h-6 text-emerald-400" />
            </foreignObject>
            <text x={380} y={206} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#ffffff">
              Supervisor Core
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}

