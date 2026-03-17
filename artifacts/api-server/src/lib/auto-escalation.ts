export type EscalationLevel =
  | "site"
  | "district"
  | "regional-command"
  | "global-command";

export type DeploymentMode =
  | "monitor"
  | "prepare"
  | "rapid-response"
  | "immediate-deployment";

export type OperatingProtocol =
  | "routine-observation"
  | "heightened-readiness"
  | "emergency-containment"
  | "mass-casualty-protection";

export type AutoEscalationInput = {
  threatScore: number;
  riskSeverity: string;
  triggerModule: "energy" | "lifemesh" | "earthshield";
  affectedSitesCount: number;
  atRiskPersonsCount: number;
  criticalFacilitiesCount: number;
  estimatedPopulationAtRisk: number;
};

export type AutoEscalationResult = {
  escalationLevel: EscalationLevel;
  deploymentMode: DeploymentMode;
  operatingProtocol: OperatingProtocol;
  operatorDirective: string;
  recommendedTeams: string[];
  recommendedActions: string[];
};

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score));
}

export function buildAutoEscalation(input: AutoEscalationInput): AutoEscalationResult {
  const threatScore = clampScore(input.threatScore);

  let escalationLevel: EscalationLevel = "site";
  let deploymentMode: DeploymentMode = "monitor";
  let operatingProtocol: OperatingProtocol = "routine-observation";

  const recommendedTeams = new Set<string>();
  const recommendedActions: string[] = [];

  if (input.triggerModule === "earthshield") {
    recommendedTeams.add("EarthShield Hazard Analysis Unit");
    recommendedTeams.add("Regional Field Operations");
  }

  if (input.triggerModule === "energy") {
    recommendedTeams.add("Energy Grid Stabilization Team");
    recommendedTeams.add("Backup Power Logistics Unit");
  }

  if (input.triggerModule === "lifemesh") {
    recommendedTeams.add("LifeMesh Emergency Response Team");
    recommendedTeams.add("Medical Coordination Unit");
    recommendedTeams.add("Family Liaison Desk");
  }

  if (input.criticalFacilitiesCount > 0) {
    recommendedTeams.add("Critical Infrastructure Protection Unit");
  }

  if (input.atRiskPersonsCount >= 3) {
    recommendedTeams.add("Protected Persons Recovery Team");
  }

  if (threatScore >= 90 || input.estimatedPopulationAtRisk >= 50000) {
    escalationLevel = "global-command";
    deploymentMode = "immediate-deployment";
    operatingProtocol = "mass-casualty-protection";
  } else if (
    threatScore >= 80 ||
    input.riskSeverity === "critical" ||
    input.atRiskPersonsCount >= 3 ||
    input.criticalFacilitiesCount >= 1
  ) {
    escalationLevel = "regional-command";
    deploymentMode = "immediate-deployment";
    operatingProtocol = "emergency-containment";
  } else if (
    threatScore >= 60 ||
    input.affectedSitesCount >= 3 ||
    input.estimatedPopulationAtRisk >= 10000
  ) {
    escalationLevel = "district";
    deploymentMode = "rapid-response";
    operatingProtocol = "heightened-readiness";
  } else if (threatScore >= 40) {
    escalationLevel = "site";
    deploymentMode = "prepare";
    operatingProtocol = "heightened-readiness";
  }

  if (deploymentMode === "immediate-deployment") {
    recommendedActions.push("Dispatch command-approved response teams immediately");
    recommendedActions.push("Activate cross-module incident bridge and live field reporting");
  } else if (deploymentMode === "rapid-response") {
    recommendedActions.push("Pre-stage field response units and logistics assets");
    recommendedActions.push("Escalate monitoring cadence to 15-minute operational updates");
  } else if (deploymentMode === "prepare") {
    recommendedActions.push("Prepare standby crews and verify equipment readiness");
    recommendedActions.push("Increase local alerting and operational monitoring");
  } else {
    recommendedActions.push("Continue routine observation and readiness checks");
  }

  if (operatingProtocol === "emergency-containment") {
    recommendedActions.push("Stabilize affected zone and contain spillover risk");
  }

  if (operatingProtocol === "mass-casualty-protection") {
    recommendedActions.push("Prioritize life safety, evacuation, and protected-person extraction");
    recommendedTeams.add("Mass Casualty Coordination Cell");
  }

  let operatorDirective = "Maintain standard monitoring posture.";

  if (escalationLevel === "global-command") {
    operatorDirective = "Escalate to global command authority and initiate full crisis coordination.";
  } else if (escalationLevel === "regional-command") {
    operatorDirective = "Escalate to regional command and authorize immediate deployment.";
  } else if (escalationLevel === "district") {
    operatorDirective = "Escalate to district command and prepare rapid-response dispatch.";
  } else if (deploymentMode === "prepare") {
    operatorDirective = "Keep site command active and move teams into standby readiness.";
  }

  return {
    escalationLevel,
    deploymentMode,
    operatingProtocol,
    operatorDirective,
    recommendedTeams: Array.from(recommendedTeams),
    recommendedActions,
  };
}
