import React, { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";

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

type Props = {
  sites: ThreatSite[];
};

const COUNTRIES_URL =
  "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

function pointColor(level: ThreatLevel) {
  if (level === "critical") return "#ef4444";
  if (level === "high") return "#f59e0b";
  if (level === "medium") return "#60a5fa";
  return "#22c55e";
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

export default function ThreatGlobe({ sites }: Props) {
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

    return safeSites.flatMap((safeSite, index) => {
      const target = criticalSites[index % criticalSites.length];
      return [
        {
          startLat: safeSite.lat,
          startLng: safeSite.lng,
          endLat: target.lat,
          endLng: target.lng,
          color: ["rgba(34,197,94,0.9)", "rgba(239,68,68,0.9)"],
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

  return (
    <div className="rounded-3xl border border-primary/20 bg-[#04070d] p-3 sm:p-4 shadow-[0_0_40px_rgba(0,0,0,0.45)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">Live World Threat Globe</div>
          <div className="text-xs text-muted-foreground">
            Rotating global surface with country boundaries, live hotspots, and response links
          </div>
        </div>
        <div className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
          {globePoints.length} tracked nodes
        </div>
      </div>

      <div className="relative mx-auto h-[320px] w-full max-w-[520px] sm:h-[360px] lg:h-[390px]">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.08),transparent_58%)] blur-2xl" />

        <Globe
          ref={globeRef}
          width={520}
          height={390}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
          atmosphereColor="#3b82f6"
          atmosphereAltitude={0.18}
          polygonsData={countries}
          polygonCapColor={() => "rgba(17,24,39,0.30)"}
          polygonSideColor={() => "rgba(14,165,233,0.06)"}
          polygonStrokeColor={() => "rgba(148,163,184,0.24)"}
          polygonAltitude={0.008}
          pointsData={globePoints}
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
          ringsData={ringSites}
          ringLat="lat"
          ringLng="lng"
          ringColor={(d: any) =>
            d.threatLevel === "critical"
              ? "rgba(239,68,68,0.9)"
              : "rgba(245,158,11,0.85)"
          }
          ringMaxRadius={(d: any) => (d.threatLevel === "critical" ? 6 : 4)}
          ringPropagationSpeed={() => 1.5}
          ringRepeatPeriod={(d: any) => (d.threatLevel === "critical" ? 850 : 1300)}
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
          <span className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.9)]" />
          <span>Immediate danger</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.85)]" />
          <span>High risk</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_14px_rgba(34,197,94,0.85)]" />
          <span>Stable node</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-[2px] w-5 rounded-full bg-gradient-to-r from-green-500 to-red-500" />
          <span>Response routes</span>
        </div>
      </div>
    </div>
  );
}
