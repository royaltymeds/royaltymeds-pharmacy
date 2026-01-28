import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface Params {
  id: string;
}

// POST: Mark conversation as read
export async function POST(
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

    // Verify conversation exists and user is participant
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, participant_ids')
      .eq('id', id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (!conversation.participant_ids.includes(user.user.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all unread messages in conversation
    const { data: unreadMessages } = await supabaseAdmin
      .from('messages')
      .select('id, read_by')
      .eq('conversation_id', id)
      .neq('sender_id', user.user.id);

    if (unreadMessages && unreadMessages.length > 0) {
      // Update each message to mark as read
      for (const msg of unreadMessages) {
        if (!msg.read_by.includes(user.user.id)) {
          await supabaseAdmin
            .from('messages')
            .update({ read_by: [...msg.read_by, user.user.id] })
            .eq('id', msg.id);
        }
      }

      // Insert records in message_reads table
      const readRecords = unreadMessages
        .filter((msg) => !msg.read_by.includes(user.user.id))
        .map((msg) => ({
          message_id: msg.id,
          user_id: user.user.id,
        }));

      if (readRecords.length > 0) {
        await supabaseAdmin.from('message_reads').insert(readRecords);
      }
    }

    return NextResponse.json({ message: 'Conversation marked as read' });
  } catch (error) {
    console.error('Error in POST /api/patient/messages/[id]/mark-read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
