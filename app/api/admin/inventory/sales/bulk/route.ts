import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface BulkSaleOperation {
  itemIds: string[];
  table: 'otc_drugs' | 'prescription_drugs' | 'inventory';
  operation: 'mark_sale' | 'mark_clearance' | 'mark_regular';
  salePrice?: number;
  saleDiscountPercent?: number;
  saleStartDate?: string;
  saleEndDate?: string;
}

// POST: Bulk update sale/clearance status
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

    const body: BulkSaleOperation = await request.json();
    const { itemIds, table, operation, salePrice, saleDiscountPercent, saleStartDate, saleEndDate } = body;

    // Validate inputs
    if (!itemIds || itemIds.length === 0 || !table || !operation) {
      return NextResponse.json(
        { error: 'Missing required fields: itemIds (non-empty array), table, operation' },
        { status: 400 }
      );
    }

    if (!['otc_drugs', 'prescription_drugs', 'inventory'].includes(table)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    if (!['mark_sale', 'mark_clearance', 'mark_regular'].includes(operation)) {
      return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }

    // Validate sale data if marking as sale
    if (operation === 'mark_sale') {
      if (!salePrice || !saleDiscountPercent || !saleStartDate || !saleEndDate) {
        return NextResponse.json(
          { error: 'Sale operation requires: salePrice, saleDiscountPercent, saleStartDate, saleEndDate' },
          { status: 400 }
        );
      }

      const startDate = new Date(saleStartDate);
      const endDate = new Date(saleEndDate);
      if (endDate <= startDate) {
        return NextResponse.json({ error: 'Sale end date must be after start date' }, { status: 400 });
      }
    }

    // Prepare update data based on operation
    let updateData: any;
    if (operation === 'mark_sale') {
      updateData = {
        category_type: 'sale',
        sale_price: salePrice,
        sale_discount_percent: saleDiscountPercent,
        sale_start_date: saleStartDate,
        sale_end_date: saleEndDate,
      };
    } else if (operation === 'mark_clearance') {
      updateData = {
        category_type: 'clearance',
        sale_price: salePrice || null,
        sale_discount_percent: saleDiscountPercent || null,
        sale_start_date: null,
        sale_end_date: null,
      };
    } else {
      // mark_regular
      updateData = {
        category_type: 'regular',
        sale_price: null,
        sale_discount_percent: null,
        sale_start_date: null,
        sale_end_date: null,
      };
    }

    // Update all items
    const { error: updateError } = await supabaseAdmin
      .from(table)
      .update(updateData)
      .in('id', itemIds);

    if (updateError) {
      console.error('Bulk update error:', updateError);
      return NextResponse.json({ error: 'Failed to update items' }, { status: 500 });
    }

    return NextResponse.json({
      message: `Successfully updated ${itemIds.length} items to ${operation.replace('mark_', '')}`,
      updatedCount: itemIds.length,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/inventory/sales/bulk:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
