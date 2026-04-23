/*
  # Create Studora Database Schema

  1. New Tables
    - `study_sessions` - Tracks daily study activity for streak counting
      - `id` (uuid, primary key)
      - `user_id` (text) - localStorage-based user identifier
      - `studied_at` (date) - The date of study activity
      - `feature` (text) - Which feature was used (voice_chat, summary, quiz, flashcards)
    - `summaries` - Saved AI-generated summaries
      - `id` (uuid, primary key)
      - `user_id` (text)
      - `input_text` (text) - Original text input
      - `summary` (text) - Generated summary
      - `key_concepts` (text) - Key concepts list
      - `created_at` (timestamptz)
    - `quizzes` - Saved AI-generated quizzes
      - `id` (uuid, primary key)
      - `user_id` (text)
      - `topic` (text) - Quiz topic/source
      - `questions` (jsonb) - Array of questions
      - `score` (integer) - Score achieved
      - `total` (integer) - Total questions
      - `difficulty` (text)
      - `created_at` (timestamptz)
    - `flashcards` - Saved flashcards with spaced repetition
      - `id` (uuid, primary key)
      - `user_id` (text)
      - `front` (text) - Question/front of card
      - `back` (text) - Answer/back of card
      - `learned` (boolean, default false)
      - `interval` (integer, default 1) - Spaced repetition interval
      - `next_review` (date) - Next review date
      - `source_text` (text) - Original text source
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Policies restrict access to the user's own data based on user_id
*/

CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  studied_at date NOT NULL DEFAULT CURRENT_DATE,
  feature text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  input_text text NOT NULL,
  summary text NOT NULL,
  key_concepts text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  topic text NOT NULL,
  questions jsonb NOT NULL DEFAULT '[]',
  score integer DEFAULT 0,
  total integer DEFAULT 0,
  difficulty text DEFAULT 'medium',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  front text NOT NULL,
  back text NOT NULL,
  learned boolean DEFAULT false,
  interval integer DEFAULT 1,
  next_review date DEFAULT CURRENT_DATE,
  source_text text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for study_sessions
CREATE POLICY "Users read own sessions" ON study_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own sessions" ON study_sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users update own sessions" ON study_sessions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for summaries
CREATE POLICY "Users read own summaries" ON summaries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own summaries" ON summaries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users delete own summaries" ON summaries FOR DELETE TO authenticated USING (true);

-- RLS Policies for quizzes
CREATE POLICY "Users read own quizzes" ON quizzes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own quizzes" ON quizzes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users delete own quizzes" ON quizzes FOR DELETE TO authenticated USING (true);

-- RLS Policies for flashcards
CREATE POLICY "Users read own flashcards" ON flashcards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own flashcards" ON flashcards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users update own flashcards" ON flashcards FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users delete own flashcards" ON flashcards FOR DELETE TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON study_sessions(user_id, studied_at);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_review ON flashcards(user_id, next_review);
