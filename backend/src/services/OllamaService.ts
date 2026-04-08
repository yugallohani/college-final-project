import { Ollama } from 'ollama';
import { ConversationContext } from '../types/index.js';

/**
 * Ollama Service - FREE alternative to OpenAI
 * Uses local LLMs like Llama 2, Mistral, etc.
 * No API costs!
 */
export class OllamaService {
  private ollama: Ollama;
  private model: string;

  constructor() {
    this.ollama = new Ollama({
      host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    });
    this.model = process.env.OLLAMA_MODEL || 'llama2';
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
      const response = await this.ollama.generate({
        model: this.model,
        prompt: prompts[language],
        stream: false
      });

      return response.response || "Hello! I'm here to help you with a mental health screening today. How are you feeling?";
    } catch (error) {
      console.error('Ollama greeting error:', error);
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

    const prompt = `${systemPrompt}\n\nConversation so far:\n${conversationHistory}\n\nGenerate your next empathetic response:`;

    try {
      const response = await this.ollama.generate({
        model: this.model,
        prompt,
        stream: false
      });

      return response.response || "I understand. Can you tell me more about how you've been feeling?";
    } catch (error) {
      console.error('Ollama response error:', error);
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

    const prompt = `You are a compassionate psychologist. ${topics[randomTopic]} Keep it brief and natural. Language: ${context.language}`;

    try {
      const response = await this.ollama.generate({
        model: this.model,
        prompt,
        stream: false
      });

      return response.response || "How have you been feeling lately?";
    } catch (error) {
      console.error('Ollama question error:', error);
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
   * Check if Ollama is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      await this.ollama.list();
      return true;
    } catch (error) {
      console.error('Ollama not available:', error);
      return false;
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const models = await this.ollama.list();
      return models.models.map(m => m.name);
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  }
}

export const ollamaService = new OllamaService();
