CREATE TABLE IF NOT EXISTS public.documentation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text NOT NULL,
  context text NOT NULL,
  created_at timestamp with time zone default timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS but allow public read
ALTER TABLE public.documentation ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read documentation" ON public.documentation;
CREATE POLICY "Public can read documentation"
  ON public.documentation FOR SELECT
  USING (true); 