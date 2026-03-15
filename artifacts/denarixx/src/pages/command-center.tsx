import React, { useState } from 'react';
import { Card, PageHeader, Badge, Button, cn } from '@/components/ui-core';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Play, AlertTriangle, Zap, Shield, Globe, MapPin, Users,
  Battery, Activity, ChevronRight, Download, Clock, TrendingDown,
  CheckCircle2, Radio, Siren, RefreshCw
} from 'lucide-react';

type ScenarioType =
  | 'flood_event'
  | 'severe_storm'
  | 'wildfire_risk'
  | 'clinic_power_outage'
  | 'multi_site_outage'
  | 'child_emergency_sos';

interface ScenarioOption {
  id: ScenarioType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  module: 'energy' | 'lifemesh' | 'earthshield';
  color: string;
  description: string;
}

interface SimulationResult {
  scenarioId: string;
  scenarioType: ScenarioType;
  scenarioLabel: string;
  triggerModule: string;
  riskSeverity: 'critical' | 'warning' | 'info';
  readinessScore: number;
  affectedSites: Array<{
    id: number; name: string; type: string; location: string;
    country: string; status: string; population: number;
    powerAvailability: number; currentRiskLevel: string;
  }>;
  affectedPersonsTotal: number;
  atRiskPersonsCount: number;
  criticalFacilitiesCount: number;
  criticalFacilities: Array<{ id: number; name: string; type: string; location: string }>;
  estimatedPopulationAtRisk: number;
  energyStatus: {
    avgBatteryLevel: number;
    avgSolarGeneration: number;
    backupHoursEstimate: number;
    gridStressLevel: 'critical' | 'warning' | 'stable';
  };
  recommendedActions: string[];
  escalationTimeline: Array<{ time: string; event: string; severity: string }>;
  activeAlertCount: number;
  simulatedAt: string;
}

const SCENARIOS: ScenarioOption[] = [
  {
    id: 'flood_event', label: 'Flood Event', icon: Globe, module: 'earthshield',
    color: 'text-blue-400', description: 'Rapid onset flooding across low-lying village and shelter sites',
  },
  {
    id: 'severe_storm', label: 'Severe Storm', icon: Radio, module: 'earthshield',
    color: 'text-indigo-400', description: 'Category 3+ storm threatening grid and school/clinic infrastructure',
  },
  {
    id: 'wildfire_risk', label: 'Wildfire Risk', icon: AlertTriangle, module: 'earthshield',
    color: 'text-orange-400', description: 'Active fire front within 5km of district infrastructure',
  },
  {
    id: 'clinic_power_outage', label: 'Clinic Power Outage', icon: Zap, module: 'energy',
    color: 'text-yellow-400', description: 'Complete grid loss at critical medical facility',
  },
  {
    id: 'multi_site_outage', label: 'Multi-Site Outage', icon: Activity, module: 'energy',
    color: 'text-destructive', description: 'Cascading power failure across 4+ infrastructure nodes',
  },
  {
    id: 'child_emergency_sos', label: 'Child Emergency / SOS', icon: Siren, module: 'lifemesh',
    color: 'text-red-400', description: 'Critical SOS beacon from tracked child — immediate dispatch required',
  },
];

const MODULE_COLORS: Record<string, string> = {
  energy: 'text-primary border-primary/30 bg-primary/10',
  lifemesh: 'text-green-400 border-green-500/30 bg-green-500/10',
  earthshield: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
};

function ReadinessMeter({ score }: { score: number }) {
  const color = score >= 70 ? '#22c55e' : score >= 45 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(220 14% 15%)" strokeWidth="8" />
        <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.5s ease' }}
        />
      </svg>
      <div className="text-center z-10">
        <div className="text-3xl font-display font-bold text-white">{score}</div>
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Readiness</div>
      </div>
    </div>
  );
}

function TimelineEvent({ event, index }: { event: SimulationResult['escalationTimeline'][0]; index: number }) {
  const isLast = false;
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="relative flex gap-4"
    >
      <div className="flex flex-col items-center">
        <div className={cn(
          "w-3 h-3 rounded-full border-2 border-background shrink-0 mt-1",
          event.severity === 'critical' ? 'bg-destructive shadow-[0_0_8px_rgba(220,38,38,0.8)]' :
          event.severity === 'warning' ? 'bg-amber-500' : 'bg-green-500'
        )} />
        <div className="w-px flex-1 bg-border/50 mt-1" />
      </div>
      <div className="pb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono font-bold text-primary tracking-widest">{event.time}</span>
          <Badge variant={event.severity === 'critical' ? 'critical' : event.severity === 'warning' ? 'warning' : 'safe'} className="text-[9px] h-4 py-0">
            {event.severity.toUpperCase()}
          </Badge>
        </div>
        <p className="text-sm text-foreground/90 leading-snug">{event.event}</p>
      </div>
    </motion.div>
  );
}

