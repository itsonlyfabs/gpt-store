import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const { bundleId } = await request.json()
    if (!bundleId) {
      return NextResponse.json({ error: 'Missing bundleId' }, { status: 400 })
    }

    // Get user
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check that the bundle exists and is admin-created (public)
    const { data: bundle, error: bundleError } = await supabaseAdmin
      .from('bundles')
      .select('*')
      .eq('id', bundleId)
      .single()
    if (bundleError || !bundle) {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 })
    }
    // Only admin-created bundles (is_admin === true) can be saved by all users
    if (!bundle.is_admin) {
      return NextResponse.json({ error: 'Only admin-created bundles can be saved by all users' }, { status: 403 })
    }

    // Check if already saved
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('user_bundles')
      .select('id')
      .eq('user_id', user.id)
      .eq('bundle_id', bundleId)
      .single()
    if (existing && existing.id) {
      return NextResponse.json({ message: 'Bundle already saved' })
    }

    // Save the bundle for the user
    const { error: saveError } = await supabaseAdmin
      .from('user_bundles')
      .insert({ user_id: user.id, bundle_id: bundleId })
    if (saveError) {
      return NextResponse.json({ error: 'Failed to save bundle' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save bundle' }, { status: 500 })
  }
} 