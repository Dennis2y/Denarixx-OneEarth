import React, { useState } from 'react';
import { useGetUnifiedAlerts } from '@workspace/api-client-react';
import { PageHeader, LoadingScreen, Card, Badge, Select, Table, Th, Td } from '@/components/ui-core';
import { format } from 'date-fns';
import { Bell, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Alerts() {
  const [module, setModule] = useState<string>('');
  const [severity, setSeverity] = useState<string>('');
  
  const { data: alerts, isLoading } = useGetUnifiedAlerts({
    module: module || undefined,
    severity: severity || undefined
  } as any);

  if (isLoading) return <LoadingScreen />;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader 
        title="Unified Alert Log" 
        description="Comprehensive intelligence feed across all Denarixx systems."
      />

      <Card className="p-6 mb-8 border-border/50 bg-secondary/10">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex items-center text-white font-display font-semibold w-full md:w-auto shrink-0">
            <Filter className="w-5 h-5 mr-2 text-primary" /> Filter Matrix
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            <Select 
              value={module} 
              onChange={(e) => setModule(e.target.value)}
              options={[
                { label: "All Modules", value: "" },
                { label: "Denarixx Energy", value: "energy" },
                { label: "Denarixx LifeMesh", value: "lifemesh" },
                { label: "Denarixx EarthShield", value: "earthshield" }
              ]}
            />
            <Select 
              value={severity} 
              onChange={(e) => setSeverity(e.target.value)}
              options={[
                { label: "All Severities", value: "" },
                { label: "Critical", value: "critical" },
                { label: "Warning", value: "warning" },
                { label: "Info", value: "info" }
              ]}
            />
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Severity</Th>
              <Th>Module</Th>
              <Th>Alert Title & Description</Th>
              <Th>Location</Th>
              <Th>Timestamp</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {alerts?.map((alert) => (
              <tr key={alert.id} className="hover:bg-secondary/30 transition-colors group">
                <Td>
                  <Badge variant={alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'warning' : 'info'}>
                    {alert.severity}
                  </Badge>
                </Td>
                <Td>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{alert.module}</span>
                </Td>
                <Td>
                  <div className="max-w-md">
                    <p className="font-bold text-white mb-1 group-hover:text-primary transition-colors">{alert.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{alert.description}</p>
                  </div>
                </Td>
                <Td className="text-sm">{alert.location}</Td>
                <Td className="text-sm font-mono text-muted-foreground">
                  {format(new Date(alert.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                </Td>
                <Td>
                  <Badge variant={alert.status === 'resolved' ? 'safe' : 'default'} className="bg-transparent">
                    {alert.status}
                  </Badge>
                </Td>
              </tr>
            ))}
            {(!alerts || alerts.length === 0) && (
              <tr>
                <Td colSpan={6} className="text-center py-12 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  No alerts match the current filter criteria.
                </Td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    </motion.div>
  );
}
