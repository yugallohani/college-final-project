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

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:8080',
    'http://localhost:5173', // Vite default
    'http://localhost:3000'  // React default
  ],
  credentials: true
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
app.use('/api/assessment', assessmentRoutes);
app.use('/api/assessment', assessmentQuestionsRoutes);

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
  
  app.listen(PORT, () => {
    console.log(`🚀 NeuroScan AI Backend running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
    console.log(`🤖 AI Provider: ${process.env.AI_PROVIDER || 'gemini'}`);
  });
};

startServer();

export default app;
