import React, { useMemo } from "react";
import { cn } from "@/components/ui-core";

type ThreatLevel = "low" | "medium" | "high" | "critical";

type GlobeSite = {
  id: number;
  name: string;
  country: string;
  location: string;
  latitude: number;
  longitude: number;
  threatScore: number;
  threatLevel: ThreatLevel;
};

function threatColor(level: ThreatLevel) {
  if (level === "critical") return "#ef4444";
  if (level === "high") return "#f59e0b";
  if (level === "medium") return "#60a5fa";
  return "#22c55e";
}

function projectToSphere(lat: number, lon: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(Math.sin(phi) * Math.cos(theta));
  const y = Math.cos(phi);
  const z = Math.sin(phi) * Math.sin(theta);

  return { x, y, z };
}

function toScreen(lat: number, lon: number, size = 1000) {
  const p = projectToSphere(lat, lon);
  const radius = size * 0.36;
  const cx = size / 2;
  const cy = size / 2;

  return {
    x: cx + p.x * radius,
    y: cy + p.y * radius,
    z: p.z,
  };
}

export default function ThreatGlobe({ sites }: { sites: GlobeSite[] }) {
  const visibleSites = useMemo(() => {
    return sites
      .map((site) => ({
        ...site,
        point: toScreen(site.latitude, site.longitude),
      }))
      .filter((site) => site.point.z > -0.25)
      .sort((a, b) => a.point.z - b.point.z);
  }, [sites]);

  const connectionSites = useMemo(() => {
    return [...sites]
      .sort((a, b) => b.threatScore - a.threatScore)
      .slice(0, 8)
      .map((site) => ({
        ...site,
        point: toScreen(site.latitude, site.longitude),
      }))
      .filter((site) => site.point.z > -0.1);
  }, [sites]);

  const connections = useMemo(() => {
    const lines: Array<{ a: typeof connectionSites[number]; b: typeof connectionSites[number] }> = [];
    for (let i = 0; i < connectionSites.length - 1; i++) {
      lines.push({ a: connectionSites[i], b: connectionSites[i + 1] });
    }
    return lines;
  }, [connectionSites]);

  return (
    <div className="relative mx-auto w-full max-w-[560px] aspect-square">
      <style>{`
        @keyframes denarixx-spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes denarixx-spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes denarixx-pulse-hot {
          0%, 100% { transform: scale(1); opacity: 0.95; }
          50% { transform: scale(1.45); opacity: 0.5; }
        }
        @keyframes denarixx-scan {
          0% { transform: translateY(-130%) rotate(0deg); opacity: 0; }
          15% { opacity: 0.28; }
          50% { opacity: 0.18; }
          100% { transform: translateY(130%) rotate(6deg); opacity: 0; }
        }
      `}</style>

      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(96,165,250,0.25),transparent_28%),radial-gradient(circle_at_65%_65%,rgba(34,197,94,0.14),transparent_26%),radial-gradient(circle_at_center,rgba(5,10,25,0.85),rgba(2,6,23,0.98))] shadow-[0_0_80px_rgba(14,165,233,0.10),0_0_140px_rgba(234,179,8,0.08)] border border-cyan-500/10 overflow-hidden" />

      <div
        className="absolute inset-[5%] rounded-full border border-cyan-400/15"
        style={{ animation: "denarixx-spin-slow 36s linear infinite" }}
      >
        <div className="absolute inset-0 rounded-full border-t border-cyan-300/15 border-b border-cyan-300/10" />
        <div className="absolute inset-[10%] rounded-full border border-cyan-300/10" />
        <div className="absolute inset-[22%] rounded-full border border-cyan-300/10" />
      </div>

      <div
        className="absolute inset-[11%] rounded-full border border-emerald-400/10"
        style={{ animation: "denarixx-spin-reverse 22s linear infinite" }}
      >
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-cyan-300/10" />
        <div className="absolute left-[30%] top-0 h-full w-px bg-cyan-300/10" />
        <div className="absolute left-[70%] top-0 h-full w-px bg-cyan-300/10" />
      </div>

      <div className="absolute inset-[8%] rounded-full overflow-hidden">
        <div
          className="absolute inset-x-0 h-[38%] bg-[linear-gradient(180deg,transparent,rgba(16,185,129,0.12),rgba(239,68,68,0.12),transparent)] blur-xl"
          style={{ animation: "denarixx-scan 5.5s linear infinite" }}
        />

        <svg viewBox="0 0 1000 1000" className="absolute inset-0 w-full h-full">
          <defs>
            <radialGradient id="denarixx-globe-core" cx="35%" cy="30%">
              <stop offset="0%" stopColor="rgba(59,130,246,0.18)" />
              <stop offset="55%" stopColor="rgba(16,185,129,0.05)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <filter id="denarixx-glow-red">
              <feGaussianBlur stdDeviation="7" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="denarixx-glow-green">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle cx="500" cy="500" r="362" fill="url(#denarixx-globe-core)" />

          {connections.map((line, index) => (
            <line
              key={`${line.a.id}-${line.b.id}-${index}`}
              x1={line.a.point.x}
              y1={line.a.point.y}
              x2={line.b.point.x}
              y2={line.b.point.y}
              stroke={line.a.threatScore >= 80 || line.b.threatScore >= 80 ? "rgba(239,68,68,0.34)" : "rgba(34,197,94,0.26)"}
              strokeWidth={line.a.threatScore >= 80 || line.b.threatScore >= 80 ? 2.4 : 1.6}
              strokeDasharray={line.a.threatScore >= 80 || line.b.threatScore >= 80 ? "0 0" : "6 8"}
              opacity={0.9}
            />
          ))}

          {visibleSites.map((site) => {
            const color = threatColor(site.threatLevel);
            const isDanger = site.threatLevel === "critical" || site.threatLevel === "high";
            const size = isDanger ? Math.max(6, Math.min(14, 5 + site.threatScore / 18)) : 4.5;

            return (
              <g key={site.id}>
                {isDanger && (
                  <circle
                    cx={site.point.x}
                    cy={site.point.y}
                    r={size * 1.8}
                    fill="rgba(239,68,68,0.18)"
                    filter="url(#denarixx-glow-red)"
                  />
                )}
                {!isDanger && (
                  <circle
                    cx={site.point.x}
                    cy={site.point.y}
                    r={size * 1.45}
                    fill="rgba(34,197,94,0.12)"
                    filter="url(#denarixx-glow-green)"
                  />
                )}
                <circle
                  cx={site.point.x}
                  cy={site.point.y}
                  r={size}
                  fill={color}
                  stroke={isDanger ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.4)"}
                  strokeWidth={1}
                />
              </g>
            );
          })}
        </svg>

        {visibleSites
          .filter((s) => s.threatLevel === "critical")
          .slice(0, 10)
          .map((site) => {
            const left = `${(site.point.x / 1000) * 100}%`;
            const top = `${(site.point.y / 1000) * 100}%`;
            const size = Math.max(10, Math.min(18, 8 + site.threatScore / 16));

            return (
              <div
                key={`pulse-${site.id}`}
                className="absolute rounded-full bg-red-500/20 pointer-events-none"
                style={{
                  left,
                  top,
                  width: `${size}px`,
                  height: `${size}px`,
                  marginLeft: `${-size / 2}px`,
                  marginTop: `${-size / 2}px`,
                  boxShadow: "0 0 18px rgba(239,68,68,0.95), 0 0 42px rgba(239,68,68,0.55)",
                  animation: "denarixx-pulse-hot 1.8s ease-in-out infinite",
                }}
              />
            );
          })}
      </div>

      <div className="absolute inset-0 rounded-full border border-white/5 pointer-events-none" />
      <div className="absolute inset-[6%] rounded-full border border-primary/10 pointer-events-none" />
      <div className="absolute inset-[16%] rounded-full shadow-[inset_0_0_60px_rgba(56,189,248,0.08)] pointer-events-none" />

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-wrap items-center justify-center gap-3 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl px-4 py-2 text-[11px]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.95)]" />
          <span className="text-muted-foreground">Critical danger</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.7)]" />
          <span className="text-muted-foreground">High risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.7)]" />
          <span className="text-muted-foreground">Stable node</span>
        </div>
      </div>
    </div>
  );
}
