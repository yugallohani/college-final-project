import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConversationContext } from '../types/index.js';

/**
 * Google Gemini Service - FREE and FAST!
 * 
 * Free Tier:
 * - 60 requests per minute
 * - 1,500 requests per day
 * - 1 million tokens per month
 * 
 * Much faster than Ollama and completely free!
 */
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    // Use Gemini 2.5 Flash (fast, capable, and available in free tier)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  /**
   * Generate a warm greeting for the user
   */
  async generateGreeting(language: 'en' | 'hi' = 'en'): Promise<string> {
    const prompts = {
      en: "You are a compassionate virtual clinical psychologist. Generate a brief, warm greeting (2-3 sentences) to welcome someone for a mental health screening. Be professional yet friendly.",
      hi: "आप एक दयालु वर्चुअल क्लिनिकल साइकोलॉजिस्ट हैं। मानसिक स्वास्थ्य स्क्रीनिंग के लिए किसी का स्वागत करने के लिए एक संक्षिप्त, गर्मजोशी भरा अभिवादन (2-3 वाक्य) उत्पन्न करें।"
    };

    try {
      const result = await this.model.generateContent(prompts[language]);
      const response = await result.response;
      const text = response.text();

      return text || (language === 'en' 
        ? "Hello! I'm here to help you with a mental health screening today. How are you feeling?"
        : "नमस्ते! मैं आज आपकी मानसिक स्वास्थ्य स्क्रीनिंग में मदद करने के लिए यहां हूं। आप कैसा महसूस कर रहे हैं?");
    } catch (error) {
      console.error('Gemini greeting error:', error);
      return language === 'en' 
        ? "Hello! I'm here to help you with a mental health screening today. How are you feeling?"
        : "नमस्ते! मैं आज आपकी मानसिक स्वास्थ्य स्क्रीनिंग में मदद करने के लिए यहां हूं। आप कैसा महसूस कर रहे हैं?";
    }
  }

  /**
   * Generate an empathetic response based on conversation context
   */
  async generateResponse(context: ConversationContext): Promise<string> {
    const systemPrompt = `You are a compassionate virtual clinical psychologist conducting a mental health screening.

Guidelines:
- Ask open-ended questions about mood, sleep, social life, and thoughts
- Be empathetic and supportive
- Keep responses brief (2-3 sentences)
- Avoid medical jargon
- Never be judgmental
- Guide conversation naturally

Language: ${context.language}
Phase: ${context.phase}
Recent emotions detected: ${context.detectedEmotions.join(', ') || 'none'}`;

    const conversationHistory = context.recentMessages
      .slice(-6)
      .map(msg => `${msg.role === 'user' ? 'User' : 'Psychologist'}: ${msg.content}`)
      .join('\n');

    const prompt = `${systemPrompt}\n\nConversation so far:\n${conversationHistory}\n\nGenerate your next empathetic response (2-3 sentences only):`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return text || "I understand. Can you tell me more about how you've been feeling?";
    } catch (error) {
      console.error('Gemini response error:', error);
      return "I understand. Can you tell me more about how you've been feeling?";
    }
  }

  /**
   * Generate a psychological question
   */
  async generateQuestion(phase: string, context: ConversationContext): Promise<string> {
    const topics = {
      mood: 'Generate a gentle question about their recent mood and emotional state.',
      sleep: 'Generate a caring question about their sleep patterns.',
      social: 'Generate an empathetic question about their social interactions.',
      cognitive: 'Generate a supportive question about their concentration or thoughts.'
    };

    const topicKeys = Object.keys(topics) as Array<keyof typeof topics>;
    const randomTopic = topicKeys[Math.floor(Math.random() * topicKeys.length)];

    const prompt = `You are a compassionate psychologist. ${topics[randomTopic]} Keep it brief and natural (one question only). Language: ${context.language}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return text || "How have you been feeling lately?";
    } catch (error) {
      console.error('Gemini question error:', error);
      return "How have you been feeling lately?";
    }
  }

  /**
   * Determine if it's time to transition to structured tests
   */
  shouldTransitionToTests(conversationTurns: number, context: ConversationContext): boolean {
    if (conversationTurns < 5) return false;
    if (conversationTurns >= 15) return true;

    const distressEmotions = ['sadness', 'fear', 'anger'];
    const hasDistress = context.detectedEmotions.some(e => distressEmotions.includes(e));
    
    return conversationTurns >= 8 && hasDistress;
  }

  /**
   * Check if Gemini is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const result = await this.model.generateContent('Hello');
      return true;
    } catch (error) {
      console.error('Gemini not available:', error);
      return false;
    }
  }

  /**
   * Get model info
   */
  getModelInfo(): { name: string; provider: string; cost: string } {
    return {
      name: 'Gemini 2.5 Flash',
      provider: 'Google',
      cost: 'FREE (1M tokens/month)'
    };
  }
}

export const geminiService = new GeminiService();
