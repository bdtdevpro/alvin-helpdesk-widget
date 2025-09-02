
'use server';

/**
 * @fileOverview A flow for generating sample questions related to an HR topic.
 *
 * - generateSampleQuestions - A function that generates sample questions.
 * - GenerateSampleQuestionsInput - The input type for the generateSampleQuestions function.
 * - GenerateSampleQuestionsOutput - The return type for the generateSampleQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import fs from 'fs';
import path from 'path';

const GenerateSampleQuestionsInputSchema = z.object({
  topic: z.string().describe('The HR topic to generate sample questions for.'),
});
export type GenerateSampleQuestionsInput = z.infer<typeof GenerateSampleQuestionsInputSchema>;

const GenerateSampleQuestionsOutputSchema = z.object({
  questions: z
    .array(z.string().max(110, "Each question must not exceed 110 characters"))
    .length(3)
    .describe('An array of three sample questions related to the topic, each no more than 110 characters.'),
});
export type GenerateSampleQuestionsOutput = z.infer<typeof GenerateSampleQuestionsOutputSchema>;

export async function generateSampleQuestions(
  input: GenerateSampleQuestionsInput
): Promise<GenerateSampleQuestionsOutput> {
  return generateSampleQuestionsFlow(input);
}

// Read prompt instructions from Markdown file
let promptInstructions: string;
try {
  promptInstructions = fs.readFileSync(path.join(process.cwd(), 'docs', 'generate-sample-questions-prompt.md'), 'utf-8');
} catch (error) {
  console.error('Error reading prompt file:', error);
  // Fallback prompt if file reading fails
  promptInstructions = `You are an AI assistant specialized in HR policies and procedures. Given the topic {{"Hybrid Work Arrangement Policy, Amendment on No Mobile Phone & Shared Locker Policy, Amendment on Cleanliness and Upkeep, EDT Common Inquiry Questions, Proper Submission of Selfies",}} generate three distinct and relevant sample questions that a user might ask about it. Each question must be 110 characters or less.`;
}

const prompt = ai.definePrompt({
  name: 'generateSampleQuestionsPrompt',
  input: {schema: GenerateSampleQuestionsInputSchema},
  output: {schema: GenerateSampleQuestionsOutputSchema},
  prompt: promptInstructions,
});

const generateSampleQuestionsFlow = ai.defineFlow(
  {
    name: 'generateSampleQuestionsFlow',
    inputSchema: GenerateSampleQuestionsInputSchema,
    outputSchema: GenerateSampleQuestionsOutputSchema,
  },
  async input => {
    console.log('generateSampleQuestionsFlow input:', input);
    try {
      const {output} = await prompt(input);
      console.log('generateSampleQuestionsFlow output:', output);
      return output!;
    } catch (error) {
      console.error('Error in generateSampleQuestionsFlow:', error);
      throw error;
    }
  }
);
