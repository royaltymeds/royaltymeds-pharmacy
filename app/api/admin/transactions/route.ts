import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET: List all transactions (admin only)
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
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const method = searchParams.get('method');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const offset = (page - 1) * pageSize;

    // Build query for all transactions
    let query = supabaseAdmin
      .from('transactions')
      .select('id, user_id, order_id, type, method, amount, status, reference_id, description, created_at, completed_at, failure_reason', { count: 'exact' });

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (method) {
      query = query.eq('method', method);
    }
    if (dateFrom) {
      query = query.gte('created_at', new Date(dateFrom).toISOString());
    }
    if (dateTo) {
      query = query.lte('created_at', new Date(dateTo).toISOString());
    }
    if (minAmount) {
      query = query.gte('amount', parseFloat(minAmount));
    }
    if (maxAmount) {
      query = query.lte('amount', parseFloat(maxAmount));
    }

    // Order and paginate
    const { data: transactions, error: transactionError, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (transactionError) {
      console.error('Transaction query error:', transactionError);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    return NextResponse.json({
      data: transactions || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
