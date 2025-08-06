import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '../../lib/supabaseAdmin'

interface Plan {
  id: string
  name: string
  price: number
  interval: string
  description: string
  features: string[]
  is_popular: boolean
  tier: string
  stripe_price_id: string | null
  created_at: string
  updated_at: string
}

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const interval = searchParams.get('interval') || 'month'

    // Fetch plans from Supabase database, filtered by interval
    const { data: plans, error } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('interval', interval)
      .order('price', { ascending: true })

    if (error) {
      console.error('Error fetching plans:', error)
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
    }

    // Transform the data to match the expected structure
    const transformedPlans = (plans as Plan[]).map((plan: Plan) => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      interval: plan.interval,
      description: plan.description,
      features: plan.features || [],
      is_popular: plan.is_popular || false,
      tier: plan.tier,
      stripe_price_id: plan.stripe_price_id
    }))

    return NextResponse.json(transformedPlans)
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    )
  }
} 