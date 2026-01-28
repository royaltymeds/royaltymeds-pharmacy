import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface Params {
  id: string;
}

// POST: Send message in conversation
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

    const body = await request.json();
    const { content, attachmentUrl, attachmentType } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
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

    // Create message
    const { data: message, error: msgError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: id,
        sender_id: user.user.id,
        content: content.trim(),
        attachment_url: attachmentUrl || null,
        attachment_type: attachmentType || null,
        read_by: [user.user.id], // Mark as read by sender
      })
      .select()
      .single();

    if (msgError) {
      console.error('Message creation error:', msgError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Update conversation updated_at timestamp
    await supabaseAdmin
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/patient/messages/[id]/send:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
