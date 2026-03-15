import React, { useState, useEffect } from 'react';
import { useGetDashboardStats, useGetUnifiedAlerts } from '@workspace/api-client-react';
import { PageHeader, LoadingScreen, Card, Badge, Button, cn } from '@/components/ui-core';
import { MapPin, AlertTriangle, Users, Globe, Zap, ArrowRight, ShieldAlert, FileText, Radio, Check } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

const mockSparklines = [
  [40, 42, 45, 43, 48, 52, 50, 55],
  [55, 52, 48, 50, 45, 42, 44, 40],
  [30, 35, 32, 40, 38, 45, 42, 50],
  [80, 78, 85, 82, 88, 85, 90, 92],
  [20, 22, 25, 24, 28, 26, 30, 32]
];

function StatCard({ title, value, icon: Icon, trend, colorClass, sparklineData }: any) {
  const chartData = sparklineData.map((v: number, i: number) => ({ val: v, i }));
  
  return (
    <Card className="p-5 border-t-4 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 relative overflow-hidden group" style={{ borderTopColor: colorClass }}>
      <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
        <Icon className="w-32 h-32" />
      </div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/50 shadow-inner">
          <Icon className="w-5 h-5" style={{ color: colorClass }} />
        </div>
        {trend && <Badge variant="safe" className="bg-green-500/20 text-green-400 border-green-500/30">{trend}</Badge>}
      </div>
      
      <div className="relative z-10">
        <h3 className="text-3xl font-display font-bold text-white tracking-tight">{value}</h3>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">{title}</p>
      </div>

      <div className="h-12 w-full mt-4 -mx-2 mb-[-10px] relative z-10 opacity-70 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line type="monotone" dataKey="val" stroke={colorClass} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

const AFRICAN_SITES = [
  { id: 1, name: 'Nairobi Hub', cx: '68%', cy: '58%', status: 'online' },
  { id: 2, name: 'Accra Node', cx: '35%', cy: '45%', status: 'online' },
  { id: 3, name: 'Dakar Station', cx: '18%', cy: '35%', status: 'critical' },
  { id: 4, name: 'Lagos Grid', cx: '42%', cy: '48%', status: 'online' },
  { id: 5, name: 'Kampala Base', cx: '65%', cy: '55%', status: 'online' },
  { id: 6, name: 'Addis Control', cx: '75%', cy: '45%', status: 'online' },
  { id: 7, name: 'Kigali Center', cx: '63%', cy: '60%', status: 'critical' },
  { id: 8, name: 'Abuja Node', cx: '40%', cy: '46%', status: 'online' },
];

const MOCK_LIVE_ALERTS = [
  { id: 'live-1', title: 'Grid Fluctuation Detected', module: 'energy', severity: 'warning', description: 'Minor voltage drop across secondary lines in Sector 4.', location: 'Lagos Grid' },
  { id: 'live-2', title: 'Unauthorized Access Attempt', module: 'lifemesh', severity: 'critical', description: 'Multiple failed biometric scans at perimeter delta.', location: 'Nairobi Hub' },
  { id: 'live-3', title: 'Severe Weather Warning', module: 'earthshield', severity: 'warning', description: 'Approaching storm front. Predicted impact in 45 minutes.', location: 'Dakar Station' },
];

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: initialAlerts, isLoading: alertsLoading } = useGetUnifiedAlerts({ severity: 'critical' });
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (initialAlerts) {
      setLiveAlerts(initialAlerts.slice(0, 4));
    }
  }, [initialAlerts]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newAlert = MOCK_LIVE_ALERTS[Math.floor(Math.random() * MOCK_LIVE_ALERTS.length)];
      setLiveAlerts(prev => {
        const updated = [{ ...newAlert, id: `live-${Date.now()}`, createdAt: new Date().toISOString() }, ...prev];
        return updated.slice(0, 5);
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  if (statsLoading || alertsLoading) return <LoadingScreen />;
  if (!stats) return <div className="text-destructive p-8">Failed to load command center data.</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <PageHeader 
        title={t('dashboard.title')}
        description={t('dashboard.description')}
      />

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard title={t('dashboard.activeSites')} value={stats.activeSites} icon={MapPin} colorClass="hsl(var(--primary))" trend="+3 New" sparklineData={mockSparklines[0]} />
        <StatCard title={t('dashboard.criticalAlerts')} value={stats.criticalAlerts} icon={AlertTriangle} colorClass="hsl(var(--destructive))" sparklineData={mockSparklines[1]} />
        <StatCard title={t('dashboard.protectedLives')} value={stats.protectedPeople.toLocaleString()} icon={Users} colorClass="hsl(var(--chart-3))" sparklineData={mockSparklines[2]} />
        <StatCard title={t('dashboard.riskZones')} value={stats.disasterRiskZones} icon={Globe} colorClass="hsl(var(--chart-4))" sparklineData={mockSparklines[3]} />
        <StatCard title={t('dashboard.energyAvail')} value={`${stats.energyAvailability}%`} icon={Zap} colorClass="hsl(var(--chart-2))" sparklineData={mockSparklines[4]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Operations Map */}
        <Card className="lg:col-span-2 p-0 relative overflow-hidden border-border/50 group">
          <div className="absolute top-6 left-6 z-20 pointer-events-none">
            <h3 className="text-xl font-display font-bold text-white drop-shadow-md">{t('dashboard.africaOps')}</h3>
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mt-1">{t('dashboard.liveNodeStatus')}</p>
          </div>
          
          <div className="w-full h-[400px] bg-secondary/20 relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent pointer-events-none" />
            
            <svg viewBox="0 0 100 100" className="w-[80%] h-full opacity-30 text-primary group-hover:opacity-40 transition-opacity duration-1000">
              <path fill="currentColor" d="M10,30 Q30,20 40,10 T70,20 Q80,40 90,50 T70,90 Q40,100 30,80 T10,30 Z" />
            </svg>

            {AFRICAN_SITES.map(site => (
              <div 
                key={site.id} 
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group/node cursor-pointer"
                style={{ left: site.cx, top: site.cy }}
              >
                <div className={cn(
                  "w-3 h-3 rounded-full border-2 border-background shadow-lg",
                  site.status === 'online' ? "bg-primary animate-pulse shadow-[0_0_10px_rgba(201,168,76,0.8)]" : "bg-destructive animate-ping shadow-[0_0_15px_rgba(220,38,38,1)]"
                )} />
                <div className="absolute top-4 opacity-0 group-hover/node:opacity-100 transition-opacity bg-black/80 backdrop-blur text-xs px-2 py-1 rounded border border-border whitespace-nowrap z-30">
                  <span className="font-bold text-white">{site.name}</span>
                  <span className={cn("ml-2 uppercase text-[10px]", site.status === 'online' ? 'text-primary' : 'text-destructive')}>{site.status === 'online' ? t('dashboard.online') : t('dashboard.critical')}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end z-20 pointer-events-none">
            <div className="flex gap-4">
               <div className="flex items-center gap-2 text-xs font-medium text-white bg-background/60 px-3 py-1.5 rounded-full backdrop-blur">
                 <div className="w-2 h-2 rounded-full bg-primary" /> {t('dashboard.online')} (6)
               </div>
               <div className="flex items-center gap-2 text-xs font-medium text-white bg-background/60 px-3 py-1.5 rounded-full backdrop-blur">
                 <div className="w-2 h-2 rounded-full bg-destructive" /> {t('dashboard.critical')} (2)
               </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-display font-bold text-muted-foreground uppercase tracking-widest px-1">{t('dashboard.rapidDeploy')}</h3>
          
          <button className="flex-1 text-left bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 hover:border-destructive/60 p-5 rounded-2xl transition-all group hover:shadow-[0_0_20px_rgba(220,38,38,0.2)]">
            <AlertTriangle className="w-8 h-8 text-destructive mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-white text-lg">{t('dashboard.emergencyDrill')}</h4>
            <p className="text-xs text-muted-foreground mt-1">{t('dashboard.emergencyDrillDesc')}</p>
          </button>
          
          <button className="flex-1 text-left bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/50 p-5 rounded-2xl transition-all group">
            <MapPin className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-white text-lg">{t('dashboard.deployNode')}</h4>
            <p className="text-xs text-muted-foreground mt-1">{t('dashboard.deployNodeDesc')}</p>
          </button>
          
          <div className="flex gap-4 flex-1">
            <button className="flex-1 text-left bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/50 p-4 rounded-2xl transition-all group">
              <FileText className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-white text-sm">{t('dashboard.generateReport')}</h4>
            </button>
            <button className="flex-1 text-left bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/50 p-4 rounded-2xl transition-all group">
              <Radio className="w-6 h-6 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-white text-sm">{t('dashboard.broadcastAlert')}</h4>
            </button>
          </div>
        </div>
      </div>

      {/* Alert Feed */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-xl font-display font-bold text-white flex items-center gap-3">
            {t('dashboard.threatFeed')}
            <Badge variant="critical" className="animate-pulse bg-destructive/20 text-destructive border-none">LIVE</Badge>
          </h3>
          <Button variant="ghost" size="sm">{t('dashboard.viewArchive')} <ArrowRight className="ml-2 w-4 h-4"/></Button>
        </div>
        
        <div className="space-y-3">
          <AnimatePresence>
            {liveAlerts.map((alert) => (
              <motion.div 
                key={alert.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="p-4 border-l-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-secondary/40 transition-colors" 
                  style={{ borderLeftColor: alert.severity === 'critical' ? 'hsl(var(--destructive))' : 'hsl(var(--chart-4))' }}>
                  
                  <div className={cn(
                    "p-3 rounded-full shrink-0 flex items-center justify-center",
                    alert.severity === 'critical' ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-500"
                  )}>
                    {alert.module === 'energy' ? <Zap className="w-5 h-5"/> : 
                     alert.module === 'lifemesh' ? <ShieldAlert className="w-5 h-5"/> : 
                     <Globe className="w-5 h-5"/>}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-base text-white">{alert.title}</h4>
                      {alert.severity === 'critical' && <span className="w-2 h-2 rounded-full bg-destructive animate-ping" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                      <span className="flex items-center text-primary"><MapPin className="w-3 h-3 mr-1"/> {alert.location}</span>
                      <span>{format(alert.createdAt ? new Date(alert.createdAt) : new Date(), 'HH:mm:ss')}</span>
                      <span>MOD: {alert.module}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" className="h-8 text-xs border-border/50"><Check className="w-3 h-3 mr-1"/> {t('dashboard.ack')}</Button>
                    <Button variant="ghost" size="sm" className="h-8 text-xs">{t('common.dismiss')}</Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
