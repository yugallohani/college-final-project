# NeuroScan AI

> AI-powered mental health assessment platform — real-time conversational interviews, multimodal behavioral analysis, and clinical-grade reporting.

**Live Demo:** https://neuroscan-frontend-alpha.vercel.app  
**Backend API:** https://neuroscan-backend-ar1p.onrender.com/api/health

---

## Overview

NeuroScan AI guides users through clinically validated mental health assessments (PHQ-9, GAD-7, Stress, General Wellness) via a live AI interview with Dr. Sarah — a virtual clinical psychologist. During the session, the system simultaneously analyzes:

- **Speech** — real-time transcription, pitch, speed, and energy via Web Audio API
- **Emotion** — HuggingFace transformer model (`j-hartmann/emotion-english-distilroberta-base`) with keyword fallback
- **Behavior** — MediaPipe Pose skeleton overlay for posture, head position, and engagement
- **Responses** — deterministic PHQ/GAD scoring + Gemini-powered empathetic replies

After completion, a visual report is generated with charts, an AI-written psychological summary, and download options. The dashboard updates dynamically with mood trends, health circles, and AI-recommended doctors.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| Charts | Recharts |
| AI Conversation | Google Gemini 2.5 Flash |
| Emotion Detection | HuggingFace Inference API (`j-hartmann/emotion-english-distilroberta-base`) |
| Text-to-Speech | ElevenLabs API (browser TTS fallback) |
| Pose Detection | MediaPipe Pose (CDN) |
| Speech Recognition | Web Speech API (Chrome) |
| Voice Analysis | Web Audio API |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| Auth | JWT |
| Deployment | Vercel (frontend) + Render (backend + DB) |

---

## Project Structure

```
NeuroScan AI/
├── src/                          # React frontend
│   ├── pages/
│   │   ├── AssessmentInterview.tsx   # Live AI interview (core feature)
│   │   ├── AssessmentResults.tsx     # Visual report with charts
│   │   ├── Dashboard.tsx             # Patient dashboard + all tabs
│   │   └── ...
│   └── components/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── aiInterview.ts        # Interview flow, scoring, summary
│   │   │   ├── doctors.ts            # Location-based doctor search
│   │   │   └── ...
│   │   └── services/
│   │       ├── AIInterviewService.ts     # Gemini + hybrid scoring
│   │       ├── EmotionDetectionService.ts # HuggingFace emotion
│   │       ├── ElevenLabsService.ts       # TTS
│   │       └── ...
│   └── package.json
└── package.json
```

---

## Key Features

### AI Interview (Dr. Sarah)
- Dynamic Gemini-generated introduction each session
- Context-aware empathetic responses — references what the user actually said
- Anti-repetition via conversation history
- Voice-tone-aware replies (slow + low energy → extra warmth)
- 2-second silence detection before submitting answer
- 12-second max-speech gentle interrupt
- Continuous speech recognition with auto-restart

### Multimodal Analysis
- **HuggingFace emotion** — sadness/anger/fear/joy/neutral/disgust/surprise (real API)
- **Web Audio pitch/energy** — real mic frequency data, not simulated
- **MediaPipe skeleton** — purple overlay on video feed, updates every frame
- **Behavioral heuristics** — posture stability, head centering, engagement level

### Report Page
- Pie chart — response distribution
- Line chart — score trend per question
- Bar chart — voice analysis (energy/pitch/speed)
- Radar chart — behavioral signals
- Gemini-generated psychological summary
- Download as TXT or JSON

### Dashboard
- Live stats from real assessment history (no hardcoded values)
- Mood over time — gradient area chart with glow
- 4 animated health circles (Depression/Anxiety/Stress/Wellness)
- Assessments tab — start PHQ-9, GAD-7, Stress, or General Wellness
- Reports tab — view and download past reports
- Appointments tab — location-based doctor discovery (Delhi NCR)
  - Simulated permission flow → fetching → skeleton cards → staggered results
  - AI-filtered doctors based on assessment condition
  - Full booking flow with confirmation screen
- Resources tab — crisis helplines, self-help tools, therapist directories
- Doctor Dashboard — approve/reject appointment requests

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (local)
- Chrome browser (for Web Speech API)

### 1. Clone

```bash
git clone https://github.com/yugallohani/college-final-project.git
cd college-final-project/NeuroScan\ AI
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Fill in API keys (see Environment Variables below)
npm install
npm run dev
# Runs on http://localhost:3001
```

### 3. Frontend

```bash
# From NeuroScan AI/
npm install
# Create .env.local with your HuggingFace key
echo "VITE_HF_API_KEY=hf_your_token_here" > .env.local
npm run dev
# Runs on http://localhost:8080
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://user@localhost:5432/neuroscan
GOOGLE_GEMINI_API_KEY=your_gemini_key
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
USE_ELEVENLABS=true
HUGGINGFACE_API_KEY=hf_your_token
JWT_SECRET=your_secret
AI_PROVIDER=gemini
USE_GEMINI=true
CORS_ORIGIN=http://localhost:8080
```

### Frontend (`.env.local`)

```env
VITE_HF_API_KEY=hf_your_token
```

**Free API keys:**
- Gemini: [aistudio.google.com](https://aistudio.google.com)
- HuggingFace: [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
- ElevenLabs: [elevenlabs.io](https://elevenlabs.io)

---

## Test Credentials

```
Email:    yugalmora@gmail.com
Password: test123
```

---

## Assessment Types

| Assessment | Questions | Scale | Measures |
|---|---|---|---|
| PHQ-9 | 9 | 0–27 | Depression severity |
| GAD-7 | 7 | 0–21 | Anxiety severity |
| Stress | 8 | 0–24 | Stress levels |
| General Wellness | 8 | 0–24 | Overall mental health |

**Severity mapping:**
- 0–15% → Minimal
- 16–33% → Mild
- 34–50% → Moderate
- 51–67% → Moderately Severe
- 68%+ → Severe

---

## Research Foundation

The assessment instruments used are clinically validated:

- [PHQ-9 — Patient Health Questionnaire](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1495268/)
- [GAD-7 — Generalized Anxiety Disorder Scale](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1495268/)
- [LLMs as Mental Health Screening Assistants](https://www.nature.com/articles/s44184-024-00060-z) — npj Mental Health Research, 2024
- [Conversational AI for Depression Screening](https://www.nature.com/articles/s41746-024-01100-4) — Nature Digital Medicine, 2025
- [Transformer Architectures for Anxiety Detection](https://proceedings.neurips.cc/paper_files/paper/2024) — NeurIPS, 2024

---

## Notes

- Speech recognition requires **Chrome** (Web Speech API)
- Camera and microphone permissions required for the interview
- MediaPipe Pose loads from CDN — requires internet connection
- Render free tier spins down after 15 min inactivity — first request may take ~30s to wake up

---

## License

MIT — built as a final semester project.
