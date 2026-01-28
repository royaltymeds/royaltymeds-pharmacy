import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET: List patient's transactions
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

    // Get authenticated user
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const offset = (page - 1) * pageSize;

    // Build query for patient's transactions
    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.user.id);

    // Apply filters
    if (type) {
      query = query.eq('type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (dateFrom) {
      query = query.gte('created_at', new Date(dateFrom).toISOString());
    }
    if (dateTo) {
      query = query.lte('created_at', new Date(dateTo).toISOString());
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
    console.error('Error in GET /api/patient/transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
