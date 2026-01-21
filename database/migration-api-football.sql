-- Add API-Football ID columns to existing tables
-- Run this migration after the initial schema setup

-- Add api_football_id to leagues table
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS api_football_id INTEGER UNIQUE;

-- Add api_football_id to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS api_football_id INTEGER UNIQUE;

-- Add api_football_id to matches table and update status constraint
ALTER TABLE matches ADD COLUMN IF NOT EXISTS api_football_id INTEGER UNIQUE;

-- Drop existing constraint and add new one with 'cancelled' status
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_status_check;
ALTER TABLE matches ADD CONSTRAINT matches_status_check 
  CHECK (status IN ('scheduled', 'live', 'finished', 'cancelled'));

-- Create indexes for API-Football IDs
CREATE INDEX IF NOT EXISTS idx_leagues_api_football_id ON leagues(api_football_id);
CREATE INDEX IF NOT EXISTS idx_teams_api_football_id ON teams(api_football_id);
CREATE INDEX IF NOT EXISTS idx_matches_api_football_id ON matches(api_football_id);

COMMENT ON COLUMN leagues.api_football_id IS 'API-Football league ID for synchronization';
COMMENT ON COLUMN teams.api_football_id IS 'API-Football team ID for synchronization';
COMMENT ON COLUMN matches.api_football_id IS 'API-Football fixture ID for synchronization';
