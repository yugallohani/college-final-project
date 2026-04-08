import express from 'express';
import { elevenLabsService } from '../services/ElevenLabsService.js';

const router = express.Router();

/**
 * POST /api/tts/speak
 * Convert text to speech using ElevenLabs
 */
router.post('/speak', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!elevenLabsService.isAvailable()) {
      return res.status(503).json({ 
        error: 'ElevenLabs TTS not available',
        fallback: true,
        message: 'Use browser Speech Synthesis as fallback'
      });
    }

    // Generate speech
    const audioBuffer = await elevenLabsService.textToSpeech(text);

    // Send audio as MP3
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'no-cache'
    });

    res.send(audioBuffer);
  } catch (error: any) {
    console.error('Error in TTS endpoint:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate speech',
      fallback: true 
    });
  }
});

/**
 * GET /api/tts/status
 * Check if ElevenLabs TTS is available
 */
router.get('/status', async (req, res) => {
  try {
    const isAvailable = elevenLabsService.isAvailable();
    
    if (isAvailable) {
      const usage = await elevenLabsService.getUsage();
      res.json({
        available: true,
        provider: 'ElevenLabs',
        usage: usage
      });
    } else {
      res.json({
        available: false,
        provider: 'Browser Speech Synthesis (fallback)',
        message: 'ElevenLabs API key not configured'
      });
    }
  } catch (error: any) {
    res.json({
      available: false,
      provider: 'Browser Speech Synthesis (fallback)',
      error: error.message
    });
  }
});

/**
 * GET /api/tts/voices
 * Get available ElevenLabs voices
 */
router.get('/voices', async (req, res) => {
  try {
    if (!elevenLabsService.isAvailable()) {
      return res.status(503).json({ error: 'ElevenLabs not available' });
    }

    const voices = await elevenLabsService.getVoices();
    res.json({ voices });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
