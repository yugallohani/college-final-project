import express from 'express';
import multer from 'multer';
import { whisperService } from '../services/WhisperService.js';

const router = express.Router();

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm', 'audio/ogg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio format. Supported: WAV, MP3, WebM, OGG'));
    }
  }
});

/**
 * POST /api/speech/transcribe
 * Transcribe audio to text
 */
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const { language = 'en' } = req.body;

    const transcription = await whisperService.transcribe(
      req.file.buffer,
      language
    );

    res.json({
      text: transcription,
      language
    });
  } catch (error: any) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: error.message || 'Transcription failed' });
  }
});

/**
 * GET /api/speech/status
 * Check if speech service is available
 */
router.get('/status', async (req, res) => {
  try {
    const available = await whisperService.checkAvailability();
    res.json({
      available,
      service: 'HuggingFace Whisper',
      status: available ? 'online' : 'offline'
    });
  } catch (error: any) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check service status' });
  }
});

export default router;
