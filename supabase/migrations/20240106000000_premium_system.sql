-- Premium Subscriptions
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Premium Features Access
CREATE TABLE premium_features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  feature_key TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Insert premium features
INSERT INTO premium_features (name, description, feature_key) VALUES
('Unlimited Powerups', 'Access to all premium powerups without restrictions', 'unlimited_powerups'),
('Advanced Analytics', 'Detailed performance insights and progress tracking', 'advanced_analytics'),
('Custom Themes', 'Unlock exclusive visual themes and customizations', 'custom_themes'),
('Priority Support', '24/7 premium customer support', 'priority_support'),
('Exclusive Games', 'Access to premium-only memory training games', 'exclusive_games'),
('Ad-Free Experience', 'Remove all advertisements from the platform', 'ad_free'),
('Cloud Sync', 'Sync progress across multiple devices', 'cloud_sync'),
('Leaderboard Boost', 'Enhanced visibility on global leaderboards', 'leaderboard_boost');

-- Daily Gem Bonuses for Premium
CREATE TABLE daily_bonuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  bonus_date DATE NOT NULL,
  gems_awarded INTEGER NOT NULL,
  bonus_type TEXT NOT NULL CHECK (bonus_type IN ('daily', 'weekly', 'premium')),
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, bonus_date, bonus_type)
);

-- Function to check premium status
CREATE OR REPLACE FUNCTION is_user_premium(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_active_subscription BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM subscriptions 
    WHERE user_id = user_uuid 
    AND status = 'active' 
    AND expires_at > NOW()
  ) INTO has_active_subscription;
  
  RETURN has_active_subscription;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to grant premium trial
CREATE OR REPLACE FUNCTION grant_premium_trial(user_uuid UUID, days INTEGER DEFAULT 7)
RETURNS JSON AS $$
BEGIN
  -- Check if user already had a trial
  IF EXISTS(SELECT 1 FROM subscriptions WHERE user_id = user_uuid) THEN
    RETURN json_build_object('success', false, 'error', 'Trial already used');
  END IF;
  
  -- Grant trial subscription
  INSERT INTO subscriptions (user_id, plan_type, status, expires_at, auto_renew)
  VALUES (user_uuid, 'monthly', 'trial', NOW() + (days || ' days')::INTERVAL, false);
  

  
  RETURN json_build_object('success', true, 'trial_days', days);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to claim daily bonus
CREATE OR REPLACE FUNCTION claim_daily_bonus(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  base_gems INTEGER := 10;
  premium_bonus INTEGER := 0;
  total_gems INTEGER;
  is_premium BOOLEAN;
BEGIN
  -- Check if already claimed today
  IF EXISTS(
    SELECT 1 FROM daily_bonuses 
    WHERE user_id = user_uuid 
    AND bonus_date = CURRENT_DATE 
    AND bonus_type = 'daily'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Already claimed today');
  END IF;
  
  -- Check premium status
  SELECT is_user_premium(user_uuid) INTO is_premium;
  
  -- Premium users get 2x daily bonus
  IF is_premium THEN
    premium_bonus := base_gems;
  END IF;
  
  total_gems := base_gems + premium_bonus;
  
  -- Award gems
  UPDATE profiles SET gems = gems + total_gems WHERE id = user_uuid;
  
  -- Record bonus
  INSERT INTO daily_bonuses (user_id, bonus_date, gems_awarded, bonus_type)
  VALUES (user_uuid, CURRENT_DATE, total_gems, 'daily');
  
  RETURN json_build_object(
    'success', true, 
    'gems_awarded', total_gems,
    'is_premium_bonus', is_premium
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_bonuses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Premium features are viewable by everyone" ON premium_features FOR SELECT USING (true);
CREATE POLICY "Users can view own bonuses" ON daily_bonuses FOR SELECT USING (auth.uid() = user_id);

-- Trigger to update premium status
CREATE OR REPLACE FUNCTION update_premium_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile premium status based on active subscription
  UPDATE profiles 
  SET is_premium = is_user_premium(NEW.user_id)
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW EXECUTE PROCEDURE update_premium_status();