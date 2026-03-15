import React, { useState } from 'react';
import { useGetSites, useCreateSite } from '@workspace/api-client-react';
import { PageHeader, LoadingScreen, Card, Badge, Table, Th, Td, Button, Modal, Input, Label, Select, Skeleton, EmptyState, cn } from '@/components/ui-core';
import { MapPin, Plus, LayoutGrid, List, Activity, Cpu, Users, Server, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sites() {
  const { data: sites, isLoading, refetch } = useGetSites();
  const { mutate: createSite, isPending } = useCreateSite();
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid'|'table'>('grid');
  const [selectedSite, setSelectedSite] = useState<any|null>(null);

  const [formData, setFormData] = useState<any>({
    name: '', type: 'village', location: '', country: '', latitude: 0, longitude: 0, population: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSite({ data: { ...formData, latitude: Number(formData.latitude), longitude: Number(formData.longitude), population: Number(formData.population) } }, {
      onSuccess: () => {
        setModalOpen(false);
        refetch();
      }
    });
  };

  const getRiskColor = (risk: string) => {
    switch(risk) {
      case 'critical': return 'text-destructive bg-destructive/10 border-destructive/30';
      case 'high': return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
      case 'medium': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default: return 'text-green-400 bg-green-500/10 border-green-500/30';
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader 
        title="Infrastructure Nodes" 
        description="Global directory and status of all physical Denarixx installations."
        actions={
          <div className="flex items-center gap-4">
            <div className="bg-secondary/50 p-1 rounded-xl border border-border/50 flex">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn("p-2 rounded-lg transition-colors", viewMode === 'grid' ? "bg-card text-primary shadow" : "text-muted-foreground hover:text-white")}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={cn("p-2 rounded-lg transition-colors", viewMode === 'table' ? "bg-card text-primary shadow" : "text-muted-foreground hover:text-white")}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <Button onClick={() => setModalOpen(true)} className="shadow-[0_0_15px_rgba(201,168,76,0.3)]">
              <Plus className="w-5 h-5 mr-2" /> Deploy Node
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <Card key={i} className="p-6 border-border/50">
              <Skeleton className="h-6 w-1/2 mb-4" />
              <Skeleton className="h-4 w-1/3 mb-6" />
              <div className="flex gap-4 mb-6">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
              </div>
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        </div>
      ) : sites?.length === 0 ? (
         <Card className="border-dashed border-2 border-border/50 bg-transparent">
           <EmptyState 
             icon={Server} 
             title="No Nodes Deployed" 
             description="The global registry is currently empty. Deploy a new infrastructure node to begin monitoring."
             action={<Button onClick={() => setModalOpen(true)}>Deploy First Node</Button>}
           />
         </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sites?.map((site) => (
            <Card key={site.id} className="flex flex-col p-0 overflow-hidden border-border/60 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 group">
              <div className="p-6 border-b border-border/50 bg-gradient-to-b from-secondary/40 to-transparent relative">
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: site.status === 'online' ? 'hsl(160, 70%, 45%)' : 'hsl(var(--destructive))' }} />
                
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="outline" className="border-primary/30 text-primary uppercase text-[10px] tracking-widest bg-primary/5">{site.type}</Badge>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                    {site.status === 'online' ? (
                      <span className="text-green-500 flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse"/> ONLINE</span>
                    ) : (
                      <span className="text-destructive flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-destructive mr-2"/> OFFLINE</span>
                    )}
                  </div>
                </div>
                
                <h3 className="text-2xl font-display font-bold text-white mb-2">{site.name}</h3>
                <div className="flex items-center text-sm text-muted-foreground font-medium">
                  <MapPin className="w-4 h-4 mr-1.5 text-primary/70" />
                  {site.location}, <span className="text-white/80 ml-1">{site.country}</span>
                </div>
              </div>
              
              <div className="p-6 flex-1 bg-card">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Uptime</p>
                    <p className="font-mono text-lg font-bold text-white">{site.uptime}%</p>
                  </div>
                  <div className="text-center border-l border-r border-border/50">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Power</p>
                    <p className="font-mono text-lg font-bold text-primary">{site.powerAvailability}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Risk</p>
                    <p className={cn("font-bold text-sm mt-1 py-0.5 rounded border capitalize", getRiskColor(site.currentRiskLevel))}>{site.currentRiskLevel}</p>
                  </div>
                </div>
                
                <Button 
                  variant="secondary" 
                  className="w-full bg-secondary/50 hover:bg-primary hover:text-primary-foreground border border-border/50 group-hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedSite(site)}
                >
                  Access Node Telemetry
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
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
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {sites?.map((site) => (
                <tr key={site.id} className="hover:bg-secondary/30 transition-colors">
                  <Td>
                    <div className="font-bold text-white">{site.name}</div>
                    <div className="text-xs font-mono text-muted-foreground mt-1">ID:{site.id} • Pop:{site.population}</div>
                  </Td>
                  <Td><Badge variant="outline" className="border-border text-muted-foreground uppercase">{site.type}</Badge></Td>
                  <Td>
                    <div className="flex items-center text-sm font-medium">
                      <MapPin className="w-3 h-3 mr-2 text-primary" />
                      {site.location}, {site.country}
                    </div>
                  </Td>
                  <Td>
                    <Badge variant={site.currentRiskLevel === 'critical' ? 'critical' : site.currentRiskLevel === 'high' ? 'warning' : 'safe'} className="bg-transparent">
                      {site.currentRiskLevel}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center text-xs font-bold uppercase tracking-wider">
                      <div className={`w-1.5 h-1.5 rounded-full mr-2 ${site.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-destructive'}`} />
                      <span className={site.status === 'online' ? 'text-green-500' : 'text-destructive'}>{site.status}</span>
                    </div>
                  </Td>
                  <Td className="font-mono">{site.uptime}%</Td>
                  <Td className="text-primary font-mono font-bold">{site.powerAvailability}%</Td>
                  <Td><Button variant="ghost" size="sm" onClick={() => setSelectedSite(site)}>View</Button></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Node Details Modal */}
      <Modal isOpen={!!selectedSite} onClose={() => setSelectedSite(null)} title="Node Telemetry">
        {selectedSite && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <div>
                <h2 className="text-2xl font-display font-bold text-white mb-1">{selectedSite.name}</h2>
                <p className="text-sm text-muted-foreground font-mono flex items-center">
                  <MapPin className="w-3 h-3 mr-2" /> {selectedSite.latitude}, {selectedSite.longitude}
                </p>
              </div>
              <div className={cn("px-4 py-2 rounded-xl text-center border font-bold uppercase tracking-widest text-xs", 
                selectedSite.status === 'online' ? "bg-green-500/10 text-green-500 border-green-500/30" : "bg-destructive/10 text-destructive border-destructive/30"
              )}>
                {selectedSite.status}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/30 p-4 rounded-xl border border-border/50 flex items-center">
                <Users className="w-8 h-8 text-blue-400 mr-4 opacity-50" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Protected Pop.</p>
                  <p className="text-xl font-bold text-white">{selectedSite.population.toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-secondary/30 p-4 rounded-xl border border-border/50 flex items-center">
                <Zap className="w-8 h-8 text-primary mr-4 opacity-50" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Power Supply</p>
                  <p className="text-xl font-bold text-primary font-mono">{selectedSite.powerAvailability}%</p>
                </div>
              </div>
            </div>
            
            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-border/50">
               <img src={`${import.meta.env.BASE_URL}images/map-bg.png`} alt="Map" className="w-full h-full object-cover opacity-50" />
               <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex items-center justify-center">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-full bg-primary/20 animate-ping absolute -inset-6 pointer-events-none" />
                    <div className="w-8 h-8 rounded-full bg-primary border-4 border-background shadow-[0_0_20px_rgba(201,168,76,1)] flex items-center justify-center z-10 relative">
                       <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </div>
               </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button className="flex-1 bg-secondary/80 text-white hover:bg-secondary border border-border">Run Diagnostics</Button>
              <Button className="flex-1">View Full Matrix</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Deploy Node Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Initialize New Node">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-white">Node Designation (Name)</Label>
            <Input className="bg-background border-border/80 text-base" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="e.g. Sector 7 Core" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Facility Type</Label>
              <Select 
                className="bg-background border-border/80 text-base"
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value})}
                options={['village', 'clinic', 'school', 'district', 'shelter'].map(v => ({ label: v.toUpperCase(), value: v }))}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Protected Population</Label>
              <Input className="bg-background border-border/80 text-base font-mono" type="number" value={formData.population || ''} onChange={e => setFormData({...formData, population: e.target.value})} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Region / City</Label>
              <Input className="bg-background border-border/80 text-base" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Country</Label>
              <Input className="bg-background border-border/80 text-base" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Latitude</Label>
              <Input className="bg-background border-border/80 text-base font-mono" type="number" step="0.0001" value={formData.latitude || ''} onChange={e => setFormData({...formData, latitude: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Longitude</Label>
              <Input className="bg-background border-border/80 text-base font-mono" type="number" step="0.0001" value={formData.longitude || ''} onChange={e => setFormData({...formData, longitude: e.target.value})} required />
            </div>
          </div>
          <div className="pt-6 flex gap-4 border-t border-border/50">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="flex-1 h-12">Abort</Button>
            <Button type="submit" isLoading={isPending} className="flex-1 h-12 text-md shadow-[0_0_15px_rgba(201,168,76,0.3)]">Deploy Initialization</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
