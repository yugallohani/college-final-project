import { PHQ9_QUESTIONS, GAD7_QUESTIONS, PHQ9_THRESHOLDS, GAD7_THRESHOLDS, RESPONSE_OPTIONS } from '../constants/tests.js';

export interface ClinicalReportData {
  patientId: string;
  patientName?: string;
  assessmentType: 'phq9' | 'gad7';
  sessionId: string;
  completedAt: Date;
  totalScore: number;
  maxScore: number;
  severityLevel: string;
  riskLevel: 'minimal' | 'mild' | 'moderate' | 'high' | 'severe';
  questionBreakdown: QuestionResult[];
  riskIndicators: string[];
  conversationSummary: string;
  recommendedAction: string;
  highRisk: boolean;
  crisisDetected: boolean;
}

export interface QuestionResult {
  questionId: number;
  questionText: string;
  userAnswer: string;
  score: number;
  maxScore: number;
}

export class ClinicalReportService {
  /**
   * Generate a structured clinical report from assessment data
   */
  async generateClinicalReport(
    sessionId: string,
    assessmentType: 'phq9' | 'gad7',
    responses: Array<{ questionId: number; userResponse: string; score: number }>,
    conversationHistory: Array<{ role: string; content: string }>,
    patientName?: string
  ): Promise<ClinicalReportData> {
    
    const questions = assessmentType === 'phq9' ? PHQ9_QUESTIONS : GAD7_QUESTIONS;
    const thresholds = assessmentType === 'phq9' ? PHQ9_THRESHOLDS : GAD7_THRESHOLDS;
    const maxScore = questions.length * 3; // Each question max score is 3
    
    // Calculate total score
    const totalScore = responses.reduce((sum, r) => sum + r.score, 0);
    
    // Determine severity level and risk
    const { severityLevel, riskLevel } = this.calculateSeverityAndRisk(totalScore, thresholds);
    
    // Build question breakdown
    const questionBreakdown: QuestionResult[] = responses.map(response => {
      const question = questions.find(q => q.order === response.questionId);
      const responseOption = RESPONSE_OPTIONS.find(opt => opt.value === response.score);
      
      return {
        questionId: response.questionId,
        questionText: question?.text || 'Unknown question',
        userAnswer: responseOption?.label || response.userResponse,
        score: response.score,
        maxScore: 3
      };
    });
    
    // Generate risk indicators
    const riskIndicators = this.generateRiskIndicators(assessmentType, questionBreakdown);
    
    // Generate conversation summary
    const conversationSummary = this.generateConversationSummary(conversationHistory);
    
    // Determine recommended action
    const recommendedAction = this.getRecommendedAction(riskLevel, assessmentType);
    
    // Check for high risk (PHQ-9 Q9 or high scores)
    const highRisk = this.isHighRisk(assessmentType, questionBreakdown, totalScore);
    const crisisDetected = this.isCrisisDetected(assessmentType, questionBreakdown);
    
    return {
      patientId: sessionId, // Using sessionId as patientId for now
      patientName: patientName || 'Anonymous Patient',
      assessmentType,
      sessionId,
      completedAt: new Date(),
      totalScore,
      maxScore,
      severityLevel,
      riskLevel,
      questionBreakdown,
      riskIndicators,
      conversationSummary,
      recommendedAction,
      highRisk,
      crisisDetected
    };
  }
  
  /**
   * Calculate severity level and risk from total score
   */
  private calculateSeverityAndRisk(totalScore: number, thresholds: any): { severityLevel: string; riskLevel: string } {
    for (const [level, range] of Object.entries(thresholds)) {
      const threshold = range as { min: number; max: number; label: string };
      if (totalScore >= threshold.min && totalScore <= threshold.max) {
        return {
          severityLevel: threshold.label,
          riskLevel: level
        };
      }
    }
    return { severityLevel: 'Unknown', riskLevel: 'minimal' };
  }
  
