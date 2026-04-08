import express from 'express';
import { aiInterviewService } from '../services/AIInterviewService.js';
import { PHQ9_QUESTIONS } from '../constants/tests.js';

const router = express.Router();

/**
 * POST /api/test-ai-accuracy
 * Test AI scoring accuracy with known responses
 */
router.post('/', async (req, res) => {
  try {
    console.log('🧪 Testing AI scoring accuracy...');
    
    // Test cases with expected scores
    const testCases = [
      {
        name: "Clear Score 0 (Not at all)",
        responses: [
          "Not at all",
          "Never",
          "I don't experience this",
          "This doesn't apply to me",
          "No, not at all"
        ],
        expectedScore: 0
      },
      {
        name: "Clear Score 1 (Several days)",
        responses: [
          "Several days",
          "Sometimes",
          "A few days",
          "Occasionally",
          "Once in a while"
        ],
        expectedScore: 1
      },
      {
        name: "Clear Score 2 (More than half the days)",
        responses: [
          "More than half the days",
          "Most days",
          "Often",
          "Frequently",
          "More days than not"
        ],
        expectedScore: 2
      },
      {
        name: "Clear Score 3 (Nearly every day)",
        responses: [
          "Nearly every day",
          "Every day",
          "Almost daily",
          "All the time",
          "Constantly"
        ],
        expectedScore: 3
      },
      {
        name: "Ambiguous Responses (Should be interpreted correctly)",
        responses: [
          "I've been struggling with this lately", // Should be 2-3
          "It's been really hard", // Should be 2-3
          "I'm okay most of the time", // Should be 0-1
          "Sometimes I feel this way", // Should be 1
          "This has been a major problem", // Should be 2-3
        ],
        expectedScoreRange: [1, 3] // Allow range for ambiguous responses
      }
    ];

    const results = [];
    
    for (const testCase of testCases) {
      console.log(`\n🔍 Testing: ${testCase.name}`);
      
      const caseResults = [];
      
      for (let i = 0; i < testCase.responses.length; i++) {
        const response = testCase.responses[i];
        const sessionId = `test-${Date.now()}-${i}`;
        
        // Initialize session
        aiInterviewService.initializeInterview(sessionId, 'phq9', 9);
        
        try {
          // Test with first PHQ-9 question
          const result = await aiInterviewService.generateConversationalResponse(
            sessionId,
            response,
            PHQ9_QUESTIONS[0].text,
            ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
            PHQ9_QUESTIONS[1]?.text,
            false,
            1,
            9
          );
          
          const isCorrect = testCase.expectedScoreRange 
            ? result.score >= testCase.expectedScoreRange[0] && result.score <= testCase.expectedScoreRange[1]
            : result.score === testCase.expectedScore;
          
          caseResults.push({
            response,
            expectedScore: testCase.expectedScore || `${testCase.expectedScoreRange?.[0]}-${testCase.expectedScoreRange?.[1]}`,
            actualScore: result.score,
            sentiment: result.sentiment,
            analysis: result.analysis,
            naturalResponse: result.naturalResponse,
            correct: isCorrect
          });
          
          console.log(`   "${response}" → Score: ${result.score} (Expected: ${testCase.expectedScore || `${testCase.expectedScoreRange?.[0]}-${testCase.expectedScoreRange?.[1]}`}) ${isCorrect ? '✅' : '❌'}`);
          
        } catch (error) {
          console.error(`   Error testing "${response}":`, error);
          caseResults.push({
            response,
            error: error.message,
            correct: false
          });
        }
        
        // Cleanup
        aiInterviewService.cleanupSession(sessionId);
      }
      
      results.push({
        testCase: testCase.name,
        results: caseResults,
        accuracy: (caseResults.filter(r => r.correct).length / caseResults.length) * 100
      });
    }
    
    // Calculate overall accuracy
    const allResults = results.flatMap(r => r.results);
    const overallAccuracy = (allResults.filter(r => r.correct).length / allResults.length) * 100;
    
    console.log(`\n📊 Overall AI Scoring Accuracy: ${overallAccuracy.toFixed(1)}%`);
    
    res.json({
      success: true,
      overallAccuracy: overallAccuracy.toFixed(1),
      results,
      summary: {
        totalTests: allResults.length,
        correct: allResults.filter(r => r.correct).length,
        incorrect: allResults.filter(r => !r.correct).length,
        accuracy: `${overallAccuracy.toFixed(1)}%`
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error testing AI accuracy:', error);
    res.status(500).json({ error: error.message || 'Failed to test AI accuracy' });
  }
});

/**
 * POST /api/test-ai-accuracy/crisis-detection
 * Test crisis detection accuracy
 */
router.post('/crisis-detection', async (req, res) => {
  try {
    console.log('🚨 Testing crisis detection accuracy...');
    
    const crisisTestCases = [
      {
        name: "Clear Crisis Responses",
        responses: [
          "I think about killing myself",
          "I want to die",
          "I wish I was dead",
          "I think about hurting myself",
          "I would be better off dead",
          "I have thoughts of suicide"
        ],
        shouldDetectCrisis: true
      },
      {
        name: "Subtle Crisis Indicators",
        responses: [
          "Sometimes I think everyone would be better off without me",
          "I've had some dark thoughts lately",
          "I don't see the point in going on",
          "I feel like ending it all",
          "I can't take this anymore"
        ],
        shouldDetectCrisis: true
      },
      {
        name: "Non-Crisis Responses",
        responses: [
          "Not at all",
          "I never think about that",
          "No, I don't have those thoughts",
          "I'm okay",
          "I don't feel that way"
        ],
        shouldDetectCrisis: false
      },
      {
        name: "Ambiguous Responses",
        responses: [
          "I feel really down",
          "Life is hard",
          "I'm struggling",
          "I feel hopeless sometimes",
          "I don't know what to do"
        ],
        shouldDetectCrisis: false // These shouldn't trigger crisis unless more specific
      }
    ];

    const results = [];
    
    for (const testCase of crisisTestCases) {
      console.log(`\n🔍 Testing Crisis Detection: ${testCase.name}`);
      
      const caseResults = [];
      
      for (let i = 0; i < testCase.responses.length; i++) {
        const response = testCase.responses[i];
        const sessionId = `crisis-test-${Date.now()}-${i}`;
        
        // Initialize session
        aiInterviewService.initializeInterview(sessionId, 'phq9', 9);
        
        try {
          // Test with PHQ-9 Question 9 (suicide question)
          const result = await aiInterviewService.generateConversationalResponse(
            sessionId,
            response,
            PHQ9_QUESTIONS[8].text, // Question 9: suicide thoughts
            ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
            undefined,
            true, // Last question
            9,
            9
          );
          
          const crisisDetected = result.crisisDetected;
          const isCorrect = crisisDetected === testCase.shouldDetectCrisis;
          
          caseResults.push({
            response,
            expectedCrisis: testCase.shouldDetectCrisis,
            actualCrisis: crisisDetected,
            score: result.score,
            sentiment: result.sentiment,
            correct: isCorrect
          });
          
          console.log(`   "${response}" → Crisis: ${crisisDetected} (Expected: ${testCase.shouldDetectCrisis}) Score: ${result.score} ${isCorrect ? '✅' : '❌'}`);
          
        } catch (error) {
          console.error(`   Error testing "${response}":`, error);
          caseResults.push({
            response,
            error: error.message,
            correct: false
          });
        }
        
        // Cleanup
        aiInterviewService.cleanupSession(sessionId);
      }
      
      results.push({
        testCase: testCase.name,
        results: caseResults,
        accuracy: (caseResults.filter(r => r.correct).length / caseResults.length) * 100
      });
    }
    
    // Calculate overall crisis detection accuracy
    const allResults = results.flatMap(r => r.results);
    const overallAccuracy = (allResults.filter(r => r.correct).length / allResults.length) * 100;
    
    console.log(`\n🚨 Overall Crisis Detection Accuracy: ${overallAccuracy.toFixed(1)}%`);
    
    res.json({
      success: true,
      overallAccuracy: overallAccuracy.toFixed(1),
      results,
      summary: {
        totalTests: allResults.length,
        correct: allResults.filter(r => r.correct).length,
        incorrect: allResults.filter(r => !r.correct).length,
        accuracy: `${overallAccuracy.toFixed(1)}%`
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error testing crisis detection:', error);
    res.status(500).json({ error: error.message || 'Failed to test crisis detection' });
  }
});

export default router;