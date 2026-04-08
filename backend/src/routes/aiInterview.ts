import express from 'express';
import { aiInterviewService } from '../services/AIInterviewService.js';
import { testAdministratorService } from '../services/TestAdministratorService.js';
import { PHQ9_QUESTIONS, GAD7_QUESTIONS, PHQ9_Q9_CRISIS_THRESHOLD } from '../constants/tests.js';

const router = express.Router();

/**
 * POST /api/ai-interview/start
 * Initialize AI interview session
 */
router.post('/start', async (req, res) => {
  try {
    const { sessionId, assessmentType } = req.body;

    if (!sessionId || !assessmentType) {
      return res.status(400).json({ error: 'sessionId and assessmentType are required' });
    }

    if (!['phq9', 'gad7', 'stress', 'general'].includes(assessmentType)) {
      return res.status(400).json({ error: 'Invalid assessment type' });
    }

    // Get questions for this assessment
    let questions: any[] = [];
    let totalQuestions = 0;

    switch (assessmentType) {
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
        totalQuestions = questions.length;
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
        totalQuestions = questions.length;
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
        totalQuestions = questions.length;
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
        totalQuestions = questions.length;
        break;
    }

    // Initialize the AI interview
    aiInterviewService.initializeInterview(sessionId, assessmentType as any, totalQuestions);

    // Get introduction
    const introduction = await aiInterviewService.getIntroduction(assessmentType);

    // Get first question
    const firstQuestion = questions[0];
    const naturalFirstQuestion = aiInterviewService.formatQuestionNaturally(
      firstQuestion.text,
      1,
      true
    );

    res.json({
      introduction,
      firstQuestion: {
        ...firstQuestion,
        naturalText: naturalFirstQuestion
      },
      totalQuestions,
      message: 'AI interview initialized successfully'
    });
  } catch (error: any) {
    console.error('Error starting AI interview:', error);
    res.status(500).json({ error: error.message || 'Failed to start AI interview' });
  }
});

/**
 * POST /api/ai-interview/questions
 * Return all questions for an assessment type (used to pre-load on frontend)
 */
router.post('/questions', (req, res) => {
  const { assessmentType } = req.body;
  if (!assessmentType) return res.status(400).json({ error: 'assessmentType required' });

  const qMap: Record<string, any[]> = {
    phq9: PHQ9_QUESTIONS.map(q => ({
      questionId: q.order,
      text: `Over the last 2 weeks, how often have you been bothered by: ${q.text}?`,
      options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
    })),
    gad7: GAD7_QUESTIONS.map(q => ({
      questionId: q.order,
      text: `Over the last 2 weeks, how often have you been bothered by: ${q.text}?`,
      options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
    })),
    stress: [
      { questionId: 1, text: 'How often have you felt overwhelmed by stress?', options: ['Never', 'Rarely', 'Sometimes', 'Often'] },
      { questionId: 2, text: 'How often have you felt unable to control important things in your life?', options: ['Never', 'Rarely', 'Sometimes', 'Often'] },
      { questionId: 3, text: 'How often have you felt nervous or stressed?', options: ['Never', 'Rarely', 'Sometimes', 'Often'] },
      { questionId: 4, text: 'How often have you felt confident about your ability to handle personal problems?', options: ['Never', 'Rarely', 'Sometimes', 'Often'] },
      { questionId: 5, text: 'How often have you felt that things were going your way?', options: ['Never', 'Rarely', 'Sometimes', 'Often'] },
      { questionId: 6, text: 'How often have you found that you could not cope with all the things you had to do?', options: ['Never', 'Rarely', 'Sometimes', 'Often'] },
      { questionId: 7, text: 'How often have you been able to control irritations in your life?', options: ['Never', 'Rarely', 'Sometimes', 'Often'] },
      { questionId: 8, text: 'How often have you felt that you were on top of things?', options: ['Never', 'Rarely', 'Sometimes', 'Often'] },
    ],
    general: [
      { questionId: 1, text: 'How would you rate your overall mood over the past week?', options: ['Very poor', 'Poor', 'Fair', 'Good', 'Excellent'] },
      { questionId: 2, text: 'How satisfied are you with your sleep quality?', options: ['Very dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very satisfied'] },
      { questionId: 3, text: 'How often do you feel energized and motivated?', options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] },
      { questionId: 4, text: 'How satisfied are you with your relationships?', options: ['Very dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very satisfied'] },
      { questionId: 5, text: 'How well can you concentrate on tasks?', options: ['Very poorly', 'Poorly', 'Moderately', 'Well', 'Very well'] },
      { questionId: 6, text: 'How often do you engage in activities you enjoy?', options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] },
      { questionId: 7, text: 'How would you rate your stress levels?', options: ['Very high', 'High', 'Moderate', 'Low', 'Very low'] },
      { questionId: 8, text: 'How hopeful do you feel about the future?', options: ['Not at all', 'Slightly', 'Moderately', 'Very', 'Extremely'] },
    ],
  };

  const questions = qMap[assessmentType];
  if (!questions) return res.status(400).json({ error: 'Invalid assessment type' });
  res.json({ questions });
});

