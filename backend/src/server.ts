import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { pool } from './database/db.js';

// Load environment variables
dotenv.config();

// Import routes
import sessionRoutes from './routes/session.js';
import chatRoutes from './routes/chat.js';
import testRoutes from './routes/test.js';
import reportRoutes from './routes/report.js';
import authRoutes from './routes/auth.js';
import psychologistRoutes from './routes/psychologist.js';
import speechRoutes from './routes/speech.js';
import assessmentRoutes from './routes/assessment.js';
import assessmentQuestionsRoutes from './routes/assessmentQuestions.js';
import aiInterviewRoutes from './routes/aiInterview.js';
import ttsRoutes from './routes/tts.js';
import clinicalReportsRoutes from './routes/clinicalReports.js';
import testAIAccuracyRoutes from './routes/testAIAccuracy.js';
import debugGeminiRoutes from './routes/debugGemini.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS must come first
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Render health checks, curl)
    if (!origin) return callback(null, true);
    // Allow all Vercel deployments for this project
    if (origin.includes('neuroscan-frontend') && origin.includes('vercel.app')) return callback(null, true);
    // Allow exact matches from env
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow localhost for dev
    if (origin.includes('localhost')) return callback(null, true);
    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error(`CORS blocked: ${origin}`));
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
    service: 'NeuroScan AI Backend'
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

// Database connection
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully');
    client.release();
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error);
    console.error('Make sure PostgreSQL is running and DATABASE_URL is configured');
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  await connectDB();

  // Auto-migrate on startup (safe — uses IF NOT EXISTS in schema)
  try {
    const { readFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const schema = readFileSync(join(__dirname, 'database/schema.sql'), 'utf-8');
    await pool.query(schema);
    console.log('✅ Database schema ready');
  } catch (err) {
    console.warn('⚠️ Auto-migrate warning (non-fatal):', err);
  }

  app.listen(PORT, () => {
    console.log(`🚀 NeuroScan AI Backend running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
    console.log(`🤖 AI Provider: ${process.env.AI_PROVIDER || 'gemini'}`);
  });
};

startServer();

export default app;
