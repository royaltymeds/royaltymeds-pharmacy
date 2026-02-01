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
  const { items, source } = body; // source: "patient" or "doctor"

  console.log("[Fill] Received request:", {
    prescriptionId,
    source,
    items,
    itemsCount: items?.length,
  });

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

    // Use service role client for database operations and admin verification
    const supabaseAdmin = createClient(URL, SERVICE_ROLE_KEY);

    // Check if user is admin using service role to bypass RLS
    const { data: userData } = await supabaseAdmin
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
    const { data: userProfile } = await supabaseAdmin
      .from("user_profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const pharmacistName = userProfile?.full_name || user.email || "Unknown";

    // Determine which table to use based on source
    const prescriptionTable = source === "doctor" ? "doctor_prescriptions" : "prescriptions";
    const itemsTable = source === "doctor" ? "doctor_prescriptions_items" : "prescription_items";
    const prescriptionItemsRelation = source === "doctor" ? "doctor_prescriptions_items" : "prescription_items";

    // Fetch prescription with items
    const { data: prescription, error: prescriptionError } = await supabaseAdmin
      .from(prescriptionTable)
      .select(
        `
        id,
        status,
        ${prescriptionItemsRelation}(
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
    if (prescription.status !== "processing" && prescription.status !== "partially_filled" && prescription.status !== "approved") {
      return new Response(
        JSON.stringify({ error: `Cannot fill prescription with status: ${prescription.status}` }),
        { status: 400 }
      );
    }

    // Get the items from the relation
    const prescriptionItems = (prescription as any)[prescriptionItemsRelation] || [];

    // Validate and process items
    const itemUpdates = [];
    let hasZeroQuantity = true; // tracks if all quantities are 0

    for (const item of items) {
      const originalItem = prescriptionItems.find((pi: any) => pi.id === item.itemId);

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
      console.log(`[Fill] Updating ${itemsTable} item:`, {
        itemId: update.itemId,
        quantityFilled: update.quantityFilled,
        remainingQuantity: update.remainingQuantity,
        table: itemsTable,
      });
      
      const { error: updateError, data: updateData } = await supabaseAdmin
        .from(itemsTable)
        .update({
          quantity_filled: update.quantityFilled,
          quantity: update.remainingQuantity,
        })
        .eq("id", update.itemId)
        .select();

      if (updateError) {
        console.error(`[Fill] Error updating ${itemsTable} item:`, updateError);
        return new Response(
          JSON.stringify({ error: `Failed to update ${itemsTable} item: ${updateError.message}` }),
          { status: 400 }
        );
      }
      
      console.log(`[Fill] Successfully updated item, returned data:`, updateData);
    }

    // Determine new status
    const newStatus = hasZeroQuantity ? "filled" : "partially_filled";

    // Update prescription with new status and fill info
    const { data: updatedPrescription, error: updatePrescriptionError } = await supabaseAdmin
      .from(prescriptionTable)
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
