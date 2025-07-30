-- Create a trigger to automatically create a profile when a new user signs up
-- This ensures that every user in auth.users gets a corresponding profile

-- First, create the function that will be called by the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, marketing_emails, email_notifications, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email::text, 'Anonymous'),
    TRUE, -- Default to marketing emails enabled
    TRUE, -- Default to email notifications enabled
    NOW(),
    NOW()
  );
  
  -- Note: We can't call external APIs from database triggers
  -- The sync to Resend will happen in the auth callback instead
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated; 