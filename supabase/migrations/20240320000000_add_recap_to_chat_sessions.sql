-- Add recap column to chat_sessions table
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS recap TEXT;

-- Update existing saved sessions to have a default recap
UPDATE chat_sessions 
SET recap = 'This is a legacy chat session. The recap feature was added after this chat was saved.'
WHERE saved = true AND recap IS NULL; 