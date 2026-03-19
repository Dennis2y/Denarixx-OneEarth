import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Globe from "react-globe.gl";
import { motion } from "framer-motion";

const THREAT_SWEEP_CSS = `
@keyframes threatSweep {
  0% { transform: translateX(-140%) rotate(12deg); opacity: 0; }
  12% { opacity: 0.12; }
  42% { opacity: 0.18; }
  100% { transform: translateX(320%) rotate(12deg); opacity: 0; }
}
@keyframes denarixxFloat {
  0% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-5px) scale(1.003); }
  100% { transform: translateY(0px) scale(1); }
}
`;

type ThreatLevel = "low" | "medium" | "high" | "critical";
type EscalationLevel = "site" | "district" | "regional-command" | "global-command";

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

type EscalationHotspot = {
  id: number;
  scenarioId: string;
  scenarioLabel: string;
  triggerModule: "energy" | "lifemesh" | "earthshield" | string;
  threatScore: number;
  escalationLevel: EscalationLevel;
  country?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
};

type CountryFeature = {
  type: string;
  properties?: Record<string, unknown>;
  geometry?: {
    coordinates?: unknown;
  };
};

type CountryLabelPoint = {
  lat: number;
  lng: number;
  text: string;
  size: number;
  color: string;
};

type GlobePoint = ThreatSite & {
  lat: number;
  lng: number;
  color: string;
  altitude: number;
  radius: number;
};

type EscalationPoint = EscalationHotspot & {
  lat: number;
  lng: number;
  color: string;
  altitude: number;
  radius: number;
  name: string;
  location: string;
  country: string;
  threatLevel: ThreatLevel;
};

type ArcPoint = {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: [string, string];
};

type LabelPoint = {
  lat: number;
  lng: number;
  text: string;
  color: string;
};

const MAJOR_COUNTRY_LABELS = new Set([
  "United States of America",
  "Canada",
  "Mexico",
  "Brazil",
  "Argentina",
  "United Kingdom",
  "France",
  "Germany",
  "Spain",
  "Italy",
  "Ukraine",
  "Turkey",
  "Egypt",
  "Nigeria",
  "Ethiopia",
  "Kenya",
  "South Africa",
  "Saudi Arabia",
  "India",
  "Pakistan",
  "China",
  "Japan",
  "South Korea",
  "Indonesia",
  "Australia",
]);

type Props = {
  sites: ThreatSite[];
  escalations?: EscalationHotspot[];
  liveFlashToken?: string;
};

const COUNTRIES_URL =
  "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

