-- SQL to update database for Team Chat approach

-- 1. Add new columns to chat_sessions table
ALTER TABLE chat_sessions 
ADD COLUMN IF NOT EXISTS active_product_id UUID REFERENCES products(id),
ADD COLUMN IF NOT EXISTS team_goal TEXT,
ADD COLUMN IF NOT EXISTS last_context_transfer_at TIMESTAMP WITH TIME ZONE;

-- 2. Create context_transfers table
CREATE TABLE IF NOT EXISTS context_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    from_product_id UUID REFERENCES products(id),
    to_product_id UUID REFERENCES products(id),
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create team_responses table for "Ask the team" feature
CREATE TABLE IF NOT EXISTS team_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create user_notes table
CREATE TABLE IF NOT EXISTS user_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create chat_summaries table
CREATE TABLE IF NOT EXISTS chat_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_active_product ON chat_sessions(active_product_id);
CREATE INDEX IF NOT EXISTS idx_context_transfers_session ON context_transfers(session_id);
CREATE INDEX IF NOT EXISTS idx_team_responses_session ON team_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_team_responses_message ON team_responses(message_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_session ON user_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_user ON user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_summaries_session ON chat_summaries(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_summaries_user ON chat_summaries(user_id);

-- 7. Add RLS policies
ALTER TABLE context_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_summaries ENABLE ROW LEVEL SECURITY;

-- Context transfers policy
CREATE POLICY "Users can view their own context transfers" 
ON context_transfers FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM chat_sessions 
    WHERE chat_sessions.id = context_transfers.session_id 
    AND chat_sessions.user_id = auth.uid()
));

-- Team responses policy
CREATE POLICY "Users can view their own team responses" 
ON team_responses FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM chat_sessions 
    WHERE chat_sessions.id = team_responses.session_id 
    AND chat_sessions.user_id = auth.uid()
));

-- User notes policy
CREATE POLICY "Users can manage their own notes" 
ON user_notes FOR ALL 
USING (user_id = auth.uid());

-- Chat summaries policy
CREATE POLICY "Users can manage their own summaries" 
ON chat_summaries FOR ALL 
USING (user_id = auth.uid());
