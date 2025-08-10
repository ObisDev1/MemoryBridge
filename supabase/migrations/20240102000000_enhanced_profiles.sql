-- Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN country TEXT;
ALTER TABLE profiles ADD COLUMN games_played INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN gems INTEGER DEFAULT 100;
ALTER TABLE profiles ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;

-- Create leaderboard view with rankings
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
FROM profiles p
WHERE p.total_score > 0;

-- Create most active players view
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
FROM profiles p
WHERE p.games_played > 0;

-- Function to update games played and last active
CREATE OR REPLACE FUNCTION update_user_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET 
    games_played = games_played + 1,
    last_active = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update activity on new game session
CREATE TRIGGER on_game_session_created
  AFTER INSERT ON game_sessions
  FOR EACH ROW EXECUTE FUNCTION update_user_activity();

-- Add RLS policies for public profile viewing
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policy for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add indexes for performance
CREATE INDEX idx_profiles_total_score ON profiles(total_score DESC);
CREATE INDEX idx_profiles_games_played ON profiles(games_played DESC);
CREATE INDEX idx_profiles_country ON profiles(country);
CREATE INDEX idx_profiles_last_active ON profiles(last_active DESC);