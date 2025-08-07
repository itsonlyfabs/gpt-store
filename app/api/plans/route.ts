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

    // Try to fetch plans from Supabase database, filtered by interval
    const { data: plans, error } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('interval', interval)
      .order('price', { ascending: true })

    if (error) {
      console.error('Error fetching plans from database:', error)
      
      // If the plans table doesn't exist, return default plans
      if (error.code === '42P01') {
        console.log('Plans table does not exist, returning default plans')
        
        const defaultPlans = interval === 'month' ? [
          {
            id: 'free-plan',
            name: 'Free',
            price: 0,
            interval: 'month',
            description: 'Basic access to limited features',
            features: [
              '5 chats per day',
              'Basic AI assistance',
              'Community support'
            ],
            is_popular: false,
            tier: 'FREE',
            stripe_price_id: null
          },
          {
            id: 'pro-plan-monthly',
            name: 'Pro',
            price: 2500, // $25.00 in cents (corrected from $29)
            interval: 'month',
            description: 'Unlimited access to all features',
            features: [
              'Unlimited chats',
              'Priority AI assistance',
              'Advanced features',
              'Priority support',
              'Custom AI models',
              'Export conversations'
            ],
            is_popular: true,
            tier: 'PRO',
            stripe_price_id: null
          }
        ] : [
          {
            id: 'pro-plan-yearly',
            name: 'Pro',
            price: 25000, // $250.00 in cents (corrected from $290)
            interval: 'year',
            description: 'Unlimited access to all features (Yearly)',
            features: [
              'Unlimited chats',
              'Priority AI assistance',
              'Advanced features',
              'Priority support',
              'Custom AI models',
              'Export conversations',
              '2 months free'
            ],
            is_popular: true,
            tier: 'PRO',
            stripe_price_id: null
          }
        ]
        
        return NextResponse.json(defaultPlans)
      }
      
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

    console.log(`✅ Found ${transformedPlans.length} plans for interval: ${interval}`)
    return NextResponse.json(transformedPlans)
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    )
  }
} 