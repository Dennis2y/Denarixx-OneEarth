import React, { useEffect, useMemo, useState } from "react";
import { Shield, Bell, Siren, RefreshCw, Activity, Globe2 } from "lucide-react";
import { PageHeader, Card, Badge, Button, cn } from "@/components/ui-core";
import { apiFetch } from "@/lib/api";
import ThreatGlobe from "@/components/dashboard/ThreatGlobe";

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
  latitude: number;
  longitude: number;
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
  topThreatSites: ThreatSite[];
  urgentQueue: QueueItem[];
  globeSites: ThreatSite[];
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

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const overview = useMemo(() => {
    if (!stats) {
      return {
        averageThreatScore: 0,
        criticalThreatSites: 0,
        urgentQueue: 0,
        activeAlerts: 0,
      };
    }

    return {
      averageThreatScore: stats.averageThreatScore,
      criticalThreatSites: stats.criticalThreatSites,
      urgentQueue: stats.urgentQueue.length,
      activeAlerts: stats.activeAlerts,
    };
  }, [stats]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Command Dashboard"
        description="Live planetary threat intelligence, rotating danger globe, and urgent AI response queue"
        actions={
          <Button variant="secondary" size="sm" onClick={() => loadDashboard(true)} disabled={refreshing}>
            <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-border/60 bg-card/70">
          <div className="text-xs text-muted-foreground">Average Threat</div>
          <div className="text-2xl font-bold text-primary">{overview.averageThreatScore}</div>
        </Card>
        <Card className="p-4 border border-border/60 bg-card/70">
          <div className="text-xs text-muted-foreground">Critical Threat Sites</div>
          <div className="text-2xl font-bold text-red-400">{overview.criticalThreatSites}</div>
        </Card>
        <Card className="p-4 border border-border/60 bg-card/70">
          <div className="text-xs text-muted-foreground">Urgent Queue</div>
          <div className="text-2xl font-bold text-amber-400">{overview.urgentQueue}</div>
        </Card>
        <Card className="p-4 border border-border/60 bg-card/70">
          <div className="text-xs text-muted-foreground">Active Alerts</div>
          <div className="text-2xl font-bold">{overview.activeAlerts}</div>
        </Card>
      </div>

      <Card className="border border-border/60 bg-card/70 overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-primary" />
          <div className="text-sm font-semibold">Live Global Threat Globe</div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-0">
          <div className="p-4 md:p-6">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading global threat globe...</div>
            ) : !stats ? (
              <div className="text-sm text-muted-foreground">Dashboard data unavailable.</div>
            ) : (
              <ThreatGlobe sites={stats.globeSites} />
            )}
          </div>

          <div className="border-l border-border/40 p-4 md:p-6 space-y-4 bg-black/10">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Globe Intelligence</div>
              <div className="text-sm text-muted-foreground leading-6">
                Rotating AI globe showing live danger hotspots, stable regions, and connected strategic nodes across the planetary command network.
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {(stats?.topThreatSites ?? []).slice(0, 5).map((site) => (
                <div key={site.id} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 min-w-0">
                      <div className="font-semibold">{site.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {site.location}, {site.country}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={cn("border", threatClass(site.threatLevel))}>{site.threatLevel}</Badge>
                        <Badge className={cn("border", priorityClass(site.responsePriority))}>{site.responsePriority}</Badge>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-center min-w-[92px]">
                      <div className="text-[11px] text-muted-foreground uppercase">Score</div>
                      <div className="text-2xl font-bold text-primary">{site.threatScore}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <Card className="border border-border/60 bg-card/70">
          <div className="p-4 border-b border-border/50 flex items-center gap-2">
            <Siren className="w-4 h-4 text-primary" />
            <div className="text-sm font-semibold">Urgent Response Queue</div>
          </div>

          <div className="p-4 space-y-4">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading command queue...</div>
            ) : !stats || stats.urgentQueue.length === 0 ? (
              <div className="text-sm text-muted-foreground">No urgent items in queue.</div>
            ) : (
              stats.urgentQueue.map((item) => (
                <div key={`${item.kind}-${item.id}`} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-semibold">{item.title}</div>
                        <Badge variant="outline">{item.kind}</Badge>
                        <Badge className={cn("border", threatClass(item.threatLevel))}>{item.threatLevel}</Badge>
                        <Badge className={cn("border", priorityClass(item.responsePriority))}>{item.responsePriority}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{item.location}</div>
                      <div className="text-sm">{item.recommendedAction}</div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-center min-w-[92px]">
                      <div className="text-[11px] text-muted-foreground uppercase">Score</div>
                      <div className="text-2xl font-bold text-primary">{item.threatScore}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="border border-border/60 bg-card/70">
          <div className="p-4 border-b border-border/50 flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <div className="text-sm font-semibold">Recent Scored Alerts</div>
          </div>

          <div className="p-4 space-y-3">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading recent alerts...</div>
            ) : !stats || stats.recentAlerts.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent alerts available.</div>
            ) : (
              stats.recentAlerts.map((alert) => (
                <div key={alert.id} className="rounded-xl border border-border/60 bg-background/40 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold">{alert.title}</div>
                      <Badge className={cn("border", threatClass(alert.threatLevel))}>{alert.threatLevel}</Badge>
                      <Badge className={cn("border", priorityClass(alert.responsePriority))}>{alert.responsePriority}</Badge>
                      <Badge variant="outline">{alert.module}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{alert.location}</div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-center min-w-[92px]">
                    <div className="text-[11px] text-muted-foreground uppercase">Score</div>
                    <div className="text-2xl font-bold text-primary">{alert.threatScore}</div>
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
