import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import {
  Shield,
  Bell,
  Siren,
  RefreshCw,
  Globe,
  Activity,
  Users,
  Zap,
  TriangleAlert,
  Radio,
  Sparkles,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Card, Badge, Button, cn } from "@/components/ui-core";
import { apiFetch, apiStreamUrl } from "@/lib/api";

const ThreatGlobe = lazy(() => import("@/components/dashboard/ThreatGlobe"));
import CommandTimelinePanel, {
  type HistoryRow,
  type EscalationFeedRow,
} from "@/components/dashboard/CommandTimelinePanel";

type ThreatLevel = "low" | "medium" | "high" | "critical";
type ResponsePriority = "routine" | "priority" | "urgent" | "immediate";
type ConsoleAction = "recommend" | "escalate" | "dispatch";
type CommandScenarioType =
  | "flood_event"
  | "severe_storm"
  | "wildfire_risk"
  | "clinic_power_outage"
  | "multi_site_outage"
  | "child_emergency_sos";

type QueueItem = {
  kind: "alert" | "site";
  id: number;
  title: string;
  location: string;
  threatScore: number;
  threatLevel: ThreatLevel;
  responsePriority: ResponsePriority;
  recommendedAction: string;
};

type ThreatSite = {
  id: number;
  name: string;
  type: string;
  location: string;
  country: string;
  status: string;
  currentRiskLevel: string;
  powerAvailability: number;
  population: number;
  threatScore: number;
  threatLevel: ThreatLevel;
  responsePriority: ResponsePriority;
  recommendedAction: string;
  latitude?: number;
  longitude?: number;
};

type EscalationHotspot = {
  id: number;
  scenarioId: string;
  scenarioLabel: string;
  triggerModule: string;
  threatScore: number;
  escalationLevel: "site" | "district" | "regional-command" | "global-command";
  country?: string;
  latitude?: number;
  longitude?: number;
};

type LiveFeedItem = {
  id: string;
  label: string;
  tone: "critical" | "warning" | "info";
};

type AlertItem = {
  id: number;
  title: string;
  module: string;
  severity: string;
  status: string;
  location: string;
  threatScore: number;
  threatLevel: ThreatLevel;
  responsePriority: ResponsePriority;
  recommendedAction: string;
};

type DashboardStats = {
  totalSites: number;
  activeSites: number;
  activeAlerts: number;
  criticalAlerts: number;
  protectedPeople: number;
  protectedPersons: number;
  atRiskPeople: number;
  energyAvailability: number;
  disasterAlerts: number;
  criticalThreatSites: number;
  averageThreatScore: number;
  globeSites: ThreatSite[];
  topThreatSites: ThreatSite[];
  urgentQueue: QueueItem[];
  recentAlerts: AlertItem[];
  escalationHotspots?: EscalationHotspot[];
};

type DashboardHistoryRow = HistoryRow;
type DashboardEscalationRow = EscalationFeedRow;

type ConsolePreview = {
  scenarioType: CommandScenarioType;
  threatScore?: number;
  autoEscalation?: {
    escalationLevel?: string;
    deploymentMode?: string;
    operatorDirective?: string;
  };
};

type ConsoleActionResult = {
  ok?: boolean;
  message?: string;
  operatorDirective?: string;
  escalationLevel?: string;
  deploymentMode?: string;
  threatScore?: number;
};

function threatClass(level: ThreatLevel) {
  if (level === "critical") return "bg-red-500/15 text-red-400 border-red-500/30";
  if (level === "high") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  if (level === "medium") return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  return "bg-green-500/15 text-green-400 border-green-500/30";
}

function priorityClass(priority: ResponsePriority) {
  if (priority === "immediate") return "bg-red-500/15 text-red-400 border-red-500/30";
  if (priority === "urgent") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  if (priority === "priority") return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  return "bg-green-500/15 text-green-400 border-green-500/30";
}

function moduleTone(module: string) {
  const value = module.toLowerCase();
  if (value.includes("energy")) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
  if (value.includes("life")) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
  return "text-sky-400 border-sky-500/30 bg-sky-500/10";
}

