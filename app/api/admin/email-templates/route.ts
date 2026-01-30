import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface EmailTemplate {
  id?: string;
  name: string;
  type: 'order_confirmation' | 'order_shipped' | 'prescription_approved' | 'refill_approved' | 'refill_rejected' | 'password_reset' | 'verification' | 'custom';
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[]; // Variable names used in template
  enabled: boolean;
}

// GET: Retrieve email templates
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    // Verify admin using service role
    const { data: templates, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('enabled', true);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST: Create or update email template
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const body: EmailTemplate = await request.json();
    const { id, name, type, subject, htmlContent, textContent, variables, enabled } = body;

    if (!name || !type || !subject || !htmlContent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (id) {
      // Update existing template
      const { data, error } = await supabase
        .from('email_templates')
        .update({
          name,
          type,
          subject,
          htmlcontent: htmlContent,
          textcontent: textContent,
          variables: variables || [],
          enabled: enabled !== false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
      }

      return NextResponse.json(data);
    } else {
      // Create new template
      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          name,
          type,
          subject,
          htmlcontent: htmlContent,
          textcontent: textContent,
          variables: variables || [],
          enabled: enabled !== false,
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
      }

      return NextResponse.json(data, { status: 201 });
    }
  } catch (error) {
    console.error('Error processing template:', error);
    return NextResponse.json({ error: 'Failed to process template' }, { status: 500 });
  }
}
