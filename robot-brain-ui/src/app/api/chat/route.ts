import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ROBOT_PERSONALITIES } from '@/lib/robot-config';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// For now, we'll use in-memory session storage
// In production, this would use Neon PostgreSQL
const conversationHistory = new Map<string, Array<{role: string, content: string}>>();

export async function POST(request: NextRequest) {
  try {
    const { message, personality = 'robot-friend', sessionId = 'default' } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get robot configuration
    const robot = ROBOT_PERSONALITIES[personality as keyof typeof ROBOT_PERSONALITIES];
    if (!robot) {
      return NextResponse.json({ error: 'Invalid personality' }, { status: 400 });
    }

    // Get or create conversation history
    const history = conversationHistory.get(sessionId) || [];
    
    // Add user message to history
    history.push({ role: 'user', content: message });

    // Create the model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      systemInstruction: robot.systemPrompt
    });

    // Start a chat session with history
    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
    });

    // Send the message
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const responseText = response.text();

    // Add assistant response to history
    history.push({ role: 'assistant', content: responseText });
    
    // Store updated history
    conversationHistory.set(sessionId, history);

    // TODO: Store in Neon PostgreSQL using the backend API
    // For now, we'll use the FastAPI backend later

    return NextResponse.json({
      message: responseText,
      personality: personality,
      emoji: robot.emoji,
      name: robot.name,
      sessionId: sessionId
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}