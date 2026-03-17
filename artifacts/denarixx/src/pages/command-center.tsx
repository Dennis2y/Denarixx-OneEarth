import React, { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { PageHeader, Card, Badge, Button, cn } from "@/components/ui-core";
import { apiFetch } from "@/lib/api";

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

export default function CommandCenterPage() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>("flood_event");
  const [running, setRunning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [liveEscalationStatus, setLiveEscalationStatus] = useState("Awaiting command simulation...");


  const loadHistory = async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      const json = await apiFetch("/api/command-center/history");
      setHistory(json as HistoryRow[]);
    } catch {
      if (!silent) setHistory([]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory(false);
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
      const json = await apiFetch("/api/command-center/simulate", {
        method: "POST",
        body: JSON.stringify({ scenarioType: selectedScenario }),
      });
      setResult(json as SimulationResult);
      await loadHistory(true);
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Command Center"
        description="Run simulations, generate auto-escalation, and prepare command actions"
        actions={
          <Button variant="secondary" size="sm" onClick={() => loadHistory(true)} disabled={refreshing}>
            <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
            Refresh History
          </Button>
        }
      />

      <Card className="border border-border/60 bg-card/70 p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="space-y-2">
            <div className="text-sm font-semibold">Scenario Simulation</div>
            <div className="text-sm text-muted-foreground">
              Select an incident scenario to generate AI-based escalation and deployment advice.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
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

            <Button onClick={runSimulation} isLoading={running}>
              <Play className="w-4 h-4 mr-2" />
              Run AI Simulation
            </Button>
          </div>
        </div>
      </Card>


      <Card className="border border-primary/20 bg-primary/5 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-primary mb-1">Live Escalation Feed</div>
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-border/60 bg-card/70">
          <div className="text-xs text-muted-foreground">Threat Score</div>
          <div className="text-2xl font-bold text-primary">{overview.threatScore}</div>
        </Card>
        <Card className="p-4 border border-border/60 bg-card/70">
          <div className="text-xs text-muted-foreground">Readiness Score</div>
          <div className="text-2xl font-bold">{overview.readinessScore}</div>
        </Card>
        <Card className="p-4 border border-border/60 bg-card/70">
          <div className="text-xs text-muted-foreground">Affected Sites</div>
          <div className="text-2xl font-bold">{overview.affectedSites}</div>
        </Card>
        <Card className="p-4 border border-border/60 bg-card/70">
          <div className="text-xs text-muted-foreground">Population at Risk</div>
          <div className="text-2xl font-bold">{overview.population.toLocaleString()}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <Card className="border border-border/60 bg-card/70">
          <div className="p-4 border-b border-border/50 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <div className="text-sm font-semibold">Auto-Escalation Decision</div>
          </div>

          <div className="p-4 space-y-4">
            {!result ? (
              <div className="text-sm text-muted-foreground">Run a simulation to view escalation output.</div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge className={cn("border", severityClass(result.riskSeverity))}>
                    {result.riskSeverity.toUpperCase()}
                  </Badge>
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
                  <div className="text-[11px] uppercase tracking-widest text-primary mb-2">Operator Directive</div>
                  <div className="text-sm">{result.autoEscalation.operatorDirective}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 border border-border/60 bg-background/40">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-primary" />
                      <div className="text-sm font-semibold">Recommended Teams</div>
                    </div>
                    <div className="space-y-2">
                      {result.autoEscalation.recommendedTeams.map((team) => (
                        <div key={team} className="text-sm text-muted-foreground">• {team}</div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-4 border border-border/60 bg-background/40">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-primary" />
                      <div className="text-sm font-semibold">Escalation Actions</div>
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
          <div className="p-4 border-b border-border/50 flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" />
            <div className="text-sm font-semibold">Scenario Snapshot</div>
          </div>

          <div className="p-4 space-y-4">
            {!result ? (
              <div className="text-sm text-muted-foreground">No simulation selected.</div>
            ) : (
              <>
                <div className="text-lg font-semibold">{result.scenarioLabel}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(result.simulatedAt).toLocaleString()}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-3 border border-border/60 bg-background/40">
                    <div className="text-[11px] text-muted-foreground uppercase">At-Risk Persons</div>
                    <div className="text-xl font-bold">{result.atRiskPersonsCount}</div>
                  </Card>
                  <Card className="p-3 border border-border/60 bg-background/40">
                    <div className="text-[11px] text-muted-foreground uppercase">Critical Facilities</div>
                    <div className="text-xl font-bold">{result.criticalFacilitiesCount}</div>
                  </Card>
                  <Card className="p-3 border border-border/60 bg-background/40">
                    <div className="text-[11px] text-muted-foreground uppercase">Battery Avg</div>
                    <div className="text-xl font-bold">{result.energyStatus.avgBatteryLevel}%</div>
                  </Card>
                  <Card className="p-3 border border-border/60 bg-background/40">
                    <div className="text-[11px] text-muted-foreground uppercase">Backup Hours</div>
                    <div className="text-xl font-bold">{result.energyStatus.backupHoursEstimate}</div>
                  </Card>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
        <Card className="border border-border/60 bg-card/70">
          <div className="p-4 border-b border-border/50 flex items-center gap-2">
            <TriangleAlert className="w-4 h-4 text-primary" />
            <div className="text-sm font-semibold">Escalation Timeline</div>
          </div>

          <div className="p-4 space-y-3">
            {!result ? (
              <div className="text-sm text-muted-foreground">Run a simulation to view timeline events.</div>
            ) : (
              result.escalationTimeline.map((step, idx) => (
                <div key={`${step.time}-${idx}`} className="rounded-xl border border-border/60 bg-background/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">{step.time}</div>
                    <Badge className={cn("border", severityClass(step.severity))}>{step.severity}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">{step.event}</div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="border border-border/60 bg-card/70">
          <div className="p-4 border-b border-border/50 flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <div className="text-sm font-semibold">Simulation History</div>
          </div>

          <div className="p-4 space-y-3">
            {history.length === 0 ? (
              <div className="text-sm text-muted-foreground">No simulation history available.</div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{item.scenarioType}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(item.simulatedAt).toLocaleString()}
                      </div>
                    </div>
                    <Badge className={cn("border", severityClass(item.riskSeverity))}>{item.riskSeverity}</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                      <div className="text-[11px] uppercase text-muted-foreground">Readiness</div>
                      <div className="font-semibold">{item.readinessScore}</div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase text-muted-foreground">Sites</div>
                      <div className="font-semibold">{item.affectedSites}</div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase text-muted-foreground">Population</div>
                      <div className="font-semibold">{item.estimatedPopulationAtRisk.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

      <Card className="border border-border/60 bg-card/70">
        <div className="p-4 border-b border-border/50 flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <div className="text-sm font-semibold">Simulation History</div>
        </div>

        <div className="p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-sm text-muted-foreground">No simulation history yet.</div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border/60 bg-background/40 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold">{item.scenarioLabel ?? item.scenarioType}</div>
                    <Badge className={cn("border", severityClass(item.riskSeverity))}>
                      {item.riskSeverity.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">READINESS {item.readinessScore}</Badge>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {item.affectedSites} sites · {item.affectedPersons} persons · population at risk {item.estimatedPopulationAtRisk.toLocaleString()}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {new Date(item.simulatedAt).toLocaleString()}
                    {item.operatorName ? ` · ${item.operatorName}` : ""}
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-center min-w-[120px]">
                  <div className="text-[11px] text-muted-foreground uppercase">Scenario ID</div>
                  <div className="text-sm font-semibold text-primary">{item.scenarioId}</div>
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
