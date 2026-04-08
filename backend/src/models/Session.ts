import { pool } from '../database/db.js';
import { Session, Message, TestResponse, EmotionAnalysis, RiskAssessment } from '../types/index.js';

export class SessionModel {
  /**
   * Create a new session
   */
  static async create(userId?: string): Promise<Session> {
    const result = await pool.query(
      `INSERT INTO sessions (user_id, current_phase)
       VALUES ($1, 'conversation')
       RETURNING *`,
      [userId || null]
    );

    return this.mapToSession(result.rows[0]);
  }

  /**
   * Find session by ID
   */
  static async findById(sessionId: string): Promise<Session | null> {
    const result = await pool.query(
      'SELECT * FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const session = this.mapToSession(result.rows[0]);

    // Load related data
    session.messages = await this.getMessages(sessionId);
    session.phq9Responses = await this.getTestResponses(sessionId, 'phq9');
    session.gad7Responses = await this.getTestResponses(sessionId, 'gad7');
    session.emotionAnalysis = await this.getEmotionAnalysis(sessionId);

    return session;
  }

  /**
   * Update session
   */
  static async findByIdAndUpdate(
    sessionId: string,
    updates: Partial<Session>
  ): Promise<Session | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.currentPhase) {
      fields.push(`current_phase = $${paramIndex++}`);
      values.push(updates.currentPhase);
    }

    if (updates.userId) {
      fields.push(`user_id = $${paramIndex++}`);
      values.push(updates.userId);
    }

    fields.push(`updated_at = NOW()`);
    values.push(sessionId);

    const result = await pool.query(
      `UPDATE sessions SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.findById(sessionId);
  }

  /**
   * Save session (for compatibility with Mongoose-style code)
   */
  static async save(session: Session): Promise<Session> {
    // Update session
    await pool.query(
      `UPDATE sessions 
       SET current_phase = $1, user_id = $2, updated_at = NOW()
       WHERE id = $3`,
      [session.currentPhase, session.userId, session.id]
    );

    // Save messages
    for (const message of session.messages) {
      await this.saveMessage(session.id, message);
    }

    // Save test responses
    for (const response of session.phq9Responses) {
      await this.saveTestResponse(session.id, 'phq9', response);
    }

    for (const response of session.gad7Responses) {
      await this.saveTestResponse(session.id, 'gad7', response);
    }

    // Save emotion analysis
    for (const emotion of session.emotionAnalysis) {
      await this.saveEmotionAnalysis(session.id, emotion);
    }

    return session;
  }

  /**
   * Get messages for a session
   */
  private static async getMessages(sessionId: string): Promise<Message[]> {
    const result = await pool.query(
      `SELECT * FROM messages WHERE session_id = $1 ORDER BY created_at ASC`,
      [sessionId]
    );

    return result.rows.map(row => ({
      id: row.id,
      role: row.role,
      content: row.content,
      timestamp: row.created_at,
      metadata: row.metadata
    }));
  }

  /**
   * Save a message
   */
  private static async saveMessage(sessionId: string, message: Message): Promise<void> {
    await pool.query(
      `INSERT INTO messages (session_id, role, content, created_at, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, message.role, message.content, message.timestamp, message.metadata || null]
    );
  }

  /**
   * Get test responses
   */
  private static async getTestResponses(sessionId: string, testType: string): Promise<TestResponse[]> {
    const result = await pool.query(
      `SELECT * FROM test_responses WHERE session_id = $1 AND question_id LIKE $2 ORDER BY created_at ASC`,
      [sessionId, `${testType}%`]
    );

    return result.rows.map(row => ({
      questionId: row.question_id,
      score: row.score,
      timestamp: row.created_at
    }));
  }

  /**
   * Save test response
   */
  private static async saveTestResponse(
    sessionId: string,
    testType: string,
    response: TestResponse
  ): Promise<void> {
    await pool.query(
      `INSERT INTO test_responses (session_id, question_id, score, created_at)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, response.questionId, response.score, response.timestamp]
    );
  }

  /**
   * Get emotion analysis
   */
  private static async getEmotionAnalysis(sessionId: string): Promise<EmotionAnalysis[]> {
    const result = await pool.query(
      `SELECT * FROM emotion_analysis WHERE session_id = $1 ORDER BY created_at ASC`,
      [sessionId]
    );

    return result.rows.map(row => ({
      messageId: row.id, // Use the emotion analysis ID as messageId for now
      emotion: row.emotion,
      confidence: row.intensity / 100, // Convert intensity to confidence (0-1)
      timestamp: row.created_at
    }));
  }

  /**
   * Save emotion analysis
   */
  private static async saveEmotionAnalysis(
    sessionId: string,
    emotion: EmotionAnalysis
  ): Promise<void> {
    await pool.query(
      `INSERT INTO emotion_analysis (session_id, emotion, intensity, valence, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, emotion.emotion, emotion.confidence * 100, 'mixed', emotion.timestamp]
    );
  }

  /**
   * Map database row to Session object
   */
  private static mapToSession(row: any): Session {
    return {
      id: row.id,
      userId: row.user_id,
      messages: [],
      currentPhase: row.current_phase,
      phq9Responses: [],
      gad7Responses: [],
      languageAnalysis: row.language_analysis || {},
      emotionAnalysis: [],
      riskAssessment: row.risk_assessment,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

