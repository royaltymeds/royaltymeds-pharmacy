import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { source } = await request.json();

    if (!source || !["patient", "doctor"].includes(source)) {
      return NextResponse.json(
        { error: "source parameter is required and must be 'patient' or 'doctor'" },
        { status: 400 }
      );
    }

    // Create admin client for full access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Determine which prescription table to query
    const prescriptionTable =
      source === "doctor" ? "doctor_prescriptions" : "prescriptions";
    const itemsTable =
      source === "doctor" ? "doctor_prescriptions_items" : "prescription_items";

    // Fetch prescription with all items
    let selectQuery = `
      id,
      patient_id,
      status,
      created_at
    `;
    
    if (source === "doctor") {
      selectQuery = `
        id,
        patient_id,
        doctor_id,
        status,
        created_at
      `;
    }

    const { data: prescription, error: prescriptionError } = await supabaseAdmin
      .from(prescriptionTable)
      .select(selectQuery)
      .eq("id", id)
      .single();

    if (prescriptionError || !prescription) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      );
    }

    // Type the prescription data
    const typedPrescription = prescription as unknown as { patient_id: string; id: string; status: string; created_at: string; doctor_id?: string };

    // Fetch prescription items
    const { data: items, error: itemsError } = await supabaseAdmin
      .from(itemsTable)
      .select(
        `
        id,
        medication_name,
        dosage,
        quantity,
        price,
        total_amount,
        notes
      `
      )
      .eq(source === "doctor" ? "doctor_prescription_id" : "prescription_id", id);

    if (itemsError) {
      return NextResponse.json(
        { error: "Failed to fetch prescription items" },
        { status: 500 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Prescription has no items" },
        { status: 400 }
      );
    }

    // Validate that all items have prices
    const itemsWithoutPrices = items.filter((item) => !item.price || item.price <= 0);
    if (itemsWithoutPrices.length > 0) {
      return NextResponse.json(
        { error: "All medications must have prices before creating order" },
        { status: 400 }
      );
    }

    // Get payment config for tax and shipping calculations
    const { data: paymentConfig } = await supabaseAdmin
      .from("payment_config")
      .select("*")
      .single();

    // Calculate order totals
    let subtotal = 0;
    const orderItems: Array<{
      medication_name: string;
      quantity: number;
      total_price: number;
    }> = [];

    for (const item of items) {
      const totalPrice = parseFloat(item.price.toString());
      const quantity = parseInt(item.quantity.toString());
      subtotal += totalPrice;

      orderItems.push({
        medication_name: item.medication_name,
        quantity,
        total_price: totalPrice,
      });
    }

    // Calculate tax and shipping
    const tax = paymentConfig && paymentConfig.tax_type === "inclusive" ? 0 : 0;
    const shipping = paymentConfig ? paymentConfig.kingston_delivery_cost : 0;
    const total = subtotal + tax + shipping;

    // Generate unique order number
    function generateOrderNumber(): string {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `RX-${timestamp}${random}`;
    }

    // Create order
    const orderNumber = generateOrderNumber();
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: typedPrescription.patient_id,
        order_number: orderNumber,
        status: "pending",
        subtotal_amount: subtotal,
        tax_amount: tax,
        shipping_amount: shipping,
        total_amount: total,
        payment_status: "unpaid",
        is_prescription_order: true,
        [source === "doctor" ? "doctor_prescription_id" : "prescription_id"]: id,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      return NextResponse.json(
        { error: "Failed to create order", details: orderError.message },
        { status: 500 }
      );
    }

    // Create order items
    const insertItems = orderItems.map((item) => ({
      order_id: orderData.id,
      drug_id: null, // No drug_id for prescription items
      drug_name: item.medication_name,
      quantity: item.quantity,
      total_price: item.total_price,
    }));

    const { error: itemsInsertError } = await supabaseAdmin
      .from("order_items")
      .insert(insertItems);

    if (itemsInsertError) {
      console.error("Order items insertion error:", itemsInsertError);
      // Delete the order we just created since items failed
      await supabaseAdmin.from("orders").delete().eq("id", orderData.id);

      return NextResponse.json(
        { error: "Failed to create order items", details: itemsInsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        order: orderData,
        message: `Prescription order created successfully (Order #${orderNumber})`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating prescription order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
