import React from 'react';
import { useGetDashboardStats, useGetUnifiedAlerts } from '@workspace/api-client-react';
import { PageHeader, LoadingScreen, Card, Badge, Button } from '@/components/ui-core';
import { MapPin, AlertTriangle, Users, Globe, Zap, ArrowRight, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

function StatCard({ title, value, icon: Icon, trend, colorClass }: any) {
  return (
    <Card className="p-6 border-b-2 hover:-translate-y-1 transition-transform duration-300" style={{ borderBottomColor: colorClass }}>
      <div className="flex justify-between items-start">
        <div className="p-3 rounded-xl bg-secondary/50 border border-border/50">
          <Icon className="w-6 h-6" style={{ color: colorClass }} />
        </div>
        {trend && <Badge variant="safe">{trend}</Badge>}
      </div>
      <div className="mt-6">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        <h3 className="text-4xl font-display font-bold text-white mt-2">{value}</h3>
      </div>
    </Card>
  )
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: alerts, isLoading: alertsLoading } = useGetUnifiedAlerts({ severity: 'critical' });

  if (statsLoading || alertsLoading) return <LoadingScreen />;
  if (!stats) return <div className="text-destructive p-8">Failed to load command center data.</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <PageHeader 
        title="Command Center" 
        description="Global overview of all active Denarixx infrastructure modules."
      />

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        <StatCard title="Active Sites" value={stats.activeSites} icon={MapPin} colorClass="hsl(var(--primary))" trend="+3" />
        <StatCard title="Critical Alerts" value={stats.criticalAlerts} icon={AlertTriangle} colorClass="hsl(var(--destructive))" />
        <StatCard title="Protected Lives" value={stats.protectedPeople.toLocaleString()} icon={Users} colorClass="hsl(212, 80%, 60%)" />
        <StatCard title="Risk Zones" value={stats.disasterRiskZones} icon={Globe} colorClass="hsl(30, 90%, 60%)" />
        <StatCard title="Energy Avail." value={`${stats.energyAvailability}%`} icon={Zap} colorClass="hsl(160, 80%, 45%)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Critical Alerts Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-display font-semibold text-white">Priority Action Feed</h3>
            <Button variant="outline" size="sm">View All <ArrowRight className="ml-2 w-4 h-4"/></Button>
          </div>
          
          <div className="space-y-4">
            {alerts?.slice(0, 5).map((alert, idx) => (
              <Card key={alert.id} className="p-5 border-l-4 border-l-destructive flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-secondary/40 transition-colors">
                <div className="p-3 bg-destructive/10 rounded-full shrink-0">
                  <ShieldAlert className="w-6 h-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold text-lg text-white">{alert.title}</h4>
                    <Badge variant="critical">CRITICAL</Badge>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{alert.module}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {alert.location}</span>
                    <span>{format(new Date(alert.createdAt), 'MMM dd, HH:mm')}</span>
                  </div>
                </div>
                <Button variant="secondary" className="shrink-0 w-full sm:w-auto">Acknowledge</Button>
              </Card>
            ))}
            {(!alerts || alerts.length === 0) && (
              <Card className="p-10 text-center flex flex-col items-center justify-center border-dashed border-2">
                 <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                    <Zap className="w-8 h-8 text-green-500" />
                 </div>
                 <h3 className="text-xl font-display text-white mb-2">No Critical Alerts</h3>
                 <p className="text-muted-foreground">All global systems are operating within nominal parameters.</p>
              </Card>
            )}
          </div>
        </div>

        {/* Right Column - Quick Actions & Map */}
        <div className="space-y-8">
           <Card className="p-6 relative overflow-hidden group border-primary/30">
              <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
              <h3 className="text-xl font-display font-semibold text-white mb-4 relative z-10">Global Network Map</h3>
              <div className="relative w-full h-[200px] rounded-xl overflow-hidden mb-4 border border-border">
                 <img src={`${import.meta.env.BASE_URL}images/map-bg.png`} alt="Map" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                 <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                 <div className="absolute bottom-3 left-3 flex gap-2">
                    <Badge variant="safe" className="shadow-lg">142 Nodes Online</Badge>
                 </div>
              </div>
              <Button className="w-full relative z-10">Open Interactive Map</Button>
           </Card>

           <Card className="p-6 bg-secondary/30">
              <h3 className="text-xl font-display font-semibold text-white mb-4">Quick Operations</h3>
              <div className="space-y-3">
                 <Button variant="outline" className="w-full justify-start text-left border-border/50">
                    <Users className="w-5 h-5 mr-3 text-blue-400" /> Register New Personnel
                 </Button>
                 <Button variant="outline" className="w-full justify-start text-left border-border/50">
                    <MapPin className="w-5 h-5 mr-3 text-primary" /> Deploy Hardware Node
                 </Button>
                 <Button variant="outline" className="w-full justify-start text-left border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive">
                    <AlertTriangle className="w-5 h-5 mr-3 text-destructive" /> Initiate Emergency Drill
                 </Button>
              </div>
           </Card>
        </div>

      </div>
    </motion.div>
  )
}
