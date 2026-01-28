import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface UpdateSaleRequest {
  itemId: string;
  table: 'otc_drugs' | 'prescription_drugs' | 'inventory';
  categoryType: 'regular' | 'sale' | 'clearance';
  salePrice?: number;
  saleDiscountPercent?: number;
  saleStartDate?: string; // ISO date string
  saleEndDate?: string; // ISO date string
}

// PATCH: Update sale/clearance status for a single item
export async function PATCH(request: NextRequest) {
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

    const body: UpdateSaleRequest = await request.json();
    const { itemId, table, categoryType, salePrice, saleDiscountPercent, saleStartDate, saleEndDate } = body;

    // Validate inputs
    if (!itemId || !table || !categoryType) {
      return NextResponse.json(
        { error: 'Missing required fields: itemId, table, categoryType' },
        { status: 400 }
      );
    }

    if (!['otc_drugs', 'prescription_drugs', 'inventory'].includes(table)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    if (!['regular', 'sale', 'clearance'].includes(categoryType)) {
      return NextResponse.json({ error: 'Invalid categoryType' }, { status: 400 });
    }

    // Validate sale data if setting as sale
    if (categoryType === 'sale') {
      if (!salePrice || !saleDiscountPercent || !saleStartDate || !saleEndDate) {
        return NextResponse.json(
          { error: 'Sale items require: salePrice, saleDiscountPercent, saleStartDate, saleEndDate' },
          { status: 400 }
        );
      }

      // Validate dates
      const startDate = new Date(saleStartDate);
      const endDate = new Date(saleEndDate);
      if (endDate <= startDate) {
        return NextResponse.json({ error: 'Sale end date must be after start date' }, { status: 400 });
      }
    }

    // Prepare update data
    let updateData: any = { category_type: categoryType };

    if (categoryType === 'sale') {
      updateData = {
        ...updateData,
        sale_price: salePrice,
        sale_discount_percent: saleDiscountPercent,
        sale_start_date: saleStartDate,
        sale_end_date: saleEndDate,
      };
    } else if (categoryType === 'clearance') {
      updateData = {
        ...updateData,
        sale_price: salePrice || null,
        sale_discount_percent: saleDiscountPercent || null,
        sale_start_date: null,
        sale_end_date: null,
      };
    } else {
      // Regular - clear all sale data
      updateData = {
        ...updateData,
        sale_price: null,
        sale_discount_percent: null,
        sale_start_date: null,
        sale_end_date: null,
      };
    }

    // Update the item
    const { data: updatedItem, error: updateError } = await supabaseAdmin
      .from(table)
      .update(updateData)
      .eq('id', itemId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Item updated successfully',
      item: updatedItem,
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/inventory/sales:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: List items by sale/clearance status
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

    const { searchParams } = new URL(request.url);
    const categoryType = searchParams.get('categoryType') || 'sale'; // Default to 'sale'
    const table = searchParams.get('table') || 'otc_drugs'; // Default to otc_drugs
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = 20;

    // Validate inputs
    if (!['regular', 'sale', 'clearance'].includes(categoryType)) {
      return NextResponse.json({ error: 'Invalid categoryType' }, { status: 400 });
    }

    if (!['otc_drugs', 'prescription_drugs', 'inventory'].includes(table)) {
      return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
    }

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Fetch items
    const { data: items, error: itemsError, count } = await supabaseAdmin
      .from(table)
      .select('*', { count: 'exact' })
      .eq('category_type', categoryType)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (itemsError) {
      console.error('Query error:', itemsError);
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }

    return NextResponse.json({
      data: items || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/inventory/sales:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
