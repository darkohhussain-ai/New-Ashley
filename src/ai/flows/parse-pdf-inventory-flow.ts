
'use server';
/**
 * @fileOverview AI flow to extract structured inventory data from PDF text.
 * 
 * Extracts: Item name, Category, Model, Quantity, Change/Modification, and Location.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ExtractedItemSchema = z.object({
  name: z.string().describe('The name of the item.'),
  category: z.string().describe('The category of the item.'),
  model: z.string().describe('The model identifier or code.'),
  quantity: z.number().describe('The quantity/number of items.'),
  notes: z.string().describe('Any changes, modifications, or specific notes.'),
  location: z.string().describe('The physical warehouse location or position.'),
});

const ParsePdfInventoryInputSchema = z.object({
  text: z.string().describe('The raw text extracted from the PDF document.'),
});

const ParsePdfInventoryOutputSchema = z.object({
  items: z.array(ExtractedItemSchema).describe('The list of extracted items from the document.'),
});

export type ExtractedItem = z.infer<typeof ExtractedItemSchema>;

const parsePrompt = ai.definePrompt({
  name: 'parsePdfInventoryPrompt',
  input: { schema: ParsePdfInventoryInputSchema },
  output: { schema: ParsePdfInventoryOutputSchema },
  prompt: `
    You are an expert data extraction assistant for a warehouse management system.
    Your task is to analyze the raw text provided from a PDF document and extract inventory data into a clean, structured format.

    Extract the following fields for every item found:
    - Item Name: Descriptive name of the product.
    - Category: The grouping (e.g., Sofas, Bedroom, Tables).
    - Model: The specific model code or ID.
    - Number: The quantity of the item.
    - Change/Modification: Any notes, status updates, or modifications mentioned.
    - Location: The warehouse position or storage code.

    Raw Text:
    {{{text}}}

    If a field is missing for an item, provide an empty string or logical default. Ensure quantities are numeric.
  `,
});

const parsePdfInventoryFlow = ai.defineFlow(
  {
    name: 'parsePdfInventoryFlow',
    inputSchema: ParsePdfInventoryInputSchema,
    outputSchema: ParsePdfInventoryOutputSchema,
  },
  async (input) => {
    const { output } = await parsePrompt(input);
    return output!;
  }
);

export async function parsePdfInventory(input: { text: string }) {
  return parsePdfInventoryFlow(input);
}
