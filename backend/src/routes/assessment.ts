import express from 'express';
import multer from 'multer';
import { voiceAssessmentService } from '../services/VoiceAssessmentService.js';
import { whisperService } from '../services/WhisperService.js';
import { testAdministratorService } from '../services/TestAdministratorService.js';

const router = express.Router();

// Configure multer for audio uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * POST /api/assessment/start
 * Initialize a new voice assessment session
 */
router.post('/start', async (req, res) => {
  try {
    const { sessionId, assessmentType } = req.body;

    if (!sessionId || !assessmentType) {
      return res.status(400).json({ error: 'sessionId and assessmentType are required' });
    }

    if (!['phq9', 'gad7', 'general'].includes(assessmentType)) {
      return res.status(400).json({ error: 'Invalid assessment type' });
    }

    const state = await voiceAssessmentService.initializeAssessment(
      sessionId,
      assessmentType as 'phq9' | 'gad7' | 'general'
    );

    const introduction = await voiceAssessmentService.generateIntroduction(
      assessmentType as 'phq9' | 'gad7' | 'general'
    );

    res.json({
      state,
      introduction,
      message: 'Assessment initialized successfully'
    });
  } catch (error: any) {
    console.error('Error starting assessment:', error);
    res.status(500).json({ error: error.message || 'Failed to start assessment' });
  }
});

/**
 * POST /api/assessment/voice-response
 * Process user's voice response
 */
router.post('/voice-response', upload.single('audio'), async (req, res) => {
  try {
    const { sessionId, assessmentType, questionNumber } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    if (!sessionId || !assessmentType || !questionNumber) {
      return res.status(400).json({ 
        error: 'sessionId, assessmentType, and questionNumber are required' 
      });
    }

    // Transcribe audio to text
    const transcribedText = await whisperService.transcribeBuffer(req.file.buffer);

    // Process the response
    const result = await voiceAssessmentService.processVoiceResponse(
      sessionId,
      transcribedText,
      assessmentType as 'phq9' | 'gad7' | 'general',
      parseInt(questionNumber)
    );

    // If crisis detected, return immediately
    if (result.crisisDetected) {
      return res.json({
        transcribedText,
        analysis: result.analysis,
        crisisDetected: true,
        crisisResponse: result.crisisResponse,
        nextQuestion: null
      });
    }

    // Record the score if extracted
    if (result.extractedScore !== undefined && (assessmentType === 'phq9' || assessmentType === 'gad7')) {
      const questionId = `${assessmentType}_q${questionNumber}`;
      await testAdministratorService.recordResponse(
        sessionId,
        questionId,
        result.extractedScore
      );
    }

    // Generate AI's verbal response
    const currentQuestionNum = parseInt(questionNumber);
    const totalQuestions = assessmentType === 'phq9' ? 9 : assessmentType === 'gad7' ? 7 : 10;
    
    const aiResponse = await voiceAssessmentService.generateVerbalResponse(
      sessionId,
      transcribedText,
      currentQuestionNum,
      totalQuestions
    );

    // Get next question if not complete
    let nextQuestion = null;
    if (currentQuestionNum < totalQuestions) {
      nextQuestion = await voiceAssessmentService.generateNextQuestion(
        sessionId,
        assessmentType as 'phq9' | 'gad7' | 'general',
        currentQuestionNum + 1
      );
    }

    res.json({
      transcribedText,
      analysis: result.analysis,
      aiResponse,
      nextQuestion,
      currentQuestion: currentQuestionNum,
      totalQuestions,
      isComplete: currentQuestionNum >= totalQuestions,
      crisisDetected: false
    });
  } catch (error: any) {
    console.error('Error processing voice response:', error);
    res.status(500).json({ error: error.message || 'Failed to process voice response' });
  }
});

/**
 * POST /api/assessment/text-response
 * Process user's text response (fallback for voice)
 */
router.post('/text-response', async (req, res) => {
  try {
    const { sessionId, assessmentType, questionNumber, text } = req.body;

    if (!sessionId || !assessmentType || !questionNumber || !text) {
      return res.status(400).json({ 
        error: 'sessionId, assessmentType, questionNumber, and text are required' 
      });
    }

    // Process the response
    const result = await voiceAssessmentService.processVoiceResponse(
      sessionId,
      text,
      assessmentType as 'phq9' | 'gad7' | 'general',
      parseInt(questionNumber)
    );

    // If crisis detected, return immediately
    if (result.crisisDetected) {
      return res.json({
        analysis: result.analysis,
        crisisDetected: true,
        crisisResponse: result.crisisResponse,
        nextQuestion: null
      });
    }

    // Record the score if extracted
    if (result.extractedScore !== undefined && (assessmentType === 'phq9' || assessmentType === 'gad7')) {
      const questionId = `${assessmentType}_q${questionNumber}`;
      await testAdministratorService.recordResponse(
        sessionId,
        questionId,
        result.extractedScore
      );
    }

    // Generate AI's verbal response
    const currentQuestionNum = parseInt(questionNumber);
    const totalQuestions = assessmentType === 'phq9' ? 9 : assessmentType === 'gad7' ? 7 : 10;
    
    const aiResponse = await voiceAssessmentService.generateVerbalResponse(
      sessionId,
      text,
      currentQuestionNum,
      totalQuestions
    );

    // Get next question if not complete
    let nextQuestion = null;
    if (currentQuestionNum < totalQuestions) {
      nextQuestion = await voiceAssessmentService.generateNextQuestion(
        sessionId,
        assessmentType as 'phq9' | 'gad7' | 'general',
        currentQuestionNum + 1
      );
    }

    res.json({
      analysis: result.analysis,
      aiResponse,
      nextQuestion,
      currentQuestion: currentQuestionNum,
      totalQuestions,
      isComplete: currentQuestionNum >= totalQuestions,
      crisisDetected: false
    });
  } catch (error: any) {
    console.error('Error processing text response:', error);
    res.status(500).json({ error: error.message || 'Failed to process text response' });
  }
});

/**
 * POST /api/assessment/complete
 * Complete the assessment and generate report
 */
router.post('/complete', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const results = await voiceAssessmentService.completeAssessment(sessionId);

    res.json({
      message: 'Assessment completed successfully',
      results
    });
  } catch (error: any) {
    console.error('Error completing assessment:', error);
    res.status(500).json({ error: error.message || 'Failed to complete assessment' });
  }
});

/**
 * GET /api/assessment/:sessionId/status
 * Get current assessment status
 */
router.get('/:sessionId/status', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // This would retrieve the current state from the session
    // For now, return a basic status
    res.json({
      sessionId,
      status: 'in_progress',
      message: 'Assessment status retrieved'
    });
  } catch (error: any) {
    console.error('Error getting assessment status:', error);
    res.status(500).json({ error: 'Failed to get assessment status' });
  }
});

export default router;
