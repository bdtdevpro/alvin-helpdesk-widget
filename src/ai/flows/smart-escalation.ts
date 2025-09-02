'use server';

/**
 * @fileOverview AI-powered smart escalation flow to route complex inquiries to the appropriate department.
 *
 * - smartEscalation - A function that handles the escalation process.
 * - SmartEscalationInput - The input type for the smartEscalation function.
 * - SmartEscalationOutput - The return type for the smartEscalation function.
 */

import { Settings, LlamaCloudIndex, ContextChatEngine } from "llamaindex";
import { Gemini, GEMINI_MODEL } from "@llamaindex/google";
import { z } from "zod";

// Set up the LLM at module level
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("Missing Google API key.");
Settings.llm = new Gemini({
  apiKey,
  model: GEMINI_MODEL.GEMINI_2_5_FLASH_PREVIEW,
  temperature: 0.1,
});

const SmartEscalationInputSchema = z.object({
  userQuery: z.string().describe('The user query or issue description.'),
  conversationHistory: z
    .string()
    .optional()
    .describe('The history of the conversation, if available.'),
});
export type SmartEscalationInput = z.infer<typeof SmartEscalationInputSchema>;

const SmartEscalationOutputSchema = z.object({
  department: z
    .string()
    .describe(
      'The appropriate department to escalate the inquiry to (e.g., HR, IT, Benefits).'
    ),
  reason: z
    .string()
    .describe('The reason for escalating to the identified department.'),
});
export type SmartEscalationOutput = z.infer<typeof SmartEscalationOutputSchema>;

// Initialize LlamaIndex (do this once, outside the function if possible)
const index = new LlamaCloudIndex({
  name: "Alvin",
  projectName: "Default",
  organizationId: "f0ffa7f0-4c56-4818-88e6-65cd26049bae",
  apiKey: process.env.LLAMA_CLOUD_API_KEY,
});
const retriever = index.asRetriever({ similarityTopK: 5 });
const chatEngine = new ContextChatEngine({ retriever });

export async function smartEscalation(
  input: SmartEscalationInput
): Promise<SmartEscalationOutput> {
  // Compose the prompt as before
  const prompt = `You are an AI assistant designed to analyze user inquiries and conversation history to determine the most appropriate department for escalation.\n\nBased on the user's query and any available conversation history, identify the relevant department (e.g., HR, IT, Benefits, Payroll) to handle the issue. Provide a brief reason for your department selection.\n\nUser Query: ${input.userQuery}\nConversation History: ${input.conversationHistory || "(none)"}\n\nRespond with the department name and a brief explanation of why that department is most suitable for addressing the user's needs.`;

  const response = await chatEngine.chat({ message: prompt });

  // Try to extract department and reason from the response
  // (Assume response.response is the string answer)
  const text = typeof response === 'string' ? response : response.response;
  const match = text.match(/Department:\s*(.+)\nReason:\s*([\s\S]+)/i);
  if (match) {
    return {
      department: match[1].trim(),
      reason: match[2].trim(),
    };
  } else {
    // Fallback: return the whole response as reason, department unknown
    return {
      department: "Unknown",
      reason: text.trim(),
    };
  }
}
