-- Enhanced Cognitive Stats System
CREATE OR REPLACE FUNCTION update_cognitive_stats(
  user_uuid UUID,
  game_type TEXT,
  difficulty INTEGER,
  success_rate DECIMAL,
  duration_seconds INTEGER,
  score INTEGER
)
RETURNS VOID AS $$
DECLARE
  current_stats RECORD;
  memory_gain INTEGER := 0;
  focus_gain INTEGER := 0;
  resistance_gain INTEGER := 0;
  switching_gain INTEGER := 0;
  base_multiplier DECIMAL := 1.0;
  difficulty_multiplier DECIMAL := 1.0;
  performance_multiplier DECIMAL := 1.0;
BEGIN
  -- Get current stats
  SELECT * INTO current_stats FROM game_stats WHERE user_id = user_uuid;
  
  -- Calculate multipliers based on neuroscience principles
  difficulty_multiplier := 0.5 + (difficulty * 0.1); -- Higher difficulty = more growth
  performance_multiplier := 0.3 + (success_rate * 0.7); -- Better performance = more consolidation
  base_multiplier := difficulty_multiplier * performance_multiplier;
  
  -- Game-specific cognitive improvements based on neuroscience
  CASE game_type
    WHEN 'memory-sequence' THEN
      -- Targets working memory, sequential processing, chunking
      memory_gain := ROUND(base_multiplier * (8 + (difficulty * 2)));
      focus_gain := ROUND(base_multiplier * (3 + difficulty));
      
    WHEN 'distraction-focus' THEN
      -- Targets selective attention, inhibitory control, sustained attention
      focus_gain := ROUND(base_multiplier * (10 + (difficulty * 3)));
      resistance_gain := ROUND(base_multiplier * (12 + (difficulty * 4)));
      memory_gain := ROUND(base_multiplier * (2 + difficulty));
      
    WHEN 'context-switch' THEN
      -- Targets cognitive flexibility, task switching, executive control
      switching_gain := ROUND(base_multiplier * (15 + (difficulty * 5)));
      focus_gain := ROUND(base_multiplier * (6 + (difficulty * 2)));
      memory_gain := ROUND(base_multiplier * (4 + difficulty));
      
    WHEN 'spatial-navigation' THEN
      -- Targets spatial working memory, hippocampal function, visuospatial processing
      memory_gain := ROUND(base_multiplier * (10 + (difficulty * 3)));
      focus_gain := ROUND(base_multiplier * (5 + (difficulty * 2)));
      switching_gain := ROUND(base_multiplier * (3 + difficulty));
      
    WHEN 'pattern-recognition' THEN
      -- Targets visual working memory, pattern detection, perceptual learning
      memory_gain := ROUND(base_multiplier * (7 + (difficulty * 2)));
      focus_gain := ROUND(base_multiplier * (8 + (difficulty * 3)));
      resistance_gain := ROUND(base_multiplier * (4 + difficulty));
      
    WHEN 'dual-n-back' THEN
      -- Targets fluid intelligence, working memory capacity, cognitive control
      memory_gain := ROUND(base_multiplier * (12 + (difficulty * 4)));
      focus_gain := ROUND(base_multiplier * (10 + (difficulty * 3)));
      switching_gain := ROUND(base_multiplier * (8 + (difficulty * 2)));
      resistance_gain := ROUND(base_multiplier * (6 + difficulty));
  END CASE;
  
  -- Apply diminishing returns based on current skill level (neuroplasticity principles)
  memory_gain := ROUND(memory_gain * (1.0 - (current_stats.memory_strength / 200.0)));
  focus_gain := ROUND(focus_gain * (1.0 - (current_stats.focus_duration / 200.0)));
  resistance_gain := ROUND(resistance_gain * (1.0 - (current_stats.distraction_resistance / 200.0)));
  switching_gain := ROUND(switching_gain * (1.0 - (current_stats.context_switching_speed / 200.0)));
  
  -- Ensure minimum gains for successful completion
  IF success_rate > 0.5 THEN
    memory_gain := GREATEST(memory_gain, 1);
    focus_gain := GREATEST(focus_gain, 1);
    resistance_gain := GREATEST(resistance_gain, 1);
    switching_gain := GREATEST(switching_gain, 1);
  END IF;
  
  -- Update stats with caps at 100
  UPDATE game_stats SET
    memory_strength = LEAST(memory_strength + memory_gain, 100),
    focus_duration = LEAST(focus_duration + focus_gain, 100),
    distraction_resistance = LEAST(distraction_resistance + resistance_gain, 100),
    context_switching_speed = LEAST(context_switching_speed + switching_gain, 100),
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update cognitive stats after game sessions
CREATE OR REPLACE FUNCTION trigger_update_cognitive_stats()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_cognitive_stats(
    NEW.user_id,
    NEW.game_type,
    NEW.difficulty_level,
    NEW.success_rate,
    NEW.duration,
    NEW.score
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_game_session_cognitive_update ON game_sessions;
CREATE TRIGGER on_game_session_cognitive_update
  AFTER INSERT ON game_sessions
  FOR EACH ROW EXECUTE PROCEDURE trigger_update_cognitive_stats();

-- Function to get cognitive insights based on stats
CREATE OR REPLACE FUNCTION get_cognitive_insights(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  stats RECORD;
  insights JSON[];
  insight JSON;
BEGIN
  SELECT * INTO stats FROM game_stats WHERE user_id = user_uuid;
  
  insights := ARRAY[]::JSON[];
  
  -- Memory insights
  IF stats.memory_strength >= 80 THEN
    insight := json_build_object(
      'type', 'strength',
      'category', 'memory',
      'title', 'Superior Memory',
      'description', 'Your working memory capacity rivals top performers',
      'recommendation', 'Challenge yourself with dual n-back at higher levels'
    );
    insights := array_append(insights, insight);
  ELSIF stats.memory_strength < 30 THEN
    insight := json_build_object(
      'type', 'improvement',
      'category', 'memory',
      'title', 'Memory Development Needed',
      'description', 'Focus on memory sequence and spatial navigation games',
      'recommendation', 'Practice 15 minutes daily on memory-based games'
    );
    insights := array_append(insights, insight);
  END IF;
  
  -- Focus insights
  IF stats.focus_duration >= 80 THEN
    insight := json_build_object(
      'type', 'strength',
      'category', 'focus',
      'title', 'Exceptional Focus',
      'description', 'Your sustained attention is in the top percentile',
      'recommendation', 'Maintain with challenging distraction-focus games'
    );
    insights := array_append(insights, insight);
  ELSIF stats.focus_duration < 30 THEN
    insight := json_build_object(
      'type', 'improvement',
      'category', 'focus',
      'title', 'Attention Training Needed',
      'description', 'Build sustained attention with focused practice',
      'recommendation', 'Start with easier distraction-focus levels'
    );
    insights := array_append(insights, insight);
  END IF;
  
  -- Resistance insights
  IF stats.distraction_resistance >= 80 THEN
    insight := json_build_object(
      'type', 'strength',
      'category', 'resistance',
      'title', 'Distraction Immunity',
      'description', 'Excellent inhibitory control and selective attention',
      'recommendation', 'Try pattern recognition under time pressure'
    );
    insights := array_append(insights, insight);
  END IF;
  
  -- Switching insights
  IF stats.context_switching_speed >= 80 THEN
    insight := json_build_object(
      'type', 'strength',
      'category', 'switching',
      'title', 'Cognitive Flexibility Master',
      'description', 'Superior executive control and mental agility',
      'recommendation', 'Combine multiple games in rapid succession'
    );
    insights := array_append(insights, insight);
  END IF;
  
  RETURN json_build_object('insights', insights);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;