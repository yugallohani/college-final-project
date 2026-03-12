import OpenAI from 'openai';
import { ConversationContext, Message } from '../types/index.js';
import { SessionModel } from '../models/Session.js';

export class VirtualPsychologistService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Generate a warm greeting for the user
   */
  async generateGreeting(language: 'en' | 'hi' = 'en'): Promise<string> {
    const prompts = {
      en: "Generate a warm, professional greeting for a virtual clinical psychologist starting a mental health screening conversation. Keep it brief, empathetic, and welcoming. Introduce yourself as an AI assistant designed to help with mental health screening.",
      hi: "एक वर्चुअल क्लिनिकल साइकोलॉजिस्ट के रूप में मानसिक स्वास्थ्य स्क्रीनिंग वार्तालाप शुरू करने के लिए एक गर्मजोशी भरा, पेशेवर अभिवादन उत्पन्न करें।"
    };

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a compassionate virtual clinical psychologist conducting mental health screenings.'
        },
        {
          role: 'user',
          content: prompts[language]
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    });

    return response.choices[0]?.message?.content || 'Hello, I\'m here to help you with a mental health screening today.';
  }

  /**
   * Generate an empathetic response based on conversation context
   */
  async generateResponse(context: ConversationContext): Promise<string> {
    const systemPrompt = `You are a compassionate virtual clinical psychologist conducting an initial mental health screening.

Your role is to:
- Ask open-ended questions about mood, sleep, social engagement, and cognitive patterns
- Respond empathetically to user input
- Avoid clinical jargon
- Never trigger severe emotional distress
- Maintain a warm, supportive tone
- Keep responses concise (2-3 sentences)
- Guide the conversation naturally toward understanding their mental state

Current phase: ${context.phase}
Language: ${context.language}
Detected emotions: ${context.detectedEmotions.join(', ') || 'none yet'}`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...context.recentMessages.slice(-10).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      max_tokens: 200,
      temperature: 0.8
    });

    return response.choices[0]?.message?.content || 'I understand. Can you tell me more about how you\'ve been feeling?';
  }

  /**
   * Generate a psychological question
   */
  async generateQuestion(phase: string, context: ConversationContext): Promise<string> {
    const questionPrompts = {
      mood: 'Generate a gentle question about the person\'s recent mood and emotional state.',
      sleep: 'Generate a caring question about their sleep patterns and quality.',
      social: 'Generate an empathetic question about their social interactions and relationships.',
      cognitive: 'Generate a supportive question about their concentration, decision-making, or thought patterns.'
    };

    const topics = ['mood', 'sleep', 'social', 'cognitive'];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)] as keyof typeof questionPrompts;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a compassionate psychologist. Generate one brief, open-ended question.'
        },
        {
          role: 'user',
          content: questionPrompts[randomTopic]
        }
      ],
      max_tokens: 100,
      temperature: 0.9
    });

    return response.choices[0]?.message?.content || 'How have you been feeling lately?';
  }

  /**
   * Determine if it's time to transition to structured tests
   */
  shouldTransitionToTests(conversationTurns: number, context: ConversationContext): boolean {
    // Transition after 5-15 conversation turns
    if (conversationTurns < 5) return false;
    if (conversationTurns >= 15) return true;

    // Early transition if strong distress signals detected
    const distressEmotions = ['sadness', 'fear', 'anger'];
    const hasDistress = context.detectedEmotions.some(e => distressEmotions.includes(e));
    
    return conversationTurns >= 8 && hasDistress;
  }

  /**
   * Get conversation context from session
   */
  async getConversationContext(sessionId: string): Promise<ConversationContext> {
    const session = await SessionModel.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const recentEmotions = session.emotionAnalysis?.slice(-5).map(e => e.emotion) || [];

    return {
      recentMessages: session.messages.slice(-10),
      detectedEmotions: recentEmotions,
      phase: session.currentPhase,
      language: 'en' // TODO: Implement language detection
    };
  }
}

export const virtualPsychologistService = new VirtualPsychologistService();
