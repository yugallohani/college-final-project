# NeuroScan AI - API Reference

Base URL: `http://localhost:3001/api`

## Session Management

### Start New Session
```http
POST /session/start
Content-Type: application/json

{
  "userId": "optional-user-id",
  "language": "en"
}
```

**Response:**
```json
{
  "sessionId": "507f1f77bcf86cd799439011",
  "message": "Hello! I'm here to help you...",
  "phase": "conversation"
}
```

### Get Session State
```http
GET /session/:sessionId
```

**Response:**
```json
{
  "sessionId": "507f1f77bcf86cd799439011",
  "currentPhase": "phq9",
  "messageCount": 12,
  "phq9Progress": "5/9",
  "gad7Progress": "0/7",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:15:00.000Z"
}
```

### Delete Session
```http
DELETE /session/:sessionId
```

**Response:**
```json
{
  "message": "Session deleted successfully"
}
```

## Chat

### Send Message
```http
POST /chat/message
Content-Type: application/json

{
  "sessionId": "507f1f77bcf86cd799439011",
  "message": "I've been feeling down lately"
}
```

**Response (Normal):**
```json
{
  "message": "I understand. Can you tell me more about...",
  "phase": "conversation",
  "crisis": false
}
```

**Response (Crisis Detected):**
```json
{
  "message": "I'm concerned about what you've shared...",
  "crisis": true,
  "resources": {
    "hotline": "988 (Suicide & Crisis Lifeline)",
    "emergency": "911",
    "text": "Text HOME to 741741",
    "international": "1-800-273-8255"
  },
  "phase": "conversation"
}
```

### Get Chat History
```http
GET /chat/:sessionId/history
```

**Response:**
```json
{
  "messages": [
    {
      "id": "msg_1234567890",
      "role": "assistant",
      "content": "Hello! I'm here to help...",
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "msg_1234567891",
      "role": "user",
      "content": "I've been feeling anxious",
      "timestamp": "2024-01-01T00:01:00.000Z"
    }
  ],
  "phase": "conversation"
}
```

## Tests

### Record Test Response
```http
POST /test/response
Content-Type: application/json

{
  "sessionId": "507f1f77bcf86cd799439011",
  "questionId": "phq9_1",
  "score": 2
}
```

**Response:**
```json
{
  "message": "Response recorded successfully"
}
```

### Get Test Scores
```http
GET /test/:sessionId/scores
```

**Response:**
```json
{
  "phq9": {
    "score": 14,
    "classification": "moderate"
  },
  "gad7": {
    "score": 9,
    "classification": "mild"
  }
}
```

### Get Response Options
```http
GET /test/options
```

**Response:**
```json
{
  "options": [
    { "value": 0, "label": "Not at all" },
    { "value": 1, "label": "Several days" },
    { "value": 2, "label": "More than half the days" },
    { "value": 3, "label": "Nearly every day" }
  ]
}
```

## Reports

### Get Screening Report
```http
GET /report/:sessionId
```

**Response:**
```json
{
  "sessionId": "507f1f77bcf86cd799439011",
  "phq9Score": 14,
  "phq9Classification": "moderate",
  "gad7Score": 9,
  "gad7Classification": "mild",
  "emotions": [],
  "keyObservations": [
    "Moderate depression symptoms detected",
    "Sleep disturbance indicators present"
  ],
  "suggestions": [
    "Practice relaxation techniques",
    "Maintain consistent sleep schedule",
    "Consider speaking with a mental health professional"
  ],
  "timestamp": "2024-01-01T00:30:00.000Z",
  "crisisDetected": false
}
```

### Export Report
```http
POST /report/:sessionId/export
Content-Type: application/json

{
  "format": "pdf"
}
```

**Response:**
```json
{
  "error": "Export functionality coming soon"
}
```

## Health Check

### Check API Health
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "NeuroScan AI Backend"
}
```

## Error Responses

All endpoints may return error responses in this format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error
- `501` - Not Implemented

## Rate Limiting

- Window: 15 minutes
- Max Requests: 100 per window
- Applies to all `/api/*` endpoints

## PHQ-9 Questions

1. `phq9_1` - Little interest or pleasure in doing things
2. `phq9_2` - Feeling down, depressed, or hopeless
3. `phq9_3` - Trouble falling or staying asleep, or sleeping too much
4. `phq9_4` - Feeling tired or having little energy
5. `phq9_5` - Poor appetite or overeating
6. `phq9_6` - Feeling bad about yourself or that you are a failure
7. `phq9_7` - Trouble concentrating on things
8. `phq9_8` - Moving or speaking slowly, or being fidgety or restless
9. `phq9_9` - Thoughts that you would be better off dead or of hurting yourself

## GAD-7 Questions

1. `gad7_1` - Feeling nervous, anxious, or on edge
2. `gad7_2` - Not being able to stop or control worrying
3. `gad7_3` - Worrying too much about different things
4. `gad7_4` - Trouble relaxing
5. `gad7_5` - Being so restless that it is hard to sit still
6. `gad7_6` - Becoming easily annoyed or irritable
7. `gad7_7` - Feeling afraid as if something awful might happen

## Score Classifications

### PHQ-9 (Depression)
- `minimal`: 0-4
- `mild`: 5-9
- `moderate`: 10-14
- `moderately_severe`: 15-19
- `severe`: 20-27

### GAD-7 (Anxiety)
- `minimal`: 0-4
- `mild`: 5-9
- `moderate`: 10-14
- `severe`: 15-21

## Example Usage (JavaScript)

```javascript
// Start session
const startSession = async () => {
  const response = await fetch('http://localhost:3001/api/session/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'en' })
  });
  return await response.json();
};

// Send message
const sendMessage = async (sessionId, message) => {
  const response = await fetch('http://localhost:3001/api/chat/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message })
  });
  return await response.json();
};

// Get report
const getReport = async (sessionId) => {
  const response = await fetch(`http://localhost:3001/api/report/${sessionId}`);
  return await response.json();
};
```
