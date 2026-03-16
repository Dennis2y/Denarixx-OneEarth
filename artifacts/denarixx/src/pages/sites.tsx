import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGetSites, useCreateSite } from '@workspace/api-client-react';
import { ModuleHeader, LoadingScreen, Card, Badge, Table, Th, Td, Button, Modal, Input, Label, Select, Skeleton, EmptyState, cn } from '@/components/ui-core';
import { MapPin, Plus, LayoutGrid, List, Users, Server, Zap, Activity, AlertTriangle, Shield, BarChart3, Clock, Radio, ExternalLink, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { apiUrl } from "@/lib/api";

export default function Sites() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
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
  const [reportDownloading, setReportDownloading] = useState(false);

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
    } catch { /* ignore */ } finally {
      setReportDownloading(false);
    }
  };

  const [formData, setFormData] = useState<any>({
    name: '', type: 'village', location: '', country: '', latitude: 0, longitude: 0, population: 0
  });

  const loadSiteDetail = async (site: any) => {
    setSelectedSite(site);
    setSiteDetail(null);
    setDetailLoading(true);
    try {
      const [energyRes, alertsRes, personsRes] = await Promise.all([
        fetch(apiUrl(`/api/energy/metrics?siteId=${site.id}`), { credentials: 'include' }),
        fetch(apiUrl(`/api/alerts?status=active`), { credentials: 'include' }),
        fetch(apiUrl(`/api/lifemesh/persons`), { credentials: 'include' }),
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
          {[1,2,3,4,5,6].map(i => (
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
                      <span className="text-green-500 flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse"/> {t('sites.online')}</span>
                    ) : (
                      <span className="text-destructive flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-destructive mr-2"/> {t('sites.offline')}</span>
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
                <div className="h-20 bg-secondary/30 rounded-xl animate-pulse" />
                <div className="h-20 bg-secondary/30 rounded-xl animate-pulse" />
              </div>
            ) : siteDetail && (
              <>
                {siteDetail.energy.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-primary" /> {t('sites.energyTelemetry')}
                    </h4>
                    {siteDetail.energy.map((e: any) => (
                      <div key={e.id} className="grid grid-cols-3 gap-3">
                        <div className="bg-secondary/20 p-3 rounded-xl border border-border/40 text-center">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">{t('sites.solarOutput')}</p>
                          <p className="text-lg font-mono font-bold text-primary">{e.solarGeneration}%</p>
                        </div>
                        <div className="bg-secondary/20 p-3 rounded-xl border border-border/40 text-center">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">{t('sites.battery')}</p>
                          <p className={cn('text-lg font-mono font-bold', e.batteryLevel < 20 ? 'text-destructive' : 'text-green-400')}>{e.batteryLevel}%</p>
                        </div>
                        <div className="bg-secondary/20 p-3 rounded-xl border border-border/40 text-center">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">{t('sites.gridStatus')}</p>
                          <p className={cn('text-sm font-bold capitalize', e.gridStatus === 'stable' ? 'text-green-400' : 'text-destructive')}>{e.gridStatus}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-blue-400" /> {t('sites.protectedPersons')} ({siteDetail.persons.length})
                  </h4>
                  {siteDetail.persons.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">{t('sites.noPersons')}</p>
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

                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive" /> {t('sites.activeAlerts')} ({siteDetail.alerts.length})
                  </h4>
                  {siteDetail.alerts.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-green-400 font-medium">
                      <div className="w-2 h-2 rounded-full bg-green-500" /> {t('sites.noActiveAlerts')}
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

            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
              <Button variant="ghost" onClick={() => { setSelectedSite(null); setSiteDetail(null); }} className="flex-1">{t('sites.close')}</Button>
              <Button variant="outline" onClick={() => downloadSiteReport(selectedSite)} disabled={reportDownloading} className="flex-1 border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                {reportDownloading
                  ? <><div className="w-3.5 h-3.5 mr-2 border-2 border-current/30 border-t-current rounded-full animate-spin" />Downloading...</>
                  : <><Download className="w-4 h-4 mr-2" /> Download Report</>}
              </Button>
              <Button variant="outline" onClick={() => { setLocation(`/sites/${selectedSite.id}`); setSelectedSite(null); setSiteDetail(null); }} className="flex-1 border-primary/30 text-primary hover:bg-primary/10">
                <ExternalLink className="w-4 h-4 mr-2" /> Full Profile
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={t('sites.initializeNode')}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-white">{t('sites.nodeDesignation')}</Label>
            <Input className="bg-background border-border/80 text-base" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="e.g. Sector 7 Core" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">{t('sites.facilityType')}</Label>
              <Select className="bg-background border-border/80 text-base" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                options={['village', 'clinic', 'school', 'district', 'shelter'].map(v => ({ label: v.toUpperCase(), value: v }))} required />
            </div>
            <div className="space-y-2">
              <Label className="text-white">{t('sites.protectedPopulation')}</Label>
              <Input className="bg-background border-border/80 text-base font-mono" type="number" value={formData.population || ''} onChange={e => setFormData({...formData, population: e.target.value})} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">{t('sites.regionCity')}</Label>
              <Input className="bg-background border-border/80 text-base" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label className="text-white">{t('sites.country')}</Label>
              <Input className="bg-background border-border/80 text-base" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">{t('sites.latitude')}</Label>
              <Input className="bg-background border-border/80 text-base font-mono" type="number" step="0.0001" value={formData.latitude || ''} onChange={e => setFormData({...formData, latitude: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label className="text-white">{t('sites.longitude')}</Label>
              <Input className="bg-background border-border/80 text-base font-mono" type="number" step="0.0001" value={formData.longitude || ''} onChange={e => setFormData({...formData, longitude: e.target.value})} required />
            </div>
          </div>
          <div className="pt-6 flex gap-4 border-t border-border/50">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="flex-1 h-12">{t('sites.abort')}</Button>
            <Button type="submit" isLoading={isPending} className="flex-1 h-12 text-md shadow-[0_0_15px_rgba(201,168,76,0.3)]">{t('sites.deployInitialization')}</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}