import { HfInference } from '@huggingface/inference';
import { EmotionAnalysis } from '../types/index.js';
import pool from '../database/db.js';

/**
 * Emotion Detection Service using HuggingFace (FREE!)
 * Uses emotion classification models
 */
export class EmotionDetectionService {
  private hf: HfInference;

  constructor() {
    this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY, {
      baseUrl: 'https://router.huggingface.co'
    });
  }

  /**
   * Detect emotions in text using HuggingFace
   */
  async detectEmotions(text: string): Promise<EmotionAnalysis> {
    try {
      // Use emotion classification model
      const result = await this.hf.textClassification({
        model: 'j-hartmann/emotion-english-distilroberta-base',
        inputs: text
      });

      // Map HuggingFace emotions to our schema
      const emotionMap: Record<string, EmotionAnalysis['emotion']> = {
        'joy': 'joy',
        'sadness': 'sadness',
        'anger': 'anger',
        'fear': 'fear',
        'surprise': 'surprise',
        'neutral': 'neutral'
      };

      const topEmotion = result[0];
      const emotion = emotionMap[topEmotion.label.toLowerCase()] || 'neutral';
      const intensity = topEmotion.score * 100;

      // Determine valence
      let valence: EmotionAnalysis['valence'] = 'neutral';
      if (['joy', 'surprise'].includes(emotion)) {
        valence = 'positive';
      } else if (['sadness', 'fear', 'anger'].includes(emotion)) {
        valence = 'negative';
      }

      return {
        emotion,
        intensity,
        valence,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Emotion detection error:', error);
      // Fallback to basic sentiment
      return this.basicSentimentAnalysis(text);
    }
  }

  /**
   * Fallback basic sentiment analysis — expanded keyword set
   */
  private basicSentimentAnalysis(text: string): EmotionAnalysis {
    const t = text.toLowerCase();

    const sadWords = ['sad', 'depressed', 'down', 'hopeless', 'worthless', 'empty',
      'failure', 'useless', 'pathetic', 'broken', 'lost', 'alone', 'lonely',
      'miserable', 'hate myself', 'nothing', 'meaningless', 'pointless', 'numb'];
    const fearWords = ['anxious', 'worried', 'scared', 'afraid', 'nervous', 'panic',
      'terrified', 'dread', 'overwhelmed', 'stressed', 'pressure'];
    const angerWords = ['angry', 'frustrated', 'irritated', 'annoyed', 'mad',
      'furious', 'rage', 'hate', 'disgusting'];
    const joyWords = ['happy', 'good', 'great', 'wonderful', 'excited', 'pleased',
      'fantastic', 'love', 'enjoy', 'grateful', 'thankful', 'proud', 'confident',
      'motivated', 'peaceful', 'content', 'okay', 'fine', 'alright'];

    let emotion: EmotionAnalysis['emotion'] = 'neutral';
    let intensity = 30;

    if (sadWords.some(word => t.includes(word))) {
      emotion = 'sadness'; intensity = 65;
    } else if (fearWords.some(word => t.includes(word))) {
      emotion = 'fear'; intensity = 60;
    } else if (angerWords.some(word => t.includes(word))) {
      emotion = 'anger'; intensity = 55;
    } else if (joyWords.some(word => t.includes(word))) {
      emotion = 'joy'; intensity = 55;
    }

    const valence: EmotionAnalysis['valence'] =
      emotion === 'joy' ? 'positive' :
      ['sadness', 'fear', 'anger'].includes(emotion) ? 'negative' : 'neutral';

    console.log(`🧠 Backend emotion fallback: "${t.substring(0, 40)}" → ${emotion} (${valence})`);
    return { emotion, intensity, valence, timestamp: new Date() };
  }

  /**
   * Analyze sentiment using HuggingFace
   */
  async analyzeSentiment(text: string): Promise<{ label: string; score: number }> {
    try {
      const result = await this.hf.textClassification({
        model: 'distilbert-base-uncased-finetuned-sst-2-english',
        inputs: text
      });

      return {
        label: result[0].label,
        score: result[0].score
      };
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return { label: 'NEUTRAL', score: 0.5 };
    }
  }

  /**
   * Save emotion analysis to database
   */
  async saveEmotionAnalysis(sessionId: string, emotion: EmotionAnalysis): Promise<void> {
    await pool.query(
      `INSERT INTO emotion_analysis (session_id, emotion, intensity, valence)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, emotion.emotion, emotion.intensity, emotion.valence]
    );
  }

  /**
   * Get emotion history for a session
   */
  async getEmotionHistory(sessionId: string): Promise<EmotionAnalysis[]> {
    const result = await pool.query(
      `SELECT emotion, intensity, valence, created_at as timestamp
       FROM emotion_analysis
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [sessionId]
    );

    return result.rows.map(row => ({
      emotion: row.emotion,
      intensity: parseFloat(row.intensity),
      valence: row.valence,
      timestamp: row.timestamp
    }));
  }

  /**
   * Track emotional patterns across conversation
   */
  async trackEmotionalPattern(sessionId: string): Promise<{
    dominantEmotion: string;
    averageIntensity: number;
    emotionShifts: number;
  }> {
    const emotions = await this.getEmotionHistory(sessionId);
    
    if (emotions.length === 0) {
      return {
        dominantEmotion: 'neutral',
        averageIntensity: 0,
        emotionShifts: 0
      };
    }

    // Count emotion frequencies
    const emotionCounts: Record<string, number> = {};
    emotions.forEach(e => {
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
    });

    const dominantEmotion = Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)[0][0];

    const averageIntensity = emotions.reduce((sum, e) => sum + e.intensity, 0) / emotions.length;

    // Count emotion shifts
    let emotionShifts = 0;
    for (let i = 1; i < emotions.length; i++) {
      if (emotions[i].emotion !== emotions[i - 1].emotion) {
        emotionShifts++;
      }
    }

    return {
      dominantEmotion,
      averageIntensity,
      emotionShifts
    };
  }
}

export const emotionDetectionService = new EmotionDetectionService();
