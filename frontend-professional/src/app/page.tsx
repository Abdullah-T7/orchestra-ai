"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Check,
  Circle,
  Copy,
  Download,
  LoaderCircle,
  MessageSquareText,
  Network,
  Search,
  Sparkles,
} from "lucide-react";
import WorkflowGraph from "@/components/WorkflowGraph";

function renderMarkdown(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(<ul key={`ul-${key++}`}>{listItems}</ul>);
      listItems = [];
    }
  };

  const formatInline = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={i}>{part.slice(1, -1)}</code>;
      }
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        return (
          <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer">
            {linkMatch[1]}
          </a>
        );
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      flushList();
      continue;
    }

    if (line.startsWith("---") || line.startsWith("***")) {
      flushList();
      elements.push(<hr key={`hr-${key++}`} />);
    } else if (line.startsWith("# ")) {
      flushList();
      elements.push(<h1 key={`h1-${key++}`}>{formatInline(line.slice(2))}</h1>);
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(<h2 key={`h2-${key++}`}>{formatInline(line.slice(3))}</h2>);
    } else if (line.startsWith("### ")) {
      flushList();
      elements.push(<h3 key={`h3-${key++}`}>{formatInline(line.slice(4))}</h3>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      listItems.push(<li key={`li-${key++}`}>{formatInline(line.slice(2))}</li>);
    } else if (/^\d+\.\s/.test(line)) {
      const text = line.replace(/^\d+\.\s/, "");
      listItems.push(<li key={`li-${key++}`}>{formatInline(text)}</li>);
    } else if (line.startsWith("> ")) {
      flushList();
      elements.push(<blockquote key={`bq-${key++}`}>{formatInline(line.slice(2))}</blockquote>);
    } else {
      flushList();
      elements.push(<p key={`p-${key++}`}>{formatInline(line)}</p>);
    }
  }

  flushList();
  return elements;
}

interface ActivityItem {
  agent: string;
  time: string;
  text: string;
  stage: "system" | "researcher" | "analyst" | "writer";
}

type MissionStatus = "IDLE" | "RUNNING" | "COMPLETED" | "ERROR";

const initialProgress = { researcher: 0, analyst: 0, writer: 0 };

