import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET: Get all conversations (admin only)
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const offset = (page - 1) * pageSize;

    // Build query
    let query = supabaseAdmin
      .from('conversations')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false });

    // Filter by user if provided
    if (userId) {
      query = query.contains('participant_ids', `[${JSON.stringify(userId)}]`);
    }

    const { data: conversations, error: convError, count } = await query.range(offset, offset + pageSize - 1);

    if (convError) {
      console.error('Conversations query error:', convError);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    return NextResponse.json({
      data: conversations || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
