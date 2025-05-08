-- Create stored procedure to create chat_messages table
CREATE OR REPLACE FUNCTION create_chat_messages_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create chat_messages table
    CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for faster queries
    CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_product_id ON chat_messages(product_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

    -- Add RLS policies
    ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

    -- Allow users to read their own messages
    DROP POLICY IF EXISTS "Users can read their own messages" ON chat_messages;
    CREATE POLICY "Users can read their own messages"
        ON chat_messages FOR SELECT
        USING (auth.uid()::text = user_id);

    -- Allow users to insert their own messages
    DROP POLICY IF EXISTS "Users can insert their own messages" ON chat_messages;
    CREATE POLICY "Users can insert their own messages"
        ON chat_messages FOR INSERT
        WITH CHECK (auth.uid()::text = user_id);
END;
$$;
