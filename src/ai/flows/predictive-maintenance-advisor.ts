'use server';

/**
 * @fileOverview An AI-powered predictive maintenance advisor for clinical and pharma lab instruments.
 *
 * - predictInstrumentFailure - Predicts potential instrument failures and recommends proactive maintenance.
 * - PredictiveMaintenanceInput - The input type for the predictInstrumentFailure function.
 * - PredictiveMaintenanceOutput - The return type for the predictInstrumentFailure function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictiveMaintenanceInputSchema = z.object({
  instrumentName: z.string().describe('The name of the instrument to analyze.'),
  maintenanceHistory: z.string().describe('A detailed history of maintenance activities performed on the instrument.'),
  usagePatterns: z.string().describe('Description of how the instrument is typically used, including frequency and intensity.'),
});
export type PredictiveMaintenanceInput = z.infer<typeof PredictiveMaintenanceInputSchema>;

const PredictiveMaintenanceOutputSchema = z.object({
  failureLikelihood: z.string().describe('An assessment of the likelihood of instrument failure (e.g., High, Medium, Low).'),
  recommendedActions: z.string().describe('Specific, actionable recommendations for proactive maintenance to prevent potential failures.'),
});
export type PredictiveMaintenanceOutput = z.infer<typeof PredictiveMaintenanceOutputSchema>;

export async function predictInstrumentFailure(input: PredictiveMaintenanceInput): Promise<PredictiveMaintenanceOutput> {
  return predictiveMaintenanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictiveMaintenancePrompt',
  input: {schema: PredictiveMaintenanceInputSchema},
  output: {schema: PredictiveMaintenanceOutputSchema},
  prompt: `You are an AI assistant that analyzes instrument maintenance history and usage patterns to predict potential failures and recommend proactive maintenance.

  Analyze the following information to determine the likelihood of failure and suggest proactive maintenance actions.

  Instrument Name: {{{instrumentName}}}
  Maintenance History: {{{maintenanceHistory}}}
  Usage Patterns: {{{usagePatterns}}}

  Respond with the likelihood of failure and recommended actions to prevent the failure.  Follow the schema to the letter.
  `,
});

const predictiveMaintenanceFlow = ai.defineFlow(
  {
    name: 'predictiveMaintenanceFlow',
    inputSchema: PredictiveMaintenanceInputSchema,
    outputSchema: PredictiveMaintenanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
