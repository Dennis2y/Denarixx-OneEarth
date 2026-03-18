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
} from "lucide-react";
import { Card, Badge, Button, cn } from "@/components/ui-core";
import { apiFetch, apiStreamUrl } from "@/lib/api";

const ThreatGlobe = lazy(() => import("@/components/dashboard/ThreatGlobe"));

const DASHBOARD_TICKER_CSS = `
@keyframes denTickerScroll {
  0% { transform: translateX(0%); }
  100% { transform: translateX(-50%); }
}
`;

type ThreatLevel = "low" | "medium" | "high" | "critical";
type ResponsePriority = "routine" | "priority" | "urgent" | "immediate";

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

type AutoResponseStatusCard = {
  id: string;
  title: string;
  value: string;
  detail: string;
  tone: "critical" | "warning" | "stable" | "info";
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
  recentAlerts: Array<{
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
  }>;
  escalationHotspots?: EscalationHotspot[];
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

function responseCardToneClass(tone: "critical" | "warning" | "stable" | "info") {
  if (tone === "critical") return "border-red-500/30 bg-red-500/10";
  if (tone === "warning") return "border-amber-500/30 bg-amber-500/10";
  if (tone === "info") return "border-blue-500/30 bg-blue-500/10";
  return "border-green-500/30 bg-green-500/10";
}

function moduleTone(module: string) {
  const value = module.toLowerCase();
  if (value.includes("energy")) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
  if (value.includes("life")) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
  return "text-sky-400 border-sky-500/30 bg-sky-500/10";
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

  const loadDashboard = async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      const json = await apiFetch("/api/dashboard/stats");
      setStats(json as DashboardStats);
    } catch {
      if (!silent) setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard(false);
  }, []);

  useEffect(() => {
    const stream = new EventSource(apiStreamUrl("/api/live/stream"), { withCredentials: true });

    stream.addEventListener("connected", () => {
      setLiveAlertStrip("AI voice channel connected. Live intelligence stream active.");
    });

    stream.addEventListener("map-update", async (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);

        const type = String(payload?.type ?? "");
        const message =
          String(payload?.message ?? "").trim() || "Live command event detected";

        const tone: "critical" | "warning" | "info" =
          type.includes("auto-escalation")
            ? "critical"
            : type.includes("alert")
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

  const commandActions = useMemo(
    () => [
      {
        title: "Emergency Drill",
        description: "Initiate network-wide response protocol.",
        icon: TriangleAlert,
        tone: "border-red-500/25 bg-red-500/10 text-red-300",
      },
      {
        title: "Deploy Node",
        description: "Register new infrastructure hardware.",
        icon: Globe,
        tone: "border-amber-500/20 bg-white/5 text-amber-300",
      },
      {
        title: "Generate Report",
        description: "Export executive threat intelligence summary.",
        icon: Bell,
        tone: "border-white/10 bg-white/5 text-slate-200",
      },
      {
        title: "Broadcast Alert",
        description: "Send live priority notification to all regions.",
        icon: Radio,
        tone: "border-white/10 bg-white/5 text-amber-300",
      },
    ],
    []
  );

  const moduleCards = useMemo(() => {
    if (!stats) return [];
    return [
      {
        title: "Denarixx Energy Grid",
        subtitle: `${Math.round(stats.energyAvailability)}% grid availability`,
        value: `${Math.round(stats.energyAvailability)}%`,
        tone: "from-emerald-500/10 to-transparent",
        accent: "bg-emerald-400",
      },
      {
        title: "Denarixx LifeMesh",
        subtitle: `${stats.protectedPeople || stats.protectedPersons} persons protected`,
        value: `${stats.protectedPeople || stats.protectedPersons}`,
        tone: "from-amber-500/10 to-transparent",
        accent: "bg-amber-400",
      },
      {
        title: "EarthShield Intel",
        subtitle: `${stats.criticalThreatSites} risk zones active`,
        value: `${stats.criticalThreatSites}`,
        tone: "from-sky-500/10 to-transparent",
        accent: "bg-sky-400",
      },
    ];
  }, [stats]);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-red-500/20 bg-[radial-gradient(circle_at_top,rgba(127,29,29,0.35),rgba(9,9,11,0.95)_60%)] overflow-hidden shadow-[0_0_60px_rgba(127,29,29,0.18)]">
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
            <Button variant="secondary" size="sm" onClick={() => loadDashboard(true)} disabled={refreshing}>
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

          {commandActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card key={action.title} className={cn("p-6", action.tone)}>
                <Icon className="mb-6 h-7 w-7" />
                <div className="text-3xl font-semibold text-white">{action.title}</div>
                <div className="mt-2 text-base text-slate-400">{action.description}</div>
              </Card>
            );
          })}
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
          <div className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
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
                      <div className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                        Threat
                      </div>
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
          <div className="border-b border-border/50 px-6 py-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <div className="text-sm font-semibold">Top Threat Sites</div>
          </div>

          <div className="space-y-4 p-5">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading threat sites...</div>
            ) : !stats || stats.topThreatSites.length === 0 ? (
              <div className="text-sm text-muted-foreground">No site data available.</div>
            ) : (
              stats.topThreatSites.slice(0, 4).map((site) => (
                <div key={site.id} className="rounded-2xl border border-border/60 bg-background/40 p-4">
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
                      </div>
                    </div>

                    <div className="min-w-[92px] rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-center">
                      <div className="text-[11px] uppercase text-muted-foreground">Score</div>
                      <div className="text-2xl font-bold text-primary">{site.threatScore}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="border border-border/60 bg-card/70">
          <div className="border-b border-border/50 px-6 py-4 flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <div className="text-sm font-semibold">Urgent Response Queue</div>
          </div>

          <div className="space-y-4 p-5">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading command queue...</div>
            ) : !stats || stats.urgentQueue.length === 0 ? (
              <div className="text-sm text-muted-foreground">No urgent items in queue.</div>
            ) : (
              stats.urgentQueue.slice(0, 4).map((item) => (
                <div key={`${item.kind}-${item.id}`} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="text-xl font-semibold text-white">{item.title}</div>
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
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
