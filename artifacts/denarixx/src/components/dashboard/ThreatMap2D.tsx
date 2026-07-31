import { useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  ZoomControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

type UnknownRecord = Record<string, unknown>;

type ThreatMap2DProps = {
  sites?: unknown[];
  escalations?: unknown[];
  liveFlashToken?: unknown;
};

type MapPoint = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  level: string;
  status: string;
  description?: string;
  escalation: boolean;
};

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object"
    ? (value as UnknownRecord)
    : {};
}

function firstValue(
  record: UnknownRecord,
  keys: string[],
): unknown {
  for (const key of keys) {
    const value = record[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function normalizeLevel(value: unknown): string {
  const level = String(value ?? "low").toLowerCase();

  if (
    level.includes("critical") ||
    level.includes("emergency") ||
    level.includes("severe")
  ) {
    return "critical";
  }

  if (
    level.includes("high") ||
    level.includes("urgent") ||
    level.includes("danger")
  ) {
    return "high";
  }

  if (
    level.includes("medium") ||
    level.includes("moderate") ||
    level.includes("warning")
  ) {
    return "medium";
  }

  return "low";
}

function markerColor(level: string): string {
  switch (level) {
    case "critical":
      return "#ef4444";
    case "high":
      return "#f97316";
    case "medium":
      return "#facc15";
    default:
      return "#22c55e";
  }
}

function readCoordinates(
  record: UnknownRecord,
): { latitude: number; longitude: number } | null {
  const location = asRecord(record.location);
  const coordinates = asRecord(record.coordinates);
  const position = asRecord(record.position);

  const latitude = toFiniteNumber(
    firstValue(record, ["latitude", "lat"]) ??
      firstValue(location, ["latitude", "lat"]) ??
      firstValue(coordinates, ["latitude", "lat"]) ??
      firstValue(position, ["latitude", "lat"]),
  );

  const longitude = toFiniteNumber(
    firstValue(record, ["longitude", "lng", "lon", "long"]) ??
      firstValue(location, ["longitude", "lng", "lon", "long"]) ??
      firstValue(coordinates, ["longitude", "lng", "lon", "long"]) ??
      firstValue(position, ["longitude", "lng", "lon", "long"]),
  );

  if (
    latitude === null ||
    longitude === null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}

function createEscalationKeys(escalations: unknown[]): Set<string> {
  const keys = new Set<string>();

  for (const item of escalations) {
    const record = asRecord(item);

    const values = [
      record.id,
      record.siteId,
      record.site_id,
      record.nodeId,
      record.node_id,
      record.name,
      record.siteName,
      record.title,
    ];

    for (const value of values) {
      if (value !== undefined && value !== null) {
        keys.add(String(value).toLowerCase());
      }
    }
  }

  return keys;
}

function normalizePoint(
  value: unknown,
  index: number,
  escalationKeys: Set<string>,
): MapPoint | null {
  const record = asRecord(value);
  const coordinates = readCoordinates(record);

  if (!coordinates) {
    return null;
  }

  const rawId = firstValue(record, [
    "id",
    "siteId",
    "site_id",
    "nodeId",
    "node_id",
  ]);

  const rawName = firstValue(record, [
    "name",
    "siteName",
    "site_name",
    "title",
    "label",
    "city",
  ]);

  const id = String(rawId ?? `site-${index + 1}`);
  const name = String(rawName ?? `Site ${index + 1}`);

  const level = normalizeLevel(
    firstValue(record, [
      "threatLevel",
      "threat_level",
      "riskLevel",
      "risk_level",
      "severity",
      "level",
      "priority",
      "status",
    ]),
  );

  const status = String(
    firstValue(record, [
      "status",
      "operationalStatus",
      "operational_status",
      "state",
    ]) ?? "Operational",
  );

  const descriptionValue = firstValue(record, [
    "description",
    "summary",
    "message",
    "event",
  ]);

  const escalation =
    Boolean(record.escalated) ||
    Boolean(record.isEscalation) ||
    escalationKeys.has(id.toLowerCase()) ||
    escalationKeys.has(name.toLowerCase());

  return {
    id,
    name,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    level,
    status,
    description:
      descriptionValue === undefined
        ? undefined
        : String(descriptionValue),
    escalation,
  };
}

export default function ThreatMap2D({
  sites = [],
  escalations = [],
}: ThreatMap2DProps) {
  const points = useMemo(() => {
    const escalationKeys = createEscalationKeys(escalations);

    return sites
      .map((site, index) =>
        normalizePoint(site, index, escalationKeys),
      )
      .filter((point): point is MapPoint => point !== null);
  }, [sites, escalations]);

  return (
    <div className="relative h-full min-h-[280px] w-full overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={10}
        scrollWheelZoom
        zoomControl={false}
        worldCopyJump
        className="h-full min-h-[280px] w-full bg-slate-950"
      >
        <TileLayer
          attribution="© OpenStreetMap contributors © CARTO"
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <ZoomControl position="bottomright" />

        {points.map((point) => {
          const color = markerColor(point.level);

          return (
            <CircleMarker
              key={`${point.id}-${point.latitude}-${point.longitude}`}
              center={[point.latitude, point.longitude]}
              radius={point.escalation ? 10 : 7}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: point.escalation ? 0.95 : 0.78,
                opacity: 1,
                weight: point.escalation ? 3 : 2,
              }}
            >
              <Popup>
                <div className="min-w-[190px]">
                  <div className="text-base font-semibold">
                    {point.name}
                  </div>

                  <div className="mt-2 text-sm">
                    <strong>Status:</strong> {point.status}
                  </div>

                  <div className="mt-1 text-sm capitalize">
                    <strong>Threat:</strong> {point.level}
                  </div>

                  {point.escalation ? (
                    <div className="mt-2 font-semibold text-red-600">
                      Active escalation
                    </div>
                  ) : null}

                  {point.description ? (
                    <div className="mt-2 text-sm">
                      {point.description}
                    </div>
                  ) : null}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-xl border border-cyan-400/20 bg-slate-950/90 px-3 py-2 shadow-xl backdrop-blur">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
          2D Command Map
        </div>

        <div className="mt-1 text-[11px] text-slate-400">
          {points.length} live nodes displayed
        </div>
      </div>

      {points.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center">
          <div className="rounded-xl border border-slate-700 bg-slate-950/90 px-5 py-4 text-center shadow-xl">
            <div className="font-semibold text-white">
              Global Command Map
            </div>
            <div className="mt-2 text-sm text-slate-400">
              No sites with valid coordinates are currently available.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
