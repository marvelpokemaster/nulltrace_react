-- ===========================================================
-- NULLTRACE DATABASE SETUP (final, compatible with app.py)
-- ===========================================================

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- ==================== USERS ====================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    password TEXT,
    role TEXT DEFAULT 'user'
);

-- Default admin (username=admin, password=admin)
INSERT INTO users (user_id, name, password, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin',
    '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', -- SHA256('admin')
    'admin'
);

-- ==================== ENGINES ====================
CREATE TABLE engines (
    engine_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    version TEXT
);

INSERT INTO engines (engine_id, name, version)
VALUES ('00000000-0000-0000-0000-000000000100', 'DefaultEngine', '1.0');

-- ==================== OPINION TARGETS ====================
CREATE TABLE opinion_targets (
    target_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO opinion_targets (target_id, name, category)
VALUES ('00000000-0000-0000-0000-000000000200', 'Cyphr', 'App');

-- ==================== OPINIONS ====================
CREATE TABLE opinions (
    opinion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submitted_by UUID REFERENCES users(user_id),
    target_id UUID REFERENCES opinion_targets(target_id),
    content TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT NOW()
);

-- ==================== FEEDBACK SYSTEM ====================

CREATE TABLE feedback_forms (
    form_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL
);

CREATE TABLE questions (
    question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES feedback_forms(form_id) ON DELETE CASCADE,
    question_text TEXT NOT NULL
);

CREATE TABLE feedback_responses (
    response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES feedback_forms(form_id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES users(user_id),
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE response_answers (
    answer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES feedback_responses(response_id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
    answer_text TEXT
);

-- Default feedback form & question
INSERT INTO feedback_forms (form_id, created_by, title)
VALUES ('00000000-0000-0000-0000-000000000300', '00000000-0000-0000-0000-000000000001', 'Default Feedback Form');

INSERT INTO questions (question_id, form_id, question_text)
VALUES ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000300', 'What is your feedback?');

-- ==================== ANALYTICS ====================
CREATE TABLE analytics (
    analytics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result JSONB NOT NULL,
    engine_id UUID NOT NULL REFERENCES engines(engine_id),
    opinion_id UUID REFERENCES opinions(opinion_id) ON DELETE CASCADE,
    form_id UUID REFERENCES feedback_forms(form_id) ON DELETE CASCADE,
    response_id UUID REFERENCES feedback_responses(response_id) ON DELETE CASCADE,
    analyzed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_questions_form ON questions(form_id);
CREATE INDEX idx_responses_form ON feedback_responses(form_id);
CREATE INDEX idx_answers_response ON response_answers(response_id);
CREATE INDEX idx_answers_question ON response_answers(question_id);
CREATE INDEX idx_analytics_opinion ON analytics(opinion_id);
CREATE INDEX idx_analytics_response ON analytics(response_id);

-- ==================== SAMPLE DATA ====================
INSERT INTO feedback_responses (response_id, form_id, submitted_by)
VALUES ('00000000-0000-0000-0000-000000000400', '00000000-0000-0000-0000-000000000300', '00000000-0000-0000-0000-000000000001');

INSERT INTO response_answers (answer_id, response_id, question_id, answer_text)
VALUES ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000400', '00000000-0000-0000-0000-000000000301', 'Great work! Keep it up!');

INSERT INTO analytics (analytics_id, result, engine_id, response_id)
VALUES (
    '00000000-0000-0000-0000-000000000402',
    '{"type": "feedback", "sentiment": "positive", "rating": 5}'::jsonb,
    '00000000-0000-0000-0000-000000000100',
    '00000000-0000-0000-0000-000000000400'
);

COMMIT;
