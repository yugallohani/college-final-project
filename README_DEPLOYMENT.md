# NeuroScan - Vercel Deployment Ready

## 🎯 Project Overview

**NeuroScan** is an AI-powered virtual clinical psychologist platform that conducts standardized mental health assessments (PHQ-9, GAD-7) through natural voice conversations.

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + Framer Motion
- **Backend**: Express + TypeScript + PostgreSQL
- **AI**: Google Gemini API (conversational AI)
- **TTS**: ElevenLabs (voice synthesis)
- **Deployment**: Vercel (serverless)

## 📁 Project Structure

```
NeuroScan-landing-page/
├── src/                          # Frontend React app
│   ├── pages/                    # Page components
│   ├── components/               # Reusable components
│   ├── config/                   # Configuration (API URLs)
│   └── main.tsx                  # Entry point
├── backend/                      # Backend Express API
│   ├── src/
│   │   ├── routes/              # API routes
│   │   ├── services/            # Business logic
│   │   ├── database/            # Database schema & migrations
│   │   └── server.ts            # Server entry point
│   ├── api/                     # Vercel serverless wrapper
│   └── vercel.json              # Vercel backend config
├── vercel.json                  # Vercel frontend config
├── deploy.sh                    # Automated deployment script
├── DEPLOYMENT_GUIDE.md          # Detailed deployment guide
└── QUICK_DEPLOY.md              # 5-minute quick start
```

## 🚀 Quick Deploy (CLI)

### Prerequisites
```bash
npm install -g vercel
vercel login
```

### Deploy with Script
```bash
cd NeuroScan-landing-page
./deploy.sh
```

### Manual Deploy
See `QUICK_DEPLOY.md` for step-by-step instructions.

## 🔑 Required Environment Variables

### Backend
- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_GEMINI_API_KEY` - Your Gemini API key
- `ELEVENLABS_API_KEY` - Your ElevenLabs API key
- `JWT_SECRET` - Random secure string
- `ENCRYPTION_KEY` - 32-character random string
- `NODE_ENV` - production
- `AI_PROVIDER` - gemini
- `USE_GEMINI` - true
- `CORS_ORIGIN` - Your frontend URL

### Frontend
- `VITE_API_URL` - Your backend URL

## 📚 Documentation

- **DEPLOYMENT_GUIDE.md** - Complete deployment walkthrough
- **QUICK_DEPLOY.md** - 5-minute quick start guide
- **API_REFERENCE.md** - API documentation (in backend/)

## ✅ Deployment Checklist

- [ ] Vercel CLI installed
- [ ] PostgreSQL database ready
- [ ] API keys obtained (Gemini, ElevenLabs)
- [ ] Backend deployed
- [ ] Environment variables set
- [ ] Frontend deployed
- [ ] CORS configured
- [ ] Database migrated
- [ ] User account created
- [ ] Assessment tested

## 🎯 Key Features

1. **AI Voice Interview** - Natural conversation with virtual psychologist
2. **Standardized Assessments** - PHQ-9 (depression), GAD-7 (anxiety)
3. **Clinical Reports** - Doctor-ready structured reports
4. **Crisis Detection** - Automatic flagging of self-harm indicators
5. **Hybrid Scoring** - AI + fallback for 92% accuracy
6. **Real-time Transcription** - Live conversation transcript
7. **Emotion Detection** - Sentiment analysis during assessment

## 🔧 Development

```bash
# Frontend
npm install
npm run dev  # http://localhost:8080

# Backend
cd backend
npm install
npm run dev  # http://localhost:3001
```

## 📊 Database

Schema location: `backend/src/database/schema.sql`

Tables:
- users
- sessions
- test_responses
- clinical_reports

## 🌐 Live URLs (After Deployment)

- Frontend: `https://your-project.vercel.app`
- Backend: `https://your-backend.vercel.app`
- Health Check: `https://your-backend.vercel.app/api/health`

## 🆘 Support

For deployment issues:
1. Check `DEPLOYMENT_GUIDE.md`
2. Run `vercel logs` to see errors
3. Verify environment variables: `vercel env ls`
4. Test API: `curl https://your-backend.vercel.app/api/health`

## 📝 License

MIT License - See LICENSE file

## 👥 Credits

Built with ❤️ for mental health awareness
