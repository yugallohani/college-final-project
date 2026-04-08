import { GoogleGenerativeAI } from '@google/generative-ai';
import { PHQ9_Q9_CRISIS_THRESHOLD } from '../constants/tests.js';

/**
 * AI Interview Service
 * Handles natural conversation flow for clinical assessments using Gemini
 */

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AssessmentContext {
  type: 'phq9' | 'gad7' | 'stress' | 'general';
  currentQuestionIndex: number;
  totalQuestions: number;
  conversationHistory: ConversationMessage[];
  responses: Array<{ questionId: number; userResponse: string; extractedScore?: number }>;
}

export class AIInterviewService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private contexts: Map<string, AssessmentContext> = new Map();

  constructor() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    // Use Gemini 2.5 Flash (fast, capable, and available in free tier)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  /**
   * Initialize a new interview session
   */
  initializeInterview(
    sessionId: string,
    assessmentType: 'phq9' | 'gad7' | 'stress' | 'general',
    totalQuestions: number
  ): void {
    this.contexts.set(sessionId, {
      type: assessmentType,
      currentQuestionIndex: 0,
      totalQuestions,
      conversationHistory: [],
      responses: []
    });
  }

  /**
   * Generate natural introduction for the assessment using Gemini AI
   */
  async getIntroduction(assessmentType: string): Promise<string> {
    try {
      const assessmentInfo: Record<string, string> = {
        phq9: 'PHQ-9 depression screening',
        gad7: 'GAD-7 anxiety assessment',
        stress: 'stress level assessment',
        general: 'general mental wellness check'
      };

      const prompt = `You are Dr. Sarah, a warm and empathetic clinical psychologist. Generate a brief, natural introduction (2-3 sentences max) for a ${assessmentInfo[assessmentType] || 'mental health assessment'}.

Requirements:
- Keep it SHORT (under 40 words)
- Sound natural and conversational, not scripted
- Be warm but professional
- Mention it's confidential
- Vary the wording each time (don't be repetitive)

Example style: "Hi, I'm Dr. Sarah. Today we'll do a quick depression screening together - it'll take about 5 minutes. Everything you share is confidential, so please answer honestly."

Generate a similar but DIFFERENT introduction now:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const intro = response.text().trim();
      
      console.log('✅ Generated dynamic introduction:', intro);
      return intro;
    } catch (error) {
      console.warn('⚠️ Gemini unavailable for intro, using fallback');
      // Short fallback intros
      const fallbacks: Record<string, string> = {
        phq9: "Hi, I'm Dr. Sarah. We'll do a quick depression screening today - about 5 minutes. Everything is confidential, so please answer honestly.",
        gad7: "Hello, I'm Dr. Sarah. Today we'll assess your anxiety levels together. It takes about 5 minutes and is completely confidential.",
        stress: "Hi, I'm Dr. Sarah. We'll evaluate your stress levels today - it'll take about 5 minutes. Your responses are confidential.",
        general: "Hello, I'm Dr. Sarah. We'll do a general wellness check together today. It takes about 5 minutes and everything is confidential."
      };
      
      return fallbacks[assessmentType as keyof typeof fallbacks] || fallbacks.general;
    }
  }

  /**
   * Format question naturally for voice conversation
   */
  formatQuestionNaturally(questionText: string, questionNumber: number, isFirst: boolean): string {
    if (isFirst) {
      return `Let's start with the first question. ${questionText}`;
    }
    
    const transitions = [
      `Now, ${questionText}`,
      `Next question. ${questionText}`,
      `Moving on. ${questionText}`,
      `Alright. ${questionText}`,
      `Thank you. Now, ${questionText}`
    ];
    
    return transitions[Math.floor(Math.random() * transitions.length)];
  }

  /**
   * Generate empathetic acknowledgment
   */
  getAcknowledgment(): string {
    const acknowledgments = [
      "Thank you for sharing that with me.",
      "I appreciate your honesty.",
      "I understand. Thank you.",
      "That's helpful to know.",
      "I hear you. Thank you for telling me.",
      "Thank you. I'm listening.",
      "I appreciate you opening up about that.",
      "Thank you for being so open.",
      "I understand what you're saying."
    ];
    
    return acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
  }

  /**
   * Generate natural conversational response with next question
   * IMPORTANT: The assessment engine controls which question comes next
   * AI only makes the conversation natural and interprets responses
   */
  async generateConversationalResponse(
      sessionId: string,
      userResponse: string,
      currentQuestionText: string,
      currentQuestionOptions: string[],
      nextQuestionText?: string,
      isLastQuestion: boolean = false,
      questionNumber: number = 1,
      totalQuestions: number = 9
    ): Promise<{
      score: number;
      sentiment: 'positive' | 'neutral' | 'negative';
      analysis: string;
      naturalResponse: string;
      crisisDetected: boolean;
    }> {
      const context = this.contexts.get(sessionId);
      if (!context) {
        throw new Error('Session not found');
      }

      console.log('🔄 HYBRID SCORING SYSTEM - Processing response...');
      console.log('   User Response:', userResponse);
      console.log('   Question:', questionNumber);

      // STEP 1: Enhanced Fallback Scoring (Always Available)
      const enhancedScore = this.getEnhancedFallbackScore(userResponse);
      console.log('🎯 Enhanced Fallback Score:', enhancedScore);

      // STEP 2: Crisis Detection (Always Check First)
      const crisisDetected = this.detectCrisis(userResponse, questionNumber, context.type);
      console.log('🚨 Crisis Detection:', crisisDetected);

      // STEP 3: Try Gemini AI (If Available and Needed)
      let aiResult = null;
      const shouldUseAI = this.shouldUseGeminiAI(userResponse, enhancedScore);

      if (shouldUseAI) {
        console.log('🤖 Attempting Gemini AI scoring...');
        aiResult = await this.tryGeminiScoring(
          sessionId, userResponse, currentQuestionText, currentQuestionOptions,
          nextQuestionText, isLastQuestion, questionNumber, totalQuestions, context
        );
      } else {
        console.log('⚡ Using enhanced fallback (exact match found)');
      }

      // STEP 4: Combine Results (Hybrid Approach)
      const finalScore = aiResult?.score ?? enhancedScore.score;
      const sentiment = aiResult?.sentiment ?? enhancedScore.sentiment;
      const analysis = aiResult?.analysis ?? enhancedScore.analysis;
      const naturalResponse = aiResult?.naturalResponse ?? this.generateFallbackResponse(
        userResponse, nextQuestionText, isLastQuestion
      );

      console.log('✅ FINAL HYBRID RESULT:');
      console.log('   Score:', finalScore, '(Source:', aiResult ? 'AI' : 'Enhanced Fallback', ')');
      console.log('   Sentiment:', sentiment);
      console.log('   Crisis:', crisisDetected);

      // STEP 5: Enhanced Crisis Detection for PHQ-9 Q9
      const isPHQ9Question9 = context.type === 'phq9' && questionNumber === 9;
      const isHighRiskPHQ9Q9 = isPHQ9Question9 && finalScore >= PHQ9_Q9_CRISIS_THRESHOLD;
      const finalCrisisDetected = crisisDetected || isHighRiskPHQ9Q9;

      if (finalCrisisDetected) {
        console.log('🚨 CRISIS DETECTED - Flagging for immediate attention');
      }

      // Store the response
      context.responses.push({
        questionId: context.currentQuestionIndex + 1,
        userResponse,
        extractedScore: finalScore
      });

      // Add to conversation history
      context.conversationHistory.push(
        { role: 'assistant', content: currentQuestionText },
        { role: 'user', content: userResponse },
        { role: 'assistant', content: naturalResponse }
      );

      return { 
        score: finalScore, 
        sentiment, 
        analysis, 
        naturalResponse, 
        crisisDetected: finalCrisisDetected 
      };
    }
    /**
     * Enhanced Fallback Scoring with Fuzzy Matching
     */
    private getEnhancedFallbackScore(userResponse: string): {
      score: number;
      sentiment: 'positive' | 'neutral' | 'negative';
      analysis: string;
      confidence: number;
    } {
      const response = userResponse.toLowerCase().trim();

      // Enhanced scoring patterns with fuzzy matching
      const scoringPatterns = {
        0: [
          'not at all', 'never', 'no', 'none', 'not really', 'hardly ever',
          'not bothered', 'doesn\'t apply', 'not experiencing', 'not feeling'
        ],
        1: [
          'several days', 'sometimes', 'a few days', 'occasionally', 'once in a while',
          'rarely', 'now and then', 'from time to time', 'some days'
        ],
        2: [
          'more than half', 'most days', 'often', 'frequently', 'many days',
          'usually', 'more days than not', 'quite often', 'regularly'
        ],
        3: [
          'nearly every day', 'every day', 'almost daily', 'all the time',
          'constantly', 'always', 'daily', 'continuously', 'non-stop'
        ]
      };

      // Exact pattern matching first (highest confidence)
      for (const [scoreStr, patterns] of Object.entries(scoringPatterns)) {
        const score = parseInt(scoreStr);

        for (const pattern of patterns) {
          if (response.includes(pattern)) {
            return {
              score,
              sentiment: score === 0 ? 'positive' : score <= 1 ? 'neutral' : 'negative',
              analysis: `Enhanced fallback scoring: "${pattern}" matched for score ${score}`,
              confidence: 0.9
            };
          }
        }
      }

      // Fuzzy matching for common variations
      if (response.includes('few') || response.includes('little bit') || response.includes('bit')) {
        return { score: 1, sentiment: 'neutral', analysis: 'Fuzzy match: mild symptoms', confidence: 0.7 };
      }

      if (response.includes('lot') || response.includes('much') || response.includes('really') || response.includes('very')) {
        return { score: 2, sentiment: 'negative', analysis: 'Fuzzy match: moderate symptoms', confidence: 0.6 };
      }

      if (response.includes('every') || response.includes('always') || response.includes('constant')) {
        return { score: 3, sentiment: 'negative', analysis: 'Fuzzy match: severe symptoms', confidence: 0.7 };
      }

      // Default for unclear responses
      return {
        score: 1,
        sentiment: 'neutral',
        analysis: 'Ambiguous response - defaulted to mild symptoms',
        confidence: 0.3
      };
    }

    /**
     * Crisis Detection (Always Active)
     */
    /**
       * Crisis Detection (Always Active) - Refined for Better Accuracy
       */
      private detectCrisis(userResponse: string, questionNumber: number, assessmentType: string): boolean {
        const lowerResponse = userResponse.toLowerCase();

        // High-confidence crisis keywords (direct suicidal/self-harm language)
        const highRiskKeywords = [
          'kill myself', 'suicide', 'want to die', 'better off dead', 'end my life',
          'hurt myself', 'self-harm', 'harm myself', 'thoughts of death', 'thoughts of suicide'
        ];

        // Check for high-risk keywords first
        const hasHighRiskKeyword = highRiskKeywords.some(keyword => lowerResponse.includes(keyword));

        if (hasHighRiskKeyword) {
          return true;
        }

        // For PHQ-9 Question 9 specifically, be more sensitive but still precise
        if (assessmentType === 'phq9' && questionNumber === 9) {
          const phq9CrisisKeywords = [
            'ending it', 'better off without me', 'thoughts of dying'
          ];
          return phq9CrisisKeywords.some(keyword => lowerResponse.includes(keyword));
        }

        return false;
      }

    /**
     * Decide whether to use Gemini AI
     */
    private shouldUseGeminiAI(userResponse: string, fallbackResult: any): boolean {
      // Use AI only for ambiguous responses (low confidence fallback)
      if (fallbackResult.confidence < 0.7) {
        return true;
      }

      // Use AI for complex sentences
      if (userResponse.split(' ').length > 5) {
        return true;
      }

      // Skip AI for exact matches (save API calls)
      return false;
    }

    /**
     * Try Gemini AI Scoring (With Error Handling)
     * Scoring and empathy response are now SEPARATE prompts for better quality
     */
    private async tryGeminiScoring(
      sessionId: string, userResponse: string, currentQuestionText: string,
      currentQuestionOptions: string[], nextQuestionText: string | undefined,
      isLastQuestion: boolean, questionNumber: number, totalQuestions: number,
      context: AssessmentContext
    ): Promise<any | null> {
      try {
        const assessmentInfo: Record<string, string> = {
          phq9: 'PHQ-9 depression screening',
          gad7: 'GAD-7 anxiety assessment',
          stress: 'stress level assessment',
          general: 'general mental wellness check'
        };

        // Build conversation history snippet (last 4 exchanges for context)
        const recentHistory = context.conversationHistory.slice(-4)
          .map(m => `${m.role === 'assistant' ? 'Dr. Sarah' : 'Patient'}: ${m.content}`)
          .join('\n');

        // Previous AI replies to avoid repetition
        const previousReplies = context.conversationHistory
          .filter(m => m.role === 'assistant' && !m.content.includes('?'))
          .slice(-3)
          .map(m => m.content.substring(0, 60))
          .join(' | ');

        // PROMPT 1: Structured scoring (fast, deterministic)
        const scoringPrompt = `You are scoring a ${assessmentInfo[context.type]} response.

QUESTION: "${currentQuestionText}"
PATIENT SAID: "${userResponse}"

Score 0-3 where:
0 = Not at all / Never
1 = Several days / Sometimes  
2 = More than half the days / Often
3 = Nearly every day / Always / Constantly

RESPOND IN EXACT FORMAT (nothing else):
SCORE: [0-3]
SENTIMENT: [positive/neutral/negative]
CRISIS: [yes/no]
ANALYSIS: [one sentence]`;

        // PROMPT 2: Context-aware empathy reply (separate, focused)
        const empathyPrompt = `You are Dr. Sarah, a calm and empathetic clinical psychologist.

The patient was asked: "${currentQuestionText}"
The patient responded: "${userResponse}"

Recent conversation:
${recentHistory || 'This is the first response.'}

RULES:
- Respond in EXACTLY 1-2 sentences
- Acknowledge what the patient SPECIFICALLY said — reference their actual words or feelings
- Show genuine empathy — make them feel heard
- DO NOT give advice or diagnose
- DO NOT be generic (no "Thank you for sharing")
- DO NOT repeat these phrases: ${previousReplies || 'none yet'}
- DO NOT ask the next question — just respond to what they said
- Vary your sentence structure and opening words

Examples of GOOD responses:
- "That sounds really exhausting — carrying that kind of weight every day takes a real toll."
- "It's understandable to feel that way, especially when things pile up like that."
- "Feeling okay is actually meaningful — it sounds like you've found some stability."
- "That level of worry sounds genuinely difficult to live with."
- "Losing interest in things you used to enjoy is one of the harder things to deal with."

Now respond to what the patient said:`;

        // Run both prompts in parallel
        const [scoringResult, empathyResult] = await Promise.all([
          this.model.generateContent(scoringPrompt),
          this.model.generateContent({
            contents: [{ role: 'user', parts: [{ text: empathyPrompt }] }],
            generationConfig: { temperature: 0.85, maxOutputTokens: 100 }
          })
        ]);

        const scoringText = (await scoringResult.response).text();
        const empathyText = (await empathyResult.response).text().trim();

        console.log('🤖 Gemini Scoring:', scoringText.substring(0, 150));
        console.log('💬 Gemini Empathy:', empathyText);

        const scoreMatch = scoringText.match(/SCORE:\s*(\d+)/);
        const sentimentMatch = scoringText.match(/SENTIMENT:\s*(positive|neutral|negative)/i);
        const crisisMatch = scoringText.match(/CRISIS:\s*(yes|no)/i);
        const analysisMatch = scoringText.match(/ANALYSIS:\s*(.+)/);

        if (scoreMatch) {
          return {
            score: parseInt(scoreMatch[1]),
            sentiment: sentimentMatch?.[1]?.toLowerCase() || 'neutral',
            crisis: crisisMatch?.[1]?.toLowerCase() === 'yes',
            analysis: analysisMatch?.[1]?.trim() || 'AI analysis completed',
            naturalResponse: empathyText || this.generateFallbackResponse(userResponse, nextQuestionText, isLastQuestion)
          };
        }

        return null;
      } catch (error: any) {
        console.log('⚠️ Gemini API unavailable:', error.message?.includes('quota') ? 'Quota exceeded' : error.message);
        return null;
      }
    }

    /**
     * Generate context-aware fallback response (used when Gemini is unavailable)
     * Reads actual keywords from user response — never generic
     */
    private generateFallbackResponse(userResponse: string, nextQuestionText?: string, isLastQuestion: boolean = false): string {
      const t = userResponse.toLowerCase();

      // Keyword-driven empathy responses
      let empathy = "";

      if (/tired|exhausted|drained|no energy|fatigue/.test(t))
        empathy = "That sounds really draining — feeling that way consistently takes a real toll.";
      else if (/sad|down|low|depressed|hopeless|empty/.test(t))
        empathy = "I'm sorry to hear you've been feeling that way. That kind of heaviness is genuinely hard to carry.";
      else if (/anxious|worried|nervous|panic|fear|scared/.test(t))
        empathy = "That level of worry sounds difficult to live with — it can be really overwhelming.";
      else if (/angry|frustrated|irritated|annoyed/.test(t))
        empathy = "It makes sense to feel frustrated when things feel out of control like that.";
      else if (/sleep|insomnia|can't sleep|waking up/.test(t))
        empathy = "Sleep difficulties can affect everything else — that sounds genuinely exhausting.";
      else if (/not at all|never|no|fine|okay|good|well|great/.test(t))
        empathy = "That's good to hear — it sounds like things have been relatively stable for you.";
      else if (/sometimes|occasionally|a little|bit/.test(t))
        empathy = "It sounds like it comes and goes — that kind of inconsistency can be hard to manage.";
      else if (/always|every day|constantly|all the time/.test(t))
        empathy = "Dealing with that every single day sounds incredibly difficult.";
      else if (/concentrate|focus|can't think|distracted/.test(t))
        empathy = "Difficulty concentrating can make even simple tasks feel overwhelming.";
      else if (/alone|lonely|isolated|no one/.test(t))
        empathy = "Feeling isolated like that is genuinely painful — you're not alone in sharing this.";
      else {
        // Last resort: at least reference the length/nature of their response
        const wordCount = userResponse.trim().split(/\s+/).length;
        if (wordCount <= 3)
          empathy = "I hear you. Even brief answers tell me something important.";
        else
          empathy = "Thank you for explaining that — what you've shared gives me a clearer picture.";
      }

      if (isLastQuestion) {
        return `${empathy} You've done really well completing this assessment.`;
      }

      return empathy;
    }

  /**
   * Move to next question
   */
  moveToNextQuestion(sessionId: string): boolean {
    const context = this.contexts.get(sessionId);
    if (!context) return false;

    context.currentQuestionIndex++;
    return context.currentQuestionIndex < context.totalQuestions;
  }

  /**
   * Get current question index
   */
  getCurrentQuestionIndex(sessionId: string): number {
    const context = this.contexts.get(sessionId);
    return context ? context.currentQuestionIndex : 0;
  }

  /**
   * Check if assessment is complete
   */
  isComplete(sessionId: string): boolean {
    const context = this.contexts.get(sessionId);
    if (!context) return false;
    return context.currentQuestionIndex >= context.totalQuestions;
  }

  /**
   * Generate closing message
   */
  getClosingMessage(): string {
    return "Thank you so much for taking the time to complete this assessment with me today. I know these questions can be difficult to answer, and I really appreciate your openness and honesty. I'm now going to analyze your responses carefully to generate a comprehensive report for you. This will just take a moment.";
  }

  /**
   * Get all responses for scoring
   */
  getResponses(sessionId: string): Array<{ questionId: number; userResponse: string; score: number }> {
    const context = this.contexts.get(sessionId);
    if (!context) return [];

    return context.responses.map(r => ({
      questionId: r.questionId,
      userResponse: r.userResponse,
      score: r.extractedScore || 0
    }));
  }

  /**
   * Get conversation history for clinical report
   */
  getConversationHistory(sessionId: string): Array<{ role: string; content: string }> {
    const context = this.contexts.get(sessionId);
    if (!context) return [];

    return context.conversationHistory;
  }

  /**
   * Generate summary using Gemini
   */
  async generateSummary(
    sessionId: string,
    assessmentType: string,
    totalScore: number
  ): Promise<string> {
    const context = this.contexts.get(sessionId);
    if (!context) {
      throw new Error('Session not found');
    }

    const assessmentInfo: Record<string, string> = {
      phq9: 'PHQ-9 depression screening',
      gad7: 'GAD-7 anxiety assessment',
      stress: 'stress level assessment',
      general: 'general mental wellness check'
    };

    const prompt = `You are a clinical psychologist providing a compassionate summary of a mental health assessment.

Assessment Type: ${assessmentInfo[assessmentType] || assessmentType}
Total Score: ${totalScore}
Number of Questions: ${context.totalQuestions}

Patient Responses:
${context.responses.map((r, idx) => `Q${idx + 1}: ${r.userResponse}`).join('\n')}

Generate a brief, empathetic summary (3-4 sentences) that:
1. Acknowledges the patient's participation
2. Provides a general interpretation of the results
3. Offers hope and next steps
4. Maintains a warm, professional tone

Do not use medical jargon. Be supportive and encouraging.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating summary:', error);
      return "Thank you for completing this assessment. Your responses have been carefully recorded and will help in understanding your current mental health status. Based on your answers, we can work together to identify the best path forward for your well-being.";
    }
  }

  /**
   * Clean up session
   */
  cleanupSession(sessionId: string): void {
    this.contexts.delete(sessionId);
  }
}

export const aiInterviewService = new AIInterviewService();