  /**
   * Generate clinical risk indicators based on responses
   */
  private generateRiskIndicators(assessmentType: string, questionBreakdown: QuestionResult[]): string[] {
    const indicators: string[] = [];
    
    if (assessmentType === 'phq9') {
      // PHQ-9 specific indicators
      questionBreakdown.forEach(q => {
        if (q.score >= 2) { // More than half the days or nearly every day
          switch (q.questionId) {
            case 1:
              indicators.push('Persistent anhedonia (loss of interest/pleasure)');
              break;
            case 2:
              indicators.push('Persistent low mood');
              break;
            case 3:
              indicators.push('Sleep disturbances');
              break;
            case 4:
              indicators.push('Fatigue and low energy');
              break;
            case 5:
              indicators.push('Appetite changes');
              break;
            case 6:
              indicators.push('Negative self-perception');
              break;
            case 7:
              indicators.push('Concentration difficulties');
              break;
            case 8:
              indicators.push('Psychomotor changes');
              break;
            case 9:
              if (q.score >= 1) {
                indicators.push('⚠️ SUICIDAL IDEATION - IMMEDIATE ATTENTION REQUIRED');
              }
              break;
          }
        }
      });
    } else if (assessmentType === 'gad7') {
      // GAD-7 specific indicators
      questionBreakdown.forEach(q => {
        if (q.score >= 2) {
          switch (q.questionId) {
            case 1:
              indicators.push('Persistent anxiety and nervousness');
              break;
            case 2:
              indicators.push('Uncontrollable worry');
              break;
            case 3:
              indicators.push('Excessive worry about multiple areas');
              break;
            case 4:
              indicators.push('Difficulty relaxing');
              break;
            case 5:
              indicators.push('Restlessness and agitation');
              break;
            case 6:
              indicators.push('Irritability');
              break;
            case 7:
              indicators.push('Anticipatory anxiety');
              break;
          }
        }
      });
    }
    
    return indicators;
  }
  
  /**
   * Generate a clinical conversation summary
   */
  private generateConversationSummary(conversationHistory: Array<{ role: string; content: string }>): string {
    // Extract key user responses (not questions)
    const userResponses = conversationHistory
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .slice(0, 5); // First 5 responses for summary
    
    if (userResponses.length === 0) {
      return 'Patient completed structured assessment via AI interview.';
    }
    
    // Create a clinical summary
    const themes: string[] = [];
    const allResponses = userResponses.join(' ').toLowerCase();
    
    // Detect common themes
    if (allResponses.includes('sleep') || allResponses.includes('tired') || allResponses.includes('energy')) {
      themes.push('sleep/energy concerns');
    }
    if (allResponses.includes('sad') || allResponses.includes('down') || allResponses.includes('depressed')) {
      themes.push('depressed mood');
    }
    if (allResponses.includes('anxious') || allResponses.includes('nervous') || allResponses.includes('worry')) {
      themes.push('anxiety symptoms');
    }
    if (allResponses.includes('concentrate') || allResponses.includes('focus')) {
      themes.push('concentration difficulties');
    }
    
    const themeText = themes.length > 0 ? ` Key themes: ${themes.join(', ')}.` : '';
    
    return `Patient completed structured clinical interview via AI system.${themeText} Responses indicate varying levels of symptom severity across assessed domains.`;
  }
  
  /**
   * Get recommended action based on risk level
   */
  private getRecommendedAction(riskLevel: string, assessmentType: string): string {
    const assessmentName = assessmentType === 'phq9' ? 'depression' : 'anxiety';
    
    switch (riskLevel) {
      case 'minimal':
        return `Minimal ${assessmentName} symptoms detected. Consider routine follow-up and psychoeducation.`;
      case 'mild':
        return `Mild ${assessmentName} symptoms. Consider brief counseling, self-help resources, or watchful waiting.`;
      case 'moderate':
        return `Moderate ${assessmentName} symptoms. Recommend evaluation by licensed mental health professional for treatment planning.`;
      case 'moderately_severe':
      case 'high':
        return `Moderately severe ${assessmentName} symptoms. Recommend prompt referral to mental health specialist for comprehensive evaluation and treatment.`;
      case 'severe':
        return `Severe ${assessmentName} symptoms. Urgent referral to mental health specialist required. Consider immediate intervention.`;
      default:
        return 'Further evaluation by licensed mental health professional recommended.';
    }
  }
  
