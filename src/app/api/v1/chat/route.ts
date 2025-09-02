import { NextRequest, NextResponse } from 'next/server';
import { llamaChat } from '@/lib/llama-chat';

export async function POST(req: NextRequest) {
  try {
    const { message, topic, conversationHistory } = await req.json();
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    // Validate topic - ensure it's either a valid string or null/undefined
    const validatedTopic = topic && typeof topic === 'string' && topic.trim() !== '' ? topic.trim() : null;

    // Log the request for debugging (remove in production)
    console.log('Chat API Request:', {
      message: message.substring(0, 100) + '...',
      topic: validatedTopic || 'null',
      historyLength: conversationHistory?.length || 0
    });

    const text = await llamaChat(message, validatedTopic, conversationHistory);
    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
} 