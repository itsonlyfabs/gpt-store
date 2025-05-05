const { createClient } = require('@supabase/supabase-js')

// Debug environment variables (remove in production)
console.log('Supabase Config:', {
  url: process.env.SUPABASE_URL || 'not set',
  hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
})

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables:', {
    url: !supabaseUrl,
    anonKey: !supabaseAnonKey,
    serviceKey: !supabaseServiceKey
  })
  throw new Error('Missing required Supabase environment variables')
}

// Create Supabase client with anonymous key (for public operations)
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create Supabase admin client with service role key (for admin operations)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'supabase-js-admin',
      'x-supabase-auth-role': 'service_role'
    }
  }
})

module.exports = {
  supabase,
  supabaseAdmin
} 