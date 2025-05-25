-- Step 1: Create the handle_updated_at function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language plpgsql;

-- Step 2: Create the bundles table
CREATE TABLE IF NOT EXISTS public.bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('FREE', 'PRO')),
    is_admin BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 3: Create the bundle_products table
CREATE TABLE IF NOT EXISTS public.bundle_products (
    bundle_id UUID REFERENCES public.bundles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (bundle_id, product_id)
);

-- Step 4: Create the user_bundles table
CREATE TABLE IF NOT EXISTS public.user_bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    bundle_id UUID REFERENCES public.bundles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, bundle_id)
);

-- Step 5: Create indexes (with column existence check)
DO $$ 
BEGIN
    -- Check if the column exists before creating the index
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bundles' 
        AND column_name = 'created_by'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_bundles_created_by ON public.bundles(created_by);
    END IF;

    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bundles' 
        AND column_name = 'is_admin'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_bundles_is_admin ON public.bundles(is_admin);
    END IF;
END $$;

-- Create other indexes that don't depend on created_by
CREATE INDEX IF NOT EXISTS idx_bundle_products_bundle_id ON public.bundle_products(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_products_product_id ON public.bundle_products(product_id);
CREATE INDEX IF NOT EXISTS idx_user_bundles_user_id ON public.user_bundles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bundles_bundle_id ON public.user_bundles(bundle_id);

-- Step 6: Add trigger
DROP TRIGGER IF EXISTS handle_bundles_updated_at ON public.bundles;
CREATE TRIGGER handle_bundles_updated_at
    BEFORE UPDATE ON public.bundles
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Step 7: Enable RLS
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bundles ENABLE ROW LEVEL SECURITY;

-- Step 8: Drop existing policies
DROP POLICY IF EXISTS "Anyone can view bundles" ON public.bundles;
DROP POLICY IF EXISTS "Users can create their own bundles" ON public.bundles;
DROP POLICY IF EXISTS "Users can update their own bundles" ON public.bundles;
DROP POLICY IF EXISTS "Users can delete their own bundles" ON public.bundles;
DROP POLICY IF EXISTS "Service role can manage all bundles" ON public.bundles;
DROP POLICY IF EXISTS "Anyone can view bundle products" ON public.bundle_products;
DROP POLICY IF EXISTS "Users can manage their own bundle products" ON public.bundle_products;
DROP POLICY IF EXISTS "Service role can manage all bundle products" ON public.bundle_products;
DROP POLICY IF EXISTS "Users can view their own saved bundles" ON public.user_bundles;
DROP POLICY IF EXISTS "Users can save bundles" ON public.user_bundles;
DROP POLICY IF EXISTS "Users can remove their saved bundles" ON public.user_bundles;

-- Step 9: Create basic policies first
CREATE POLICY "Anyone can view bundles"
    ON public.bundles FOR SELECT
    USING (true);

CREATE POLICY "Anyone can view bundle products"
    ON public.bundle_products FOR SELECT
    USING (true);

CREATE POLICY "Users can view their own saved bundles"
    ON public.user_bundles FOR SELECT
    USING (auth.uid() = user_id);

-- Step 10: Create user bundle policies
CREATE POLICY "Users can create their own bundles"
    ON public.bundles FOR INSERT
    WITH CHECK (auth.uid() = created_by AND is_admin = false);

CREATE POLICY "Users can update their own bundles"
    ON public.bundles FOR UPDATE
    USING (auth.uid() = created_by AND is_admin = false);

CREATE POLICY "Users can delete their own bundles"
    ON public.bundles FOR DELETE
    USING (auth.uid() = created_by AND is_admin = false);

-- Step 11: Create service role policies
CREATE POLICY "Service role can manage all bundles"
    ON public.bundles FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all bundle products"
    ON public.bundle_products FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Step 12: Create bundle products policies
CREATE POLICY "Users can manage their own bundle products"
    ON public.bundle_products FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.bundles
            WHERE bundles.id = bundle_products.bundle_id
            AND bundles.created_by = auth.uid()
            AND bundles.is_admin = false
        )
    );

-- Step 13: Create user bundles policies
CREATE POLICY "Users can save bundles"
    ON public.user_bundles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their saved bundles"
    ON public.user_bundles FOR DELETE
    USING (auth.uid() = user_id); 