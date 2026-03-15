import React, { useState } from 'react';
import { useGetEnergyMetrics, useGetEnergyChart } from '@workspace/api-client-react';
import { PageHeader, LoadingScreen, Card, Badge, Table, Th, Td } from '@/components/ui-core';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Zap, Battery, Activity, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Energy() {
  const { data: metrics, isLoading: metricsLoading } = useGetEnergyMetrics();
  const { data: chartData, isLoading: chartLoading } = useGetEnergyChart({ siteId: 1 });

  if (metricsLoading || chartLoading) return <LoadingScreen />;

  const criticalSites = metrics?.filter(m => m.gridStatus === 'unstable' || m.batteryLevel < 30) || [];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader 
        title="Denarixx Energy" 
        description="Real-time monitoring of decentralized solar microgrids and battery storage."
        actions={<Badge variant="safe" className="px-4 py-2 text-sm"><Zap className="w-4 h-4 mr-2"/> Grid Stable</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
        <Card className="lg:col-span-3 p-6 border-primary/20">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-2xl font-display font-semibold text-white">Network Power Flow</h3>
              <p className="text-muted-foreground text-sm mt-1">Aggregated generation vs load over 24h</p>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBattery" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(val) => `${val}kW`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area type="monotone" name="Solar Generation" dataKey="solar" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorSolar)" />
                <Area type="monotone" name="Battery Reserve" dataKey="battery" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorBattery)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 bg-secondary/30">
             <h3 className="text-lg font-display font-semibold text-white mb-4 flex items-center"><Activity className="w-5 h-5 mr-2 text-primary"/> Key Metrics</h3>
             <div className="space-y-4">
               <div>
                 <p className="text-sm text-muted-foreground mb-1">Total Solar Generation</p>
                 <p className="text-2xl font-bold text-primary">14.2 MW</p>
               </div>
               <div>
                 <p className="text-sm text-muted-foreground mb-1">Network Battery Avg</p>
                 <p className="text-2xl font-bold text-green-400">84%</p>
               </div>
               <div>
                 <p className="text-sm text-muted-foreground mb-1">Community Load</p>
                 <p className="text-2xl font-bold text-white">9.8 MW</p>
               </div>
             </div>
          </Card>

          {criticalSites.length > 0 && (
            <Card className="p-6 border-l-4 border-l-amber-500 bg-amber-500/5">
              <h4 className="text-amber-500 font-semibold mb-3 flex items-center"><AlertTriangle className="w-5 h-5 mr-2"/> Action Required</h4>
              <div className="space-y-3">
                {criticalSites.map(site => (
                  <div key={site.id} className="text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                    <p className="font-medium text-white">{site.siteName}</p>
                    <p className="text-muted-foreground">Battery at {site.batteryLevel}% • {site.gridStatus}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <div className="p-6 border-b border-border/50 bg-secondary/20">
          <h3 className="text-xl font-display font-semibold text-white">Microgrid Node Status</h3>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Site Name</Th>
              <Th>Solar (kW)</Th>
              <Th>Battery (%)</Th>
              <Th>Load (kW)</Th>
              <Th>Grid Status</Th>
              <Th>Last Update</Th>
            </tr>
          </thead>
          <tbody>
            {metrics?.map((metric) => (
              <tr key={metric.id} className="hover:bg-secondary/30 transition-colors">
                <Td className="font-medium">{metric.siteName}</Td>
                <Td className="text-primary">{metric.solarGeneration}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <Battery className={cn("w-4 h-4", metric.batteryLevel > 50 ? "text-green-400" : "text-amber-400")} />
                    <span>{metric.batteryLevel}%</span>
                  </div>
                </Td>
                <Td>{metric.communityLoad}</Td>
                <Td>
                  <Badge variant={metric.gridStatus === 'stable' ? 'safe' : metric.gridStatus === 'unstable' ? 'warning' : 'critical'}>
                    {metric.gridStatus}
                  </Badge>
                </Td>
                <Td className="text-muted-foreground text-sm">Just now</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </motion.div>
  );
}
