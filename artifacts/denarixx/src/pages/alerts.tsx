import React, { useEffect, useState } from 'react';
import { ModuleHeader, Card, Badge, Button, Skeleton, EmptyState, cn } from '@/components/ui-core';
import { format } from 'date-fns';
import { Bell, Filter, ShieldAlert, Zap, Globe, Search, Clock, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { apiUrl } from '@/lib/api';

type UnifiedAlert = {
  id: number;
  title: string;
  module: string;
  severity: string;
  location: string;
  status: string;
  description: string;
  createdAt: string;
};

export default function Alerts() {
  const { t } = useTranslation();
  const [module, setModule] = useState<string>('');
  const [severity, setSeverity] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [selectedAlert, setSelectedAlert] = useState<UnifiedAlert | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [alerts, setAlerts] = useState<UnifiedAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (module) params.set('module', module);
      if (severity) params.set('severity', severity);
      if (status) params.set('status', status);

      const url = params.toString()
        ? apiUrl(`/api/alerts?${params.toString()}`)
        : apiUrl('/api/alerts');

      const resp = await fetch(url, { credentials: 'include' });
      if (!resp.ok) {
        setAlerts([]);
        return;
      }

      const data = await resp.json();
      setAlerts(Array.isArray(data) ? data : []);
    } catch {
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [module, severity, status]);

  const exportReport = async () => {
    setExportLoading(true);
    try {
      const resp = await fetch(apiUrl('/api/reports/alerts'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: module || undefined,
          severity: severity || undefined,
          status: status || undefined,
        }),
      });

      if (resp.ok) {
        const report = await resp.json();
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `denarixx-alerts-report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
    } finally {
      setExportLoading(false);
    }
  };

  const getModuleIcon = (mod: string) => {
    switch (mod) {
      case 'energy': return <Zap className="w-4 h-4 mr-1.5" />;
      case 'lifemesh': return <ShieldAlert className="w-4 h-4 mr-1.5" />;
      case 'earthshield': return <Globe className="w-4 h-4 mr-1.5" />;
      default: return <Bell className="w-4 h-4 mr-1.5" />;
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'hsl(var(--destructive))';
      case 'warning': return 'hsl(43, 65%, 52%)';
      case 'info': return 'hsl(210, 80%, 55%)';
      default: return 'hsl(var(--border))';
    }
  };

  const getStatusVariant = (s: string): 'safe' | 'critical' | 'warning' | 'outline' => {
    if (s === 'resolved') return 'safe';
    if (s === 'active') return 'critical';
    if (s === 'acknowledged') return 'warning';
    return 'outline';
  };

  const handleAcknowledge = async (alert: UnifiedAlert) => {
    try {
      const resp = await fetch(apiUrl(`/api/alerts/${alert.id}/status`), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'acknowledged' }),
      });

      if (resp.ok) {
        await loadAlerts();
        setSelectedAlert((prev) => prev?.id === alert.id ? { ...prev, status: 'acknowledged' } : prev);
      }
    } catch {
    }
  };

  const handleResolve = async (alert: UnifiedAlert) => {
    try {
      const resp = await fetch(apiUrl(`/api/alerts/${alert.id}/status`), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      });

      if (resp.ok) {
        await loadAlerts();
        setSelectedAlert((prev) => prev?.id === alert.id ? { ...prev, status: 'resolved' } : prev);
      }
    } catch {
    }
  };

  const alertsList = Array.isArray(alerts) ? alerts : [];
  const criticalCount = alertsList.filter((a) => a.severity === 'critical').length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex relative" style={{ minHeight: 'calc(100dvh - 180px)' }}>
      <div className={cn("flex-1 transition-all duration-300", selectedAlert ? "md:pr-[420px]" : "")}>
        <ModuleHeader
          title={t('alerts.title')}
          subtitle={t('alerts.description')}
          classification="RESTRICTED // ALERT COMMAND"
          moduleId="DNX-ALERT-001"
          status={criticalCount > 0 ? 'degraded' : 'active'}
          actions={
            <div className="flex items-center gap-3">
              {criticalCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 border border-destructive/30 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-destructive animate-ping" />
                  <span className="text-destructive text-xs font-bold uppercase tracking-wider">
                    {criticalCount} {t('alerts.criticalActive')}
                  </span>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={exportReport} disabled={exportLoading || isLoading}>
                {exportLoading
                  ? <><div className="w-3.5 h-3.5 mr-2 border-2 border-current/30 border-t-current rounded-full animate-spin" /> Generating...</>
                  : <><Download className="w-3.5 h-3.5 mr-2" /> Export Report</>}
              </Button>
            </div>
          }
        />

        <Card className="p-5 mb-6 border-primary/15 bg-secondary/20 backdrop-blur-md space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 shrink-0">
              <Filter className="w-3 h-3" /> {t('alerts.module')}
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { val: '', label: t('alerts.all') },
                { val: 'energy', label: 'Energy' },
                { val: 'lifemesh', label: 'LifeMesh' },
                { val: 'earthshield', label: 'EarthShield' },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => setModule(val)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border",
                    module === val ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(201,168,76,0.3)]" : "bg-transparent text-muted-foreground border-border/50 hover:border-primary/40"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-6 border-t border-border/30 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">{t('alerts.severity')}</span>
              {[
                { val: '', label: t('alerts.any'), cls: '' },
                { val: 'critical', label: t('alerts.critical'), cls: 'data-[active=true]:bg-destructive/20 data-[active=true]:text-destructive data-[active=true]:border-destructive/50' },
                { val: 'warning', label: t('alerts.warning'), cls: 'data-[active=true]:bg-amber-500/20 data-[active=true]:text-amber-400 data-[active=true]:border-amber-500/50' },
                { val: 'info', label: t('alerts.info'), cls: 'data-[active=true]:bg-blue-500/20 data-[active=true]:text-blue-400 data-[active=true]:border-blue-500/50' },
              ].map(({ val, label, cls }) => (
                <button
                  key={val}
                  onClick={() => setSeverity(val)}
                  data-active={severity === val}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border border-border/50 text-muted-foreground hover:bg-secondary", cls)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">{t('alerts.status')}</span>
              {[
                { val: '', label: t('alerts.all') },
                { val: 'active', label: t('alerts.active') },
                { val: 'acknowledged', label: t('alerts.acknowledged') },
                { val: 'resolved', label: t('alerts.resolved') },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => setStatus(val)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border",
                    status === val ? "bg-secondary/80 text-white border-primary/50" : "bg-transparent text-muted-foreground border-border/50 hover:bg-secondary/40"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map((i) => (
              <Card key={i} className="p-5 border-border/50">
                <div className="flex gap-4">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex gap-4 pt-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : !alertsList.length ? (
          <Card className="border-dashed border-2 border-border/50 bg-transparent">
            <EmptyState
              icon={Search}
              title={t('alerts.noAnomalies')}
              description={t('alerts.noAnomaliesDesc')}
              action={<Button variant="outline" onClick={() => { setModule(''); setSeverity(''); setStatus(''); }}>{t('alerts.resetFilters')}</Button>}
            />
          </Card>
        ) : (
          <div className="space-y-2.5 pb-10">
            {alertsList.map((alert) => (
              <motion.div key={alert.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card
                  className={cn(
                    "p-0 overflow-hidden transition-all duration-200 cursor-pointer border-l-4 group hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]",
                    selectedAlert?.id === alert.id ? "bg-secondary/50 ring-1 ring-primary/30" : "bg-card/70 hover:bg-secondary/30",
                    alert.status === 'resolved' && "opacity-60"
                  )}
                  style={{ borderLeftColor: getSeverityColor(alert.severity) }}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="p-5 flex flex-col md:flex-row gap-4 md:items-center">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <span className={cn(
                          "flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border",
                          alert.module === 'energy' ? 'text-primary border-primary/30 bg-primary/5' :
                          alert.module === 'lifemesh' ? 'text-green-400 border-green-500/30 bg-green-500/5' :
                          'text-blue-400 border-blue-500/30 bg-blue-500/5'
                        )}>
                          {getModuleIcon(alert.module)} {alert.module}
                        </span>
                        <Badge variant={alert.severity as any} className="text-[10px] py-0.5">{alert.severity}</Badge>
                        <Badge variant={getStatusVariant(alert.status)} className="text-[10px] py-0.5 capitalize">{alert.status}</Badge>
                        <span className="text-xs text-muted-foreground font-mono ml-auto hidden md:block">
                          <Clock className="w-3 h-3 inline mr-1" />{format(new Date(alert.createdAt), 'MMM dd, HH:mm:ss')}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-base truncate group-hover:text-primary transition-colors">{alert.title}</h4>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">{alert.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {selectedAlert && (
        <div className="hidden md:block fixed right-0 top-[88px] w-[400px] h-[calc(100vh-88px)] border-l border-border/50 bg-background/95 backdrop-blur-md p-5 overflow-y-auto">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-bold text-white">{selectedAlert.title}</h3>
            <button onClick={() => setSelectedAlert(null)} className="text-muted-foreground hover:text-white">×</button>
          </div>

          <div className="space-y-3">
            <Badge variant={selectedAlert.severity as any}>{selectedAlert.severity}</Badge>
            <Badge variant={getStatusVariant(selectedAlert.status)} className="capitalize ml-2">{selectedAlert.status}</Badge>

            <p className="text-sm text-muted-foreground">{selectedAlert.description}</p>
            <p className="text-xs text-muted-foreground font-mono">{selectedAlert.location}</p>
            <p className="text-xs text-muted-foreground font-mono">{format(new Date(selectedAlert.createdAt), 'PPPpp')}</p>

            <div className="flex gap-2 pt-4">
              {selectedAlert.status === 'active' && (
                <Button onClick={() => handleAcknowledge(selectedAlert)} variant="outline">Acknowledge</Button>
              )}
              {selectedAlert.status !== 'resolved' && (
                <Button onClick={() => handleResolve(selectedAlert)}>Resolve</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
