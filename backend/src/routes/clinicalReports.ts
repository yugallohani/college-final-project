import express from 'express';
import { clinicalReportService } from '../services/ClinicalReportService.js';
import { aiInterviewService } from '../services/AIInterviewService.js';

const router = express.Router();

/**
 * POST /api/clinical-reports/test
 * Test clinical report generation with mock data
 */
router.post('/test', async (req, res) => {
  try {
    console.log('🧪 Testing clinical report generation...');
    
    // Mock assessment data for testing
    const mockResponses = [
      { questionId: 1, userResponse: "I've been feeling down most days", score: 2 },
      { questionId: 2, userResponse: "Yes, I feel hopeless sometimes", score: 2 },
      { questionId: 3, userResponse: "I have trouble sleeping", score: 1 },
      { questionId: 4, userResponse: "I'm tired all the time", score: 3 },
      { questionId: 5, userResponse: "My appetite is poor", score: 1 },
      { questionId: 6, userResponse: "I feel like a failure", score: 2 },
      { questionId: 7, userResponse: "I can't concentrate", score: 1 },
      { questionId: 8, userResponse: "I move slowly", score: 1 },
      { questionId: 9, userResponse: "Not at all", score: 0 }
    ];

    const mockConversationHistory = [
      { role: 'assistant', content: 'Hello, I\'m Dr. Sarah. How are you feeling today?' },
      { role: 'user', content: 'I\'ve been struggling lately' },
      { role: 'assistant', content: 'I understand. Let\'s go through some questions together.' }
    ];

    const testSessionId = 'test-session-' + Date.now();
    
    const report = await clinicalReportService.generateClinicalReport(
      testSessionId,
      'phq9',
      mockResponses,
      mockConversationHistory,
      'Test Patient'
    );

    console.log('✅ Test clinical report generated successfully');
    console.log('📊 Report summary:', {
      totalScore: report.totalScore,
      severityLevel: report.severityLevel,
      riskLevel: report.riskLevel,
      highRisk: report.highRisk,
      crisisDetected: report.crisisDetected
    });

    res.json({
      success: true,
      message: 'Clinical report test completed successfully',
      report
    });

  } catch (error: any) {
    console.error('❌ Error testing clinical report:', error);
    res.status(500).json({ error: error.message || 'Failed to test clinical report' });
  }
});

/**
 * GET /api/clinical-reports/:sessionId
 * Generate clinical report for a completed assessment
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { format = 'json' } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Get assessment data from AI interview service
    const responses = aiInterviewService.getResponses(sessionId);
    
    if (responses.length === 0) {
      return res.status(404).json({ error: 'No assessment data found for this session' });
    }

    // Determine assessment type from session (you might want to store this in the session)
    // For now, assume PHQ-9 if 9 questions, GAD-7 if 7 questions
    const assessmentType = responses.length === 9 ? 'phq9' : 'gad7';
    
    // Get conversation history from AI interview service
    const conversationHistory = aiInterviewService.getConversationHistory(sessionId);
    
    // Generate clinical report
    const report = await clinicalReportService.generateClinicalReport(
      sessionId,
      assessmentType,
      responses,
      conversationHistory,
      'Anonymous Patient' // You might want to get this from user session
    );

    if (format === 'pdf') {
      // Return PDF-formatted text
      const pdfContent = clinicalReportService.generatePDFReport(report);
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="clinical-report-${sessionId}.txt"`);
      return res.send(pdfContent);
    }

    // Return JSON format
    res.json({
      success: true,
      report
    });

  } catch (error: any) {
    console.error('Error generating clinical report:', error);
    res.status(500).json({ error: error.message || 'Failed to generate clinical report' });
  }
});

/**
 * GET /api/clinical-reports/dashboard/summary
 * Get summary data for doctor dashboard
 */
router.get('/dashboard/summary', async (req, res) => {
  try {
    // This would typically query a database of completed assessments
    // For now, return mock data to demonstrate the structure
    
    const mockReports = [
      {
        patientName: 'Yugal Lohani',
        assessmentType: 'PHQ-9',
        score: '12/27',
        riskLevel: 'moderate',
        completedAt: '2026-03-13',
        highRisk: false,
        sessionId: 'session-001'
      },
      {
        patientName: 'Rahul Sharma',
        assessmentType: 'PHQ-9',
        score: '16/27',
        riskLevel: 'high',
        completedAt: '2026-03-13',
        highRisk: true,
        sessionId: 'session-002'
      },
      {
        patientName: 'Aisha Patel',
        assessmentType: 'GAD-7',
        score: '7/21',
        riskLevel: 'mild',
        completedAt: '2026-03-12',
        highRisk: false,
        sessionId: 'session-003'
      },
      {
        patientName: 'Arjun Kumar',
        assessmentType: 'PHQ-9',
        score: '21/27',
        riskLevel: 'severe',
        completedAt: '2026-03-12',
        highRisk: true,
        sessionId: 'session-004'
      }
    ];

    // Sort by risk level (high risk first)
    const sortedReports = mockReports.sort((a, b) => {
      if (a.highRisk && !b.highRisk) return -1;
      if (!a.highRisk && b.highRisk) return 1;
      return 0;
    });

    res.json({
      success: true,
      reports: sortedReports,
      summary: {
        totalAssessments: mockReports.length,
        highRiskCases: mockReports.filter(r => r.highRisk).length,
        recentAssessments: mockReports.filter(r => r.completedAt === '2026-03-13').length
      }
    });

  } catch (error: any) {
    console.error('Error getting dashboard summary:', error);
    res.status(500).json({ error: error.message || 'Failed to get dashboard summary' });
  }
});

/**
 * POST /api/clinical-reports/generate
 * Generate clinical report from assessment data
 */
router.post('/generate', async (req, res) => {
  try {
    const { 
      sessionId, 
      assessmentType, 
      responses, 
      conversationHistory, 
      patientName 
    } = req.body;

    if (!sessionId || !assessmentType || !responses) {
      return res.status(400).json({ 
        error: 'sessionId, assessmentType, and responses are required' 
      });
    }

    const report = await clinicalReportService.generateClinicalReport(
      sessionId,
      assessmentType,
      responses,
      conversationHistory || [],
      patientName
    );

    res.json({
      success: true,
      report
    });

  } catch (error: any) {
    console.error('Error generating clinical report:', error);
    res.status(500).json({ error: error.message || 'Failed to generate clinical report' });
  }
});

export default router;