import express from 'express';
import { psychologistService } from '../services/PsychologistService.js';

const router = express.Router();

/**
 * GET /api/psychologists
 * Get list of available psychologists
 */
router.get('/', async (req, res) => {
  try {
    const { specialization, language } = req.query;

    const psychologists = await psychologistService.findPsychologists(
      specialization as string | undefined,
      language as string | undefined
    );

    res.json({ psychologists });
  } catch (error: any) {
    console.error('Error fetching psychologists:', error);
    res.status(500).json({ error: 'Failed to fetch psychologists' });
  }
});

/**
 * GET /api/psychologists/:id
 * Get psychologist details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const psychologist = await psychologistService.getPsychologistById(id);

    if (!psychologist) {
      return res.status(404).json({ error: 'Psychologist not found' });
    }

    res.json(psychologist);
  } catch (error: any) {
    console.error('Error fetching psychologist:', error);
    res.status(500).json({ error: 'Failed to fetch psychologist' });
  }
});

/**
 * POST /api/psychologists/:id/appointments
 * Book appointment with psychologist
 */
router.post('/:id/appointments', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, sessionId, preferredDate, notes } = req.body;

    if (!userId || !sessionId) {
      return res.status(400).json({ error: 'userId and sessionId are required' });
    }

    const appointment = await psychologistService.bookAppointment(
      id,
      userId,
      sessionId,
      preferredDate ? new Date(preferredDate) : undefined,
      notes
    );

    res.status(201).json(appointment);
  } catch (error: any) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: error.message || 'Failed to book appointment' });
  }
});

/**
 * GET /api/psychologists/:id/availability
 * Get psychologist availability
 */
router.get('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const psychologist = await psychologistService.getPsychologistById(id);

    if (!psychologist) {
      return res.status(404).json({ error: 'Psychologist not found' });
    }

    res.json({
      available: psychologist.available,
      nextAvailable: psychologist.nextAvailable
    });
  } catch (error: any) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

export default router;
