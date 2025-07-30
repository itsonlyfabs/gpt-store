import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { addContactToAudience } from '@/lib/resend';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

function isAdmin(profile: any) {
  return profile?.role === 'admin';
}

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (!isAdmin(profile)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    // Get all users from the users table (auth users)
    const { data: authUsers, error: authError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, created_at')
      .order('created_at', { ascending: false });

    if (authError) {
      console.error('Error fetching auth users:', authError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get all existing profiles
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email');

    if (profilesError) {
      console.error('Error fetching existing profiles:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    const existingProfileIds = new Set(existingProfiles?.map(p => p.id) || []);
    const fixedProfiles = [];
    const syncedToResend = [];
    const errors = [];

    console.log(`Found ${authUsers?.length || 0} auth users and ${existingProfiles?.length || 0} existing profiles`);

    for (const user of authUsers || []) {
      try {
        if (!existingProfileIds.has(user.id)) {
          console.log(`Creating profile for user: ${user.email}`);
          
          // Create missing profile using admin client to bypass RLS
          const { data: newProfile, error: createError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              name: user.name || user.email?.split('@')[0] || 'Anonymous',
              role: user.email === 'ponzonif@gmail.com' ? 'admin' : 'user', // Make you admin
              marketing_emails: true,
              email_notifications: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (createError) {
            console.error(`Failed to create profile for ${user.email}:`, createError);
            errors.push(`Failed to create profile for ${user.email}: ${createError.message}`);
          } else {
            fixedProfiles.push(user.email);
            console.log(`Created profile for ${user.email}`);

            // Sync to Resend
            try {
              const result = await addContactToAudience({
                email: newProfile.email,
                name: newProfile.name,
                unsubscribed: false
              });
              
              if (result?.error) {
                console.error(`Failed to sync ${newProfile.email} to Resend:`, result.error);
                errors.push(`Failed to sync ${newProfile.email} to Resend: ${result.error.message}`);
              } else {
                syncedToResend.push(newProfile.email);
                console.log(`Synced ${newProfile.email} to Resend audience`);
              }
            } catch (error) {
              console.error(`Failed to sync ${newProfile.email} to Resend:`, error);
              errors.push(`Failed to sync ${newProfile.email} to Resend: ${error}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
        errors.push(`Error processing ${user.email}: ${error}`);
      }
    }

    // Also sync any existing profiles that might not be in Resend yet
    const { data: allProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('marketing_emails', true)
      .not('email', 'is', null);

    if (!fetchError && allProfiles) {
      for (const profile of allProfiles) {
        if (!syncedToResend.includes(profile.email)) {
          try {
            const result = await addContactToAudience({
              email: profile.email,
              name: profile.name,
              unsubscribed: false
            });
            
            if (result?.error) {
              console.error(`Failed to sync ${profile.email} to Resend:`, result.error);
              errors.push(`Failed to sync ${profile.email} to Resend: ${result.error.message}`);
            } else {
              syncedToResend.push(profile.email);
              console.log(`Synced ${profile.email} to Resend audience`);
            }
          } catch (error) {
            console.error(`Failed to sync ${profile.email} to Resend:`, error);
            errors.push(`Failed to sync ${profile.email} to Resend: ${error}`);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedProfiles.length} missing profiles and synced ${syncedToResend.length} to Resend`,
      fixedProfiles,
      syncedToResend,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error in fix-missing-profiles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 