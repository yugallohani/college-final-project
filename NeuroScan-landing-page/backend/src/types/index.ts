// Core data types for the AI Virtual Clinical Psychologist

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    questionId?: string;
    score?: number;
  };
}

export interface Session {
  id: string;
  userId?: string;
  messages: Message[];
  currentPhase: 'conversation' | 'phq9' | 'gad7' | 'processing' | 'complete';
  phq9Responses: TestResponse[];
  gad7Responses: TestResponse[];
  languageAnalysis?: LanguageAnalysis;
  emotionAnalysis?: EmotionAnalysis[];
  riskAssessment?: RiskAssessment;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestResponse {
  questionId: string;
  score: number;
  timestamp: Date;
}

export interface LanguageAnalysis {
  negativeSelfTalk: number;
  hopelessness: number;
  cognitiveDistortions: string[];
  linguisticComplexity: number;
  negativePositiveRatio: number;
  confidenceScore: number;
}

export interface EmotionAnalysis {
  emotion: 'sadness' | 'fear' | 'anger' | 'joy' | 'surprise' | 'neutral';
  intensity: number;
  valence: 'positive' | 'negative' | 'mixed';
  timestamp: Date;
}

export interface RiskAssessment {
  depressionScore: number;
  depressionClassification: 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe';
  anxietyScore: number;
  anxietyClassification: 'minimal' | 'mild' | 'moderate' | 'severe';
  confidenceInterval: {
    depression: { lower: number; upper: number };
    anxiety: { lower: number; upper: number };
  };
  keyObservations: string[];
  timestamp: Date;
}

export interface ScreeningReport {
  sessionId: string;
  phq9Score: number;
  phq9Classification: string;
  gad7Score: number;
  gad7Classification: string;
  emotions: EmotionAnalysis[];
  keyObservations: string[];
  suggestions: string[];
  timestamp: Date;
  crisisDetected: boolean;
}

export interface PsychologistProfile {
  id: string;
  name: string;
  specialization: string[];
  experience: number;
  credentials: string[];
  rating: number;
  reviewCount: number;
  availability: string[];
  bio: string;
}

export interface ConversationContext {
  recentMessages: Message[];
  detectedEmotions: string[];
  phase: string;
  language: 'en' | 'hi';
}

export interface PHQ9Question {
  id: string;
  text: string;
  order: number;
}

export interface GAD7Question {
  id: string;
  text: string;
  order: number;
}

export interface ResponseOption {
  value: number;
  label: string;
}
