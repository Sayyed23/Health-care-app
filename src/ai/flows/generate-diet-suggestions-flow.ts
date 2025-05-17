
'use server';
/**
 * @fileOverview Generates diet and lifestyle suggestions based on BMI, age, and user metrics.
 *
 * - generateDietSuggestions - A function that generates diet and lifestyle advice.
 * - GenerateDietSuggestionsInput - The input type for the generateDietSuggestions function.
 * - GenerateDietSuggestionsOutput - The return type for the generateDietSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDietSuggestionsInputSchema = z.object({
  bmi: z.number().describe('The calculated Body Mass Index of the user.'),
  bmiCategory: z.string().describe('The BMI category (e.g., "Underweight", "Normal weight", "Overweight", "Obesity Class I/II/III").'),
  currentWeightKg: z.number().describe('The current weight of the user in kilograms.'),
  heightCm: z.number().describe('The height of the user in centimeters.'),
  age: z.number().int().min(1, "Age must be a positive number.").max(120, "Age seems unrealistic.").describe('The age of the user in years.'),
});
export type GenerateDietSuggestionsInput = z.infer<typeof GenerateDietSuggestionsInputSchema>;

const GenerateDietSuggestionsOutputSchema = z.object({
  mainSuggestion: z.string().describe('A brief, encouraging summary statement or main piece of advice.'),
  dietTips: z.array(z.string()).describe('A list of general, actionable diet tips relevant to the user\'s BMI category, age, and goals (e.g., achieving a healthier weight).'),
  lifestyleRecommendations: z.array(z.string()).describe('A list of general lifestyle recommendations (e.g., exercise, sleep, stress management), considering age appropriateness.'),
});
export type GenerateDietSuggestionsOutput = z.infer<typeof GenerateDietSuggestionsOutputSchema>;

export async function generateDietSuggestions(input: GenerateDietSuggestionsInput): Promise<GenerateDietSuggestionsOutput> {
  return generateDietSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDietSuggestionsPrompt',
  input: {schema: GenerateDietSuggestionsInputSchema},
  output: {schema: GenerateDietSuggestionsOutputSchema},
  prompt: `You are a helpful AI assistant providing general health and wellness advice.
  A user has provided their BMI and related information, including their age. Your goal is to provide safe, general, and actionable diet and lifestyle suggestions to help them work towards or maintain a healthier weight.
  Do NOT provide specific medical advice or create detailed meal plans. Focus on general principles of healthy eating and living.
  Keep suggestions positive and encouraging.

  User Information:
  - BMI: {{bmi}}
  - BMI Category: "{{bmiCategory}}"
  - Current Weight: {{currentWeightKg}} kg
  - Height: {{heightCm}} cm
  - Age: {{age}} years

  Based on this information, please provide:
  1. A 'mainSuggestion': A brief, encouraging summary statement or main piece of advice.
  2. A list of 'dietTips': 3-5 general, actionable diet tips. Examples: "Focus on whole foods like fruits, vegetables, and lean proteins." or "Try to reduce intake of sugary drinks and processed snacks."
  3. A list of 'lifestyleRecommendations': 2-3 general lifestyle recommendations. Examples: "Aim for at least 30 minutes of moderate exercise most days of the week." or "Ensure you are getting 7-9 hours of quality sleep per night."

  Tailor the tone and focus of the suggestions appropriately for the user's BMI category AND AGE.
  For example:
  - If "Underweight", suggest healthy ways to gain weight, considering age-specific nutritional needs (e.g., higher protein for older adults if appropriate, or calorie-dense foods for younger active individuals).
  - If "Overweight" or "Obese", suggest healthy ways to lose or manage weight, factoring in age-appropriate activity levels and potential metabolic changes.
  - If "Normal weight", suggest ways to maintain a healthy lifestyle, adapting for different age groups (e.g., bone health for older adults, sustained energy for active adults, healthy growth for adolescents if applicable within a general context).
  - Consider common nutritional concerns or recommendations for different age brackets (e.g., calcium and vitamin D for older adults, iron for young women) if relevant to general wellness, but always keep it general.
  - Ensure exercise recommendations are suitable for the given age (e.g. low-impact for older adults if appropriate, varied activities for younger people).

  Output the response in the specified JSON format.
  `,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  }
});

const generateDietSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateDietSuggestionsFlow',
    inputSchema: GenerateDietSuggestionsInputSchema,
    outputSchema: GenerateDietSuggestionsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("AI failed to generate suggestions.");
    }
    return output;
  }
);
