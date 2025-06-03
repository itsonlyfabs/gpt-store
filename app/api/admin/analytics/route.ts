import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    // Total users
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });
    if (usersError) {
      console.error('Analytics: usersError', usersError);
      throw usersError;
    }

    // Active users (last 30 days) - skip if last_login column is missing
    let activeUsers: number | null = null;
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count, error } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', thirtyDaysAgo.toISOString());
      if (error) {
        console.warn('Analytics: Could not calculate active users (last_login missing?)', error);
        activeUsers = null;
      } else {
        activeUsers = count || 0;
      }
    } catch (err) {
      console.warn('Analytics: Exception in active users calculation', err);
      activeUsers = null;
    }

    // Total revenue
    const { data: revenueData, error: revenueError } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('status', 'completed');
    if (revenueError) {
      console.error('Analytics: revenueError', revenueError);
      throw revenueError;
    }
    const totalRevenue = (revenueData || []).reduce((sum, payment) => sum + payment.amount, 0);

    // Monthly revenue
    const { data: monthlyRevenue, error: monthlyRevenueError } = await supabaseAdmin
      .from('payments')
      .select('amount, created_at')
      .eq('status', 'completed')
      .order('created_at', { ascending: true });
    if (monthlyRevenueError) {
      console.error('Analytics: monthlyRevenueError', monthlyRevenueError);
      throw monthlyRevenueError;
    }
    const monthlyRevenueData: Record<string, number> = (monthlyRevenue || []).reduce((acc: Record<string, number>, payment: any) => {
      const month = new Date(payment.created_at).toLocaleString('default', { month: 'short' });
      if (!acc[month]) acc[month] = 0;
      acc[month] += payment.amount;
      return acc;
    }, {});
    const monthlyRevenueArray = Object.entries(monthlyRevenueData).map(([month, amount]) => ({ month, amount }));

    // Product usage
    const { data: productUsage, error: productUsageError } = await supabaseAdmin
      .from('product_usage')
      .select('product_id, count')
      .order('count', { ascending: false })
      .limit(5);
    if (productUsageError) {
      console.error('Analytics: productUsageError', productUsageError);
      throw productUsageError;
    }
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name')
      .in('id', (productUsage || []).map((p: any) => p.product_id));
    if (productsError) {
      console.error('Analytics: productsError', productsError);
      throw productsError;
    }
    const productUsageData = (productUsage || []).map((usage: any) => {
      const product = (products || []).find((p: any) => p.id === usage.product_id);
      return {
        id: product ? product.name : usage.product_id,
        label: product ? product.name : usage.product_id,
        value: usage.count
      };
    });

    // User growth
    const { data: userGrowth, error: userGrowthError } = await supabaseAdmin
      .from('users')
      .select('created_at')
      .order('created_at', { ascending: true });
    if (userGrowthError) {
      console.error('Analytics: userGrowthError', userGrowthError);
      throw userGrowthError;
    }
    const userGrowthData: Record<string, { newUsers: number }> = (userGrowth || []).reduce((acc: Record<string, { newUsers: number }>, user: any) => {
      if (!user || !user.created_at) return acc;
      const month = new Date(user.created_at).toLocaleString('default', { month: 'short' });
      if (!acc[month]) acc[month] = { newUsers: 0 };
      acc[month].newUsers += 1;
      return acc;
    }, {});
    const userGrowthArray = Object.entries(userGrowthData).map(([month, data]) => ({ month, newUsers: data.newUsers }));

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalRevenue,
      monthlyRevenue: monthlyRevenueArray,
      productUsage: productUsageData,
      userGrowth: userGrowthArray
    });
  } catch (error) {
    console.error('Analytics: final error', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to fetch analytics data' }, { status: 500 });
  }
} 