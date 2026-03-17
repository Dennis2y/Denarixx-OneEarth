import React, { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";

type ThreatLevel = "low" | "medium" | "high" | "critical";

type ThreatSite = {
  id: number;
  name: string;
  location: string;
  country: string;
  latitude?: number;
  longitude?: number;
  threatScore: number;
  threatLevel: ThreatLevel;
};

type Props = {
  sites: ThreatSite[];
};

type PointDatum = {
  lat: number;
  lng: number;
  size: number;
  color: string;
  label: string;
};

type RingDatum = {
  lat: number;
  lng: number;
  maxR: number;
  propagationSpeed: number;
  repeatPeriod: number;
  color: (t: number) => string;
};

function colorForThreat(level: ThreatLevel) {
  if (level === "critical") return "#ff3b3b";
  if (level === "high") return "#ffb020";
  if (level === "medium") return "#38bdf8";
  return "#22c55e";
}

function sizeForThreat(score: number) {
  if (score >= 90) return 0.55;
  if (score >= 75) return 0.38;
  if (score >= 55) return 0.26;
  return 0.18;
}

export default function ThreatGlobe({ sites }: Props) {
  const globeRef = useRef<any>(null);
  const [size, setSize] = useState({ width: 760, height: 760 });

  useEffect(() => {
    const update = () => {
      const width = Math.min(window.innerWidth * 0.55, 920);
      const height = Math.min(width, 820);
      setSize({ width, height });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!globeRef.current) return;

    const controls = globeRef.current.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minDistance = 240;
    controls.maxDistance = 240;

    globeRef.current.pointOfView({ lat: 8, lng: 18, altitude: 2.1 }, 0);
  }, []);

  const validSites = useMemo(
    () =>
      sites.filter(
        (site) =>
          typeof site.latitude === "number" &&
          typeof site.longitude === "number"
      ),
    [sites]
  );

  const points = useMemo<PointDatum[]>(
    () =>
      validSites.map((site) => ({
        lat: site.latitude as number,
        lng: site.longitude as number,
        size: sizeForThreat(site.threatScore),
        color: colorForThreat(site.threatLevel),
        label: `
          <div style="padding:10px 12px;background:rgba(5,8,18,0.94);border:1px solid rgba(201,168,76,0.28);border-radius:14px;color:#fff;min-width:180px">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">${site.name}</div>
            <div style="font-size:12px;opacity:0.8;margin-bottom:6px">${site.location}, ${site.country}</div>
            <div style="font-size:12px;color:${colorForThreat(site.threatLevel)}">Threat ${site.threatLevel.toUpperCase()} · Score ${site.threatScore}</div>
          </div>
        `,
      })),
    [validSites]
  );

  const rings = useMemo<RingDatum[]>(
    () =>
      validSites
        .filter((site) => site.threatLevel === "critical" || site.threatLevel === "high")
        .map((site) => ({
          lat: site.latitude as number,
          lng: site.longitude as number,
          maxR: site.threatLevel === "critical" ? 8 : 5,
          propagationSpeed: site.threatLevel === "critical" ? 1.8 : 1.2,
          repeatPeriod: site.threatLevel === "critical" ? 900 : 1400,
          color: (t: number) =>
            site.threatLevel === "critical"
              ? `rgba(255,59,59,${1 - t})`
              : `rgba(255,176,32,${1 - t})`,
        })),
    [validSites]
  );

  return (
    <div className="relative rounded-[2rem] border border-primary/15 bg-[radial-gradient(circle_at_center,rgba(15,35,82,0.18),rgba(2,6,16,0.98)_70%)] overflow-hidden min-h-[760px] flex items-center justify-center">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_30%,rgba(96,165,250,0.10),transparent_20%),radial-gradient(circle_at_65%_70%,rgba(34,197,94,0.08),transparent_18%),radial-gradient(circle_at_62%_48%,rgba(255,59,59,0.08),transparent_16%)]" />

      <Globe
        ref={globeRef}
        width={size.width}
        height={size.height}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        showAtmosphere
        atmosphereColor="#4ea1ff"
        atmosphereAltitude={0.18}
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointAltitude="size"
        pointRadius={0.42}
        pointColor="color"
        pointLabel="label"
        ringsData={rings}
        ringLat="lat"
        ringLng="lng"
        ringColor="color"
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
        htmlElementsData={[]}
      />

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-primary/20 bg-black/55 backdrop-blur-md px-6 py-3 text-xs text-muted-foreground flex flex-wrap items-center justify-center gap-5">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_16px_rgba(239,68,68,0.95)]" />
          <span>Critical danger</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.85)]" />
          <span>High risk</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_14px_rgba(34,197,94,0.85)]" />
          <span>Stable node</span>
        </div>
      </div>
    </div>
  );
}
