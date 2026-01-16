import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";

/**
 * GET /api/patient/prescriptions
 * Fetch prescriptions for authenticated patient
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClientForApi(request);

    // Get authenticated user from cookies (set by middleware)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    // Fetch patient's prescriptions
    const { data: prescriptions, error } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Generate signed URLs for file access (valid for 1 hour)
    const prescriptionsWithSignedUrls = await Promise.all(
      (prescriptions || []).map(async (prescription) => {
        if (prescription.file_url) {
          try {
            // Extract the file path from the URL or use it directly if it's already a path
            const filePath = prescription.file_url.includes("royaltymeds_storage/")
              ? prescription.file_url.split("royaltymeds_storage/")[1]
              : prescription.file_url;

            const { data } = supabase.storage
              .from("royaltymeds_storage")
              .getPublicUrl(filePath);

            // Generate a signed URL that's valid for 1 hour (3600 seconds)
            const { data: signedUrl } = await supabase.storage
              .from("royaltymeds_storage")
              .createSignedUrl(filePath, 3600);

            return {
              ...prescription,
              file_url: signedUrl?.signedUrl || null,
            };
          } catch (err) {
            console.error("Error generating signed URL:", err);
            return {
              ...prescription,
              file_url: null,
            };
          }
        }
        return prescription;
      })
    );

    return NextResponse.json({ prescriptions: prescriptionsWithSignedUrls });
  } catch (error) {
    console.error("Prescription fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/patient/prescriptions
 * Create new prescription (file upload handled by client)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClientForApi(request);
    const body = await request.json();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!body.file_url) {
      return NextResponse.json(
        { error: "File URL is required" },
        { status: 400 }
      );
    }

    // Create prescription
    const { data: prescription, error } = await supabase
      .from("prescriptions")
      .insert({
        patient_id: user.id,
        file_url: body.file_url,
        medication_name: body.medication_name || null,
        dosage: body.dosage || null,
        quantity: body.quantity ? parseInt(body.quantity) : null,
        notes: body.notes || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ prescription }, { status: 201 });
  } catch (error) {
    console.error("Prescription creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
