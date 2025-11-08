-- USERS ------------------------------------------------------
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL
);

-- FEEDBACK FORMS ---------------------------------------------
CREATE TABLE feedback_forms (
    form_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL
);

-- QUESTIONS ---------------------------------------------------
CREATE TABLE questions (
    question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES feedback_forms(form_id) ON DELETE CASCADE,
    question_text TEXT NOT NULL
);

-- FEEDBACK RESPONSES -----------------------------------------
CREATE TABLE feedback_responses (
    response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES feedback_forms(form_id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES users(user_id),
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- RESPONSE ANSWERS (normalized) -------------------------------
CREATE TABLE response_answers (
    answer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES feedback_responses(response_id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
    answer_text TEXT
);

-- OPINIONS -----------------------------------------------------
CREATE TABLE opinions (
    opinion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submitted_by UUID REFERENCES users(user_id),
    content TEXT NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ENGINES (LLM / Analytics engines) ---------------------------
CREATE TABLE engines (
    engine_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    version TEXT
);

-- ANALYTICS ----------------------------------------------------
-- Polymorphic via 3 nullable FKs (Option A)
CREATE TABLE analytics (
    analytics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result JSONB NOT NULL,
    engine_id UUID NOT NULL REFERENCES engines(engine_id),
    
    opinion_id UUID REFERENCES opinions(opinion_id),
    form_id UUID REFERENCES feedback_forms(form_id),
    response_id UUID REFERENCES feedback_responses(response_id),
    
    analyzed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for faster querying
CREATE INDEX idx_questions_form ON questions(form_id);
CREATE INDEX idx_responses_form ON feedback_responses(form_id);
CREATE INDEX idx_answers_response ON response_answers(response_id);
CREATE INDEX idx_answers_question ON response_answers(question_id);

INSERT INTO engines (engine_id, name, version)
VALUES ('00000000-0000-0000-0000-000000000000', 'TextBlob', '1.0')
ON CONFLICT DO NOTHING;
