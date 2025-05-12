import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface ChatHistory {
  created_at: string;
  tokens_used: number;
}

interface MonthlyStats {
  tokens: number;
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
    const totalTokens = chatHistory.reduce((sum, chat) => sum + (chat.tokens_used || 0), 0);
    const activeTools = new Set(purchasedTools.map(tool => tool.product_id)).size;
    
    // Calculate monthly usage
    const monthlyUsage = (chatHistory as ChatHistory[]).reduce((acc, chat) => {
      const date = new Date(chat.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { tokens: 0, chats: 0 };
      }
      acc[date].tokens += chat.tokens_used || 0;
      acc[date].chats += 1;
      return acc;
    }, {} as Record<string, MonthlyStats>);

    // Convert to array and sort by date
    const monthlyUsageArray = Object.entries(monthlyUsage)
      .map(([date, stats]) => ({
        date,
        tokens: stats.tokens,
        chats: stats.chats
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate productivity score (example algorithm)
    const productivityScore = Math.min(
      100,
      Math.round(
        (totalChats * 0.4) + // 40% weight on chat activity
        (activeTools * 20) + // 20% weight on tool usage
        (totalTokens / 1000) // 40% weight on token usage
      )
    );

    // Calculate cost savings (example calculation)
    const costSavings = Math.round(totalTokens * 0.0001 * 100) / 100; // Example: $0.0001 per token

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
      totalTokens,
      activeTools,
      monthlyUsage: monthlyUsageArray,
      productivityScore,
      costSavings,
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