export default function Page() {
  const [chatInput, setChatInput] = useState("");
  const [status, setStatus] = useState<MissionStatus>("IDLE");
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [currentTask, setCurrentTask] = useState("Ready for a new mission");
  const [researchCount, setResearchCount] = useState(0);
  const [progress, setProgress] = useState(initialProgress);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [finalReport, setFinalReport] = useState<string | null>(null);
  const [reportActionMessage, setReportActionMessage] = useState("");
  const [missionObjective, setMissionObjective] = useState("");
  const [runId, setRunId] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activities, finalReport]);

  useEffect(() => () => socketRef.current?.close(), []);

  const addActivity = (
    agent: string,
    text: string,
    stage: ActivityItem["stage"],
  ) => {
    setActivities((previous) => [
      ...previous,
      {
        agent,
        text,
        stage,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  const executeMission = (objective: string) => {
    const cleanObjective = objective.trim();
    if (status === "RUNNING" || !cleanObjective) return;

    socketRef.current?.close();
    setMissionObjective(cleanObjective);
    setStatus("RUNNING");
    setActiveAgent("supervisor");
    setCurrentTask("Planning research");
    setResearchCount(0);
    setProgress(initialProgress);
    setFinalReport(null);
    setReportActionMessage("");
    setRunId((current) => current + 1);
    setActivities([
      {
        agent: "You",
        text: cleanObjective,
        stage: "system",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    const socketUrl =
      process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/missions";
    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ objective: cleanObjective }));
    };

    socket.onmessage = (event) => {
      let data: {
        type?: string;
        active_agent?: string;
        research_count?: number;
        final_report?: string | null;
        message?: string;
      };

      try {
        data = JSON.parse(event.data);
      } catch {
        setStatus("ERROR");
        setActiveAgent(null);
        setCurrentTask("Invalid response from server");
        addActivity("System", "Received an unreadable response from the server.", "system");
        socket.close();
        return;
      }

      if (data.type === "NODE_UPDATE") {
        const agent = data.active_agent ?? "supervisor";
        setActiveAgent(agent);
        if (data.final_report) setFinalReport(data.final_report);

        if (agent === "researcher") {
          const count = data.research_count ?? 0;
          setResearchCount(count);
          setProgress((previous) => ({ ...previous, researcher: 100 }));
          setCurrentTask("Researching the market");
          addActivity(
            "Research",
            count > 0
              ? `Collected ${count} market source${count === 1 ? "" : "s"} for review.`
              : "Searching for market evidence and competitor signals.",
            "researcher",
          );
        } else if (agent === "analyst") {
          setProgress((previous) => ({
            ...previous,
            researcher: 100,
            analyst: 100,
          }));
          setCurrentTask("Evaluating the opportunity");
          addActivity(
            "Analysis",
            "Comparing market signals, competition, and customer needs.",
            "analyst",
          );
        } else if (agent === "writer") {
          setProgress((previous) => ({
            ...previous,
            researcher: 100,
            analyst: 100,
            writer: 100,
          }));
          setCurrentTask("Building the strategy");
          addActivity(
            "Strategy",
            "Turning the analysis into a positioning and launch plan.",
            "writer",
          );
        } else {
          setCurrentTask("Coordinating the workflow");
        }
      }

      if (data.type === "MISSION_COMPLETE") {
        setStatus("COMPLETED");
        setActiveAgent(null);
        setCurrentTask("Mission complete");
        setProgress({ researcher: 100, analyst: 100, writer: 100 });
        if (data.final_report) setFinalReport(data.final_report);
        addActivity("System", "The strategy brief is ready.", "system");
        socket.close();
      }

      if (data.type === "ERROR") {
        setStatus("ERROR");
        setActiveAgent(null);
        setCurrentTask("Mission could not be completed");
        addActivity(
          "System",
          data.message || "The server returned an unknown error.",
          "system",
        );
        socket.close();
      }
    };

    socket.onerror = () => {
      setStatus("ERROR");
      setActiveAgent(null);
      setCurrentTask("Could not connect to the mission server");
      addActivity(
        "System",
        "Connection failed. Check that the backend is running, then try again.",
        "system",
      );
    };
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const objective = chatInput.trim();
    if (!objective) return;
    setChatInput("");
    executeMission(objective);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const copyReport = async () => {
    if (!finalReport) return;

    try {
      await navigator.clipboard.writeText(finalReport);
      setReportActionMessage("Copied to clipboard");
    } catch (error) {
      console.error("Could not copy strategy brief:", error);
      setReportActionMessage("Copy failed. Check browser clipboard permissions.");
    }
  };

  const downloadReport = () => {
    if (!finalReport) return;

    const fileName = missionObjective
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "strategy-brief";
    const url = URL.createObjectURL(
      new Blob([finalReport], { type: "text/markdown;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}-strategy.md`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setReportActionMessage("Brief downloaded");
  };

  const stages = [
    { key: "researcher", label: "Research", detail: "Market & competitors" },
    { key: "analyst", label: "Analysis", detail: "Opportunity & risks" },
    { key: "writer", label: "Strategy", detail: "Positioning & launch" },
  ] as const;

  const statusLabel =
    status === "RUNNING"
      ? "Running"
      : status === "COMPLETED"
        ? "Complete"
        : status === "ERROR"
          ? "Needs attention"
          : "Ready";

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <a className="brand-lockup" href="#" aria-label="Orchestra home">
          <span className="brand-mark"><Network size={16} strokeWidth={1.7} /></span>
          <span>
            <strong>Orchestra</strong>
            <small>Strategy workspace</small>
          </span>
        </a>
        <div className="header-context">
          <span className="workspace-name">Untitled workspace</span>
          <span className="header-divider" />
          <span className={`status-indicator status-${status.toLowerCase()}`}>
            <i />
            {statusLabel}
          </span>
        </div>
        <button
          className="new-mission-button"
          type="button"
          onClick={() => {
            socketRef.current?.close();
            setStatus("IDLE");
            setActiveAgent(null);
            setCurrentTask("Ready for a new mission");
            setResearchCount(0);
            setProgress(initialProgress);
            setActivities([]);
            setFinalReport(null);
            setReportActionMessage("");
            setMissionObjective("");
            setChatInput("");
          }}
        >
          New mission
        </button>
      </header>

      <div className="workspace-layout">
        <section className="canvas-column" aria-label="Mission graph and progress">
          <div className="mission-heading">
            <div className="mission-heading-copy">
              <span className="eyebrow">LIVE SIMULATION</span>
              <h1>{missionObjective || "Explore a strategic opportunity"}</h1>
              <p>{currentTask}</p>
            </div>
            <div className="simulation-stats">
              <div>
                <strong>{researchCount}</strong>
                <span>Sources</span>
              </div>
              <span className="stat-divider" />
              <div>
                <strong>{Object.values(progress).filter((value) => value === 100).length}<span>/3</span></strong>
                <span>Stages</span>
              </div>
            </div>
          </div>

          <WorkflowGraph
            activeAgent={activeAgent}
            running={status === "RUNNING"}
            completed={status === "COMPLETED"}
            signalCount={researchCount}
            runId={runId}
          />

          <section className="stage-panel" aria-label="Mission stages">
            <div className="stage-panel-heading">
              <div>
                <span className="eyebrow">WORKFLOW</span>
                <h2>Mission progress</h2>
              </div>
              <span className="stage-count">
                {Object.values(progress).filter((value) => value === 100).length} of 3 complete
              </span>
            </div>
            <div className="stage-list">
              {stages.map((stage, index) => {
                const complete = progress[stage.key] === 100;
                const active = activeAgent === stage.key;

                return (
                  <div className="stage-row" key={stage.key}>
                    <div className={`stage-icon ${complete ? "is-complete" : active ? "is-active" : ""}`}>
                      {complete ? (
                        <Check size={15} />
                      ) : active ? (
                        <LoaderCircle size={15} className="spin" />
                      ) : (
                        <span>{String(index + 1).padStart(2, "0")}</span>
                      )}
                    </div>
                    <div className="stage-copy">
                      <strong>{stage.label}</strong>
                      <span>{stage.detail}</span>
                    </div>
                    <div className="stage-progress-track">
                      <span style={{ width: `${progress[stage.key]}%` }} />
                    </div>
                    <span className="stage-status">
                      {complete ? "Complete" : active ? "Working" : "Queued"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {finalReport && (
            <section className="report-panel">
              <div className="stage-panel-heading">
                <div>
                  <span className="eyebrow">DELIVERABLE</span>
                  <h2>Strategy brief</h2>
                </div>
                <div className="report-actions">
                  <button type="button" onClick={copyReport}>
                    <Copy size={13} />
                    Copy
                  </button>
                  <button type="button" onClick={downloadReport}>
                    <Download size={13} />
                    Download
                  </button>
                </div>
              </div>
              <article className="strategy-markdown">
                {renderMarkdown(finalReport)}
              </article>
              <p className="report-action-message" role="status">{reportActionMessage}</p>
            </section>
          )}
        </section>

        <aside className="chat-panel" aria-label="Mission chat">
          <div className="chat-header">
            <div className="chat-title">
              <span className="chat-icon"><MessageSquareText size={16} /></span>
              <span>
                <strong>Mission room</strong>
                <small>Plan, run, and review</small>
              </span>
            </div>
            <span className={`chat-live ${status === "RUNNING" ? "is-running" : ""}`}>
              <i /> {status === "RUNNING" ? "Live" : "Ready"}
            </span>
          </div>

          <div className="chat-feed">
            {activities.length === 0 ? (
              <div className="chat-empty">
                <span className="empty-mark"><Sparkles size={18} /></span>
                <h2>Start with a question</h2>
                <p>Describe a market, product, or business decision. Your agents will research it and build a strategy.</p>
                <button
                  type="button"
                  className="suggestion"
                  onClick={() => setChatInput("Find an underserved opportunity in restaurant inventory software and create a launch strategy.")}
                >
                  <Search size={14} />
                  <span>Explore a market opportunity</span>
                </button>
              </div>
            ) : (
              activities.map((activity, index) => (
                <article className={`message message-${activity.stage}`} key={`${activity.time}-${index}`}>
                  <div className="message-avatar">
                    {activity.stage === "system" ? (
                      <Sparkles size={14} />
                    ) : activity.stage === "researcher" ? (
                      <Search size={14} />
                    ) : activity.stage === "analyst" ? (
                      <Circle size={13} />
                    ) : (
                      <Network size={14} />
                    )}
                  </div>
                  <div className="message-content">
                    <div className="message-meta">
                      <strong>{activity.agent}</strong>
                      <time>{activity.time}</time>
                    </div>
                    <p>{activity.text}</p>
                  </div>
                </article>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <form className="composer" onSubmit={handleSubmit}>
            <label htmlFor="mission-input">MISSION OBJECTIVE</label>
            <div className="composer-box">
              <textarea
                id="mission-input"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={handleInputKeyDown}
                disabled={status === "RUNNING"}
                rows={3}
                placeholder="What opportunity should we explore?"
              />
              <div className="composer-footer">
                <span>Enter to send · Shift + Enter for a new line</span>
                <button
                  type="submit"
                  aria-label="Launch mission"
                  disabled={status === "RUNNING" || !chatInput.trim()}
                >
                  {status === "RUNNING" ? <LoaderCircle size={16} className="spin" /> : <ArrowUp size={17} />}
                </button>
              </div>
            </div>
          </form>
        </aside>
      </div>
    </main>
  );
}
