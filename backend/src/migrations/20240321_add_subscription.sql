-- Add subscription field to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN subscription TEXT NOT NULL DEFAULT 'FREE' 
CHECK (subscription IN ('FREE', 'PRO'));

-- Create an index on the subscription column
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription ON public.user_profiles(subscription);

-- Drop the existing view
DROP VIEW IF EXISTS public.users;

-- Recreate the view with the new subscription column
CREATE VIEW public.users AS
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'name' as name,
    u.raw_user_meta_data->>'avatar_url' as avatar_url,
    p.role,
    p.subscription,
    u.created_at,
    u.updated_at
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id;

-- Grant permissions on the view
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon; 