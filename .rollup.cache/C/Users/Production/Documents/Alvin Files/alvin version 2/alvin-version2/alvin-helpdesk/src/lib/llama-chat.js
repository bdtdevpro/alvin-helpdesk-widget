import { Settings, LlamaCloudIndex, ContextChatEngine } from "llamaindex";
import { Gemini, GEMINI_MODEL } from "@llamaindex/google";
import { readFileSync } from "fs";
import { join } from "path";
import { config } from 'dotenv';
config();
export async function llamaChat(message, topic, conversationHistory) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey)
            throw new Error("Missing Google API key.");
        // Read the system prompt from instruction.md
        const systemPrompt = readFileSync(join(process.cwd(), "docs", "instruction.md"), "utf-8");
        // ✅ Set up the Gemini model 
        Settings.llm = new Gemini({
            apiKey,
            model: GEMINI_MODEL.GEMINI_2_5_FLASH_PREVIEW,
            temperature: 0.5,
        });
        // ✅ Create index and retriever
        const index = new LlamaCloudIndex({
            name: "Alvin",
            projectName: "Default",
            organizationId: "3d06cd16-3374-4c22-b277-a87fb8e6bc14",
            apiKey: process.env.LLAMA_CLOUD_API_KEY,
        });
        const retriever = index.asRetriever({ similarityTopK: 5 });
        // ✅ Initialize the chat engine with system prompt
        const chatEngine = new ContextChatEngine({
            retriever,
            systemPrompt: systemPrompt
        });
        // ✅ Build the user message with context
        let userMessage = message;
        // Add conversation history context if provided (very conservative)
        if (conversationHistory && conversationHistory.length > 0) {
            console.log(`📝 Processing conversation history with ${conversationHistory.length} messages`);
            // Very conservative limits to prevent API crashes
            const MAX_MESSAGES = 6; // Increased to 6 messages to better capture context
            const MAX_CHARS_PER_MESSAGE = 400; // Increased to 400 chars per message
            // Take only the most recent messages
            const recentMessages = conversationHistory.slice(-MAX_MESSAGES);
            const processedMessages = recentMessages
                .filter(msg => msg && typeof msg.role === 'string' && typeof msg.content === 'string')
                .map((msg, index) => {
                const sanitizedContent = msg.content.length > MAX_CHARS_PER_MESSAGE
                    ? msg.content.substring(0, MAX_CHARS_PER_MESSAGE) + '...' : msg.content;
                return `${msg.role}: ${sanitizedContent}`;
            });
            const historyContext = processedMessages.join('\n');
            console.log(`📊 Context summary: ${processedMessages.length} messages`);
            // Enhanced context formatting for better follow-up question handling
            const isFollowUpQuestion = message.toLowerCase().includes('yes') ||
                message.toLowerCase().includes('explain') ||
                message.toLowerCase().includes('more') ||
                message.toLowerCase().includes('detail');
            if (isFollowUpQuestion) {
                userMessage = `IMPORTANT: This appears to be a follow-up question. The user is asking for more details or clarification about the previous conversation. Please refer back to the specific topic or question from the conversation history and provide comprehensive, detailed information about it.\n\nRecent conversation:\n${historyContext}\n\nCurrent follow-up question: ${message}`;
            }
            else {
                userMessage = `Recent conversation:\n${historyContext}\n\nCurrent question: ${message}`;
            }
        }
        // Add topic constraint if specified
        if (topic && topic !== null && topic !== undefined && topic.trim() !== '') {
            userMessage = `IMPORTANT: The user has selected "${topic}" as the current topic. You must ONLY answer questions about this topic. If the user asks about a different topic, politely remind them that the current chat is focused on "${topic}" and suggest they clear their selection to ask about something else. Use the exact response format from the system prompt for topic redirection.\n\n${userMessage}`;
        }
        console.log(`🤖 Sending message to AI with ${conversationHistory ? conversationHistory.length : 0} previous messages`);
        const response = await chatEngine.chat({ message: userMessage });
        return (response === null || response === void 0 ? void 0 : response.response) || "No response from Gemini.";
    }
    catch (error) {
        console.error("❌ LlamaCloud API Error:", error);
        // Simple fallback response
        return "I'm experiencing technical difficulties. Please try asking your question again, or contact HR directly for immediate assistance. You can also visit our HR System documents at https://office.Proweaver.tools/hrsystem/memo for additional information.";
    }
}
//# sourceMappingURL=llama-chat.js.map