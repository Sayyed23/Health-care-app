'use server';
/**
 * @fileOverview Generates a mood chart based on journal entries and their tags.
 *
 * - generateMoodChart - A function that generates a mood chart based on journal entries and tags.
 * - GenerateMoodChartInput - The input type for the generateMoodChart function.
 * - GenerateMoodChartOutput - The return type for the generateMoodChart function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMoodChartInputSchema = z.object({
  journalEntries: z.array(
    z.object({
      date: z.string().describe('The date of the journal entry.'),
      text: z.string().describe('The content of the journal entry.'),
      tags: z.array(z.string()).describe('Tags associated with the journal entry.'),
    })
  ).describe('An array of journal entries, each with a date, text, and tags.'),
});

export type GenerateMoodChartInput = z.infer<typeof GenerateMoodChartInputSchema>;

const GenerateMoodChartOutputSchema = z.object({
  chartData: z.string().describe('A JSON string representing the mood chart data, with dates on the x-axis and mood scores on the y-axis.'),
  summary: z.string().describe('A summary of the mood trends observed in the journal entries.'),
});

export type GenerateMoodChartOutput = z.infer<typeof GenerateMoodChartOutputSchema>;

export async function generateMoodChart(input: GenerateMoodChartInput): Promise<GenerateMoodChartOutput> {
  return generateMoodChartFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMoodChartPrompt',
  input: {schema: GenerateMoodChartInputSchema},
  output: {schema: GenerateMoodChartOutputSchema},
  prompt: `You are an AI assistant specializing in analyzing mood trends from journal entries.

  Given the following journal entries, analyze the overall mood trends based on the tags used in each entry. Generate a mood chart data in JSON format, where the x-axis is the date and the y-axis represents the mood score. The mood score should be a numerical value between -1 (very negative) and 1 (very positive), based on the sentiment associated with the tags. Also, generate a summary of the mood trends observed in the journal entries.

  Journal Entries:
  {{#each journalEntries}}
  Date: {{date}}
  Text: {{text}}
  Tags: {{tags}}
  {{/each}}

  Output the chart data as a JSON string and provide a concise summary of the mood trends.
  JSON Chart Data: 
  Summary: `,
});

const generateMoodChartFlow = ai.defineFlow(
  {
    name: 'generateMoodChartFlow',
    inputSchema: GenerateMoodChartInputSchema,
    outputSchema: GenerateMoodChartOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
