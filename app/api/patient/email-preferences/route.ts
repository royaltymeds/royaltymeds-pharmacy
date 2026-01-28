import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface EmailPreferences {
  orderUpdates?: boolean;
  prescriptionUpdates?: boolean;
  promotionalEmails?: boolean;
  weeklyNewsletter?: boolean;
}

// GET: Fetch user's email preferences
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    // Extract user ID from token (in production, validate JWT)
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: preferences, error } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No preferences found, return defaults
        return NextResponse.json({
          user_id: user.id,
          orderUpdates: true,
          prescriptionUpdates: true,
          promotionalEmails: false,
          weeklyNewsletter: false,
        });
      }
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

// PUT: Update user's email preferences
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    // Extract user ID from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: EmailPreferences = await request.json();

    // Check if preferences exist
    const { data: existing } = await supabase
      .from('email_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('email_preferences')
        .update({
          orderUpdates: body.orderUpdates ?? undefined,
          prescriptionUpdates: body.prescriptionUpdates ?? undefined,
          promotionalEmails: body.promotionalEmails ?? undefined,
          weeklyNewsletter: body.weeklyNewsletter ?? undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
      }

      return NextResponse.json(data);
    } else {
      // Create new preferences
      const { data, error } = await supabase
        .from('email_preferences')
        .insert({
          user_id: user.id,
          orderUpdates: body.orderUpdates ?? true,
          prescriptionUpdates: body.prescriptionUpdates ?? true,
          promotionalEmails: body.promotionalEmails ?? false,
          weeklyNewsletter: body.weeklyNewsletter ?? false,
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to create preferences' }, { status: 500 });
      }

      return NextResponse.json(data, { status: 201 });
    }
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
