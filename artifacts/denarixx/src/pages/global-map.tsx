import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { ModuleHeader, Card, Badge, LoadingScreen, Button, cn } from "@/components/ui-core";
import { Globe, MapPin, Shield, Zap, Activity, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { apiUrl } from "@/lib/api";
import { useTranslation } from "react-i18next";

type MapSite = {
  id: number;
  name: string;
  type: string;
  location: string;
  country: string;
  latitude: number;
  longitude: number;
  status: string;
  currentRiskLevel: string;
  powerAvailability: number;
  uptime: number;
  population: number;
  createdAt: string;
};

delete (L.Icon.Default.prototype as any)._getIconUrl;
const LeafletMapContainer = MapContainer as any;
const LeafletTileLayer = TileLayer as any;
const LeafletCircleMarker = CircleMarker as any;
const LeafletPopup = Popup as any;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function getRiskColor(risk: string) {
  switch (risk) {
    case "critical":
      return "#ef4444";
    case "high":
      return "#f59e0b";
    case "medium":
      return "#3b82f6";
    default:
      return "#22c55e";
  }
}

function getStatusVariant(status: string): "safe" | "critical" | "warning" | "outline" {
  if (status === "online") return "safe";
  if (status === "critical" || status === "offline") return "critical";
  if (status === "warning") return "warning";
  return "outline";
}

export default function GlobalMap() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [sites, setSites] = useState<MapSite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        const resp = await fetch(apiUrl("/api/map/sites"), { credentials: "include" });
        const data = resp.ok ? await resp.json() : [];
        if (!mounted) return;
        setSites(Array.isArray(data) ? data : []);
      } catch {
        if (!mounted) return;
        setSites([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const online = sites.filter((s) => s.status === "online").length;
    const critical = sites.filter((s) => s.currentRiskLevel === "critical").length;
    const high = sites.filter((s) => s.currentRiskLevel === "high").length;
    const protectedPopulation = sites.reduce((sum, s) => sum + (s.population ?? 0), 0);
    return { online, critical, high, protectedPopulation };
  }, [sites]);

  if (isLoading) return <LoadingScreen />;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <ModuleHeader
        title="Global Operations Map"
        subtitle="Live geographic command view of all Denarixx OneEarth infrastructure nodes."
        classification="RESTRICTED // GLOBAL SITUATIONAL AWARENESS"
        moduleId="DNX-MAP-001"
        status={stats.critical > 0 ? "degraded" : "active"}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <Globe className="w-5 h-5 text-primary" />
            <span className="text-2xl font-display font-bold text-white">{sites.length}</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Total Nodes</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-green-400" />
            <span className="text-2xl font-display font-bold text-white">{stats.online}</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Online Nodes</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <Shield className="w-5 h-5 text-destructive" />
            <span className="text-2xl font-display font-bold text-white">{stats.critical}</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Critical Risk</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <UsersIcon />
            <span className="text-2xl font-display font-bold text-white">
              {stats.protectedPopulation.toLocaleString()}
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Population Coverage</p>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden border-primary/20">
        <div className="h-[70vh] w-full bg-black">
          <LeafletMapContainer
            center={[8.5, 20]}
            zoom={2}
            scrollWheelZoom={true}
            className="h-full w-full z-0"
          >
            <LeafletTileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {sites
              .filter((site) => Number.isFinite(site.latitude) && Number.isFinite(site.longitude))
              .map((site) => (
                <LeafletCircleMarker
                  key={site.id}
                  center={[site.latitude, site.longitude]}
                  radius={10}
                  pathOptions={{
                    color: getRiskColor(site.currentRiskLevel),
                    fillColor: getRiskColor(site.currentRiskLevel),
                    fillOpacity: 0.75,
                    weight: 2,
                  }}
                >
                  <LeafletPopup>
                    <div className="min-w-[220px] text-black">
                      <div className="font-bold text-base mb-1">{site.name}</div>
                      <div className="text-xs mb-2">
                        {site.location}, {site.country}
                      </div>

                      <div className="flex gap-2 flex-wrap mb-3">
                        <span className="px-2 py-0.5 rounded border text-[10px] uppercase font-bold">
                          {site.type}
                        </span>
                        <span className="px-2 py-0.5 rounded border text-[10px] uppercase font-bold">
                          {site.currentRiskLevel}
                        </span>
                        <span className="px-2 py-0.5 rounded border text-[10px] uppercase font-bold">
                          {site.status}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs mb-3">
                        <div>Power: {site.powerAvailability}%</div>
                        <div>Uptime: {site.uptime}%</div>
                        <div>Population: {site.population.toLocaleString()}</div>
                      </div>

                      <button
                        onClick={() => setLocation(`/sites/${site.id}`)}
                        className="inline-flex items-center gap-1 text-xs font-bold"
                      >
                        Open site profile <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </LeafletPopup>
                </LeafletCircleMarker>
              ))}
          </LeafletMapContainer>
        </div>
      </Card>

      <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          Low
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          Medium
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          High
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          Critical
        </div>
      </div>
    </motion.div>
  );
}

function UsersIcon() {
  return <MapPin className="w-5 h-5 text-blue-400" />;
}