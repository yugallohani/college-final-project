import { SessionModel } from '../models/Session.js';
import { aiService } from './AIService.js';
import { emotionDetectionService } from './EmotionDetectionService.js';
import { testAdministratorService } from './TestAdministratorService.js';
import { crisisDetectionService } from './CrisisDetectionService.js';

export interface VoiceAssessmentState {
  sessionId: string;
  assessmentType: 'phq9' | 'gad7' | 'general';
  currentQuestion: number;
  totalQuestions: number;
  phase: 'intro' | 'questioning' | 'analysis' | 'complete';
  transcript: Array<{
    speaker: 'ai' | 'user';
    text: string;
    timestamp: Date;
    emotion?: string;
    sentiment?: number;
  }>;
  realTimeAnalysis: {
    sentimentScore: number; // -1 to 1
    emotionalTone: string;
    responseConfidence: number; // 0 to 1
    keyIndicators: string[];
  };
}

export class VoiceAssessmentService {
  /**
   * Initialize a new voice assessment session
   */
  async initializeAssessment(
    sessionId: string,
    assessmentType: 'phq9' | 'gad7' | 'general'
  ): Promise<VoiceAssessmentState> {
    const session = await SessionModel.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Set the appropriate phase
    if (assessmentType === 'phq9') {
      await testAdministratorService.initiatePHQ9(sessionId);
    } else if (assessmentType === 'gad7') {
      await testAdministratorService.initiateGAD7(sessionId);
    } else {
      await SessionModel.findByIdAndUpdate(sessionId, {
        currentPhase: 'conversation',
        updatedAt: new Date()
      });
    }

    const totalQuestions = assessmentType === 'phq9' ? 9 : assessmentType === 'gad7' ? 7 : 10;

    return {
      sessionId,
      assessmentType,
      currentQuestion: 0,
      totalQuestions,
      phase: 'intro',
      transcript: [],
      realTimeAnalysis: {
        sentimentScore: 0,
        emotionalTone: 'neutral',
        responseConfidence: 0,
        keyIndicators: []
      }
    };
  }

  /**
   * Generate the introduction message for the assessment
   */
  async generateIntroduction(assessmentType: 'phq9' | 'gad7' | 'general'): Promise<string> {
    const intros = {
      phq9: "Hello, I'm your AI clinical psychologist. Today, I'll be conducting a depression screening assessment with you. This will take about 5-10 minutes. I'll ask you a series of questions about how you've been feeling over the past two weeks. Please answer honestly and naturally. Are you ready to begin?",
      gad7: "Hello, I'm your AI clinical psychologist. Today, I'll be conducting an anxiety screening assessment with you. This will take about 5-10 minutes. I'll ask you questions about worry and anxiety you may have experienced recently. Please answer honestly and naturally. Are you ready to begin?",
      general: "Hello, I'm your AI clinical psychologist. Today, I'll be conducting a general wellness check with you. This will take about 10-15 minutes. I'll ask you questions about your mood, sleep, stress levels, and overall well-being. Please answer honestly and naturally. Are you ready to begin?"
    };

    return intros[assessmentType];
  }

  /**
   * Generate the next question based on assessment type and progress
   */
  async generateNextQuestion(
    sessionId: string,
    assessmentType: 'phq9' | 'gad7' | 'general',
    questionNumber: number
  ): Promise<string> {
    if (assessmentType === 'phq9' || assessmentType === 'gad7') {
      return testAdministratorService.presentQuestion(assessmentType, questionNumber);
    } else {
      // General wellness questions
      const generalQuestions = [
        "How would you describe your overall mood over the past week?",
        "How has your sleep been lately? Are you getting enough rest?",
        "Have you been experiencing any significant stress or pressure recently?",
        "How are your energy levels throughout the day?",
        "Are you finding enjoyment in activities you usually like?",
        "How would you describe your relationships with family and friends?",
        "Have you noticed any changes in your appetite or eating habits?",
        "How well are you able to concentrate on tasks?",
        "Do you feel hopeful about the future?",
        "Is there anything specific that's been bothering you lately?"
      ];

      return generalQuestions[questionNumber - 1] || "Thank you for sharing. Is there anything else you'd like to tell me?";
    }
  }

