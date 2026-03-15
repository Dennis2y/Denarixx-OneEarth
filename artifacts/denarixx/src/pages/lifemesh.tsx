import React, { useState } from 'react';
import { useGetProtectedPersons, useGetSafetyIncidents, useTriggerSOS } from '@workspace/api-client-react';
import { PageHeader, LoadingScreen, Card, Badge, Table, Th, Td, Button, Modal, Input, Label, Select } from '@/components/ui-core';
import { Shield, ShieldAlert, HeartPulse, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LifeMesh() {
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
        // Assume cache invalidation handled or fake success alert
        alert("SOS Broadcast Sent to Global Response Network.");
      }
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader 
        title="Denarixx LifeMesh" 
        description="Individual safety tracking and emergency response coordination."
      />

      {/* Emergency Override Banner */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-destructive/20 to-background border border-destructive/30 p-8 rounded-2xl relative overflow-hidden shadow-[0_0_40px_rgba(220,38,38,0.1)] group">
        <div className="absolute top-0 left-0 w-2 bg-destructive h-full animate-pulse shadow-[0_0_20px_rgba(220,38,38,1)]"></div>
        <div className="mb-6 md:mb-0 relative z-10">
          <h2 className="text-3xl font-display font-bold text-white mb-2 flex items-center drop-shadow-md">
            <ShieldAlert className="w-8 h-8 mr-3 text-destructive" /> Emergency Protocol
          </h2>
          <p className="text-destructive-foreground/80 text-lg max-w-xl">
            Trigger immediate network-wide safety broadcast. Dispatches closest response teams and shifts local grid resources to critical mode.
          </p>
        </div>
        <Button 
          size="lg" 
          variant="destructive" 
          onClick={() => setSosOpen(true)} 
          className="h-16 px-10 md:px-14 text-xl font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(220,38,38,0.6)] hover:shadow-[0_0_50px_rgba(220,38,38,0.9)] animate-pulse"
          style={{ animationDuration: '2s' }}
        >
          Initiate SOS
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-display font-semibold text-white flex items-center">
              <UsersIcon className="w-6 h-6 mr-3 text-primary" /> Protected Personnel
            </h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search ID or Name" className="pl-10 h-10" />
            </div>
          </div>
          
          <Table>
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Name</Th>
                <Th>Category</Th>
                <Th>Status</Th>
                <Th>Last Location</Th>
              </tr>
            </thead>
            <tbody>
              {persons?.map(p => (
                <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                  <Td className="text-muted-foreground font-mono text-xs">#{p.id}</Td>
                  <Td className="font-bold text-white">{p.name}</Td>
                  <Td><Badge variant="outline" className="border-primary/50 text-primary">{p.category}</Badge></Td>
                  <Td>
                    <Badge variant={p.status === 'safe' ? 'safe' : p.status === 'emergency' ? 'critical' : 'warning'}>
                      {p.status}
                    </Badge>
                  </Td>
                  <Td className="text-sm text-muted-foreground">{p.lastKnownLocation}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 border-t-4 border-t-primary bg-secondary/20">
            <h3 className="text-xl font-display font-semibold text-white mb-6">Active Safety Incidents</h3>
            <div className="space-y-4">
              {incidents?.filter(i => i.status !== 'resolved').map(incident => (
                <div key={incident.id} className="bg-background/50 border border-border/50 rounded-xl p-4 hover:border-primary/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-white text-sm">{incident.title}</h4>
                    <Badge variant={incident.severity === 'critical' ? 'critical' : 'warning'}>{incident.severity}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{incident.description}</p>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-primary font-medium">{incident.location}</span>
                    <span className="text-muted-foreground uppercase tracking-widest">{incident.status}</span>
                  </div>
                </div>
              ))}
              {(!incidents || incidents.filter(i => i.status !== 'resolved').length === 0) && (
                <div className="text-center p-6 text-muted-foreground">
                  <HeartPulse className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p>No active incidents.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal isOpen={sosModalOpen} onClose={() => setSosOpen(false)} title="Broadcast Emergency SOS">
        <form onSubmit={handleSOS} className="space-y-5">
          <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/20 mb-4">
            <strong>WARNING:</strong> This action will alert all regional authorities and dispatch emergency services. Misuse is a federal offense.
          </div>
          <div className="space-y-2">
            <Label>Target Personnel ID</Label>
            <Select 
              value={sosData.personId} 
              onChange={e => setSosData({...sosData, personId: e.target.value})}
              options={persons?.map(p => ({ label: `${p.name} (ID: ${p.id})`, value: p.id.toString() })) || []}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Incident Location</Label>
            <Input 
              value={sosData.location} 
              onChange={e => setSosData({...sosData, location: e.target.value})} 
              placeholder="e.g. Sector 4, Main Clinic" 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label>Situation Details (Optional)</Label>
            <textarea 
              className="w-full rounded-xl border border-border bg-input/50 px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[100px]"
              value={sosData.message}
              onChange={e => setSosData({...sosData, message: e.target.value})}
              placeholder="Provide specific details to aid response teams..."
            />
          </div>
          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setSosOpen(false)}>Cancel</Button>
            <Button type="submit" variant="destructive" className="flex-1" isLoading={sosPending}>Confirm Dispatch</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}

// Temporary Icon for this file
function UsersIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
