/**
 * ElevenLabs Text-to-Speech Service
 * Provides natural, human-like AI voice for the virtual psychologist
 */

export class ElevenLabsService {
  private apiKey: string;
  private voiceId: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || '';
    this.voiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Bella - soft, gentle female voice
    
    console.log('🔧 ElevenLabs Service initialized:');
    console.log('   API Key length:', this.apiKey.length);
    console.log('   API Key starts with:', this.apiKey.substring(0, 10) + '...');
    console.log('   Voice ID:', this.voiceId);
    
    if (!this.apiKey) {
      console.warn('⚠️ ELEVENLABS_API_KEY not set. TTS will fall back to browser Speech Synthesis.');
    }
  }

  /**
   * Check if ElevenLabs is available
   */
  isAvailable(): boolean {
    return !!this.apiKey && process.env.USE_ELEVENLABS === 'true';
  }

  /**
   * Convert text to speech using ElevenLabs
   * Returns audio buffer that can be sent to frontend
   */
  async textToSpeech(text: string): Promise<Buffer> {
    if (!this.isAvailable()) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      console.log('🎙️ Generating speech with ElevenLabs...');
      console.log('   Text length:', text.length);
      console.log('   Voice ID:', this.voiceId);

      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${this.voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_turbo_v2_5', // Updated to newer model available in free tier
            voice_settings: {
              stability: 0.71, // Increased for more consistent, less robotic delivery
              similarity_boost: 0.85, // Increased for more natural, human-like tone
              style: 0.15, // Added slight style for more expressive delivery
              use_speaker_boost: true
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ ElevenLabs API error:', response.status, errorText);
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      console.log('✅ Speech generated successfully');
      console.log('   Audio size:', audioBuffer.length, 'bytes');

      return audioBuffer;
    } catch (error: any) {
      console.error('❌ Error generating speech:', error.message);
      throw error;
    }
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<any[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error: any) {
      console.error('Error fetching voices:', error.message);
      return [];
    }
  }

  /**
   * Get usage information
   */
  async getUsage(): Promise<any> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch usage: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error fetching usage:', error.message);
      return null;
    }
  }
}

export const elevenLabsService = new ElevenLabsService();
