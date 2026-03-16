import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import "leaflet/dist/leaflet.css";
import {
  MapContainer as LeafletMapContainer,
  TileLayer as LeafletTileLayer,
  CircleMarker as LeafletCircleMarker,
  Popup as LeafletPopup,
  Circle as LeafletCircle,
  useMap,
} from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import {
  Globe,
  RefreshCw,
  Shield,
  Zap,
  Bell,
  Users,
  AlertTriangle,
  MapPin,
  Radio,
  LocateFixed,
  Activity,
  TriangleAlert,
} from "lucide-react";
import { motion } from "framer-motion";
import { ModuleHeader, Card, Badge, Button, cn } from "@/components/ui-core";
import { apiFetch, apiStreamUrl } from "@/lib/api";

type MapOverview = {
  summary: {
    sites: number;
    activeAlerts: number;
    criticalAlerts: number;
    protectedPersons: number;
    atRiskPersons: number;
    disasterAlerts: number;
    riskZones: number;
  };
  sites: Array<{
    id: number;
    name: string;
    type: string;
    location: string;
    country: string;
    status: string;
    currentRiskLevel: string;
    powerAvailability: number;
    uptime: number;
    population: number;
    latitude: number;
    longitude: number;
    activeAlertsCount: number;
    criticalAlertsCount: number;
    protectedPersonsCount: number;
    atRiskPersonsCount: number;
    latestEnergy: {
      solarGeneration: number;
      batteryLevel: number;
      communityLoad: number;
      gridStatus: string;
      uptime: number;
      recordedAt: string;
    } | null;
  }>;
  alerts: Array<{
    id: number;
    title: string;
    module: string;
    severity: string;
    status: string;
    location: string;
    description: string;
    createdAt: string;
  }>;
  persons: Array<{
    id: number;
    name: string;
    age: number;
    category: string;
    status: string;
    siteId: number;
  }>;
  disasterAlerts: Array<{
    id: number;
    type: string;
    title: string;
    severity: string;
    region: string;
    country: string;
    affectedPopulation: number;
    issuedAt: string;
  }>;
  riskZones: Array<{
    id: number;
    name: string;
    type: string;
    country: string;
    region: string;
    riskLevel: string;
    preparednessScore: number;
    latitude: number;
    longitude: number;
  }>;
  generatedAt: string;
};

type FilterKey = "all" | "energy" | "lifemesh" | "earthshield" | "alerts";

const mapCenter: [number, number] = [12, 15];

function FlyToSite({ site }: { site: MapOverview["sites"][number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (!site) return;
    map.flyTo([site.latitude, site.longitude], Math.max(map.getZoom(), 5), {
      animate: true,
      duration: 1.2,
    });
  }, [map, site]);

  return null;
}

function getSiteColor(site: MapOverview["sites"][number], filter: FilterKey) {
  if (filter === "energy") {
    const grid = site.latestEnergy?.gridStatus ?? "stable";
    if (grid === "offline") return "#dc2626";
    if (grid === "unstable") return "#f59e0b";
    return "#c9a84c";
  }

  if (filter === "lifemesh") {
    if (site.atRiskPersonsCount > 0) return "#ef4444";
    if (site.protectedPersonsCount > 0) return "#22c55e";
    return "#64748b";
  }

  if (filter === "earthshield") {
    if (site.currentRiskLevel === "critical") return "#dc2626";
    if (site.currentRiskLevel === "high") return "#f59e0b";
    if (site.currentRiskLevel === "medium") return "#60a5fa";
    return "#22c55e";
  }

  if (filter === "alerts") {
    if (site.criticalAlertsCount > 0) return "#dc2626";
    if (site.activeAlertsCount > 0) return "#f59e0b";
    return "#22c55e";
  }

  if (site.criticalAlertsCount > 0 || site.currentRiskLevel === "critical") return "#dc2626";
  if (site.activeAlertsCount > 0 || site.currentRiskLevel === "high") return "#f59e0b";
  return "#c9a84c";
}

function getSiteRadius(site: MapOverview["sites"][number], filter: FilterKey) {
  if (filter === "lifemesh") return Math.max(8, Math.min(24, 8 + site.atRiskPersonsCount * 2));
  if (filter === "alerts") return Math.max(8, Math.min(24, 8 + site.activeAlertsCount * 2));
  if (filter === "energy") {
    const batt = site.latestEnergy?.batteryLevel ?? 0;
    return batt < 20 ? 22 : batt < 50 ? 16 : 10;
  }
  return Math.max(8, Math.min(22, 10 + site.criticalAlertsCount * 3));
}