/**
 * POST /api/ai-interview/process-response
 * Process user's voice response with STRUCTURED assessment engine
 * The backend controls which questions are asked - AI only makes it natural
 */
router.post('/process-response', async (req, res) => {
  try {
    const { sessionId, userResponse, questionId, assessmentType, voiceAnalysis } = req.body;

    if (!sessionId || !userResponse || questionId === undefined || !assessmentType) {
      return res.status(400).json({ 
        error: 'sessionId, userResponse, questionId, and assessmentType are required' 
      });
    }
    // ASSESSMENT ENGINE: Get predefined questions (clinically validated)
    let questions: any[] = [];

    switch (assessmentType) {
      case 'phq9':
        questions = PHQ9_QUESTIONS.map(q => ({
          questionId: q.order,
          text: `Over the last 2 weeks, how often have you been bothered by: ${q.text}?`,
          options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
        }));
        break;

      case 'gad7':
        questions = GAD7_QUESTIONS.map(q => ({
          questionId: q.order,
          text: `Over the last 2 weeks, how often have you been bothered by: ${q.text}?`,
          options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
        }));
        break;

      case 'stress':
        questions = [
          { questionId: 1, text: 'How often have you felt overwhelmed by stress?', options: ['Never', 'Rarely', 'Sometimes', 'Often'] },
          { questionId: 2, text: 'How often have you felt unable to control important things in your life?', options: ['Never', 'Rarely', 'Sometimes', 'Often'] },
          { questionId: 3, text: 'How often have you felt nervous or stressed?', options: ['Never', 'Rarely', 'Sometimes', 'Often'] },
          { questionId: 4, text: 'How often have you felt confident about your ability to handle personal problems?', options: ['Never', 'Rarely', 'Sometimes', 'Often'] },
          { questionId: 5, text: 'How often have you felt that things were going your way?', options: ['Never', 'Rarely', 'Sometimes', 'Often'] },
          { questionId: 6, text: 'How often have you found that you could not cope with all the things you had to do?', options: ['Never', 'Rarely', 'Sometimes', 'Often'] },
          { questionId: 7, text: 'How often have you been able to control irritations in your life?', options: ['Never', 'Rarely', 'Sometimes', 'Often'] },
          { questionId: 8, text: 'How often have you felt that you were on top of things?', options: ['Never', 'Rarely', 'Sometimes', 'Often'] }
        ];
        break;

      case 'general':
        questions = [
          { questionId: 1, text: 'How would you rate your overall mood over the past week?', options: ['Very poor', 'Poor', 'Fair', 'Good', 'Excellent'] },
          { questionId: 2, text: 'How satisfied are you with your sleep quality?', options: ['Very dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very satisfied'] },
          { questionId: 3, text: 'How often do you feel energized and motivated?', options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] },
          { questionId: 4, text: 'How satisfied are you with your relationships?', options: ['Very dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very satisfied'] },
          { questionId: 5, text: 'How well can you concentrate on tasks?', options: ['Very poorly', 'Poorly', 'Moderately', 'Well', 'Very well'] },
          { questionId: 6, text: 'How often do you engage in activities you enjoy?', options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] },
          { questionId: 7, text: 'How would you rate your stress levels?', options: ['Very high', 'High', 'Moderate', 'Low', 'Very low'] },
          { questionId: 8, text: 'How hopeful do you feel about the future?', options: ['Not at all', 'Slightly', 'Moderately', 'Very', 'Extremely'] }
        ];
        break;
    }

    // ASSESSMENT ENGINE: Get current question (controlled by backend, not AI)
    const currentQuestion = questions.find(q => q.questionId === questionId);
    if (!currentQuestion) {
      return res.status(400).json({ error: 'Invalid question ID' });
    }

    const totalQuestions = questions.length;
    const isLastQuestion = questionId >= totalQuestions;
    
    // ASSESSMENT ENGINE: Determine next question (controlled by backend)
    // questionId is 1-based, but array is 0-based, so questions[questionId] gives us the NEXT question
    const nextQuestion = !isLastQuestion ? questions[questionId] : null;
    
    console.log('🔍 Backend Question Logic:');
    console.log('   Current questionId:', questionId);
    console.log('   Total questions:', totalQuestions);
    console.log('   Is last question:', isLastQuestion);
    console.log('   Next question index:', questionId);
    console.log('   Next question:', nextQuestion);

    // AI LAYER: Generate conversational response (AI only makes it natural)
    console.log('🤖 Calling AI service to generate conversational response...');
    console.log('   User response:', userResponse);
    console.log('   Current question:', currentQuestion.text);
    console.log('   Next question:', nextQuestion?.text);
    
    const result = await aiInterviewService.generateConversationalResponse(
      sessionId,
      userResponse,
      currentQuestion.text,
      currentQuestion.options,
      nextQuestion?.text,
      isLastQuestion,
      questionId,
      totalQuestions,
      voiceAnalysis ?? null
    );

    // HuggingFace emotion detection (runs in parallel, non-blocking)
    let emotionData = { emotion: 'neutral', intensity: 50, valence: 'neutral', tone: 'Reflective' };
    try {
      const { emotionDetectionService } = await import('../services/EmotionDetectionService.js');
      const hfEmotion = await emotionDetectionService.detectEmotions(userResponse);
      const toneMap: Record<string, string> = {
        joy: 'Upbeat', sadness: 'Vulnerable', anger: 'Tense',
        fear: 'Anxious', surprise: 'Alert', neutral: 'Composed'
      };
      emotionData = {
        emotion: hfEmotion.emotion,
        intensity: Math.round(hfEmotion.intensity),
        valence: hfEmotion.valence,
        tone: toneMap[hfEmotion.emotion] || 'Reflective'
      };
      console.log('🧠 HuggingFace emotion:', emotionData);
    } catch (e) {
      console.warn('HF emotion skipped (using fallback)');
    }
    
    console.log('✅ AI service returned:');
    console.log('   Score:', result.score);
    console.log('   Sentiment:', result.sentiment);
    console.log('   Natural Response:', result.naturalResponse);
    console.log('   Natural Response Length:', result.naturalResponse.length);
    console.log('   Crisis Detected:', result.crisisDetected);

    // CRISIS DETECTION: Handle self-harm/suicide risk immediately
    // CRITICAL: PHQ-9 Q9 - Any score ≥ 1 is HIGH RISK and must be flagged
    if (result.crisisDetected) {
      console.log('🚨 CRISIS DETECTED:', { sessionId, questionId, userResponse, score: result.score });
      
      // Flag session for immediate review and doctor notification
      const isHighRiskPHQ9Q9 = assessmentType === 'phq9' && questionId === 9 && result.score >= PHQ9_Q9_CRISIS_THRESHOLD;
      
      if (isHighRiskPHQ9Q9) {
        console.log('🚨 HIGH RISK PHQ-9 Q9 - Score ≥ 1 on suicide/self-harm question');
        // TODO: Send immediate alert to crisis team
        // TODO: Flag report as HIGH RISK for doctor review
        // TODO: Log incident in crisis database
      }
      
      return res.json({
        analysis: {
          score: result.score,
          sentiment: result.sentiment,
          note: result.analysis,
          highRisk: isHighRiskPHQ9Q9,
          crisisType: isHighRiskPHQ9Q9 ? 'PHQ9_Q9_HIGH_RISK' : 'GENERAL_CRISIS'
        },
        naturalResponse: result.naturalResponse,
        crisisDetected: true,
        crisisMessage: "I'm really concerned about what you've shared. Your safety is the most important thing right now. I want to make sure you have immediate support.",
        crisisResources: {
          us: { name: 'National Suicide Prevention Lifeline', number: '988', available: '24/7' },
          india: { name: 'AASRA', number: '91-22-27546669', available: '24/7' },
          international: { name: 'Befrienders Worldwide', website: 'befrienders.org' }
        },
        nextQuestion: null,
        isComplete: true
      });
    }

    // Save the score to database (ASSESSMENT ENGINE controls scoring)
    const questionIdStr = `${assessmentType}_q${questionId}`;
    await testAdministratorService.recordResponse(sessionId, questionIdStr, result.score);

    // ASSESSMENT ENGINE: Move to next question (controlled by backend)
    const hasNext = aiInterviewService.moveToNextQuestion(sessionId);

    const responseData = {
      analysis: {
        score: result.score,
        sentiment: result.sentiment,
        note: result.analysis
      },
      naturalResponse: result.naturalResponse,
      crisisDetected: false,
      emotionData,
      nextQuestion: nextQuestion ? {
        ...nextQuestion,
        naturalText: nextQuestion.text
      } : null,
      closingMessage: isLastQuestion ? aiInterviewService.getClosingMessage() : null,
      isComplete: !hasNext
    };
    
    console.log('📤 Sending response to frontend:');
    console.log('   Natural Response:', responseData.naturalResponse);
    console.log('   Next Question:', responseData.nextQuestion);
    console.log('   Next Question ID:', responseData.nextQuestion?.questionId);
    console.log('   Next Question Text:', responseData.nextQuestion?.text);
    console.log('   Is Complete:', responseData.isComplete);
    console.log('   Full response:', JSON.stringify(responseData, null, 2));

    res.json(responseData);
  } catch (error: any) {
    console.error('Error processing response:', error);
    res.status(500).json({ error: error.message || 'Failed to process response' });
  }
});

