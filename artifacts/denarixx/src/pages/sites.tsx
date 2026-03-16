import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ModuleHeader, LoadingScreen, Card, Badge, Table, Th, Td, Button, Modal, Input, Label, Select, Skeleton, EmptyState, cn } from '@/components/ui-core';
import { MapPin, Plus, LayoutGrid, List, Users, Server, Zap, Clock, Shield, ExternalLink, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { apiUrl } from '@/lib/api';

export default function Sites() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const [sites, setSites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedSite, setSelectedSite] = useState<any | null>(null);
  const [siteDetail, setSiteDetail] = useState<{ energy: any[]; alerts: any[]; persons: any[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reportDownloading, setReportDownloading] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const [formData, setFormData] = useState<any>({
    name: '',
    type: 'village',
    location: '',
    country: '',
    latitude: 0,
    longitude: 0,
    population: 0,
  });

  const loadSites = async () => {
    try {
      setIsLoading(true);
      const resp = await fetch(apiUrl('/api/sites'), { credentials: 'include' });
      if (!resp.ok) {
        setSites([]);
        return;
      }
      const data = await resp.json();
      setSites(Array.isArray(data) ? data : []);
    } catch {
      setSites([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  const sitesList = Array.isArray(sites) ? sites : [];

  const downloadSiteReport = async (site: any) => {
    setReportDownloading(true);
    try {
      const resp = await fetch(apiUrl(`/api/reports/site/${site.id}`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (resp.ok) {
        const report = await resp.json();
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `denarixx-site-${site.name.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
    } finally {
      setReportDownloading(false);
    }
  };

  const loadSiteDetail = async (site: any) => {
    setSelectedSite(site);
    setSiteDetail(null);
    setDetailLoading(true);

    try {
      const [energyRes, alertsRes, personsRes] = await Promise.all([
        fetch(apiUrl(`/api/energy/metrics?siteId=${site.id}`), { credentials: 'include' }),
        fetch(apiUrl('/api/alerts?status=active'), { credentials: 'include' }),
        fetch(apiUrl('/api/lifemesh/persons'), { credentials: 'include' }),
      ]);

      const [energy, allAlerts, allPersons] = await Promise.all([
        energyRes.ok ? energyRes.json() : [],
        alertsRes.ok ? alertsRes.json() : [],
        personsRes.ok ? personsRes.json() : [],
      ]);

      const locationLower = site.location?.toLowerCase() ?? '';
      const siteNameLower = site.name?.toLowerCase() ?? '';

      const siteAlerts = Array.isArray(allAlerts)
        ? allAlerts.filter((a: any) =>
            a.location?.toLowerCase().includes(locationLower) ||
            a.description?.toLowerCase().includes(siteNameLower)
          ).slice(0, 5)
        : [];

      const sitePersons = Array.isArray(allPersons)
        ? allPersons.filter((p: any) => p.siteId === site.id)
        : [];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const resp = await fetch(apiUrl('/api/sites'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
          population: Number(formData.population),
        }),
      });

      if (resp.ok) {
        setModalOpen(false);
        setFormData({
          name: '',
          type: 'village',
          location: '',
          country: '',
          latitude: 0,
          longitude: 0,
          population: 0,
        });
        await loadSites();
      }
    } catch {
    } finally {
      setIsPending(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-destructive bg-destructive/10 border-destructive/30';
      case 'high': return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
      case 'medium': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default: return 'text-green-400 bg-green-500/10 border-green-500/30';
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <ModuleHeader
        title={t('sites.title')}
        subtitle={t('sites.description')}
        classification="RESTRICTED // INFRASTRUCTURE REGISTRY"
        moduleId="DNX-SITES-001"
        status="active"
        actions={
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex bg-secondary/50 p-1 rounded-xl border border-border/50">
              <button onClick={() => setViewMode('grid')} className={cn('p-2 rounded-lg transition-colors', viewMode === 'grid' ? 'bg-card text-primary shadow' : 'text-muted-foreground hover:text-white')}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('table')} className={cn('p-2 rounded-lg transition-colors', viewMode === 'table' ? 'bg-card text-primary shadow' : 'text-muted-foreground hover:text-white')}>
                <List className="w-4 h-4" />
              </button>
            </div>
            <Button onClick={() => setModalOpen(true)} className="shadow-[0_0_15px_rgba(201,168,76,0.3)]">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" /> <span className="hidden sm:inline">{t('sites.deployNode')}</span><span className="sm:hidden">Deploy</span>
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-6 border-border/50">
              <Skeleton className="h-6 w-1/2 mb-4" />
              <Skeleton className="h-4 w-1/3 mb-6" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        </div>
      ) : sitesList.length === 0 ? (
        <Card className="border-dashed border-2 border-border/50 bg-transparent">
          <EmptyState icon={Server} title={t('sites.noNodes')} description={t('sites.noNodesDesc')} action={<Button onClick={() => setModalOpen(true)}>{t('sites.deployFirstNode')}</Button>} />
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {sitesList.map((site) => (
            <Card key={site.id} className="flex flex-col p-0 overflow-hidden border-border/60 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 group">
              <div className="p-6 border-b border-border/50 bg-gradient-to-b from-secondary/40 to-transparent relative">
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: site.status === 'online' ? 'hsl(160, 70%, 45%)' : 'hsl(var(--destructive))' }} />
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="outline" className="border-primary/30 text-primary uppercase text-[10px] tracking-widest bg-primary/5">{site.type}</Badge>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                    {site.status === 'online' ? (
                      <span className="text-green-500 flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse" /> {t('sites.online')}</span>
                    ) : (
                      <span className="text-destructive flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-destructive mr-2" /> {t('sites.offline')}</span>
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
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{t('sites.uptime')}</p>
                    <p className="font-mono text-lg font-bold text-white">{site.uptime}%</p>
                  </div>
                  <div className="text-center border-l border-r border-border/50">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{t('sites.power')}</p>
                    <p className="font-mono text-lg font-bold text-primary">{site.powerAvailability}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{t('sites.risk')}</p>
                    <p className={cn('font-bold text-sm mt-1 py-0.5 rounded border capitalize', getRiskColor(site.currentRiskLevel))}>{site.currentRiskLevel}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1 bg-secondary/50 hover:bg-secondary border border-border/50 group-hover:border-border/80 transition-colors" onClick={() => loadSiteDetail(site)}>
                    {t('sites.accessTelemetry')}
                  </Button>
                  <Button variant="outline" className="px-3 border-primary/30 hover:bg-primary/10 hover:border-primary/50" onClick={() => setLocation(`/sites/${site.id}`)} title="Full Site Profile">
                    <ExternalLink className="w-4 h-4 text-primary" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <thead>
              <tr><Th>{t('sites.colNode')}</Th><Th>{t('sites.colType')}</Th><Th>{t('sites.colPosition')}</Th><Th>{t('sites.colRisk')}</Th><Th>{t('sites.colStatus')}</Th><Th>{t('sites.colUptime')}</Th><Th>{t('sites.colPower')}</Th><Th>{t('sites.colAction')}</Th></tr>
            </thead>
            <tbody>
              {sitesList.map((site) => (
                <tr key={site.id} className="hover:bg-secondary/30 transition-colors">
                  <Td><div className="font-bold text-white">{site.name}</div><div className="text-xs font-mono text-muted-foreground mt-1">ID:{site.id} · Pop:{site.population}</div></Td>
                  <Td><Badge variant="outline" className="border-border text-muted-foreground uppercase">{site.type}</Badge></Td>
                  <Td><div className="flex items-center text-sm font-medium"><MapPin className="w-3 h-3 mr-2 text-primary" />{site.location}, {site.country}</div></Td>
                  <Td><Badge variant={site.currentRiskLevel === 'critical' ? 'critical' : site.currentRiskLevel === 'high' ? 'warning' : 'safe'} className="bg-transparent">{site.currentRiskLevel}</Badge></Td>
                  <Td><div className="flex items-center text-xs font-bold uppercase tracking-wider"><div className={`w-1.5 h-1.5 rounded-full mr-2 ${site.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-destructive'}`} /><span className={site.status === 'online' ? 'text-green-500' : 'text-destructive'}>{site.status}</span></div></Td>
                  <Td className="font-mono">{site.uptime}%</Td>
                  <Td className="text-primary font-mono font-bold">{site.powerAvailability}%</Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => loadSiteDetail(site)}>{t('sites.view')}</Button>
                      <Button variant="ghost" size="sm" onClick={() => setLocation(`/sites/${site.id}`)} className="px-2 text-primary hover:text-primary"><ExternalLink className="w-3.5 h-3.5" /></Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <Modal isOpen={!!selectedSite} onClose={() => { setSelectedSite(null); setSiteDetail(null); }} title={t('sites.nodeTelemetry')}>
        {selectedSite && (
          <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar">
            <div className="flex items-start justify-between pb-4 border-b border-border/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="border-primary/30 text-primary uppercase text-[10px]">{selectedSite.type}</Badge>
                  <Badge variant={selectedSite.currentRiskLevel === 'critical' ? 'critical' : selectedSite.currentRiskLevel === 'high' ? 'warning' : 'safe'} className="bg-transparent text-[10px]">{selectedSite.currentRiskLevel} {t('sites.risk')}</Badge>
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Users, labelKey: 'sites.population', value: selectedSite.population.toLocaleString(), color: 'text-blue-400' },
                { icon: Zap, labelKey: 'sites.power', value: `${selectedSite.powerAvailability}%`, color: 'text-primary' },
                { icon: Clock, labelKey: 'sites.uptime', value: `${selectedSite.uptime}%`, color: 'text-green-400' },
                { icon: Shield, labelKey: 'sites.risk', value: selectedSite.currentRiskLevel, color: selectedSite.currentRiskLevel === 'critical' ? 'text-destructive' : selectedSite.currentRiskLevel === 'high' ? 'text-amber-500' : 'text-green-400' },
              ].map((kpi) => (
                <div key={kpi.labelKey} className="bg-secondary/30 p-3 rounded-xl border border-border/50 text-center">
                  <kpi.icon className={cn('w-5 h-5 mx-auto mb-1.5 opacity-60', kpi.color)} />
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-0.5">{t(kpi.labelKey)}</p>
                  <p className={cn('text-sm font-bold capitalize', kpi.color)}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {detailLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <>
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-white">Energy</h3>
                    <Button variant="outline" size="sm" onClick={() => downloadSiteReport(selectedSite)} disabled={reportDownloading}>
                      <Download className="w-4 h-4 mr-2" /> Report
                    </Button>
                  </div>
                  {siteDetail?.energy?.length ? (
                    siteDetail.energy.map((e, idx) => (
                      <div key={idx} className="text-sm text-muted-foreground space-y-1">
                        <div>Solar: <span className="text-white">{e.solarGeneration} kW</span></div>
                        <div>Battery: <span className="text-white">{e.batteryLevel}%</span></div>
                        <div>Grid: <span className="text-white">{e.gridStatus}</span></div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No energy data.</p>
                  )}
                </Card>

                <Card className="p-4">
                  <h3 className="font-bold text-white mb-3">Alerts</h3>
                  {siteDetail?.alerts?.length ? (
                    <div className="space-y-2">
                      {siteDetail.alerts.map((a, idx) => (
                        <div key={idx} className="text-sm text-muted-foreground border border-border/40 rounded-lg p-3">
                          <div className="text-white font-semibold">{a.title}</div>
                          <div>{a.description}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No active alerts.</p>
                  )}
                </Card>

                <Card className="p-4">
                  <h3 className="font-bold text-white mb-3">Protected Persons</h3>
                  {siteDetail?.persons?.length ? (
                    <div className="space-y-2">
                      {siteDetail.persons.map((p, idx) => (
                        <div key={idx} className="text-sm text-muted-foreground border border-border/40 rounded-lg p-3">
                          <div className="text-white font-semibold">{p.name}</div>
                          <div>Status: {p.status}</div>
                          <div>Category: {p.category}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No protected persons linked.</p>
                  )}
                </Card>
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={t('sites.deployNode')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <Label>Type</Label>
            <Select
              value={formData.type}
              onChange={(e: any) => setFormData({ ...formData, type: e.target.value })}
              options={[
                { value: 'village', label: 'Village' },
                { value: 'clinic', label: 'Clinic' },
                { value: 'school', label: 'School' },
                { value: 'district', label: 'District' },
                { value: 'shelter', label: 'Shelter' },
              ]}
            />
          </div>
          <div>
            <Label>Location</Label>
            <Input value={formData.location} onChange={(e: any) => setFormData({ ...formData, location: e.target.value })} />
          </div>
          <div>
            <Label>Country</Label>
            <Input value={formData.country} onChange={(e: any) => setFormData({ ...formData, country: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Latitude</Label>
              <Input type="number" value={formData.latitude} onChange={(e: any) => setFormData({ ...formData, latitude: e.target.value })} />
            </div>
            <div>
              <Label>Longitude</Label>
              <Input type="number" value={formData.longitude} onChange={(e: any) => setFormData({ ...formData, longitude: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Population</Label>
            <Input type="number" value={formData.population} onChange={(e: any) => setFormData({ ...formData, population: e.target.value })} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Deploying...' : 'Deploy'}</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
