# NeuroScan AI Backend

AI Virtual Clinical Psychologist backend service for mental health screening.

## Features

- Conversational AI using OpenAI GPT-4
- PHQ-9 and GAD-7 psychological test administration
- Crisis detection and response
- Real-time language and emotion analysis
- Secure session management
- HIPAA-compliant data handling

## Setup

### Prerequisites

- Node.js 18+ or Bun
- MongoDB
- OpenAI API key

### Installation

```bash
cd backend
npm install
# or
bun install
```

### Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your credentials:
```env
MONGODB_URI=mongodb://localhost:27017/neuroscan
OPENAI_API_KEY=your_openai_api_key
```

### Running

Development:
```bash
npm run dev
# or
bun run dev
```

Production:
```bash
npm run build
npm start
```

## API Endpoints

### Session Management
- `POST /api/session/start` - Start new screening session
- `GET /api/session/:sessionId` - Get session state
- `DELETE /api/session/:sessionId` - Delete session
- `GET /api/session/history` - Get user session history

### Chat
- `POST /api/chat/message` - Send message and get AI response
- `GET /api/chat/:sessionId/history` - Get conversation history

### Tests
- `POST /api/test/response` - Record test response
- `GET /api/test/:sessionId/scores` - Get test scores
- `GET /api/test/options` - Get response options

### Reports
- `GET /api/report/:sessionId` - Get screening report
- `POST /api/report/:sessionId/export` - Export report (PDF/HTML)

## Architecture

```
backend/
├── src/
│   ├── models/          # MongoDB models
│   ├── services/        # Business logic
│   ├── routes/          # API routes
│   ├── types/           # TypeScript types
│   ├── constants/       # Constants and config
│   └── server.ts        # Main server file
├── package.json
└── tsconfig.json
```

## Security

- TLS 1.3 encryption
- AES-256 data encryption at rest
- Rate limiting
- CORS protection
- Helmet security headers
- Data anonymization before external API calls

## License

Proprietary
