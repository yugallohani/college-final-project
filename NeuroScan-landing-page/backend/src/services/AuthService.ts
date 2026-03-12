import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database/db.js';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  language: string;
  created_at: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Authentication Service
 * Handles user registration, login, and JWT tokens
 */
export class AuthService {
  private jwtSecret: string;
  private jwtExpiry: string = '24h';

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'change-this-secret-in-production';
  }

  /**
   * Register new user
   */
  async register(
    email: string,
    password: string,
    fullName?: string,
    language: string = 'en'
  ): Promise<{ user: User; tokens: AuthTokens }> {
    // Check if user exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, language)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, language, created_at`,
      [email, passwordHash, fullName, language]
    );

    const user = result.rows[0];
    const tokens = this.generateTokens(user.id);

    return { user, tokens };
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    // Find user
    const result = await pool.query(
      `SELECT id, email, password_hash, full_name, language, created_at
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const tokens = this.generateTokens(user.id);

    // Remove password hash from response
    delete user.password_hash;

    return { user, tokens };
  }

  /**
   * Generate JWT tokens
   */
  private generateTokens(userId: string): AuthTokens {
    const accessToken = jwt.sign(
      { userId, type: 'access' },
      this.jwtSecret,
      { expiresIn: this.jwtExpiry }
    );

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      this.jwtSecret,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): { userId: string; type: string } {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      return { userId: decoded.userId, type: decoded.type };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT id, email, full_name, language, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    return result.rows[0] || null;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: { full_name?: string; language?: string }
  ): Promise<User> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.full_name !== undefined) {
      fields.push(`full_name = $${paramCount++}`);
      values.push(updates.full_name);
    }

    if (updates.language !== undefined) {
      fields.push(`language = $${paramCount++}`);
      values.push(updates.language);
    }

    values.push(userId);

    const result = await pool.query(
      `UPDATE users
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, email, full_name, language, created_at`,
      values
    );

    return result.rows[0];
  }

  /**
   * Change password
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    // Get current password hash
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    // Verify old password
    const isValid = await bcrypt.compare(oldPassword, result.rows[0].password_hash);
    if (!isValid) {
      throw new Error('Invalid current password');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, userId]
    );
  }

  /**
   * Delete user account
   */
  async deleteAccount(userId: string): Promise<void> {
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  }
}

export const authService = new AuthService();
