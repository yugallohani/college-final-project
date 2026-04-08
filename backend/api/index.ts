import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Import routes
import sessionRoutes from '../src/routes/session.js';
import chatRoutes from '../src/routes/chat.js';
import testRoutes from '../src/routes/test.js';
import reportRoutes from '../src/routes/report.js';
import authRoutes from '../src/routes/auth.js';
import psychologistRoutes from '../src/routes/psychologist.js';
import speechRoutes from '../src/routes/speech.js';
import assessmentRoutes from '../src/routes/assessment.js';
import assessmentQuestionsRoutes from '../src/routes/assessmentQuestions.js';
import aiInterviewRoutes from '../src/routes/aiInterview.js';
import ttsRoutes from '../src/routes/tts.js';
import clinicalReportsRoutes from '../src/routes/clinicalReports.js';
import testAIAccuracyRoutes from '../src/routes/testAIAccuracy.js';
import debugGeminiRoutes from '../src/routes/debugGemini.js';

const app = express();

// Middleware - CORS configuration for production
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL || '',
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600
}));

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
});
app.use('/api/', limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'NeuroScan AI Backend',
    environment: process.env.NODE_ENV || 'production'
  });
});

// Routes
app.use('/api/session', sessionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/test', testRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/psychologists', psychologistRoutes);
app.use('/api/speech', speechRoutes);
app.use('/api/assessment/questions', assessmentQuestionsRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/ai-interview', aiInterviewRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/clinical-reports', clinicalReportsRoutes);
app.use('/api/test-ai-accuracy', testAIAccuracyRoutes);
app.use('/api/debug-gemini', debugGeminiRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Export for Vercel serverless
export default app;
