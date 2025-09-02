
'use server';

/**
 * @fileOverview A flow for answering HR-related questions using AI.
 *
 * - answerHrQuestion - A function that answers HR-related questions.
 * - AnswerHrQuestionInput - The input type for the answerHrQuestion function.
 * - AnswerHrQuestionOutput - The return type for the answerHrQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import fs from 'fs';
import path from 'path';

const AnswerHrQuestionInputSchema = z.object({
  question: z.string().describe('The HR-related question to answer.'),
  topic: z.string().nullable().describe('The specific topic context for the conversation.'),
});
export type AnswerHrQuestionInput = z.infer<typeof AnswerHrQuestionInputSchema>;

const AnswerHrQuestionOutputSchema = z.object({
  answer: z.string().describe('The AI-powered answer to the HR-related question.'),
});
export type AnswerHrQuestionOutput = z.infer<typeof AnswerHrQuestionOutputSchema>;

export async function answerHrQuestion(input: AnswerHrQuestionInput): Promise<AnswerHrQuestionOutput> {
  return answerHrQuestionFlow(input);
}

// Read prompt instructions from Markdown file
const promptInstructions = fs.readFileSync(path.join(process.cwd(), 'docs', 'answer-hr-questions-prompt.md'), 'utf-8');

const prompt = ai.definePrompt({
  name: 'answerHrQuestionPrompt',
  input: {schema: AnswerHrQuestionInputSchema},
  output: {schema: AnswerHrQuestionOutputSchema},
  prompt: promptInstructions,
});

const answerHrQuestionFlow = ai.defineFlow(
  {
    name: 'answerHrQuestionFlow',
    inputSchema: AnswerHrQuestionInputSchema,
    outputSchema: AnswerHrQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
