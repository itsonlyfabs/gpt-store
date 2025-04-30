const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create Supabase client with anonymous key (for public operations)
const supabase = createClient(supabaseUrl, supabaseKey)

// Create Supabase admin client with service role key (for admin operations)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

module.exports = {
  supabase,
  supabaseAdmin
} 