  /**
   * Process user's voice response and analyze it
   */
  async processVoiceResponse(
    sessionId: string,
    transcribedText: string,
    assessmentType: 'phq9' | 'gad7' | 'general',
    questionNumber: number
  ): Promise<{
    analysis: VoiceAssessmentState['realTimeAnalysis'];
    extractedScore?: number;
    crisisDetected: boolean;
    crisisResponse?: any;
  }> {
    const session = await SessionModel.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Check for crisis indicators
    const crisisResponse = await crisisDetectionService.generateCrisisResponse(
      sessionId,
      transcribedText
    );

    if (crisisResponse.detected) {
      await crisisDetectionService.logCrisisDetection(sessionId, crisisResponse.severity);
      return {
        analysis: {
          sentimentScore: -0.9,
          emotionalTone: 'distressed',
          responseConfidence: 1.0,
          keyIndicators: ['crisis_detected', 'immediate_support_needed']
        },
        crisisDetected: true,
        crisisResponse
      };
    }

    // Detect emotions
    let emotionalTone = 'neutral';
    let sentimentScore = 0;

    if (process.env.HUGGINGFACE_API_KEY) {
      try {
        const emotionResult = await emotionDetectionService.detectEmotions(transcribedText);
        if (emotionResult) {
          emotionalTone = emotionResult.emotion;
          
          // Convert emotion to sentiment score
          const emotionToSentiment: Record<string, number> = {
            'joy': 0.8,
            'surprise': 0.3,
            'neutral': 0,
            'fear': -0.6,
            'sadness': -0.7,
            'anger': -0.8
          };
          sentimentScore = emotionToSentiment[emotionalTone] || 0;

          // Store emotion analysis
          if (!session.emotionAnalysis) {
            session.emotionAnalysis = [];
          }
          session.emotionAnalysis.push({
            ...emotionResult,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.warn('Emotion detection failed:', error);
      }
    }

    // Extract score from response for PHQ-9/GAD-7
    let extractedScore: number | undefined;
    if (assessmentType === 'phq9' || assessmentType === 'gad7') {
      extractedScore = this.extractScoreFromText(transcribedText);
    }

    // Analyze key indicators
    const keyIndicators = this.analyzeKeyIndicators(transcribedText, emotionalTone);

    // Calculate response confidence based on text length and clarity
    const responseConfidence = this.calculateResponseConfidence(transcribedText);

    await SessionModel.save(session);

    return {
      analysis: {
        sentimentScore,
        emotionalTone,
        responseConfidence,
        keyIndicators
      },
      extractedScore,
      crisisDetected: false
    };
  }

  /**
   * Extract numerical score from user's text response
   */
  private extractScoreFromText(text: string): number | undefined {
    const lowerText = text.toLowerCase();

    // Check for explicit numbers
    const numberMatch = text.match(/\b([0-3])\b/);
    if (numberMatch) {
      return parseInt(numberMatch[1]);
    }

    // Check for verbal responses
    if (lowerText.includes('not at all') || lowerText.includes('never') || lowerText.includes('zero')) {
      return 0;
    }
    if (lowerText.includes('several days') || lowerText.includes('sometimes') || lowerText.includes('occasionally')) {
      return 1;
    }
    if (lowerText.includes('more than half') || lowerText.includes('often') || lowerText.includes('frequently')) {
      return 2;
    }
    if (lowerText.includes('nearly every day') || lowerText.includes('always') || lowerText.includes('constantly')) {
      return 3;
    }

    return undefined;
  }

  /**
   * Analyze key psychological indicators from text
   */
  private analyzeKeyIndicators(text: string, emotion: string): string[] {
    const indicators: string[] = [];
    const lowerText = text.toLowerCase();

    // Negative indicators
    if (lowerText.match(/\b(hopeless|worthless|helpless|useless)\b/)) {
      indicators.push('negative_self_perception');
    }
    if (lowerText.match(/\b(can't|cannot|unable|impossible)\b/)) {
      indicators.push('perceived_inability');
    }
    if (lowerText.match(/\b(tired|exhausted|drained|fatigued)\b/)) {
      indicators.push('low_energy');
    }
    if (lowerText.match(/\b(worry|worried|anxious|nervous|scared)\b/)) {
      indicators.push('anxiety_symptoms');
    }
    if (lowerText.match(/\b(sleep|insomnia|awake|restless)\b/)) {
      indicators.push('sleep_disturbance');
    }

    // Positive indicators
    if (lowerText.match(/\b(good|great|fine|okay|well|better)\b/)) {
      indicators.push('positive_response');
    }
    if (lowerText.match(/\b(enjoy|happy|pleased|satisfied)\b/)) {
      indicators.push('positive_affect');
    }

    // Emotion-based indicators
    if (emotion === 'sadness') {
      indicators.push('depressive_affect');
    } else if (emotion === 'fear') {
      indicators.push('anxious_affect');
    } else if (emotion === 'anger') {
      indicators.push('irritable_affect');
    }

    return indicators;
  }

  /**
   * Calculate confidence in user's response
   */
  private calculateResponseConfidence(text: string): number {
    const wordCount = text.trim().split(/\s+/).length;
    
    // Very short responses have lower confidence
    if (wordCount < 3) return 0.3;
    if (wordCount < 5) return 0.5;
    if (wordCount < 10) return 0.7;
    if (wordCount < 20) return 0.9;
    
    return 1.0;
  }

  /**
   * Generate AI's verbal response to user's answer
   */
  async generateVerbalResponse(
    sessionId: string,
    userResponse: string,
    questionNumber: number,
    totalQuestions: number
  ): Promise<string> {
    const acknowledgments = [
      "I understand. Thank you for sharing that with me.",
      "Thank you for being open about that.",
      "I appreciate you telling me about this.",
      "That's helpful to know. Thank you.",
      "I hear you. Thank you for sharing."
    ];

    const transitions = [
      "Let's move on to the next question.",
      "Now, I'd like to ask you about something else.",
      "Here's my next question for you.",
      "Let me ask you about another aspect.",
      "Moving forward, I'd like to know..."
    ];

    const acknowledgment = acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
    
    if (questionNumber < totalQuestions) {
      const transition = transitions[Math.floor(Math.random() * transitions.length)];
      return `${acknowledgment} ${transition}`;
    } else {
      return `${acknowledgment} We've completed all the questions. I'm now analyzing your responses to generate your comprehensive mental health screening report. This will take just a moment.`;
    }
  }

  /**
   * Complete the assessment and prepare for report generation
   */
  async completeAssessment(sessionId: string): Promise<{
    phq9Score?: number;
    gad7Score?: number;
    phq9Classification?: string;
    gad7Classification?: string;
    emotionalSummary: {
      dominantEmotions: string[];
      averageSentiment: number;
      keyFindings: string[];
    };
  }> {
    const session = await SessionModel.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Calculate scores
    const phq9Score = session.phq9Responses.length > 0 
      ? await testAdministratorService.calculateScore(sessionId, 'phq9')
      : undefined;
    
    const gad7Score = session.gad7Responses.length > 0
      ? await testAdministratorService.calculateScore(sessionId, 'gad7')
      : undefined;

    const phq9Classification = phq9Score !== undefined
      ? testAdministratorService.classifyPHQ9Risk(phq9Score)
      : undefined;

    const gad7Classification = gad7Score !== undefined
      ? testAdministratorService.classifyGAD7Risk(gad7Score)
      : undefined;

    // Analyze emotional patterns
    const emotions = (session.emotionAnalysis || []).map((e: any) => e.emotion);
    const emotionCounts: Record<string, number> = {};
    emotions.forEach(emotion => {
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });

    const dominantEmotions = Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([emotion]) => emotion);

    // Calculate average sentiment (simplified)
    const sentimentMap: Record<string, number> = {
      'joy': 0.8, 'love': 0.7, 'surprise': 0.3, 'neutral': 0,
      'fear': -0.6, 'sadness': -0.7, 'anger': -0.8
    };
    const sentiments = emotions.map(e => sentimentMap[e] || 0);
    const averageSentiment = sentiments.length > 0
      ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length
      : 0;

    // Generate key findings
    const keyFindings: string[] = [];
    if (dominantEmotions.includes('sadness')) {
      keyFindings.push('Persistent sadness detected throughout assessment');
    }
    if (dominantEmotions.includes('fear')) {
      keyFindings.push('Elevated anxiety levels observed');
    }
    if (averageSentiment < -0.3) {
      keyFindings.push('Overall negative emotional tone');
    }
    if (phq9Score && phq9Score >= 10) {
      keyFindings.push('Moderate to severe depression indicators present');
    }
    if (gad7Score && gad7Score >= 10) {
      keyFindings.push('Moderate to severe anxiety indicators present');
    }

    // Update session phase
    await SessionModel.findByIdAndUpdate(sessionId, {
      currentPhase: 'processing',
      updatedAt: new Date()
    });

    return {
      phq9Score,
      gad7Score,
      phq9Classification,
      gad7Classification,
      emotionalSummary: {
        dominantEmotions,
        averageSentiment,
        keyFindings
      }
    };
  }
}

export const voiceAssessmentService = new VoiceAssessmentService();
