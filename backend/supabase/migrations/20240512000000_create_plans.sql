-- Create plans table for subscription plans
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL, -- Price in cents
    interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
    tier TEXT NOT NULL CHECK (tier IN ('FREE', 'PRO')),
    features TEXT[] NOT NULL DEFAULT '{}',
    is_popular BOOLEAN NOT NULL DEFAULT false,
    stripe_price_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_plans_interval ON public.plans(interval);
CREATE INDEX IF NOT EXISTS idx_plans_tier ON public.plans(tier);
CREATE INDEX IF NOT EXISTS idx_plans_price ON public.plans(price);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Plans are viewable by everyone"
    ON public.plans
    FOR SELECT
    USING (true);

CREATE POLICY "Plans can be managed by admins"
    ON public.plans
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Insert default plans
INSERT INTO public.plans (name, description, price, interval, tier, features, is_popular, stripe_price_id) VALUES
('Free', 'Basic access to limited features', 0, 'month', 'FREE', ARRAY[
    '5 chats per day',
    'Basic AI assistance',
    'Community support'
], false, null),
('Pro', 'Unlimited access to all features', 2500, 'month', 'PRO', ARRAY[
    'Unlimited chats',
    'Priority AI assistance',
    'Advanced features',
    'Priority support',
    'Custom AI models',
    'Export conversations'
], true, null),
('Pro', 'Unlimited access to all features (Yearly)', 25000, 'year', 'PRO', ARRAY[
    'Unlimited chats',
    'Priority AI assistance',
    'Advanced features',
    'Priority support',
    'Custom AI models',
    'Export conversations',
    '2 months free'
], true, null);

-- Grant permissions
GRANT SELECT ON public.plans TO authenticated;
GRANT SELECT ON public.plans TO anon;
GRANT ALL ON public.plans TO service_role;
