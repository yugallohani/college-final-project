import { HfInference } from '@huggingface/inference';
import { createReadStream } from 'fs';
import pool from '../database/db.js';

/**
 * Whisper Service for Speech-to-Text using HuggingFace (FREE!)
 * Alternative to OpenAI Whisper API
 */
export class WhisperService {
  private hf: HfInference;

  constructor() {
    this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
  }

  /**
   * Transcribe audio file to text
   */
  async transcribeAudio(audioPath: string): Promise<string> {
    try {
      // Use HuggingFace Whisper model
      const audioData = createReadStream(audioPath);
      
      const result = await this.hf.automaticSpeechRecognition({
        model: 'openai/whisper-base',
        data: audioData as any
      });

      return result.text || '';
    } catch (error) {
      console.error('Whisper transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * Transcribe audio buffer
   */
  async transcribeBuffer(buffer: Buffer): Promise<string> {
    try {
      const result = await this.hf.automaticSpeechRecognition({
        model: 'openai/whisper-base',
        data: buffer
      });

      return result.text || '';
    } catch (error) {
      console.error('Whisper buffer transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * Save audio upload record
   */
  async saveAudioUpload(
    sessionId: string,
    filePath: string,
    transcription: string,
    duration?: number
  ): Promise<string> {
    const result = await pool.query(
      `INSERT INTO audio_uploads (session_id, file_path, transcription, duration)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [sessionId, filePath, transcription, duration]
    );

    return result.rows[0].id;
  }

  /**
   * Get audio uploads for a session
   */
  async getAudioUploads(sessionId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT id, file_path, transcription, duration, created_at
       FROM audio_uploads
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [sessionId]
    );

    return result.rows;
  }

  /**
   * Detect language from audio (if supported)
   */
  async detectLanguage(audioPath: string): Promise<string> {
    // For now, return default language
    // Can be enhanced with language detection models
    return 'en';
  }

  /**
   * Get audio duration from file
   */
  async getAudioDuration(audioPath: string): Promise<number> {
    // Placeholder - would need audio processing library
    // For now, return 0
    return 0;
  }
}

export const whisperService = new WhisperService();
