import express from 'express';
import { SessionModel } from '../models/Session.js';
import { aiService } from '../services/AIService.js';
import { emotionDetectionService } from '../services/EmotionDetectionService.js';
import { crisisDetectionService } from '../services/CrisisDetectionService.js';
import { testAdministratorService } from '../services/TestAdministratorService.js';

const router = express.Router();

/**
 * POST /api/chat/message
 * Send user message and receive AI response
 */
router.post('/message', async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: 'sessionId and message are required' });
    }

    const session = await SessionModel.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Add user message
    const userMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    };
    session.messages.push(userMessage);

    // Detect emotions in user message (skip if no API key)
    if (process.env.HUGGINGFACE_API_KEY) {
      try {
        const emotions = await emotionDetectionService.detectEmotions(message);
        if (emotions.length > 0) {
          session.emotionAnalysis.push({
            messageId: userMessage.id,
            emotion: emotions[0].label,
            confidence: emotions[0].score,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.warn('Emotion detection failed:', error);
      }
    }

    // Check for crisis indicators
    const crisisResponse = await crisisDetectionService.generateCrisisResponse(
      sessionId,
      message
    );

    if (crisisResponse.detected) {
      await crisisDetectionService.logCrisisDetection(sessionId, crisisResponse.severity);
      
      await SessionModel.save(session);
      
      return res.json({
        message: crisisResponse.message,
        crisis: true,
        resources: crisisResponse.resources,
        phase: session.currentPhase
      });
    }

    // Get conversation context
    const recentEmotions = session.emotionAnalysis.slice(-5).map(e => e.emotion);
    const context = {
      recentMessages: session.messages.slice(-10),
      detectedEmotions: recentEmotions,
      phase: session.currentPhase,
      language: 'en' as const
    };

    // Determine next action based on phase
    let aiResponse: string;

    if (session.currentPhase === 'conversation') {
      // Check if should transition to tests
      const conversationTurns = session.messages.filter(m => m.role === 'user').length;
      
      if (aiService.shouldTransitionToTests(conversationTurns, context)) {
        // Transition to PHQ-9
        await testAdministratorService.initiatePHQ9(sessionId);
        aiResponse = "Thank you for sharing. Now I'd like to ask you some specific questions to better understand how you've been feeling. These questions are part of a standard screening tool.\n\n" +
          testAdministratorService.presentQuestion('phq9', 1);
      } else {
        // Continue conversation
        aiResponse = await aiService.generateResponse(context);
      }
    } else if (session.currentPhase === 'phq9') {
      // Handle PHQ-9 response
      const questionNumber = session.phq9Responses.length + 1;
      
      if (questionNumber <= 9) {
        aiResponse = testAdministratorService.presentQuestion('phq9', questionNumber);
      } else {
        // PHQ-9 complete, move to GAD-7
        await testAdministratorService.initiateGAD7(sessionId);
        aiResponse = "Thank you. Now I have a few questions about anxiety and worry.\n\n" +
          testAdministratorService.presentQuestion('gad7', 1);
      }
    } else if (session.currentPhase === 'gad7') {
      // Handle GAD-7 response
      const questionNumber = session.gad7Responses.length + 1;
      
      if (questionNumber <= 7) {
        aiResponse = testAdministratorService.presentQuestion('gad7', questionNumber);
      } else {
        // Tests complete, move to processing
        session.currentPhase = 'processing';
        aiResponse = "Thank you for completing the assessment. I'm now analyzing your responses to generate your mental health screening report. This will take just a moment...";
      }
    } else {
      aiResponse = "Your assessment is being processed. Please wait for your report.";
    }

    // Add AI response
    const assistantMessage = {
      id: `msg_${Date.now()}_assistant`,
      role: 'assistant' as const,
      content: aiResponse,
      timestamp: new Date()
    };
    session.messages.push(assistantMessage);

    await SessionModel.save(session);

    res.json({
      message: aiResponse,
      phase: session.currentPhase,
      crisis: false
    });
  } catch (error: any) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

/**
 * GET /api/chat/:sessionId/history
 * Retrieve conversation history
 */
router.get('/:sessionId/history', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await SessionModel.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      messages: session.messages,
      phase: session.currentPhase
    });
  } catch (error: any) {
    console.error('Error retrieving chat history:', error);
    res.status(500).json({ error: 'Failed to retrieve chat history' });
  }
});

export default router;
