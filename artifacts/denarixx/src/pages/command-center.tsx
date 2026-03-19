import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Shield,
  Siren,
  RefreshCw,
  Play,
  Radio,
  TriangleAlert,
  Activity,
  Users,
  Globe,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { PageHeader, Card, Badge, Button, cn } from "@/components/ui-core";
import { apiFetch, apiStreamUrl } from "@/lib/api";

type ScenarioType =
  | "flood_event"
  | "severe_storm"
  | "wildfire_risk"
  | "clinic_power_outage"
  | "multi_site_outage"
  | "child_emergency_sos";

type EscalationLevel = "site" | "district" | "regional-command" | "global-command";
type DeploymentMode = "monitor" | "prepare" | "rapid-response" | "immediate-deployment";
type OperatingProtocol =
  | "routine-observation"
  | "heightened-readiness"
  | "emergency-containment"
  | "mass-casualty-protection";

type SimulationResult = {
  scenarioId: string;
  scenarioType: ScenarioType;
  scenarioLabel: string;
  triggerModule: "energy" | "lifemesh" | "earthshield";
  riskSeverity: string;
  readinessScore: number;
  threatScore: number;
  affectedSites: Array<{
    id: number;
    name: string;
    type: string;
    location: string;
    country: string;
    status: string;
    population: number;
    powerAvailability: number;
    currentRiskLevel: string;
  }>;
  affectedPersonsTotal: number;
  atRiskPersonsCount: number;
  criticalFacilitiesCount: number;
  criticalFacilities: Array<{
    id: number;
    name: string;
    type: string;
    location: string;
  }>;
  estimatedPopulationAtRisk: number;
  energyStatus: {
    avgBatteryLevel: number;
    avgSolarGeneration: number;
    backupHoursEstimate: number;
    gridStressLevel: string;
  };
  recommendedActions: string[];
  escalationTimeline: Array<{
    time: string;
    event: string;
    severity: string;
  }>;
  activeAlertCount: number;
  autoEscalation: {
    escalationLevel: EscalationLevel;
    deploymentMode: DeploymentMode;
    operatingProtocol: OperatingProtocol;
    operatorDirective: string;
    recommendedTeams: string[];
    recommendedActions: string[];
  };
  autoResponse: {
    responseTier: "local" | "district" | "regional" | "global";
    responseMode: "observe" | "prepare" | "dispatch" | "crisis";
    commandMessage: string;
    machineActions: string[];
  };
  simulatedAt: string;
};

