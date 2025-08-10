-- Friends System
CREATE TABLE friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- Multiplayer Challenges
CREATE TABLE challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  challenger_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  difficulty_level INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'completed', 'expired')),
  creator_score INTEGER DEFAULT 0,
  challenger_score INTEGER DEFAULT 0,
  winner_id UUID REFERENCES profiles(id),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time Multiplayer Sessions
CREATE TABLE multiplayer_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT UNIQUE NOT NULL,
  game_type TEXT NOT NULL,
  max_players INTEGER DEFAULT 2,
  current_players INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('waiting', 'active', 'finished')),
  game_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Multiplayer Session Players
CREATE TABLE multiplayer_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES multiplayer_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  position INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- Social Activities Feed
CREATE TABLE social_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own friendships" ON friendships FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can create friendships" ON friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update own friendships" ON friendships FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can view own challenges" ON challenges FOR SELECT USING (auth.uid() = creator_id OR auth.uid() = challenger_id);
CREATE POLICY "Users can create challenges" ON challenges FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update own challenges" ON challenges FOR UPDATE USING (auth.uid() = creator_id OR auth.uid() = challenger_id);

CREATE POLICY "Anyone can view active multiplayer sessions" ON multiplayer_sessions FOR SELECT USING (true);
CREATE POLICY "Users can create multiplayer sessions" ON multiplayer_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update multiplayer sessions" ON multiplayer_sessions FOR UPDATE USING (true);

CREATE POLICY "Users can view multiplayer players" ON multiplayer_players FOR SELECT USING (true);
CREATE POLICY "Users can join multiplayer sessions" ON multiplayer_players FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view friend activities" ON social_activities FOR SELECT USING (
  EXISTS(
    SELECT 1 FROM friendships 
    WHERE (requester_id = auth.uid() AND addressee_id = social_activities.user_id AND status = 'accepted')
    OR (addressee_id = auth.uid() AND requester_id = social_activities.user_id AND status = 'accepted')
    OR auth.uid() = social_activities.user_id
  )
);

-- Functions
CREATE OR REPLACE FUNCTION send_friend_request(target_user_id UUID)
RETURNS JSON AS $$
BEGIN
  -- Check if friendship already exists
  IF EXISTS(
    SELECT 1 FROM friendships 
    WHERE (requester_id = auth.uid() AND addressee_id = target_user_id)
    OR (requester_id = target_user_id AND addressee_id = auth.uid())
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Friendship already exists');
  END IF;
  
  INSERT INTO friendships (requester_id, addressee_id, status)
  VALUES (auth.uid(), target_user_id, 'pending');
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION accept_friend_request(friendship_id UUID)
RETURNS JSON AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE friendships 
  SET status = 'accepted', updated_at = NOW()
  WHERE id = friendship_id AND addressee_id = auth.uid();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  IF updated_count = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Friend request not found');
  END IF;
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_challenge(target_user_id UUID, game_type TEXT, difficulty INTEGER)
RETURNS JSON AS $$
DECLARE
  challenge_id UUID;
BEGIN
  INSERT INTO challenges (creator_id, challenger_id, game_type, difficulty_level, status)
  VALUES (auth.uid(), target_user_id, game_type, difficulty, 'pending')
  RETURNING id INTO challenge_id;
  
  RETURN json_build_object('success', true, 'challenge_id', challenge_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;