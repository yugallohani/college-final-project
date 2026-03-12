# NeuroScan AI - AI Virtual Clinical Psychologist

An AI-powered mental health screening platform that conducts conversational assessments, administers psychological tests (PHQ-9, GAD-7), and generates comprehensive mental health reports.

## 🚀 Quick Start

**👉 Your Gemini API key is configured! Just run:**

```bash
./quick-setup.sh
```

Then:

```bash
./start-project.sh
```

**That's it!** Open http://localhost:5173 in your browser.

**📖 Detailed instructions:** [HOW_TO_RUN.md](HOW_TO_RUN.md)

## 📚 Documentation

### Getting Started
- **[Getting Started Checklist](GETTING_STARTED_CHECKLIST.md)** - Step-by-step setup guide ⭐ START HERE
- **[Quick Reference](QUICK_REFERENCE.md)** - Commands, API endpoints, and tips
- **[Run Project](RUN_PROJECT.md)** - How to run the project

### Setup & Configuration
- **[Complete Setup Guide](COMPLETE_SETUP_GUIDE.md)** - Detailed setup instructions
- **[AI Providers Comparison](AI_PROVIDERS_COMPARISON.md)** - Gemini vs Ollama vs OpenAI
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

### Project Information
- **[Implementation Status](IMPLEMENTATION_STATUS.md)** - What's done and what's left
- **[Project Summary](PROJECT_SUMMARY.md)** - Technical overview
- **[What's New](WHATS_NEW.md)** - Recent changes and updates
- **[API Reference](NeuroScan-landing-page/backend/API_REFERENCE.md)** - Backend API documentation

## ✨ Features

### Core Features
- 🤖 AI-powered conversational psychologist (Google Gemini)
- 📋 PHQ-9 depression screening (9 questions)
- 😰 GAD-7 anxiety screening (7 questions)
- 📊 Comprehensive mental health reports
- 🚨 Crisis detection and resources
- 🌍 Multilingual support (English + Hindi)

### Advanced Features
- 😊 Emotion detection (HuggingFace)
- 🎤 Voice input (Whisper)
- 📄 PDF report export
- 👨‍⚕️ Psychologist matching
- 🔐 User authentication (JWT)
- 📱 Responsive design

## 🛠️ Tech Stack

### Backend
- Node.js + Express + TypeScript
- PostgreSQL database
- Google Gemini AI (FREE)
- HuggingFace APIs
- JWT authentication

### Frontend
- React + TypeScript
- Vite
- TailwindCSS
- Modern UI components

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Google Gemini API key (FREE - get from https://makersuite.google.com/app/apikey)

## 🎯 Project Structure

```
NeuroScan-landing-page/
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic (AI, tests, etc.)
│   │   ├── models/          # Data models
│   │   ├── database/        # Schema & migrations
│   │   └── server.ts        # Main server
│   └── .env                 # Configuration
└── src/
    ├── pages/               # React pages
    ├── components/          # UI components
    └── App.tsx              # Main app
```

## 🔌 API Endpoints

- `POST /api/session/start` - Start new session
- `POST /api/chat/message` - Send message
- `GET /api/report/:sessionId` - Get report
- `POST /api/report/:sessionId/export` - Export PDF
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/psychologists` - List psychologists
- `POST /api/speech/transcribe` - Transcribe audio

See [API Reference](NeuroScan-landing-page/backend/API_REFERENCE.md) for details.

## 🧪 Testing

```bash
# Test backend health
curl http://localhost:3001/api/health

# Start a session
curl -X POST http://localhost:3001/api/session/start \
  -H "Content-Type: application/json" \
  -d '{"language": "en"}'
```

## 📊 Implementation Status

- ✅ Backend Core (95%)
- ✅ AI Integration (100%)
- ✅ Database (100%)
- ✅ API Routes (100%)
- ✅ Services (90%)
- ✅ Frontend Landing (100%)
- ⚠️ Frontend Chat (40%)
- ⚠️ Frontend Report (40%)
- ⚠️ Testing (20%)

See [Implementation Status](IMPLEMENTATION_STATUS.md) for details.

## 🎓 Academic Context

This is a college final project demonstrating:
- Full-stack web development
- AI/ML integration
- Healthcare technology
- Database design
- API development
- Modern UI/UX

## 📝 License

This project is for educational purposes.

## 🤝 Contributing

This is a college project, but suggestions are welcome!

## 🆘 Need Help?

1. Check [Getting Started Checklist](GETTING_STARTED_CHECKLIST.md)
2. Review [Troubleshooting Guide](TROUBLESHOOTING.md)
3. Read [Quick Reference](QUICK_REFERENCE.md)
4. Check backend logs in terminal
5. Check browser console (F12)

## 🎉 Credits

Built with:
- Google Gemini AI
- HuggingFace
- PostgreSQL
- React + Vite
- TailwindCSS

---

**Ready to start?** Follow the [Getting Started Checklist](GETTING_STARTED_CHECKLIST.md)!
