import React from 'react';
import { useGetDisasterAlerts, useGetRiskZones } from '@workspace/api-client-react';
import { PageHeader, LoadingScreen, Card, Badge, cn } from '@/components/ui-core';
import { Globe, Wind, Droplets, Flame, Activity, MapPin, Zap, AlertTriangle, CloudLightning } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function EarthShield() {
  const { data: alerts, isLoading: aLoading } = useGetDisasterAlerts();
  const { data: risks, isLoading: rLoading } = useGetRiskZones();

  if (aLoading || rLoading) return <LoadingScreen />;

  const getRiskIcon = (type: string, className = "w-5 h-5") => {
    switch (type) {
      case 'flood': return <Droplets className={cn("text-blue-400", className)} />;
      case 'wildfire': return <Flame className={cn("text-red-500", className)} />;
      case 'storm': return <Wind className={cn("text-slate-300", className)} />;
      case 'infrastructure': return <Zap className={cn("text-primary", className)} />;
      default: return <Activity className={cn("text-primary", className)} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    return severity === 'critical' ? 'hsl(var(--destructive))' : 
           severity === 'warning' ? 'hsl(var(--chart-4))' : 'hsl(var(--chart-3))';
  };

  // Aggregate stats for top cards
  const floodRisk = alerts?.filter(a => a.type === 'flood').length || 0;
  const fireRisk = alerts?.filter(a => a.type === 'wildfire').length || 0;
  const stormRisk = alerts?.filter(a => a.type === 'storm').length || 0;
  const infraRisk = alerts?.filter(a => a.type === 'infrastructure').length || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader 
        title="EarthShield Intelligence" 
        description="Predictive planetary modeling and autonomous disaster mitigation."
      />

      {/* Hero Risk Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Flood Vectors', count: floodRisk, icon: Droplets, color: 'bg-blue-500', max: 10 },
          { label: 'Thermal Anomalies', count: fireRisk, icon: Flame, color: 'bg-red-500', max: 5 },
          { label: 'Atmospheric Events', count: stormRisk, icon: CloudLightning, color: 'bg-slate-400', max: 8 },
          { label: 'Grid Stress', count: infraRisk, icon: Zap, color: 'bg-primary', max: 12 },
        ].map((stat, i) => (
          <Card key={i} className="p-5 bg-card/60 backdrop-blur-md border-border/50 hover:bg-secondary/40 transition-colors">
             <div className="flex justify-between items-start mb-4">
               <div className="p-2 rounded-lg bg-secondary shadow-inner">
                 <stat.icon className="w-5 h-5 text-white/80" />
               </div>
               <span className="text-3xl font-display font-bold text-white">{stat.count}</span>
             </div>
             <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">{stat.label}</p>
             <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
                <div className={cn("h-full rounded-full", stat.color)} style={{ width: `${(stat.count / stat.max) * 100}%` }} />
             </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Main Content - Regional Alerts Grid */}
        <div className="xl:col-span-2 space-y-6">
          <h3 className="text-xl font-display font-bold text-white flex items-center mb-2">
            <Globe className="w-5 h-5 mr-2 text-primary" /> Active Regional Threat Matrices
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {alerts?.map((alert) => (
              <Card key={alert.id} className="p-0 overflow-hidden group border-border/60 hover:border-primary/50 transition-all duration-300 flex flex-col">
                <div className="h-1.5 w-full" style={{ backgroundColor: getSeverityColor(alert.severity) }} />
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 bg-secondary px-2 py-1 rounded text-xs font-bold text-white uppercase tracking-wider">
                      {getRiskIcon(alert.type, "w-3.5 h-3.5")} {alert.type}
                    </div>
                    <Badge variant={alert.severity === 'critical' ? 'critical' : 'warning'} className="bg-transparent text-[10px]">
                      {alert.status}
                    </Badge>
                  </div>
                  
                  <h4 className="font-bold text-lg text-white mb-1 group-hover:text-primary transition-colors">{alert.title}</h4>
                  <p className="text-xs text-muted-foreground mb-4 flex items-center font-mono">
                    <MapPin className="w-3 h-3 mr-1" /> {alert.region}, {alert.country}
                  </p>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-3 mb-4">
                    {alert.description}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-border/50 flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-mono">{format(new Date(alert.issuedAt), 'HH:mm:ss')} UTC</span>
                    <span className="font-bold text-white bg-white/5 px-2 py-1 rounded">
                      <span className="text-muted-foreground font-normal mr-1">Impact:</span> 
                      {alert.affectedPopulation.toLocaleString()} Pop
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar - Preparedness & Timeline */}
        <div className="space-y-8">
          
          {/* Preparedness Scores */}
          <Card className="p-6 bg-secondary/20">
            <h3 className="text-sm font-display font-bold text-white uppercase tracking-widest border-b border-border/50 pb-4 mb-4">
              Regional Readiness Index
            </h3>
            <div className="space-y-5">
              {risks?.map((risk) => (
                <div key={risk.id}>
                  <div className="flex justify-between items-center mb-1.5 text-sm">
                    <span className="font-medium text-white">{risk.name}</span>
                    <span className={cn("font-mono font-bold", risk.preparednessScore < 50 ? "text-destructive" : risk.preparednessScore < 80 ? "text-amber-500" : "text-primary")}>
                      {risk.preparednessScore}/100
                    </span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2 overflow-hidden border border-border/30 shadow-inner">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-1000 relative", 
                        risk.preparednessScore < 50 ? "bg-destructive" : risk.preparednessScore < 80 ? "bg-amber-500" : "bg-primary"
                      )}
                      style={{ width: `${risk.preparednessScore}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Climate Event Feed */}
          <Card className="p-6">
            <h3 className="text-sm font-display font-bold text-white uppercase tracking-widest border-b border-border/50 pb-4 mb-5 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-primary" /> Incident Log
            </h3>
            
            <div className="relative border-l border-border ml-2 pl-4 space-y-5">
              {alerts?.slice(0,4).map((alert, i) => (
                <div key={`log-${alert.id}`} className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-card" style={{ backgroundColor: getSeverityColor(alert.severity) }} />
                  <p className="text-[10px] font-mono text-muted-foreground mb-0.5">{format(new Date(alert.issuedAt), 'MMM dd, HH:mm')}</p>
                  <p className="text-sm font-bold text-white leading-tight">{alert.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{alert.region}</p>
                </div>
              ))}
            </div>
          </Card>

        </div>
      </div>
    </motion.div>
  );
}
