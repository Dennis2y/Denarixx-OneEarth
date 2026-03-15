import React, { useState } from 'react';
import { useGetProtectedPersons, useGetSafetyIncidents, useTriggerSOS } from '@workspace/api-client-react';
import { PageHeader, LoadingScreen, Card, Badge, Button, Modal, Input, Label, Select, cn } from '@/components/ui-core';
import { Shield, ShieldAlert, HeartPulse, Search, MapPin, Activity, Phone, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function LifeMesh() {
  const { t } = useTranslation();
  const { data: persons, isLoading: pLoading } = useGetProtectedPersons();
  const { data: incidents, isLoading: iLoading } = useGetSafetyIncidents();
  const { mutate: triggerSOS, isPending: sosPending } = useTriggerSOS();

  const [sosModalOpen, setSosOpen] = useState(false);
  const [sosData, setSosData] = useState({ personId: '', location: '', message: '' });

  if (pLoading || iLoading) return <LoadingScreen />;

  const handleSOS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sosData.personId || !sosData.location) return;
    
    triggerSOS({ data: { personId: Number(sosData.personId), location: sosData.location, message: sosData.message } }, {
      onSuccess: () => {
        setSosOpen(false);
        setSosData({ personId: '', location: '', message: '' });
        alert("CRITICAL SOS DISPATCHED TO GLOBAL RESPONSE NETWORK.");
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'safe': return 'bg-green-500 text-green-500 border-green-500/30';
      case 'emergency': return 'bg-destructive text-destructive border-destructive/30';
      case 'at-risk': return 'bg-amber-500 text-amber-500 border-amber-500/30';
      default: return 'bg-muted-foreground text-muted-foreground border-border';
    }
  };

  const safeCount = persons?.filter(p => p.status === 'safe').length || 0;
  const riskCount = persons?.filter(p => p.status === 'at-risk').length || 0;
  const emergencyCount = persons?.filter(p => p.status === 'emergency').length || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader 
        title={t('lifemesh.title')}
        description={t('lifemesh.description')}
      />

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 flex flex-col items-center justify-center border-b-4 border-b-green-500 bg-green-500/5 text-center">
           <span className="text-3xl font-display font-bold text-white">{safeCount}</span>
           <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{t('lifemesh.secured')}</span>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center border-b-4 border-b-amber-500 bg-amber-500/5 text-center">
           <span className="text-3xl font-display font-bold text-amber-500">{riskCount}</span>
           <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{t('lifemesh.atRisk')}</span>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center border-b-4 border-b-destructive bg-destructive/5 text-center">
           <span className="text-3xl font-display font-bold text-destructive">{emergencyCount}</span>
           <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{t('lifemesh.emergency')}</span>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center border-b-4 border-b-border bg-secondary/30 text-center">
           <span className="text-3xl font-display font-bold text-muted-foreground">{persons?.length}</span>
           <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{t('lifemesh.totalTracked')}</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Persons Grid & Banner */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Emergency Override Banner */}
          <div className="bg-gradient-to-r from-card to-card border border-destructive/30 p-6 rounded-2xl relative overflow-hidden shadow-[0_0_30px_rgba(220,38,38,0.1)] group flex flex-col sm:flex-row items-center justify-between">
            <div className="absolute top-0 left-0 w-1.5 bg-destructive h-full animate-pulse"></div>
            <div className="absolute inset-0 bg-destructive/5 pointer-events-none group-hover:bg-destructive/10 transition-colors" />
            
            <div className="mb-4 sm:mb-0 relative z-10 flex-1 pr-4">
              <h2 className="text-2xl font-display font-bold text-white mb-1 flex items-center">
                <ShieldAlert className="w-6 h-6 mr-2 text-destructive" /> Master Override
              </h2>
              <p className="text-muted-foreground text-sm">
                Bypass standard protocols to forcefully dispatch rapid response drones to a specified beacon.
              </p>
            </div>
            <Button 
              size="lg" 
              variant="destructive" 
              onClick={() => setSosOpen(true)} 
              className="w-full sm:w-auto h-14 px-8 text-lg font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.4)] animate-pulse hover:animate-none z-10"
              style={{ animationDuration: '3s' }}
            >
              Initiate SOS
            </Button>
          </div>

          {/* Persons Grid */}
          <Card className="p-6 bg-transparent border-none shadow-none px-0">
            <div className="flex justify-between items-center mb-6 px-1">
              <h3 className="text-xl font-display font-bold text-white">Active Bio-Signatures</h3>
              <div className="relative w-48 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Query ID..." className="pl-9 h-9 rounded-full bg-secondary/50 border-border/50 text-xs" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {persons?.map(p => (
                <div key={p.id} className="bg-card border border-border/50 rounded-2xl p-4 hover:border-primary/40 transition-colors group relative overflow-hidden">
                  <div className={cn("absolute top-0 left-0 w-full h-1 opacity-50", getStatusColor(p.status))} />
                  
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center text-lg font-bold text-white shadow-inner">
                        {p.name.split(' ').map(n=>n[0]).join('').substring(0,2)}
                      </div>
                      <div className={cn("absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card", getStatusColor(p.status).split(' ')[0])} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-white text-base truncate pr-2">{p.name}</h4>
                        <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 rounded">ID:{p.id}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1 mb-3">
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-primary/30 text-primary">{p.category}</Badge>
                        <span className="text-xs text-muted-foreground">{p.age} yrs</span>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3 mr-1.5 text-white/50" />
                          <span className="truncate">{p.lastKnownLocation}</span>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Phone className="w-3 h-3 mr-1.5 text-white/50" />
                          <span className="truncate">{p.contactPhone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Col: Timeline & Chain */}
        <div className="space-y-6">
          <Card className="p-6 bg-secondary/20">
            <h3 className="text-lg font-display font-bold text-white mb-6 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-primary" /> Incident Telemetry
            </h3>
            
            <div className="relative border-l-2 border-border/50 ml-3 pl-5 space-y-6">
              {incidents?.slice(0, 4).map((incident, i) => (
                <div key={incident.id} className="relative">
                  <div className={cn(
                    "absolute -left-[27px] w-3 h-3 rounded-full border-2 border-background",
                    incident.severity === 'critical' ? 'bg-destructive shadow-[0_0_8px_rgba(220,38,38,0.8)]' : 'bg-amber-500'
                  )} />
                  <div className="bg-background/50 border border-border/50 rounded-xl p-3 hover:border-primary/30 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-mono text-muted-foreground">{new Date(incident.occurredAt).toLocaleTimeString()}</span>
                      <Badge variant={incident.severity === 'critical' ? 'critical' : 'warning'} className="text-[8px] py-0 h-4">{incident.status}</Badge>
                    </div>
                    <h4 className="font-bold text-white text-sm leading-tight mb-1">{incident.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{incident.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 border-primary/20 bg-primary/5">
             <h3 className="text-sm font-display font-bold text-primary uppercase tracking-widest mb-4">Response Protocol Chain</h3>
             <div className="flex flex-col gap-2">
                <div className="bg-card border border-border/50 rounded-lg p-3 text-sm font-medium text-white shadow-sm">1. AI Threat Verification</div>
                <div className="flex justify-center"><ChevronRight className="w-4 h-4 text-primary rotate-90" /></div>
                <div className="bg-card border border-border/50 rounded-lg p-3 text-sm font-medium text-white shadow-sm">2. Drone Recon Dispatch</div>
                <div className="flex justify-center"><ChevronRight className="w-4 h-4 text-primary rotate-90" /></div>
                <div className="bg-card border border-primary/50 rounded-lg p-3 text-sm font-medium text-primary shadow-[0_0_15px_rgba(201,168,76,0.1)]">3. Med-Evac / Ground Team</div>
             </div>
          </Card>
        </div>
      </div>

      <Modal isOpen={sosModalOpen} onClose={() => setSosOpen(false)} title="EMERGENCY DIRECTIVE">
        <form onSubmit={handleSOS} className="space-y-5">
          <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/30 mb-2 flex items-start">
            <ShieldAlert className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
            <p><strong>RESTRICTED ACTION:</strong> You are authorizing an immediate physical response. This will re-route network power and deploy assets. All actions logged to central command.</p>
          </div>
          
          <div className="space-y-3">
            <Label className="text-white font-bold">Target Bio-Signature</Label>
            <Select 
              value={sosData.personId} 
              onChange={e => setSosData({...sosData, personId: e.target.value})}
              options={persons?.map(p => ({ label: `${p.name} — ${p.lastKnownLocation}`, value: p.id.toString() })) || []}
              className="bg-background border-border/80 text-base py-3"
              required
            />
          </div>
          
          <div className="space-y-3">
            <Label className="text-white font-bold">Override Coordinates / Location</Label>
            <Input 
              value={sosData.location} 
              onChange={e => setSosData({...sosData, location: e.target.value})} 
              placeholder="Enter precise extraction point..." 
              className="bg-background border-border/80 text-base py-3 font-mono"
              required 
            />
          </div>
          
          <div className="space-y-3">
            <Label className="text-white font-bold">Tactical Brief (Optional)</Label>
            <textarea 
              className="flex w-full rounded-xl border border-border/80 bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none"
              value={sosData.message}
              onChange={e => setSosData({...sosData, message: e.target.value})}
              placeholder="Hostiles, medical needs, terrain conditions..."
            />
          </div>
          
          <div className="pt-6 flex gap-4">
            <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => setSosOpen(false)}>Abort</Button>
            <Button type="submit" variant="destructive" className="flex-[2] h-12 text-lg tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.5)]" isLoading={sosPending}>AUTHORIZE DISPATCH</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
