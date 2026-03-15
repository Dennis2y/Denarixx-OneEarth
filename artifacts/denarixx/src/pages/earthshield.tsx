import React, { useState, useMemo } from 'react';
import { useGetDisasterAlerts, useGetRiskZones } from '@workspace/api-client-react';
import { ModuleHeader, LoadingScreen, Card, Badge, Button, cn } from '@/components/ui-core';
import { Globe, Wind, Droplets, Flame, Activity, MapPin, Zap, AlertTriangle, CloudLightning, Shield, Filter, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

type DisasterType = 'all' | 'flood' | 'wildfire' | 'storm' | 'earthquake' | 'infrastructure' | 'drought';

const TYPE_META: Record<string, { labelKey: string; icon: React.FC<{ className?: string }>; color: string; bg: string }> = {
  flood: { labelKey: 'earthshield.typeFlood', icon: ({ className }) => <Droplets className={cn('text-blue-400', className)} />, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  wildfire: { labelKey: 'earthshield.typeWildfire', icon: ({ className }) => <Flame className={cn('text-red-500', className)} />, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30' },
  storm: { labelKey: 'earthshield.typeStorm', icon: ({ className }) => <Wind className={cn('text-slate-300', className)} />, color: 'text-slate-300', bg: 'bg-slate-500/10 border-slate-500/30' },
  earthquake: { labelKey: 'earthshield.typeQuake', icon: ({ className }) => <Activity className={cn('text-orange-400', className)} />, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  infrastructure: { labelKey: 'earthshield.typeGrid', icon: ({ className }) => <Zap className={cn('text-primary', className)} />, color: 'text-primary', bg: 'bg-primary/10 border-primary/30' },
  drought: { labelKey: 'earthshield.typeDrought', icon: ({ className }) => <TrendingUp className={cn('text-amber-500', className)} />, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30' },
};

function getSeverityColor(severity: string) {
  return severity === 'critical' ? 'hsl(var(--destructive))' :
         severity === 'warning' ? 'hsl(var(--chart-4))' : 'hsl(var(--chart-3))';
}

function SeverityBand({ severity, t }: { severity: string; t: (k: string) => string }) {
  const label = severity === 'critical' ? t('earthshield.critical') : severity === 'warning' ? t('earthshield.warning') : t('earthshield.monitoring');
  const cls = severity === 'critical' ? 'text-destructive border-destructive/30 bg-destructive/10' :
              severity === 'warning' ? 'text-amber-500 border-amber-500/30 bg-amber-500/10' :
              'text-green-400 border-green-500/30 bg-green-500/10';
  return (
    <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold tracking-widest uppercase w-fit mb-5', cls)}>
      <div className={cn('w-1.5 h-1.5 rounded-full animate-pulse', severity === 'critical' ? 'bg-destructive' : severity === 'warning' ? 'bg-amber-500' : 'bg-green-400')} />
      {label}
    </div>
  );
}

function AlertCard({ alert, t }: { alert: any; t: (k: string) => string }) {
  const meta = TYPE_META[alert.type] ?? TYPE_META.flood;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} layout>
      <Card className="p-0 overflow-hidden group border-border/60 hover:border-primary/50 transition-all duration-300 flex flex-col h-full">
        <div className="h-1 w-full" style={{ backgroundColor: getSeverityColor(alert.severity) }} />
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-3">
            <div className={cn('flex items-center gap-2 px-2 py-1 rounded border text-xs font-bold uppercase tracking-wider', meta.bg)}>
              <meta.icon className="w-3.5 h-3.5" /> {t(meta.labelKey)}
            </div>
            <Badge variant={alert.severity === 'critical' ? 'critical' : 'warning'} className="bg-transparent text-[10px] uppercase">
              {alert.status}
            </Badge>
          </div>
          <h4 className="font-bold text-lg text-white mb-1 group-hover:text-primary transition-colors leading-tight">{alert.title}</h4>
          <p className="text-xs text-muted-foreground mb-3 flex items-center font-mono">
            <MapPin className="w-3 h-3 mr-1 text-primary/60" /> {alert.region}, {alert.country}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-3 mb-4">{alert.description}</p>
          <div className="mt-auto pt-4 border-t border-border/50 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-secondary/30 rounded-lg p-2 text-center">
              <p className="text-muted-foreground uppercase tracking-widest text-[9px] mb-0.5">{t('earthshield.population')}</p>
              <p className="font-bold text-white font-mono">{alert.affectedPopulation.toLocaleString()}</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-2 text-center">
              <p className="text-muted-foreground uppercase tracking-widest text-[9px] mb-0.5">{t('earthshield.issued')}</p>
              <p className="font-bold text-white font-mono">{format(new Date(alert.issuedAt), 'HH:mm')}</p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function EarthShield() {
  const { t } = useTranslation();
  const { data: alerts, isLoading: aLoading } = useGetDisasterAlerts();
  const { data: risks, isLoading: rLoading } = useGetRiskZones();
  const [typeFilter, setTypeFilter] = useState<DisasterType>('all');

  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];
    if (typeFilter === 'all') return alerts;
    return alerts.filter(a => a.type === typeFilter);
  }, [alerts, typeFilter]);

  if (aLoading || rLoading) return <LoadingScreen />;

  const critical = filteredAlerts.filter(a => a.severity === 'critical');
  const warning = filteredAlerts.filter(a => a.severity === 'warning');
  const monitoring = filteredAlerts.filter(a => a.severity === 'info');

  const floodCount = alerts?.filter(a => a.type === 'flood').length ?? 0;
  const fireCount = alerts?.filter(a => a.type === 'wildfire').length ?? 0;
  const stormCount = alerts?.filter(a => a.type === 'storm').length ?? 0;
  const infraCount = alerts?.filter(a => a.type === 'infrastructure').length ?? 0;
  const totalAffected = alerts?.reduce((s, a) => s + a.affectedPopulation, 0) ?? 0;

  const availableTypes: DisasterType[] = ['all', ...Array.from(new Set(alerts?.map(a => a.type as DisasterType) ?? []))];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <ModuleHeader
        title={t('earthshield.title')}
        subtitle={t('earthshield.description')}
        classification="RESTRICTED // THREAT INTELLIGENCE"
        moduleId="DNX-SHIELD-001"
        status={critical.length > 0 ? 'degraded' : 'active'}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { labelKey: 'earthshield.floodVectors', count: floodCount, icon: Droplets, color: 'text-blue-400', bar: 'bg-blue-500', max: 10 },
          { labelKey: 'earthshield.thermalEvents', count: fireCount, icon: Flame, color: 'text-red-500', bar: 'bg-red-500', max: 5 },
          { labelKey: 'earthshield.atmosEvents', count: stormCount, icon: CloudLightning, color: 'text-slate-300', bar: 'bg-slate-400', max: 8 },
          { labelKey: 'earthshield.gridStress', count: infraCount, icon: Zap, color: 'text-primary', bar: 'bg-primary', max: 12 },
          { labelKey: 'earthshield.popAtRisk', count: (totalAffected / 1000).toFixed(0) + 'K', icon: Shield, color: 'text-amber-400', bar: 'bg-amber-400', max: null },
        ].map((stat, i) => (
          <Card key={i} className="p-5 bg-card/60 backdrop-blur-md border-border/50 hover:bg-secondary/40 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 rounded-lg bg-secondary shadow-inner">
                <stat.icon className={cn('w-4 h-4', stat.color)} />
              </div>
              <span className={cn('text-2xl font-display font-bold', stat.color)}>{stat.count}</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">{t(stat.labelKey)}</p>
            {stat.max && (
              <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
                <div className={cn('h-full rounded-full', stat.bar)} style={{ width: `${((typeof stat.count === 'number' ? stat.count : 0) / stat.max) * 100}%` }} />
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-6 mb-6 px-1">
        <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{t('earthshield.riskLegend')}:</span>
        {[
          { color: 'bg-destructive', labelKey: 'earthshield.critical' },
          { color: 'bg-amber-500', labelKey: 'earthshield.warning' },
          { color: 'bg-green-500', labelKey: 'earthshield.monitoring' },
        ].map(l => (
          <div key={l.labelKey} className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <div className={cn('w-3 h-3 rounded-sm', l.color)} /> {t(l.labelKey)}
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="w-3.5 h-3.5 text-primary" />
          <span className="text-muted-foreground">{t('earthshield.filterBy')}:</span>
          <div className="flex gap-1.5 flex-wrap">
            {availableTypes.map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={cn(
                  'px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all',
                  typeFilter === type
                    ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_8px_rgba(201,168,76,0.4)]'
                    : 'border-border/50 text-muted-foreground hover:border-primary/40 hover:text-white'
                )}
              >
                {type === 'all' ? t('earthshield.all') : t(TYPE_META[type]?.labelKey ?? type)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <AnimatePresence>
            {critical.length > 0 && (
              <motion.div key="critical" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SeverityBand severity="critical" t={t} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {critical.map(a => <AlertCard key={a.id} alert={a} t={t} />)}
                </div>
              </motion.div>
            )}
            {warning.length > 0 && (
              <motion.div key="warning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SeverityBand severity="warning" t={t} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {warning.map(a => <AlertCard key={a.id} alert={a} t={t} />)}
                </div>
              </motion.div>
            )}
            {monitoring.length > 0 && (
              <motion.div key="monitoring" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SeverityBand severity="info" t={t} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {monitoring.map(a => <AlertCard key={a.id} alert={a} t={t} />)}
                </div>
              </motion.div>
            )}
            {filteredAlerts.length === 0 && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="p-12 text-center border-dashed border-2 border-border/40">
                  <Globe className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">{t('earthshield.noThreats')}</p>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-secondary/20">
            <h3 className="text-sm font-display font-bold text-white uppercase tracking-widest border-b border-border/50 pb-4 mb-5 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> {t('earthshield.readinessIndex')}
            </h3>
            <div className="space-y-5">
              {risks?.map((risk) => {
                const meta = TYPE_META[risk.type];
                const score = risk.preparednessScore;
                const scoreClass = score < 50 ? 'text-destructive' : score < 80 ? 'text-amber-500' : 'text-primary';
                const barClass = score < 50 ? 'bg-destructive' : score < 80 ? 'bg-amber-500' : 'bg-primary';
                return (
                  <div key={risk.id}>
                    <div className="flex justify-between items-start mb-1.5">
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {meta && <meta.icon className="w-3 h-3" />}
                          <span className="text-sm font-semibold text-white">{risk.name}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">{risk.region}, {risk.country}</p>
                      </div>
                      <span className={cn('font-mono font-bold text-sm', scoreClass)}>{score}/100</span>
                    </div>
                    <div className="w-full bg-background rounded-full h-2 overflow-hidden border border-border/30 shadow-inner">
                      <div
                        className={cn('h-full rounded-full transition-all duration-1000 relative', barClass)}
                        style={{ width: `${score}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6 border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
            <h3 className="text-sm font-display font-bold text-white uppercase tracking-widest border-b border-border/50 pb-4 mb-5 flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> {t('earthshield.spatialRisk')}
            </h3>
            <div className="space-y-3">
              {risks?.slice(0, 6).map((risk) => {
                const meta = TYPE_META[risk.type];
                const score = risk.preparednessScore;
                const severity = score < 40 ? 'critical' : score < 70 ? 'warning' : 'safe';
                const severityDot = severity === 'critical' ? 'bg-destructive animate-ping' : severity === 'warning' ? 'bg-amber-500' : 'bg-green-500';
                return (
                  <div key={risk.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/40 hover:border-primary/30 transition-colors group">
                    <div className="relative shrink-0">
                      <div className={cn('w-2.5 h-2.5 rounded-full', severityDot)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{risk.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{risk.latitude.toFixed(1)}°, {risk.longitude.toFixed(1)}°</p>
                    </div>
                    <div className="text-right shrink-0">
                      {meta && <meta.icon className="w-3.5 h-3.5 mb-1 ml-auto" />}
                      <p className={cn('text-[10px] font-bold uppercase', severity === 'critical' ? 'text-destructive' : severity === 'warning' ? 'text-amber-500' : 'text-green-400')}>
                        {severity}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-display font-bold text-white uppercase tracking-widest border-b border-border/50 pb-4 mb-5 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary" /> {t('earthshield.incidentTimeline')}
            </h3>
            <div className="relative border-l border-border ml-2 pl-4 space-y-5">
              {alerts?.slice(0, 5).map((alert) => (
                <div key={`log-${alert.id}`} className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-card" style={{ backgroundColor: getSeverityColor(alert.severity) }} />
                  <p className="text-[10px] font-mono text-muted-foreground mb-0.5">{format(new Date(alert.issuedAt), 'MMM dd, HH:mm')} UTC</p>
                  <p className="text-sm font-bold text-white leading-tight">{alert.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.region}, {alert.country}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-primary">{alert.affectedPopulation.toLocaleString()} pop.</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{alert.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
