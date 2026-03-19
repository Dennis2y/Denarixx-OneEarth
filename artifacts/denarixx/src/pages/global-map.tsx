import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
  Siren,
} from "lucide-react";
import { motion } from "framer-motion";
import { ModuleHeader, Card, Badge, Button, cn } from "@/components/ui-core";
import { apiFetch, apiStreamUrl } from "@/lib/api";

type ThreatLevel = "low" | "medium" | "high" | "critical";
type ResponsePriority = "routine" | "priority" | "urgent" | "immediate";

type MapOverview = {
  summary: {
    sites: number;
    activeAlerts: number;
    criticalAlerts: number;
    protectedPersons: number;
    atRiskPersons: number;
    disasterAlerts: number;
    riskZones: number;
    averageThreatScore: number;
    criticalThreatSites: number;
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
    linkedAlertThreatScore: number;
    threatScore: number;
    threatLevel: ThreatLevel;
    responsePriority: ResponsePriority;
    recommendedAction: string;
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
    threatScore: number;
    threatLevel: ThreatLevel;
    responsePriority: ResponsePriority;
    recommendedAction: string;
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

function getThreatColor(level: ThreatLevel) {
  if (level === "critical") return "#dc2626";
  if (level === "high") return "#f59e0b";
  if (level === "medium") return "#60a5fa";
  return "#22c55e";
}

function getThreatBadgeClass(level: ThreatLevel) {
  if (level === "critical") return "bg-red-500/15 text-red-400 border-red-500/30";
  if (level === "high") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  if (level === "medium") return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  return "bg-green-500/15 text-green-400 border-green-500/30";
}

function getPriorityBadgeClass(priority: ResponsePriority) {
  if (priority === "immediate") return "bg-red-500/15 text-red-400 border-red-500/30";
  if (priority === "urgent") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  if (priority === "priority") return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  return "bg-green-500/15 text-green-400 border-green-500/30";
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
    return getThreatColor(site.threatLevel);
  }

  if (filter === "alerts") {
    if (site.criticalAlertsCount > 0) return "#dc2626";
    if (site.activeAlertsCount > 0) return "#f59e0b";
    return "#22c55e";
  }

  return getThreatColor(site.threatLevel);
}

function getSiteRadius(site: MapOverview["sites"][number], filter: FilterKey) {
  if (filter === "lifemesh") return Math.max(8, Math.min(24, 8 + site.atRiskPersonsCount * 2));
  if (filter === "alerts") return Math.max(8, Math.min(24, 8 + site.activeAlertsCount * 2));
  if (filter === "energy") {
    const batt = site.latestEnergy?.batteryLevel ?? 0;
    return batt < 20 ? 22 : batt < 50 ? 16 : 10;
  }

  return Math.max(10, Math.min(24, 10 + Math.round(site.threatScore / 12)));
}

function getDangerCoreRadius(site: MapOverview["sites"][number]) {
  if (site.threatLevel === "critical") return 6;
  if (site.threatLevel === "high") return 4;
  return 0;
}

function getDangerHaloRadius(site: MapOverview["sites"][number]) {
  if (site.threatLevel === "critical") return 14 + Math.round(site.threatScore / 8);
  if (site.threatLevel === "high") return 10 + Math.round(site.threatScore / 12);
  return 0;
}

function hasLiveDanger(site: MapOverview["sites"][number]) {
  return (
    site.threatLevel === "critical" ||
    site.criticalAlertsCount > 0 ||
    site.linkedAlertThreatScore >= 85 ||
    site.atRiskPersonsCount >= 2
  );
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
  const { t } = useTranslation();
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

    stream.addEventListener("connected", () => {
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
    if (filter === "earthshield") return list.filter((s) => s.currentRiskLevel !== "low" || s.threatScore >= 40);
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
      .map((a) => `${a.threatLevel.toUpperCase()} · ${a.module.toUpperCase()} · ${a.title} · SCORE ${a.threatScore} · ${a.location}`)
      .join("  ◆  ");
  }, [data]);

  const resetWorldView = () => {
    mapRef.current?.flyTo(mapCenter, 2, { animate: true, duration: 1.2 });
  };

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">{t("map.loadingGlobalCommandMap")}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <ModuleHeader
        moduleId="earthshield"
        title="Global Command Map"
        subtitle="Live planetary operational awareness with AI threat scoring"
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_0.9fr] gap-6">
        <Card className="overflow-hidden border border-border/60 bg-card/70 backdrop-blur">
          <div className="border-b border-border/50 p-4 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                {filterMeta.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                      filter === key
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowRiskZones((v) => !v)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
                    showRiskZones ? "border-orange-500/30 bg-orange-500/10 text-orange-300" : "border-border/60 text-muted-foreground"
                  )}
                >
                  <TriangleAlert className="w-3.5 h-3.5" />
                  Risk Zones
                </button>

                <button
                  onClick={() => setShowAlertRings((v) => !v)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
                    showAlertRings ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-border/60 text-muted-foreground"
                  )}
                >
                  <Radio className="w-3.5 h-3.5" />
                  Alert Rings
                </button>

                <Button variant="secondary" size="sm" onClick={() => loadOverview(true)} disabled={isRefreshing}>
                  <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
                  Refresh
                </Button>

                <Button variant="secondary" size="sm" onClick={resetWorldView}>
                  <LocateFixed className="w-4 h-4 mr-2" />
                  Reset World View
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="rounded-2xl border border-border/60 bg-background/40 p-3">
                <div className="text-xs text-muted-foreground">{t("map.sites")}</div>
                <div className="text-2xl font-bold">{data?.summary.sites ?? 0}</div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/40 p-3">
                <div className="text-xs text-muted-foreground">{t("map.activeAlerts")}</div>
                <div className="text-2xl font-bold">{data?.summary.activeAlerts ?? 0}</div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/40 p-3">
                <div className="text-xs text-muted-foreground">{t("map.avgThreat")}</div>
                <div className="text-2xl font-bold text-primary">{data?.summary.averageThreatScore ?? 0}</div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/40 p-3">
                <div className="text-xs text-muted-foreground">{t("map.criticalThreatSites")}</div>
                <div className="text-2xl font-bold text-red-400">{data?.summary.criticalThreatSites ?? 0}</div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/40 p-3">
                <div className="text-xs text-muted-foreground">{t("map.protectedPersons")}</div>
                <div className="text-2xl font-bold">{data?.summary.protectedPersons ?? 0}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/40 px-4 py-2 overflow-hidden">
              <div className="flex items-center gap-3 text-xs whitespace-nowrap">
                <Badge className={cn(
                  "border",
                  liveStatus === "live"
                    ? "bg-green-500/15 text-green-400 border-green-500/30"
                    : liveStatus === "connecting"
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    : "bg-red-500/15 text-red-400 border-red-500/30"
                )}>
                  {liveStatus.toUpperCase()}
                </Badge>
                <div className="overflow-hidden flex-1">
                  <div className="animate-marquee inline-block min-w-full text-muted-foreground">
                    {tickerText}  ◆  {lastLiveMessage}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-[68vh] min-h-[540px] bg-[#07111f]">
            <LeafletMapContainer
              center={mapCenter}
              zoom={2}
              scrollWheelZoom={true}
              className="h-full w-full"
              ref={(map) => {
                if (map) mapRef.current = map;
              }}
            >
              <FlyToSite site={selectedSite} />

              <LeafletTileLayer
                attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />

              {showRiskZones && visibleRiskZones.map((zone) => (
                <LeafletCircle
                  key={`zone-${zone.id}`}
                  center={[zone.latitude, zone.longitude]}
                  radius={getRiskZoneRadius(zone.preparednessScore)}
                  pathOptions={{
                    color: getRiskZoneColor(zone.riskLevel),
                    weight: 2,
                    fillOpacity: 0.08,
                  }}
                >
                  <LeafletPopup>
                    <div className="space-y-1 text-sm">
                      <div className="font-semibold">{zone.name}</div>
                      <div>{zone.region}, {zone.country}</div>
                      <div>Risk: {zone.riskLevel}</div>
                      <div>Preparedness: {zone.preparednessScore}%</div>
                    </div>
                  </LeafletPopup>
                </LeafletCircle>
              ))}

              {sites.map((site) => {
                const color = getSiteColor(site, filter);
                const radius = getSiteRadius(site, filter);
                const shouldPulseRing = showAlertRings && hasLiveDanger(site);
                const dangerCoreRadius = getDangerCoreRadius(site);
                const dangerHaloRadius = getDangerHaloRadius(site);

                return (
                  <React.Fragment key={site.id}>
                    {shouldPulseRing && (
                      <>
                        <LeafletCircle
                          center={[site.latitude, site.longitude]}
                          radius={110000 + site.threatScore * 1200}
                          pathOptions={{
                            color: site.threatLevel === "critical" ? "#ef4444" : color,
                            weight: 2,
                            opacity: 0.75,
                            fillOpacity: 0.04,
                          }}
                        />
                        <LeafletCircle
                          center={[site.latitude, site.longitude]}
                          radius={55000 + site.threatScore * 700}
                          pathOptions={{
                            color: site.threatLevel === "critical" ? "#f87171" : color,
                            weight: 1.5,
                            opacity: 0.55,
                            fillOpacity: 0.05,
                          }}
                        />
                      </>
                    )}

                    {dangerHaloRadius > 0 && (
                      <LeafletCircleMarker
                        center={[site.latitude, site.longitude]}
                        radius={dangerHaloRadius}
                        pathOptions={{
                          color: site.threatLevel === "critical" ? "#ef4444" : "#f59e0b",
                          weight: 1.5,
                          fillColor: site.threatLevel === "critical" ? "#ef4444" : "#f59e0b",
                          fillOpacity: 0.12,
                          opacity: 0.9,
                        }}
                        eventHandlers={{
                          click: () => setSelectedSiteId(site.id),
                        }}
                      />
                    )}

                    <LeafletCircleMarker
                      center={[site.latitude, site.longitude]}
                      radius={radius}
                      pathOptions={{
                        color,
                        weight: selectedSite?.id === site.id ? 3 : 2,
                        fillColor: color,
                        fillOpacity: 0.92,
                      }}
                      eventHandlers={{
                        click: () => setSelectedSiteId(site.id),
                      }}
                    >
                      <LeafletPopup>
                        <div className="min-w-[230px] space-y-2 text-sm">
                          <div className="font-semibold">{site.name}</div>
                          <div>{site.location}, {site.country}</div>
                          <div className="flex flex-wrap gap-2">
                            <Badge className={cn("border", getThreatBadgeClass(site.threatLevel))}>
                              {site.threatLevel.toUpperCase()}
                            </Badge>
                            <Badge className={cn("border", getPriorityBadgeClass(site.responsePriority))}>
                              {site.responsePriority.toUpperCase()}
                            </Badge>
                          </div>
                          <div>Threat Score: <span className="font-semibold">{site.threatScore}</span></div>
                          <div>Status: {site.status}</div>
                          <div>Risk Level: {site.currentRiskLevel}</div>
                          <div>Population: {site.population.toLocaleString()}</div>
                          <div>Recommended: {site.recommendedAction}</div>
                        </div>
                      </LeafletPopup>
                    </LeafletCircleMarker>

                    {dangerCoreRadius > 0 && (
                      <LeafletCircleMarker
                        center={[site.latitude, site.longitude]}
                        radius={dangerCoreRadius}
                        pathOptions={{
                          color: "#ffe4e6",
                          weight: 1,
                          fillColor: "#ef4444",
                          fillOpacity: 1,
                          opacity: 1,
                        }}
                        eventHandlers={{
                          click: () => setSelectedSiteId(site.id),
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </LeafletMapContainer>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="border border-border/60 bg-card/70 backdrop-blur">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{t("map.selectedSiteIntelligence")}</div>
                <div className="text-xs text-muted-foreground">{t("map.aiScoredThreatPanel")}</div>
              </div>
              {selectedSite && (
                <Badge className={cn("border", getThreatBadgeClass(selectedSite.threatLevel))}>
                  {selectedSite.threatLevel.toUpperCase()}
                </Badge>
              )}
            </div>

            <div className="p-4 space-y-4">
              {!selectedSite ? (
                <div className="text-sm text-muted-foreground">{t("map.noSiteSelected")}</div>
              ) : (
                <>
                  <div>
                    <div className="text-lg font-semibold">{selectedSite.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedSite.location}, {selectedSite.country}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                      <div className="text-xs text-muted-foreground">{t("command.threatScore")}</div>
                      <div className="text-2xl font-bold text-primary">{selectedSite.threatScore}</div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                      <div className="text-xs text-muted-foreground">{t("map.priority")}</div>
                      <div className="text-lg font-bold">{selectedSite.responsePriority}</div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                      <div className="text-xs text-muted-foreground">{t("map.linkedAlertScore")}</div>
                      <div className="text-2xl font-bold">{selectedSite.linkedAlertThreatScore}</div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                      <div className="text-xs text-muted-foreground">{t("command.atRiskPersons")}</div>
                      <div className="text-2xl font-bold">{selectedSite.atRiskPersonsCount}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={cn("border", getThreatBadgeClass(selectedSite.threatLevel))}>
                      Threat: {selectedSite.threatLevel}
                    </Badge>
                    <Badge className={cn("border", getPriorityBadgeClass(selectedSite.responsePriority))}>
                      Priority: {selectedSite.responsePriority}
                    </Badge>
                    <Badge className="border border-border/60 bg-background/40">
                      {selectedSite.type}
                    </Badge>
                    <Badge className="border border-border/60 bg-background/40">
                      Status: {selectedSite.status}
                    </Badge>
                  </div>

                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                    <div className="text-xs uppercase tracking-widest text-primary mb-2">Recommended Action</div>
                    <div className="text-sm">{selectedSite.recommendedAction}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                      <div className="text-xs text-muted-foreground">{t("map.population")}</div>
                      <div className="font-semibold">{selectedSite.population.toLocaleString()}</div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                      <div className="text-xs text-muted-foreground">{t("map.powerAvailability")}</div>
                      <div className="font-semibold">{selectedSite.powerAvailability}%</div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                      <div className="text-xs text-muted-foreground">{t("map.protectedPersons")}</div>
                      <div className="font-semibold">{selectedSite.protectedPersonsCount}</div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                      <div className="text-xs text-muted-foreground">{t("map.criticalAlerts")}</div>
                      <div className="font-semibold">{selectedSite.criticalAlertsCount}</div>
                    </div>
                  </div>

                  {selectedSite.latestEnergy && (
                    <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                      <div className="text-sm font-semibold mb-3">Latest Energy Snapshot</div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>Battery: <span className="font-semibold">{selectedSite.latestEnergy.batteryLevel}%</span></div>
                        <div>Solar: <span className="font-semibold">{selectedSite.latestEnergy.solarGeneration}%</span></div>
                        <div>Load: <span className="font-semibold">{selectedSite.latestEnergy.communityLoad}%</span></div>
                        <div>Grid: <span className="font-semibold">{selectedSite.latestEnergy.gridStatus}</span></div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setLocation(`/sites/${selectedSite.id}`)}>
                      <MapPin className="w-4 h-4 mr-2" />
                      Open Site Detail
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card className="border border-border/60 bg-card/70 backdrop-blur">
            <div className="p-4 border-b border-border/50">
              <div className="text-sm font-semibold">{t("map.liveCommandSummary")}</div>
              <div className="text-xs text-muted-foreground">{t("map.moduleStatusAtGlance")}</div>
            </div>

            <div className="p-4 space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-3">
                <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> Energy</div>
                <div className="text-right">
                  <div>{moduleSummary.energy.unstable} unstable</div>
                  <div className="text-xs text-muted-foreground">{moduleSummary.energy.offline} offline</div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-3">
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-green-400" /> LifeMesh</div>
                <div className="text-right">
                  <div>{moduleSummary.lifemesh.protected} tracked</div>
                  <div className="text-xs text-muted-foreground">{moduleSummary.lifemesh.atRisk} at risk</div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-3">
                <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-blue-400" /> EarthShield</div>
                <div className="text-right">
                  <div>{moduleSummary.earthshield.zones} zones</div>
                  <div className="text-xs text-muted-foreground">{moduleSummary.earthshield.critical} critical</div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-3">
                <div className="flex items-center gap-2"><Bell className="w-4 h-4 text-red-400" /> Alerts</div>
                <div className="text-right">
                  <div>{moduleSummary.alerts.active} active</div>
                  <div className="text-xs text-muted-foreground">{moduleSummary.alerts.critical} critical</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border border-border/60 bg-card/70 backdrop-blur">
            <div className="p-4 border-b border-border/50">
              <div className="text-sm font-semibold">{t("map.threatLegend")}</div>
              <div className="text-xs text-muted-foreground">{t("map.aiScoringGuidance")}</div>
            </div>

            <div className="p-4 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-muted-foreground">{t("map.lowThreat")}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-400" />
                <span className="text-muted-foreground">{t("map.mediumThreat")}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">{t("map.highThreat")}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-muted-foreground">{t("map.criticalThreat")}</span>
              </div>
              <div className="flex items-center gap-3">
                <Siren className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">{t("map.markerSize")}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_16px_rgba(239,68,68,0.95)]" />
                <span className="text-muted-foreground">{t("map.hotspotCores")}</span>
              </div>
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">{t("map.rings")}</span>
              </div>
              <div className="flex items-center gap-3">
                <TriangleAlert className="w-4 h-4 text-orange-400" />
                <span className="text-muted-foreground">{t("map.overlays")}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
