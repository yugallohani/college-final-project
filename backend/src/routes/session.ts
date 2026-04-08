import express from 'express';
import { SessionModel } from '../models/Session.js';
import { aiService } from '../services/AIService.js';

const router = express.Router();

/**
 * POST /api/session/start
 * Initialize a new screening session
 */
router.post('/start', async (req, res) => {
  try {
    const { userId, language = 'en' } = req.body;

    // Create new session
    const session = await SessionModel.create(userId);

    // Generate greeting (with fallback if AI service fails)
    let greeting = 'Hello! I\'m here to help you with your mental health assessment. Let\'s begin.';
    try {
      greeting = await aiService.generateGreeting(language);
    } catch (greetingError) {
      console.error('Gemini greeting error:', greetingError);
      // Use fallback greeting
    }
    
    // Add greeting to messages
    session.messages.push({
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: greeting,
      timestamp: new Date()
    });

    // Save the session with the greeting message
    const updatedSession = await SessionModel.save(session);

    res.status(201).json({
      sessionId: updatedSession.id,
      message: greeting,
      phase: updatedSession.currentPhase
    });
  } catch (error: any) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

/**
 * GET /api/session/:sessionId
 * Retrieve session state
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await SessionModel.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      sessionId: session.id,
      currentPhase: session.currentPhase,
      messageCount: session.messages.length,
      phq9Progress: `${session.phq9Responses.length}/9`,
      gad7Progress: `${session.gad7Responses.length}/7`,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    });
  } catch (error: any) {
    console.error('Error retrieving session:', error);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

/**
 * DELETE /api/session/:sessionId
 * Delete session data
 */
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // TODO: Implement delete in SessionModel
    res.json({ message: 'Session deletion not yet implemented' });
  } catch (error: any) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

export default router;
