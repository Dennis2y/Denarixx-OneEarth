import React, { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import { motion } from "framer-motion";

type ThreatLevel = "low" | "medium" | "high" | "critical";

type ThreatSite = {
  id: number;
  name: string;
  type: string;
  location: string;
  country: string;
  threatScore: number;
  threatLevel: ThreatLevel;
  latitude?: number;
  longitude?: number;
};

type CountryFeature = {
  type: string;
  properties?: Record<string, unknown>;
  geometry: unknown;
};

type EscalationHotspot = {
  id: number;
  scenarioId: string;
  scenarioLabel: string;
  triggerModule: "energy" | "lifemesh" | "earthshield" | string;
  threatScore: number;
  escalationLevel: "site" | "district" | "regional-command" | "global-command";
  country?: string;
  latitude?: number;
  longitude?: number;
};

type Props = {
  sites: ThreatSite[];
  escalations?: EscalationHotspot[];
};

const COUNTRIES_URL =
  "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

function normalizeCountry(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function pointColor(level: ThreatLevel) {
  if (level === "critical") return "#ef4444";
  if (level === "high") return "#f59e0b";
  if (level === "medium") return "#60a5fa";
  return "#22c55e";
}


function hotspotCountryClass(level: EscalationHotspot["escalationLevel"]) {
  if (level === "global-command") return "rgba(239,68,68,0.55)";
  if (level === "regional-command") return "rgba(245,158,11,0.45)";
  if (level === "district") return "rgba(96,165,250,0.35)";
  return "rgba(34,197,94,0.18)";
}

function moduleGlowColor(module: string, level: EscalationHotspot["escalationLevel"]) {
  if (module === "earthshield") {
    return level === "global-command" ? "rgba(251,146,60,0.75)" : "rgba(245,158,11,0.50)";
  }
  if (module === "energy") {
    return level === "global-command" ? "rgba(56,189,248,0.75)" : "rgba(59,130,246,0.50)";
  }
  if (module === "lifemesh") {
    return level === "global-command" ? "rgba(74,222,128,0.78)" : "rgba(34,197,94,0.50)";
  }
  return hotspotCountryClass(level);
}

function modulePointColor(module: string, level: EscalationHotspot["escalationLevel"]) {
  if (module === "earthshield") return level === "global-command" ? "#fb923c" : "#f59e0b";
  if (module === "energy") return level === "global-command" ? "#38bdf8" : "#3b82f6";
  if (module === "lifemesh") return level === "global-command" ? "#4ade80" : "#22c55e";
  return level === "global-command" ? "#ef4444" : "#f59e0b";
}

function pointAltitude(score: number) {
  if (score >= 90) return 0.22;
  if (score >= 75) return 0.16;
  if (score >= 55) return 0.11;
  return 0.06;
}

function pointRadius(score: number) {
  if (score >= 90) return 0.65;
  if (score >= 75) return 0.5;
  if (score >= 55) return 0.38;
  return 0.28;
}

export default function ThreatGlobe({ sites, escalations = [] }: Props) {
  const globeRef = useRef<any>(null);
  const [countries, setCountries] = useState<CountryFeature[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    fetch(COUNTRIES_URL, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        const features = Array.isArray(json?.features) ? json.features : [];
        setCountries(features);
      })
      .catch(() => {
        setCountries([]);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const controls = globe.controls?.();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.45;
      controls.enablePan = false;
      controls.minDistance = 180;
      controls.maxDistance = 320;
    }

    globe.pointOfView({ lat: 12, lng: 10, altitude: 2.15 }, 0);
  }, [countries.length]);

  const validSites = useMemo(
    () =>
      (sites ?? []).filter(
        (site) =>
          typeof site.latitude === "number" &&
          typeof site.longitude === "number"
      ),
    [sites]
  );

  const globePoints = useMemo(
    () =>
      validSites.map((site) => ({
        ...site,
        lat: site.latitude as number,
        lng: site.longitude as number,
        color: pointColor(site.threatLevel),
        altitude: pointAltitude(site.threatScore),
        radius: pointRadius(site.threatScore),
      })),
    [validSites]
  );

  const escalationPoints = useMemo(
    () =>
      (escalations ?? [])
        .filter(
          (row) =>
            typeof row.latitude === "number" &&
            typeof row.longitude === "number"
        )
        .slice(0, 10)
        .map((row) => ({
          ...row,
          lat: row.latitude as number,
          lng: row.longitude as number,
          color: modulePointColor(row.triggerModule, row.escalationLevel),
          altitude:
            row.escalationLevel === "global-command"
              ? 0.22
              : row.escalationLevel === "regional-command"
              ? 0.17
              : 0.11,
          radius:
            row.escalationLevel === "global-command"
              ? 0.52
              : row.escalationLevel === "regional-command"
              ? 0.38
              : 0.26,
        })),
    [escalations]
  );

  const hotspotCountries = useMemo(() => {
    const map = new Map<string, { level: EscalationHotspot["escalationLevel"]; module: string }>();

    for (const row of escalations ?? []) {
      if (!row.country) continue;
      const existing = map.get(row.country);
      const rank = (value?: string) =>
        value === "global-command" ? 4 :
        value === "regional-command" ? 3 :
        value === "district" ? 2 : 1;

      if (!existing || rank(row.escalationLevel) > rank(existing.level)) {
        map.set(row.country, { level: row.escalationLevel, module: row.triggerModule });
      }
    }

    return map;
  }, [escalations]);

  const ringSites = useMemo(
    () => globePoints.filter((site) => site.threatLevel === "critical" || site.threatLevel === "high"),
    [globePoints]
  );

  const criticalSites = useMemo(
    () => globePoints.filter((site) => site.threatLevel === "critical").slice(0, 6),
    [globePoints]
  );

  const safeSites = useMemo(
    () => globePoints.filter((site) => site.threatLevel === "low").slice(0, 8),
    [globePoints]
  );

  const arcsData = useMemo(() => {
    if (!criticalSites.length || !safeSites.length) return [];

    return safeSites.slice(0, 4).flatMap((safeSite, index) => {
      const target = criticalSites[index % criticalSites.length];
      return [
        {
          startLat: safeSite.lat,
          startLng: safeSite.lng,
          endLat: target.lat,
          endLng: target.lng,
          color: ["rgba(34,197,94,0.78)", "rgba(239,68,68,0.82)"],
        },
      ];
    });
  }, [criticalSites, safeSites]);

  const labelsData = useMemo(
    () =>
      globePoints
        .filter((site) => site.threatLevel === "critical" || site.threatScore >= 75)
        .slice(0, 8)
        .map((site) => ({
          lat: site.lat,
          lng: site.lng,
          text: `${site.name} · ${site.threatScore}`,
          color: site.threatLevel === "critical" ? "#fca5a5" : "#fde68a",
        })),
    [globePoints]
  );

  const hotCountries = useMemo(() => {
    const map = new Map<string, ThreatLevel>();

    for (const site of globePoints) {
      const key = normalizeCountry(site.country);
      if (!key) continue;

      const current = map.get(key);
      if (site.threatLevel === "critical") {
        map.set(key, "critical");
      } else if (site.threatLevel === "high" && current !== "critical") {
        map.set(key, "high");
      } else if (site.threatLevel === "medium" && !current) {
        map.set(key, "medium");
      } else if (site.threatLevel === "low" && !current) {
        map.set(key, "low");
      }
    }

    return map;
  }, [globePoints]);

  return (
    <div className="rounded-3xl border border-primary/20 bg-[#04070d] p-3 sm:p-4 shadow-[0_0_40px_rgba(0,0,0,0.45)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-white">Live World Threat Globe</div>
            <motion.div
              className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            >
              Sweep Active
            </motion.div>
          </div>
          <div className="text-xs text-muted-foreground">
            Rotating global surface with country lighting, live escalation hotspots, and response links
          </div>
        </div>
        <div className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
          {globePoints.length} tracked nodes
        </div>
      </div>

      <div className="relative mx-auto h-[240px] w-full max-w-[400px] sm:h-[280px] lg:h-[305px]">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.08),transparent_58%)] blur-2xl" />

        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, transparent 300deg, rgba(59,130,246,0.06) 328deg, rgba(250,204,21,0.22) 344deg, rgba(255,255,255,0.08) 352deg, transparent 360deg)",
            filter: "blur(1px)",
            boxShadow: "0 0 60px rgba(37,99,235,0.08) inset",
          }}
        />

        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[64%] w-[64%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10"
          animate={{ rotate: -360 }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, transparent 312deg, rgba(34,197,94,0.08) 332deg, rgba(59,130,246,0.10) 346deg, transparent 360deg)",
          }}
        />

        <Globe
          ref={globeRef}
          width={400}
          height={305}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
          atmosphereColor="#2563eb"
          atmosphereAltitude={0.24}
          polygonsData={countries}
          polygonCapColor={(feat: any) => {
            const country =
              feat?.properties?.name ||
              feat?.properties?.NAME ||
              feat?.properties?.admin ||
              "";
            const level = hotCountries.get(normalizeCountry(String(country)));

            if (level === "critical") return "rgba(239,68,68,0.55)";
            if (level === "high") return "rgba(245,158,11,0.40)";
            if (level === "medium") return "rgba(96,165,250,0.30)";
            if (level === "low") return "rgba(34,197,94,0.22)";
            return "rgba(17,24,39,0.18)";
          }}
          polygonSideColor={() => "rgba(14,165,233,0.06)"}
          polygonStrokeColor={() => "rgba(148,163,184,0.24)"}
          polygonAltitude={0.012}
          pointsData={[...globePoints, ...escalationPoints]}
          pointLat="lat"
          pointLng="lng"
          pointAltitude="altitude"
          pointRadius="radius"
          pointColor="color"
          pointResolution={18}
          pointLabel={(d: any) => `
            <div style="padding:8px 10px; border-radius:12px; background:rgba(3,7,18,0.92); color:white; min-width:180px; border:1px solid rgba(255,255,255,0.12)">
              <div style="font-weight:700; margin-bottom:4px;">${d.name}</div>
              <div style="font-size:12px; opacity:0.8;">${d.location}, ${d.country}</div>
              <div style="font-size:12px; margin-top:6px;">Threat: <b>${d.threatScore}</b> · ${d.threatLevel.toUpperCase()}</div>
            </div>
          `}
          ringsData={[...ringSites, ...escalationPoints]}
          ringLat="lat"
          ringLng="lng"
          ringColor={(d: any) => {
            if (d?.triggerModule) {
              return moduleGlowColor(d.triggerModule, d.escalationLevel ?? "district");
            }
            return d.threatLevel === "critical"
              ? "rgba(239,68,68,0.9)"
              : "rgba(245,158,11,0.85)";
          }}
          ringMaxRadius={(d: any) => {
            if (d?.triggerModule) {
              return d.escalationLevel === "global-command" ? 5.5 : 3.8;
            }
            return d.threatLevel === "critical" ? 5 : 3.5;
          }}
          ringPropagationSpeed={() => 1.05}
          ringRepeatPeriod={(d: any) => {
            if (d?.triggerModule) {
              return d.escalationLevel === "global-command" ? 1100 : 1500;
            }
            return d.threatLevel === "critical" ? 1000 : 1450;
          }}
          arcsData={arcsData}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor="color"
          arcDashLength={0.35}
          arcDashGap={0.18}
          arcDashAnimateTime={1800}
          arcStroke={0.4}
          labelsData={labelsData}
          labelLat="lat"
          labelLng="lng"
          labelText="text"
          labelColor="color"
          labelSize={() => 1.35}
          labelDotRadius={() => 0.25}
          labelResolution={2}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-orange-400 shadow-[0_0_14px_rgba(251,146,60,0.9)]" />
          <span>EarthShield hotspot</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-sky-400 shadow-[0_0_14px_rgba(56,189,248,0.9)]" />
          <span>Energy hotspot</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_14px_rgba(34,197,94,0.9)]" />
          <span>LifeMesh hotspot</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-[2px] w-5 rounded-full bg-gradient-to-r from-green-500 to-red-500" />
          <span>Response routes</span>
        </div>
      </div>
    </div>
  );
}
