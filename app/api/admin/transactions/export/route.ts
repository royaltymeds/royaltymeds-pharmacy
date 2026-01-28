import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST: Export transaction report as CSV (admin only)
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
    const { userId, type, status, method, dateFrom, dateTo, minAmount, maxAmount } = body;

    // Build query
    let query = supabaseAdmin.from('transactions').select('*');

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (method) {
      query = query.eq('method', method);
    }
    if (dateFrom) {
      query = query.gte('created_at', new Date(dateFrom).toISOString());
    }
    if (dateTo) {
      query = query.lte('created_at', new Date(dateTo).toISOString());
    }
    if (minAmount) {
      query = query.gte('amount', parseFloat(minAmount));
    }
    if (maxAmount) {
      query = query.lte('amount', parseFloat(maxAmount));
    }

    // Fetch all matching transactions (no pagination for export)
    const { data: transactions, error: transactionError } = await query.order('created_at', { ascending: false });

    if (transactionError) {
      console.error('Transaction query error:', transactionError);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ error: 'No transactions found' }, { status: 404 });
    }

    // Convert to CSV
    const csv = convertToCSV(transactions);

    // Return as downloadable CSV file
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv; charset=utf-8');
    headers.set('Content-Disposition', `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`);

    return new Response(csv, { headers });
  } catch (error) {
    console.error('Error in POST /api/admin/transactions/export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to convert transactions to CSV
function convertToCSV(transactions: any[]): string {
  if (transactions.length === 0) {
    return '';
  }

  // Define CSV headers
  const headers = [
    'ID',
    'User ID',
    'Order ID',
    'Type',
    'Method',
    'Amount',
    'Status',
    'Reference ID',
    'Description',
    'Created Date',
    'Completed Date',
    'Failure Reason',
  ];

  // Create CSV rows
  const rows = transactions.map((tx) => [
    tx.id,
    tx.user_id || '',
    tx.order_id || '',
    tx.type,
    tx.method,
    tx.amount,
    tx.status,
    tx.reference_id || '',
    (tx.description || '').replace(/"/g, '""'), // Escape quotes
    tx.created_at,
    tx.completed_at || '',
    (tx.failure_reason || '').replace(/"/g, '""'), // Escape quotes
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
