import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const prescriptionId = id;
  const body = await request.json();
  const { items } = body;

  try {
    // Verify user is authenticated and is admin
    const cookieStore = await cookies();
    const supabase = createServerClient(URL, ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Handle errors silently
          }
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: No user found" }),
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userData || userData.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403 }
      );
    }

    // Get admin user profile for pharmacist name
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const pharmacistName = userProfile?.full_name || user.email || "Unknown";

    // Use service role client for database operations
    const supabaseAdmin = createClient(URL, SERVICE_ROLE_KEY);

    // Fetch prescription with items
    const { data: prescription, error: prescriptionError } = await supabaseAdmin
      .from("prescriptions")
      .select(
        `
        id,
        status,
        prescription_items(
          id,
          quantity
        )
      `
      )
      .eq("id", prescriptionId)
      .single();

    if (prescriptionError || !prescription) {
      return new Response(
        JSON.stringify({ error: "Prescription not found" }),
        { status: 404 }
      );
    }

    // Verify prescription is in fillable status
    if (prescription.status !== "processing" && prescription.status !== "partially_filled") {
      return new Response(
        JSON.stringify({ error: `Cannot fill prescription with status: ${prescription.status}` }),
        { status: 400 }
      );
    }

    // Validate and process items
    const itemUpdates = [];
    let hasZeroQuantity = true; // tracks if all quantities are 0

    for (const item of items) {
      const originalItem = prescription.prescription_items.find((pi: any) => pi.id === item.itemId);

      if (!originalItem) {
        return new Response(
          JSON.stringify({ error: `Prescription item not found: ${item.itemId}` }),
          { status: 404 }
        );
      }

      const quantityFilled = parseInt(item.quantityFilled) || 0;

      // Validate quantity filled
      if (quantityFilled < 0) {
        return new Response(
          JSON.stringify({ error: "Quantity filled cannot be negative" }),
          { status: 400 }
        );
      }

      if (quantityFilled > originalItem.quantity) {
        return new Response(
          JSON.stringify({ error: `Quantity filled cannot exceed original quantity for item ${item.itemId}` }),
          { status: 400 }
        );
      }

      const remainingQuantity = originalItem.quantity - quantityFilled;

      // Check if any item has remaining quantity > 0
      if (remainingQuantity > 0) {
        hasZeroQuantity = false;
      }

      itemUpdates.push({
        itemId: item.itemId,
        quantityFilled,
        remainingQuantity,
      });
    }

    // Update prescription items
    for (const update of itemUpdates) {
      const { error: updateError } = await supabaseAdmin
        .from("prescription_items")
        .update({
          quantity_filled: update.quantityFilled,
          quantity: update.remainingQuantity,
        })
        .eq("id", update.itemId);

      if (updateError) {
        console.error("Error updating prescription item:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update prescription item" }),
          { status: 400 }
        );
      }
    }

    // Determine new status
    const newStatus = hasZeroQuantity ? "filled" : "partially_filled";

    // Update prescription with new status and fill info
    const { data: updatedPrescription, error: updatePrescriptionError } = await supabaseAdmin
      .from("prescriptions")
      .update({
        status: newStatus,
        filled_at: new Date().toISOString(),
        pharmacist_name: pharmacistName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", prescriptionId)
      .select()
      .single();

    if (updatePrescriptionError) {
      console.error("Error updating prescription:", updatePrescriptionError);
      return new Response(
        JSON.stringify({ error: "Failed to update prescription" }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          prescription: updatedPrescription,
          items: itemUpdates,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error filling prescription:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
