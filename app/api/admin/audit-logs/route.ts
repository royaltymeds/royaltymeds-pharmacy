import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET: List audit logs with filters
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
    const entityType = searchParams.get('entityType');
    const action = searchParams.get('action');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const offset = (page - 1) * pageSize;

    // Build query
    let query = supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact' });

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (entityType) {
      query = query.eq('entity_type', entityType);
    }
    if (action) {
      query = query.eq('action', action);
    }
    if (dateFrom) {
      query = query.gte('created_at', new Date(dateFrom).toISOString());
    }
    if (dateTo) {
      query = query.lte('created_at', new Date(dateTo).toISOString());
    }

    // Order and paginate
    const { data: logs, error: logsError, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (logsError) {
      console.error('Audit logs query error:', logsError);
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }

    return NextResponse.json({
      data: logs || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/audit-logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
