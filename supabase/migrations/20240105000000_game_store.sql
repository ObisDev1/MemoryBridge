-- Game Store Items
CREATE TABLE store_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('powerup', 'hint', 'boost', 'cosmetic')),
  gem_cost INTEGER NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Purchases
CREATE TABLE user_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_id UUID REFERENCES store_items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- User Inventory
CREATE TABLE user_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_id UUID REFERENCES store_items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, item_id)
);

-- Insert store items
INSERT INTO store_items (name, description, icon, category, gem_cost, is_premium) VALUES
-- Powerups
('Time Freeze', 'Pause the timer for 5 seconds', '⏸️', 'powerup', 50, false),
('Double Score', 'Double points for next correct answer', '2️⃣', 'powerup', 75, false),
('Shield', 'Protect from one wrong answer', '🛡️', 'powerup', 100, false),
('Lightning Boost', 'Increase reaction speed by 50%', '⚡', 'powerup', 125, true),

-- Hints
('Color Hint', 'Highlight correct color for 2 seconds', '🎨', 'hint', 25, false),
('Pattern Reveal', 'Show next item in sequence', '👁️', 'hint', 40, false),
('Focus Guide', 'Dim distractions for 3 seconds', '🔍', 'hint', 60, false),
('Context Clue', 'Show task priority indicator', '💡', 'hint', 80, true),

-- Boosts
('Gem Multiplier', 'Earn 2x gems for 10 minutes', '💎', 'boost', 200, false),
('XP Boost', 'Gain 50% more experience', '📈', 'boost', 150, false),
('Streak Saver', 'Maintain streak on one mistake', '🔥', 'boost', 300, true),

-- Cosmetics
('Neon Theme', 'Unlock neon color palette', '🌈', 'cosmetic', 500, false),
('Galaxy Theme', 'Unlock space-themed visuals', '🌌', 'cosmetic', 750, true),
('Particle Effects', 'Add particle animations', '✨', 'cosmetic', 1000, true);

-- Enable RLS
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Store items are viewable by everyone" ON store_items FOR SELECT USING (true);
CREATE POLICY "Users can view own purchases" ON user_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchases" ON user_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own inventory" ON user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory" ON user_inventory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory" ON user_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to handle purchases
CREATE OR REPLACE FUNCTION purchase_item(item_uuid UUID, user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  item_cost INTEGER;
  user_gems INTEGER;
  item_premium BOOLEAN;
  user_premium BOOLEAN;
BEGIN
  -- Get item details
  SELECT gem_cost, is_premium INTO item_cost, item_premium
  FROM store_items WHERE id = item_uuid;
  
  -- Get user details
  SELECT gems, is_premium INTO user_gems, user_premium
  FROM profiles WHERE id = user_uuid;
  
  -- Check if user has enough gems
  IF user_gems < item_cost THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient gems');
  END IF;
  
  -- Check premium requirement
  IF item_premium AND NOT user_premium THEN
    RETURN json_build_object('success', false, 'error', 'Premium required');
  END IF;
  
  -- Deduct gems
  UPDATE profiles SET gems = gems - item_cost WHERE id = user_uuid;
  
  -- Add to purchases
  INSERT INTO user_purchases (user_id, item_id) VALUES (user_uuid, item_uuid)
  ON CONFLICT (user_id, item_id) DO NOTHING;
  
  -- Add to inventory
  INSERT INTO user_inventory (user_id, item_id, quantity) VALUES (user_uuid, item_uuid, 1)
  ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = user_inventory.quantity + 1;
  
  RETURN json_build_object('success', true, 'gems_remaining', user_gems - item_cost);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;