function normalizeCountry(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function pointColor(level: ThreatLevel) {
  if (level === "critical") return "#ef4444";
  if (level === "high") return "#f59e0b";
  if (level === "medium") return "#60a5fa";
  return "#22c55e";
}

function pointAltitude(score: number) {
  if (score >= 90) return 0.18;
  if (score >= 75) return 0.14;
  if (score >= 55) return 0.1;
  return 0.06;
}

function pointRadius(score: number) {
  if (score >= 90) return 0.56;
  if (score >= 75) return 0.46;
  if (score >= 55) return 0.34;
  return 0.24;
}

function escalationColor(moduleName: string) {
  if (moduleName === "earthshield") return "#fb923c";
  if (moduleName === "energy") return "#38bdf8";
  if (moduleName === "lifemesh") return "#22c55e";
  return "#f59e0b";
}

function moduleGlowColor(moduleName: string, escalationLevel: EscalationLevel) {
  const alpha =
    escalationLevel === "global-command"
      ? 0.82
      : escalationLevel === "regional-command"
        ? 0.72
        : escalationLevel === "district"
          ? 0.56
          : 0.4;

  if (moduleName === "earthshield") return `rgba(251,146,60,${alpha})`;
  if (moduleName === "energy") return `rgba(56,189,248,${alpha})`;
  if (moduleName === "lifemesh") return `rgba(34,197,94,${alpha})`;
  return `rgba(245,158,11,${alpha})`;
}

function featureCenter(feature: CountryFeature): { lat: number; lng: number } | null {
  const coordinates = feature?.geometry?.coordinates;
  if (!coordinates) return null;

  const coords: Array<[number, number]> = [];

  const walk = (node: unknown) => {
    if (!Array.isArray(node)) return;

    if (
      node.length >= 2 &&
      typeof node[0] === "number" &&
      typeof node[1] === "number"
    ) {
      coords.push([node[1], node[0]]);
      return;
    }

    for (const child of node) walk(child);
  };

  walk(coordinates);

  if (!coords.length) return null;

  const lat = coords.reduce((sum, [v]) => sum + v, 0) / coords.length;
  const lng = coords.reduce((sum, [, v]) => sum + v, 0) / coords.length;

  return { lat, lng };
}

export default function ThreatGlobe({
  sites,
  escalations = [],
  liveFlashToken,
}: Props) {
  const { t } = useTranslation();
  const globeRef = useRef<any>(null);
  const [countries, setCountries] = useState<CountryFeature[]>([]);
  const [flashCountryKeys, setFlashCountryKeys] = useState<string[]>([]);
  const [focusToken, setFocusToken] = useState("");
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1440
  );

  useEffect(() => {
    const controller = new AbortController();

    fetch(COUNTRIES_URL, { signal: controller.signal })
      .then((res) => res.json())
      .then((json: { features?: CountryFeature[] }) => {
        const features = Array.isArray(json?.features) ? json.features : [];
        setCountries(features);
      })
      .catch(() => {
        setCountries([]);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const mobile = viewportWidth < 640;
    const altitude = viewportWidth < 420 ? 2.22 : viewportWidth < 640 ? 2.12 : 2.0;

    const controls = globe.controls?.();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = mobile ? 0.12 : 0.18;
      controls.enablePan = false;
      controls.minDistance = mobile ? 145 : 170;
      controls.maxDistance = mobile ? 245 : 290;
      controls.enableZoom = true;
    }

    globe.pointOfView({ lat: 10, lng: 15, altitude }, 0);
  }, [countries.length, viewportWidth]);

  const isMobile = viewportWidth < 640;

  const globeSize = useMemo(() => {
    if (viewportWidth < 420) return { width: 250, height: 250, altitude: 2.22, wrap: 250 };
    if (viewportWidth < 640) return { width: 285, height: 285, altitude: 2.12, wrap: 285 };
    if (viewportWidth < 1024) return { width: 340, height: 300, altitude: 2.0, wrap: 340 };
    return { width: 400, height: 305, altitude: 2.0, wrap: 400 };
  }, [viewportWidth]);

  const globePoints = useMemo<GlobePoint[]>(
    () =>
      (sites ?? [])
        .filter((site) => typeof site.latitude === "number" && typeof site.longitude === "number")
        .map((site) => ({
          ...site,
          lat: site.latitude as number,
          lng: site.longitude as number,
          color: pointColor(site.threatLevel),
          altitude: pointAltitude(site.threatScore),
          radius: pointRadius(site.threatScore),
        })),
    [sites],
  );

  const escalationPoints = useMemo<EscalationPoint[]>(
    () =>
      (escalations ?? [])
        .filter((item) => typeof item.latitude === "number" && typeof item.longitude === "number")
        .map((item) => ({
          ...item,
          lat: item.latitude as number,
          lng: item.longitude as number,
          color: escalationColor(item.triggerModule),
          altitude:
            item.escalationLevel === "global-command"
              ? 0.2
              : item.escalationLevel === "regional-command"
                ? 0.16
                : 0.11,
          radius:
            item.escalationLevel === "global-command"
              ? 0.62
              : item.escalationLevel === "regional-command"
                ? 0.5
                : 0.36,
          name: item.scenarioLabel,
          location: item.country ?? "Escalation hotspot",
          country: item.country ?? "Unknown",
          threatLevel: "critical" as ThreatLevel,
        })),
    [escalations],
  );

  const ringSites = useMemo(
    () => globePoints.filter((site) => site.threatLevel === "critical" || site.threatLevel === "high"),
    [globePoints],
  );

  const criticalSites = useMemo(
    () => globePoints.filter((site) => site.threatLevel === "critical").slice(0, 4),
    [globePoints],
  );

  const safeSites = useMemo(
    () => globePoints.filter((site) => site.threatLevel === "low").slice(0, 5),
    [globePoints],
  );

  const arcsData = useMemo<ArcPoint[]>(() => {
    if (!criticalSites.length || !safeSites.length) return [];

    return safeSites.map((safeSite, index) => {
      const target = criticalSites[index % criticalSites.length];
      return {
        startLat: safeSite.lat,
        startLng: safeSite.lng,
        endLat: target.lat,
        endLng: target.lng,
        color: ["rgba(34,197,94,0.58)", "rgba(239,68,68,0.74)"],
      };
    });
  }, [criticalSites, safeSites]);

  const labelsData = useMemo<LabelPoint[]>(
    () =>
      [...escalationPoints, ...globePoints]
        .filter((site) => Boolean((site as EscalationPoint).triggerModule) || site.threatLevel === "critical" || Number(site.threatScore) >= 85)
        .slice(0, 5)
        .map((site) => ({
          lat: site.lat,
          lng: site.lng,
          text: `${site.name} · ${site.threatScore}`,
          color: (site as EscalationPoint).triggerModule
            ? escalationColor((site as EscalationPoint).triggerModule)
            : site.threatLevel === "critical"
              ? "#fca5a5"
              : "#fde68a",
        })),
    [globePoints, escalationPoints],
  );

  const hotCountries = useMemo(() => {
    const map = new Map<string, "low" | "medium" | "high" | "critical">();

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

    for (const escalation of escalations) {
      const key = normalizeCountry(escalation.country ?? "");
      if (!key) continue;
      map.set(key, "critical");
    }

    return map;
  }, [globePoints, escalations]);

  const matchedCountryKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const escalation of escalations) {
      const key = normalizeCountry(escalation.country ?? "");
      if (key) keys.add(key);
    }
    return keys;
  }, [escalations]);

  const countryLabelPoints = useMemo(() => {
    const hotEntries = [...hotCountries.entries()]
      .filter(([, level]) => level === "critical" || level === "high")
      .slice(0, 6);

    const hotSet = new Set(hotEntries.map(([key]) => key));

    return countries
      .map((feature) => {
        const rawName =
          feature?.properties?.name ||
          feature?.properties?.NAME ||
          feature?.properties?.admin ||
          "";

        const name = String(rawName).trim();
        if (!name) return null;

        const key = normalizeCountry(name);
        if (!hotSet.has(key)) return null;

        const center = featureCenter(feature);
        if (!center) return null;

        const level = hotCountries.get(key);

        return {
          lat: center.lat,
          lng: center.lng,
          text: name,
          size: 0.56,
          color:
            level === "critical"
              ? "rgba(255,244,244,0.82)"
              : "rgba(255,248,220,0.68)",
        };
      })
      .filter(Boolean) as CountryLabelPoint[];
  }, [countries, hotCountries]);

  const majorCountryLabelPoints = useMemo(() => {
    return countries
      .map((feature) => {
        const rawName =
          feature?.properties?.name ||
          feature?.properties?.NAME ||
          feature?.properties?.admin ||
          "";

        const name = String(rawName).trim();
        if (!name || !MAJOR_COUNTRY_LABELS.has(name)) return null;

        const center = featureCenter(feature);
        if (!center) return null;

        return {
          lat: center.lat,
          lng: center.lng,
          text: name,
          size: isMobile ? 0.42 : 0.5,
          color: "rgba(255,255,255,0.48)",
        };
      })
      .filter(Boolean) as CountryLabelPoint[];
  }, [countries, isMobile]);

  const allCountryLabelPoints = useMemo(() => {
    if (isMobile) return majorCountryLabelPoints;

    return countries
      .map((feature) => {
        const rawName =
          feature?.properties?.name ||
          feature?.properties?.NAME ||
          feature?.properties?.admin ||
          "";

        const name = String(rawName).trim();
        if (!name) return null;

        const center = featureCenter(feature);
        if (!center) return null;

        return {
          lat: center.lat,
          lng: center.lng,
          text: name,
          size: 0.32,
          color: "rgba(255,255,255,0.24)",
        };
      })
      .filter(Boolean) as CountryLabelPoint[];
  }, [countries, isMobile, majorCountryLabelPoints]);

  useEffect(() => {
    if (!liveFlashToken || !matchedCountryKeys.size) return;

    const keys = Array.from(matchedCountryKeys);
    setFlashCountryKeys(keys);
    setFocusToken(String(Date.now()));

    const timeout = window.setTimeout(() => {
      setFlashCountryKeys([]);
    }, 1600);

    return () => window.clearTimeout(timeout);
  }, [liveFlashToken, matchedCountryKeys]);

  useEffect(() => {
    if (!focusToken) return;

    const globe = globeRef.current;
    if (!globe) return;

    const target =
      escalationPoints[0] ??
      globePoints.find((site) => site.threatLevel === "critical") ??
      globePoints[0];

    if (!target) return;

    globe.pointOfView({ lat: target.lat, lng: target.lng, altitude: 1.35 }, 1200);

    const timeout = window.setTimeout(() => {
      globe.pointOfView({ lat: 10, lng: 15, altitude: globeSize.altitude }, 1800);
    }, 2600);

    return () => window.clearTimeout(timeout);
  }, [focusToken, escalationPoints, globePoints, globeSize]);

  return (
    <>
      <style>{THREAT_SWEEP_CSS}</style>

      <div className="rounded-3xl border border-primary/20 bg-[#04070d] p-3 shadow-[0_0_40px_rgba(0,0,0,0.45)] sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-white">{t("globe.liveWorldThreatGlobe")}</div>
              <motion.div
                className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary"
                animate={{ opacity: [0.74, 1, 0.74] }}
                transition={{ duration: 2.8, repeat: Infinity }}
              >
                Cinematic Sweep
              </motion.div>
            </div>
            <div className="text-xs text-muted-foreground">
              Premium globe view with reduced clutter, priority hotspots, and response arcs
            </div>
          </div>

          <div className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
            {globePoints.length} tracked nodes
          </div>
        </div>

        <div
          className="relative mx-auto w-full animate-[denarixxFloat_10s_ease-in-out_infinite]"
          style={{ height: `${globeSize.height}px`, maxWidth: `${globeSize.wrap}px` }}
        >
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.08),rgba(14,165,233,0.03),transparent_62%)] blur-2xl" />
          <div className="absolute inset-[10%] rounded-full border border-cyan-400/8 shadow-[0_0_56px_rgba(56,189,248,0.06)]" />
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
            <div className="absolute -left-1/3 top-0 h-full w-[34%] rotate-12 bg-gradient-to-r from-transparent via-white/8 to-transparent blur-2xl animate-[threatSweep_8s_linear_infinite]" />
          </div>

          <motion.div
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[76%] w-[76%] -translate-x-1/2 -translate-y-1/2 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, transparent 306deg, rgba(59,130,246,0.05) 330deg, rgba(250,204,21,0.14) 346deg, rgba(255,255,255,0.05) 354deg, transparent 360deg)",
              filter: "blur(1px)",
              boxShadow: "0 0 46px rgba(37,99,235,0.05) inset",
            }}
          />

          <Globe
            ref={globeRef}
            width={globeSize.width}
            height={globeSize.height}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg"
                        atmosphereColor="#2563eb"
            atmosphereAltitude={0.11}
            polygonsData={countries}
            polygonCapColor={(feat: CountryFeature) => {
              const country =
                feat?.properties?.name ||
                feat?.properties?.NAME ||
                feat?.properties?.admin ||
                "";
              const key = normalizeCountry(String(country));
              const level = hotCountries.get(key);
              const flashing = flashCountryKeys.includes(key);

              if (flashing) return "rgba(250,204,21,0.58)";
              if (level === "critical") return "rgba(239,68,68,0.42)";
              if (level === "high") return "rgba(245,158,11,0.28)";
              if (level === "medium") return "rgba(96,165,250,0.22)";
              if (level === "low") return "rgba(34,197,94,0.16)";
              return "rgba(17,24,39,0.14)";
            }}
            polygonSideColor={() => "rgba(14,165,233,0.04)"}
            polygonStrokeColor={() => "rgba(148,163,184,0.14)"}
            polygonAltitude={0.009}
            onPolygonClick={(feat: CountryFeature) => {
              const globe = globeRef.current;
              if (!globe) return;

              const center = featureCenter(feat);
              if (!center) return;

              globe.pointOfView({ lat: center.lat, lng: center.lng, altitude: 1.2 }, 1000);

              window.setTimeout(() => {
                globe.pointOfView({ lat: 10, lng: 15, altitude: globeSize.altitude }, 1800);
              }, 2500);
            }}
            pointsData={[...globePoints, ...escalationPoints]}
            pointLat="lat"
            pointLng="lng"
            pointAltitude="altitude"
            pointRadius="radius"
            pointColor="color"
            pointResolution={10}
            onPointClick={(d: GlobePoint | EscalationPoint) => {
              const globe = globeRef.current;
              if (!globe) return;

              globe.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.15 }, 900);

              window.setTimeout(() => {
                globe.pointOfView({ lat: 10, lng: 15, altitude: globeSize.altitude }, 1800);
              }, 2400);
            }}
            pointLabel={(d: GlobePoint | EscalationPoint) => `
              <div style="padding:8px 10px; border-radius:12px; background:rgba(3,7,18,0.92); color:white; min-width:180px; border:1px solid rgba(255,255,255,0.10); box-shadow:0 0 24px rgba(0,0,0,0.25)">
                <div style="font-weight:700; margin-bottom:4px;">${d.name}</div>
                <div style="font-size:12px; opacity:0.78;">${d.location}, ${d.country}</div>
                <div style="font-size:12px; margin-top:6px;">Threat: <b>${d.threatScore}</b></div>
              </div>
            `}
            ringsData={[...ringSites, ...escalationPoints]}
            ringLat="lat"
            ringLng="lng"
            ringColor={(d: GlobePoint | EscalationPoint) => {
              if ("triggerModule" in d) {
                return moduleGlowColor(d.triggerModule, d.escalationLevel ?? "district");
              }
              return d.threatLevel === "critical"
                ? "rgba(239,68,68,0.68)"
                : "rgba(245,158,11,0.52)";
            }}
            ringMaxRadius={(d: GlobePoint | EscalationPoint) => {
              if ("triggerModule" in d) {
                return d.escalationLevel === "global-command" ? 4.8 : 3.4;
              }
              return d.threatLevel === "critical" ? 4.2 : 2.9;
            }}
            ringPropagationSpeed={() => 0.88}
            ringRepeatPeriod={(d: GlobePoint | EscalationPoint) => {
              if ("triggerModule" in d) {
                return d.escalationLevel === "global-command" ? 1400 : 1800;
              }
              return d.threatLevel === "critical" ? 1350 : 1850;
            }}
            arcsData={arcsData}
            arcStartLat="startLat"
            arcStartLng="startLng"
            arcEndLat="endLat"
            arcEndLng="endLng"
            arcColor="color"
            arcDashLength={0.28}
            arcDashGap={0.22}
            arcDashAnimateTime={2200}
            arcStroke={0.32}
            labelsData={labelsData}
            labelLat="lat"
            labelLng="lng"
            labelText="text"
            labelColor="color"
            labelSize={() => (isMobile ? 0.78 : 1.12)}
            labelDotRadius={() => (isMobile ? 0.12 : 0.2)}
            labelResolution={1}
            htmlElementsData={isMobile ? [...countryLabelPoints, ...majorCountryLabelPoints] : [...countryLabelPoints, ...allCountryLabelPoints]}
            htmlLat="lat"
            htmlLng="lng"
            htmlElement={(d: CountryLabelPoint) => {
              const el = document.createElement("div");
              el.textContent = d.text;
              el.style.color = d.color;
              el.style.fontSize = `${(d.size ?? 0.7) * 10}px`;
              el.style.fontWeight = d.size > 1 ? "700" : "500";
              el.style.letterSpacing = d.size > 1 ? "0.08em" : "0.03em";
              el.style.textShadow = "0 0 10px rgba(0,0,0,0.82)";
              el.style.whiteSpace = "nowrap";
              el.style.pointerEvents = "none";
              el.style.opacity = "0.86";
              return el;
            }}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.75)]" />
            <span>EarthShield hotspot</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.75)]" />
            <span>Energy hotspot</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.75)]" />
            <span>LifeMesh hotspot</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-[2px] w-5 rounded-full bg-gradient-to-r from-green-500 to-red-500" />
            <span>Response routes</span>
          </div>
        </div>
      </div>
    </>
  );
}
