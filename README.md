# NeuroScan AI

**AI-powered mental health assessment platform** — real-time conversational interviews with Dr. Sarah, multimodal behavioral analysis, and clinical-grade reporting.

---

## What it does

NeuroScan AI guides users through clinically validated mental health assessments (PHQ-9, GAD-7, Stress, General Wellness) via a live AI interview. During the session it simultaneously analyzes:

- **Speech** — real-time transcription, pitch, speed, and energy via Web Audio API
- **Emotion** — HuggingFace transformer model (`j-hartmann/emotion-english-distilroberta-base`) with keyword fallback
- **Behavior** — MediaPipe Pose skeleton overlay for posture, head position, and engagement
- **Responses** — deterministic PHQ/GAD scoring + Gemini-powered empathetic replies

After completion it generates a visual report with charts, an AI-written psychological summary, and download options.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| Charts | Recharts |
| AI Conversation | Google Gemini 2.5 Flash |
| Emotion Detection | HuggingFace Inference API |
| Text-to-Speech | ElevenLabs API (browser TTS fallback) |
| Pose Detection | MediaPipe Pose (CDN) |
| Speech Recognition | Web Speech API (Chrome) |
| Voice Analysis | Web Audio API |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| Auth | JWT |

---

## Project Structure

```
NeuroScan AI/
├── src/
│   ├── pages/
│   │   ├── AssessmentInterview.tsx   # Live AI interview (main feature)
│   │   ├── AssessmentResults.tsx     # Visual report with charts
│   │   ├── Dashboard.tsx             # Patient dashboard + all tabs
│   │   ├── DoctorDashboard.tsx       # Doctor-side appointment management
│   │   └── ...
│   └── components/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── aiInterview.ts        # Interview flow, scoring, summary
│   │   │   └── ...
│   │   └── services/
│   │       ├── AIInterviewService.ts # Gemini + hybrid scoring
│   │       ├── EmotionDetectionService.ts  # HuggingFace emotion
│   │       ├── ElevenLabsService.ts  # TTS
│   │       └── ...
│   └── package.json
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (local)
- Chrome browser (for Web Speech API)

### 1. Clone

```bash
git clone https://github.com/yugallohani/college-final-project.git
cd college-final-project
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Fill in your API keys (see below)
npm install
npm run dev
```

Backend runs on `http://localhost:3001`

### 3. Frontend setup

```bash
# From project root
npm install
# Create .env.local and add your HuggingFace key
echo "VITE_HF_API_KEY=hf_your_token_here" > .env.local
npm run dev
```

Frontend runs on `http://localhost:8080`

### 4. Database

```bash
cd backend
npm run migrate
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=3001
DATABASE_URL=postgresql://user@localhost:5432/neuroscan
GOOGLE_GEMINI_API_KEY=your_gemini_key
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
HUGGINGFACE_API_KEY=hf_your_token
JWT_SECRET=your_secret
```

### Frontend (`.env.local`)

```env
VITE_HF_API_KEY=hf_your_token
```

**Get free API keys:**
- Gemini: [aistudio.google.com](https://aistudio.google.com)
- HuggingFace: [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
- ElevenLabs: [elevenlabs.io](https://elevenlabs.io)

---

## Key Features

### AI Interview (Dr. Sarah)
- Dynamic Gemini-generated introduction each session
- Context-aware empathetic responses (not generic)
- Anti-repetition via conversation history
- Voice-tone-aware replies (slow + low energy → extra warmth)
- 2-second silence detection before submitting answer
- 12-second max-speech interrupt

### Multimodal Analysis
- **HuggingFace emotion** — sadness/anger/fear/joy/neutral/disgust/surprise
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
- Overview with stats and assessment history
- Assessments tab — start PHQ-9, GAD-7, Stress, or General Wellness
- Reports tab — view and download past reports
- Appointments tab — book sessions with dummy doctors
- Doctor Dashboard — approve/reject appointment requests

---

## Test Credentials

```
Email:    yugalmora@gmail.com
Password: test123
```

---

## Notes

- Speech recognition requires **Chrome** (Web Speech API)
- Camera and microphone permissions required for the interview
- MediaPipe Pose loads from CDN — requires internet connection
- HuggingFace free tier may have cold-start delay (~10s) on first call

---

## License

MIT — built as a final semester project.
