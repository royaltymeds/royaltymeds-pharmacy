import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET: List user's conversations
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const offset = (page - 1) * pageSize;

    // Fetch user's conversations with latest messages
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: conversations, error: convError, count } = await supabaseAdmin
      .from('conversations')
      .select('*', { count: 'exact' })
      .contains('participant_ids', `["${user.user.id}"]`)
      .order('updated_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (convError) {
      console.error('Conversations query error:', convError);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    // Fetch latest messages for each conversation
    const conversationsWithMessages = await Promise.all(
      (conversations || []).map(async (conv) => {
        const { data: latestMessage } = await supabaseAdmin
          .from('messages')
          .select('id, sender_id, content, created_at, read_by')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Count unread messages
        const { count: unreadCount } = await supabaseAdmin
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .not('read_by', 'cs', JSON.stringify([user.user.id]));

        return {
          ...conv,
          latestMessage,
          unreadCount: unreadCount || 0,
        };
      })
    );

    return NextResponse.json({
      data: conversationsWithMessages,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/patient/messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create new conversation or fetch existing
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { participantIds, subject, conversationType = 'direct' } = body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid participantIds' }, { status: 400 });
    }

    // Ensure current user is in participants
    const allParticipants = Array.from(new Set([user.user.id, ...participantIds]));

    // For direct conversations, check if one already exists
    if (conversationType === 'direct' && allParticipants.length === 2) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      // Search for existing direct conversation between these two users
      const { data: existingConv } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('conversation_type', 'direct')
        .contains('participant_ids', JSON.stringify(allParticipants))
        .single();

      if (existingConv) {
        return NextResponse.json(existingConv);
      }
    }

    // Create new conversation
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: newConv, error: createError } = await supabaseAdmin
      .from('conversations')
      .insert({
        participant_ids: allParticipants,
        subject,
        conversation_type: conversationType,
        created_by: user.user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Conversation creation error:', createError);
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    return NextResponse.json(newConv, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/patient/messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
