-- Fix leaderboard views to show all users
CREATE OR REPLACE VIEW leaderboard_view AS
SELECT 
  p.*,
  ROW_NUMBER() OVER (ORDER BY p.total_score DESC, p.created_at ASC) as rank,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY p.total_score DESC, p.created_at ASC) = 1 THEN 'champion'
    WHEN ROW_NUMBER() OVER (ORDER BY p.total_score DESC, p.created_at ASC) <= 3 THEN 'elite'
    WHEN ROW_NUMBER() OVER (ORDER BY p.total_score DESC, p.created_at ASC) <= 10 THEN 'master'
    ELSE 'player'
  END as badge_tier
FROM profiles p;

CREATE OR REPLACE VIEW most_active_view AS
SELECT 
  p.*,
  ROW_NUMBER() OVER (ORDER BY p.games_played DESC, p.last_active DESC) as rank,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY p.games_played DESC, p.last_active DESC) = 1 THEN 'champion'
    WHEN ROW_NUMBER() OVER (ORDER BY p.games_played DESC, p.last_active DESC) <= 3 THEN 'elite'
    WHEN ROW_NUMBER() OVER (ORDER BY p.games_played DESC, p.last_active DESC) <= 10 THEN 'master'
    ELSE 'player'
  END as badge_tier
FROM profiles p;

-- Update existing users with default usernames
UPDATE profiles 
SET username = COALESCE(username, 'Player' || SUBSTRING(id::text, 1, 8))
WHERE username IS NULL OR username = '';

-- Update existing users with default values for new columns
UPDATE profiles SET 
  games_played = COALESCE(games_played, 0),
  last_active = COALESCE(last_active, NOW()),
  gems = COALESCE(gems, 100),
  is_premium = COALESCE(is_premium, false)
WHERE games_played IS NULL OR last_active IS NULL OR gems IS NULL OR is_premium IS NULL;