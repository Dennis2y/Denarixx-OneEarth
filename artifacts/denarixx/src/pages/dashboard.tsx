import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import "leaflet/dist/leaflet.css";
import {
  MapContainer as LeafletMapContainer,
  TileLayer as LeafletTileLayer,
  CircleMarker as LeafletCircleMarker,
  Circle as LeafletCircle,
  Popup as LeafletPopup,
} from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import {
  Shield,
  Bell,
  Siren,
  RefreshCw,
  MapPin,
  Globe,
  Activity,
  TriangleAlert,
  LocateFixed,
} from "lucide-react";
import { PageHeader, Card, Badge, Button, cn } from "@/components/ui-core";
import { apiFetch, apiStreamUrl } from "@/lib/api";

type ThreatLevel = "low" | "medium" | "high" | "critical";
type ResponsePriority = "routine" | "priority" | "urgent" | "immediate";

type QueueItem = {
  kind: "alert" | "site";
  id: number;
  title: string;
  location: string;
  threatScore: number;
  threatLevel: ThreatLevel;
  responsePriority: ResponsePriority;
  recommendedAction: string;
};

type ThreatSite = {
  id: number;
  name: string;
  type: string;
  location: string;
  country: string;
  status: string;
  currentRiskLevel: string;
  powerAvailability: number;
  population: number;
  threatScore: number;
  threatLevel: ThreatLevel;
  responsePriority: ResponsePriority;
  recommendedAction: string;
};

type DashboardStats = {
  totalSites: number;
  activeSites: number;
  activeAlerts: number;
  criticalAlerts: number;
  protectedPeople: number;
  protectedPersons: number;
  atRiskPeople: number;
  energyAvailability: number;
  disasterAlerts: number;
  criticalThreatSites: number;
  averageThreatScore: number;
  topThreatSites: ThreatSite[];
  urgentQueue: QueueItem[];
  recentAlerts: Array<{
    id: number;
    title: string;
    module: string;
    severity: string;
    status: string;
    location: string;
    threatScore: number;
    threatLevel: ThreatLevel;
    responsePriority: ResponsePriority;
    recommendedAction: string;
  }>;
};

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

const mapCenter: [number, number] = [12, 15];

function threatClass(level: ThreatLevel) {
  if (level === "critical") return "bg-red-500/15 text-red-400 border-red-500/30";
  if (level === "high") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  if (level === "medium") return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  return "bg-green-500/15 text-green-400 border-green-500/30";
}

function priorityClass(priority: ResponsePriority) {
  if (priority === "immediate") return "bg-red-500/15 text-red-400 border-red-500/30";
  if (priority === "urgent") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  if (priority === "priority") return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  return "bg-green-500/15 text-green-400 border-green-500/30";
}

function getThreatColor(level: ThreatLevel) {
  if (level === "critical") return "#dc2626";
  if (level === "high") return "#f59e0b";
  if (level === "medium") return "#60a5fa";
  return "#22c55e";
}

function getMarkerRadius(score: number) {
  return Math.max(8, Math.min(22, 8 + Math.round(score / 10)));
}

function getHaloRadius(score: number, level: ThreatLevel) {
  if (level === "critical") return 14 + Math.round(score / 8);
  if (level === "high") return 10 + Math.round(score / 12);
  return 0;
}

function getZoneColor(level: string) {
  if (level === "critical") return "#dc2626";
  if (level === "high") return "#f59e0b";
  if (level === "medium") return "#60a5fa";
  return "#22c55e";
}

