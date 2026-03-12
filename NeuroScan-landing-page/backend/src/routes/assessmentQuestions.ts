import express from 'express';
import { PHQ9_QUESTIONS, GAD7_QUESTIONS } from '../constants/tests.js';

const router = express.Router();

/**
 * GET /api/assessment/questions/:type
 * Get questions for a specific assessment type
 */
router.get('/:type', (req, res) => {
  try {
    const { type } = req.params;

    let questions: any[] = [];

    switch (type) {
      case 'phq9':
        questions = PHQ9_QUESTIONS.map(q => ({
          questionId: q.order,
          text: `Over the last 2 weeks, how often have you been bothered by: ${q.text}?`,
          options: [
            'Not at all',
            'Several days',
            'More than half the days',
            'Nearly every day'
          ]
        }));
        break;

      case 'gad7':
        questions = GAD7_QUESTIONS.map(q => ({
          questionId: q.order,
          text: `Over the last 2 weeks, how often have you been bothered by: ${q.text}?`,
          options: [
            'Not at all',
            'Several days',
            'More than half the days',
            'Nearly every day'
          ]
        }));
        break;

      case 'stress':
        questions = [
          {
            questionId: 1,
            text: 'How often have you felt overwhelmed by stress?',
            options: ['Never', 'Rarely', 'Sometimes', 'Often']
          },
          {
            questionId: 2,
            text: 'How often have you felt unable to control important things in your life?',
            options: ['Never', 'Rarely', 'Sometimes', 'Often']
          },
          {
            questionId: 3,
            text: 'How often have you felt nervous or stressed?',
            options: ['Never', 'Rarely', 'Sometimes', 'Often']
          },
          {
            questionId: 4,
            text: 'How often have you felt confident about your ability to handle personal problems?',
            options: ['Never', 'Rarely', 'Sometimes', 'Often']
          },
          {
            questionId: 5,
            text: 'How often have you felt that things were going your way?',
            options: ['Never', 'Rarely', 'Sometimes', 'Often']
          },
          {
            questionId: 6,
            text: 'How often have you found that you could not cope with all the things you had to do?',
            options: ['Never', 'Rarely', 'Sometimes', 'Often']
          },
          {
            questionId: 7,
            text: 'How often have you been able to control irritations in your life?',
            options: ['Never', 'Rarely', 'Sometimes', 'Often']
          },
          {
            questionId: 8,
            text: 'How often have you felt that you were on top of things?',
            options: ['Never', 'Rarely', 'Sometimes', 'Often']
          }
        ];
        break;

      case 'general':
        questions = [
          {
            questionId: 1,
            text: 'How would you rate your overall mood over the past week?',
            options: ['Very poor', 'Poor', 'Fair', 'Good', 'Excellent']
          },
          {
            questionId: 2,
            text: 'How satisfied are you with your sleep quality?',
            options: ['Very dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very satisfied']
          },
          {
            questionId: 3,
            text: 'How often do you feel energized and motivated?',
            options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always']
          },
          {
            questionId: 4,
            text: 'How satisfied are you with your relationships?',
            options: ['Very dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very satisfied']
          },
          {
            questionId: 5,
            text: 'How well can you concentrate on tasks?',
            options: ['Very poorly', 'Poorly', 'Moderately', 'Well', 'Very well']
          },
          {
            questionId: 6,
            text: 'How often do you engage in activities you enjoy?',
            options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always']
          },
          {
            questionId: 7,
            text: 'How would you rate your stress levels?',
            options: ['Very high', 'High', 'Moderate', 'Low', 'Very low']
          },
          {
            questionId: 8,
            text: 'How hopeful do you feel about the future?',
            options: ['Not at all', 'Slightly', 'Moderately', 'Very', 'Extremely']
          }
        ];
        break;

      default:
        return res.status(400).json({ error: 'Invalid assessment type' });
    }

    res.json({ questions });
  } catch (error: any) {
    console.error('Error getting questions:', error);
    res.status(500).json({ error: 'Failed to get questions' });
  }
});

/**
 * POST /api/assessment/answer
 * Save an answer to a question
 */
router.post('/answer', async (req, res) => {
  try {
    const { sessionId, questionId, answerValue, assessmentType } = req.body;

    if (!sessionId || questionId === undefined || answerValue === undefined || !assessmentType) {
      return res.status(400).json({ 
        error: 'sessionId, questionId, answerValue, and assessmentType are required' 
      });
    }

    // Import dynamically to avoid circular dependencies
    const { testAdministratorService } = await import('../services/TestAdministratorService.js');

    // Save the response
    const questionIdStr = `${assessmentType}_q${questionId}`;
    await testAdministratorService.recordResponse(sessionId, questionIdStr, answerValue);

    res.json({ 
      message: 'Answer saved successfully',
      questionId,
      answerValue
    });
  } catch (error: any) {
    console.error('Error saving answer:', error);
    res.status(500).json({ error: error.message || 'Failed to save answer' });
  }
});

