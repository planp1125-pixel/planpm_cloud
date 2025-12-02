'use server';

import { predictInstrumentFailure as predictInstrumentFailureFlow } from "@/ai/flows/predictive-maintenance-advisor";
import type { PredictiveMaintenanceInput, PredictiveMaintenanceOutput } from "@/ai/flows/predictive-maintenance-advisor";

export async function predictInstrumentFailure(input: PredictiveMaintenanceInput): Promise<PredictiveMaintenanceOutput> {
  // Here you could add authentication, logging, or other server-side logic
  console.log("Calling predictive maintenance flow with input:", input.instrumentName);
  try {
    const result = await predictInstrumentFailureFlow(input);
    return result;
  } catch (error) {
    console.error("Error in predictive maintenance flow:", error);
    throw new Error("Failed to get prediction from AI.");
  }
}
