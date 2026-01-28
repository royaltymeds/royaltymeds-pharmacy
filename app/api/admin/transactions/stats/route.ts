import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET: Get transaction statistics (admin only)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Verify admin role
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.user.id)
      .single();

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Call the database function to get stats
    const { data: stats, error: statsError } = await supabaseAdmin
      .rpc('get_transaction_stats', { p_days: days });

    if (statsError) {
      console.error('Transaction stats error:', statsError);
      return NextResponse.json({ error: 'Failed to fetch transaction statistics' }, { status: 500 });
    }

    // Get all transactions for the period to calculate breakdown
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data: allTransactions, error: allError } = await supabaseAdmin
      .from('transactions')
      .select('type, method, status, amount')
      .gte('created_at', startDate);

    if (allError) {
      console.error('Transaction fetch error:', allError);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    // Calculate breakdown by type and method from fetched data
    const byType: Record<string, any> = {};
    const byMethod: Record<string, any> = {};

    (allTransactions || []).forEach((tx: any) => {
      // By Type
      const typeKey = `${tx.type}_${tx.status}`;
      if (!byType[typeKey]) {
        byType[typeKey] = { type: tx.type, status: tx.status, count: 0, total: 0 };
      }
      byType[typeKey].count += 1;
      byType[typeKey].total += Number(tx.amount);

      // By Method (only for completed transactions)
      if (tx.status === 'completed') {
        if (!byMethod[tx.method]) {
          byMethod[tx.method] = { method: tx.method, count: 0, total: 0 };
        }
        byMethod[tx.method].count += 1;
        byMethod[tx.method].total += Number(tx.amount);
      }
    });

    return NextResponse.json({
      period: { days, startDate },
      summary: stats?.[0] || {},
      byType: Object.values(byType),
      byMethod: Object.values(byMethod),
    });
  } catch (error) {
    console.error('Error in GET /api/admin/transactions/stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
