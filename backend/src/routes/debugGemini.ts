import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

/**
 * POST /api/debug-gemini
 * Test Gemini API directly
 */
router.post('/', async (req, res) => {
  try {
    const { userResponse = "Several days" } = req.body;
    
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GOOGLE_GEMINI_API_KEY not configured' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are Dr. Sarah, a clinical psychologist conducting a PHQ-9 depression screening.

CURRENT QUESTION: "Over the last 2 weeks, how often have you been bothered by: Little interest or pleasure in doing things?"

SCORING OPTIONS:
0: Not at all
1: Several days
2: More than half the days
3: Nearly every day

PATIENT'S RESPONSE: "${userResponse}"

CRITICAL SCORING RULES:
- "Not at all" / "Never" / "No" = SCORE: 0
- "Several days" / "Sometimes" / "A few days" / "Occasionally" = SCORE: 1  
- "More than half the days" / "Most days" / "Often" / "Frequently" = SCORE: 2
- "Nearly every day" / "Every day" / "Almost daily" / "All the time" = SCORE: 3

RESPOND IN THIS EXACT FORMAT:
SCORE: [number 0-3]
SENTIMENT: [positive/neutral/negative]
CRISIS: [yes/no]
ANALYSIS: [brief clinical note]
RESPONSE: [Natural response with next question]`;

    console.log('🚀 Testing Gemini with prompt:', prompt);
    console.log('📝 User response:', userResponse);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('🤖 RAW GEMINI RESPONSE:', text);

    // Parse the response
    const scoreMatch = text.match(/SCORE:\s*(\d+)/);
    const sentimentMatch = text.match(/SENTIMENT:\s*(positive|neutral|negative)/i);
    const crisisMatch = text.match(/CRISIS:\s*(yes|no)/i);
    const analysisMatch = text.match(/ANALYSIS:\s*(.+?)(?=RESPONSE:|$)/s);
    const responseMatch = text.match(/RESPONSE:\s*(.+)/s);

    const parsedData = {
      rawResponse: text,
      parsed: {
        score: scoreMatch ? parseInt(scoreMatch[1]) : null,
        sentiment: sentimentMatch ? sentimentMatch[1].toLowerCase() : null,
        crisis: crisisMatch ? crisisMatch[1].toLowerCase() === 'yes' : null,
        analysis: analysisMatch ? analysisMatch[1].trim() : null,
        naturalResponse: responseMatch ? responseMatch[1].trim() : null
      }
    };

    console.log('✅ PARSED DATA:', parsedData.parsed);

    res.json({
      success: true,
      userResponse,
      ...parsedData
    });

  } catch (error: any) {
    console.error('❌ Error testing Gemini:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to test Gemini',
      details: error.toString()
    });
  }
});

export default router;