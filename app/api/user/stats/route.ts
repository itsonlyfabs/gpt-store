import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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

    console.log('DEBUG: user.id', user.id);

    // Get user's chat messages (for usage stats)
    const { data: chatMessages, error: chatMsgError } = await supabaseAdmin
      .from('chat_messages')
      .select('user_id, product_id, created_at, role')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    console.log('DEBUG: chatMessages', chatMessages, chatMsgError);

    if (chatMsgError) {
      throw chatMsgError;
    }

    // Get user's purchased tools
    const { data: purchasedTools, error: toolsError } = await supabaseAdmin
      .from('purchases')
      .select('product_id, created_at')
      .eq('user_id', user.id);

    console.log('DEBUG: purchasedTools', purchasedTools, toolsError);

    if (toolsError) {
      throw toolsError;
    }

    // Calculate statistics
    const totalChats = chatMessages.length;
    const activeTools = new Set(purchasedTools.map(tool => tool.product_id)).size;
    
    // Calculate daily usage (only user messages)
    const dailyUsage = (chatMessages as ChatHistory[]).reduce((acc, chat: any) => {
      if (!chat.created_at || chat.role !== 'user') return acc; // Only count user messages
      const date = new Date(chat.created_at).toISOString().split('T')[0];
      if (!date) return acc;
      if (!acc[date]) {
        acc[date] = { chats: 0 };
      }
      (acc[date]!.chats) += 1;
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
    let { data: userRequest, error: fetchError } = await supabaseAdmin
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

    const response = {
      totalChats,
      totalTokens: 0, // Not tracked yet
      activeTools,
      lastActive: chatMessages[0]?.created_at || new Date().toISOString(),
      dailyUsage: dailyUsageArray, // Include dailyUsage for frontend compatibility
      monthlyUsage: dailyUsageArray.map(day => ({ ...day, tokens: 0 })), // tokens not tracked
      costSavings: 0, // Not tracked yet
      productivityScore,
      requestCount,
      requestLimit,
      tier,
      resetDate
    };
    console.log('DEBUG: /api/user/stats response', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    );
  }
} 