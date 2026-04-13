export type PilotReadinessStatus = "pass" | "warn" | "fail";

export function describePilotReadinessError() {
  return {
    title: "Migration update",
    description: "The pilot readiness board is being rebuilt for Supabase.",
    nextSteps: ["Reconnect reporting queries", "Restore audit checks", "Verify export views"],
  };
}

export const pilotService = {
  async getPilotReadiness() {
    return {
      summary: {
        overallStatus: "warn" as PilotReadinessStatus,
        passes: 0,
        warnings: 1,
        failures: 0,
      },
      manualQaTargets: [],
      environmentChecks: [],
      demoAccounts: [],
      dataIntegrityChecks: [],
    };
  },
};
