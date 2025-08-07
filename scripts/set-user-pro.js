const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setUserPro() {
  try {
    console.log('🔧 Setting user to PRO subscription...\n');

    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    if (!users || !users.users || users.users.length === 0) {
      console.log('❌ No users found');
      return;
    }

    console.log(`📋 Found ${users.users.length} users:`);
    users.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.id})`);
    });
    console.log('');

    // For now, let's set the first user to PRO (you can modify this)
    const targetUser = users.users[0];
    console.log(`🎯 Setting user ${targetUser.email} to PRO subscription...`);

    // Update the user's subscription in user_profiles table
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({ subscription: 'PRO' })
      .eq('id', targetUser.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating user subscription:', updateError);
      
      // If the profile doesn't exist, create it
      if (updateError.code === 'PGRST116') {
        console.log('📝 User profile doesn\'t exist, creating it...');
        
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: targetUser.id,
            subscription: 'PRO',
            role: 'user'
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creating user profile:', createError);
          return;
        }

        console.log('✅ Created user profile with PRO subscription');
        console.log('Profile:', newProfile);
      } else {
        return;
      }
    } else {
      console.log('✅ Updated user subscription to PRO');
      console.log('Profile:', updatedProfile);
    }

    // Verify the update
    console.log('\n🔍 Verifying the update...');
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', targetUser.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying profile:', verifyError);
      return;
    }

    console.log('✅ Verification successful:');
    console.log(`   User ID: ${verifyProfile.id}`);
    console.log(`   Subscription: ${verifyProfile.subscription}`);
    console.log(`   Role: ${verifyProfile.role}`);

    console.log('\n🎉 User successfully set to PRO subscription!');
    console.log('📝 Now test the billing page to see if it shows your PRO subscription');

  } catch (error) {
    console.error('❌ Error in setUserPro:', error);
    process.exit(1);
  }
}

setUserPro();
