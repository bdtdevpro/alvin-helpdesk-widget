
"use server";

import { answerHrQuestion } from "@/ai/flows/answer-hr-questions";
import { generateSampleQuestions } from "@/ai/flows/generate-sample-questions";
import { smartEscalation } from "@/ai/flows/smart-escalation";
import type { Message } from "@/lib/types";

export async function getAIResponse(question: string, topic: string | null) {
  try {
    const result = await answerHrQuestion({ question, topic });
    return result.answer;
  } catch (error) {
    console.error("Error getting AI response:", error);
    return "Sorry, I encountered an error. Please try again.";
  }
}

export async function escalateToDepartment(chatHistory: Message[]) {
  try {
    const conversationHistory = chatHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    // Use the whole conversation as the user query for better context
    const userQuery = conversationHistory;

    if (!userQuery) {
      return "Could not find a conversation to escalate.";
    }

    const result = await smartEscalation({
      userQuery: userQuery,
      conversationHistory,
    });

    return `Your request has been escalated to the @@${result.department}@@ department. Reason: ${result.reason}`;
  } catch (error) {
    console.error("Error escalating chat:", error);
    return "Sorry, I was unable to escalate your request. Please contact support directly.";
  }
}

export async function getTopicSuggestions(categoryName: string) {
  try {
    console.log('getTopicSuggestions called with categoryName:', categoryName);
    
    // Validate input
    if (!categoryName || typeof categoryName !== 'string' || categoryName.trim() === '') {
      console.error('Invalid categoryName:', categoryName);
      return [];
    }
    
    // Check environment variables
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment variables');
      return getFallbackSuggestions(categoryName);
    }
    
    // Add timeout for AI flow
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI flow timeout')), 25000); // 25 second timeout
    });
    
    // Pass the category name as the topic for generating sample questions
    const aiPromise = generateSampleQuestions({ topic: categoryName });
    
    const result = await Promise.race([aiPromise, timeoutPromise]) as any;
    console.log('generateSampleQuestions result:', result);
    
    // Validate result
    if (!result || !result.questions || !Array.isArray(result.questions)) {
      console.error('Invalid result from generateSampleQuestions:', result);
      return getFallbackSuggestions(categoryName);
    }
    
    return result.questions;
  } catch (error) {
    console.error("Error getting topic suggestions:", error);
    return getFallbackSuggestions(categoryName);
  }
}

function getFallbackSuggestions(categoryName: string): string[] {
  return [
    `What are the key points of ${categoryName}?`,
    `How does ${categoryName} apply to employees?`,
    `What are the requirements for ${categoryName}?`
  ];
}
