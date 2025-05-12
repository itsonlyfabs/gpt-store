import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface ChatHistory {
  created_at: string;
}

interface DailyStats {
  chats: number;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's chat history
    const { data: chatHistory, error: chatError } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (chatError) {
      throw chatError;
    }

    // Get user's purchased tools
    const { data: purchasedTools, error: toolsError } = await supabase
      .from('purchases')
      .select('product_id, created_at')
      .eq('user_id', user.id);

    if (toolsError) {
      throw toolsError;
    }

    // Calculate statistics
    const totalChats = chatHistory.length;
    const activeTools = new Set(purchasedTools.map(tool => tool.product_id)).size;
    
    // Calculate monthly usage (now daily usage, only chats)
    const dailyUsage = (chatHistory as ChatHistory[]).reduce((acc, chat) => {
      if (!chat.created_at) return acc; // type guard
      const date = new Date(chat.created_at).toISOString().split('T')[0];
      if (!date) return acc;
      if (!acc[date]) {
        acc[date] = { chats: 0 };
      }
      acc[date].chats += 1;
      return acc;
    }, {} as Record<string, DailyStats>);

    // Convert to array and sort by date
    const dailyUsageArray = Object.entries(dailyUsage)
      .map(([date, stats]) => ({
        date,
        chats: stats.chats
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate productivity score (example algorithm, no tokens)
    const productivityScore = Math.min(
      100,
      Math.round(
        (totalChats * 0.5) + // 50% weight on chat activity
        (activeTools * 25)   // 50% weight on tool usage
      )
    );

    // Get user's request usage for this month
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let { data: userRequest, error: fetchError } = await supabase
      .from('user_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)
      .single();
    let requestCount = 0;
    let requestLimit = 150;
    let tier = 'free';
    let resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    if (userRequest) {
      requestCount = userRequest.request_count;
      tier = userRequest.tier || 'free';
      requestLimit = tier === 'pro' ? 500 : 150;
    }

    return NextResponse.json({
      totalChats,
      activeTools,
      dailyUsage: dailyUsageArray,
      productivityScore,
      lastActive: chatHistory[0]?.created_at || new Date().toISOString(),
      requestCount,
      requestLimit,
      tier,
      resetDate
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    );
  }
} 