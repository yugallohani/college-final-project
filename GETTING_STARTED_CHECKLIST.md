# NeuroScan AI - Getting Started Checklist

Follow this checklist to get your project running.

## ☑️ Prerequisites

- [ ] macOS with Homebrew installed
- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL 14+ installed (`brew install postgresql@14`)
- [ ] Git installed

## ☑️ Step 1: Database Setup (5 minutes)

```bash
# Start PostgreSQL
brew services start postgresql@14

# Verify it's running
pg_isready

# Create database
createdb neuroscan
```

- [ ] PostgreSQL is running
- [ ] Database `neuroscan` created

## ☑️ Step 2: Get API Keys (5 minutes)

### Google Gemini (Required - FREE)
1. [ ] Go to https://makersuite.google.com/app/apikey
2. [ ] Sign in with Google account
3. [ ] Click "Create API Key"
4. [ ] Copy the API key
5. [ ] Save it somewhere safe

### HuggingFace (Optional)
1. [ ] Go to https://huggingface.co/settings/tokens
2. [ ] Create account if needed
3. [ ] Click "New token"
4. [ ] Copy the token
5. [ ] Save it somewhere safe

## ☑️ Step 3: Backend Setup (10 minutes)

```bash
cd NeuroScan-landing-page/backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env file (use nano, vim, or VS Code)
nano .env
```

Configure these in `.env`:
- [ ] `DATABASE_URL=postgresql://localhost:5432/neuroscan`
- [ ] `GOOGLE_GEMINI_API_KEY=your_key_here`
- [ ] `JWT_SECRET=any_random_string_here`
- [ ] `HUGGINGFACE_API_KEY=your_key_here` (optional)

```bash
# Run database migrations
npm run migrate
```

- [ ] Dependencies installed
- [ ] .env file configured
- [ ] Database migrations completed

## ☑️ Step 4: Frontend Setup (5 minutes)

```bash
cd NeuroScan-landing-page

# Install dependencies
npm install
```

- [ ] Dependencies installed

## ☑️ Step 5: Start the Project (2 minutes)

### Option A: Automated (Recommended)
```bash
# From project root
./setup-and-run.sh
```

### Option B: Manual
```bash
# Terminal 1: Backend
cd NeuroScan-landing-page/backend
npm run dev

# Terminal 2: Frontend (open new terminal)
cd NeuroScan-landing-page
npm run dev
```

- [ ] Backend running on http://localhost:3001
- [ ] Frontend running on http://localhost:5173

## ☑️ Step 6: Test the Application (5 minutes)

### Test Backend API
```bash
# Health check
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "NeuroScan AI Backend"
}
```

- [ ] Backend API responds

### Test Frontend
1. [ ] Open http://localhost:5173 in browser
2. [ ] Landing page loads correctly
3. [ ] Click "Start Conversation" button
4. [ ] Chat page opens

### Test Complete Flow
1. [ ] Start a conversation
2. [ ] Send a message
3. [ ] AI responds
4. [ ] Complete PHQ-9 questions
5. [ ] Complete GAD-7 questions
6. [ ] View mental health report

- [ ] Complete user flow works

## ☑️ Step 7: Verify Features

### Core Features
- [ ] AI conversation works
- [ ] PHQ-9 test works
- [ ] GAD-7 test works
- [ ] Report generation works

### Optional Features (if configured)
- [ ] Emotion detection works (needs HuggingFace key)
- [ ] Voice input works (needs audio upload)
- [ ] PDF export works
- [ ] Psychologist listing works

## 🎉 Success Criteria

You should see:

### Backend Console:
```
✅ PostgreSQL connected successfully
🤖 Using Google Gemini (FREE, Fast)
🚀 NeuroScan AI Backend running on port 3001
📍 Environment: development
🔗 API: http://localhost:3001/api
🤖 AI Provider: gemini
```

### Frontend Console:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### Browser:
- Landing page with dark theme
- Smooth animations
- "Start Conversation" button works
- Chat interface loads

## 🐛 Troubleshooting

### PostgreSQL not running
```bash
brew services start postgresql@14
pg_isready
```

### Port already in use
```bash
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Database migration fails
```bash
dropdb neuroscan
createdb neuroscan
cd NeuroScan-landing-page/backend
npm run migrate
```

### Gemini API error
- Check API key is correct in .env
- Verify no extra spaces in .env
- Get new key from https://makersuite.google.com/app/apikey

### Frontend can't connect to backend
- Make sure backend is running on port 3001
- Check browser console for errors (F12)
- Verify CORS is enabled in backend

## 📚 Next Steps

After everything is working:

1. [ ] Read `IMPLEMENTATION_STATUS.md` to see what's complete
2. [ ] Review `.kiro/specs/ai-mental-health-screening/tasks.md` for remaining tasks
3. [ ] Test all API endpoints with curl or Postman
4. [ ] Connect frontend Chat page to backend API
5. [ ] Connect frontend Report page to backend API
6. [ ] Add authentication UI
7. [ ] Test voice input feature
8. [ ] Test PDF export feature
9. [ ] Test psychologist matching

## 🆘 Need Help?

Check these files:
- `QUICK_REFERENCE.md` - Quick commands and tips
- `RUN_PROJECT.md` - Detailed run instructions
- `TROUBLESHOOTING.md` - Common issues and solutions
- `COMPLETE_SETUP_GUIDE.md` - Complete setup guide

## ✅ Completion

- [ ] All prerequisites met
- [ ] Database setup complete
- [ ] API keys obtained
- [ ] Backend configured and running
- [ ] Frontend configured and running
- [ ] Application tested and working

**Congratulations! Your NeuroScan AI project is now running! 🎉**

Time to start building amazing mental health screening features!