function feedToneClass(tone: LiveFeedItem["tone"]) {
  if (tone === "critical") return "border-red-500/25 bg-red-500/10 text-red-200";
  if (tone === "warning") return "border-amber-500/25 bg-amber-500/10 text-amber-100";
  return "border-sky-500/25 bg-sky-500/10 text-sky-100";
}

function deriveScenarioFromQueueItem(item: QueueItem | null): CommandScenarioType {
  if (!item) return "multi_site_outage";

  const combined = `${item.title} ${item.location}`.toLowerCase();

  if (combined.includes("child") || combined.includes("sos")) return "child_emergency_sos";
  if (combined.includes("clinic") || combined.includes("hospital")) return "clinic_power_outage";
  if (combined.includes("flood")) return "flood_event";
  if (combined.includes("storm")) return "severe_storm";
  if (combined.includes("wildfire") || combined.includes("fire")) return "wildfire_risk";
  return "multi_site_outage";
}

function buildFallbackPreview(
  scenarioType: CommandScenarioType,
  result: ConsoleActionResult,
): ConsolePreview {
  return {
    scenarioType,
    threatScore: result.threatScore,
    autoEscalation: {
      escalationLevel: result.escalationLevel,
      deploymentMode: result.deploymentMode,
      operatorDirective: result.operatorDirective,
    },
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [liveFlashToken, setLiveFlashToken] = useState("");
  const [liveAlertStrip, setLiveAlertStrip] = useState("AI voice channel online. Monitoring global threat grid...");
  const [liveFeed, setLiveFeed] = useState<LiveFeedItem[]>([
    { id: "boot-1", label: "EarthShield monitoring active", tone: "info" },
    { id: "boot-2", label: "LifeMesh response network connected", tone: "info" },
    { id: "boot-3", label: "Energy resilience intelligence online", tone: "info" },
  ]);

  const [history, setHistory] = useState<DashboardHistoryRow[]>([]);
  const [escalations, setEscalations] = useState<DashboardEscalationRow[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const [selectedQueueItem, setSelectedQueueItem] = useState<QueueItem | null>(null);
  const [consolePreview, setConsolePreview] = useState<ConsolePreview | null>(null);
  const [consoleResponse, setConsoleResponse] = useState("AI console ready. Select a live queue target to begin.");
  const [consoleBusy, setConsoleBusy] = useState(false);
  const [consoleMode, setConsoleMode] = useState<ConsoleAction>("recommend");
  const [consoleError, setConsoleError] = useState<string | null>(null);

  const loadDashboard = async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      const json = (await apiFetch("/api/dashboard/stats")) as DashboardStats;
      setStats(json);

      setSelectedQueueItem((current) => {
        if (!json.urgentQueue?.length) return current;
        if (!current) return json.urgentQueue[0];
        return json.urgentQueue.find((item) => item.kind === current.kind && item.id === current.id) ?? json.urgentQueue[0];
      });
    } catch {
      if (!silent) setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadHistory = async (silent = false) => {
    try {
      if (!silent) setTimelineLoading(true);
      const json = (await apiFetch("/api/command-center/history")) as DashboardHistoryRow[];
      setHistory(json);
    } catch {
      if (!silent) setHistory([]);
    } finally {
      if (!silent) setTimelineLoading(false);
    }
  };

  const loadEscalations = async (silent = false) => {
    try {
      if (!silent) setTimelineLoading(true);
      const json = (await apiFetch("/api/command-center/escalations")) as DashboardEscalationRow[];
      setEscalations(json);
    } catch {
      if (!silent) setEscalations([]);
    } finally {
      if (!silent) setTimelineLoading(false);
    }
  };

  const runConsolePreview = async (item: QueueItem) => {
    try {
      setConsoleBusy(true);
      setConsoleError(null);
      setConsolePreview(null);
      setConsoleResponse(`AI preview running for ${item.title}...`);

      const scenarioType = deriveScenarioFromQueueItem(item);

      const res = (await apiFetch("/api/command-center/simulate", {
        method: "POST",
        body: JSON.stringify({
          scenarioType,
          item,
        }),
      })) as ConsolePreview & {
        autoEscalation?: {
          operatorDirective?: string;
          escalationLevel?: string;
          deploymentMode?: string;
        };
      };

      setConsolePreview(res);
      setConsoleResponse(
        `Preview complete → ${res?.autoEscalation?.operatorDirective || item.recommendedAction || "Operator review ready."}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Preview failed";
      setConsoleError(message);
      setConsoleResponse("AI preview failed. Check command-center integration.");
    } finally {
      setConsoleBusy(false);
    }
  };

  const runConsoleAction = async (action: ConsoleAction) => {
    if (!selectedQueueItem) {
      setConsoleError("No active queue target selected.");
      setConsoleResponse("Select a queue target before executing an action.");
      return;
    }

    try {
      setConsoleBusy(true);
      setConsoleError(null);
      setConsoleMode(action);
      setConsoleResponse(`AI processing "${action}" for ${selectedQueueItem.title}...`);

      const scenarioType = deriveScenarioFromQueueItem(selectedQueueItem);

      const res = (await apiFetch("/api/command-center/orchestrate", {
        method: "POST",
        body: JSON.stringify({
          action,
          item: selectedQueueItem,
          scenarioType,
        }),
      })) as ConsoleActionResult;

      setConsoleResponse(
        String(res.message || res.operatorDirective || "Operator action completed successfully."),
      );

      if (!consolePreview) {
        setConsolePreview(buildFallbackPreview(scenarioType, res));
      }

      await loadDashboard(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Execution failed";
      setConsoleError(message);
      setConsoleResponse(`AI command failed: ${message}`);
    } finally {
      setConsoleBusy(false);
    }
  };

  useEffect(() => {
    void loadDashboard(false);
    void loadHistory(false);
    void loadEscalations(false);
  }, []);

  useEffect(() => {
    const stream = new EventSource(apiStreamUrl("/api/live/stream"), { withCredentials: true });

    stream.addEventListener("connected", () => {
      setLiveAlertStrip("AI voice channel connected. Live intelligence stream active.");
    });

    stream.addEventListener("map-update", async (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string; message?: string };

        const type = String(payload?.type ?? "");
        const message = String(payload?.message ?? "").trim() || "Live command event detected";

        const tone: LiveFeedItem["tone"] =
          type.includes("auto-escalation") || type.includes("dispatch")
            ? "critical"
            : type.includes("alert") || type.includes("escalate")
              ? "warning"
              : "info";

        setLiveAlertStrip(message);
        setLiveFlashToken(String(Date.now()));

        setLiveFeed((current) => {
          const next = [
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              label: message,
              tone,
            },
            ...current,
          ];
          return next.slice(0, 8);
        });

        await loadDashboard(true);
      } catch {
        setLiveAlertStrip("Live intelligence update received.");
        setLiveFlashToken(String(Date.now()));
        await loadDashboard(true);
      }
    });

    stream.onerror = () => {
      setLiveAlertStrip("AI voice channel unstable. Reconnecting to live command stream...");
    };

    return () => stream.close();
  }, []);

  useEffect(() => {
    if (!stats || selectedQueueItem) return;
    if (stats.urgentQueue?.length) {
      setSelectedQueueItem(stats.urgentQueue[0]);
    }
  }, [stats, selectedQueueItem]);

  useEffect(() => {
    if (!selectedQueueItem) {
      setConsolePreview(null);
      return;
    }

    void runConsolePreview(selectedQueueItem);
  }, [selectedQueueItem?.id, selectedQueueItem?.kind]);

  useEffect(() => {
    if (!stats || consoleBusy) return;

    if (!selectedQueueItem) {
      setConsoleResponse(
        `AI console synced. Tracking ${stats.activeAlerts} active alerts, ${stats.criticalThreatSites} critical sites, and ${stats.escalationHotspots?.length ?? 0} escalation hotspots.`,
      );
    }
  }, [stats, consoleBusy, selectedQueueItem]);

  useEffect(() => {
    if (!stats?.escalationHotspots?.length) return;
    const latest = stats.escalationHotspots[0];
    setLiveFlashToken(`${latest.id}-${latest.scenarioId}-${latest.threatScore}-${Date.now()}`);
  }, [stats?.escalationHotspots]);

  const overview = useMemo(() => {
    if (!stats) {
      return {
        totalNodes: 0,
        criticalAlerts: 0,
        protectedPeople: 0,
        energyAvailability: 0,
        riskZones: 0,
      };
    }

    return {
      totalNodes: stats.activeSites,
      criticalAlerts: stats.criticalAlerts,
      protectedPeople: stats.protectedPeople || stats.protectedPersons,
      energyAvailability: Math.round(stats.energyAvailability),
      riskZones: stats.criticalThreatSites,
    };
  }, [stats]);

  const moduleCards = useMemo(() => {
    if (!stats) return [];
    return [
      {
        title: "Denarixx Energy Grid",
        subtitle: `${Math.round(stats.energyAvailability)}% grid availability`,
        tone: "from-emerald-500/10 to-transparent",
        accent: "bg-emerald-400",
      },
      {
        title: "Denarixx LifeMesh",
        subtitle: `${stats.protectedPeople || stats.protectedPersons} persons protected`,
        tone: "from-amber-500/10 to-transparent",
        accent: "bg-amber-400",
      },
      {
        title: "EarthShield Intel",
        subtitle: `${stats.criticalThreatSites} risk zones active`,
        tone: "from-sky-500/10 to-transparent",
        accent: "bg-sky-400",
      },
    ];
  }, [stats]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-500/20 bg-[linear-gradient(90deg,rgba(120,53,15,0.22),rgba(7,10,18,0.95),rgba(12,74,110,0.18))] px-4 py-3 shadow-[0_0_40px_rgba(245,158,11,0.08)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.95)]" />
            <div>
              <div className="text-[11px] uppercase tracking-[0.35em] text-amber-200/80">Live Command Strip</div>
              <div className="mt-1 text-sm text-white">{liveAlertStrip}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {liveFeed.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px] font-medium",
                  feedToneClass(item.tone),
                )}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] overflow-hidden border border-red-500/20 bg-[radial-gradient(circle_at_top,rgba(127,29,29,0.35),rgba(9,9,11,0.95)_60%)] shadow-[0_0_60px_rgba(127,29,29,0.18)]">
        <div className="flex items-center justify-between border-b border-red-500/15 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.9)]" />
            <div className="text-[11px] uppercase tracking-[0.35em] text-red-200/80">
              Global Threat Assessment Matrix
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge className="border border-red-500/20 bg-red-500/10 text-red-300">
              Threat Elevated
            </Badge>
            <Button variant="secondary" size="sm" onClick={() => void loadDashboard(true)} disabled={refreshing}>
              <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-5 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <TriangleAlert className="h-6 w-6 text-red-400" />
              <div>
                <div className="text-3xl font-semibold tracking-wide text-red-300">
                  THREAT CONDITION ELEVATED
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  DNX-ONEEARTH · LIVE COMMAND STATUS · CLASSIFIED
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Active Nodes</div>
              <div className="mt-1 text-3xl font-semibold text-amber-300">{overview.totalNodes}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Critical Alerts</div>
              <div className="mt-1 text-3xl font-semibold text-red-400">{overview.criticalAlerts}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Protected Entities</div>
              <div className="mt-1 text-3xl font-semibold text-emerald-400">{overview.protectedPeople}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Energy Grid</div>
              <div className="mt-1 text-3xl font-semibold text-sky-400">{overview.energyAvailability}%</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Risk Zones</div>
              <div className="mt-1 text-3xl font-semibold text-violet-400">{overview.riskZones}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="relative overflow-hidden border border-amber-500/20 bg-card/80 p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_55%)]" />
          <div className="relative">
            <Activity className="mb-5 h-5 w-5 text-amber-300" />
            <div className="text-5xl font-semibold text-white">{overview.totalNodes}</div>
            <div className="mt-2 text-sm uppercase tracking-[0.25em] text-slate-400">Active Sites</div>
          </div>
        </Card>

        <Card className="relative overflow-hidden border border-red-500/20 bg-card/80 p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.12),transparent_55%)]" />
          <div className="relative">
            <Siren className="mb-5 h-5 w-5 text-red-300" />
            <div className="text-5xl font-semibold text-white">{overview.criticalAlerts}</div>
            <div className="mt-2 text-sm uppercase tracking-[0.25em] text-slate-400">Critical Alerts</div>
          </div>
        </Card>

        <Card className="relative overflow-hidden border border-sky-500/20 bg-card/80 p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_55%)]" />
          <div className="relative">
            <Users className="mb-5 h-5 w-5 text-sky-300" />
            <div className="text-5xl font-semibold text-white">{overview.protectedPeople}</div>
            <div className="mt-2 text-sm uppercase tracking-[0.25em] text-slate-400">Protected Lives</div>
          </div>
        </Card>

        <Card className="relative overflow-hidden border border-violet-500/20 bg-card/80 p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.12),transparent_55%)]" />
          <div className="relative">
            <Globe className="mb-5 h-5 w-5 text-violet-300" />
            <div className="text-5xl font-semibold text-white">{overview.riskZones}</div>
            <div className="mt-2 text-sm uppercase tracking-[0.25em] text-slate-400">Risk Zones</div>
          </div>
        </Card>

        <Card className="relative overflow-hidden border border-emerald-500/20 bg-card/80 p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_55%)]" />
          <div className="relative">
            <Zap className="mb-5 h-5 w-5 text-emerald-300" />
            <div className="text-5xl font-semibold text-white">{overview.energyAvailability}%</div>
            <div className="mt-2 text-sm uppercase tracking-[0.25em] text-slate-400">Energy Avail.</div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.9fr_0.9fr]">
        <Card className="overflow-hidden border border-border/60 bg-card/70">
          <div className="border-b border-border/50 px-6 py-4">
            <div className="text-4xl font-semibold text-white">Global Operations</div>
            <div className="mt-1 text-xl uppercase tracking-[0.25em] text-amber-300">Live Node Status</div>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading real globe intelligence...</div>
            ) : !stats || (stats.globeSites ?? stats.topThreatSites).length === 0 ? (
              <div className="text-sm text-muted-foreground">No globe threat data available.</div>
            ) : (
              <Suspense fallback={<div className="text-sm text-muted-foreground">Loading live threat globe...</div>}>
                <ThreatGlobe
                  sites={stats.globeSites ?? stats.topThreatSites}
                  escalations={stats.escalationHotspots ?? []}
                  liveFlashToken={liveFlashToken}
                />
              </Suspense>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <div className="px-1 text-[11px] uppercase tracking-[0.35em] text-amber-300/80">
            Operator Command Console
          </div>

          <Card className="overflow-hidden border border-cyan-500/15 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_35%),linear-gradient(180deg,rgba(10,14,25,0.95),rgba(4,7,15,0.98))] p-5 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                    AI Orchestration Console
                  </Badge>
                  <Badge className="border-white/10 bg-white/5 text-slate-300">
                    {consoleBusy ? "Processing" : "Operational"}
                  </Badge>
                </div>
                <div className="text-sm font-semibold text-white">Command Layer</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Recommend · Escalate · Dispatch against a selected live queue target
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-right">
                <div className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Selected Target</div>
                <div className="mt-1 text-sm font-medium text-white">
                  {selectedQueueItem?.title ?? "No target selected"}
                </div>
                <div className="text-xs text-slate-400">
                  {selectedQueueItem?.location ?? "Choose an urgent queue item"}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-sm text-white">
                  <Sparkles className="h-4 w-4 text-cyan-300" />
                  AI Preview
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Threat</div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {consolePreview?.threatScore ?? selectedQueueItem?.threatScore ?? "—"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Escalation</div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {consolePreview?.autoEscalation?.escalationLevel ?? "—"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Deployment</div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {consolePreview?.autoEscalation?.deploymentMode ?? "—"}
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300 min-h-[68px]">
                  {consoleResponse}
                </div>

                {consoleError ? (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    <TriangleAlert className="h-4 w-4" />
                    {consoleError}
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => void runConsoleAction("recommend")}
                  disabled={consoleBusy || !selectedQueueItem}
                  className={cn(
                    "w-full min-w-0 rounded-xl bg-blue-600 text-white hover:bg-blue-700",
                    consoleMode === "recommend" && "ring-1 ring-blue-300/50",
                  )}
                >
                  {consoleBusy && consoleMode === "recommend" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Recommend
                </Button>

                <Button
                  onClick={() => void runConsoleAction("escalate")}
                  disabled={consoleBusy || !selectedQueueItem}
                  className={cn(
                    "w-full min-w-0 rounded-xl bg-amber-600 text-white hover:bg-amber-700",
                    consoleMode === "escalate" && "ring-1 ring-amber-300/50",
                  )}
                >
                  {consoleBusy && consoleMode === "escalate" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Escalate
                </Button>

                <Button
                  onClick={() => void runConsoleAction("dispatch")}
                  disabled={consoleBusy || !selectedQueueItem}
                  className={cn(
                    "w-full min-w-0 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700",
                    consoleMode === "dispatch" && "ring-1 ring-emerald-300/50",
                  )}
                >
                  {consoleBusy && consoleMode === "dispatch" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Dispatch
                </Button>
              </div>

              <Button
                variant="secondary"
                onClick={() => selectedQueueItem && void runConsolePreview(selectedQueueItem)}
                disabled={consoleBusy || !selectedQueueItem}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
              >
                {consoleBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
                Refresh AI Preview
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.3fr]">
        <div className="space-y-4">
          <div className="px-1 text-[11px] uppercase tracking-[0.35em] text-emerald-300/80">
            Module Status Matrix
          </div>

          {moduleCards.map((module) => (
            <Card
              key={module.title}
              className={`overflow-hidden border border-border/60 bg-card/70 p-5 bg-gradient-to-r ${module.tone}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-2xl font-semibold text-white">{module.title}</div>
                  <div className="mt-1 text-base text-slate-400">{module.subtitle}</div>
                </div>
                <div className={cn("h-3 w-3 rounded-full shadow-[0_0_16px_currentColor]", module.accent)} />
              </div>

              <div className="mt-5 h-1.5 rounded-full bg-white/10">
                <div
                  className={cn("h-1.5 rounded-full", module.accent)}
                  style={{
                    width:
                      module.title.includes("Energy")
                        ? `${Math.min(100, overview.energyAvailability)}%`
                        : module.title.includes("LifeMesh")
                          ? `${Math.min(100, Math.max(18, Math.round((overview.protectedPeople / Math.max(overview.totalNodes || 1, 1)) * 10)))}%`
                          : `${Math.min(100, Math.max(22, 100 - overview.riskZones * 4))}%`,
                  }}
                />
              </div>
            </Card>
          ))}
        </div>

        <Card className="border border-border/60 bg-card/70">
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
            <div className="text-[11px] uppercase tracking-[0.35em] text-amber-300/80">
              Active Threat Feed
            </div>
            <Badge className="border border-red-500/20 bg-red-500/10 text-red-300">Live</Badge>
          </div>

          <div className="space-y-4 p-5">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading threat feed...</div>
            ) : !stats || stats.recentAlerts.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent alerts available.</div>
            ) : (
              stats.recentAlerts.slice(0, 6).map((alert) => (
                <div key={alert.id} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="text-2xl font-semibold text-white">{alert.title}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {alert.location} · {alert.status}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge className={cn("border", threatClass(alert.threatLevel))}>
                          {alert.threatLevel}
                        </Badge>
                        <Badge className={cn("border", priorityClass(alert.responsePriority))}>
                          {alert.responsePriority}
                        </Badge>
                        <Badge className={cn("border", moduleTone(alert.module))}>{alert.module}</Badge>
                      </div>

                      <div className="mt-3 text-sm text-slate-300">{alert.recommendedAction}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-4xl font-semibold text-amber-300">{alert.threatScore}</div>
                      <div className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Threat</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border border-border/60 bg-card/70">
          <div className="flex items-center gap-2 border-b border-border/50 px-6 py-4">
            <Shield className="h-4 w-4 text-primary" />
            <div className="text-sm font-semibold">Top Threat Sites</div>
          </div>

          <div className="space-y-4 p-5">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading threat sites...</div>
            ) : !stats || stats.topThreatSites.length === 0 ? (
              <div className="text-sm text-muted-foreground">No site data available.</div>
            ) : (
              stats.topThreatSites.slice(0, 4).map((site) => {
                const selected =
                  selectedQueueItem?.kind === "site" &&
                  selectedQueueItem?.id === site.id;

                return (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() =>
                      setSelectedQueueItem({
                        kind: "site",
                        id: site.id,
                        title: site.name,
                        location: `${site.location}, ${site.country}`,
                        threatScore: site.threatScore,
                        threatLevel: site.threatLevel,
                        responsePriority: site.responsePriority,
                        recommendedAction: site.recommendedAction,
                      })
                    }
                    className={cn(
                      "block w-full rounded-2xl border bg-background/40 p-4 text-left transition-all",
                      selected
                        ? "border-cyan-400/40 shadow-[0_0_0_1px_rgba(34,211,238,0.22)]"
                        : "border-border/60 hover:border-cyan-400/20",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <div className="text-xl font-semibold text-white">{site.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {site.location}, {site.country}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={cn("border", threatClass(site.threatLevel))}>{site.threatLevel}</Badge>
                          <Badge className={cn("border", priorityClass(site.responsePriority))}>{site.responsePriority}</Badge>
                          <Badge variant="outline">{site.type}</Badge>
                          {selected ? (
                            <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                              Selected
                            </Badge>
                          ) : null}
                        </div>
                      </div>

                      <div className="min-w-[92px] rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-center">
                        <div className="text-[11px] uppercase text-muted-foreground">Score</div>
                        <div className="text-2xl font-bold text-primary">{site.threatScore}</div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        <Card className="border border-border/60 bg-card/70">
          <div className="flex items-center gap-2 border-b border-border/50 px-6 py-4">
            <Bell className="h-4 w-4 text-primary" />
            <div className="text-sm font-semibold">Urgent Response Queue</div>
          </div>

          <div className="space-y-4 p-5">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading command queue...</div>
            ) : !stats || stats.urgentQueue.length === 0 ? (
              <div className="text-sm text-muted-foreground">No urgent items in queue.</div>
            ) : (
              stats.urgentQueue.slice(0, 4).map((item) => {
                const selected =
                  selectedQueueItem?.kind === item.kind &&
                  selectedQueueItem?.id === item.id;

                return (
                  <button
                    key={`${item.kind}-${item.id}`}
                    type="button"
                    onClick={() => setSelectedQueueItem(item)}
                    className={cn(
                      "block w-full rounded-2xl border bg-background/40 p-4 text-left transition-all",
                      selected
                        ? "border-cyan-400/40 shadow-[0_0_0_1px_rgba(34,211,238,0.22)]"
                        : "border-border/60 hover:border-cyan-400/20",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-xl font-semibold text-white">{item.title}</div>
                          {selected ? (
                            <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                              Selected
                            </Badge>
                          ) : null}
                        </div>
                        <div className="text-sm text-muted-foreground">{item.location}</div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{item.kind}</Badge>
                          <Badge className={cn("border", threatClass(item.threatLevel))}>{item.threatLevel}</Badge>
                          <Badge className={cn("border", priorityClass(item.responsePriority))}>{item.responsePriority}</Badge>
                        </div>
                        <div className="text-sm text-slate-300">{item.recommendedAction}</div>
                      </div>

                      <div className="min-w-[92px] rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-center">
                        <div className="text-[11px] uppercase text-muted-foreground">Score</div>
                        <div className="text-2xl font-bold text-primary">{item.threatScore}</div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>
      </div>

      <CommandTimelinePanel
        history={history}
        escalations={escalations}
        loading={timelineLoading}
      />

      <Card className="border border-border/60 bg-card/70">
        <div className="flex items-center gap-2 border-b border-border/50 px-6 py-4">
          <Radio className="h-4 w-4 text-primary" />
          <div className="text-sm font-semibold">Live Event Feed</div>
        </div>

        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
          {liveFeed.slice(0, 8).map((item) => (
            <div
              key={item.id}
              className={cn("rounded-2xl border p-4 text-sm", feedToneClass(item.tone))}
            >
              <div className="flex items-center gap-2 font-medium">
                {item.tone === "critical" ? (
                  <TriangleAlert className="h-4 w-4" />
                ) : item.tone === "warning" ? (
                  <Bell className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Live update
              </div>
              <div className="mt-2 leading-6">{item.label}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
