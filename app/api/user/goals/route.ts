import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface Goal {
  id: string;
  user_id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  category: string;
  created_at: string;
  updated_at: string;
}

interface Achievement {
  id: string;
  user_id: string;
  title: string;
  description: string;
  icon: string;
  unlocked_at: string | null;
  created_at: string;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's goals
    const { data: goals, error: goalsError } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (goalsError) {
      throw goalsError;
    }

    // Get user's achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (achievementsError) {
      throw achievementsError;
    }

    return NextResponse.json({
      goals: goals as Goal[],
      achievements: achievements as Achievement[]
    });
  } catch (error) {
    console.error('Error fetching goals and achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals and achievements' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, target, unit, deadline, category } = body;

    // Validate required fields
    if (!title || !target || !unit || !deadline || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new goal
    const { data: goal, error: createError } = await supabase
      .from('user_goals')
      .insert({
        user_id: user.id,
        title,
        target,
        current: 0,
        unit,
        deadline,
        category
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, current } = body;

    if (!id || typeof current !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update goal progress
    const { data: goal, error: updateError } = await supabase
      .from('user_goals')
      .update({ current })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Check if goal is completed and unlock achievement if applicable
    if (goal && goal.current >= goal.target) {
      const { error: achievementError } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          title: `Completed: ${goal.title}`,
          description: `Successfully completed the goal: ${goal.title}`,
          icon: '🎯',
          unlocked_at: new Date().toISOString()
        });

      if (achievementError) {
        console.error('Error creating achievement:', achievementError);
      }
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
} 