type HistoryRow = {
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

type EscalationFeedRow = {
  id: number;
  scenarioId: string;
  scenarioType: string;
  scenarioLabel: string;
  triggerModule: string;
  threatScore: number;
  escalationLevel: EscalationLevel;
  deploymentMode: DeploymentMode;
  operatingProtocol: OperatingProtocol;
  operatorDirective: string;
  recommendedTeams: string[];
  recommendedActions: string[];
  actorEmail: string;
  actorName: string;
  actorRole: string;
  createdAt: string;
};

const scenarioOptions: Array<{ value: ScenarioType; label: string }> = [
  { value: "flood_event", label: "Flood Event" },
  { value: "severe_storm", label: "Severe Storm" },
  { value: "wildfire_risk", label: "Wildfire Risk" },
  { value: "clinic_power_outage", label: "Clinic Power Outage" },
  { value: "multi_site_outage", label: "Multi-Site Outage" },
  { value: "child_emergency_sos", label: "Child Emergency / SOS Escalation" },
];

function severityClass(value: string) {
  if (value === "critical") return "bg-red-500/15 text-red-400 border-red-500/30";
  if (value === "warning") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  return "bg-blue-500/15 text-blue-400 border-blue-500/30";
}

function responseTierClass(tier: string) {
  if (tier === "global") return "bg-red-500/15 text-red-400 border-red-500/30";
  if (tier === "regional") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  if (tier === "district") return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  return "bg-green-500/15 text-green-400 border-green-500/30";
}

function responseModeClass(mode: string) {
  if (mode === "crisis") return "bg-red-500/20 text-red-300 border-red-500/40";
  if (mode === "dispatch") return "bg-amber-500/20 text-amber-300 border-amber-500/40";
  if (mode === "prepare") return "bg-blue-500/20 text-blue-300 border-blue-500/40";
  return "bg-green-500/20 text-green-300 border-green-500/40";
}

function escalationClass(level: EscalationLevel) {
  if (level === "global-command") return "bg-red-500/15 text-red-400 border-red-500/30";
  if (level === "regional-command") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  if (level === "district") return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  return "bg-green-500/15 text-green-400 border-green-500/30";
}

function deploymentClass(mode: DeploymentMode) {
  if (mode === "immediate-deployment") return "bg-red-500/15 text-red-400 border-red-500/30";
  if (mode === "rapid-response") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  if (mode === "prepare") return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  return "bg-green-500/15 text-green-400 border-green-500/30";
}

function escalationPulseClass(level: EscalationLevel) {
  if (level === "global-command") return "border-red-500/40 bg-red-500/10";
  if (level === "regional-command") return "border-amber-500/40 bg-amber-500/10";
  if (level === "district") return "border-blue-500/40 bg-blue-500/10";
  return "border-green-500/30 bg-green-500/10";
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

export default function CommandCenterPage() {
  const { t } = useTranslation();
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>("flood_event");
  const [running, setRunning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [escalations, setEscalations] = useState<EscalationFeedRow[]>([]);

  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [liveEscalationStatus, setLiveEscalationStatus] = useState("Waiting for escalation events...");
  const [liveEvent, setLiveEvent] = useState("Connecting to command live stream...");
  const [liveStatus, setLiveStatus] = useState<"connecting" | "live" | "disconnected">("connecting");

  const loadHistory = async (silent = false) => {
    try {
      if (!silent) setRefreshing(true);
      const json = (await apiFetch("/api/command-center/history")) as HistoryRow[];
      setHistory(json);

      setSelectedHistoryId((current) => {
        if (!json.length) return null;
        if (current && json.some((row) => row.id === current)) return current;
        return json[0].id;
      });
    } catch {
      if (!silent) setHistory([]);
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  const loadEscalations = async (silent = false) => {
    try {
      if (!silent) setRefreshing(true);
      const json = (await apiFetch("/api/command-center/escalations")) as EscalationFeedRow[];
      setEscalations(json);
    } catch {
      if (!silent) setEscalations([]);
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  const loadSimulationDetail = async (id: number, silent = false) => {
    try {
      if (!silent) setDetailLoading(true);
      const detail = (await apiFetch(`/api/command-center/history/${id}`)) as { result?: SimulationResult };
      if (detail?.result) {
        setResult(detail.result);
      }
    } catch {
      // keep current result
    } finally {
      if (!silent) setDetailLoading(false);
    }
  };

  useEffect(() => {
    void Promise.all([loadHistory(false), loadEscalations(false)]);
  }, []);

  useEffect(() => {
    if (!selectedHistoryId) return;
    void loadSimulationDetail(selectedHistoryId, false);
  }, [selectedHistoryId]);

  useEffect(() => {
    const stream = new EventSource(apiStreamUrl("/api/live/stream"), { withCredentials: true });

    stream.addEventListener("connected", () => {
      setLiveStatus("live");
      setLiveEvent("Live command stream connected");
    });

    stream.addEventListener("heartbeat", () => {
      setLiveStatus("live");
    });

    stream.addEventListener("map-update", async (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);

        if (
          payload?.type !== "command-center:auto-escalation" &&
          payload?.type !== "command-center:recommend" &&
          payload?.type !== "command-center:escalate" &&
          payload?.type !== "command-center:dispatch"
        ) {
          return;
        }

        setLiveStatus("live");
        setLiveEvent(payload?.message ?? "Live command event received");
        setLiveEscalationStatus(payload?.message ?? "Live escalation event received");

        await Promise.all([loadHistory(true), loadEscalations(true)]);

        if (payload?.scenarioId) {
          try {
            const latest = (await apiFetch("/api/command-center/history")) as HistoryRow[];
            const matched = latest.find((row) => row.scenarioId === payload.scenarioId);
            if (matched) {
              setSelectedHistoryId(matched.id);
              const detail = (await apiFetch(`/api/command-center/history/${matched.id}`)) as { result?: SimulationResult };
              if (detail?.result) {
                setResult(detail.result);
              }
            }
          } catch {}
        }
      } catch {
        setLiveStatus("live");
        setLiveEvent("Live command event received");
      }
    });

    stream.onerror = () => {
      setLiveStatus("disconnected");
      setLiveEvent("Live command stream disconnected — retrying");
      setLiveEscalationStatus("Live escalation stream disconnected — retrying");
    };

    return () => stream.close();
  }, []);

  useEffect(() => {
    if (!result) return;
    setLiveEscalationStatus(
      `${result.scenarioLabel} · ${result.autoEscalation.escalationLevel} · ${result.autoEscalation.deploymentMode}`
    );
  }, [result]);

  const runSimulation = async () => {
    try {
      setRunning(true);
      const json = (await apiFetch("/api/command-center/simulate", {
        method: "POST",
        body: JSON.stringify({ scenarioType: selectedScenario }),
      })) as SimulationResult;

      setResult(json);
      await Promise.all([loadHistory(true), loadEscalations(true)]);
    } finally {
      setRunning(false);
    }
  };

  const overview = useMemo(() => {
    if (!result) {
      return {
        threatScore: 0,
        readinessScore: 0,
        affectedSites: 0,
        population: 0,
        escalationLevel: "site" as EscalationLevel,
        deploymentMode: "monitor" as DeploymentMode,
      };
    }

    return {
      threatScore: result.threatScore,
      readinessScore: result.readinessScore,
      affectedSites: result.affectedSites.length,
      population: result.estimatedPopulationAtRisk,
      escalationLevel: result.autoEscalation.escalationLevel,
      deploymentMode: result.autoEscalation.deploymentMode,
    };
  }, [result]);

  const escalationOverview = useMemo(() => {
    const rows = escalations ?? [];
    const totalEvents = rows.length;
    const globalCommand = rows.filter((row) => row.escalationLevel === "global-command").length;
    const immediateDeployments = rows.filter((row) => row.deploymentMode === "immediate-deployment").length;
    const averageThreat = totalEvents
      ? Math.round(rows.reduce((sum, row) => sum + Number(row.threatScore || 0), 0) / totalEvents)
      : 0;

    return {
      totalEvents,
      globalCommand,
      immediateDeployments,
      averageThreat,
    };
  }, [escalations]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Command Center"
        description="Run simulations, inspect escalation intelligence, and monitor live command activity"
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void Promise.all([loadHistory(false), loadEscalations(false)])}
            disabled={refreshing}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      <Card className="border border-border/60 bg-card/70 p-4">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <div className="text-sm font-semibold">{t("command.liveAutoEscalationStream")}</div>
            <div className="text-sm text-muted-foreground">{liveEvent}</div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex h-2.5 w-2.5 rounded-full",
                liveStatus === "live"
                  ? "bg-green-500 shadow-[0_0_14px_rgba(34,197,94,0.85)]"
                  : liveStatus === "connecting"
                    ? "bg-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.85)]"
                    : "bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.85)]"
              )}
            />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">{liveStatus}</span>
          </div>
        </div>
      </Card>

      <Card className="border border-border/60 bg-card/70 p-4">
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <div className="text-sm font-semibold">{t("command.scenarioSimulation")}</div>
            <div className="text-sm text-muted-foreground">
              Select an incident scenario to generate AI-based escalation and deployment advice.
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value as ScenarioType)}
              className="h-11 rounded-xl border border-border bg-input/50 px-4 text-sm text-foreground"
            >
              {scenarioOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <Button onClick={() => void runSimulation()} disabled={running}>
              {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Run AI Simulation
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border border-primary/20 bg-primary/5 p-4">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.25em] text-primary">{t("command.liveEscalationFeed")}</div>
            <div className="text-sm text-white">{liveEscalationStatus}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className={cn("border", escalationClass(overview.escalationLevel))}>
              {overview.escalationLevel.toUpperCase()}
            </Badge>
            <Badge className={cn("border", deploymentClass(overview.deploymentMode))}>
              {overview.deploymentMode.toUpperCase()}
            </Badge>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border border-border/60 bg-card/70 p-4">
          <div className="text-xs text-muted-foreground">{t("command.threatScore")}</div>
          <div className="text-2xl font-bold text-primary">{overview.threatScore}</div>
        </Card>
        <Card className="border border-border/60 bg-card/70 p-4">
          <div className="text-xs text-muted-foreground">{t("command.readinessScore")}</div>
          <div className="text-2xl font-bold">{overview.readinessScore}</div>
        </Card>
        <Card className="border border-border/60 bg-card/70 p-4">
          <div className="text-xs text-muted-foreground">{t("command.affectedSites")}</div>
          <div className="text-2xl font-bold">{overview.affectedSites}</div>
        </Card>
        <Card className="border border-border/60 bg-card/70 p-4">
          <div className="text-xs text-muted-foreground">{t("command.populationAtRisk")}</div>
          <div className="text-2xl font-bold">{overview.population.toLocaleString()}</div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border border-red-500/20 bg-red-500/5 p-4">
          <div className="text-xs text-muted-foreground">{t("command.escalationEvents")}</div>
          <div className="text-2xl font-bold text-white">{escalationOverview.totalEvents}</div>
        </Card>
        <Card className="border border-red-500/30 bg-red-500/10 p-4">
          <div className="text-xs text-muted-foreground">{t("command.globalCommand")}</div>
          <div className="text-2xl font-bold text-red-400">{escalationOverview.globalCommand}</div>
        </Card>
        <Card className="border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="text-xs text-muted-foreground">{t("command.immediateDeployments")}</div>
          <div className="text-2xl font-bold text-amber-300">{escalationOverview.immediateDeployments}</div>
        </Card>
        <Card className="border border-primary/30 bg-primary/10 p-4">
          <div className="text-xs text-muted-foreground">{t("command.avgEscalationThreat")}</div>
          <div className="text-2xl font-bold text-primary">{escalationOverview.averageThreat}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border border-border/60 bg-card/70">
          <div className="flex items-center gap-2 border-b border-border/50 p-4">
            <Shield className="h-4 w-4 text-primary" />
            <div className="text-sm font-semibold">{t("command.autoEscalationDecision")}</div>
          </div>

          <div className="space-y-4 p-4">
            {!result ? (
              <div className="text-sm text-muted-foreground">{t("command.runOrSelectSimulation")}</div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge className={cn("border", severityClass(result.riskSeverity))}>{result.riskSeverity.toUpperCase()}</Badge>
                  <Badge className={cn("border", escalationClass(result.autoEscalation.escalationLevel))}>
                    {result.autoEscalation.escalationLevel.toUpperCase()}
                  </Badge>
                  <Badge className={cn("border", deploymentClass(result.autoEscalation.deploymentMode))}>
                    {result.autoEscalation.deploymentMode.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">{result.autoEscalation.operatingProtocol}</Badge>
                  <Badge variant="outline">{result.triggerModule}</Badge>
                </div>

                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <div className="mb-2 text-[11px] uppercase tracking-widest text-primary">Operator Directive</div>
                  <div className="text-sm">{result.autoEscalation.operatorDirective}</div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Card className="border border-border/60 bg-background/40 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <div className="text-sm font-semibold">{t("command.recommendedTeams")}</div>
                    </div>
                    <div className="space-y-2">
                      {result.autoEscalation.recommendedTeams.map((team) => (
                        <div key={team} className="text-sm text-muted-foreground">• {team}</div>
                      ))}
                    </div>
                  </Card>

                  <Card className="border border-border/60 bg-background/40 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <div className="text-sm font-semibold">{t("command.escalationActions")}</div>
                    </div>
                    <div className="space-y-2">
                      {result.autoEscalation.recommendedActions.map((action) => (
                        <div key={action} className="text-sm text-muted-foreground">• {action}</div>
                      ))}
                    </div>
                  </Card>
                </div>
              </>
            )}
          </div>
        </Card>

        <Card className="border border-border/60 bg-card/70">
          <div className="flex items-center gap-2 border-b border-border/50 p-4">
            <Radio className="h-4 w-4 text-primary" />
            <div className="text-sm font-semibold">{t("command.scenarioSnapshot")}</div>
          </div>

          <div className="space-y-4 p-4">
            {!result ? (
              <div className="text-sm text-muted-foreground">{t("command.noSimulationSelected")}</div>
            ) : (
              <>
                <div className="text-lg font-semibold">{result.scenarioLabel}</div>
                <div className="text-sm text-muted-foreground">{formatDate(result.simulatedAt)}</div>

                <div className="grid grid-cols-2 gap-3">
                  <Card className="border border-border/60 bg-background/40 p-3">
                    <div className="text-[11px] uppercase text-muted-foreground">{t("command.atRiskPersons")}</div>
                    <div className="text-xl font-bold">{result.atRiskPersonsCount}</div>
                  </Card>
                  <Card className="border border-border/60 bg-background/40 p-3">
                    <div className="text-[11px] uppercase text-muted-foreground">{t("command.criticalFacilities")}</div>
                    <div className="text-xl font-bold">{result.criticalFacilitiesCount}</div>
                  </Card>
                  <Card className="border border-border/60 bg-background/40 p-3">
                    <div className="text-[11px] uppercase text-muted-foreground">{t("command.batteryAvg")}</div>
                    <div className="text-xl font-bold">{result.energyStatus.avgBatteryLevel}%</div>
                  </Card>
                  <Card className="border border-border/60 bg-background/40 p-3">
                    <div className="text-[11px] uppercase text-muted-foreground">{t("command.backupHours")}</div>
                    <div className="text-xl font-bold">{result.energyStatus.backupHoursEstimate}</div>
                  </Card>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                  <div className="mb-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">Auto Response</div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Badge className={cn("border", responseTierClass(result.autoResponse.responseTier))}>
                      {result.autoResponse.responseTier}
                    </Badge>
                    <Badge className={cn("border", responseModeClass(result.autoResponse.responseMode))}>
                      {result.autoResponse.responseMode}
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-300">{result.autoResponse.commandMessage}</div>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="border border-border/60 bg-card/70">
          <div className="flex items-center gap-2 border-b border-border/50 p-4">
            <TriangleAlert className="h-4 w-4 text-primary" />
            <div className="text-sm font-semibold">{t("timeline.escalationTimeline")}</div>
          </div>

          <div className="space-y-3 p-4">
            {!result ? (
              <div className="text-sm text-muted-foreground">{t("command.runOrSelectTimeline")}</div>
            ) : (
              result.escalationTimeline.map((step, idx) => (
                <div key={`${step.time}-${idx}`} className="rounded-xl border border-border/60 bg-background/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">{step.time}</div>
                    <Badge className={cn("border", severityClass(step.severity))}>{step.severity}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">{step.event}</div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="border border-border/60 bg-card/70">
          <div className="flex items-center justify-between border-b border-border/50 p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <div className="text-sm font-semibold">{t("command.simulationHistory")}</div>
            </div>
            <Badge className="border border-white/10 bg-white/5 text-slate-300">
              {history.length} entries
            </Badge>
          </div>

          <div className="space-y-3 p-4">
            {history.length === 0 ? (
              <div className="text-sm text-muted-foreground">{t("command.noSimulationHistory")}</div>
            ) : (
              history.map((item) => {
                const selected = selectedHistoryId === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedHistoryId(item.id)}
                    className={cn(
                      "block w-full rounded-xl border bg-background/40 p-4 text-left transition-all",
                      selected
                        ? "border-cyan-400/40 shadow-[0_0_0_1px_rgba(34,211,238,0.22)]"
                        : "border-border/60 hover:border-cyan-400/20"
                    )}
                  >
                    <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-semibold text-white">{item.scenarioLabel ?? item.scenarioType}</div>
                          <Badge className={cn("border", severityClass(item.riskSeverity))}>
                            {item.riskSeverity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">READINESS {item.readinessScore}</Badge>
                          {selected ? (
                            <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-200">{t("command.selected")}</Badge>
                          ) : null}
                        </div>

                        <div className="text-sm text-muted-foreground">
                          {item.affectedSites} sites · {item.affectedPersons} persons · population at risk{" "}
                          {item.estimatedPopulationAtRisk.toLocaleString()}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {formatDate(item.simulatedAt)}
                          {item.operatorName ? ` · ${item.operatorName}` : item.operatorEmail ? ` · ${item.operatorEmail}` : ""}
                        </div>
                      </div>

                      <div className="min-w-[120px] rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-center">
                        <div className="text-[11px] uppercase text-muted-foreground">{t("command.scenarioId")}</div>
                        <div className="text-sm font-semibold text-primary">{item.scenarioId}</div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>
      </div>

      <Card className="border border-border/60 bg-card/70">
        <div className="flex items-center justify-between gap-2 border-b border-border/50 p-4">
          <div className="flex items-center gap-2">
            <Siren className="h-4 w-4 text-primary" />
            <div className="text-sm font-semibold">{t("command.escalationEventFeed")}</div>
          </div>
          <div className="text-xs text-muted-foreground">{liveEscalationStatus}</div>
        </div>

        <div className="space-y-3 p-4">
          {!escalations.length ? (
            <div className="text-sm text-muted-foreground">{t("command.noEscalationEvents")}</div>
          ) : (
            escalations.map((item) => (
              <div
                key={item.id}
                className={cn("space-y-3 rounded-2xl border p-4", escalationPulseClass(item.escalationLevel))}
              >
                <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold">{item.scenarioLabel}</div>
                      <Badge className={cn("border", moduleClass(item.triggerModule))}>{item.triggerModule}</Badge>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {formatDate(item.createdAt)} · {item.actorName || item.actorEmail}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge className={cn("border", escalationClass(item.escalationLevel))}>{item.escalationLevel}</Badge>
                      <Badge className={cn("border", deploymentClass(item.deploymentMode))}>{item.deploymentMode}</Badge>
                      <Badge variant="outline">{item.operatingProtocol}</Badge>
                    </div>
                  </div>

                  <div className="min-w-[92px] rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-center">
                    <div className="text-[11px] uppercase text-muted-foreground">Score</div>
                    <div className="text-2xl font-bold text-primary">{item.threatScore}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <div className="mb-2 text-[11px] uppercase tracking-widest text-primary">Directive</div>
                  <div className="text-sm">{item.operatorDirective}</div>
                </div>

                {!!item.recommendedActions?.length && (
                  <div className="grid gap-2 md:grid-cols-2">
                    {item.recommendedActions.slice(0, 4).map((action) => (
                      <div
                        key={action}
                        className="rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm text-slate-300"
                      >
                        <CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-300" />
                        {action}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="border border-border/60 bg-card/70">
        <div className="flex items-center gap-2 border-b border-border/50 p-4">
          <Radio className="h-4 w-4 text-primary" />
          <div className="text-sm font-semibold">{t("command.selectedSimulationDetail")}</div>
        </div>

        <div className="p-4">
          {detailLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading simulation detail...
            </div>
          ) : !result ? (
            <div className="text-sm text-muted-foreground">{t("command.selectHistoryOrRun")}</div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                <div className="mb-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">{t("command.affectedSites")}</div>
                <div className="space-y-2">
                  {result.affectedSites.slice(0, 5).map((site) => (
                    <div key={site.id} className="rounded-xl border border-border/60 bg-card/50 p-3">
                      <div className="font-medium text-white">{site.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {site.location}, {site.country} · {site.type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                <div className="mb-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">Machine Actions</div>
                <div className="space-y-2">
                  {result.autoResponse.machineActions.map((action) => (
                    <div key={action} className="rounded-xl border border-border/60 bg-card/50 p-3 text-sm text-slate-300">
                      {action}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
