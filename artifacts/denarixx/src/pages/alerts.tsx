import React, { useState } from 'react';
import { useGetUnifiedAlerts } from '@workspace/api-client-react';
import { PageHeader, Card, Badge, Button, Skeleton, EmptyState, cn } from '@/components/ui-core';
import { format } from 'date-fns';
import { Bell, Filter, ShieldAlert, Zap, Globe, MapPin, Search, ArrowRight, X, CheckCircle2, AlertTriangle, Info, Clock, CheckCheck, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

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

  const exportReport = async () => {
    setExportLoading(true);
    try {
      const resp = await fetch('/api/reports/alerts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: module || undefined, severity: severity || undefined, status: status || undefined }),
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
    } catch { /* ignore */ } finally {
      setExportLoading(false);
    }
  };
  
  const { data: alerts, isLoading, refetch } = useGetUnifiedAlerts({
    module: module || undefined,
    severity: severity || undefined,
    status: status || undefined,
  } as any);

  const getModuleIcon = (mod: string) => {
    switch(mod) {
      case 'energy': return <Zap className="w-4 h-4 mr-1.5" />;
      case 'lifemesh': return <ShieldAlert className="w-4 h-4 mr-1.5" />;
      case 'earthshield': return <Globe className="w-4 h-4 mr-1.5" />;
      default: return <Bell className="w-4 h-4 mr-1.5" />;
    }
  };

  const getSeverityColor = (sev: string) => {
    switch(sev) {
      case 'critical': return 'hsl(var(--destructive))';
      case 'warning': return 'hsl(43, 65%, 52%)';
      case 'info': return 'hsl(210, 80%, 55%)';
      default: return 'hsl(var(--border))';
    }
  };

  const getStatusVariant = (s: string): 'safe' | 'critical' | 'warning' | 'outline' => {
    if (s === 'resolved') return 'safe';
    if (s === 'active') return 'critical';
    return 'outline';
  };

  const handleAcknowledge = async (alert: UnifiedAlert) => {
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, '');
      await fetch(`${base}/api/alerts/${alert.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'acknowledged' }),
      });
      refetch();
      setSelectedAlert(prev => prev?.id === alert.id ? { ...prev, status: 'acknowledged' } : prev);
    } catch {}
  };

  const handleResolve = async (alert: UnifiedAlert) => {
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, '');
      await fetch(`${base}/api/alerts/${alert.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      });
      refetch();
      setSelectedAlert(prev => prev?.id === alert.id ? { ...prev, status: 'resolved' } : prev);
    } catch {}
  };

  const activeCount = alerts?.filter(a => a.status === 'active').length ?? 0;
  const criticalCount = alerts?.filter(a => a.severity === 'critical').length ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex relative min-h-[calc(100vh-140px)]">
      
      <div className={cn("flex-1 transition-all duration-300", selectedAlert ? "pr-[420px]" : "")}>
        <PageHeader 
          title={t('alerts.title')}
          description={t('alerts.description')}
          actions={
            <div className="flex items-center gap-3">
              {criticalCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 border border-destructive/30 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-destructive animate-ping" />
                  <span className="text-destructive text-xs font-bold uppercase tracking-wider">{criticalCount} {t('alerts.criticalActive')}</span>
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
                <button key={val} onClick={() => setModule(val)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border",
                    module === val ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(201,168,76,0.3)]" : "bg-transparent text-muted-foreground border-border/50 hover:border-primary/40"
                  )}>
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
                <button key={val} onClick={() => setSeverity(val)}
                  data-active={severity === val}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border border-border/50 text-muted-foreground hover:bg-secondary", cls)}>
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
                <button key={val} onClick={() => setStatus(val)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border",
                    status === val ? "bg-secondary/80 text-white border-primary/50" : "bg-transparent text-muted-foreground border-border/50 hover:bg-secondary/40"
                  )}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
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
        ) : !alerts?.length ? (
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
            {alerts?.map((alert) => (
              <motion.div key={alert.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card 
                  className={cn(
                    "p-0 overflow-hidden transition-all duration-200 cursor-pointer border-l-4 group hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]",
                    selectedAlert?.id === alert.id ? "bg-secondary/50 ring-1 ring-primary/30" : "bg-card/70 hover:bg-secondary/30",
                    alert.status === 'resolved' && "opacity-60"
                  )}
                  style={{ borderLeftColor: getSeverityColor(alert.severity) }}
                  onClick={() => setSelectedAlert(alert as UnifiedAlert)}
                >
                  <div className="p-5 flex flex-col md:flex-row gap-4 md:items-center">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <span className={cn(
                          "flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border",
                          alert.module === 'energy' ? 'text-primary border-primary/30 bg-primary/5' : 
                          alert.module === 'lifemesh' ? 'text-green-400 border-green-500/30 bg-green-500/5' : 'text-blue-400 border-blue-500/30 bg-blue-500/5'
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
                    <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 mr-1 text-primary/60" /> {alert.location}
                      </div>
                    </div>
                    <ArrowRight className="hidden md:block w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedAlert && (
          <motion.div 
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-[400px] h-full bg-sidebar border-l border-border/50 shadow-[-20px_0_60px_rgba(0,0,0,0.6)] z-40 flex flex-col"
          >
            <div className="h-16 flex items-center justify-between px-6 border-b border-border/50 bg-background/50 backdrop-blur shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: getSeverityColor(selectedAlert.severity) }} />
                <h3 className="font-display font-bold text-white tracking-widest uppercase text-sm">{t('alerts.intelDossier')}</h3>
              </div>
              <button onClick={() => setSelectedAlert(null)} className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-6 border-b border-border/50" style={{ borderTopColor: getSeverityColor(selectedAlert.severity), borderTopWidth: 3 }}>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant={selectedAlert.severity as any}>{selectedAlert.severity.toUpperCase()}</Badge>
                  <span className={cn(
                    "flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border",
                    selectedAlert.module === 'energy' ? 'text-primary border-primary/30 bg-primary/10' :
                    selectedAlert.module === 'lifemesh' ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-blue-400 border-blue-500/30 bg-blue-500/10'
                  )}>
                    {getModuleIcon(selectedAlert.module)} {selectedAlert.module}
                  </span>
                  <Badge variant={getStatusVariant(selectedAlert.status)} className="capitalize">{selectedAlert.status}</Badge>
                </div>
                <h2 className="text-xl font-bold text-white leading-snug mb-2">{selectedAlert.title}</h2>
                <p className="text-[10px] font-mono text-muted-foreground">
                  ID: #{selectedAlert.id} · {format(new Date(selectedAlert.createdAt), 'yyyy-MM-dd HH:mm:ss')} UTC
                </p>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pb-2 mb-3 border-b border-border/50">{t('alerts.eventDescription')}</h4>
                  <p className="text-sm text-foreground leading-relaxed bg-secondary/30 p-4 rounded-xl border border-border/50">
                    {selectedAlert.description}
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pb-2 mb-3 border-b border-border/50">{t('alerts.locationIntel')}</h4>
                  <div className="flex items-center gap-3 bg-secondary/30 p-4 rounded-xl border border-border/50">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{selectedAlert.location}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{t('alerts.geoResolving')}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pb-2 mb-3 border-b border-border/50">{t('alerts.timestampChain')}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm bg-secondary/20 p-3 rounded-lg">
                      <span className="text-muted-foreground">{t('alerts.eventRecorded')}</span>
                      <span className="font-mono font-medium text-white">{format(new Date(selectedAlert.createdAt), 'HH:mm:ss')}</span>
                    </div>
                    <div className="flex justify-between text-sm bg-secondary/20 p-3 rounded-lg">
                      <span className="text-muted-foreground">{t('alerts.date')}</span>
                      <span className="font-mono font-medium text-white">{format(new Date(selectedAlert.createdAt), 'yyyy-MM-dd')}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pb-2 mb-3 border-b border-border/50">{t('alerts.resolutionState')}</h4>
                  <div className="flex items-center justify-between bg-secondary/30 p-4 rounded-xl border border-border/50">
                    <div className="flex items-center gap-2">
                      {selectedAlert.status === 'resolved' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : selectedAlert.status === 'acknowledged' ? <CheckCheck className="w-4 h-4 text-primary" /> : <AlertTriangle className="w-4 h-4 text-destructive" />}
                      <span className="font-medium text-white capitalize">{selectedAlert.status}</span>
                    </div>
                    <Badge variant={getStatusVariant(selectedAlert.status)} className="capitalize">{selectedAlert.status}</Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-border/50 bg-background/50 space-y-2.5 shrink-0">
              {selectedAlert.status === 'active' && (
                <Button className="w-full h-11 shadow-[0_0_15px_rgba(201,168,76,0.2)]" onClick={() => handleAcknowledge(selectedAlert)}>
                  <CheckCheck className="w-4 h-4 mr-2" /> {t('alerts.acknowledgeReceipt')}
                </Button>
              )}
              {selectedAlert.status !== 'resolved' && (
                <Button variant="outline" className="w-full h-11 border-green-500/30 text-green-400 hover:bg-green-500/10" onClick={() => handleResolve(selectedAlert)}>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> {t('alerts.markResolved')}
                </Button>
              )}
              <Button variant="outline" className="w-full h-11 border-border/50" onClick={() => setSelectedAlert(null)}>
                {t('alerts.closeDossier')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
