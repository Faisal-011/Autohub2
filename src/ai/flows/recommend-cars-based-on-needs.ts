'use server';
/**
 * @fileOverview Recommends cars based on user-provided needs and preferences.
 *
 * - recommendCarsBasedOnNeeds - A function that takes user preferences as input and returns car recommendations.
 * - RecommendCarsBasedOnNeedsInput - The input type for the recommendCarsBasedOnNeeds function.
 * - RecommendCarsBasedOnNeedsOutput - The return type for the recommendCarsBasedOnNeeds function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendCarsBasedOnNeedsInputSchema = z.object({
  budget: z.number().describe('The user\u2019s budget for the car.'),
  seatingCapacity: z
    .number()
    .describe('The desired seating capacity of the car.'),
  fuelEfficiency: z
    .string()
    .describe(
      'The desired fuel efficiency of the car (e.g., Excellent, Good, Average).'
    ),
  desiredFeatures: z
    .string()
    .describe('A description of the car the user desires.'),
});
export type RecommendCarsBasedOnNeedsInput = z.infer<
  typeof RecommendCarsBasedOnNeedsInputSchema
>;

const RecommendCarsBasedOnNeedsOutputSchema = z.object({
  recommendations: z
    .string()
    .describe('A list of recommended cars based on the user input.'),
});

export type RecommendCarsBasedOnNeedsOutput = z.infer<
  typeof RecommendCarsBasedOnNeedsOutputSchema
>;

export async function recommendCarsBasedOnNeeds(
  input: RecommendCarsBasedOnNeedsInput
): Promise<RecommendCarsBasedOnNeedsOutput> {
  return recommendCarsBasedOnNeedsFlow(input);
}

const recommendCarsBasedOnNeedsPrompt = ai.definePrompt({
  name: 'recommendCarsBasedOnNeedsPrompt',
  input: {schema: RecommendCarsBasedOnNeedsInputSchema},
  output: {schema: RecommendCarsBasedOnNeedsOutputSchema},
  prompt: `You are an expert car recommendation AI. A user will provide their car preferences including budget, seating capacity, fuel efficiency, and desired features.

  Based on these preferences, recommend a list of cars that would be suitable for the user.

  Budget: {{budget}}
  Seating Capacity: {{seatingCapacity}}
  Fuel Efficiency: {{fuelEfficiency}}
  Desired Features: {{desiredFeatures}}`,
});

const recommendCarsBasedOnNeedsFlow = ai.defineFlow(
  {
    name: 'recommendCarsBasedOnNeedsFlow',
    inputSchema: RecommendCarsBasedOnNeedsInputSchema,
    outputSchema: RecommendCarsBasedOnNeedsOutputSchema,
  },
  async input => {
    const {output} = await recommendCarsBasedOnNeedsPrompt(input);
    return output!;
  }
);
