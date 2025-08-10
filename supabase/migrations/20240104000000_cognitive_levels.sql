-- Add cognitive level to profiles
ALTER TABLE profiles ADD COLUMN cognitive_level INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN cognitive_badge TEXT DEFAULT 'Mind Spark';

-- Create cognitive levels table
CREATE TABLE cognitive_levels (
  level INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  min_memory_strength INTEGER NOT NULL,
  min_focus_duration INTEGER NOT NULL,
  min_distraction_resistance INTEGER NOT NULL,
  min_context_switching_speed INTEGER NOT NULL
);

-- Insert cognitive levels with gaming names
INSERT INTO cognitive_levels (level, name, description, icon, min_memory_strength, min_focus_duration, min_distraction_resistance, min_context_switching_speed) VALUES
(1, 'Mind Spark', 'The journey begins with a spark of potential', '✨', 0, 0, 0, 0),
(2, 'Neural Novice', 'Basic neural pathways are forming', '🧠', 25, 25, 25, 25),
(3, 'Synapse Seeker', 'Connections are strengthening rapidly', '⚡', 40, 40, 40, 40),
(4, 'Memory Weaver', 'Weaving complex patterns of thought', '🕸️', 55, 55, 55, 55),
(5, 'Focus Guardian', 'Guardian of unwavering concentration', '🛡️', 70, 70, 70, 70),
(6, 'Cognitive Knight', 'A warrior of mental prowess', '⚔️', 80, 80, 80, 80),
(7, 'Mind Master', 'Master of mental domains', '🎭', 90, 90, 90, 90),
(8, 'Neural Sage', 'Wisdom flows through neural networks', '🧙', 95, 95, 95, 95),
(9, 'Thought Architect', 'Architect of complex mental structures', '🏗️', 98, 98, 98, 98),
(10, 'Consciousness Titan', 'Titan of pure mental energy', '👑', 100, 100, 100, 100);

-- Function to calculate and update cognitive level
CREATE OR REPLACE FUNCTION update_cognitive_level()
RETURNS TRIGGER AS $$
DECLARE
  new_level INTEGER;
  new_badge TEXT;
BEGIN
  -- Calculate the new cognitive level based on all 4 stats
  SELECT level, name INTO new_level, new_badge
  FROM cognitive_levels
  WHERE NEW.memory_strength >= min_memory_strength
    AND NEW.focus_duration >= min_focus_duration
    AND NEW.distraction_resistance >= min_distraction_resistance
    AND NEW.context_switching_speed >= min_context_switching_speed
  ORDER BY level DESC
  LIMIT 1;

  -- Update the profile with new cognitive level
  UPDATE profiles 
  SET 
    cognitive_level = COALESCE(new_level, 1),
    cognitive_badge = COALESCE(new_badge, 'Mind Spark')
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update cognitive level when game stats change
CREATE TRIGGER on_game_stats_updated
  AFTER UPDATE ON game_stats
  FOR EACH ROW EXECUTE FUNCTION update_cognitive_level();

-- Function to update game stats based on performance
CREATE OR REPLACE FUNCTION update_game_stats_from_session()
RETURNS TRIGGER AS $$
BEGIN
  -- Update stats based on game type and performance
  UPDATE game_stats 
  SET 
    memory_strength = CASE 
      WHEN NEW.game_type = 'memory-sequence' THEN 
        LEAST(100, memory_strength + (NEW.success_rate * 2)::INTEGER)
      ELSE memory_strength
    END,
    focus_duration = CASE 
      WHEN NEW.game_type = 'distraction-focus' THEN 
        LEAST(100, focus_duration + (NEW.success_rate * 2)::INTEGER)
      ELSE focus_duration
    END,
    distraction_resistance = CASE 
      WHEN NEW.game_type = 'distraction-focus' THEN 
        LEAST(100, distraction_resistance + (NEW.success_rate * 2)::INTEGER)
      ELSE distraction_resistance
    END,
    context_switching_speed = CASE 
      WHEN NEW.game_type = 'context-switch' THEN 
        LEAST(100, context_switching_speed + (NEW.success_rate * 2)::INTEGER)
      ELSE context_switching_speed
    END,
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update game stats when new session is created
CREATE TRIGGER on_game_session_stats_update
  AFTER INSERT ON game_sessions
  FOR EACH ROW EXECUTE FUNCTION update_game_stats_from_session();

-- Add RLS policy for cognitive levels
ALTER TABLE cognitive_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cognitive levels are viewable by everyone" ON cognitive_levels FOR SELECT USING (true);