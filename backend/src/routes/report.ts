import express from 'express';
import { SessionModel } from '../models/Session.js';
import { testAdministratorService } from '../services/TestAdministratorService.js';
import { pdfExportService } from '../services/PDFExportService.js';
import { pool } from '../database/db.js';

const router = express.Router();

/**
 * GET /api/report/:sessionId
 * Retrieve screening report
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await SessionModel.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Calculate scores
    const phq9Score = await testAdministratorService.calculateScore(sessionId, 'phq9');
    const gad7Score = await testAdministratorService.calculateScore(sessionId, 'gad7');

    const phq9Classification = testAdministratorService.classifyPHQ9Risk(phq9Score);
    const gad7Classification = testAdministratorService.classifyGAD7Risk(gad7Score);

    // Generate key observations
    const keyObservations: string[] = [];
    
    if (phq9Score >= 10) {
      keyObservations.push('Moderate to severe depression symptoms detected');
    }
    if (gad7Score >= 10) {
      keyObservations.push('Moderate to severe anxiety symptoms detected');
    }
    
    // Check specific high-scoring items
    const highPhq9Items = session.phq9Responses.filter(r => r.score >= 2);
    if (highPhq9Items.some(r => r.questionId === 'phq9_3')) {
      keyObservations.push('Sleep disturbance indicators present');
    }
    if (highPhq9Items.some(r => r.questionId === 'phq9_1')) {
      keyObservations.push('Loss of interest or pleasure in activities');
    }

    // Generate suggestions
    const suggestions: string[] = [];
    
    if (gad7Score >= 5) {
      suggestions.push('Practice relaxation techniques such as deep breathing or meditation');
    }
    if (session.phq9Responses.some(r => r.questionId === 'phq9_3' && r.score >= 2)) {
      suggestions.push('Maintain a consistent sleep schedule and create a relaxing bedtime routine');
    }
    if (phq9Score >= 10 || gad7Score >= 10) {
      suggestions.push('Consider speaking with a mental health professional for personalized support');
    }
    if (phq9Score >= 15 || gad7Score >= 15) {
      suggestions.push('We strongly recommend connecting with a licensed psychologist or psychiatrist');
    }

    // Build report
    const report = {
      sessionId: session.id,
      phq9Score,
      phq9Classification,
      gad7Score,
      gad7Classification,
      emotions: session.emotionAnalysis || [],
      keyObservations,
      suggestions,
      timestamp: new Date(),
      crisisDetected: session.phq9Responses.some(r => r.questionId === 'phq9_9' && r.score >= 1)
    };

    // Update session with risk assessment
    await pool.query(
      `UPDATE sessions 
       SET risk_assessment = $1, current_phase = 'complete', updated_at = NOW()
       WHERE id = $2`,
      [
        JSON.stringify({
          depressionScore: phq9Score,
          depressionClassification: phq9Classification,
          anxietyScore: gad7Score,
          anxietyClassification: gad7Classification,
          confidenceInterval: {
            depression: { lower: phq9Score - 2, upper: phq9Score + 2 },
            anxiety: { lower: gad7Score - 2, upper: gad7Score + 2 }
          },
          keyObservations,
          timestamp: new Date()
        }),
        sessionId
      ]
    );

    res.json(report);
  } catch (error: any) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * POST /api/report/:sessionId/export
 * Export report as PDF
 */
router.post('/:sessionId/export', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await SessionModel.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Calculate scores
    const phq9Score = await testAdministratorService.calculateScore(sessionId, 'phq9');
    const gad7Score = await testAdministratorService.calculateScore(sessionId, 'gad7');

    const reportData = {
      sessionId: session.id,
      phq9Score,
      phq9Classification: testAdministratorService.classifyPHQ9Risk(phq9Score),
      gad7Score,
      gad7Classification: testAdministratorService.classifyGAD7Risk(gad7Score),
      emotions: session.emotionAnalysis || [],
      timestamp: new Date()
    };

    const pdfBuffer = await pdfExportService.generateReport(reportData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="neuroscan-report-${sessionId}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error exporting report:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

export default router;
