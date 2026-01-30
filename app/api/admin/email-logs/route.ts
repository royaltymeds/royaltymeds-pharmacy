import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const recipientEmail = searchParams.get('recipientEmail');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    let query = supabase
      .from('email_logs')
      .select('*', { count: 'exact' });

    if (recipientEmail) {
      query = query.ilike('recipientemail', `%${recipientEmail}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (dateFrom) {
      query = query.gte('sentat', new Date(dateFrom).toISOString());
    }

    if (dateTo) {
      query = query.lte('sentat', new Date(dateTo).toISOString());
    }

    // Add ordering and pagination
    query = query
      .order('sentat', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch email logs' }, { status: 500 });
    }

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    return NextResponse.json({ error: 'Failed to fetch email logs' }, { status: 500 });
  }
}
