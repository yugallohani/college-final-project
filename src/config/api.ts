/**
 * API Configuration
 * Centralized API URL management for different environments
 */

// Get API URL from environment variable or fallback to localhost
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    VERIFY: `${API_BASE_URL}/api/auth/verify`,
  },
  
  // Session
  SESSION: {
    START: `${API_BASE_URL}/api/session/start`,
  },
  
  // AI Interview
  AI_INTERVIEW: {
    START: `${API_BASE_URL}/api/ai-interview/start`,
    PROCESS_RESPONSE: `${API_BASE_URL}/api/ai-interview/process-response`,
    COMPLETE: `${API_BASE_URL}/api/ai-interview/complete`,
  },
  
  // TTS
  TTS: {
    SPEAK: `${API_BASE_URL}/api/tts/speak`,
  },
  
  // Assessment
  ASSESSMENT: {
    RESULTS: (sessionId: string) => `${API_BASE_URL}/api/assessment/results/${sessionId}`,
  },
  
  // Clinical Reports
  CLINICAL_REPORTS: {
    GET: (sessionId: string) => `${API_BASE_URL}/api/clinical-reports/${sessionId}`,
    PDF: (sessionId: string) => `${API_BASE_URL}/api/clinical-reports/${sessionId}?format=pdf`,
    DASHBOARD_SUMMARY: `${API_BASE_URL}/api/clinical-reports/dashboard/summary`,
    TEST: `${API_BASE_URL}/api/clinical-reports/test`,
  },
  
  // Chat
  CHAT: `${API_BASE_URL}/api/chat`,
  
  // Report
  REPORT: `${API_BASE_URL}/api/report`,
};

// Helper function to build API URL
export const buildApiUrl = (path: string): string => {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

// Export for backward compatibility
export const API_BASE = API_BASE_URL + '/api';
