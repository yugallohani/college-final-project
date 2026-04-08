import pool from '../database/db.js';
import { PsychologistProfile } from '../types/index.js';

/**
 * Psychologist Service
 * Handles psychologist matching and appointments
 */
export class PsychologistService {
  /**
   * Match psychologists based on risk assessment
   */
  async matchPsychologists(
    depressionScore: number,
    anxietyScore: number,
    language: string = 'en'
  ): Promise<PsychologistProfile[]> {
    const specializations: string[] = [];

    // Determine needed specializations
    if (depressionScore >= 10) {
      specializations.push('Depression');
    }
    if (anxietyScore >= 10) {
      specializations.push('Anxiety');
    }
    if (depressionScore >= 15 || anxietyScore >= 15) {
      specializations.push('Trauma');
      specializations.push('Crisis Intervention');
    }

    // If no specific needs, show general practitioners
    if (specializations.length === 0) {
      specializations.push('General');
    }

    // Query psychologists
    const result = await pool.query(
      `SELECT id, name, email, specialization, experience, credentials, 
              rating, review_count, availability, bio, profile_image, languages
       FROM psychologists
       WHERE languages::jsonb ? $1
       AND (
         specialization::jsonb ?| $2::text[]
         OR specialization::jsonb ? 'General'
       )
       ORDER BY rating DESC, review_count DESC
       LIMIT 6`,
      [language, specializations]
    );

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      specialization: JSON.parse(row.specialization),
      experience: row.experience,
      credentials: JSON.parse(row.credentials),
      rating: parseFloat(row.rating),
      reviewCount: row.review_count,
      availability: JSON.parse(row.availability),
      bio: row.bio
    }));
  }

  /**
   * Get all psychologists
   */
  async getAllPsychologists(language?: string): Promise<PsychologistProfile[]> {
    let query = `
      SELECT id, name, email, specialization, experience, credentials, 
             rating, review_count, availability, bio, profile_image, languages
      FROM psychologists
    `;
    
    const params: any[] = [];
    
    if (language) {
      query += ' WHERE languages::jsonb ? $1';
      params.push(language);
    }
    
    query += ' ORDER BY rating DESC, review_count DESC';

    const result = await pool.query(query, params);

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      specialization: JSON.parse(row.specialization),
      experience: row.experience,
      credentials: JSON.parse(row.credentials),
      rating: parseFloat(row.rating),
      reviewCount: row.review_count,
      availability: JSON.parse(row.availability),
      bio: row.bio
    }));
  }

  /**
   * Get psychologist by ID
   */
  async getPsychologistById(id: string): Promise<PsychologistProfile | null> {
    const result = await pool.query(
      `SELECT id, name, email, specialization, experience, credentials, 
              rating, review_count, availability, bio, profile_image, languages
       FROM psychologists
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      specialization: JSON.parse(row.specialization),
      experience: row.experience,
      credentials: JSON.parse(row.credentials),
      rating: parseFloat(row.rating),
      reviewCount: row.review_count,
      availability: JSON.parse(row.availability),
      bio: row.bio
    };
  }

  /**
   * Book appointment
   */
  async bookAppointment(
    userId: string,
    psychologistId: string,
    sessionId: string,
    appointmentDate: Date,
    notes?: string
  ): Promise<string> {
    const result = await pool.query(
      `INSERT INTO appointments (user_id, psychologist_id, session_id, appointment_date, notes, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id`,
      [userId, psychologistId, sessionId, appointmentDate, notes]
    );

    return result.rows[0].id;
  }

  /**
   * Get user appointments
   */
  async getUserAppointments(userId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT a.id, a.appointment_date, a.status, a.notes, a.created_at,
              p.name as psychologist_name, p.specialization, p.email as psychologist_email
       FROM appointments a
       JOIN psychologists p ON a.psychologist_id = p.id
       WHERE a.user_id = $1
       ORDER BY a.appointment_date DESC`,
      [userId]
    );

    return result.rows.map(row => ({
      id: row.id,
      appointmentDate: row.appointment_date,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      psychologist: {
        name: row.psychologist_name,
        specialization: JSON.parse(row.specialization),
        email: row.psychologist_email
      }
    }));
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(appointmentId: string, status: string): Promise<void> {
    await pool.query(
      'UPDATE appointments SET status = $1 WHERE id = $2',
      [status, appointmentId]
    );
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(appointmentId: string, userId: string): Promise<void> {
    await pool.query(
      'UPDATE appointments SET status = $1 WHERE id = $2 AND user_id = $3',
      ['cancelled', appointmentId, userId]
    );
  }

  /**
   * Filter psychologists by specialization
   */
  async filterBySpecialization(specialization: string, language?: string): Promise<PsychologistProfile[]> {
    let query = `
      SELECT id, name, email, specialization, experience, credentials, 
             rating, review_count, availability, bio, profile_image, languages
      FROM psychologists
      WHERE specialization::jsonb ? $1
    `;
    
    const params: any[] = [specialization];
    
    if (language) {
      query += ' AND languages::jsonb ? $2';
      params.push(language);
    }
    
    query += ' ORDER BY rating DESC, review_count DESC';

    const result = await pool.query(query, params);

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      specialization: JSON.parse(row.specialization),
      experience: row.experience,
      credentials: JSON.parse(row.credentials),
      rating: parseFloat(row.rating),
      reviewCount: row.review_count,
      availability: JSON.parse(row.availability),
      bio: row.bio
    }));
  }
}

export const psychologistService = new PsychologistService();
