import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET: Fetch sale/clearance items for store display
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { searchParams } = new URL(request.url);
    const categoryType = searchParams.get('categoryType') || 'sale'; // 'sale' or 'clearance'
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = 20;
    const includeExpired = searchParams.get('includeExpired') === 'true';

    // Validate categoryType
    if (!['sale', 'clearance'].includes(categoryType)) {
      return NextResponse.json({ error: 'Invalid categoryType' }, { status: 400 });
    }

    const offset = (page - 1) * pageSize;

    // Build query for OTC drugs
    let query = supabase
      .from('otc_drugs')
      .select('id, name, category, sub_category, sku, unit_price, sale_price, sale_discount_percent, sale_start_date, sale_end_date, quantity_on_hand, status, description, active_ingredient, strength, pack_size', { count: 'exact' })
      .eq('category_type', categoryType)
      .eq('status', 'active');

    // Filter by active sale dates unless includeExpired is true
    if (!includeExpired && categoryType === 'sale') {
      const now = new Date().toISOString();
      query = query
        .lte('sale_start_date', now)
        .gte('sale_end_date', now);
    }

    query = query
      .order('sale_discount_percent', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data: otcItems, error: otcError, count: otcCount } = await query;

    if (otcError) {
      console.error('OTC query error:', otcError);
      return NextResponse.json({ error: 'Failed to fetch sale items' }, { status: 500 });
    }

    // Build query for prescription drugs
    let prescriptionQuery = supabase
      .from('prescription_drugs')
      .select('id, name, category, sub_category, sku, unit_price, sale_price, sale_discount_percent, sale_start_date, sale_end_date, quantity_on_hand, status, description, active_ingredient, strength', { count: 'exact' })
      .eq('category_type', categoryType)
      .eq('status', 'active');

    // Filter by active sale dates unless includeExpired is true
    if (!includeExpired && categoryType === 'sale') {
      const now = new Date().toISOString();
      prescriptionQuery = prescriptionQuery
        .lte('sale_start_date', now)
        .gte('sale_end_date', now);
    }

    prescriptionQuery = prescriptionQuery
      .order('sale_discount_percent', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data: prescriptionItems, error: prescriptionError, count: prescriptionCount } = await prescriptionQuery;

    if (prescriptionError) {
      console.error('Prescription query error:', prescriptionError);
      return NextResponse.json({ error: 'Failed to fetch sale items' }, { status: 500 });
    }

    // Combine results
    const allItems = [...(otcItems || []), ...(prescriptionItems || [])];
    const totalCount = (otcCount || 0) + (prescriptionCount || 0);

    // Sort by discount percentage (descending)
    allItems.sort((a, b) => (b.sale_discount_percent || 0) - (a.sale_discount_percent || 0));

    return NextResponse.json({
      data: allItems,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/store/sale-items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