function getZoneRadius(score: number) {
  const deficit = 100 - score;
  return Math.max(50000, Math.min(240000, deficit * 3000));
}

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const mapRef = useRef<LeafletMap | null>(null);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [mapData, setMapData] = useState<MapOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liveStatus, setLiveStatus] = useState<"connecting" | "live" | "disconnected">("connecting");
  const [lastLiveMessage, setLastLiveMessage] = useState("Connecting to live dashboard globe...");

  const loadAll = async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      const [dashboardJson, mapJson] = await Promise.all([
        apiFetch("/api/dashboard/stats"),
        apiFetch("/api/map/overview"),
      ]);

      setStats(dashboardJson as DashboardStats);
      setMapData(mapJson as MapOverview);
    } catch {
      if (!silent) {
        setStats(null);
        setMapData(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAll(false);
  }, []);

  useEffect(() => {
    const stream = new EventSource(apiStreamUrl("/api/live/stream"), { withCredentials: true });

    stream.addEventListener("connected", () => {
      setLiveStatus("live");
      setLastLiveMessage("Dashboard live stream connected");
    });

    stream.addEventListener("heartbeat", () => {
      setLiveStatus("live");
    });

    stream.addEventListener("map-update", async (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        setLiveStatus("live");
        setLastLiveMessage(payload?.message ?? "Live command update received");
        await loadAll(true);
      } catch {
        await loadAll(true);
      }
    });

    stream.onerror = () => {
      setLiveStatus("disconnected");
      setLastLiveMessage("Live stream disconnected — retrying");
    };

    return () => stream.close();
  }, []);

  const overview = useMemo(() => {
    if (!stats) {
      return {
        averageThreatScore: 0,
        criticalThreatSites: 0,
        urgentQueue: 0,
        activeAlerts: 0,
      };
    }

    return {
      averageThreatScore: stats.averageThreatScore,
      criticalThreatSites: stats.criticalThreatSites,
      urgentQueue: stats.urgentQueue.length,
      activeAlerts: stats.activeAlerts,
    };
  }, [stats]);

  const mapSites = useMemo(() => {
    return (mapData?.sites ?? [])
      .slice()
      .sort((a, b) => b.threatScore - a.threatScore);
  }, [mapData]);

  const dangerTicker = useMemo(() => {
    const alerts = (mapData?.alerts ?? []).slice(0, 6);
    if (!alerts.length) return "NO ACTIVE LIVE GLOBAL THREAT SIGNALS";
    return alerts
      .map((a) => `${a.threatLevel.toUpperCase()} · ${a.title} · ${a.location} · SCORE ${a.threatScore}`)
      .join("  ◆  ");
  }, [mapData]);

  const resetWorldView = () => {
    mapRef.current?.flyTo(mapCenter, 2, { animate: true, duration: 1.2 });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Command Dashboard"
        description="Executive AI threat overview with live global danger globe"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => loadAll(true)} disabled={refreshing}>
              <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/global-map")}>
              <MapPin className="w-4 h-4 mr-2" />
              Open Full Map
            </Button>
          </div>
        }
      />

      <Card className="overflow-hidden border border-border/60 bg-card/70 backdrop-blur">
        <div className="border-b border-border/50 p-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                <div className="text-sm font-semibold">Live Global Threat Globe</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Red hotspot cores and live rings mark immediate danger locations
              </div>
            </div>

            <div className="flex items-center gap-2">
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

              <Button variant="secondary" size="sm" onClick={resetWorldView}>
                <LocateFixed className="w-4 h-4 mr-2" />
                Reset View
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/40 px-4 py-2 overflow-hidden">
            <div className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden">
              {dangerTicker}  ◆  {lastLiveMessage}
            </div>
          </div>
        </div>

        <div className="h-[420px] bg-[#07111f]">
          {!mapData ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              {loading ? "Loading live global globe..." : "Unable to load globe data"}
            </div>
          ) : (
            <LeafletMapContainer
              center={mapCenter}
              zoom={2}
              scrollWheelZoom={true}
              className="h-full w-full"
              ref={(map) => {
                if (map) mapRef.current = map;
              }}
            >
              <LeafletTileLayer
                attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />

              {(mapData.riskZones ?? []).map((zone) => (
                <LeafletCircle
                  key={`zone-${zone.id}`}
                  center={[zone.latitude, zone.longitude]}
                  radius={getZoneRadius(zone.preparednessScore)}
                  pathOptions={{
                    color: getZoneColor(zone.riskLevel),
                    weight: 1.5,
                    fillOpacity: 0.06,
                  }}
                />
              ))}

              {mapSites.map((site) => {
                const color = getThreatColor(site.threatLevel);
                const markerRadius = getMarkerRadius(site.threatScore);
                const haloRadius = getHaloRadius(site.threatScore, site.threatLevel);
                const showDanger = site.threatLevel === "critical" || site.criticalAlertsCount > 0 || site.linkedAlertThreatScore >= 85;

                return (
                  <React.Fragment key={site.id}>
                    {showDanger && (
                      <>
                        <LeafletCircle
                          center={[site.latitude, site.longitude]}
                          radius={110000 + site.threatScore * 1100}
                          pathOptions={{
                            color: site.threatLevel === "critical" ? "#ef4444" : color,
                            weight: 2,
                            opacity: 0.72,
                            fillOpacity: 0.03,
                          }}
                        />
                        <LeafletCircle
                          center={[site.latitude, site.longitude]}
                          radius={60000 + site.threatScore * 700}
                          pathOptions={{
                            color: site.threatLevel === "critical" ? "#f87171" : color,
                            weight: 1.5,
                            opacity: 0.5,
                            fillOpacity: 0.04,
                          }}
                        />
                      </>
                    )}

                    {haloRadius > 0 && (
                      <LeafletCircleMarker
                        center={[site.latitude, site.longitude]}
                        radius={haloRadius}
                        pathOptions={{
                          color: site.threatLevel === "critical" ? "#ef4444" : "#f59e0b",
                          weight: 1.5,
                          fillColor: site.threatLevel === "critical" ? "#ef4444" : "#f59e0b",
                          fillOpacity: 0.12,
                          opacity: 0.9,
                        }}
                      />
                    )}

                    <LeafletCircleMarker
                      center={[site.latitude, site.longitude]}
                      radius={markerRadius}
                      pathOptions={{
                        color,
                        weight: 2,
                        fillColor: color,
                        fillOpacity: 0.92,
                      }}
                    >
                      <LeafletPopup>
                        <div className="min-w-[220px] space-y-2 text-sm">
                          <div className="font-semibold">{site.name}</div>
                          <div>{site.location}, {site.country}</div>
                          <div className="flex flex-wrap gap-2">
                            <Badge className={cn("border", threatClass(site.threatLevel))}>
                              {site.threatLevel.toUpperCase()}
                            </Badge>
                            <Badge className={cn("border", priorityClass(site.responsePriority))}>
                              {site.responsePriority.toUpperCase()}
                            </Badge>
                          </div>
                          <div>Threat Score: <span className="font-semibold">{site.threatScore}</span></div>
                          <div>Recommended: {site.recommendedAction}</div>
                        </div>
                      </LeafletPopup>
                    </LeafletCircleMarker>

                    {site.threatLevel === "critical" && (
                      <LeafletCircleMarker
                        center={[site.latitude, site.longitude]}
                        radius={5}
                        pathOptions={{
                          color: "#ffe4e6",
                          weight: 1,
                          fillColor: "#ef4444",
                          fillOpacity: 1,
                          opacity: 1,
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </LeafletMapContainer>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-border/60 bg-card/70">
          <div className="text-xs text-muted-foreground">Average Threat</div>
          <div className="text-2xl font-bold text-primary">{overview.averageThreatScore}</div>
        </Card>
        <Card className="p-4 border border-border/60 bg-card/70">
          <div className="text-xs text-muted-foreground">Critical Threat Sites</div>
          <div className="text-2xl font-bold text-red-400">{overview.criticalThreatSites}</div>
        </Card>
        <Card className="p-4 border border-border/60 bg-card/70">
          <div className="text-xs text-muted-foreground">Urgent Queue</div>
          <div className="text-2xl font-bold text-amber-400">{overview.urgentQueue}</div>
        </Card>
        <Card className="p-4 border border-border/60 bg-card/70">
          <div className="text-xs text-muted-foreground">Active Alerts</div>
          <div className="text-2xl font-bold">{overview.activeAlerts}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <Card className="border border-border/60 bg-card/70">
          <div className="p-4 border-b border-border/50 flex items-center gap-2">
            <Siren className="w-4 h-4 text-primary" />
            <div className="text-sm font-semibold">Urgent Response Queue</div>
          </div>

          <div className="p-4 space-y-4">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading command queue...</div>
            ) : !stats || stats.urgentQueue.length === 0 ? (
              <div className="text-sm text-muted-foreground">No urgent items in queue.</div>
            ) : (
              stats.urgentQueue.map((item) => (
                <div key={`${item.kind}-${item.id}`} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-semibold">{item.title}</div>
                        <Badge variant="outline">{item.kind}</Badge>
                        <Badge className={cn("border", threatClass(item.threatLevel))}>{item.threatLevel}</Badge>
                        <Badge className={cn("border", priorityClass(item.responsePriority))}>{item.responsePriority}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{item.location}</div>
                      <div className="text-sm">{item.recommendedAction}</div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-center min-w-[92px]">
                      <div className="text-[11px] text-muted-foreground uppercase">Score</div>
                      <div className="text-2xl font-bold text-primary">{item.threatScore}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="border border-border/60 bg-card/70">
          <div className="p-4 border-b border-border/50 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <div className="text-sm font-semibold">Top Threat Sites</div>
          </div>

          <div className="p-4 space-y-4">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading threat sites...</div>
            ) : !stats || stats.topThreatSites.length === 0 ? (
              <div className="text-sm text-muted-foreground">No site data available.</div>
            ) : (
              stats.topThreatSites.map((site) => (
                <div key={site.id} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 min-w-0">
                      <div className="font-semibold">{site.name}</div>
                      <div className="text-sm text-muted-foreground">{site.location}, {site.country}</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={cn("border", threatClass(site.threatLevel))}>{site.threatLevel}</Badge>
                        <Badge className={cn("border", priorityClass(site.responsePriority))}>{site.responsePriority}</Badge>
                        <Badge variant="outline">{site.type}</Badge>
                      </div>
                      <div className="text-sm">{site.recommendedAction}</div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-center min-w-[92px]">
                      <div className="text-[11px] text-muted-foreground uppercase">Score</div>
                      <div className="text-2xl font-bold text-primary">{site.threatScore}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="border border-border/60 bg-card/70">
        <div className="p-4 border-b border-border/50 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <div className="text-sm font-semibold">Recent Scored Alerts</div>
        </div>

        <div className="p-4 space-y-3">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading recent alerts...</div>
          ) : !stats || stats.recentAlerts.length === 0 ? (
            <div className="text-sm text-muted-foreground">No recent alerts available.</div>
          ) : (
            stats.recentAlerts.map((alert) => (
              <div key={alert.id} className="rounded-xl border border-border/60 bg-background/40 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold">{alert.title}</div>
                    <Badge className={cn("border", threatClass(alert.threatLevel))}>{alert.threatLevel}</Badge>
                    <Badge className={cn("border", priorityClass(alert.responsePriority))}>{alert.responsePriority}</Badge>
                    <Badge variant="outline">{alert.module}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{alert.location}</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-center min-w-[92px]">
                    <div className="text-[11px] text-muted-foreground uppercase">Score</div>
                    <div className="text-2xl font-bold text-primary">{alert.threatScore}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
