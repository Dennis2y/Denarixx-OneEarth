import React from "react";
import { Activity, Clock3, Radio, Shield } from "lucide-react";
import { Card, Badge, cn } from "@/components/ui-core";

type EscalationLevel = "site" | "district" | "regional-command" | "global-command";
type DeploymentMode = "monitor" | "prepare" | "rapid-response" | "immediate-deployment";

export type HistoryRow = {
  id: number;
  scenarioId: string;
  scenarioType: string;
  scenarioLabel?: string;
  operatorEmail?: string;
  operatorName?: string;
  operatorRole?: string;
  riskSeverity: string;
  readinessScore: number;
  affectedSites: number;
  affectedPersons: number;
  estimatedPopulationAtRisk: number;
  simulatedAt: string;
};

export type EscalationFeedRow = {
  id: number;
  scenarioId: string;
  scenarioType: string;
  scenarioLabel: string;
  triggerModule: string;
  threatScore: number;
  escalationLevel: EscalationLevel;
  deploymentMode: DeploymentMode;
  operatingProtocol: string;
  operatorDirective: string;
  recommendedTeams: string[];
  recommendedActions: string[];
  actorEmail: string;
  actorName: string;
  actorRole: string;
  createdAt: string;
};

type Props = {
  history: HistoryRow[];
  escalations: EscalationFeedRow[];
  loading?: boolean;
  selectedHistoryId?: number | null;
  onHistorySelect?: (item: HistoryRow) => void;
};

function severityClass(value: string) {
  if (value === "critical") return "border-red-500/30 bg-red-500/10 text-red-300";
  if (value === "warning") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return "border-blue-500/30 bg-blue-500/10 text-blue-300";
}

function escalationClass(level: EscalationLevel) {
  if (level === "global-command") return "border-red-500/30 bg-red-500/10 text-red-300";
  if (level === "regional-command") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  if (level === "district") return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  return "border-green-500/30 bg-green-500/10 text-green-300";
}

function deploymentClass(mode: DeploymentMode) {
  if (mode === "immediate-deployment") return "border-red-500/30 bg-red-500/10 text-red-300";
  if (mode === "rapid-response") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  if (mode === "prepare") return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  return "border-green-500/30 bg-green-500/10 text-green-300";
}

function moduleClass(value: string) {
  const v = value.toLowerCase();
  if (v.includes("energy")) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (v.includes("life")) return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return "border-sky-500/30 bg-sky-500/10 text-sky-300";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function CommandTimelinePanel({
  history,
  escalations,
  loading = false,
  selectedHistoryId = null,
  onHistorySelect,
}: Props) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="overflow-hidden border border-border/60 bg-card/70">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <div className="text-sm font-semibold text-white">Command History</div>
          </div>
          <Badge className="border border-white/10 bg-white/5 text-slate-300">
            {history.length} entries
          </Badge>
        </div>

        <div className="space-y-4 p-5">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading command history...</div>
          ) : history.length === 0 ? (
            <div className="text-sm text-muted-foreground">No command history available.</div>
          ) : (
            history.slice(0, 5).map((item) => {
              const selected = selectedHistoryId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onHistorySelect?.(item)}
                  className={cn(
                    "block w-full rounded-2xl border bg-background/40 p-4 text-left transition-all",
                    selected
                      ? "border-cyan-400/40 shadow-[0_0_0_1px_rgba(34,211,238,0.22)]"
                      : "border-border/60 hover:border-cyan-400/20",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-lg font-semibold text-white">
                          {item.scenarioLabel || item.scenarioType}
                        </div>
                        {selected ? (
                          <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                            Selected
                          </Badge>
                        ) : null}
                      </div>

                      <div className="mt-1 text-sm text-slate-400">
                        {item.operatorName || item.operatorEmail || "System"} · {formatDate(item.simulatedAt)}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge className={cn("border", severityClass(item.riskSeverity))}>
                          {item.riskSeverity}
                        </Badge>
                        <Badge variant="outline">Readiness {item.readinessScore}</Badge>
                        <Badge variant="outline">Sites {item.affectedSites}</Badge>
                        <Badge variant="outline">Persons {item.affectedPersons}</Badge>
                      </div>
                    </div>

                    <div className="min-w-[104px] rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-center">
                      <div className="text-[11px] uppercase text-muted-foreground">Population</div>
                      <div className="text-xl font-bold text-primary">
                        {item.estimatedPopulationAtRisk}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </Card>

      <Card className="overflow-hidden border border-border/60 bg-card/70">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary" />
            <div className="text-sm font-semibold text-white">Escalation Timeline</div>
          </div>
          <Badge className="border border-white/10 bg-white/5 text-slate-300">
            {escalations.length} events
          </Badge>
        </div>

        <div className="space-y-4 p-5">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading escalation timeline...</div>
          ) : escalations.length === 0 ? (
            <div className="text-sm text-muted-foreground">No escalation timeline available.</div>
          ) : (
            escalations.slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-full border border-primary/20 bg-primary/10 p-2">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-lg font-semibold text-white">{item.scenarioLabel}</div>
                      <Badge className={cn("border", moduleClass(item.triggerModule))}>
                        {item.triggerModule}
                      </Badge>
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                      <Clock3 className="h-3.5 w-3.5" />
                      {item.actorName || item.actorEmail} · {formatDate(item.createdAt)}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge className={cn("border", escalationClass(item.escalationLevel))}>
                        {item.escalationLevel}
                      </Badge>
                      <Badge className={cn("border", deploymentClass(item.deploymentMode))}>
                        {item.deploymentMode}
                      </Badge>
                      <Badge variant="outline">Threat {item.threatScore}</Badge>
                    </div>

                    <div className="mt-3 text-sm text-slate-300">
                      {item.operatorDirective}
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
