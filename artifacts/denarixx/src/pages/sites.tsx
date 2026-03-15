import React, { useState } from 'react';
import { useGetSites, useCreateSite } from '@workspace/api-client-react';
import { PageHeader, LoadingScreen, Card, Badge, Table, Th, Td, Button, Modal, Input, Label, Select } from '@/components/ui-core';
import { MapPin, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sites() {
  const { data: sites, isLoading, refetch } = useGetSites();
  const { mutate: createSite, isPending } = useCreateSite();
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState<any>({
    name: '', type: 'village', location: '', country: '', latitude: 0, longitude: 0, population: 0
  });

  if (isLoading) return <LoadingScreen />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSite({ data: { ...formData, latitude: Number(formData.latitude), longitude: Number(formData.longitude), population: Number(formData.population) } }, {
      onSuccess: () => {
        setModalOpen(false);
        refetch();
      }
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader 
        title="Infrastructure Nodes" 
        description="Global directory of active Denarixx installations."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-5 h-5 mr-2" /> Deploy New Node
          </Button>
        }
      />

      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Node Identifier</Th>
              <Th>Type</Th>
              <Th>Global Position</Th>
              <Th>Risk Level</Th>
              <Th>Status</Th>
              <Th>Uptime</Th>
              <Th>Power Avail.</Th>
            </tr>
          </thead>
          <tbody>
            {sites?.map((site) => (
              <tr key={site.id} className="hover:bg-secondary/30 transition-colors">
                <Td>
                  <div className="font-bold text-white">{site.name}</div>
                  <div className="text-xs font-mono text-muted-foreground mt-1">ID: {site.id} • Pop: {site.population}</div>
                </Td>
                <Td><Badge variant="outline" className="border-border text-muted-foreground">{site.type}</Badge></Td>
                <Td>
                  <div className="flex items-center text-sm">
                    <MapPin className="w-4 h-4 mr-2 text-primary" />
                    {site.location}, {site.country}
                  </div>
                </Td>
                <Td>
                  <Badge variant={site.currentRiskLevel === 'critical' ? 'critical' : site.currentRiskLevel === 'high' ? 'warning' : 'safe'}>
                    {site.currentRiskLevel}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${site.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm font-medium capitalize">{site.status}</span>
                  </div>
                </Td>
                <Td className="font-mono">{site.uptime}%</Td>
                <Td className="text-primary font-mono">{site.powerAvailability}%</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Initialize New Node">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Node Designation (Name)</Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Facility Type</Label>
              <Select 
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value})}
                options={['village', 'clinic', 'school', 'district', 'shelter'].map(v => ({ label: v.toUpperCase(), value: v }))}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Protected Population</Label>
              <Input type="number" value={formData.population} onChange={e => setFormData({...formData, population: e.target.value})} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Region / City</Label>
              <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input type="number" step="0.0001" value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input type="number" step="0.0001" value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} required />
            </div>
          </div>
          <div className="pt-6 flex gap-4">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="flex-1">Abort</Button>
            <Button type="submit" isLoading={isPending} className="flex-1">Deploy Initialization</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
