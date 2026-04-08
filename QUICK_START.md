# 🚀 Quick Start Guide - Run NeuroScan AI

## Prerequisites Check

Before starting, ensure you have:
- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL installed and running
- [ ] Google Gemini API key (FREE from https://makersuite.google.com/app/apikey)
- [ ] HuggingFace API key (FREE from https://huggingface.co/settings/tokens)

## Step-by-Step Setup (5 minutes)

### 1. Install PostgreSQL (if not installed)

```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb neuroscan

# Verify it's running
psql -U postgres -d neuroscan -c "SELECT version();"
```

### 2. Get API Keys (FREE)

#### Gemini API Key (30 seconds)
1. Visit: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key (starts with `AIza...`)

#### HuggingFace API Key (1 minute)
1. Visit: https://huggingface.co/settings/tokens
2. Click "New token"
3. Name it "neuroscan"
4. Select "Read" access
5. Copy the token (starts with `hf_...`)

### 3. Setup Backend

```bash
# Navigate to backend
cd NeuroScan-landing-page/backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your keys
nano .env
# or
code .env
```

**Edit `.env` file:**
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

# AI Provider
AI_PROVIDER=gemini

# Google Gemini (Paste your key here)
GOOGLE_GEMINI_API_KEY=AIza...your_key_here

# HuggingFace (Paste your key here)
HUGGINGFACE_API_KEY=hf_...your_key_here

# JWT Secret (generate random string)
JWT_SECRET=my-super-secret-jwt-key-change-this-in-production

# Encryption (32 characters)
ENCRYPTION_KEY=12345678901234567890123456789012

# CORS
CORS_ORIGIN=http://localhost:5173
```

**Run database migration:**
```bash
npm run migrate
```

You should see:
```
🔄 Running database migrations...
✅ Database migrations completed successfully
📝 Inserting sample psychologists...
✅ Sample psychologists inserted
```

### 4. Setup Frontend

```bash
# Navigate to frontend (from backend directory)
cd ..

# Install dependencies
npm install
```

### 5. Start the Application

#### Terminal 1: Start Backend
```bash
cd backend
npm run dev
```

**Expected output:**
```
✅ PostgreSQL connected successfully
🤖 Using Google Gemini (FREE, Fast)
🚀 NeuroScan AI Backend running on port 3001
📍 Environment: development
🔗 API: http://localhost:3001/api
```

#### Terminal 2: Start Frontend
```bash
# From NeuroScan-landing-page directory
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 6. Test the Application

1. **Open browser**: http://localhost:5173
2. **Click**: "Start Your Assessment"
3. **Chat with AI**: Type a message
4. **Complete tests**: Answer PHQ-9 and GAD-7 questions
5. **View report**: See your results

## Verification Checklist

- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] Can access landing page
- [ ] Can start chat session
- [ ] AI responds to messages
- [ ] Can complete PHQ-9 test
- [ ] Can complete GAD-7 test
- [ ] Can view report

## Common Issues & Solutions

### Issue: "Cannot connect to database"
```bash
# Check if PostgreSQL is running
brew services list

# Restart PostgreSQL
brew services restart postgresql@15

# Check connection
psql -U postgres -d neuroscan
```

### Issue: "Gemini API key invalid"
```bash
# Get new key from:
https://makersuite.google.com/app/apikey

# Update .env
GOOGLE_GEMINI_API_KEY=your_new_key
```

### Issue: "Port 3001 already in use"
```bash
# Find process
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3002
```

### Issue: "Module not found"
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd ..
rm -rf node_modules package-lock.json
npm install
```

## Testing API Endpoints

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Start Session
```bash
curl -X POST http://localhost:3001/api/session/start \
  -H "Content-Type: application/json" \
  -d '{"language": "en"}'
```

### Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

## What to Expect

### Landing Page
- Modern dark theme
- Animated hero section
- "Start Your Assessment" button
- Smooth scrolling

### Chat Interface
- ChatGPT-style layout
- AI responds in 1-2 seconds
- Typing indicator
- Voice input button (UI ready)

### Report Dashboard
- Depression score (PHQ-9)
- Anxiety score (GAD-7)
- Visual progress bars
- Key observations
- Recommendations
- Download PDF button

## Next Steps

1. **Test all features**
2. **Try Hindi language** (change language in session start)
3. **Test voice input** (upload audio file)
4. **Book appointment** with sample psychologist
5. **Export PDF report**

## Need Help?

Check these files:
- `COMPLETE_SETUP_GUIDE.md` - Detailed setup
- `TROUBLESHOOTING.md` - Common issues
- `AI_PROVIDERS_COMPARISON.md` - AI provider info
- `backend/API_REFERENCE.md` - API documentation

## Stop the Application

```bash
# In each terminal, press:
Ctrl + C
```

## Clean Restart

```bash
# Stop all services
pkill -f node
pkill -f vite

# Clean backend
cd backend
rm -rf node_modules dist
npm install

# Clean frontend
cd ..
rm -rf node_modules dist
npm install

# Restart database
brew services restart postgresql@15

# Start fresh
cd backend && npm run dev
# In new terminal:
npm run dev
```

## Success! 🎉

If you see:
- ✅ Backend running
- ✅ Frontend running
- ✅ Can chat with AI
- ✅ Can complete tests
- ✅ Can view reports

**You're all set!** The complete AI Virtual Clinical Psychologist platform is running.
