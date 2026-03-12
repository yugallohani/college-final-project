# 🚀 How to Run NeuroScan AI

Your Gemini API key is already configured! Just follow these steps:

## Step 1: Run Setup (One Time Only)

```bash
./quick-setup.sh
```

This will:
- ✅ Install PostgreSQL
- ✅ Create database
- ✅ Install all dependencies
- ✅ Run database migrations

**Time: ~5-10 minutes** (depending on your internet speed)

## Step 2: Start the Project

After setup is complete, you have two options:

### Option A: Automatic (Recommended)

```bash
./start-project.sh
```

This starts both backend and frontend automatically.

### Option B: Manual (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd NeuroScan-landing-page/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd NeuroScan-landing-page
npm run dev
```

## Step 3: Open Browser

Go to: **http://localhost:5173**

You should see the NeuroScan landing page!

## 🎯 What to Expect

### Backend Console:
```
✅ PostgreSQL connected successfully
🤖 Using Google Gemini (FREE, Fast)
🚀 NeuroScan AI Backend running on port 3001
```

### Frontend Console:
```
VITE ready in xxx ms
➜  Local:   http://localhost:5173/
```

## 🧪 Test It

1. Click "Start Conversation"
2. Chat with the AI psychologist
3. Answer the questions
4. Complete PHQ-9 and GAD-7 tests
5. View your mental health report

## 🐛 Troubleshooting

### PostgreSQL Issues
```bash
# Start PostgreSQL
brew services start postgresql@14

# Check if running
pg_isready
```

### Port Already in Use
```bash
# Kill processes on ports
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Database Issues
```bash
# Recreate database
dropdb neuroscan
createdb neuroscan
cd NeuroScan-landing-page/backend
npm run migrate
```

## 📝 Your Configuration

Already set up in `backend/.env`:
- ✅ Gemini API Key: Configured
- ✅ Database: postgresql://localhost:5432/neuroscan
- ✅ JWT Secret: Configured
- ✅ Port: 3001

## 🆘 Need Help?

Check these files:
- `START_HERE.md` - Complete overview
- `QUICK_REFERENCE.md` - Quick commands
- `TROUBLESHOOTING.md` - Common issues

## 🎉 That's It!

Your project is ready to run. Just execute:

```bash
./quick-setup.sh
```

Then:

```bash
./start-project.sh
```

Enjoy building your AI mental health screening platform! 🧠
