-- First, let's check the current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles';

-- Drop the duplicate policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Add email column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'email'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN email TEXT;
    END IF;
END
$$;

-- Add unique constraint on email if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'profiles_email_key'
    ) THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_email_key UNIQUE (email);
    END IF;
END
$$;

-- Verify the final table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'; 