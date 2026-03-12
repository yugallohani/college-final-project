import { CRISIS_KEYWORDS, CRISIS_RESOURCES } from '../constants/tests.js';
import { SessionModel } from '../models/Session.js';

export interface CrisisResponse {
  detected: boolean;
  severity: 'none' | 'low' | 'moderate' | 'high';
  resources: {
    hotline: string;
    emergency: string;
    text: string;
    international: string;
  };
  message: string;
}

export class CrisisDetectionService {
  /**
   * Detect crisis indicators in user input
   */
  detectCrisisIndicators(text: string): boolean {
    const lowerText = text.toLowerCase();
    return CRISIS_KEYWORDS.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Check PHQ-9 item 9 (self-harm thoughts) score
   */
  async checkPHQ9Item9(sessionId: string): Promise<boolean> {
    const session = await SessionModel.findById(sessionId);
    if (!session) return false;

    const item9 = session.phq9Responses.find(r => r.questionId === 'phq9_9');
    return item9 ? item9.score >= 1 : false;
  }

  /**
   * Get crisis resources based on language
   */
  getCrisisResources(language: 'en' | 'hi' = 'en'): CrisisResponse['resources'] {
    return CRISIS_RESOURCES[language];
  }

  /**
   * Generate crisis response
   */
  async generateCrisisResponse(
    sessionId: string,
    userMessage?: string,
    language: 'en' | 'hi' = 'en'
  ): Promise<CrisisResponse> {
    let detected = false;
    let severity: CrisisResponse['severity'] = 'none';

    // Check explicit keywords in message
    if (userMessage && this.detectCrisisIndicators(userMessage)) {
      detected = true;
      severity = 'high';
    }

    // Check PHQ-9 item 9
    const phq9Item9Positive = await this.checkPHQ9Item9(sessionId);
    if (phq9Item9Positive) {
      detected = true;
      severity = severity === 'high' ? 'high' : 'moderate';
    }

    const resources = this.getCrisisResources(language);

    const messages = {
      en: {
        high: 'I\'m concerned about what you\'ve shared. Your safety is the top priority. Please reach out to a crisis counselor immediately.',
        moderate: 'I notice you\'ve mentioned thoughts of self-harm. It\'s important to talk to someone who can provide immediate support.',
        none: ''
      },
      hi: {
        high: 'मुझे आपकी बात से चिंता हो रही है। आपकी सुरक्षा सबसे महत्वपूर्ण है। कृपया तुरंत संकट परामर्शदाता से संपर्क करें।',
        moderate: 'मैंने देखा कि आपने आत्म-हानि के विचारों का उल्लेख किया है। तत्काल सहायता प्रदान करने वाले किसी व्यक्ति से बात करना महत्वपूर्ण है।',
        none: ''
      }
    };

    return {
      detected,
      severity,
      resources,
      message: messages[language][severity]
    };
  }

  /**
   * Log crisis detection for audit
   */
  async logCrisisDetection(sessionId: string, severity: string): Promise<void> {
    // TODO: Implement audit logging
    console.log(`[CRISIS DETECTED] Session: ${sessionId}, Severity: ${severity}, Time: ${new Date().toISOString()}`);
  }
}

export const crisisDetectionService = new CrisisDetectionService();
