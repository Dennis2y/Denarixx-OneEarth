import React, { useState } from 'react';
import { useGetProtectedPersons, useGetSafetyIncidents, useTriggerSOS } from '@workspace/api-client-react';
import { ModuleHeader, LoadingScreen, Card, Badge, Button, Modal, Input, Label, Select, cn } from '@/components/ui-core';
import { Shield, ShieldAlert, Search, MapPin, Activity, Phone, ChevronRight, Lock, Radio, Clock, AlertTriangle, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { useAuth } from '@/context/auth';

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    safe: 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]',
    'at-risk': 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]',
    emergency: 'bg-destructive shadow-[0_0_6px_rgba(220,38,38,0.8)] animate-pulse',
  };
  return <div className={cn('w-2 h-2 rounded-full shrink-0', colors[status] ?? 'bg-muted-foreground')} />;
}

export default function LifeMesh() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: persons, isLoading: pLoading } = useGetProtectedPersons();
  const { data: incidents, isLoading: iLoading } = useGetSafetyIncidents();
  const { mutate: triggerSOS, isPending: sosPending } = useTriggerSOS();

  const [sosModalOpen, setSosOpen] = useState(false);
  const [sosData, setSosData] = useState({ personId: '', location: '', message: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  if (pLoading || iLoading) return <LoadingScreen />;

  const handleSOS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sosData.personId || !sosData.location) return;
    triggerSOS({ data: { personId: Number(sosData.personId), location: sosData.location, message: sosData.message } }, {
      onSuccess: () => {
        setSosOpen(false);
        setSosData({ personId: '', location: '', message: '' });
        alert('CRITICAL SOS DISPATCHED — GLOBAL RESPONSE NETWORK ACTIVATED. ALL ACTIONS LOGGED TO CENTRAL COMMAND.');
      }
    });
  };

  const getStatusMeta = (status: string) => ({
    safe: { label: 'NOMINAL', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    'at-risk': { label: 'THREAT EXPOSURE', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    emergency: { label: 'CRITICAL STATE', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
  }[status] ?? { label: status.toUpperCase(), color: 'text-muted-foreground', bg: 'bg-secondary/30', border: 'border-border/40' });

  const personsList = Array.isArray(persons) ? persons : [];
  const incidentsList = Array.isArray(incidents) ? incidents : [];

  const safeCount = personsList.filter(p => p.status === 'safe').length;
  const riskCount = personsList.filter(p => p.status === 'at-risk').length;
  const emergencyCount = personsList.filter(p => p.status === 'emergency').length;

  const filteredPersons = personsList.filter(p => {
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.lastKnownLocation?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesFilter;
  }) ?? [];

  const entityId = (id: number) => `DNX-BIO-${String(id).padStart(4, '0')}`;
  const lastUplink = (id: number) => {
    const minsAgo = (id * 7) % 47;
    return minsAgo < 2 ? 'JUST NOW' : `${minsAgo}M AGO`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <ModuleHeader
        title={t('lifemesh.title')}
        subtitle="Global bio-signature tracking and emergency response command. All data classified. Authorized personnel only."
        classification="RESTRICTED // EYES ONLY"
        moduleId="DNX-LM-001"
      />

      {/* Operational Status Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { value: safeCount, label: 'NOMINAL STATUS', color: 'text-green-400', bar: 'bg-green-500', border: 'border-b-green-500', bg: 'bg-green-500/5', icon: UserCheck },
          { value: riskCount, label: 'THREAT EXPOSURE', color: 'text-amber-500', bar: 'bg-amber-500', border: 'border-b-amber-500', bg: 'bg-amber-500/5', icon: AlertTriangle },
          { value: emergencyCount, label: 'CRITICAL STATE', color: 'text-destructive', bar: 'bg-destructive', border: 'border-b-destructive', bg: 'bg-destructive/5', icon: ShieldAlert },
          { value: persons?.length ?? 0, label: 'TOTAL ENTITIES', color: 'text-muted-foreground', bar: 'bg-muted-foreground', border: 'border-b-border', bg: 'bg-secondary/20', icon: Shield },
        ].map(({ value, label, color, bar, border, bg, icon: Icon }) => (
          <Card key={label} className={cn('p-4 border-b-4 text-center relative overflow-hidden', border, bg)}>
            <div className="absolute top-2 right-2 opacity-10">
              <Icon className="w-8 h-8" />
            </div>
            <div className={cn('text-3xl font-display font-bold font-mono', color)}>{value}</div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1 font-bold">{label}</div>
            <div className={cn('mt-3 h-0.5 rounded-full opacity-40', bar)} style={{ width: `${persons?.length ? (value / (persons?.length)) * 100 : 0}%` }} />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Emergency Override Console */}
          <div className="relative overflow-hidden rounded-2xl border border-destructive/40 bg-card shadow-[0_0_40px_rgba(220,38,38,0.08)] group">
            <div className="absolute top-0 left-0 w-1.5 bg-destructive h-full" />
            <div className="absolute inset-0 bg-gradient-to-r from-destructive/5 to-transparent pointer-events-none" />
            <div className="p-5 sm:p-6 ml-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-destructive shrink-0" />
                    <span className="text-xs font-bold text-destructive uppercase tracking-widest">EMERGENCY OVERRIDE CONSOLE</span>
                    <span className="classified-badge hidden sm:inline">RESTRICTED</span>
                  </div>
                  <p className="text-white font-bold text-lg font-display">MASTER OVERRIDE — AUTHORIZE RAPID RESPONSE</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Bypasses standard protocols. Forcefully dispatches rapid response assets to specified beacon coordinates.
                    All actions immutably logged to central command audit chain.
                  </p>
                </div>
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={() => setSosOpen(true)}
                  className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(220,38,38,0.4)] shrink-0 z-10"
                >
                  <Radio className="w-5 h-5 mr-2" /> INITIATE SOS
                </Button>
              </div>
            </div>
          </div>

          {/* Bio-Signature Registry */}
          <Card className="p-0 overflow-hidden border-border/50">
            <div className="px-5 py-3 border-b border-border/50 bg-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Lock className="w-3.5 h-3.5 text-primary/60" />
                  <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest">BIO-SIGNATURE REGISTRY — ACTIVE TRACKING</span>
                </div>
                <p className="text-sm font-bold text-white">{filteredPersons.length} entities in current scope</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {['all', 'safe', 'at-risk', 'emergency'].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={cn(
                      'px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest transition-all',
                      filterStatus === s
                        ? 'bg-primary/20 text-primary border-primary/40'
                        : 'border-border/40 text-muted-foreground hover:border-border hover:text-white'
                    )}
                  >
                    {s === 'all' ? 'ALL' : s === 'at-risk' ? 'THREAT' : s.toUpperCase()}
                  </button>
                ))}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Query ID or sector..."
                    className="bg-secondary/50 border border-border/50 rounded-lg pl-8 pr-3 py-1.5 text-[10px] font-mono text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/50 w-40 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredPersons.map(p => {
                const meta = getStatusMeta(p.status);
                return (
                  <div key={p.id} className={cn(
                    'bg-secondary/20 border rounded-xl p-4 hover:bg-secondary/40 transition-colors group relative',
                    meta.border
                  )}>
                    <div className="absolute top-0 left-0 right-0 h-px rounded-t-xl opacity-50"
                      style={{ background: p.status === 'emergency' ? 'hsl(var(--destructive))' : p.status === 'at-risk' ? 'hsl(var(--chart-4))' : 'hsl(var(--chart-2))' }} />

                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <StatusDot status={p.status} />
                        <div className="min-w-0">
                          <p className="font-bold text-white text-sm leading-tight truncate">{p.name}</p>
                          <p className="text-[9px] font-mono text-muted-foreground/70">{entityId(p.id)}</p>
                        </div>
                      </div>
                      <div className={cn('px-2 py-0.5 rounded border text-[8px] font-bold uppercase tracking-widest shrink-0', meta.bg, meta.border, meta.color)}>
                        {meta.label}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Badge variant="outline" className="text-[9px] py-0 px-1.5 h-4 border-primary/20 text-primary capitalize">{p.category}</Badge>
                        <span className="text-muted-foreground/60">AGE {p.age}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="w-3 h-3 mr-1.5 text-white/30 shrink-0" />
                        <span className="truncate text-[10px] font-mono">{p.lastKnownLocation}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Phone className="w-3 h-3 mr-1.5 text-white/30 shrink-0" />
                        <span className="text-[10px] font-mono">{p.contactPhone}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-border/30 flex items-center justify-between">
                      <span className="text-[8px] font-mono text-muted-foreground/50 uppercase">LAST UPLINK: {lastUplink(p.id)}</span>
                      <span className="text-[8px] font-mono text-muted-foreground/50">{p.contactName}</span>
                    </div>
                  </div>
                );
              })}
              {filteredPersons.length === 0 && (
                <div className="col-span-2 py-12 text-center text-muted-foreground">
                  <Shield className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-mono">NO ENTITIES MATCH CURRENT FILTER PARAMETERS</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-5">

          {/* Incident Telemetry */}
          <Card className="p-5 bg-secondary/20">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-border/40">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-white uppercase tracking-widest font-display">Incident Telemetry</span>
              <div className="ml-auto w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            </div>

            <div className="relative border-l-2 border-border/30 ml-2 pl-5 space-y-5">
              {incidentsList.slice(0, 5).map((incident) => (
                <div key={incident.id} className="relative">
                  <div className={cn(
                    'absolute -left-[27px] w-3 h-3 rounded-full border-2 border-background',
                    incident.severity === 'critical' ? 'bg-destructive shadow-[0_0_8px_rgba(220,38,38,0.8)]' :
                    incident.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-400'
                  )} />
                  <div className="bg-background/40 border border-border/40 rounded-xl p-3 hover:border-primary/30 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[9px] font-mono text-muted-foreground/60">
                        {format(new Date(incident.occurredAt), 'HH:mm:ss')} UTC
                      </span>
                      <Badge variant={incident.severity === 'critical' ? 'critical' : 'warning'} className="text-[8px] py-0 h-4">
                        {incident.status}
                      </Badge>
                    </div>
                    <p className="font-bold text-white text-sm leading-tight mb-1">{incident.title}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 font-mono">{incident.description}</p>
                  </div>
                </div>
              ))}
              {(!incidents || incidents.length === 0) && (
                <p className="text-xs text-muted-foreground font-mono py-4 text-center">NO ACTIVE INCIDENTS RECORDED</p>
              )}
            </div>
          </Card>

          {/* Response Protocol Chain */}
          <Card className="p-5 border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-primary/20">
              <Lock className="w-3.5 h-3.5 text-primary/60" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Response Protocol Chain</span>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { step: '01', label: 'AI Threat Verification', active: false },
                { step: '02', label: 'Drone Recon Dispatch', active: false },
                { step: '03', label: 'Med-Evac / Ground Team', active: true },
              ].map(({ step, label, active }, i) => (
                <React.Fragment key={step}>
                  <div className={cn(
                    'rounded-xl border p-3 flex items-center gap-3 transition-all',
                    active
                      ? 'bg-primary/10 border-primary/40 shadow-[0_0_12px_rgba(201,168,76,0.1)]'
                      : 'bg-card/50 border-border/40'
                  )}>
                    <span className={cn('text-[9px] font-mono font-bold shrink-0', active ? 'text-primary' : 'text-muted-foreground/50')}>
                      STEP {step}
                    </span>
                    <span className={cn('text-sm font-medium', active ? 'text-primary' : 'text-muted-foreground')}>
                      {label}
                    </span>
                    {active && <div className="ml-auto w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />}
                  </div>
                  {i < 2 && <ChevronRight className="w-3.5 h-3.5 text-primary/40 mx-auto rotate-90" />}
                </React.Fragment>
              ))}
            </div>
          </Card>

          {/* System Stats */}
          <Card className="p-5 bg-secondary/20 border-border/40">
            <div className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              MODULE SYSTEM STATUS
            </div>
            <div className="space-y-2">
              {[
                { label: 'BIO-SIGNATURE DB', value: 'ONLINE', color: 'text-green-400' },
                { label: 'RESPONSE NETWORK', value: 'ACTIVE', color: 'text-green-400' },
                { label: 'DRONE FLEET', value: 'STANDBY', color: 'text-amber-500' },
                { label: 'COMMS RELAY', value: 'NOMINAL', color: 'text-green-400' },
                { label: 'DATA FRESHNESS', value: '< 30 MIN', color: 'text-primary' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase">{label}</span>
                  <span className={cn('text-[9px] font-mono font-bold', color)}>{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Emergency SOS Modal */}
      <Modal isOpen={sosModalOpen} onClose={() => setSosOpen(false)} title="EMERGENCY DIRECTIVE — AUTHORIZE DISPATCH">
        <form onSubmit={handleSOS} className="space-y-5">
          <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/30 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1 uppercase tracking-widest text-xs">RESTRICTED ACTION — CLEARANCE L{user?.clearanceLevel ?? 3} REQUIRED</p>
              <p className="text-destructive/80 text-xs">Authorizing immediate physical response. Re-routes network power and deploys rapid response assets. All actions immutably logged to central command audit chain.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white font-bold text-xs uppercase tracking-widest">Target Bio-Signature Entity</Label>
            <Select
              value={sosData.personId}
              onChange={e => setSosData({ ...sosData, personId: e.target.value })}
              options={personsList.map(p => ({ label: `${entityId(p.id)} — ${p.name} · ${p.lastKnownLocation}`, value: p.id.toString() }))}
              className="bg-background border-border/80 font-mono text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white font-bold text-xs uppercase tracking-widest">Override Coordinates / Extraction Point</Label>
            <Input
              value={sosData.location}
              onChange={e => setSosData({ ...sosData, location: e.target.value })}
              placeholder="Enter precise extraction coordinates..."
              className="bg-background border-border/80 font-mono"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white font-bold text-xs uppercase tracking-widest">Tactical Brief (Optional)</Label>
            <textarea
              className="flex w-full rounded-xl border border-border/80 bg-background px-4 py-3 text-sm text-foreground font-mono focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[90px] resize-none"
              value={sosData.message}
              onChange={e => setSosData({ ...sosData, message: e.target.value })}
              placeholder="Hostiles, medical needs, terrain conditions, access codes..."
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" className="flex-1 h-12 uppercase tracking-widest text-xs" onClick={() => setSosOpen(false)}>ABORT</Button>
            <Button type="submit" variant="destructive" className="flex-[2] h-12 font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.5)]" isLoading={sosPending}>
              AUTHORIZE DISPATCH
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
