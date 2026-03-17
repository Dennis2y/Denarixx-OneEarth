export type AutoResponseInput = {
  triggerModule: "energy" | "lifemesh" | "earthshield";
  threatScore: number;
  escalationLevel: string;
  deploymentMode: string;
  affectedSitesCount: number;
  atRiskPersonsCount: number;
  estimatedPopulationAtRisk: number;
};

export type AutoResponseResult = {
  responseTier: "local" | "district" | "regional" | "global";
  responseMode: "observe" | "prepare" | "dispatch" | "crisis";
  commandMessage: string;
  machineActions: string[];
};

export function buildAutoResponse(input: AutoResponseInput): AutoResponseResult {
  let responseTier: AutoResponseResult["responseTier"] = "local";
  let responseMode: AutoResponseResult["responseMode"] = "observe";

  if (input.threatScore >= 90 || input.escalationLevel === "global-command") {
    responseTier = "global";
    responseMode = "crisis";
  } else if (input.threatScore >= 75 || input.escalationLevel === "regional-command") {
    responseTier = "regional";
    responseMode = "dispatch";
  } else if (input.threatScore >= 55 || input.escalationLevel === "district") {
    responseTier = "district";
    responseMode = "prepare";
  }

  const machineActions: string[] = [];

  if (input.triggerModule === "energy") {
    machineActions.push("Prioritize critical loads");
    machineActions.push("Activate battery continuity mode");
  }

  if (input.triggerModule === "earthshield") {
    machineActions.push("Raise hazard monitoring cadence");
    machineActions.push("Lock affected geo-risk zones");
  }

  if (input.triggerModule === "lifemesh") {
    machineActions.push("Trigger protected-person status verification");
    machineActions.push("Escalate guardian and responder notifications");
  }

  if (input.atRiskPersonsCount > 0) {
    machineActions.push("Route medical and recovery coordination");
  }

  if (input.estimatedPopulationAtRisk >= 10000) {
    machineActions.push("Issue public advisory preparation signal");
  }

  const commandMessage =
    responseMode === "crisis"
      ? "Global crisis response authorized. Execute cross-module emergency actions immediately."
      : responseMode === "dispatch"
      ? "Regional response approved. Deploy field teams and machine safeguards now."
      : responseMode === "prepare"
      ? "District teams to standby. Pre-stage logistics and increase monitoring."
      : "Local observation only. Maintain readiness.";

  return {
    responseTier,
    responseMode,
    commandMessage,
    machineActions,
  };
}
