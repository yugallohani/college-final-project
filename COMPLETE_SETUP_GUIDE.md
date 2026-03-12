# NeuroScan AI - Complete Setup Guide (Updated)

## 🎉 What's New

✅ **PostgreSQL** instead of MongoDB
✅ **Ollama (FREE!)** instead of OpenAI
✅ **HuggingFace Emotion Detection** (FREE!)
✅ **Whisper Speech-to-Text** via HuggingFace (FREE!)
✅ **PDF Export** functionality
✅ **User Authentication** with JWT
✅ **Hindi Language Support** (bilingual)
✅ **Psychologist Matching** system
✅ **Appointment Booking** system

## Prerequisites

### 1. PostgreSQL
```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb neuroscan
```

### 2. AI Provider (Choose One)

#### Option A: Google Gemini (Recommended) ⭐
**FREE, Fast, Easy Setup**

1. Get API key: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. No installation needed!

**Free Tier:**
- 60 requests/minute
- 1,500 requests/day
- 1 million tokens/month
- No credit card required

#### Option B: Ollama (Local, Private)
**FREE, Unlimited, Offline**

```bash
# macOS/Linux
curl https://ollama.ai/install.sh | sh

# Start Ollama
ollama serve

# Pull a model (in another terminal)
ollama pull llama2
# or for better performance:
ollama pull mistral
```

### 3. HuggingFace API Key (FREE)
1. Go to https://huggingface.co/
2. Sign up for free account
3. Go to Settings → Access Tokens
4. Create new token (read access is enough)

### 4. Node.js 18+
```bash
# Check version
node --version

# If needed, install via nvm
nvm install 18
nvm use 18
```

## Installation

### 1. Install Dependencies

#### Backend
```bash
cd NeuroScan-landing-page/backend
npm install
```

#### Frontend
```bash
cd NeuroScan-landing-page
npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
# Server
PORT=3001
NODE_ENV=development

# PostgreSQL
DATABASE_URL=postgresql://postgres:password@localhost:5432/neuroscan
DB_HOST=localhost
DB_PORT=5432
DB_NAME=neuroscan
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# AI Provider (Choose One)
AI_PROVIDER=gemini  # or ollama

# Google Gemini (Recommended - FREE!)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# Ollama (Alternative - Local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# HuggingFace (FREE!)
HUGGINGFACE_API_KEY=hf_your_token_here

# JWT Secret (generate random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Encryption (32 characters)
ENCRYPTION_KEY=your-32-character-encryption-key

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 3. Setup Database

```bash
cd backend
npm run migrate
```

This will:
- Create all tables
- Set up indexes
- Insert sample psychologists

### 4. Verify Ollama

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Test generation
ollama run llama2 "Hello, how are you?"
```

## Running the Application

### Terminal 1: Backend
```bash
cd backend
npm run dev
```

You should see:
```
✅ PostgreSQL connected successfully
🤖 Using Google Gemini (FREE, Fast)
🚀 NeuroScan AI Backend running on port 3001
```

Or if using Ollama:
```
✅ PostgreSQL connected successfully
🤖 Using Ollama (Local, Private)
🚀 NeuroScan AI Backend running on port 3001
```

### Terminal 2: Frontend
```bash
cd NeuroScan-landing-page
npm run dev
```

## Testing the Features

### 1. User Registration
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User",
    "language": "en"
  }'
```

### 2. Start Session
```bash
curl -X POST http://localhost:3001/api/session/start \
  -H "Content-Type: application/json" \
  -d '{"language": "en"}'
```

### 3. Voice Upload (with authentication)
```bash
curl -X POST http://localhost:3001/api/speech/transcribe \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio=@path/to/audio.mp3" \
  -F "sessionId=YOUR_SESSION_ID"
```

### 4. Get Psychologists
```bash
curl http://localhost:3001/api/psychologists?language=en
```

### 5. Export PDF Report
```bash
curl -X POST http://localhost:3001/api/report/SESSION_ID/export \
  -H "Content-Type: application/json" \
  -d '{"format": "pdf"}'
