import React, { useEffect, useMemo, useState } from "react";
import { Bell, TriangleAlert, ShieldAlert, RefreshCw, Siren } from "lucide-react";
import { PageHeader, Card, Badge, Button, cn } from "@/components/ui-core";
import { apiFetch } from "@/lib/api";

type ThreatLevel = "low" | "medium" | "high" | "critical";
type ResponsePriority = "routine" | "priority" | "urgent" | "immediate";

type AlertRow = {
  id: number;
  title: string;
  module: string;
  severity: string;
  status: string;
  location: string;
  description: string;
  createdAt: string;
  threatScore: number;
  threatLevel: ThreatLevel;
  responsePriority: ResponsePriority;
  recommendedAction: string;
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

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAlerts = async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      const json = await apiFetch("/api/alerts");
      const sorted = [...(json as AlertRow[])].sort((a, b) => b.threatScore - a.threatScore);
      setAlerts(sorted);
    } catch {
      if (!silent) setAlerts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAlerts(false);
  }, []);

  const summary = useMemo(() => {
    return {
      total: alerts.length,
      critical: alerts.filter((a) => a.threatLevel === "critical").length,
      urgent: alerts.filter((a) => a.responsePriority === "immediate" || a.responsePriority === "urgent").length,
      average: alerts.length ? Math.round(alerts.reduce((sum, a) => sum + a.threatScore, 0) / alerts.length) : 0,
    };
  }, [alerts]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts Command"
        description="AI-scored alert stream with response priorities and recommended actions"
        actions={
          <Button variant="secondary" size="sm" onClick={() => loadAlerts(true)} disabled={refreshing}>
            <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-border/60 bg-card/70">
          <div className="text-xs text-muted-foreground">Total Alerts</div>
          <div className="text-2xl font-bold">{summary.total}</div>
        </Card>
        <Card className="p-4 border border-border/60 bg-card/70">
          <div className="text-xs text-muted-foreground">Critical Threats</div>
          <div className="text-2xl font-bold text-red-400">{summary.critical}</div>
        </Card>
        <Card className="p-4 border border-border/60 bg-card/70">
          <div className="text-xs text-muted-foreground">Urgent Queue</div>
          <div className="text-2xl font-bold text-amber-400">{summary.urgent}</div>
        </Card>
        <Card className="p-4 border border-border/60 bg-card/70">
          <div className="text-xs text-muted-foreground">Average Threat</div>
          <div className="text-2xl font-bold text-primary">{summary.average}</div>
        </Card>
      </div>

      <Card className="border border-border/60 bg-card/70">
        <div className="p-4 border-b border-border/50 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <div className="text-sm font-semibold">Live Alert Queue</div>
        </div>

        <div className="p-4 space-y-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading alerts...</div>
          ) : alerts.length === 0 ? (
            <div className="text-sm text-muted-foreground">No active alerts.</div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4 justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold text-white">{alert.title}</div>
                      <Badge className={cn("border", threatClass(alert.threatLevel))}>
                        {alert.threatLevel.toUpperCase()}
                      </Badge>
                      <Badge className={cn("border", priorityClass(alert.responsePriority))}>
                        {alert.responsePriority.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{alert.module}</Badge>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {alert.location} • {new Date(alert.createdAt).toLocaleString()}
                    </div>

                    <div className="text-sm">{alert.description}</div>

                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                      <div className="text-[11px] uppercase tracking-widest text-primary mb-1">Recommended Action</div>
                      <div className="text-sm">{alert.recommendedAction}</div>
                    </div>
                  </div>

                  <div className="shrink-0 grid grid-cols-3 gap-3 min-w-[280px]">
                    <div className="rounded-xl border border-border/60 bg-card/60 p-3 text-center">
                      <div className="text-[11px] text-muted-foreground uppercase">Threat</div>
                      <div className="text-2xl font-bold text-primary">{alert.threatScore}</div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card/60 p-3 text-center">
                      <div className="text-[11px] text-muted-foreground uppercase">Severity</div>
                      <div className="text-sm font-bold">{alert.severity}</div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card/60 p-3 text-center">
                      <div className="text-[11px] text-muted-foreground uppercase">Status</div>
                      <div className="text-sm font-bold">{alert.status}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