function getRiskZoneColor(riskLevel: string) {
  if (riskLevel === "critical") return "#dc2626";
  if (riskLevel === "high") return "#f59e0b";
  if (riskLevel === "medium") return "#60a5fa";
  return "#22c55e";
}

function getRiskZoneRadius(score: number) {
  const deficit = 100 - score;
  return Math.max(50000, Math.min(280000, deficit * 3200));
}

export default function GlobalMap() {
  const [, setLocation] = useLocation();
  const mapRef = useRef<LeafletMap | null>(null);

  const [data, setData] = useState<MapOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [showRiskZones, setShowRiskZones] = useState(true);
  const [showAlertRings, setShowAlertRings] = useState(true);
  const [liveStatus, setLiveStatus] = useState<"connecting" | "live" | "disconnected">("connecting");
  const [lastLiveMessage, setLastLiveMessage] = useState("Connecting to global live stream...");

  const loadOverview = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      const json = await apiFetch("/api/map/overview");
      setData(json);
    } catch {
      if (!silent) setData(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadOverview(false);
  }, []);

  useEffect(() => {
    const stream = new EventSource(apiStreamUrl("/api/live/stream"), { withCredentials: true });

    stream.addEventListener("connected", (event: MessageEvent) => {
      setLiveStatus("live");
      setLastLiveMessage("Live stream connected");
    });

    stream.addEventListener("heartbeat", () => {
      setLiveStatus("live");
    });

    stream.addEventListener("map-update", async (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        setLiveStatus("live");
        setLastLiveMessage(payload?.message ?? "Global command update received");
        await loadOverview(true);
      } catch {
        await loadOverview(true);
      }
    });

    stream.onerror = () => {
      setLiveStatus("disconnected");
      setLastLiveMessage("Live stream disconnected — retrying");
    };

    return () => {
      stream.close();
    };
  }, []);

  const sites = useMemo(() => {
    const list = data?.sites ?? [];
    if (filter === "energy") return list.filter((s) => !!s.latestEnergy);
    if (filter === "lifemesh") return list.filter((s) => s.protectedPersonsCount > 0);
    if (filter === "earthshield") return list.filter((s) => s.currentRiskLevel !== "low");
    if (filter === "alerts") return list.filter((s) => s.activeAlertsCount > 0);
    return list;
  }, [data, filter]);

  const visibleRiskZones = useMemo(() => {
    const list = data?.riskZones ?? [];
    const sorted = [...list].sort((a, b) => {
      const order = { critical: 3, high: 2, medium: 1, low: 0 };
      return (order[b.riskLevel as keyof typeof order] ?? 0) - (order[a.riskLevel as keyof typeof order] ?? 0);
    });
    if (filter === "earthshield" || filter === "all") return sorted;
    return [];
  }, [data, filter]);

  const selectedSite = useMemo(
    () => sites.find((s) => s.id === selectedSiteId) ?? sites[0] ?? null,
    [sites, selectedSiteId]
  );

  const filterMeta = [
    { key: "all" as FilterKey, label: "All Systems", icon: Globe },
    { key: "energy" as FilterKey, label: "Energy", icon: Zap },
    { key: "lifemesh" as FilterKey, label: "LifeMesh", icon: Users },
    { key: "earthshield" as FilterKey, label: "EarthShield", icon: Shield },
    { key: "alerts" as FilterKey, label: "Alerts", icon: Bell },
  ];

  const moduleSummary = useMemo(() => {
    const allSites = data?.sites ?? [];
    const alerts = data?.alerts ?? [];
    const persons = data?.persons ?? [];

    return {
      energy: {
        unstable: allSites.filter((s) => s.latestEnergy?.gridStatus === "unstable").length,
        offline: allSites.filter((s) => s.latestEnergy?.gridStatus === "offline").length,
      },
      lifemesh: {
        protected: persons.length,
        atRisk: persons.filter((p) => p.status === "at-risk" || p.status === "emergency").length,
      },
      earthshield: {
        zones: (data?.riskZones ?? []).length,
        critical: (data?.riskZones ?? []).filter((z) => z.riskLevel === "critical").length,
      },
      alerts: {
        active: alerts.length,
        critical: alerts.filter((a) => a.severity === "critical").length,
      },
    };
  }, [data]);

  const tickerText = useMemo(() => {
    const alerts = (data?.alerts ?? []).slice(0, 8);
    if (!alerts.length) return "NO ACTIVE GLOBAL ALERT SIGNALS";
    return alerts
      .map((a) => `${a.severity.toUpperCase()} · ${a.module.toUpperCase()} · ${a.title} · ${a.location}`)
      .join("  ◆  ");
  }, [data]);

  const resetWorldView = () => {
    mapRef.current?.flyTo(mapCenter, 2, { animate: true, duration: 1.2 });
  };

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading global command map...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
      <ModuleHeader
        title="Global Earth Map"
        subtitle="Live geospatial command surface for Denarixx OneEarth — infrastructure, safety, alerts, and planetary risk visibility."
        classification="RESTRICTED // GLOBAL COMMAND VIEW"
        moduleId="DNX-MAP-001"
        status="active"
        actions={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-primary/20 bg-primary/5">
              <Radio
                className={cn(
                  "w-4 h-4",
                  liveStatus === "live" ? "text-primary" : liveStatus === "connecting" ? "text-amber-400 animate-pulse" : "text-destructive"
                )}
              />
              <span className={cn(
                "text-xs font-bold uppercase tracking-widest",
                liveStatus === "live" ? "text-primary" : liveStatus === "connecting" ? "text-amber-400" : "text-destructive"
              )}>
                {liveStatus}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={resetWorldView}>
              <LocateFixed className="w-4 h-4 mr-2" />
              World View
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadOverview(true)} disabled={isRefreshing}>
              <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        }
      />

      <Card className="p-3 mb-4 border-border/40 bg-secondary/20">
        <div className="flex items-center gap-2 text-xs">
          <Activity className={cn(
            "w-4 h-4",
            liveStatus === "live" ? "text-green-400" : liveStatus === "connecting" ? "text-amber-400" : "text-destructive"
          )} />
          <span className="text-muted-foreground">{lastLiveMessage}</span>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
        {[
          { label: "Sites", value: data?.summary.sites ?? 0, color: "text-primary", icon: MapPin },
          { label: "Active Alerts", value: data?.summary.activeAlerts ?? 0, color: "text-amber-400", icon: Bell },
          { label: "Critical Alerts", value: data?.summary.criticalAlerts ?? 0, color: "text-destructive", icon: AlertTriangle },
          { label: "Protected People", value: data?.summary.protectedPersons ?? 0, color: "text-blue-400", icon: Users },
          { label: "At Risk", value: data?.summary.atRiskPersons ?? 0, color: "text-destructive", icon: Shield },
          { label: "Disaster Alerts", value: data?.summary.disasterAlerts ?? 0, color: "text-orange-400", icon: Globe },
          { label: "Risk Zones", value: data?.summary.riskZones ?? 0, color: "text-green-400", icon: Radio },
        ].map((item) => (
          <Card key={item.label} className="p-4 bg-secondary/20 border-border/50">
            <div className="flex items-center justify-between mb-2">
              <item.icon className={cn("w-4 h-4", item.color)} />
              <span className={cn("text-2xl font-display font-bold", item.color)}>{item.value}</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{item.label}</div>
          </Card>
        ))}
      </div>

      <Card className="p-0 mb-6 overflow-hidden border-primary/15 bg-secondary/20">
        <div className="flex items-center h-9 border-b border-border/30 overflow-hidden">
          <div className="shrink-0 px-3 h-full flex items-center bg-primary/10 border-r border-primary/20">
            <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">Global Feed</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="animate-marquee whitespace-nowrap text-[11px] font-mono text-muted-foreground inline-block px-4">
              {tickerText}{"  ◆  "}{tickerText}
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap gap-2 mb-3">
            {filterMeta.map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={cn(
                  "px-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                  filter === item.key
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_14px_rgba(201,168,76,0.28)]"
                    : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-white"
                )}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowRiskZones((v) => !v)}
              className={cn(
                "px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all",
                showRiskZones
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                  : "border-border/50 text-muted-foreground"
              )}
            >
              Risk Zones
            </button>

            <button
              onClick={() => setShowAlertRings((v) => !v)}
              className={cn(
                "px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all",
                showAlertRings
                  ? "bg-destructive/10 text-destructive border-destructive/30"
                  : "border-border/50 text-muted-foreground"
              )}
            >
              Alert Rings
            </button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Energy</span>
          </div>
          <div className="text-sm text-white font-bold">Offline: {moduleSummary.energy.offline}</div>
          <div className="text-xs text-muted-foreground">Unstable: {moduleSummary.energy.unstable}</div>
        </Card>

        <Card className="p-4 bg-green-500/5 border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-green-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">LifeMesh</span>
          </div>
          <div className="text-sm text-white font-bold">Protected: {moduleSummary.lifemesh.protected}</div>
          <div className="text-xs text-muted-foreground">At Risk: {moduleSummary.lifemesh.atRisk}</div>
        </Card>

        <Card className="p-4 bg-blue-500/5 border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">EarthShield</span>
          </div>
          <div className="text-sm text-white font-bold">Zones: {moduleSummary.earthshield.zones}</div>
          <div className="text-xs text-muted-foreground">Critical: {moduleSummary.earthshield.critical}</div>
        </Card>

        <Card className="p-4 bg-destructive/5 border-destructive/20">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-destructive" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-destructive">Alerts</span>
          </div>
          <div className="text-sm text-white font-bold">Active: {moduleSummary.alerts.active}</div>
          <div className="text-xs text-muted-foreground">Critical: {moduleSummary.alerts.critical}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_0.9fr] gap-6">
        <Card className="p-0 overflow-hidden border-border/50">
          <div className="h-[68vh] min-h-[520px] w-full">
            <LeafletMapContainer
              center={mapCenter}
              zoom={2}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
              ref={(instance) => {
                if (instance) mapRef.current = instance;
              }}
            >
              <FlyToSite site={selectedSite} />

              <LeafletTileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {showRiskZones && visibleRiskZones.map((zone) => {
                const color = getRiskZoneColor(zone.riskLevel);
                return (
                  <LeafletCircle
                    key={`risk-${zone.id}`}
                    center={[zone.latitude, zone.longitude]}
                    radius={getRiskZoneRadius(zone.preparednessScore)}
                    pathOptions={{
                      color,
                      weight: zone.riskLevel === "critical" ? 3 : 2,
                      fillColor: color,
                      fillOpacity: zone.riskLevel === "critical" ? 0.12 : 0.08,
                    }}
                  >
                    <LeafletPopup>
                      <div className="min-w-[220px]">
                        <div className="font-bold text-sm mb-1">{zone.name}</div>
                        <div className="text-xs mb-1">{zone.region}, {zone.country}</div>
                        <div className="text-xs">Risk: {zone.riskLevel} · Preparedness: {zone.preparednessScore}/100</div>
                      </div>
                    </LeafletPopup>
                  </LeafletCircle>
                );
              })}

              {sites.map((site) => {
                const color = getSiteColor(site, filter);
                const radius = getSiteRadius(site, filter);

                return (
                  <React.Fragment key={site.id}>
                    {showAlertRings && site.criticalAlertsCount > 0 && (
                      <LeafletCircle
                        center={[site.latitude, site.longitude]}
                        radius={120000 + site.criticalAlertsCount * 50000}
                        pathOptions={{
                          color: "#dc2626",
                          weight: 2,
                          fillColor: "#dc2626",
                          fillOpacity: 0.06,
                        }}
                      />
                    )}

                    {showAlertRings && site.activeAlertsCount > 0 && site.criticalAlertsCount === 0 && (
                      <LeafletCircle
                        center={[site.latitude, site.longitude]}
                        radius={90000 + site.activeAlertsCount * 35000}
                        pathOptions={{
                          color: "#f59e0b",
                          weight: 2,
                          fillColor: "#f59e0b",
                          fillOpacity: 0.05,
                        }}
                      />
                    )}

                    <LeafletCircleMarker
                      center={[site.latitude, site.longitude]}
                      radius={radius}
                      pathOptions={{
                        color,
                        weight: selectedSiteId === site.id ? 4 : 2,
                        fillColor: color,
                        fillOpacity: 0.6,
                      }}
                      eventHandlers={{
                        click: () => setSelectedSiteId(site.id),
                      }}
                    >
                      <LeafletPopup>
                        <div className="min-w-[220px]">
                          <div className="font-bold text-sm mb-1">{site.name}</div>
                          <div className="text-xs mb-1">{site.location}, {site.country}</div>
                          <div className="text-xs mb-2">
                            Alerts: {site.activeAlertsCount} · At Risk: {site.atRiskPersonsCount}
                          </div>
                          <button
                            onClick={() => setLocation(`/sites/${site.id}`)}
                            className="text-xs font-bold underline"
                          >
                            Open site detail
                          </button>
                        </div>
                      </LeafletPopup>
                    </LeafletCircleMarker>
                  </React.Fragment>
                );
              })}
            </LeafletMapContainer>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5 border-border/50 bg-secondary/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-display font-bold text-white uppercase tracking-widest">
                Selected Site
              </h3>
              {selectedSite && (
                <Badge
                  variant={
                    selectedSite.currentRiskLevel === "critical"
                      ? "critical"
                      : selectedSite.currentRiskLevel === "high"
                      ? "warning"
                      : "safe"
                  }
                  className="bg-transparent capitalize"
                >
                  {selectedSite.currentRiskLevel}
                </Badge>
              )}
            </div>

            {selectedSite ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xl font-display font-bold text-white">{selectedSite.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedSite.location}, {selectedSite.country}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/50 bg-card/50 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Alerts</div>
                    <div className="text-lg font-bold text-white">{selectedSite.activeAlertsCount}</div>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-card/50 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">At Risk</div>
                    <div className="text-lg font-bold text-white">{selectedSite.atRiskPersonsCount}</div>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-card/50 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Population</div>
                    <div className="text-lg font-bold text-white">{selectedSite.population.toLocaleString()}</div>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-card/50 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Power</div>
                    <div className="text-lg font-bold text-primary">{selectedSite.powerAvailability}%</div>
                  </div>
                </div>

                {selectedSite.latestEnergy && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                    <div className="text-[10px] uppercase tracking-widest text-primary font-bold mb-3">
                      Energy Telemetry
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Battery</span>
                        <span className="text-white font-bold">{selectedSite.latestEnergy.batteryLevel}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Solar</span>
                        <span className="text-white font-bold">{selectedSite.latestEnergy.solarGeneration} kW</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Grid</span>
                        <span className="text-white font-bold capitalize">{selectedSite.latestEnergy.gridStatus}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => setLocation(`/sites/${selectedSite.id}`)}>
                    Open Site Detail
                  </Button>
                  <Button variant="outline" onClick={() => setLocation("/alerts")}>
                    Alerts
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No site in current filter scope.</div>
            )}
          </Card>

          <Card className="p-5 border-border/50 bg-secondary/20">
            <h3 className="text-sm font-display font-bold text-white uppercase tracking-widest mb-4">
              Active Nodes
            </h3>
            <div className="space-y-2">
              {sites.slice(0, 8).map((site) => (
                <button
                  key={site.id}
                  onClick={() => setSelectedSiteId(site.id)}
                  className={cn(
                    "w-full text-left rounded-xl border p-3 transition-all",
                    selectedSiteId === site.id
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/40 bg-card/40 hover:border-primary/20"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">{site.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{site.location}, {site.country}</div>
                    </div>
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: getSiteColor(site, filter) }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5 border-border/50 bg-secondary/20">
            <h3 className="text-sm font-display font-bold text-white uppercase tracking-widest mb-4">
              Planetary Risk Layer
            </h3>
            <div className="space-y-2">
              {(visibleRiskZones ?? []).slice(0, 6).map((zone) => (
                <div key={zone.id} className="rounded-xl border border-border/40 bg-card/40 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">{zone.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{zone.region}, {zone.country}</div>
                    </div>
                    <div className="text-xs font-bold" style={{ color: getRiskZoneColor(zone.riskLevel) }}>
                      {zone.preparednessScore}/100
                    </div>
                  </div>
                </div>
              ))}
              {visibleRiskZones.length === 0 && (
                <div className="text-sm text-muted-foreground">No risk-zone overlays in current scope.</div>
              )}
            </div>
          </Card>

          <Card className="p-5 border-border/50 bg-secondary/20">
            <h3 className="text-sm font-display font-bold text-white uppercase tracking-widest mb-4">
              Legend
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-muted-foreground">Critical / severe command signal</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">Warning / unstable operational state</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-400" />
                <span className="text-muted-foreground">Medium risk / monitored zone</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Nominal / protected / healthy state</span>
              </div>
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Rings indicate expanding live incident influence</span>
              </div>
              <div className="flex items-center gap-3">
                <TriangleAlert className="w-4 h-4 text-orange-400" />
                <span className="text-muted-foreground">Risk overlays visualize broader planetary threat areas</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