```

## Features Overview

### 1. AI Provider (Choose One)

#### Google Gemini (Recommended) ⭐
- **FREE**: 1M tokens/month
- **FAST**: 1-2 second responses
- **EASY**: Just need API key
- No installation required
- Excellent Hindi support

#### Ollama (Alternative)
- **FREE**: Unlimited usage
- **PRIVATE**: 100% local
- **OFFLINE**: No internet needed
- Requires installation
- Good Hindi support

### 2. Emotion Detection (HuggingFace)
- Free tier: 30,000 requests/month
- Real-time emotion analysis
- 6 emotions: joy, sadness, fear, anger, surprise, neutral

### 3. Voice Input (Whisper via HuggingFace)
- Free tier available
- Supports multiple audio formats
- Automatic transcription

### 4. PDF Export
- Professional reports
- Color-coded risk levels
- Includes all assessments

### 5. User Authentication
- JWT-based
- Secure password hashing
- Session management

### 6. Hindi Support
- Bilingual interface
- Hindi translations
- Cultural adaptation

### 7. Psychologist Matching
- Smart matching based on needs
- Specialization filtering
- Appointment booking

## API Endpoints (New)

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Speech
- `POST /api/speech/transcribe` - Transcribe audio

### Psychologists
- `GET /api/psychologists` - Get all psychologists
- `GET /api/psychologists/:id` - Get psychologist by ID
- `GET /api/psychologists/match` - Match psychologists
- `POST /api/appointments` - Book appointment
- `GET /api/appointments` - Get user appointments

### Reports
- `POST /api/report/:sessionId/export` - Export PDF

## Database Schema

```
users
├── id (UUID)
├── email
├── password_hash
├── full_name
├── language
└── created_at

sessions
├── id (UUID)
├── user_id (FK)
├── current_phase
├── language
└── created_at

psychologists
├── id (UUID)
├── name
├── specialization (JSONB)
├── experience
├── credentials (JSONB)
├── rating
└── availability (JSONB)

appointments
├── id (UUID)
├── user_id (FK)
├── psychologist_id (FK)
├── appointment_date
└── status
```

## Troubleshooting

### Ollama Not Running
```bash
# Check status
ps aux | grep ollama

# Restart
killall ollama
ollama serve
```

### PostgreSQL Connection Error
```bash
# Check if running
brew services list

# Restart
brew services restart postgresql@15

# Test connection
psql -U postgres -d neuroscan
```

### HuggingFace Rate Limit
- Free tier: 30,000 requests/month
- Upgrade for more: https://huggingface.co/pricing

### Model Download Issues
```bash
# Check available models
ollama list

# Pull specific model
ollama pull llama2:7b
ollama pull mistral:7b
```

## Performance Tips

### 1. Ollama Model Selection
- `llama2:7b` - Faster, good quality
- `mistral:7b` - Better quality, slightly slower
- `llama2:13b` - Best quality, slower (needs more RAM)

### 2. PostgreSQL Optimization
```sql
-- Add indexes if needed
CREATE INDEX idx_sessions_created_at ON sessions(created_at);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

### 3. HuggingFace Caching
- Responses are cached automatically
- Clear cache if needed: `rm -rf ~/.cache/huggingface`

## Cost Comparison

### Before (OpenAI)
- GPT-4: $0.03 per 1K tokens
- Whisper: $0.006 per minute
- **Monthly cost**: $50-200+

### After (Free Stack)
- Ollama: **FREE** (local)
- HuggingFace: **FREE** (30K requests/month)
- Whisper: **FREE** (via HuggingFace)
- **Monthly cost**: **$0**

## Next Steps

1. **Test all features**
2. **Customize Ollama prompts**
3. **Add more psychologists**
4. **Configure email notifications**
5. **Deploy to production**

## Production Deployment

### Environment Variables
```env
NODE_ENV=production
DATABASE_URL=your_production_db_url
OLLAMA_BASE_URL=your_ollama_server
HUGGINGFACE_API_KEY=your_production_key
JWT_SECRET=strong_random_secret
```

### Security Checklist
- [ ] Change all default passwords
- [ ] Use strong JWT secret
- [ ] Enable HTTPS
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Enable database backups
- [ ] Set up monitoring

## Support

- Ollama Docs: https://ollama.ai/
- HuggingFace Docs: https://huggingface.co/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/

## License

Proprietary - NeuroScan AI
