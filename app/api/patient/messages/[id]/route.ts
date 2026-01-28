import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface Params {
  id: string;
}

// GET: Get conversation with all messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;

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

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get conversation - verify user is participant
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (!conversation.participant_ids.includes(user.user.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    const offset = (page - 1) * pageSize;

    // Get messages in conversation
    const { data: messages, error: msgError, count } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (msgError) {
      console.error('Messages query error:', msgError);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Mark messages as read for current user
    if (messages && messages.length > 0) {
      await supabaseAdmin
        .from('messages')
        .update({
          read_by: messages.map((m) => {
            if (!m.read_by.includes(user.user.id)) {
              return [...m.read_by, user.user.id];
            }
            return m.read_by;
          }),
        })
        .eq('conversation_id', id)
        .not('read_by', 'cs', JSON.stringify([user.user.id]))
        .neq('sender_id', user.user.id);
    }

    return NextResponse.json({
      conversation,
      messages: messages || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/patient/messages/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
