import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: prescriptionId } = await params;

  try {
    const cookieStore = await cookies();

    // Use SSR client for auth verification
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options as CookieOptions);
              });
            } catch (error) {
              console.error("Cookie error:", error);
            }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Create admin client that bypasses RLS using service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user is admin using service role to bypass RLS
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { medication_name, dosage, quantity, notes, price, source } = body;

    if (!medication_name || !dosage || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Determine which table to use based on source
    const itemsTable = source === "doctor" ? "doctor_prescriptions_items" : "prescription_items";

    // Insert prescription item using admin client
    const { data, error } = await supabaseAdmin
      .from(itemsTable)
      .insert([
        {
          [source === "doctor" ? "doctor_prescription_id" : "prescription_id"]: prescriptionId,
          medication_name,
          dosage,
          quantity: parseInt(quantity),
          total_amount: parseInt(quantity),
          notes: notes || null,
          price: price ? parseFloat(price) : null,
        },
      ])
      .select();

    if (error) {
      console.error("Error creating prescription item:", error);
      return NextResponse.json(
        { error: "Failed to create prescription item" },
        { status: 500 }
      );
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: prescriptionId } = await params;

  try {
    const cookieStore = await cookies();

    // Use SSR client for auth verification
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options as CookieOptions);
              });
            } catch (error) {
              console.error("Cookie error:", error);
            }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Create admin client that bypasses RLS using service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user is admin using service role to bypass RLS
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { itemId, medication_name, dosage, quantity, notes, price, source } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: "Missing item ID" },
        { status: 400 }
      );
    }

    // Determine which table to use based on source
    const itemsTable = source === "doctor" ? "doctor_prescriptions_items" : "prescription_items";
    const foreignKeyColumn = source === "doctor" ? "doctor_prescription_id" : "prescription_id";

    // Update prescription item using admin client
    const { data, error } = await supabaseAdmin
      .from(itemsTable)
      .update({
        medication_name,
        dosage,
        quantity: parseInt(quantity),
        notes: notes || null,
        price: price ? parseFloat(price) : null,
      })
      .eq("id", itemId)
      .eq(foreignKeyColumn, prescriptionId)
      .select();

    if (error) {
      console.error("Error updating prescription item:", error);
      return NextResponse.json(
        { error: "Failed to update prescription item" },
        { status: 500 }
      );
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: prescriptionId } = await params;

  try {
    const cookieStore = await cookies();

    // Use SSR client for auth verification
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options as CookieOptions);
              });
            } catch (error) {
              console.error("Cookie error:", error);
            }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Create admin client that bypasses RLS using service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user is admin using service role to bypass RLS
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { itemId, source } = await request.json();

    if (!itemId) {
      return NextResponse.json(
        { error: "Missing item ID" },
        { status: 400 }
      );
    }

    const itemsTable = source === "doctor" ? "doctor_prescriptions_items" : "prescription_items";
    const foreignKeyColumn = source === "doctor" ? "doctor_prescription_id" : "prescription_id";

    // Delete prescription item using admin client
    const { error } = await supabaseAdmin
      .from(itemsTable)
      .delete()
      .eq("id", itemId)
      .eq(foreignKeyColumn, prescriptionId);

    if (error) {
      console.error("Error deleting prescription item:", error);
      return NextResponse.json(
        { error: "Failed to delete prescription item" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
