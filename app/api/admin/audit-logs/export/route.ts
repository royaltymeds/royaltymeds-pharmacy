import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST: Export audit logs as CSV
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

    // Parse request body for filters
    const body = await request.json().catch(() => ({}));
    const { userId, resourceType, action, dateFrom, dateTo, logIds } = body;

    // Build query
    let query = supabaseAdmin.from('audit_logs').select('*');

    // If specific log IDs provided, fetch those
    if (logIds && Array.isArray(logIds) && logIds.length > 0) {
      query = query.in('id', logIds);
    } else {
      // Apply filters
      if (userId) {
        query = query.eq('user_id', userId);
      }
      if (resourceType) {
        query = query.eq('resource_type', resourceType);
      }
      if (action) {
        query = query.eq('action', action);
      }
      if (dateFrom) {
        query = query.gte('timestamp', new Date(dateFrom).toISOString());
      }
      if (dateTo) {
        query = query.lte('timestamp', new Date(dateTo).toISOString());
      }
    }

    // Fetch all matching logs (no pagination for export)
    const { data: logs, error: logsError } = await query.order('timestamp', { ascending: false });

    if (logsError) {
      console.error('Audit logs query error:', logsError);
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }

    if (!logs || logs.length === 0) {
      return NextResponse.json({ error: 'No audit logs found' }, { status: 404 });
    }

    // Convert to CSV
    const csv = convertToCSV(logs);

    // Return as downloadable CSV file
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv; charset=utf-8');
    headers.set('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);

    return new Response(csv, { headers });
  } catch (error) {
    console.error('Error in POST /api/admin/audit-logs/export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to convert audit logs to CSV
function convertToCSV(logs: any[]): string {
  if (logs.length === 0) {
    return '';
  }

  // Define CSV headers
  const headers = [
    'ID',
    'Timestamp',
    'User Email',
    'Action',
    'Resource Type',
    'Resource ID',
    'Table Name',
    'Status',
    'Details',
  ];

  // Create CSV rows
  const rows = logs.map((log) => [
    log.id,
    log.timestamp,
    log.user_email || '',
    log.action,
    log.resource_type,
    log.resource_id || '',
    log.table_name || '',
    log.status,
    (log.details || '').replace(/"/g, '""'), // Escape quotes
  ]);

  // Format CSV: escape fields with commas/quotes and quote them
  const csvHeaders = headers.map((h) => `"${h}"`).join(',');
  const csvRows = rows
    .map((row) =>
      row
        .map((field) => {
          if (field === null || field === undefined) return '""';
          const stringField = String(field);
          if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`;
          }
          return `"${stringField}"`;
        })
        .join(',')
    )
    .join('\n');

  return `${csvHeaders}\n${csvRows}`;
}
