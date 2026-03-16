import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, Badge, Button, LoadingScreen, cn } from '@/components/ui-core';
import { apiUrl } from "@/lib/api";
import {
  ArrowLeft, MapPin, Zap, Users, AlertTriangle, Activity, Shield,
  Battery, Sun, Wifi, BarChart3, Clock, Phone, Download, RefreshCw,
  Globe, Server, ChevronRight, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAuth } from '@/context/auth';
import { useTranslation } from 'react-i18next';

const SITE_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  village: Globe,
  clinic: Activity,
  school: Shield,
  district: Server,
  shelter: Users,
};

export default function SiteDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { can, user } = useAuth();
  const { t } = useTranslation();

  const RISK_CONFIG = {
    critical: { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/40', label: t('siteDetail.criticalRisk') },
    high: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/40', label: t('siteDetail.highRisk') },
    medium: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/40', label: t('siteDetail.mediumRisk') },
    low: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/40', label: t('siteDetail.lowRisk') },
  };

  const STATUS_CONFIG = {
    online: { color: 'text-green-400', dot: 'bg-green-400', label: t('sites.online') },
    offline: { color: 'text-muted-foreground', dot: 'bg-muted-foreground', label: t('sites.offline') },
    warning: { color: 'text-amber-500', dot: 'bg-amber-500', label: t('earthshield.warning') },
    critical: { color: 'text-destructive', dot: 'bg-destructive', label: t('earthshield.critical') },
  };

  const [site, setSite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const siteId = parseInt(params.id ?? '0');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(apiUrl(`/api/sites/${siteId}`), { credentials: 'include' });
      if (!res.ok) throw new Error('Not found');
      setSite(await res.json());
    } catch {
      setError(t('siteDetail.siteNotFound'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [siteId]);

  const downloadReport = async () => {
    if (!can('reports.generate')) return;
    setReportLoading(true);
    setReportSuccess(false);
    try {
      const res = await fetch(apiUrl(`/api/reports/site/${siteId}`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const report = await res.json();
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `denarixx-site-${siteId}-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setReportSuccess(true);
        setTimeout(() => setReportSuccess(false), 3000);
      }
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  if (error || !site) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-display font-bold text-white mb-2">{t('siteDetail.siteNotFound')}</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button variant="outline" onClick={() => setLocation('/sites')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> {t('siteDetail.backToSites')}
        </Button>
      </div>
    );
  }

  const TypeIcon = SITE_TYPE_ICONS[site.type] ?? Server;
  const riskCfg = RISK_CONFIG[site.currentRiskLevel as keyof typeof RISK_CONFIG] ?? RISK_CONFIG.low;
  const statusCfg = STATUS_CONFIG[site.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.online;

  const energyChartData = [...(site.energyHistory ?? [])].reverse().map((e: any) => ({
    time: format(new Date(e.recordedAt), 'HH:mm'),
    Battery: e.batteryLevel,
    Solar: e.solarGeneration,
    Load: e.communityLoad,
  }));

  function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-xl p-3 text-xs shadow-xl">
        <div className="text-muted-foreground mb-1">{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-white font-semibold">{p.value.toFixed(1)}%</span>
            <span className="text-muted-foreground">{p.name}</span>
          </div>
        ))}
      </div>
    );
  }

  function StatBlock({ label, value, sub, colorClass }: { label: string; value: React.ReactNode; sub?: string; colorClass?: string }) {
    return (
      <div className="p-4 bg-secondary/30 rounded-xl border border-border/50">
        <div className={cn("text-2xl font-display font-bold text-white", colorClass)}>{value}</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mt-1">{label}</div>
        {sub && <div className="text-xs text-muted-foreground/70 mt-0.5">{sub}</div>}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={() => setLocation('/sites')}
            className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border text-muted-foreground hover:text-white transition-all shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 shrink-0">
            <TypeIcon className="w-6 h-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-white truncate">{site.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 text-primary shrink-0" />
                {site.location}, {site.country}
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <div className={cn('w-2 h-2 rounded-full shrink-0', statusCfg.dot, site.status === 'critical' && 'animate-ping')} />
                <span className={cn('font-semibold', statusCfg.color)}>{statusCfg.label}</span>
              </div>
              <Badge variant="outline" className={cn('capitalize text-[10px]', riskCfg.color, riskCfg.border)}>
                {riskCfg.label}
              </Badge>
              <Badge variant="outline" className="text-[10px] capitalize border-border/50">{site.type}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-10 sm:ml-0">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('siteDetail.refresh')}</span>
          </Button>
          {can('reports.generate') && (
            <Button size="sm" onClick={downloadReport} isLoading={reportLoading}
              className={cn(reportSuccess && 'bg-green-600 hover:bg-green-700')}>
              {reportSuccess
                ? <><CheckCircle2 className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">{t('siteDetail.reportDownloaded')}</span></>
                : <><Download className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">{t('siteDetail.resilienceReport')}</span></>}
            </Button>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3 mb-6">
        <StatBlock
          label={t('siteDetail.uptime')}
          value={`${site.uptime?.toFixed(1) ?? '—'}%`}
          colorClass={site.uptime >= 99 ? 'text-green-400' : site.uptime >= 95 ? 'text-amber-400' : 'text-destructive'}
        />
        <StatBlock
          label={t('siteDetail.powerAvailability')}
          value={`${site.powerAvailability?.toFixed(1) ?? '—'}%`}
          colorClass={site.powerAvailability >= 80 ? 'text-primary' : 'text-amber-400'}
        />
        <StatBlock
          label={t('siteDetail.riskScore')}
          value={site.summary?.riskScore ?? '—'}
          colorClass={site.summary?.riskScore >= 70 ? 'text-destructive' : site.summary?.riskScore >= 40 ? 'text-amber-400' : 'text-green-400'}
        />
        <StatBlock
          label={t('siteDetail.protectedPersons')}
          value={(site.summary?.totalPersons ?? 0).toLocaleString()}
          sub={`${site.summary?.atRiskPersons ?? 0} ${t('siteDetail.atRisk')}`}
        />
        <StatBlock
          label={t('sites.population')}
          value={(site.population ?? 0).toLocaleString()}
          sub={t('siteDetail.residents')}
        />
        <StatBlock
          label={t('siteDetail.activeAlerts')}
          value={site.summary?.activeAlertCount ?? 0}
          colorClass={site.summary?.criticalAlertCount > 0 ? 'text-destructive' : 'text-white'}
          sub={`${site.summary?.criticalAlertCount ?? 0} ${t('earthshield.critical').toLowerCase()}`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">

        {/* Energy History Chart */}
        <Card className="xl:col-span-2 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> {t('siteDetail.energyHistory')}
            </h2>
            {site.latestEnergy && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                <Clock className="w-3 h-3" />
                {t('siteDetail.lastReading')}: {formatDistanceToNow(new Date(site.latestEnergy.recordedAt))} {t('siteDetail.ago')}
              </div>
            )}
          </div>

          {energyChartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">{t('siteDetail.noEnergyData')}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={energyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="battGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(43,65%,52%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(43,65%,52%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(220,14%,15%)" strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fill: 'hsl(217,10%,55%)', fontSize: 10 }} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Battery" stroke="hsl(43,65%,52%)" fill="url(#battGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="Solar" stroke="#22c55e" fill="url(#solarGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {site.latestEnergy && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-border/50">
              {[
                { label: t('sites.battery'), value: `${site.latestEnergy.batteryLevel.toFixed(1)}%`, icon: Battery, color: 'text-primary' },
                { label: t('sites.solar'), value: `${site.latestEnergy.solarGeneration.toFixed(1)}%`, icon: Sun, color: 'text-yellow-400' },
                { label: t('energy.storage'), value: `${site.latestEnergy.communityLoad.toFixed(1)}%`, icon: Zap, color: 'text-blue-400' },
                { label: t('sites.grid'), value: site.latestEnergy.gridStatus, icon: Wifi, color: site.latestEnergy.gridStatus === 'stable' ? 'text-green-400' : 'text-amber-500' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="text-center">
                  <Icon className={cn("w-4 h-4 mx-auto mb-1", color)} />
                  <div className={cn("text-sm font-bold", color)}>{value}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Risk Summary */}
        <Card className="p-6">
          <h2 className="font-display font-bold text-white flex items-center gap-2 mb-5">
            <Shield className="w-5 h-5 text-primary" /> {t('siteDetail.riskSummary')}
          </h2>

          <div className={cn("p-4 rounded-2xl border mb-5 text-center", riskCfg.bg, riskCfg.border)}>
            <div className={cn("text-4xl font-display font-bold mb-1", riskCfg.color)}>
              {site.summary?.riskScore ?? '—'}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{t('siteDetail.riskScoreOf')}</div>
            <div className={cn("text-sm font-bold mt-2", riskCfg.color)}>{riskCfg.label}</div>
          </div>

          <div className="space-y-3">
            {[
              { label: t('siteDetail.currentRiskLevel'), value: site.currentRiskLevel, badge: true },
              { label: t('siteDetail.siteStatus'), value: site.status, badge: true },
              { label: t('siteDetail.uptime'), value: `${site.uptime?.toFixed(2) ?? '—'}%` },
              { label: t('siteDetail.powerAvailability'), value: `${site.powerAvailability?.toFixed(1) ?? '—'}%` },
              { label: t('siteDetail.gridStatus'), value: site.latestEnergy?.gridStatus ?? t('siteDetail.noData') },
              { label: t('siteDetail.coordinates'), value: `${site.latitude?.toFixed(4)}, ${site.longitude?.toFixed(4)}` },
            ].map(({ label, value, badge }) => (
              <div key={label} className="flex items-center justify-between text-sm gap-4">
                <span className="text-muted-foreground shrink-0">{label}</span>
                {badge
                  ? <Badge variant="outline" className="capitalize text-[10px] border-border/50 font-mono">{value}</Badge>
                  : <span className="font-mono text-white text-xs text-right">{value}</span>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

        {/* Protected Persons */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> {t('siteDetail.protectedPersons')}
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">{site.persons?.length ?? 0} {t('siteDetail.total')}</Badge>
              {site.summary?.atRiskPersons > 0 && (
                <Badge variant="critical" className="text-[10px]">{site.summary.atRiskPersons} {t('siteDetail.atRisk')}</Badge>
              )}
            </div>
          </div>

          {!site.persons?.length ? (
            <div className="flex flex-col items-center py-10 text-center">
              <Users className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">{t('siteDetail.noPersons')}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {site.persons.map((person: any) => {
                const statusIcon = person.status === 'safe'
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  : person.status === 'emergency'
                  ? <AlertCircle className="w-3.5 h-3.5 text-destructive animate-pulse" />
                  : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
                return (
                  <div key={person.id} className="flex items-center gap-3 p-3 bg-secondary/20 rounded-xl border border-border/40 hover:border-border/70 transition-colors">
                    {statusIcon}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-white truncate">{person.name}</div>
                      <div className="text-[10px] text-muted-foreground capitalize">{person.category} · {person.lastKnownLocation}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={cn("text-[10px] font-bold capitalize",
                        person.status === 'safe' ? 'text-green-400'
                        : person.status === 'emergency' ? 'text-destructive'
                        : 'text-amber-500'
                      )}>{person.status}</div>
                      {person.contactPhone && (
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground mt-0.5">
                          <Phone className="w-2.5 h-2.5" /> {person.contactPhone}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Active Alerts */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" /> {t('siteDetail.activeAlerts')}
            </h2>
            <Badge variant="outline" className="text-[10px]">{site.activeAlerts?.length ?? 0} {t('siteDetail.active')}</Badge>
          </div>

          {!site.activeAlerts?.length ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-500/40 mb-2" />
              <p className="text-sm text-muted-foreground">{t('siteDetail.noAlerts')}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">{t('siteDetail.allNominal')}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {site.activeAlerts.map((alert: any) => (
                <div key={alert.id} className={cn(
                  "p-3 rounded-xl border transition-colors",
                  alert.severity === 'critical'
                    ? 'bg-destructive/5 border-destructive/30'
                    : alert.severity === 'warning'
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : 'bg-secondary/20 border-border/40'
                )}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-white truncate">{alert.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 capitalize">{alert.module} · {alert.location}</div>
                    </div>
                    <Badge
                      variant={alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'warning' : 'safe'}
                      className="text-[9px] shrink-0"
                    >
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </div>
                  {alert.description && (
                    <p className="text-xs text-muted-foreground/80 mt-1.5 leading-snug line-clamp-2">{alert.description}</p>
                  )}
                  <div className="text-[9px] text-muted-foreground/50 mt-1.5 font-mono">
                    {format(new Date(alert.createdAt), 'MMM d · HH:mm:ss')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Emergency Contacts */}
      {site.persons?.some((p: any) => p.contactPhone) && (
        <Card className="p-6">
          <h2 className="font-display font-bold text-white flex items-center gap-2 mb-5">
            <Phone className="w-5 h-5 text-primary" /> {t('siteDetail.emergencyContacts')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {site.persons
              .filter((p: any) => p.contactPhone)
              .slice(0, 8)
              .map((person: any) => (
                <div key={person.id} className="p-3 bg-secondary/20 rounded-xl border border-border/40 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{person.name.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{person.contactName}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{t('siteDetail.contactFor')} {person.name}</div>
                    <div className="text-[10px] text-primary font-mono">{person.contactPhone}</div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

    </motion.div>
  );
}