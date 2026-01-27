
'use server';
/**
 * @fileOverview An AI flow to translate a Kurdish name to English.
 * 
 * This file defines the `translateKurdishToEnglish` function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TranslateKurdishInputSchema = z.object({
  kurdishName: z.string().describe('The Kurdish name to be translated.'),
});
type TranslateKurdishInput = z.infer<typeof TranslateKurdishInputSchema>;

const TranslateEnglishOutputSchema = z.object({
  englishName: z.string().describe('The suggested English translation of the name.'),
});
type TranslateEnglishOutput = z.infer<typeof TranslateEnglishOutputSchema>;

const translateKurdishPrompt = ai.definePrompt({
  name: 'translateKurdishPrompt',
  input: { schema: TranslateKurdishInputSchema },
  output: { schema: TranslateEnglishOutputSchema },
  prompt: `
    Translate the following Kurdish name to its most common English equivalent.
    Provide only the English name as the translation.

    Kurdish Name: {{{kurdishName}}}
  `,
});

const translateKurdishToEnglishFlow = ai.defineFlow(
  {
    name: 'translateKurdishToEnglishFlow',
    inputSchema: TranslateKurdishInputSchema,
    outputSchema: TranslateEnglishOutputSchema,
  },
  async (input) => {
    const { output } = await translateKurdishPrompt(input);
    return output!;
  }
);

export async function translateKurdishToEnglish(input: TranslateKurdishInput): Promise<TranslateEnglishOutput> {
  return translateKurdishToEnglishFlow(input);
}
