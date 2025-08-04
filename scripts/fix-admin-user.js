const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAdminUser() {
  try {
    console.log('Starting admin user fix...');
    
    // Check if user_profiles table exists
    const { data: tableExists, error: tableError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (tableError && tableError.code === '42P01') {
      console.log('user_profiles table does not exist, creating it...');
      
      // Create the user_profiles table
      const { error: createTableError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.user_profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            role TEXT NOT NULL DEFAULT 'user',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
          );
          
          CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
          
          ALTER TABLE public.user_profiles ADD CONSTRAINT valid_role CHECK (role IN ('user', 'admin'));
          
          GRANT SELECT, UPDATE ON public.user_profiles TO authenticated;
          GRANT SELECT ON public.user_profiles TO anon;
        `
      });
      
      if (createTableError) {
        console.error('Error creating user_profiles table:', createTableError);
        return;
      }
      
      console.log('user_profiles table created successfully');
    }
    
    // Get the user by email
    const userEmail = 'ponzonif@gmail.com';
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return;
    }
    
    const user = users.users.find(u => u.email === userEmail);
    
    if (!user) {
      console.error('User not found:', userEmail);
      return;
    }
    
    console.log('Found user:', user.id);
    
    // Check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError && profileError.code === 'PGRST116') {
      console.log('User profile does not exist, creating admin profile...');
      
      // Create admin profile
      const { data: newProfile, error: createProfileError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createProfileError) {
        console.error('Error creating admin profile:', createProfileError);
        return;
      }
      
      console.log('Admin profile created successfully:', newProfile);
    } else if (profileError) {
      console.error('Error checking user profile:', profileError);
      return;
    } else {
      console.log('User profile exists:', profile);
      
      // Update to admin if not already
      if (profile.role !== 'admin') {
        console.log('Updating user role to admin...');
        
        const { data: updatedProfile, error: updateError } = await supabase
          .from('user_profiles')
          .update({ role: 'admin', updated_at: new Date().toISOString() })
          .eq('id', user.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('Error updating user role:', updateError);
          return;
        }
        
        console.log('User role updated to admin:', updatedProfile);
      } else {
        console.log('User is already admin');
      }
    }
    
    console.log('Admin user fix completed successfully!');
    
  } catch (error) {
    console.error('Error in fixAdminUser:', error);
  }
}

fixAdminUser(); 