/**
 * POST /api/ai-interview/complete
 * Complete the assessment and generate clinical report
 */
router.post('/complete', async (req, res) => {
  try {
    const { sessionId, assessmentType } = req.body;

    if (!sessionId || !assessmentType) {
      return res.status(400).json({ error: 'sessionId and assessmentType are required' });
    }

    // Get all responses and calculate score
    const responses = aiInterviewService.getResponses(sessionId);
    const totalScore = responses.reduce((sum, r) => sum + r.score, 0);

    // Generate AI summary
    const summary = await aiInterviewService.generateSummary(
      sessionId,
      assessmentType,
      totalScore
    );

    // Generate clinical report
    const { clinicalReportService } = await import('../services/ClinicalReportService.js');
    const clinicalReport = await clinicalReportService.generateClinicalReport(
      sessionId,
      assessmentType as 'phq9' | 'gad7',
      responses,
      [], // conversation history - could be enhanced
      'Anonymous Patient' // could get from session
    );

    // Clean up session
    aiInterviewService.cleanupSession(sessionId);

    res.json({
      totalScore,
      summary,
      clinicalReport,
      message: 'Assessment completed successfully'
    });
  } catch (error: any) {
    console.error('Error completing assessment:', error);
    res.status(500).json({ error: error.message || 'Failed to complete assessment' });
  }
});

export default router;
