# NeuroScan AI - Quick Reference

## 🚀 Start the Project

```bash
./setup-and-run.sh
```

Or manually:
```bash
# Terminal 1
cd NeuroScan-landing-page/backend && npm run dev

# Terminal 2
cd NeuroScan-landing-page && npm run dev
```

## 🔑 Get API Keys (FREE)

### Google Gemini (Recommended)
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy and add to `backend/.env`:
   ```
   GOOGLE_GEMINI_API_KEY=your_key_here
   ```

### HuggingFace (Optional - for emotion detection)
1. Go to https://huggingface.co/settings/tokens
2. Create a new token
3. Add to `backend/.env`:
   ```
   HUGGINGFACE_API_KEY=your_key_here
   ```

## 📁 Project Structure

```
NeuroScan-landing-page/
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── models/          # Data models
│   │   ├── database/        # DB schema & migrations
│   │   └── server.ts        # Main server file
│   └── .env                 # Environment variables
└── src/
    ├── pages/               # React pages
    ├── components/          # React components
    └── App.tsx              # Main app
```

## 🔌 API Endpoints

### Session Management
- `POST /api/session/start` - Start new session
- `GET /api/session/:id` - Get session details

### Chat
- `POST /api/chat/message` - Send message
- `GET /api/chat/:sessionId/history` - Get chat history

### Report
- `GET /api/report/:sessionId` - Get mental health report
- `POST /api/report/:sessionId/export` - Export as PDF

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify` - Verify token

### Psychologists
- `GET /api/psychologists` - List psychologists
- `POST /api/psychologists/:id/appointments` - Book appointment

### Speech
- `POST /api/speech/transcribe` - Transcribe audio to text

## 🗄️ Database Commands

```bash
# Create database
createdb neuroscan

# Run migrations
cd NeuroScan-landing-page/backend
npm run migrate

# Drop database (if needed)
dropdb neuroscan
```

## 🧪 Test API

```bash
# Health check
curl http://localhost:3001/api/health

# Start session
curl -X POST http://localhost:3001/api/session/start \
  -H "Content-Type: application/json" \
  -d '{"language": "en"}'

# Send message (replace SESSION_ID)
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "SESSION_ID", "message": "I feel sad"}'
```

## 🎨 Frontend Pages

- `/` - Landing page (✅ Complete)
- `/chat` - Chat interface (⚠️ Needs backend connection)
- `/report` - Mental health report (⚠️ Needs backend connection)

## 🔧 Environment Variables

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://localhost:5432/neuroscan

# AI Provider (choose one)
AI_PROVIDER=gemini
GOOGLE_GEMINI_API_KEY=your_gemini_key

# OR use Ollama (local)
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# Authentication
JWT_SECRET=your_random_secret_string

# Optional
HUGGINGFACE_API_KEY=your_hf_key
PORT=3001
```

## 🐛 Common Issues

### PostgreSQL not running
```bash
brew services start postgresql@14
```

### Port in use
```bash
lsof -ti:3001 | xargs kill -9
```

### Database doesn't exist
```bash
createdb neuroscan
cd NeuroScan-landing-page/backend
npm run migrate
```

### Gemini API error
Get free key: https://makersuite.google.com/app/apikey

## 📚 Documentation Files

- `README.md` - Project overview
- `RUN_PROJECT.md` - How to run the project
- `COMPLETE_SETUP_GUIDE.md` - Detailed setup instructions
- `TROUBLESHOOTING.md` - Common issues and solutions
- `AI_PROVIDERS_COMPARISON.md` - Compare Gemini vs Ollama
- `IMPLEMENTATION_STATUS.md` - What's done and what's left
- `PROJECT_SUMMARY.md` - Technical overview

## 🎯 Next Steps

1. ✅ Backend is ready
2. ⚠️ Connect frontend Chat page to backend
3. ⚠️ Connect frontend Report page to backend
4. ⚠️ Test complete user flow
5. ⚠️ Add authentication UI

## 💡 Tips

- Use Gemini (free, fast, easy)
- Test backend API first with curl
- Then connect frontend
- Check browser console for errors
- Check backend terminal for logs

## 🆘 Get Help

1. Check `TROUBLESHOOTING.md`
2. Check backend logs in terminal
3. Check browser console (F12)
4. Verify .env file is configured
5. Make sure PostgreSQL is running
