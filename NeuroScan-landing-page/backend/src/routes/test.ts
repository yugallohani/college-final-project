import express from 'express';
import { testAdministratorService } from '../services/TestAdministratorService.js';

const router = express.Router();

/**
 * POST /api/test/response
 * Record a test response (PHQ-9 or GAD-7)
 */
router.post('/response', async (req, res) => {
  try {
    const { sessionId, questionId, score } = req.body;

    if (!sessionId || !questionId || score === undefined) {
      return res.status(400).json({ error: 'sessionId, questionId, and score are required' });
    }

    await testAdministratorService.recordResponse(sessionId, questionId, score);

    res.json({ message: 'Response recorded successfully' });
  } catch (error: any) {
    console.error('Error recording test response:', error);
    res.status(500).json({ error: error.message || 'Failed to record response' });
  }
});

/**
 * GET /api/test/:sessionId/scores
 * Retrieve test scores
 */
router.get('/:sessionId/scores', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const phq9Score = await testAdministratorService.calculateScore(sessionId, 'phq9');
    const gad7Score = await testAdministratorService.calculateScore(sessionId, 'gad7');

    const phq9Classification = testAdministratorService.classifyPHQ9Risk(phq9Score);
    const gad7Classification = testAdministratorService.classifyGAD7Risk(gad7Score);

    res.json({
      phq9: {
        score: phq9Score,
        classification: phq9Classification
      },
      gad7: {
        score: gad7Score,
        classification: gad7Classification
      }
    });
  } catch (error: any) {
    console.error('Error retrieving test scores:', error);
    res.status(500).json({ error: 'Failed to retrieve test scores' });
  }
});

/**
 * GET /api/test/options
 * Get response options for tests
 */
router.get('/options', (req, res) => {
  const options = testAdministratorService.getResponseOptions();
  res.json({ options });
});

export default router;
