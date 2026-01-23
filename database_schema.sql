-- Database Schema for Love Rewards Calendar & Perfect Games

-- ============================================
-- Table: activities
-- Description: Stores user calendar activities/meetings
-- ============================================

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  color VARCHAR(7) DEFAULT '#8B4789',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_start_time ON activities(start_time);
CREATE INDEX IF NOT EXISTS idx_activities_user_time ON activities(user_id, start_time);

-- Row Level Security (RLS) Policies
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Users can only see their own activities
CREATE POLICY "Users can view own activities" 
  ON activities FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own activities
CREATE POLICY "Users can insert own activities" 
  ON activities FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own activities
CREATE POLICY "Users can update own activities" 
  ON activities FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own activities
CREATE POLICY "Users can delete own activities" 
  ON activities FOR DELETE 
  USING (auth.uid() = user_id);


-- ============================================
-- Table: perfect_games
-- Description: Tracks perfect game completions
-- ============================================

CREATE TABLE IF NOT EXISTS perfect_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_type VARCHAR(50) NOT NULL, -- 'memory', 'trivia', 'puzzle'
  difficulty VARCHAR(20), -- '3x3', '4x4', '5x5', etc.
  score INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_perfect_games_user_id ON perfect_games(user_id);
CREATE INDEX IF NOT EXISTS idx_perfect_games_game_type ON perfect_games(game_type);
CREATE INDEX IF NOT EXISTS idx_perfect_games_completed_at ON perfect_games(completed_at);

-- Row Level Security (RLS) Policies
ALTER TABLE perfect_games ENABLE ROW LEVEL SECURITY;

-- Users can only see their own perfect games
CREATE POLICY "Users can view own perfect games" 
  ON perfect_games FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own perfect games
CREATE POLICY "Users can insert own perfect games" 
  ON perfect_games FOR INSERT 
  WITH CHECK (auth.uid() = user_id);


-- ============================================
-- Optional: Trigger to update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_activities_updated_at 
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