  /**
   * Check if this is a high-risk case
   */
  private isHighRisk(assessmentType: string, questionBreakdown: QuestionResult[], totalScore: number): boolean {
    // PHQ-9 Q9 (suicide) - any score ≥ 1 is high risk
    if (assessmentType === 'phq9') {
      const q9 = questionBreakdown.find(q => q.questionId === 9);
      if (q9 && q9.score >= 1) return true;
      
      // Also high risk if total score is severe
      if (totalScore >= 20) return true;
    }
    
    // GAD-7 severe anxiety
    if (assessmentType === 'gad7' && totalScore >= 15) return true;
    
    return false;
  }
  
  /**
   * Check if crisis was detected
   */
  private isCrisisDetected(assessmentType: string, questionBreakdown: QuestionResult[]): boolean {
    // PHQ-9 Q9 with any positive response is a crisis
    if (assessmentType === 'phq9') {
      const q9 = questionBreakdown.find(q => q.questionId === 9);
      return q9 ? q9.score >= 1 : false;
    }
    
    return false;
  }
  
  /**
   * Format report for doctor dashboard display
   */
  formatForDashboard(report: ClinicalReportData): {
    patientName: string;
    assessmentType: string;
    score: string;
    riskLevel: string;
    completedAt: string;
    highRisk: boolean;
  } {
    return {
      patientName: report.patientName || 'Anonymous',
      assessmentType: report.assessmentType.toUpperCase(),
      score: `${report.totalScore}/${report.maxScore}`,
      riskLevel: report.riskLevel,
      completedAt: report.completedAt.toLocaleDateString(),
      highRisk: report.highRisk
    };
  }
  
  /**
   * Generate PDF-ready clinical report
   */
  generatePDFReport(report: ClinicalReportData): string {
    const date = report.completedAt.toLocaleDateString();
    const time = report.completedAt.toLocaleTimeString();
    
    return `
CLINICAL ASSESSMENT REPORT

Patient: ${report.patientName}
Assessment: ${report.assessmentType.toUpperCase()} ${report.assessmentType === 'phq9' ? 'Depression Screening' : 'Anxiety Assessment'}
Date: ${date} at ${time}
Session ID: ${report.sessionId}

${report.assessmentType.toUpperCase()} RESULTS
Score: ${report.totalScore} / ${report.maxScore}
Severity Level: ${report.severityLevel}
Risk Level: ${report.riskLevel.toUpperCase()}
${report.highRisk ? '⚠️ HIGH RISK CASE' : ''}
${report.crisisDetected ? '🚨 CRISIS DETECTED - IMMEDIATE ATTENTION REQUIRED' : ''}

QUESTION BREAKDOWN
${report.questionBreakdown.map(q => 
  `Q${q.questionId} – ${q.questionText}
  Answer: ${q.userAnswer}
  Score: ${q.score}/3`
).join('\n\n')}

RISK INDICATORS
${report.riskIndicators.length > 0 ? 
  report.riskIndicators.map(indicator => `• ${indicator}`).join('\n') : 
  '• No significant risk indicators identified'
}

AI CONVERSATION SUMMARY
${report.conversationSummary}

RECOMMENDED ACTION
${report.recommendedAction}

---
This report was generated by NeuroScan AI Mental Health Triage Platform.
For clinical use by licensed healthcare professionals only.
Generated on: ${new Date().toLocaleString()}
    `.trim();
  }
}

export const clinicalReportService = new ClinicalReportService();