export default function CommandCenter() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runSimulation = async () => {
    if (!selectedScenario) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, '');
      const res = await fetch(`${base}/api/command-center/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioType: selectedScenario }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data: SimulationResult = await res.json();
      setResult(data);
    } catch (e) {
      setError('Simulation failed. Check API connection.');
    } finally {
      setLoading(false);
    }
  };

  const selectedMeta = SCENARIOS.find(s => s.id === selectedScenario);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Command Center"
        description="Unified system brain — scenario simulation and cross-module operational response."
        actions={
          result && (
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Download className="w-4 h-4 mr-2" /> Export Report
            </Button>
          )
        }
      />

      {/* Scenario Selector */}
      <Card className="p-6 mb-6 border-primary/20 bg-gradient-to-br from-secondary/40 to-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-white text-lg">Scenario Simulation Engine</h3>
            <p className="text-xs text-muted-foreground">Select a scenario and run the AI simulation to compute readiness and recommended actions</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {SCENARIOS.map(scenario => (
            <button
              key={scenario.id}
              onClick={() => { setSelectedScenario(scenario.id); setResult(null); setError(''); }}
              className={cn(
                "text-left p-4 rounded-2xl border transition-all duration-200 group",
                selectedScenario === scenario.id
                  ? "bg-primary/10 border-primary/50 shadow-[0_0_20px_rgba(201,168,76,0.15)]"
                  : "bg-secondary/30 border-border/50 hover:border-border hover:bg-secondary/60"
              )}
            >
              <scenario.icon className={cn("w-6 h-6 mb-2 transition-transform group-hover:scale-110", scenario.color)} />
              <div className="font-bold text-sm text-white leading-tight mb-1">{scenario.label}</div>
              <div className="text-[10px] text-muted-foreground leading-snug line-clamp-2">{scenario.description}</div>
              {selectedScenario === scenario.id && (
                <div className="mt-2 flex items-center gap-1 text-[10px] text-primary font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3" /> Selected
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={runSimulation}
            disabled={!selectedScenario || loading}
            className="h-12 px-8 font-bold tracking-widest shadow-[0_0_20px_rgba(201,168,76,0.3)]"
          >
            {loading
              ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Simulating...</>
              : <><Play className="w-4 h-4 mr-2" /> Run Simulation</>}
          </Button>
          {selectedMeta && (
            <div className={cn("flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border", MODULE_COLORS[selectedMeta.module])}>
              <selectedMeta.icon className="w-4 h-4" />
              {selectedMeta.module.charAt(0).toUpperCase() + selectedMeta.module.slice(1)} Module
            </div>
          )}
          {error && <p className="text-destructive text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</p>}
        </div>
      </Card>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            
            {/* Header Bar */}
            <div className={cn(
              "p-4 rounded-2xl border mb-6 flex flex-wrap items-center gap-4",
              result.riskSeverity === 'critical'
                ? "bg-destructive/10 border-destructive/30"
                : result.riskSeverity === 'warning'
                ? "bg-amber-500/10 border-amber-500/30"
                : "bg-green-500/10 border-green-500/30"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full animate-ping",
                result.riskSeverity === 'critical' ? 'bg-destructive' : result.riskSeverity === 'warning' ? 'bg-amber-500' : 'bg-green-500'
              )} />
              <h2 className="font-display font-bold text-white text-lg">{result.scenarioLabel} — Active Simulation</h2>
              <Badge variant={result.riskSeverity === 'critical' ? 'critical' : 'warning'} className="uppercase">
                {result.riskSeverity} risk
              </Badge>
              <span className="text-[10px] font-mono text-muted-foreground ml-auto">SIM ID: {result.scenarioId.slice(-8)}</span>
              <span className="text-[10px] font-mono text-muted-foreground">{new Date(result.simulatedAt).toUTCString()}</span>
            </div>

            {/* Top KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Affected Sites', value: result.affectedSites.length, icon: MapPin, color: 'hsl(var(--chart-4))' },
                { label: 'People at Risk', value: result.estimatedPopulationAtRisk.toLocaleString(), icon: Users, color: 'hsl(var(--destructive))' },
                { label: 'At-Risk Persons', value: result.atRiskPersonsCount, icon: Shield, color: 'hsl(var(--chart-3))' },
                { label: 'Critical Facilities', value: result.criticalFacilitiesCount, icon: Activity, color: 'hsl(var(--primary))' },
              ].map(({ label, value, icon: Icon, color }) => (
                <Card key={label} className="p-4 border-t-2" style={{ borderTopColor: color }}>
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="text-2xl font-display font-bold text-white">{value}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 font-semibold">{label}</div>
                </Card>
              ))}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              
              {/* Readiness + Energy */}
              <div className="flex flex-col gap-6">
                <Card className="p-6 flex flex-col items-center text-center border-primary/20">
                  <h3 className="text-sm font-display font-bold text-muted-foreground uppercase tracking-widest mb-4">System Readiness</h3>
                  <ReadinessMeter score={result.readinessScore} />
                  <div className={cn("mt-4 text-sm font-bold",
                    result.readinessScore >= 70 ? 'text-green-400' : result.readinessScore >= 45 ? 'text-amber-400' : 'text-destructive'
                  )}>
                    {result.readinessScore >= 70 ? 'READY FOR RESPONSE' : result.readinessScore >= 45 ? 'PARTIALLY READY' : 'CRITICAL — RESPONSE REQUIRED'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Score factors: energy reserves, active alerts, site risk levels
                  </p>
                </Card>

                <Card className="p-5 bg-secondary/20">
                  <h3 className="text-sm font-display font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Battery className="w-4 h-4" /> Energy Status
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground font-medium">Avg Battery</span>
                        <span className={cn("font-bold", result.energyStatus.avgBatteryLevel < 30 ? 'text-destructive' : 'text-white')}>
                          {result.energyStatus.avgBatteryLevel}%
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-1000", result.energyStatus.avgBatteryLevel < 30 ? 'bg-destructive' : result.energyStatus.avgBatteryLevel < 60 ? 'bg-amber-500' : 'bg-green-500')}
                          style={{ width: `${result.energyStatus.avgBatteryLevel}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground font-medium">Solar Output</span>
                        <span className="font-bold text-primary">{result.energyStatus.avgSolarGeneration}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all duration-1000" style={{ width: `${result.energyStatus.avgSolarGeneration}%` }} />
                      </div>
                    </div>
                    <div className="flex justify-between text-sm pt-1 border-t border-border/50">
                      <span className="text-muted-foreground">Backup Duration</span>
                      <span className="font-bold text-white">{result.energyStatus.backupHoursEstimate}h est.</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Grid Stress</span>
                      <Badge variant={result.energyStatus.gridStressLevel === 'critical' ? 'critical' : result.energyStatus.gridStressLevel === 'warning' ? 'warning' : 'safe'} className="text-[10px]">
                        {result.energyStatus.gridStressLevel.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Affected Sites */}
              <Card className="p-6 lg:col-span-2">
                <h3 className="text-sm font-display font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Affected Infrastructure Nodes
                </h3>
                <div className="space-y-3">
                  {result.affectedSites.length === 0 ? (
                    <div className="text-muted-foreground text-sm text-center py-8">No sites directly affected by this scenario</div>
                  ) : (
                    result.affectedSites.map((site, i) => (
                      <motion.div
                        key={site.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center gap-4 p-3 bg-secondary/30 rounded-xl border border-border/50 hover:border-primary/30 transition-colors"
                      >
                        <div className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          site.status === 'online' ? 'bg-green-500' :
                          site.status === 'critical' ? 'bg-destructive animate-ping' : 'bg-amber-500'
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white truncate">{site.name}</span>
                            <Badge variant="outline" className="text-[9px] h-4 py-0 border-border/50 capitalize">{site.type}</Badge>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{site.location}, {site.country}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-white">{site.population.toLocaleString()}</div>
                          <div className="text-[9px] text-muted-foreground">population</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={cn("text-xs font-bold", site.powerAvailability < 30 ? 'text-destructive' : site.powerAvailability < 70 ? 'text-amber-400' : 'text-green-400')}>
                            {site.powerAvailability.toFixed(0)}%
                          </div>
                          <div className="text-[9px] text-muted-foreground">power</div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {result.criticalFacilities.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-destructive mb-2">Critical Facilities at Risk</div>
                    <div className="flex flex-wrap gap-2">
                      {result.criticalFacilities.map(f => (
                        <div key={f.id} className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-1.5 text-xs">
                          <Activity className="w-3 h-3 text-destructive" />
                          <span className="font-bold text-white">{f.name}</span>
                          <span className="text-muted-foreground capitalize">{f.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Actions + Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Recommended Actions */}
              <Card className="p-6 border-primary/20">
                <h3 className="text-sm font-display font-bold text-primary uppercase tracking-widest mb-5 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" /> Recommended Actions
                </h3>
                <ol className="space-y-3">
                  {result.recommendedActions.map((action, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3 group"
                    >
                      <div className="shrink-0 w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary mt-0.5 group-hover:bg-primary/30 transition-colors">
                        {i + 1}
                      </div>
                      <p className="text-sm text-foreground/85 leading-snug">{action}</p>
                    </motion.li>
                  ))}
                </ol>
              </Card>

              {/* Escalation Timeline */}
              <Card className="p-6 bg-secondary/20">
                <h3 className="text-sm font-display font-bold text-muted-foreground uppercase tracking-widest mb-5 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Escalation Timeline
                </h3>
                <div className="space-y-0">
                  {result.escalationTimeline.map((evt, i) => (
                    <TimelineEvent key={i} event={evt} index={i} />
                  ))}
                </div>
              </Card>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {!result && !loading && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-24 h-24 rounded-full bg-secondary/50 border border-border flex items-center justify-center mb-6">
            <Cpu className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-display font-bold text-white mb-2">Select a Scenario</h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            Choose a scenario above and run the simulation engine to compute live readiness, impacted assets, and recommended response actions.
          </p>
        </div>
      )}
    </motion.div>
  );
}
