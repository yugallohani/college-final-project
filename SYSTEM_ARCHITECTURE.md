# NeuroScan AI - System Architecture

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USER BROWSER                         │
│                    http://localhost:5173                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/REST
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Landing    │  │     Chat     │  │    Report    │     │
│  │     Page     │  │     Page     │  │     Page     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         Vite + React + TypeScript + TailwindCSS             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ REST API
                         │
┌────────────────────────▼────────────────────────────────────┐
│              BACKEND (Node.js + Express)                     │
│                  http://localhost:3001                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    API ROUTES                         │  │
│  │  /session  /chat  /test  /report  /auth  /speech    │  │
│  │  /psychologists                                       │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │                   SERVICES                            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │    AI    │  │   Test   │  │ Emotion  │          │  │
│  │  │ Service  │  │  Admin   │  │ Detection│          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │  Crisis  │  │   Auth   │  │   PDF    │          │  │
│  │  │ Detection│  │ Service  │  │  Export  │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │ Whisper  │  │Psycholog.│  │   i18n   │          │  │
│  │  │ Service  │  │ Service  │  │          │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │                   MODELS                              │  │
│  │              Session Model (PostgreSQL)               │  │
│  └────────────────────┬─────────────────────────────────┘  │
└───────────────────────┼──────────────────────────────────────┘
                        │
                        │ SQL
                        │
┌───────────────────────▼──────────────────────────────────────┐
│                  PostgreSQL DATABASE                          │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  users   │  │ sessions │  │ messages │  │   test   │   │
│  │          │  │          │  │          │  │ responses│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ emotion  │  │psycholog.│  │appoint-  │  │  crisis  │   │
│  │ analysis │  │          │  │  ments   │  │   logs   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐                                │
│  │  audit   │  │   user   │                                │
│  │   logs   │  │  prefs   │                                │
│  └──────────┘  └──────────┘                                │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                          │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Google    │  │ HuggingFace  │  │    Ollama    │      │
│  │    Gemini    │  │     APIs     │  │   (Local)    │      │
│  │   (FREE)     │  │   (FREE)     │  │   (FREE)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│       ▲                  ▲                  ▲                │
│       │                  │                  │                │
│   AI Chat          Emotion/Speech      Alternative AI        │
└───────┼──────────────────┼──────────────────┼────────────────┘
        │                  │                  │
        └──────────────────┴──────────────────┘
                           │
                    Backend Services
```

## 📊 Data Flow

### 1. User Starts Conversation

```
User Browser
    │
    ├─► POST /api/session/start
    │
Backend
    │
    ├─► Create session in PostgreSQL
    │
    ├─► AIService.generateGreeting()
    │   │
    │   └─► Google Gemini API
    │
    ├─► Save greeting message
    │
    └─► Return sessionId + greeting
```

### 2. User Sends Message

```
User Browser
    │
    ├─► POST /api/chat/message
    │   { sessionId, message }
    │
Backend
    │
    ├─► Load session from PostgreSQL
    │
    ├─► EmotionDetectionService.detectEmotions()
    │   │
    │   └─► HuggingFace API
    │
    ├─► CrisisDetectionService.check()
    │   │
    │   └─► If crisis: return resources
    │
    ├─► AIService.generateResponse()
    │   │
    │   └─► Google Gemini API
    │
    ├─► Save messages + emotions
    │
    └─► Return AI response
```

### 3. User Completes Tests

```
User Browser
    │
    ├─► POST /api/chat/message (test responses)
    │
Backend
    │
    ├─► TestAdministratorService.recordResponse()
    │
    ├─► Save to test_responses table
    │
    ├─► Check if test complete
    │   │
    │   ├─► If PHQ-9 complete: Start GAD-7
    │   │
    │   └─► If GAD-7 complete: Generate report
    │
    └─► Return next question or completion
```

### 4. Generate Report

```
User Browser
    │
    ├─► GET /api/report/:sessionId
    │
Backend
    │
    ├─► Load session + responses
    │
    ├─► TestAdministratorService.calculateScore()
    │   │
    │   ├─► Calculate PHQ-9 score (0-27)
    │   │
    │   └─► Calculate GAD-7 score (0-21)
    │
    ├─► Classify risk levels
    │   │
    │   ├─► Depression: minimal/mild/moderate/severe
    │   │
    │   └─► Anxiety: minimal/mild/moderate/severe
    │
    ├─► Generate observations + suggestions
    │
    ├─► Save risk_assessment to PostgreSQL
    │
    └─► Return complete report
```

### 5. Export PDF

```
User Browser
    │
    ├─► POST /api/report/:sessionId/export
    │
Backend
    │
    ├─► Load report data
    │
    ├─► PDFExportService.generateReport()
    │   │
    │   └─► Create PDF with PDFKit
    │
    └─► Return PDF file
```

## 🔐 Authentication Flow

```
User Browser
    │
    ├─► POST /api/auth/register
    │   { email, password, name }
    │
Backend
    │
    ├─► Hash password (bcrypt)
    │
    ├─► Save to users table
    │
    ├─► Generate JWT token
    │
    └─► Return { token, user }

User Browser
    │
    ├─► POST /api/auth/login
    │   { email, password }
    │
Backend
    │
    ├─► Find user in database
    │
    ├─► Verify password (bcrypt)
    │
    ├─► Generate JWT token
    │
    └─► Return { token, user }

