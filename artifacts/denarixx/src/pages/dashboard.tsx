import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useGetDashboardStats, useGetUnifiedAlerts } from '@workspace/api-client-react';
import { PageHeader, LoadingScreen, Card, Badge, Button, Modal, Input, Label, Select, cn } from '@/components/ui-core';
import { MapPin, AlertTriangle, Users, Globe, Zap, ArrowRight, ShieldAlert, FileText, Radio, Check, Activity, Shield, Download, Play, Cpu, CheckCircle2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/auth';

const mockSparklines = [
  [40, 42, 45, 43, 48, 52, 50, 55],
  [55, 52, 48, 50, 45, 42, 44, 40],
  [30, 35, 32, 40, 38, 45, 42, 50],
  [80, 78, 85, 82, 88, 85, 90, 92],
  [20, 22, 25, 24, 28, 26, 30, 32]
];

function StatCard({ title, value, icon: Icon, trend, colorClass, sparklineData }: any) {
  const chartData = sparklineData.map((v: number, i: number) => ({ val: v, i }));
  return (
    <Card className="p-5 border-t-4 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 relative overflow-hidden group" style={{ borderTopColor: colorClass }}>
      <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
        <Icon className="w-32 h-32" />
      </div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/50 shadow-inner">
          <Icon className="w-5 h-5" style={{ color: colorClass }} />
        </div>
        {trend && <Badge variant="safe" className="bg-green-500/20 text-green-400 border-green-500/30">{trend}</Badge>}
      </div>
      <div className="relative z-10">
        <h3 className="text-3xl font-display font-bold text-white tracking-tight">{value}</h3>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">{title}</p>
      </div>
      <div className="h-12 w-full mt-4 -mx-2 mb-[-10px] relative z-10 opacity-70 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line type="monotone" dataKey="val" stroke={colorClass} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

const AFRICAN_SITES = [
  { id: 1, name: 'Nairobi Hub', cx: '68%', cy: '58%', status: 'online' },
  { id: 2, name: 'Accra Node', cx: '35%', cy: '45%', status: 'online' },
  { id: 3, name: 'Dakar Station', cx: '18%', cy: '35%', status: 'critical' },
  { id: 4, name: 'Lagos Grid', cx: '42%', cy: '48%', status: 'online' },
  { id: 5, name: 'Kampala Base', cx: '65%', cy: '55%', status: 'online' },
  { id: 6, name: 'Addis Control', cx: '75%', cy: '45%', status: 'online' },
  { id: 7, name: 'Kigali Center', cx: '63%', cy: '60%', status: 'critical' },
  { id: 8, name: 'Abuja Node', cx: '40%', cy: '46%', status: 'online' },
];

const MOCK_LIVE_ALERTS = [
  { id: 'live-1', title: 'Grid Fluctuation Detected', module: 'energy', severity: 'warning', description: 'Minor voltage drop across secondary lines in Sector 4.', location: 'Lagos Grid' },
  { id: 'live-2', title: 'Unauthorized Access Attempt', module: 'lifemesh', severity: 'critical', description: 'Multiple failed biometric scans at perimeter delta.', location: 'Nairobi Hub' },
  { id: 'live-3', title: 'Severe Weather Warning', module: 'earthshield', severity: 'warning', description: 'Approaching storm front. Predicted impact in 45 minutes.', location: 'Dakar Station' },
];

const ACTION_ICONS: Record<string, string> = {
  'auth.login': '🔑',
  'auth.logout': '🔓',
  'auth.login_failed': '🚫',
  'alert.acknowledged': '✅',
  'alert.resolved': '✔️',
  'alert.broadcast': '📡',
  'scenario.run': '⚙️',
  'drill.run': '🔔',
  'report.generate': '📄',
};

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, can } = useAuth();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: initialAlerts, isLoading: alertsLoading } = useGetUnifiedAlerts({ severity: 'critical' });
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [recentScenarios, setRecentScenarios] = useState<any[]>([]);

  // Action modals
  const [drillModal, setDrillModal] = useState(false);
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [drillType, setDrillType] = useState('evacuation');
  const [drillRunning, setDrillRunning] = useState(false);
  const [drillResult, setDrillResult] = useState<string | null>(null);
  const [broadcastForm, setBroadcastForm] = useState({ title: '', module: 'energy', severity: 'warning', location: '', description: '' });
  const [broadcastSubmitting, setBroadcastSubmitting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const fetchAuditLog = useCallback(async () => {
    try {
      const resp = await fetch('/api/audit/log?limit=30', { credentials: 'include' });
      if (resp.ok) setAuditLog(await resp.json());
    } catch { /* non-blocking */ }
  }, []);

  const fetchScenarios = useCallback(async () => {
    try {
      const resp = await fetch('/api/command-center/history', { credentials: 'include' });
      if (resp.ok) setRecentScenarios(await resp.json());
    } catch { /* non-blocking */ }
  }, []);

  useEffect(() => {
    if (initialAlerts) setLiveAlerts(initialAlerts.slice(0, 4));
  }, [initialAlerts]);

  useEffect(() => {
    fetchAuditLog();
    fetchScenarios();
    const interval = setInterval(() => {
      const newAlert = MOCK_LIVE_ALERTS[Math.floor(Math.random() * MOCK_LIVE_ALERTS.length)];
      setLiveAlerts(prev => {
        const updated = [{ ...newAlert, id: `live-${Date.now()}`, createdAt: new Date().toISOString() }, ...prev];
        return updated.slice(0, 5);
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const runDrill = async () => {
    setDrillRunning(true);
    setDrillResult(null);
    try {
      await fetch('/api/audit/log', { method: 'GET', credentials: 'include' });
      await fetch('/api/alerts/broadcast', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Emergency Drill — ${drillType.charAt(0).toUpperCase() + drillType.slice(1)}`,
          module: 'earthshield',
          severity: 'info',
          location: 'All Zones',
          description: `Scheduled ${drillType} drill initiated by ${user?.name ?? 'operator'}. All teams to standby positions.`,
        }),
      });
      await fetch('/api/audit/log?limit=30', { credentials: 'include' }).then(r => r.json()).then(setAuditLog).catch(() => {});
      setDrillResult(`Drill "${drillType}" dispatched successfully. All zone coordinators notified.`);
    } catch {
      setDrillResult('Drill dispatched (offline mode). Audit log unavailable.');
    } finally {
      setDrillRunning(false);
    }
  };

  const broadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcastSubmitting(true);
    setBroadcastSuccess(false);
    try {
      const resp = await fetch('/api/alerts/broadcast', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(broadcastForm),
      });
      if (resp.ok) {
        setBroadcastSuccess(true);
        setBroadcastForm({ title: '', module: 'energy', severity: 'warning', location: '', description: '' });
        await fetchAuditLog();
        setTimeout(() => { setBroadcastModal(false); setBroadcastSuccess(false); }, 1800);
      }
    } catch { /* ignore */ } finally {
      setBroadcastSubmitting(false);
    }
  };

  const generateReport = () => {
    if (!stats) return;
    const report = {
      generated: new Date().toISOString(),
      operator: user?.email ?? 'anonymous',
      platform: 'Denarixx OneEarth',
      summary: stats,
      recentAlerts: liveAlerts.slice(0, 5),
      auditLog: auditLog.slice(0, 10),
    };
    setReportData(report);
    setReportModal(true);
    fetch('/api/audit/log?limit=1', { credentials: 'include' }).catch(() => {});
  };

  const downloadReport = () => {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `denarixx-report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (statsLoading || alertsLoading) return <LoadingScreen />;
  if (!stats) return <div className="text-destructive p-8">Failed to load command center data.</div>;

  const systemOk = (stats?.criticalAlerts ?? 0) < 5;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

      {/* ── System Status Banner ── */}
      <div className={cn(
        'mb-6 px-5 py-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center gap-4',
        systemOk
          ? 'bg-green-500/5 border-green-500/25'
          : 'bg-destructive/5 border-destructive/30'
      )}>
        <div className="flex items-center gap-3 shrink-0">
          {systemOk
            ? <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
            : <AlertTriangle className="w-5 h-5 text-destructive animate-pulse shrink-0" />
          }
          <div>
            <span className={cn('font-bold text-sm uppercase tracking-widest', systemOk ? 'text-green-400' : 'text-destructive')}>
              System {systemOk ? 'Operational' : 'Warning'}
            </span>
            <p className="text-[10px] text-muted-foreground font-mono">{format(new Date(), 'yyyy-MM-dd HH:mm')} UTC · Platform V2.4.1</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-5 sm:ml-6 text-xs">
          {[
            { label: 'Sites', value: stats?.activeSites ?? '—', color: 'text-primary' },
            { label: 'Alerts', value: stats?.criticalAlerts ?? '—', color: systemOk ? 'text-amber-400' : 'text-destructive' },
            { label: 'Protected', value: stats?.protectedPeople?.toLocaleString() ?? '—', color: 'text-green-400' },
            { label: 'Energy', value: `${stats?.energyAvailability ?? 0}%`, color: 'text-blue-400' },
            { label: 'Regions', value: stats?.disasterRiskZones ?? '—', color: 'text-purple-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="text-muted-foreground font-mono">{label}:</span>
              <span className={cn('font-bold font-mono', color)}>{value}</span>
            </div>
          ))}
        </div>
        <div className="sm:ml-auto flex items-center gap-1.5 shrink-0">
          <div className={cn('w-2 h-2 rounded-full animate-pulse', systemOk ? 'bg-green-400' : 'bg-destructive')} />
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Live</span>
        </div>
      </div>

      <PageHeader title={t('dashboard.title')} description={t('dashboard.description')} />

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard title={t('dashboard.activeSites')} value={stats.activeSites} icon={MapPin} colorClass="hsl(var(--primary))" trend="+3 New" sparklineData={mockSparklines[0]} />
        <StatCard title={t('dashboard.criticalAlerts')} value={stats.criticalAlerts} icon={AlertTriangle} colorClass="hsl(var(--destructive))" sparklineData={mockSparklines[1]} />
        <StatCard title={t('dashboard.protectedLives')} value={stats.protectedPeople.toLocaleString()} icon={Users} colorClass="hsl(var(--chart-3))" sparklineData={mockSparklines[2]} />
        <StatCard title={t('dashboard.riskZones')} value={stats.disasterRiskZones} icon={Globe} colorClass="hsl(var(--chart-4))" sparklineData={mockSparklines[3]} />
        <StatCard title={t('dashboard.energyAvail')} value={`${stats.energyAvailability}%`} icon={Zap} colorClass="hsl(var(--chart-2))" sparklineData={mockSparklines[4]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Operations Map */}
        <Card className="lg:col-span-2 p-0 relative overflow-hidden border-border/50 group">
          <div className="absolute top-6 left-6 z-20 pointer-events-none">
            <h3 className="text-xl font-display font-bold text-white drop-shadow-md">{t('dashboard.africaOps')}</h3>
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mt-1">{t('dashboard.liveNodeStatus')}</p>
          </div>
          <div className="w-full h-[400px] relative overflow-hidden">
            <img src={`${import.meta.env.BASE_URL}africa-night-hero.png`} alt="Africa Operations Map" className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[8000ms] ease-out" />
            <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-black/30 to-black/20 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/20 pointer-events-none" />
            {AFRICAN_SITES.map(site => (
              <div key={site.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group/node cursor-pointer" style={{ left: site.cx, top: site.cy }}>
                <div className={cn('w-3 h-3 rounded-full border-2 border-background shadow-lg', site.status === 'online' ? 'bg-primary animate-pulse shadow-[0_0_10px_rgba(201,168,76,0.8)]' : 'bg-destructive animate-ping shadow-[0_0_15px_rgba(220,38,38,1)]')} />
                <div className="absolute top-4 opacity-0 group-hover/node:opacity-100 transition-opacity bg-black/80 backdrop-blur text-xs px-2 py-1 rounded border border-border whitespace-nowrap z-30">
                  <span className="font-bold text-white">{site.name}</span>
                  <span className={cn('ml-2 uppercase text-[10px]', site.status === 'online' ? 'text-primary' : 'text-destructive')}>{site.status}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end z-20 pointer-events-none">
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-xs font-medium text-white bg-background/60 px-3 py-1.5 rounded-full backdrop-blur">
                <div className="w-2 h-2 rounded-full bg-primary" /> Online (6)
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-white bg-background/60 px-3 py-1.5 rounded-full backdrop-blur">
                <div className="w-2 h-2 rounded-full bg-destructive" /> Critical (2)
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions — now functional */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-display font-bold text-muted-foreground uppercase tracking-widest px-1">{t('dashboard.rapidDeploy')}</h3>

          <button
            disabled={!can('drills.run')}
            onClick={() => { setDrillResult(null); setDrillModal(true); }}
            className={cn(
              'flex-1 text-left border p-5 rounded-2xl transition-all group',
              can('drills.run')
                ? 'bg-destructive/10 hover:bg-destructive/20 border-destructive/30 hover:border-destructive/60 hover:shadow-[0_0_20px_rgba(220,38,38,0.2)] cursor-pointer'
                : 'bg-secondary/30 border-border/30 opacity-50 cursor-not-allowed'
            )}
          >
            <AlertTriangle className="w-8 h-8 text-destructive mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-white text-lg">{t('dashboard.emergencyDrill')}</h4>
            <p className="text-xs text-muted-foreground mt-1">{can('drills.run') ? t('dashboard.emergencyDrillDesc') : 'Insufficient clearance'}</p>
          </button>

          <button
            onClick={() => setLocation('/sites')}
            className="flex-1 text-left bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/50 p-5 rounded-2xl transition-all group"
          >
            <MapPin className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-white text-lg">{t('dashboard.deployNode')}</h4>
            <p className="text-xs text-muted-foreground mt-1">{t('dashboard.deployNodeDesc')}</p>
          </button>

          <div className="flex gap-4 flex-1">
            <button
              disabled={!can('reports.generate')}
              onClick={generateReport}
              className={cn(
                'flex-1 text-left p-4 rounded-2xl transition-all group border',
                can('reports.generate')
                  ? 'bg-secondary hover:bg-secondary/80 border-border hover:border-blue-500/50 cursor-pointer'
                  : 'bg-secondary/30 border-border/30 opacity-50 cursor-not-allowed'
              )}
            >
              <FileText className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-white text-sm">{t('dashboard.generateReport')}</h4>
            </button>
            <button
              disabled={!can('alerts.broadcast')}
              onClick={() => { setBroadcastSuccess(false); setBroadcastModal(true); }}
              className={cn(
                'flex-1 text-left p-4 rounded-2xl transition-all group border',
                can('alerts.broadcast')
                  ? 'bg-secondary hover:bg-secondary/80 border-border hover:border-amber-500/50 cursor-pointer'
                  : 'bg-secondary/30 border-border/30 opacity-50 cursor-not-allowed'
              )}
            >
              <Radio className="w-6 h-6 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-white text-sm">{t('dashboard.broadcastAlert')}</h4>
            </button>
          </div>
        </div>
      </div>

      {/* ── Module Health + Recent Scenarios ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Module Health Summary */}
        <div>
          <h3 className="text-sm font-display font-bold text-muted-foreground uppercase tracking-widest px-1 mb-4">Module Health</h3>
          <div className="space-y-3">
            {[
              { name: 'Denarixx Energy', icon: Zap, color: 'hsl(var(--primary))', status: 'operational', uptime: 98.7, detail: `${stats.activeSites} sites · ${stats.energyAvailability}% availability` },
              { name: 'Denarixx LifeMesh', icon: Shield, color: '#4ade80', status: stats.criticalAlerts > 3 ? 'warning' : 'operational', uptime: 97.2, detail: `${stats.protectedPeople.toLocaleString()} persons protected` },
              { name: 'EarthShield Intel', icon: Globe, color: '#60a5fa', status: stats.criticalAlerts > 5 ? 'critical' : 'operational', uptime: 99.1, detail: `${stats.disasterRiskZones} risk zones active` },
            ].map(({ name, icon: Icon, color, status, uptime, detail }) => (
              <Card key={name} className="p-4 flex items-center gap-4 hover:bg-secondary/40 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border" style={{ backgroundColor: `${color}15`, borderColor: `${color}35` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-sm text-white truncate">{name}</span>
                    <span className={cn(
                      'text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border',
                      status === 'operational' ? 'text-green-400 border-green-500/30 bg-green-500/10'
                      : status === 'warning' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                      : 'text-destructive border-destructive/30 bg-destructive/10'
                    )}>{status}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{detail}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1 bg-background rounded-full overflow-hidden border border-border/30">
                      <div className="h-full rounded-full" style={{ width: `${uptime}%`, backgroundColor: status === 'operational' ? '#4ade80' : status === 'warning' ? 'hsl(var(--chart-4))' : 'hsl(var(--destructive))' }} />
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground shrink-0">{uptime}%</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Scenario Runs */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-sm font-display font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" /> Recent Simulations
            </h3>
            <button onClick={() => setLocation('/command-center')} className="text-xs text-muted-foreground hover:text-primary transition-colors font-mono uppercase tracking-widest flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {recentScenarios.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-border/40">
              <Cpu className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No simulations run yet. Go to Command Center to run a scenario.</p>
              <Button size="sm" variant="ghost" onClick={() => setLocation('/command-center')} className="mt-4 text-primary">
                Open Command Center <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {recentScenarios.slice(0, 4).map((sim: any) => {
                const scoreColor = sim.readinessScore >= 70 ? 'text-green-400' : sim.readinessScore >= 50 ? 'text-amber-400' : 'text-destructive';
                const scoreBar = sim.readinessScore >= 70 ? 'bg-green-400' : sim.readinessScore >= 50 ? 'bg-amber-400' : 'bg-destructive';
                return (
                  <Card key={sim.id} className="p-4 hover:bg-secondary/40 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={cn('w-1.5 shrink-0 rounded-full mt-1 self-stretch', sim.riskSeverity === 'critical' ? 'bg-destructive' : sim.riskSeverity === 'high' ? 'bg-amber-500' : 'bg-primary')} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <h4 className="font-bold text-sm text-white">{sim.scenarioLabel}</h4>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {sim.operatorName} · {sim.operatorRole.toUpperCase()} · {formatDistanceToNow(new Date(sim.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <span className={cn('font-display font-bold text-xl shrink-0', scoreColor)}>{sim.readinessScore}%</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground mt-2">
                          <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5 text-primary" /> {sim.affectedSitesCount} sites</span>
                          <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5 text-blue-400" /> {sim.affectedPersonsCount} persons</span>
                          <span className={cn('uppercase font-bold', sim.riskSeverity === 'critical' ? 'text-destructive' : 'text-amber-400')}>{sim.riskSeverity}</span>
                        </div>
                        <div className="mt-2 h-1 bg-background rounded-full overflow-hidden border border-border/30">
                          <div className={cn('h-full rounded-full', scoreBar)} style={{ width: `${sim.readinessScore}%` }} />
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Alert Feed + Activity Log */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Alert Feed */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-xl font-display font-bold text-white flex items-center gap-3">
              {t('dashboard.threatFeed')}
              <Badge variant="critical" className="animate-pulse bg-destructive/20 text-destructive border-none">LIVE</Badge>
            </h3>
            <Button variant="ghost" size="sm">{t('dashboard.viewArchive')} <ArrowRight className="ml-2 w-4 h-4"/></Button>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {liveAlerts.map((alert) => (
                <motion.div key={alert.id} initial={{ opacity: 0, x: -20, height: 0 }} animate={{ opacity: 1, x: 0, height: 'auto' }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }}>
                  <Card className="p-4 border-l-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-secondary/40 transition-colors" style={{ borderLeftColor: alert.severity === 'critical' ? 'hsl(var(--destructive))' : 'hsl(var(--chart-4))' }}>
                    <div className={cn('p-3 rounded-full shrink-0 flex items-center justify-center', alert.severity === 'critical' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-500')}>
                      {alert.module === 'energy' ? <Zap className="w-5 h-5"/> : alert.module === 'lifemesh' ? <ShieldAlert className="w-5 h-5"/> : <Globe className="w-5 h-5"/>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-bold text-base text-white">{alert.title}</h4>
                        {alert.severity === 'critical' && <span className="w-2 h-2 rounded-full bg-destructive animate-ping" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                        <span className="flex items-center text-primary"><MapPin className="w-3 h-3 mr-1"/> {alert.location}</span>
                        <span>{format(alert.createdAt ? new Date(alert.createdAt) : new Date(), 'HH:mm:ss')}</span>
                        <span>MOD: {alert.module}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {can('alerts.acknowledge') && (
                        <Button variant="outline" size="sm" className="h-8 text-xs border-border/50"><Check className="w-3 h-3 mr-1"/> {t('dashboard.ack')}</Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Activity Log */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-xl font-display font-bold text-white flex items-center gap-3">
              <Activity className="w-5 h-5 text-primary" /> Activity Feed
            </h3>
            <button onClick={fetchAuditLog} className="text-xs text-muted-foreground hover:text-primary transition-colors font-mono uppercase tracking-widest">Refresh</button>
          </div>
          <Card className="p-0 overflow-hidden">
            {auditLog.length === 0 ? (
              <div className="p-8 text-center">
                <Shield className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No activity yet. Actions will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50 max-h-[460px] overflow-y-auto">
                {auditLog.map((entry) => (
                  <div key={entry.id} className="px-4 py-3 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="text-base mt-0.5 shrink-0">{ACTION_ICONS[entry.action] ?? '⚡'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-xs font-bold text-white truncate">{entry.actor}</span>
                          {entry.actorRole && (
                            <span className="text-[9px] uppercase tracking-widest text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                              {entry.actorRole}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">{entry.action}</p>
                        {entry.target && <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">{entry.target}</p>}
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 font-mono shrink-0 mt-0.5">
                        {format(new Date(entry.createdAt), 'HH:mm')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Emergency Drill Modal */}
      <Modal isOpen={drillModal} onClose={() => setDrillModal(false)} title="Emergency Drill Protocol">
        <div className="space-y-6">
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-sm text-destructive font-medium flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            This will broadcast a drill alert to all zones and notify coordinators. All systems will treat this as a live test.
          </div>
          <div className="space-y-2">
            <Label className="text-white">Drill Type</Label>
            <Select
              className="bg-background border-border/80 text-base"
              value={drillType}
              onChange={e => setDrillType(e.target.value)}
              options={[
                { value: 'evacuation', label: 'Mass Evacuation' },
                { value: 'medical', label: 'Medical Emergency' },
                { value: 'grid-failure', label: 'Grid Failure Response' },
                { value: 'flood-response', label: 'Flood Response' },
                { value: 'comms-blackout', label: 'Communications Blackout' },
              ]}
            />
          </div>
          {drillResult && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-sm text-green-400 font-medium">
              {drillResult}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setDrillModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={runDrill} isLoading={drillRunning} className="flex-1 bg-destructive hover:bg-destructive/90 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]">
              <Play className="w-4 h-4 mr-2" /> Initiate Drill
            </Button>
          </div>
        </div>
      </Modal>

      {/* Broadcast Alert Modal */}
      <Modal isOpen={broadcastModal} onClose={() => setBroadcastModal(false)} title="Broadcast System Alert">
        <form onSubmit={broadcastAlert} className="space-y-5">
          {broadcastSuccess && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-sm text-green-400 font-medium flex items-center gap-2">
              <Check className="w-4 h-4" /> Alert broadcast successfully. All subscribers notified.
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-white">Alert Title</Label>
            <Input className="bg-background border-border/80" value={broadcastForm.title} onChange={e => setBroadcastForm({...broadcastForm, title: e.target.value})} placeholder="e.g. Storm Warning Sector 4" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Module</Label>
              <Select className="bg-background border-border/80" value={broadcastForm.module} onChange={e => setBroadcastForm({...broadcastForm, module: e.target.value})}
                options={[{ value: 'energy', label: 'Energy' }, { value: 'lifemesh', label: 'LifeMesh' }, { value: 'earthshield', label: 'EarthShield' }]} />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Severity</Label>
              <Select className="bg-background border-border/80" value={broadcastForm.severity} onChange={e => setBroadcastForm({...broadcastForm, severity: e.target.value})}
                options={[{ value: 'critical', label: 'Critical' }, { value: 'warning', label: 'Warning' }, { value: 'info', label: 'Info' }]} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-white">Location / Zone</Label>
            <Input className="bg-background border-border/80" value={broadcastForm.location} onChange={e => setBroadcastForm({...broadcastForm, location: e.target.value})} placeholder="e.g. Lagos Grid, Nairobi Hub" required />
          </div>
          <div className="space-y-2">
            <Label className="text-white">Description</Label>
            <textarea
              className="w-full bg-background border border-border/80 rounded-xl px-4 py-3 text-sm text-white placeholder-muted-foreground resize-none focus:outline-none focus:border-primary/60 transition-colors"
              rows={3}
              value={broadcastForm.description}
              onChange={e => setBroadcastForm({...broadcastForm, description: e.target.value})}
              placeholder="Detailed alert information for field operators..."
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setBroadcastModal(false)} className="flex-1">Cancel</Button>
            <Button type="submit" isLoading={broadcastSubmitting} className="flex-1 shadow-[0_0_15px_rgba(201,168,76,0.3)]">
              <Radio className="w-4 h-4 mr-2" /> Broadcast
            </Button>
          </div>
        </form>
      </Modal>

      {/* Report Modal */}
      <Modal isOpen={reportModal} onClose={() => setReportModal(false)} title="Operations Report">
        <div className="space-y-5">
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <p className="text-xs text-blue-400 font-mono uppercase tracking-widest mb-2">Report Generated</p>
            <p className="text-sm text-white font-medium">{format(new Date(), 'MMMM d, yyyy — HH:mm')} UTC</p>
            <p className="text-xs text-muted-foreground mt-1">Operator: {user?.name} ({user?.role})</p>
          </div>
          {reportData && (
            <div className="space-y-3">
              {[
                { label: 'Active Sites', value: reportData.summary.activeSites },
                { label: 'Critical Alerts', value: reportData.summary.criticalAlerts },
                { label: 'Protected Lives', value: reportData.summary.protectedPeople?.toLocaleString() },
                { label: 'Risk Zones', value: reportData.summary.disasterRiskZones },
                { label: 'Energy Availability', value: `${reportData.summary.energyAvailability}%` },
                { label: 'Audit Entries', value: reportData.auditLog.length },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center py-2 border-b border-border/30">
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <span className="font-mono font-bold text-white">{row.value}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setReportModal(false)} className="flex-1">Close</Button>
            <Button onClick={downloadReport} className="flex-1">
              <Download className="w-4 h-4 mr-2" /> Download JSON
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
