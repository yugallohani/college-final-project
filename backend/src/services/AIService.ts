import { geminiService, GeminiService } from './GeminiService.js';
import { ollamaService, OllamaService } from './OllamaService.js';
import { ConversationContext } from '../types/index.js';

/**
 * Unified AI Service
 * Automatically switches between Gemini (recommended) and Ollama
 */
export class AIService {
  private provider: 'gemini' | 'ollama';
  private service: GeminiService | OllamaService;

  constructor() {
    // Default to Gemini if available, fallback to Ollama
    this.provider = (process.env.AI_PROVIDER as 'gemini' | 'ollama') || 'gemini';
    
    if (this.provider === 'gemini' && process.env.GOOGLE_GEMINI_API_KEY) {
      this.service = geminiService;
      console.log('🤖 Using Google Gemini (FREE, Fast)');
    } else {
      this.service = ollamaService;
      this.provider = 'ollama';
      console.log('🤖 Using Ollama (Local, Private)');
    }
  }

  /**
   * Generate greeting
   */
  async generateGreeting(language: 'en' | 'hi' = 'en'): Promise<string> {
    try {
      return await this.service.generateGreeting(language);
    } catch (error) {
      console.error(`${this.provider} greeting error:`, error);
      // Fallback to other provider
      return this.fallbackGreeting(language);
    }
  }

  /**
   * Generate response
   */
  async generateResponse(context: ConversationContext): Promise<string> {
    try {
      return await this.service.generateResponse(context);
    } catch (error) {
      console.error(`${this.provider} response error:`, error);
      return "I understand. Can you tell me more about how you've been feeling?";
    }
  }

  /**
   * Generate question
   */
  async generateQuestion(phase: string, context: ConversationContext): Promise<string> {
    try {
      return await this.service.generateQuestion(phase, context);
    } catch (error) {
      console.error(`${this.provider} question error:`, error);
      return "How have you been feeling lately?";
    }
  }

  /**
   * Should transition to tests
   */
  shouldTransitionToTests(conversationTurns: number, context: ConversationContext): boolean {
    return this.service.shouldTransitionToTests(conversationTurns, context);
  }

  /**
   * Check availability
   */
  async checkAvailability(): Promise<boolean> {
    return await this.service.checkAvailability();
  }

  /**
   * Get current provider
   */
  getProvider(): string {
    return this.provider;
  }

  /**
   * Switch provider
   */
  async switchProvider(provider: 'gemini' | 'ollama'): Promise<boolean> {
    try {
      if (provider === 'gemini') {
        if (!process.env.GOOGLE_GEMINI_API_KEY) {
          throw new Error('Gemini API key not configured');
        }
        this.service = geminiService;
        this.provider = 'gemini';
        console.log('✅ Switched to Gemini');
      } else {
        this.service = ollamaService;
        this.provider = 'ollama';
        console.log('✅ Switched to Ollama');
      }
      
      return await this.checkAvailability();
    } catch (error) {
      console.error('Failed to switch provider:', error);
      return false;
    }
  }

  /**
   * Fallback greeting
   */
  private fallbackGreeting(language: 'en' | 'hi'): string {
    return language === 'en'
      ? "Hello! I'm here to help you with a mental health screening today. How are you feeling?"
      : "नमस्ते! मैं आज आपकी मानसिक स्वास्थ्य स्क्रीनिंग में मदद करने के लिए यहां हूं। आप कैसा महसूस कर रहे हैं?";
  }

  /**
   * Get provider info
   */
  getProviderInfo(): { provider: string; model: string; status: string } {
    if (this.provider === 'gemini') {
      return {
        provider: 'Google Gemini',
        model: 'gemini-2.5-flash',
        status: 'FREE (1M tokens/month)'
      };
    } else {
      return {
        provider: 'Ollama',
        model: process.env.OLLAMA_MODEL || 'llama2',
        status: 'Local (Unlimited)'
      };
    }
  }
}

export const aiService = new AIService();
