# NeuroScan AI - Complete Setup Guide

## Overview

NeuroScan AI is a complete AI Virtual Clinical Psychologist platform that provides conversational mental health screening through PHQ-9 and GAD-7 assessments.

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + MongoDB
- **AI**: OpenAI GPT-4 for conversational AI
- **Database**: MongoDB for session and user data

## Prerequisites

1. **Node.js** 18+ or **Bun**
2. **MongoDB** (local or cloud)
3. **OpenAI API Key** (get from https://platform.openai.com/)

## Installation Steps

### 1. Install Dependencies

#### Frontend
```bash
cd NeuroScan-landing-page
npm install
# or
bun install
```

#### Backend
```bash
cd backend
npm install
# or
bun install
```

### 2. Setup MongoDB

#### Option A: Local MongoDB
```bash
# Install MongoDB (macOS)
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

#### Option B: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string

### 3. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=3001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/neuroscan
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/neuroscan

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key-here

# JWT Secret (generate a random string)
JWT_SECRET=your-random-secret-key-here

# Encryption (32 characters)
ENCRYPTION_KEY=your-32-character-encryption-key

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 4. Start the Application

#### Terminal 1: Start Backend
```bash
cd backend
npm run dev
# or
bun run dev
```

You should see:
```
✅ MongoDB connected successfully
🚀 NeuroScan AI Backend running on port 3001
```

#### Terminal 2: Start Frontend
```bash
cd NeuroScan-landing-page
npm run dev
# or
bun run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### 5. Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api/health

## Testing the Application

1. **Landing Page**: Visit http://localhost:5173
2. **Start Assessment**: Click "Start Your Assessment"
3. **Chat Interface**: Have a conversation with the AI psychologist
4. **Complete Tests**: Answer PHQ-9 and GAD-7 questions
5. **View Report**: See your mental health screening report

## API Endpoints

### Session Management
- `POST /api/session/start` - Start new session
- `GET /api/session/:sessionId` - Get session state
- `DELETE /api/session/:sessionId` - Delete session

### Chat
- `POST /api/chat/message` - Send message
- `GET /api/chat/:sessionId/history` - Get history

### Tests
- `POST /api/test/response` - Record response
- `GET /api/test/:sessionId/scores` - Get scores

### Reports
- `GET /api/report/:sessionId` - Get report

## Project Structure

```
NeuroScan-landing-page/
├── src/
│   ├── components/       # React components
│   ├── pages/           # Page components
│   │   ├── Index.tsx    # Landing page
│   │   ├── Chat.tsx     # Chat interface
│   │   └── Report.tsx   # Report dashboard
│   ├── App.tsx          # Main app with routing
│   └── main.tsx         # Entry point
├── backend/
│   ├── src/
│   │   ├── models/      # MongoDB models
│   │   ├── services/    # Business logic
│   │   ├── routes/      # API routes
│   │   ├── types/       # TypeScript types
│   │   ├── constants/   # Constants
│   │   └── server.ts    # Main server
│   └── package.json
└── package.json
```

## Features Implemented

✅ Landing page with modern UI
✅ Conversational AI chat interface
✅ PHQ-9 depression screening
✅ GAD-7 anxiety screening
✅ Crisis detection and response
✅ Mental health report generation
✅ Session management
✅ Dark theme UI
✅ Responsive design

## Next Steps

1. **Add Language Analysis**: Implement emotion detection using HuggingFace
2. **Add Voice Input**: Integrate Whisper API for speech-to-text
3. **Add Psychologist Matching**: Create psychologist database and matching logic
4. **Add PDF Export**: Implement report PDF generation
5. **Add User Authentication**: Implement user accounts and history
6. **Add Multi-language Support**: Add Hindi language support

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `brew services list`
- Check connection string in `.env`

### OpenAI API Error
- Verify API key is correct
- Check API key has credits: https://platform.openai.com/usage

### Port Already in Use
- Backend: Change `PORT` in `.env`
- Frontend: Change port in `vite.config.ts`

### CORS Error
- Ensure `CORS_ORIGIN` in backend `.env` matches frontend URL

## Support

For issues or questions, please check:
- Backend logs in terminal
- Browser console for frontend errors
- MongoDB connection status

## License

Proprietary - NeuroScan AI
