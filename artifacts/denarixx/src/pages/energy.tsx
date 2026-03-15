import React from 'react';
import { useGetEnergyMetrics, useGetEnergyChart } from '@workspace/api-client-react';
import { PageHeader, LoadingScreen, Card, Badge, Table, Th, Td, cn } from '@/components/ui-core';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { Zap, Battery, Activity, AlertTriangle, Sun, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Energy() {
  const { data: metrics, isLoading: metricsLoading } = useGetEnergyMetrics();
  const { data: chartData, isLoading: chartLoading } = useGetEnergyChart({ siteId: 1 });
  const [dismissedAlerts, setDismissedAlerts] = React.useState<number[]>([]);

  if (metricsLoading || chartLoading) return <LoadingScreen />;

  const criticalSites = metrics?.filter(m => m.gridStatus === 'unstable' || m.batteryLevel < 30) || [];
  
  // Format for RadialBarChart
  const batteryData = metrics?.slice(0, 5).map((m, i) => ({
    name: m.siteName,
    value: m.batteryLevel,
    fill: m.batteryLevel > 60 ? 'hsl(var(--chart-2))' : m.batteryLevel > 20 ? 'hsl(var(--chart-4))' : 'hsl(var(--destructive))'
  })) || [];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader 
        title="Energy Command" 
        description="Real-time monitoring of decentralized solar microgrids and battery storage reserves."
        actions={<Badge variant="safe" className="px-4 py-2 text-sm shadow-[0_0_15px_rgba(34,197,94,0.3)]"><Zap className="w-4 h-4 mr-2"/> Grid Nominal</Badge>}
      />

      {/* Dismissable Alerts */}
      <AnimatePresence>
        {criticalSites.map(site => !dismissedAlerts.includes(site.id) && (
          <motion.div 
            key={site.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-3 shrink-0" />
                <div>
                  <span className="font-bold text-white mr-2">{site.siteName}</span>
                  <span className="text-sm">Battery capacity dropping below optimal threshold ({site.batteryLevel}%).</span>
                </div>
              </div>
              <button onClick={() => setDismissedAlerts([...dismissedAlerts, site.id])} className="p-1 hover:bg-amber-500/20 rounded-md transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Main Chart */}
        <Card className="lg:col-span-3 p-6 border-primary/20 bg-gradient-to-b from-card to-background">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Net Power Flow
              </h3>
              <p className="text-muted-foreground text-sm font-medium mt-1 uppercase tracking-widest">Aggregated Generation vs Load (24H)</p>
            </div>
          </div>
          
          <div className="h-[420px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBattery" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(val) => `${val}kW`} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '8px' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: '500' }} />
                <Area type="monotone" name="Solar Yield" dataKey="solar" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorSolar)" />
                <Area type="monotone" name="Battery Output" dataKey="battery" stroke="hsl(var(--chart-2))" strokeWidth={3} fillOpacity={1} fill="url(#colorBattery)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Sidebar panels */}
        <div className="space-y-6">
          <Card className="p-6 relative overflow-hidden group">
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
             <h3 className="text-sm font-display font-bold text-muted-foreground uppercase tracking-widest mb-6">Storage Reserves</h3>
             
             <div className="h-[200px] w-full -ml-4">
               <ResponsiveContainer width="100%" height="100%">
                 <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="100%" barSize={10} data={batteryData}>
                   <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                   <RadialBar background={{ fill: 'hsl(var(--secondary))' }} dataKey="value" cornerRadius={10} />
                   <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: any, name: any, props: any) => [`${value}%`, props.payload.name]}
                   />
                 </RadialBarChart>
               </ResponsiveContainer>
             </div>
             
             <div className="mt-4 space-y-2">
               {batteryData.slice(0,3).map(d => (
                 <div key={d.name} className="flex justify-between items-center text-xs">
                   <div className="flex items-center gap-2 text-white"><div className="w-2 h-2 rounded-full" style={{backgroundColor: d.fill}}/> {d.name}</div>
                   <span className="font-mono text-muted-foreground">{d.value}%</span>
                 </div>
               ))}
             </div>
          </Card>

          <Card className="p-0 overflow-hidden border-destructive/20 bg-destructive/5">
             <div className="p-4 border-b border-destructive/20 bg-destructive/10">
               <h4 className="text-destructive font-bold text-sm uppercase tracking-widest flex items-center">
                 <AlertTriangle className="w-4 h-4 mr-2"/> Critical Nodes
               </h4>
             </div>
             <div className="p-2">
               {criticalSites.length > 0 ? criticalSites.map(site => (
                 <div key={site.id} className="p-3 hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer border-l-2 border-transparent hover:border-destructive">
                   <p className="font-bold text-white text-sm mb-1">{site.siteName}</p>
                   <div className="flex justify-between text-xs">
                     <span className="text-muted-foreground">Batt: <span className="text-amber-500 font-mono">{site.batteryLevel}%</span></span>
                     <span className="text-destructive uppercase">{site.gridStatus}</span>
                   </div>
                 </div>
               )) : (
                 <div className="p-6 text-center text-sm text-muted-foreground">All nodes operating within safe parameters.</div>
               )}
             </div>
          </Card>
        </div>
      </div>

      {/* Mini Site Cards Grid */}
      <h3 className="text-xl font-display font-bold text-white mb-4 ml-1">Node Analytics Matrix</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics?.map((metric) => (
          <Card key={metric.id} className="p-5 hover:-translate-y-1 transition-transform border-border/50 bg-secondary/20 hover:bg-secondary/40">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-bold text-white text-lg truncate pr-2">{metric.siteName}</h4>
              <Badge variant={metric.gridStatus === 'stable' ? 'safe' : metric.gridStatus === 'unstable' ? 'warning' : 'critical'} className="shrink-0 bg-transparent">
                {metric.gridStatus}
              </Badge>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="text-sm text-muted-foreground flex items-center"><Sun className="w-4 h-4 mr-1"/> Solar Yield</div>
                <div className="text-xl font-mono font-bold text-primary">{metric.solarGeneration} <span className="text-xs text-muted-foreground">kW</span></div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm text-muted-foreground mb-1.5">
                  <span className="flex items-center"><Battery className="w-4 h-4 mr-1"/> Storage</span>
                  <span className="font-mono">{metric.batteryLevel}%</span>
                </div>
                <div className="w-full bg-background rounded-full h-2 overflow-hidden border border-border/50">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 relative"
                    style={{ 
                      width: `${metric.batteryLevel}%`,
                      backgroundColor: metric.batteryLevel > 60 ? 'hsl(var(--chart-2))' : metric.batteryLevel > 20 ? 'hsl(var(--chart-4))' : 'hsl(var(--destructive))'
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