User Browser
    │
    ├─► Request with Authorization header
    │   Bearer <token>
    │
Backend
    │
    ├─► Verify JWT token
    │
    ├─► Extract userId
    │
    └─► Process request
```

## 🗄️ Database Schema

### Core Tables

```sql
users
├── id (UUID)
├── email (unique)
├── password_hash
├── name
└── created_at

sessions
├── id (UUID)
├── user_id (FK → users)
├── current_phase
├── language_analysis (JSON)
├── risk_assessment (JSON)
└── timestamps

messages
├── id (VARCHAR)
├── session_id (FK → sessions)
├── role (user/assistant)
├── content
├── metadata (JSON)
└── timestamp

test_responses
├── id (SERIAL)
├── session_id (FK → sessions)
├── test_type (phq9/gad7)
├── question_id
├── score (0-3)
└── timestamp

emotion_analysis
├── id (SERIAL)
├── session_id (FK → sessions)
├── message_id
├── emotion
├── confidence
└── timestamp
```

### Supporting Tables

```sql
psychologists
├── id (UUID)
├── name
├── specialization
├── languages
├── rating
└── available

appointments
├── id (UUID)
├── user_id (FK → users)
├── psychologist_id (FK → psychologists)
├── session_id (FK → sessions)
├── scheduled_date
└── status

crisis_logs
├── id (SERIAL)
├── session_id (FK → sessions)
├── severity
├── keywords_detected
└── timestamp

audit_logs
├── id (SERIAL)
├── user_id (FK → users)
├── action
├── details (JSON)
└── timestamp

user_preferences
├── user_id (FK → users)
├── language
├── theme
└── notifications
```

## 🔄 Service Dependencies

```
AIService
├── Uses: GeminiService OR OllamaService
└── Provides: Conversation, Questions, Greetings

TestAdministratorService
├── Uses: Database (test_responses)
└── Provides: Test administration, Scoring

EmotionDetectionService
├── Uses: HuggingFace API
└── Provides: Emotion analysis

CrisisDetectionService
├── Uses: Keyword matching, PHQ-9 item 9
└── Provides: Crisis detection, Resources

WhisperService
├── Uses: HuggingFace Whisper API
└── Provides: Speech-to-text

PDFExportService
├── Uses: PDFKit
└── Provides: PDF generation

AuthService
├── Uses: bcrypt, jsonwebtoken
└── Provides: Authentication, Authorization

PsychologistService
├── Uses: Database (psychologists, appointments)
└── Provides: Matching, Booking
```

## 🌐 API Routes Structure

```
/api
├── /health                    # Health check
├── /session
│   ├── POST /start           # Start new session
│   ├── GET /:id              # Get session details
│   └── DELETE /:id           # Delete session
├── /chat
│   ├── POST /message         # Send message
│   └── GET /:id/history      # Get chat history
├── /test
│   └── (test-related routes)
├── /report
│   ├── GET /:id              # Get report
│   └── POST /:id/export      # Export PDF
├── /auth
│   ├── POST /register        # Register user
│   ├── POST /login           # Login user
│   └── POST /verify          # Verify token
├── /psychologists
│   ├── GET /                 # List psychologists
│   ├── GET /:id              # Get details
│   ├── POST /:id/appointments # Book appointment
│   └── GET /:id/availability # Check availability
└── /speech
    ├── POST /transcribe      # Transcribe audio
    └── GET /status           # Check service status
```

## 🔧 Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **UI Components**: Custom + shadcn/ui
- **State Management**: React hooks
- **HTTP Client**: Fetch API

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 14+
- **ORM**: Native pg driver
- **Authentication**: JWT + bcrypt

### AI & ML
- **Primary AI**: Google Gemini (FREE)
- **Alternative AI**: Ollama (local)
- **Emotion Detection**: HuggingFace
- **Speech-to-Text**: Whisper (HuggingFace)

### DevOps
- **Package Manager**: npm
- **Process Manager**: tsx (development)
- **Database Migrations**: Custom SQL scripts
- **Environment**: dotenv

## 📈 Scalability Considerations

### Current Architecture (MVP)
- Single server instance
- Direct database connections
- Synchronous AI calls
- In-memory session state

### Future Improvements
- Load balancer for multiple instances
- Redis for session caching
- Message queue for AI requests
- CDN for static assets
- Database connection pooling
- Horizontal scaling

## 🔒 Security Features

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Rate limiting
- ✅ Input validation
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection

## 📊 Performance Metrics

### Expected Response Times
- Session start: ~1-2s (includes AI greeting)
- Chat message: ~1-2s (Gemini) or ~2-4s (Ollama)
- Emotion detection: ~500ms-1s
- Report generation: ~500ms
- PDF export: ~1-2s

### Database Queries
- Session lookup: <10ms
- Message save: <5ms
- Test response save: <5ms
- Report generation: <50ms

## 🎯 System Capabilities

### Concurrent Users
- Current: ~100 concurrent users
- With optimization: ~1000+ concurrent users

### Data Storage
- Messages: Unlimited (PostgreSQL)
- Sessions: Unlimited
- Reports: Unlimited

### AI Requests
- Gemini: 1M tokens/month (FREE)
- Ollama: Unlimited (local)
- HuggingFace: 30K requests/month (FREE)

---

This architecture provides a solid foundation for a mental health screening platform with room for growth and optimization.
