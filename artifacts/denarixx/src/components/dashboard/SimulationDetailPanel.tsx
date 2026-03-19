import React from "react";
import { useTranslation } from "react-i18next";
import { Activity, Shield, Users, Zap, Radio, TriangleAlert, Clock3 } from "lucide-react";
import { Card, Badge, Button, cn } from "@/components/ui-core";

type Props = {
  detail: any | null;
  loading?: boolean;
  error?: string | null;
  onClose?: () => void;
};

function badgeTone(value: string) {
  const v = String(value).toLowerCase();
  if (v.includes("critical") || v.includes("global")) return "border-red-500/30 bg-red-500/10 text-red-300";
  if (v.includes("warning") || v.includes("regional") || v.includes("rapid")) return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  if (v.includes("district") || v.includes("prepare")) return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  return "border-green-500/30 bg-green-500/10 text-green-300";
}

function moduleTone(value: string) {
  const v = String(value).toLowerCase();
  if (v.includes("energy")) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (v.includes("life")) return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return "border-sky-500/30 bg-sky-500/10 text-sky-300";
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function SimulationDetailPanel({
  detail,
  loading = false,
  error = null,
  onClose,
}: Props) {
  const { t } = useTranslation();
  return (
    <Card className="overflow-hidden border border-cyan-500/15 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_35%),linear-gradient(180deg,rgba(10,14,25,0.95),rgba(4,7,15,0.98))] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
              Simulation Detail Viewer
            </Badge>
            <Badge className="border-white/10 bg-white/5 text-slate-300">
              {loading ? "Loading" : detail ? "Active" : "Idle"}
            </Badge>
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            {detail?.scenarioLabel || "No simulation selected"}
          </div>
          <div className="mt-1 text-sm text-slate-400">
            {detail ? `${detail.scenarioId} · ${formatDate(detail.simulatedAt)}` : "Select a command history row to inspect the full simulation"}
          </div>
        </div>

        {onClose ? (
          <Button
            variant="secondary"
            onClick={onClose}
            className="border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
          >
            Close
          </Button>
        ) : null}
      </div>

      <div className="space-y-5 p-5">
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            Loading simulation detail...
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            <TriangleAlert className="h-4 w-4" />
            {error}
          </div>
        ) : !detail ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            No simulation detail loaded yet.
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                  <Activity className="h-3.5 w-3.5" />
                  Threat Score
                </div>
                <div className="mt-2 text-3xl font-semibold text-amber-300">{detail.threatScore ?? "—"}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                  <Shield className="h-3.5 w-3.5" />
                  Readiness
                </div>
                <div className="mt-2 text-3xl font-semibold text-white">{detail.readinessScore ?? "—"}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                  <Users className="h-3.5 w-3.5" />
                  At Risk
                </div>
                <div className="mt-2 text-3xl font-semibold text-white">{detail.atRiskPersonsCount ?? "—"}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                  <Zap className="h-3.5 w-3.5" />
                  Backup Hours
                </div>
                <div className="mt-2 text-3xl font-semibold text-white">{detail.energyStatus?.backupHoursEstimate ?? "—"}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className={cn("border", moduleTone(detail.triggerModule))}>
                {detail.triggerModule}
              </Badge>
              <Badge className={cn("border", badgeTone(detail.riskSeverity))}>
                {detail.riskSeverity}
              </Badge>
              <Badge className={cn("border", badgeTone(detail.autoEscalation?.escalationLevel || ""))}>
                {detail.autoEscalation?.escalationLevel || "—"}
              </Badge>
              <Badge className={cn("border", badgeTone(detail.autoEscalation?.deploymentMode || ""))}>
                {detail.autoEscalation?.deploymentMode || "—"}
              </Badge>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-5">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-sm font-semibold text-white">{t("simulation.operatorDirective")}</div>
                  <div className="mt-3 text-sm leading-6 text-slate-300">
                    {detail.autoEscalation?.operatorDirective || "No directive available."}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-sm font-semibold text-white">{t("simulation.recommendedActions")}</div>
                  <div className="mt-3 space-y-2">
                    {(detail.recommendedActions || []).slice(0, 6).map((action: string, index: number) => (
                      <div key={`${action}-${index}`} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-300">
                        {action}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-sm font-semibold text-white">{t("simulation.affectedSites")}</div>
                  <div className="mt-3 space-y-2">
                    {(detail.affectedSites || []).slice(0, 5).map((site: any) => (
                      <div key={site.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                        <div className="text-sm font-medium text-white">{site.name}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {site.location}, {site.country} · {site.type}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Radio className="h-4 w-4 text-cyan-300" />
                    Response Layer
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className={cn("border", badgeTone(detail.autoResponse?.responseTier || ""))}>
                      {detail.autoResponse?.responseTier || "—"}
                    </Badge>
                    <Badge className={cn("border", badgeTone(detail.autoResponse?.responseMode || ""))}>
                      {detail.autoResponse?.responseMode || "—"}
                    </Badge>
                  </div>
                  <div className="mt-3 text-sm text-slate-300">
                    {detail.autoResponse?.commandMessage || "No response command message available."}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Clock3 className="h-4 w-4 text-cyan-300" />
                    Escalation Timeline
                  </div>
                  <div className="mt-3 space-y-2">
                    {(detail.escalationTimeline || []).slice(0, 6).map((item: any, index: number) => (
                      <div key={`${item.time}-${index}`} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-medium text-white">{item.event}</div>
                          <Badge className={cn("border", badgeTone(item.severity || ""))}>
                            {item.severity}
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs text-slate-400">{item.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
