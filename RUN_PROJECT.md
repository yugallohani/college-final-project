# Running NeuroScan AI - Complete Guide

This guide will help you run the complete NeuroScan AI project (backend + frontend).

## Quick Start (Automated)

We've created an automated setup script that handles everything:

```bash
./setup-and-run.sh
```

This script will:
1. Check if PostgreSQL is running
2. Install all dependencies
3. Create .env file from template
4. Run database migrations
5. Start both backend and frontend servers

## Manual Setup (Step by Step)

If you prefer to run things manually or the automated script doesn't work:

### Step 1: Start PostgreSQL

```bash
# Start PostgreSQL service
brew services start postgresql@14

# Verify it's running
pg_isready
```

### Step 2: Setup Backend

```bash
cd NeuroScan-landing-page/backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and configure:
# - DATABASE_URL (PostgreSQL connection string)
# - GOOGLE_GEMINI_API_KEY (get free from https://makersuite.google.com/app/apikey)
# - JWT_SECRET (any random string)
# - HUGGINGFACE_API_KEY (optional, for emotion detection)

# Run database migrations
npm run migrate

# Start backend server
npm run dev
```

Backend will run on: http://localhost:3001

### Step 3: Setup Frontend

Open a new terminal:

```bash
cd NeuroScan-landing-page

# Install dependencies
npm install

# Start frontend server
npm run dev
```

Frontend will run on: http://localhost:5173

## What You Should See

### Backend Console Output:
```
✅ PostgreSQL connected successfully
🤖 Using Google Gemini (FREE, Fast)
🚀 NeuroScan AI Backend running on port 3001
📍 Environment: development
🔗 API: http://localhost:3001/api
🤖 AI Provider: gemini
```

### Frontend Console Output:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

## Testing the Application

1. Open http://localhost:5173 in your browser
2. Click "Start Conversation" on the landing page
3. Chat with the AI psychologist
4. Complete the PHQ-9 and GAD-7 tests
5. View your mental health report

## API Endpoints

Test the backend directly:

```bash
# Health check
curl http://localhost:3001/api/health

# Start a session
curl -X POST http://localhost:3001/api/session/start \
  -H "Content-Type: application/json" \
  -d '{"language": "en"}'

# Send a message
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "YOUR_SESSION_ID", "message": "I have been feeling down lately"}'
```

## Troubleshooting

### PostgreSQL Connection Error

```
❌ PostgreSQL connection error
```

**Solution:**
1. Make sure PostgreSQL is running: `brew services start postgresql@14`
2. Check DATABASE_URL in .env matches your PostgreSQL setup
3. Default: `postgresql://localhost:5432/neuroscan`

### Gemini API Error

```
❌ Gemini API error: Invalid API key
```

**Solution:**
1. Get a free API key from https://makersuite.google.com/app/apikey
2. Add it to .env: `GOOGLE_GEMINI_API_KEY=your_key_here`
3. Restart the backend server

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**
```bash
# Find and kill the process using port 3001
lsof -ti:3001 | xargs kill -9

# Or use a different port in .env
PORT=3002
```

### Database Migration Fails

```
❌ Migration failed
```

**Solution:**
```bash
# Drop and recreate database
dropdb neuroscan
createdb neuroscan

# Run migrations again
npm run migrate
```

### Frontend Can't Connect to Backend

**Solution:**
1. Make sure backend is running on port 3001
2. Check CORS settings in backend/.env
3. Verify VITE_API_URL in frontend (if configured)

## Environment Variables

### Backend (.env)

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_GEMINI_API_KEY` - Free Gemini API key
- `JWT_SECRET` - Random string for JWT tokens

Optional:
- `PORT` - Backend port (default: 3001)
- `AI_PROVIDER` - 'gemini' or 'ollama' (default: gemini)
- `HUGGINGFACE_API_KEY` - For emotion detection
- `OLLAMA_BASE_URL` - If using Ollama (default: http://localhost:11434)

### Frontend

The frontend automatically connects to http://localhost:3001 in development.

## Stopping the Servers

### If using automated script:
Press `Ctrl+C` in the terminal

### If running manually:
Press `Ctrl+C` in each terminal window (backend and frontend)

## Next Steps

After getting the project running:

1. Test the complete user flow
2. Try voice input (if configured)
3. Export a PDF report
4. Test psychologist matching
5. Try Hindi language support

## Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review TROUBLESHOOTING.md for detailed solutions
3. Check backend logs for error messages
4. Verify all environment variables are set correctly

## Development Mode

Both servers run in development mode with:
- Hot reload (changes auto-refresh)
- Detailed error messages
- Source maps for debugging

## Production Deployment

For production deployment, see COMPLETE_SETUP_GUIDE.md for:
- Building optimized bundles
- Setting up production database
- Configuring environment variables
- Security best practices
