-- First, let's check the auth users table structure
SELECT * FROM auth.users WHERE raw_user_meta_data->>'email' = 'ponzonif@gmail.com';

-- Show the current profiles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles';

-- Create a temporary table to store the mapping
CREATE TEMP TABLE temp_profiles AS
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1), 'Anonymous') as name,
    au.created_at,
    au.updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Show what we're about to insert
SELECT * FROM temp_profiles;

-- Insert the data
INSERT INTO public.profiles (id, name, created_at, updated_at)
SELECT id, name, created_at, updated_at
FROM temp_profiles;

-- Clean up
DROP TABLE temp_profiles;

-- Show final state of profiles
SELECT p.*, au.email as auth_email
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.email = 'ponzonif@gmail.com'; 