import React, { useState } from 'react';
import { useGetUnifiedAlerts } from '@workspace/api-client-react';
import { PageHeader, Card, Badge, Select, Table, Th, Td, Skeleton, EmptyState, Button, cn } from '@/components/ui-core';
import { format } from 'date-fns';
import { Bell, Filter, ShieldAlert, Zap, Globe, MapPin, Search, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Alerts() {
  const [module, setModule] = useState<string>('');
  const [severity, setSeverity] = useState<string>('');
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  
  const { data: alerts, isLoading } = useGetUnifiedAlerts({
    module: module || undefined,
    severity: severity || undefined
  } as any);

  const getModuleIcon = (mod: string) => {
    switch(mod) {
      case 'energy': return <Zap className="w-4 h-4 mr-2" />;
      case 'lifemesh': return <ShieldAlert className="w-4 h-4 mr-2" />;
      case 'earthshield': return <Globe className="w-4 h-4 mr-2" />;
      default: return <Bell className="w-4 h-4 mr-2" />;
    }
  };

  const getSeverityColor = (sev: string) => {
    switch(sev) {
      case 'critical': return 'hsl(var(--destructive))';
      case 'warning': return 'hsl(var(--chart-4))';
      case 'info': return 'hsl(var(--chart-3))';
      default: return 'hsl(var(--border))';
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex relative min-h-[calc(100vh-140px)]">
      
      {/* Main Content Area */}
      <div className={cn("flex-1 transition-all duration-300", selectedAlert ? "pr-[420px]" : "")}>
        <PageHeader 
          title="Unified Action Log" 
          description="Global, cross-module event registry and system alerts."
        />

        <Card className="p-4 mb-6 border-primary/20 bg-secondary/30 backdrop-blur-md">
          <div className="flex flex-col lg:flex-row gap-4 justify-between lg:items-center">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mr-2 shrink-0">
                <Filter className="w-3 h-3 inline mr-1"/> Module
              </span>
              {['', 'energy', 'lifemesh', 'earthshield'].map(m => (
                <button 
                  key={m} 
                  onClick={() => setModule(m)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors border",
                    module === m ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                  )}
                >
                  {m === '' ? 'All Modules' : m}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
               <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mr-2 shrink-0">Severity</span>
               {['', 'critical', 'warning', 'info'].map(s => (
                <button 
                  key={s} 
                  onClick={() => setSeverity(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border",
                    severity === s 
                      ? s === 'critical' ? "bg-destructive/20 text-destructive border-destructive/50" : 
                        s === 'warning' ? "bg-amber-500/20 text-amber-500 border-amber-500/50" : 
                        "bg-blue-500/20 text-blue-400 border-blue-500/50"
                      : "bg-transparent text-muted-foreground border-border hover:bg-secondary"
                  )}
                >
                  {s === '' ? 'Any' : s}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => (
              <Card key={i} className="p-6 border-border/50">
                <div className="flex gap-4">
                  <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex gap-4 pt-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : alerts?.length === 0 ? (
          <Card className="border-dashed border-2 border-border/50 bg-transparent">
             <EmptyState 
               icon={Search} 
               title="No anomalies detected" 
               description="The system has found no records matching your precise filter configuration."
               action={<Button variant="outline" onClick={() => {setModule(''); setSeverity('');}}>Reset Global Filters</Button>}
             />
          </Card>
        ) : (
          <div className="space-y-3 pb-10">
            {alerts?.map((alert) => (
              <Card 
                key={alert.id} 
                className={cn(
                  "p-0 overflow-hidden transition-all duration-200 cursor-pointer border-l-4 group hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]",
                  selectedAlert?.id === alert.id ? "bg-secondary/60 scale-[1.01] shadow-lg z-10 relative" : "bg-card/80 hover:bg-secondary/40"
                )}
                style={{ borderLeftColor: getSeverityColor(alert.severity) }}
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="p-5 flex flex-col md:flex-row gap-4 md:items-center">
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className={cn(
                        "text-[10px] py-0.5 border-none", 
                        alert.module === 'energy' ? 'bg-primary/10 text-primary' : 
                        alert.module === 'lifemesh' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-slate-300'
                      )}>
                        {getModuleIcon(alert.module)} <span className="uppercase">{alert.module}</span>
                      </Badge>
                      <Badge variant={alert.severity as any} className="text-[10px] py-0.5">{alert.severity}</Badge>
                      <span className="text-xs text-muted-foreground font-mono ml-auto md:ml-0">{format(new Date(alert.createdAt), 'HH:mm:ss')}</span>
                    </div>
                    
                    <h4 className="font-bold text-white text-lg truncate group-hover:text-primary transition-colors">{alert.title}</h4>
                    <p className="text-sm text-muted-foreground truncate mt-1">{alert.description}</p>
                  </div>
                  
                  <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0 md:w-48">
                    <div className="flex items-center text-xs text-muted-foreground font-medium">
                      <MapPin className="w-3 h-3 mr-1"/> {alert.location}
                    </div>
                    <Badge variant={alert.status === 'resolved' ? 'safe' : 'outline'} className={alert.status !== 'resolved' ? "border-border text-muted-foreground" : ""}>
                      {alert.status}
                    </Badge>
                  </div>
                  
                  <div className="hidden md:flex shrink-0 w-10 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Slide-in Details Drawer */}
      <AnimatePresence>
        {selectedAlert && (
          <motion.div 
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-[400px] h-full bg-sidebar border-l border-border/50 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-40 flex flex-col"
          >
            <div className="h-20 flex items-center justify-between px-6 border-b border-border/50 bg-background/50">
              <h3 className="font-display font-bold text-white tracking-widest uppercase">Intel Dossier</h3>
              <button onClick={() => setSelectedAlert(null)} className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
              <div>
                <div className="flex gap-2 mb-4">
                  <Badge variant={selectedAlert.severity as any}>{selectedAlert.severity}</Badge>
                  <Badge variant="outline" className="border-primary/30 text-primary uppercase">{selectedAlert.module}</Badge>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{selectedAlert.title}</h2>
                <p className="text-sm font-mono text-muted-foreground">{selectedAlert.id} • {format(new Date(selectedAlert.createdAt), 'yyyy-MM-dd HH:mm:ss')} UTC</p>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2">Description</h4>
                <p className="text-sm text-foreground leading-relaxed bg-secondary/30 p-4 rounded-xl border border-border/50">
                  {selectedAlert.description}
                </p>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2">Location Data</h4>
                <div className="flex items-center gap-3 bg-secondary/30 p-4 rounded-xl border border-border/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-white">{selectedAlert.location}</p>
                    <p className="text-xs text-muted-foreground font-mono">LAT/LNG UNKNOWN</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2">Resolution Status</h4>
                <div className="flex items-center justify-between bg-secondary/30 p-4 rounded-xl border border-border/50">
                  <span className="font-medium text-white capitalize">{selectedAlert.status}</span>
                  <Badge variant={selectedAlert.status === 'resolved' ? 'safe' : 'warning'}>Current State</Badge>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-border/50 bg-background/50 space-y-3">
              <Button className="w-full h-12 shadow-[0_0_15px_rgba(201,168,76,0.2)]">Acknowledge Receipt</Button>
              <Button variant="outline" className="w-full h-12 border-border/50">Escalate Priority</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
