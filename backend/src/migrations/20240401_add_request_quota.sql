-- Table to track user requests per month
CREATE TABLE IF NOT EXISTS public.user_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- e.g. '2024-04'
    request_count INTEGER NOT NULL DEFAULT 0,
    tier TEXT NOT NULL DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, month)
);

-- RLS policies
ALTER TABLE public.user_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own request usage"
    ON public.user_requests
    FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own request usage"
    ON public.user_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own request usage"
    ON public.user_requests
    FOR UPDATE
    USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.user_requests TO authenticated; 