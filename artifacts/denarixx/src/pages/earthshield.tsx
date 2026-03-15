import React from 'react';
import { useGetDisasterAlerts, useGetRiskZones } from '@workspace/api-client-react';
import { PageHeader, LoadingScreen, Card, Badge, Button } from '@/components/ui-core';
import { Globe, Wind, Droplets, Flame, Activity, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EarthShield() {
  const { data: alerts, isLoading: aLoading } = useGetDisasterAlerts();
  const { data: risks, isLoading: rLoading } = useGetRiskZones();

  if (aLoading || rLoading) return <LoadingScreen />;

  const getRiskIcon = (type: string) => {
    switch (type) {
      case 'flood': return <Droplets className="w-5 h-5 text-blue-400" />;
      case 'wildfire': return <Flame className="w-5 h-5 text-red-500" />;
      case 'storm': return <Wind className="w-5 h-5 text-gray-300" />;
      default: return <Activity className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader 
        title="Denarixx EarthShield" 
        description="Predictive disaster intelligence and environmental threat assessment."
      />

      {/* Hero Map Section */}
      <div className="relative w-full h-[450px] rounded-3xl overflow-hidden border border-primary/20 shadow-[0_0_50px_rgba(201,168,76,0.15)] group mb-10">
        <div className="absolute inset-0 bg-background/30 z-10 transition-all duration-700 group-hover:bg-background/10" />
        <img 
          src={`${import.meta.env.BASE_URL}images/map-bg.png`} 
          alt="Global Threat Map" 
          className="absolute inset-0 w-full h-full object-cover scale-[1.03] transition-transform duration-[1.5s] ease-out group-hover:scale-100" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-20 pointer-events-none" />
        
        <div className="absolute bottom-8 left-8 right-8 z-30 flex flex-col md:flex-row justify-between items-end md:items-center">
          <div>
            <Badge variant="critical" className="mb-3 animate-pulse">Live Threat Matrix Active</Badge>
            <h3 className="text-3xl md:text-4xl font-display font-bold text-white drop-shadow-lg">Global Threat Assessment</h3>
            <p className="text-primary/90 mt-1 font-medium tracking-wide">Monitoring 14 High-Risk Regions</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-4">
             <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center">
               <div className="text-2xl font-bold text-white">92%</div>
               <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Avg Readiness</div>
             </div>
             <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center">
               <div className="text-2xl font-bold text-destructive">3</div>
               <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Active Alerts</div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Risk Zones */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-display font-semibold text-white flex items-center">
              <Globe className="w-6 h-6 mr-3 text-primary" /> Regional Risk Zones
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {risks?.map((risk) => (
              <Card key={risk.id} className="p-5 border-t-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" 
                style={{ borderTopColor: risk.riskLevel === 'critical' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 rounded-lg bg-secondary/50">
                    {getRiskIcon(risk.type)}
                  </div>
                  <Badge variant={risk.riskLevel === 'critical' ? 'critical' : 'warning'}>{risk.riskLevel}</Badge>
                </div>
                <h4 className="font-display font-bold text-lg text-white">{risk.name}</h4>
                <p className="text-sm text-muted-foreground flex items-center mt-1">
                  <MapPin className="w-3 h-3 mr-1" /> {risk.region}, {risk.country}
                </p>
                <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Preparedness</span>
                  <span className="text-sm font-bold text-primary">{risk.preparednessScore}/100</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Disaster Alerts */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-display font-semibold text-white flex items-center">
              <BellIcon className="w-6 h-6 mr-3 text-destructive" /> Active Disaster Alerts
            </h3>
          </div>
          
          <div className="space-y-4">
            {alerts?.map((alert) => (
              <div key={alert.id} className="relative group rounded-2xl overflow-hidden bg-secondary/30 border border-border/50 hover:border-primary/50 transition-colors p-6">
                <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: alert.severity === 'critical' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }} />
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                  <h4 className="font-bold text-lg text-white">{alert.title}</h4>
                  <Badge variant={alert.severity === 'critical' ? 'critical' : 'warning'} className="mt-2 sm:mt-0">
                    {alert.status}
                  </Badge>
                </div>
                
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{alert.description}</p>
                
                <div className="flex flex-wrap gap-4 text-sm font-medium">
                  <div className="flex items-center text-primary bg-primary/10 px-3 py-1.5 rounded-lg">
                    {getRiskIcon(alert.type)} <span className="ml-2 capitalize">{alert.type}</span>
                  </div>
                  <div className="flex items-center text-white bg-white/5 px-3 py-1.5 rounded-lg">
                    <UsersIcon className="w-4 h-4 mr-2 text-muted-foreground" /> {alert.affectedPopulation.toLocaleString()} At Risk
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Helper icons
function BellIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
}
function UsersIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
