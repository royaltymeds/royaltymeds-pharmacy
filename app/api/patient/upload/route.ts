import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/**
 * GET /api/patient/upload
 * Get current user (for prescription upload page)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClientForApi(request);

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

    return NextResponse.json({ user });
  } catch (error) {
    console.error("User fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/patient/upload
 * Upload a prescription file
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClientForApi(request);

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

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const medicationsString = formData.get("medications") as string;
    const notes = formData.get("notes") as string;

    if (!file) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let medications: any[] = [];
    if (medicationsString) {
      try {
        medications = JSON.parse(medicationsString);
      } catch (e) {
        console.error("Failed to parse medications:", e);
      }
    }

    // Upload file to Supabase Storage
    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    const bytes = await file.arrayBuffer();
    
    const { error: uploadError } = await supabase.storage
      .from("royaltymeds_storage")
      .upload(fileName, bytes, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("royaltymeds_storage")
      .getPublicUrl(fileName);

    const fileUrl = urlData.publicUrl;

    // Store prescription in database
    const { data: prescriptionData, error: prescriptionError } = await supabase
      .from("prescriptions")
      .insert([
        {
          patient_id: user.id,
          medication_name: medications[0]?.name || null,
          dosage: medications[0]?.dosage || null,
          quantity: medications[0]?.quantity || null,
          notes,
          file_url: fileUrl,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (prescriptionError) throw prescriptionError;

    // Insert additional medications if more than one
    if (medications.length > 1 && prescriptionData?.[0]) {
      const prescriptionId = prescriptionData[0].id;
      const additionalMeds = medications.slice(1).map((med: any) => ({
        prescription_id: prescriptionId,
        medication_name: med.name,
        dosage: med.dosage,
        quantity: med.quantity,
        brand_preferred: med.brandChoice === "brand",
      }));

      const { error: itemsError } = await supabase
        .from("prescription_items")
        .insert(additionalMeds);

      if (itemsError) throw itemsError;
    }

    return NextResponse.json({ success: true, prescription: prescriptionData?.[0] });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
