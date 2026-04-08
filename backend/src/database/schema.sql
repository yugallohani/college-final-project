-- NeuroScan AI Database Schema for PostgreSQL

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    current_phase VARCHAR(50) DEFAULT 'conversation',
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test responses table
CREATE TABLE IF NOT EXISTS test_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    question_id VARCHAR(50) NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Language analysis table
CREATE TABLE IF NOT EXISTS language_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    negative_self_talk FLOAT DEFAULT 0,
    hopelessness FLOAT DEFAULT 0,
    cognitive_distortions JSONB,
    linguistic_complexity FLOAT DEFAULT 0,
    negative_positive_ratio FLOAT DEFAULT 0,
    confidence_score FLOAT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Emotion analysis table
CREATE TABLE IF NOT EXISTS emotion_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    emotion VARCHAR(50) NOT NULL,
    intensity FLOAT NOT NULL CHECK (intensity >= 0 AND intensity <= 100),
    valence VARCHAR(20) NOT NULL CHECK (valence IN ('positive', 'negative', 'mixed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Risk assessments table
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    depression_score INTEGER NOT NULL,
    depression_classification VARCHAR(50) NOT NULL,
    anxiety_score INTEGER NOT NULL,
    anxiety_classification VARCHAR(50) NOT NULL,
    confidence_interval JSONB,
    key_observations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Psychologists table
CREATE TABLE IF NOT EXISTS psychologists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    specialization JSONB NOT NULL,
    experience INTEGER NOT NULL,
    credentials JSONB NOT NULL,
    rating FLOAT DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    availability JSONB,
    bio TEXT,
    profile_image VARCHAR(500),
    languages JSONB DEFAULT '["en"]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    psychologist_id UUID REFERENCES psychologists(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id),
    appointment_date TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audio uploads table
CREATE TABLE IF NOT EXISTS audio_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    transcription TEXT,
    duration FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_test_responses_session_id ON test_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_emotion_analysis_session_id ON emotion_analysis(session_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_psychologist_id ON appointments(psychologist_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_psychologists_updated_at BEFORE UPDATE ON psychologists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
