-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create an index on the role column
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Add a check constraint to ensure role is one of the allowed values
ALTER TABLE public.user_profiles ADD CONSTRAINT valid_role CHECK (role IN ('user', 'admin'));

-- Create a trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, role)
    VALUES (NEW.id, 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert profiles for existing users
INSERT INTO public.user_profiles (id, role)
SELECT id, 'user'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles);

-- Grant necessary permissions
GRANT SELECT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;

-- Create a view that combines auth.users with user_profiles
CREATE OR REPLACE VIEW public.users AS
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'name' as name,
    u.raw_user_meta_data->>'avatar_url' as avatar_url,
    p.role,
    u.created_at,
    u.updated_at
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id;

-- Grant permissions on the view
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon; 