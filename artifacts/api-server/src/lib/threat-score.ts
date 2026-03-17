type ThreatLevel = "low" | "medium" | "high" | "critical";
type ResponsePriority = "routine" | "priority" | "urgent" | "immediate";

type AlertInput = {
  title?: string;
  severity?: string;
  module?: string;
  location?: string;
  description?: string;
};

type SiteInput = {
  name?: string;
  type?: string;
  status?: string;
  currentRiskLevel?: string;
  population?: number;
  powerAvailability?: number;
  country?: string;
};

type ThreatScoreResult = {
  threatScore: number;
  threatLevel: ThreatLevel;
  responsePriority: ResponsePriority;
  recommendedAction: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function levelFromScore(score: number): ThreatLevel {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function priorityFromScore(score: number): ResponsePriority {
  if (score >= 85) return "immediate";
  if (score >= 65) return "urgent";
  if (score >= 40) return "priority";
  return "routine";
}

function actionFromLevel(level: ThreatLevel, domain: "alert" | "site"): string {
  if (domain === "alert") {
    if (level === "critical") return "Escalate to regional command and activate protective response";
    if (level === "high") return "Dispatch response team and increase monitoring immediately";
    if (level === "medium") return "Monitor closely and prepare contingency resources";
    return "Log event and continue standard observation";
  }

  if (level === "critical") return "Activate emergency site stabilization and command escalation";
  if (level === "high") return "Dispatch technical and field response teams";
  if (level === "medium") return "Increase site monitoring and prepare mitigation assets";
  return "Maintain routine monitoring";
}

export function scoreAlert(input: AlertInput): ThreatScoreResult {
  let score = 0;

  const severity = String(input.severity ?? "").toLowerCase();
  const moduleName = String(input.module ?? "").toLowerCase();
  const title = `${input.title ?? ""} ${input.description ?? ""}`.toLowerCase();

  if (severity === "critical") score += 55;
  else if (severity === "warning") score += 35;
  else if (severity === "info") score += 12;

  if (moduleName === "lifemesh") score += 15;
  if (moduleName === "earthshield") score += 20;
  if (moduleName === "energy") score += 18;

  if (title.includes("flood")) score += 18;
  if (title.includes("storm")) score += 16;
  if (title.includes("wildfire")) score += 18;
  if (title.includes("earthquake")) score += 20;
  if (title.includes("sos")) score += 22;
  if (title.includes("outage")) score += 15;
  if (title.includes("medical")) score += 14;
  if (title.includes("shelter")) score += 10;
  if (title.includes("clinic")) score += 10;
  if (title.includes("child")) score += 14;

  const threatScore = clamp(score, 0, 100);
  const threatLevel = levelFromScore(threatScore);
  const responsePriority = priorityFromScore(threatScore);

  return {
    threatScore,
    threatLevel,
    responsePriority,
    recommendedAction: actionFromLevel(threatLevel, "alert"),
  };
}

export function scoreSite(input: SiteInput): ThreatScoreResult {
  let score = 0;

  const siteType = String(input.type ?? "").toLowerCase();
  const status = String(input.status ?? "").toLowerCase();
  const riskLevel = String(input.currentRiskLevel ?? "").toLowerCase();
  const population = Number(input.population ?? 0);
  const powerAvailability = Number(input.powerAvailability ?? 100);

  if (status === "critical") score += 40;
  else if (status === "warning") score += 22;
  else if (status === "online") score += 4;

  if (riskLevel === "critical") score += 35;
  else if (riskLevel === "high") score += 25;
  else if (riskLevel === "medium") score += 12;
  else if (riskLevel === "low") score += 2;

  if (siteType === "clinic") score += 18;
  if (siteType === "shelter") score += 16;
  if (siteType === "school") score += 12;
  if (siteType === "district") score += 10;
  if (siteType === "village") score += 8;

  if (population >= 50000) score += 18;
  else if (population >= 10000) score += 12;
  else if (population >= 1000) score += 6;

  if (powerAvailability < 25) score += 22;
  else if (powerAvailability < 50) score += 14;
  else if (powerAvailability < 75) score += 7;

  const threatScore = clamp(score, 0, 100);
  const threatLevel = levelFromScore(threatScore);
  const responsePriority = priorityFromScore(threatScore);

  return {
    threatScore,
    threatLevel,
    responsePriority,
    recommendedAction: actionFromLevel(threatLevel, "site"),
  };
}
