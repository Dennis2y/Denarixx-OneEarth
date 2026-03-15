import React, { useState, useEffect } from 'react';
import { useGetSites, useCreateSite } from '@workspace/api-client-react';
import { PageHeader, LoadingScreen, Card, Badge, Table, Th, Td, Button, Modal, Input, Label, Select, Skeleton, EmptyState, cn } from '@/components/ui-core';
import { MapPin, Plus, LayoutGrid, List, Users, Server, Zap, Activity, AlertTriangle, Shield, BarChart3, Clock, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function Sites() {
  const { data: sites, isLoading, refetch } = useGetSites();
  const { mutate: createSite, isPending } = useCreateSite();
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid'|'table'>('grid');
  const [selectedSite, setSelectedSite] = useState<any|null>(null);
  const [siteDetail, setSiteDetail] = useState<{
    energy: any[];
    alerts: any[];
    persons: any[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [formData, setFormData] = useState<any>({
    name: '', type: 'village', location: '', country: '', latitude: 0, longitude: 0, population: 0
  });

  const loadSiteDetail = async (site: any) => {
    setSelectedSite(site);
    setSiteDetail(null);
    setDetailLoading(true);
    try {
      const [energyRes, alertsRes, personsRes] = await Promise.all([
        fetch(`/api/energy/metrics?siteId=${site.id}`, { credentials: 'include' }),
        fetch(`/api/alerts?status=active`, { credentials: 'include' }),
        fetch(`/api/lifemesh/persons`, { credentials: 'include' }),
      ]);
      const [energy, allAlerts, allPersons] = await Promise.all([
        energyRes.json(),
        alertsRes.json(),
        personsRes.json(),
      ]);
      const locationLower = site.location?.toLowerCase() ?? '';
      const siteAlerts = Array.isArray(allAlerts) ? allAlerts.filter((a: any) =>
        a.location?.toLowerCase().includes(locationLower) ||
        a.description?.toLowerCase().includes(site.name?.toLowerCase())
      ).slice(0, 5) : [];
      const sitePersons = Array.isArray(allPersons) ? allPersons.filter((p: any) => p.siteId === site.id) : [];
      setSiteDetail({
        energy: Array.isArray(energy) ? energy.slice(0, 1) : [],
        alerts: siteAlerts,
        persons: sitePersons,
      });
    } catch {
      setSiteDetail({ energy: [], alerts: [], persons: [] });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSite({ data: { ...formData, latitude: Number(formData.latitude), longitude: Number(formData.longitude), population: Number(formData.population) } }, {
      onSuccess: () => { setModalOpen(false); refetch(); }
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
              <button onClick={() => setViewMode('grid')} className={cn('p-2 rounded-lg transition-colors', viewMode === 'grid' ? 'bg-card text-primary shadow' : 'text-muted-foreground hover:text-white')}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('table')} className={cn('p-2 rounded-lg transition-colors', viewMode === 'table' ? 'bg-card text-primary shadow' : 'text-muted-foreground hover:text-white')}>
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
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        </div>
      ) : sites?.length === 0 ? (
        <Card className="border-dashed border-2 border-border/50 bg-transparent">
          <EmptyState icon={Server} title="No Nodes Deployed" description="Deploy a new infrastructure node to begin monitoring." action={<Button onClick={() => setModalOpen(true)}>Deploy First Node</Button>} />
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
                    <p className={cn('font-bold text-sm mt-1 py-0.5 rounded border capitalize', getRiskColor(site.currentRiskLevel))}>{site.currentRiskLevel}</p>
                  </div>
                </div>
                <Button variant="secondary" className="w-full bg-secondary/50 hover:bg-primary hover:text-primary-foreground border border-border/50 group-hover:border-primary/50 transition-colors" onClick={() => loadSiteDetail(site)}>
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
              <tr><Th>Node Identifier</Th><Th>Type</Th><Th>Global Position</Th><Th>Risk Level</Th><Th>Status</Th><Th>Uptime</Th><Th>Power Avail.</Th><Th>Action</Th></tr>
            </thead>
            <tbody>
              {sites?.map((site) => (
                <tr key={site.id} className="hover:bg-secondary/30 transition-colors">
                  <Td><div className="font-bold text-white">{site.name}</div><div className="text-xs font-mono text-muted-foreground mt-1">ID:{site.id} · Pop:{site.population}</div></Td>
                  <Td><Badge variant="outline" className="border-border text-muted-foreground uppercase">{site.type}</Badge></Td>
                  <Td><div className="flex items-center text-sm font-medium"><MapPin className="w-3 h-3 mr-2 text-primary" />{site.location}, {site.country}</div></Td>
                  <Td><Badge variant={site.currentRiskLevel === 'critical' ? 'critical' : site.currentRiskLevel === 'high' ? 'warning' : 'safe'} className="bg-transparent">{site.currentRiskLevel}</Badge></Td>
                  <Td><div className="flex items-center text-xs font-bold uppercase tracking-wider"><div className={`w-1.5 h-1.5 rounded-full mr-2 ${site.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-destructive'}`} /><span className={site.status === 'online' ? 'text-green-500' : 'text-destructive'}>{site.status}</span></div></Td>
                  <Td className="font-mono">{site.uptime}%</Td>
                  <Td className="text-primary font-mono font-bold">{site.powerAvailability}%</Td>
                  <Td><Button variant="ghost" size="sm" onClick={() => loadSiteDetail(site)}>View</Button></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Enriched Node Telemetry Modal */}
      <Modal isOpen={!!selectedSite} onClose={() => { setSelectedSite(null); setSiteDetail(null); }} title="Node Telemetry">
        {selectedSite && (
          <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-border/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="border-primary/30 text-primary uppercase text-[10px]">{selectedSite.type}</Badge>
                  <Badge variant={selectedSite.currentRiskLevel === 'critical' ? 'critical' : selectedSite.currentRiskLevel === 'high' ? 'warning' : 'safe'} className="bg-transparent text-[10px]">{selectedSite.currentRiskLevel} risk</Badge>
                </div>
                <h2 className="text-2xl font-display font-bold text-white">{selectedSite.name}</h2>
                <p className="text-sm text-muted-foreground font-mono flex items-center mt-1">
                  <MapPin className="w-3 h-3 mr-2 text-primary" /> {selectedSite.location}, {selectedSite.country}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{selectedSite.latitude}°, {selectedSite.longitude}°</p>
              </div>
              <div className={cn('px-4 py-2 rounded-xl border font-bold uppercase tracking-widest text-xs shrink-0',
                selectedSite.status === 'online' ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-destructive/10 text-destructive border-destructive/30'
              )}>
                {selectedSite.status}
              </div>
            </div>

            {/* Core KPIs */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: Users, label: 'Population', value: selectedSite.population.toLocaleString(), color: 'text-blue-400' },
                { icon: Zap, label: 'Power', value: `${selectedSite.powerAvailability}%`, color: 'text-primary' },
                { icon: Clock, label: 'Uptime', value: `${selectedSite.uptime}%`, color: 'text-green-400' },
                { icon: Shield, label: 'Risk', value: selectedSite.currentRiskLevel, color: selectedSite.currentRiskLevel === 'critical' ? 'text-destructive' : selectedSite.currentRiskLevel === 'high' ? 'text-amber-500' : 'text-green-400' },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-secondary/30 p-3 rounded-xl border border-border/50 text-center">
                  <kpi.icon className={cn('w-5 h-5 mx-auto mb-1.5 opacity-60', kpi.color)} />
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-0.5">{kpi.label}</p>
                  <p className={cn('text-sm font-bold capitalize', kpi.color)}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {detailLoading ? (
              <div className="space-y-3">
                <div className="h-20 bg-secondary/30 rounded-xl animate-pulse" />
                <div className="h-20 bg-secondary/30 rounded-xl animate-pulse" />
              </div>
            ) : siteDetail && (
              <>
                {/* Energy Status */}
                {siteDetail.energy.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-primary" /> Energy Telemetry
                    </h4>
                    {siteDetail.energy.map((e: any) => (
                      <div key={e.id} className="grid grid-cols-3 gap-3">
                        <div className="bg-secondary/20 p-3 rounded-xl border border-border/40 text-center">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Solar Output</p>
                          <p className="text-lg font-mono font-bold text-primary">{e.solarGeneration}%</p>
                        </div>
                        <div className="bg-secondary/20 p-3 rounded-xl border border-border/40 text-center">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Battery</p>
                          <p className={cn('text-lg font-mono font-bold', e.batteryLevel < 20 ? 'text-destructive' : 'text-green-400')}>{e.batteryLevel}%</p>
                        </div>
                        <div className="bg-secondary/20 p-3 rounded-xl border border-border/40 text-center">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Grid Status</p>
                          <p className={cn('text-sm font-bold capitalize', e.gridStatus === 'stable' ? 'text-green-400' : 'text-destructive')}>{e.gridStatus}</p>
                        </div>
                      </div>
                    ))}
                    {siteDetail.energy.length === 0 && <p className="text-xs text-muted-foreground">No energy data recorded for this site.</p>}
                  </div>
                )}

                {/* Protected Persons */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-blue-400" /> Protected Persons ({siteDetail.persons.length})
                  </h4>
                  {siteDetail.persons.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No persons registered at this site.</p>
                  ) : (
                    <div className="space-y-2 max-h-36 overflow-y-auto">
                      {siteDetail.persons.map((p: any) => (
                        <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/20 border border-border/40">
                          <div className={cn('w-2 h-2 rounded-full shrink-0', p.status === 'safe' ? 'bg-green-500' : p.status === 'at-risk' ? 'bg-amber-500 animate-pulse' : 'bg-destructive animate-ping')} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground">{p.category} · {p.status}</p>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">{p.contactPhone ?? '—'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Alerts */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive" /> Active Alerts ({siteDetail.alerts.length})
                  </h4>
                  {siteDetail.alerts.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-green-400 font-medium">
                      <div className="w-2 h-2 rounded-full bg-green-500" /> No active alerts for this location.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {siteDetail.alerts.map((a: any) => (
                        <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-destructive/5 border border-destructive/20">
                          <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', a.severity === 'critical' ? 'bg-destructive animate-ping' : 'bg-amber-500')} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{a.title}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{a.description}</p>
                            <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">{format(new Date(a.createdAt), 'MMM d, HH:mm')} UTC · {a.module}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2 border-t border-border/50">
              <Button className="flex-1 bg-secondary/80 text-white hover:bg-secondary border border-border" onClick={() => { setSelectedSite(null); setSiteDetail(null); }}>Close</Button>
              <Button className="flex-1">Run Diagnostics</Button>
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
              <Select className="bg-background border-border/80 text-base" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                options={['village', 'clinic', 'school', 'district', 'shelter'].map(v => ({ label: v.toUpperCase(), value: v }))} required />
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