/**
 * GET /api/assessment/results/:sessionId
 * Get assessment results
 */
router.get('/results/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Import dynamically
    const { testAdministratorService } = await import('../services/TestAdministratorService.js');
    const { SessionModel } = await import('../models/Session.js');

    const session = await SessionModel.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Determine assessment type based on responses
    let assessmentType = 'general';
    let score = 0;
    let classification = 'minimal';
    let explanation = '';
    let suggestions: string[] = [];

    if (session.phq9Responses.length > 0) {
      assessmentType = 'PHQ-9 Depression Screening';
      score = await testAdministratorService.calculateScore(sessionId, 'phq9');
      classification = testAdministratorService.classifyPHQ9Risk(score);
      
      // Generate explanation based on classification
      if (classification === 'minimal') {
        explanation = 'Your responses suggest minimal depression symptoms. You appear to be managing well emotionally.';
        suggestions = [
          'Continue maintaining healthy lifestyle habits',
          'Stay connected with friends and family',
          'Practice stress management techniques'
        ];
      } else if (classification === 'mild') {
        explanation = 'Your responses indicate mild depression symptoms. These symptoms may be manageable with self-care and support.';
        suggestions = [
          'Consider talking to a counselor or therapist',
          'Engage in regular physical activity',
          'Maintain a consistent sleep schedule',
          'Practice mindfulness or meditation'
        ];
      } else if (classification === 'moderate') {
        explanation = 'Your responses suggest moderate depression symptoms. Professional support would be beneficial.';
        suggestions = [
          'Schedule an appointment with a mental health professional',
          'Consider therapy or counseling',
          'Reach out to trusted friends or family members',
          'Avoid isolation and maintain social connections'
        ];
      } else {
        explanation = 'Your responses indicate significant depression symptoms. Professional help is strongly recommended.';
        suggestions = [
          'Seek professional mental health support immediately',
          'Contact a therapist or psychiatrist',
          'Consider medication evaluation if recommended',
          'Reach out to crisis support if needed'
        ];
      }
    } else if (session.gad7Responses.length > 0) {
      assessmentType = 'GAD-7 Anxiety Assessment';
      score = await testAdministratorService.calculateScore(sessionId, 'gad7');
      classification = testAdministratorService.classifyGAD7Risk(score);
      
      if (classification === 'minimal') {
        explanation = 'Your responses suggest minimal anxiety symptoms. You appear to be managing stress well.';
        suggestions = [
          'Continue current coping strategies',
          'Practice relaxation techniques',
          'Maintain work-life balance'
        ];
      } else if (classification === 'mild') {
        explanation = 'Your responses indicate mild anxiety symptoms. These may be manageable with lifestyle adjustments.';
        suggestions = [
          'Practice deep breathing exercises',
          'Try progressive muscle relaxation',
          'Limit caffeine intake',
          'Establish a regular exercise routine'
        ];
      } else if (classification === 'moderate') {
        explanation = 'Your responses suggest moderate anxiety symptoms. Professional guidance would be helpful.';
        suggestions = [
          'Consider cognitive behavioral therapy (CBT)',
          'Consult with a mental health professional',
          'Learn anxiety management techniques',
          'Practice mindfulness meditation'
        ];
      } else {
        explanation = 'Your responses indicate significant anxiety symptoms. Professional support is recommended.';
        suggestions = [
          'Seek professional mental health support',
          'Consider therapy specializing in anxiety',
          'Discuss treatment options with a healthcare provider',
          'Join a support group for anxiety'
        ];
      }
    } else {
      // General or stress assessment
      assessmentType = 'General Wellness Assessment';
      score = 0; // Calculate based on responses
      classification = 'Good';
      explanation = 'Your responses have been recorded. A comprehensive analysis will be available in your dashboard.';
      suggestions = [
        'Continue monitoring your mental health',
        'Practice self-care regularly',
        'Maintain healthy lifestyle habits'
      ];
    }

    res.json({
      score,
      classification,
      assessmentType,
      explanation,
      suggestions
    });
  } catch (error: any) {
    console.error('Error getting results:', error);
    res.status(500).json({ error: 'Failed to get results' });
  }
});

export default router;
