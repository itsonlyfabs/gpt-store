-- Add role column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Make the first user (you) an admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'ponzonif@gmail.com';

-- Add the email notification columns if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN DEFAULT TRUE; 