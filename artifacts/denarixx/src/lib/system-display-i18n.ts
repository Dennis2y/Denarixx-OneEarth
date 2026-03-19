import type { TFunction } from "i18next";

function norm(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

export function trThreatLevel(t: TFunction, value: string) {
  const v = norm(value);
  if (v === "critical") return t("sysmap.threat.critical");
  if (v === "high") return t("sysmap.threat.high");
  if (v === "medium") return t("sysmap.threat.medium");
  if (v === "low") return t("sysmap.threat.low");
  return value;
}

export function trPriority(t: TFunction, value: string) {
  const v = norm(value);
  if (v === "immediate") return t("sysmap.priority.immediate");
  if (v === "urgent") return t("sysmap.priority.urgent");
  if (v === "priority") return t("sysmap.priority.priority");
  if (v === "routine") return t("sysmap.priority.routine");
  return value;
}

export function trStatus(t: TFunction, value: string) {
  const v = norm(value);
  if (v === "active") return t("sysmap.status.active");
  if (v === "resolved") return t("sysmap.status.resolved");
  if (v === "monitoring") return t("sysmap.status.monitoring");
  if (v === "stable") return t("sysmap.status.stable");
  if (v === "offline") return t("sysmap.status.offline");
  if (v === "unstable") return t("sysmap.status.unstable");
  return value;
}

export function trModule(t: TFunction, value: string) {
  const v = norm(value);
  if (v.includes("earth")) return t("sysmap.module.earthshield");
  if (v.includes("life")) return t("sysmap.module.lifemesh");
  if (v.includes("energy")) return t("sysmap.module.energy");
  return value;
}

export function trSiteType(t: TFunction, value: string) {
  const v = norm(value);
  if (v === "district") return t("sysmap.siteType.district");
  if (v === "shelter") return t("sysmap.siteType.shelter");
  if (v === "village") return t("sysmap.siteType.village");
  if (v === "school") return t("sysmap.siteType.school");
  if (v === "clinic") return t("sysmap.siteType.clinic");
  if (v === "alert") return t("sysmap.siteType.alert");
  if (v === "site") return t("sysmap.siteType.site");
  return value;
}

export function trEscalationLevel(t: TFunction, value: string) {
  const v = norm(value);
  if (v === "site") return t("sysmap.escalation.site");
  if (v === "district") return t("sysmap.escalation.district");
  if (v === "regional-command") return t("sysmap.escalation.regionalCommand");
  if (v === "global-command") return t("sysmap.escalation.globalCommand");
  return value;
}

export function trDeploymentMode(t: TFunction, value: string) {
  const v = norm(value);
  if (v === "monitor") return t("sysmap.deployment.monitor");
  if (v === "prepare") return t("sysmap.deployment.prepare");
  if (v === "rapid-response") return t("sysmap.deployment.rapidResponse");
  if (v === "immediate-deployment") return t("sysmap.deployment.immediateDeployment");
  return value;
}

export function trScenarioLabel(t: TFunction, value: string) {
  const v = norm(value);
  if (v === "flood event") return t("sysmap.scenario.floodEvent");
  if (v === "severe storm") return t("sysmap.scenario.severeStorm");
  if (v === "wildfire risk") return t("sysmap.scenario.wildfireRisk");
  if (v === "clinic power outage") return t("sysmap.scenario.clinicPowerOutage");
  if (v === "multi-site outage") return t("sysmap.scenario.multiSiteOutage");
  if (v === "child emergency / sos escalation") return t("sysmap.scenario.childEmergency");
  return value;
}

export function trDirective(t: TFunction, value: string) {
  const v = norm(value);

  if (v === "escalate to regional command and activate protective response") {
    return t("sysmap.directive.escalateRegional");
  }
  if (v === "dispatch response team and increase monitoring immediately") {
    return t("sysmap.directive.dispatchResponseTeam");
  }
  if (v === "escalate to global command authority and initiate full crisis coordination.") {
    return t("sysmap.directive.escalateGlobal");
  }
  if (v === "dispatch initiated → dispatch command-approved response teams immediately") {
    return t("sysmap.directive.dispatchInitiated");
  }
  if (v === "operator review ready.") {
    return t("sysmap.directive.operatorReviewReady");
  }

  return value;
}

export function trLiveMessage(t: TFunction, value: string) {
  const v = norm(value);

  if (v === "earthshield monitoring active") return t("sysmap.live.earthshieldMonitoring");
  if (v === "lifemesh response network connected") return t("sysmap.live.lifemeshConnected");
  if (v === "energy resilience intelligence online") return t("sysmap.live.energyOnline");
  if (v === "flood event simulation triggered global-command escalation") {
    return t("sysmap.live.floodGlobalEscalation");
  }

  return value;
}
