import { PHQ9_QUESTIONS, GAD7_QUESTIONS, RESPONSE_OPTIONS, PHQ9_THRESHOLDS, GAD7_THRESHOLDS } from '../constants/tests.js';
import { TestResponse } from '../types/index.js';
import { SessionModel } from '../models/Session.js';

export class TestAdministratorService {
  /**
   * Initiate PHQ-9 test for a session
   */
  async initiatePHQ9(sessionId: string): Promise<void> {
    await SessionModel.findByIdAndUpdate(sessionId, {
      currentPhase: 'phq9',
      updatedAt: new Date()
    });
  }

  /**
   * Initiate GAD-7 test for a session
   */
  async initiateGAD7(sessionId: string): Promise<void> {
    await SessionModel.findByIdAndUpdate(sessionId, {
      currentPhase: 'gad7',
      updatedAt: new Date()
    });
  }

  /**
   * Get a specific question from PHQ-9 or GAD-7
   */
  presentQuestion(testType: 'phq9' | 'gad7', questionNumber: number): string {
    const questions = testType === 'phq9' ? PHQ9_QUESTIONS : GAD7_QUESTIONS;
    const question = questions.find(q => q.order === questionNumber);
    
    if (!question) {
      throw new Error(`Question ${questionNumber} not found for ${testType}`);
    }

    const optionsText = RESPONSE_OPTIONS.map(opt => `${opt.value}: ${opt.label}`).join(', ');
    return `Over the last 2 weeks, how often have you been bothered by: ${question.text}?\n\nPlease respond with: ${optionsText}`;
  }

  /**
   * Record a test response
   */
  async recordResponse(
    sessionId: string,
    questionId: string,
    score: number
  ): Promise<void> {
    if (score < 0 || score > 3) {
      throw new Error('Score must be between 0 and 3');
    }

    const session = await SessionModel.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const response: TestResponse = {
      questionId,
      score,
      timestamp: new Date()
    };

    if (questionId.startsWith('phq9')) {
      session.phq9Responses.push(response);
    } else if (questionId.startsWith('gad7')) {
      session.gad7Responses.push(response);
    } else {
      throw new Error('Invalid question ID');
    }

    await session.save();
  }

  /**
   * Calculate total score for a test
   */
  async calculateScore(sessionId: string, testType: 'phq9' | 'gad7'): Promise<number> {
    const session = await SessionModel.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const responses = testType === 'phq9' ? session.phq9Responses : session.gad7Responses;
    return responses.reduce((sum, response) => sum + response.score, 0);
  }

  /**
   * Classify risk level based on score
   */
  classifyPHQ9Risk(score: number): 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe' {
    if (score >= PHQ9_THRESHOLDS.severe.min) return 'severe';
    if (score >= PHQ9_THRESHOLDS.moderately_severe.min) return 'moderately_severe';
    if (score >= PHQ9_THRESHOLDS.moderate.min) return 'moderate';
    if (score >= PHQ9_THRESHOLDS.mild.min) return 'mild';
    return 'minimal';
  }

  /**
   * Classify anxiety risk level based on GAD-7 score
   */
  classifyGAD7Risk(score: number): 'minimal' | 'mild' | 'moderate' | 'severe' {
    if (score >= GAD7_THRESHOLDS.severe.min) return 'severe';
    if (score >= GAD7_THRESHOLDS.moderate.min) return 'moderate';
    if (score >= GAD7_THRESHOLDS.mild.min) return 'mild';
    return 'minimal';
  }

  /**
   * Get response options
   */
  getResponseOptions() {
    return RESPONSE_OPTIONS;
  }

  /**
   * Check if PHQ-9 is complete
   */
  async isPHQ9Complete(sessionId: string): Promise<boolean> {
    const session = await SessionModel.findById(sessionId);
    return session ? session.phq9Responses.length === 9 : false;
  }

  /**
   * Check if GAD-7 is complete
   */
  async isGAD7Complete(sessionId: string): Promise<boolean> {
    const session = await SessionModel.findById(sessionId);
    return session ? session.gad7Responses.length === 7 : false;
  }
}

export const testAdministratorService = new TestAdministratorService();
