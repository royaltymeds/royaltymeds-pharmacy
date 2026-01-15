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
    const medicationName = formData.get("medicationName") as string;
    const dosage = formData.get("dosage") as string;
    const quantity = formData.get("quantity") as string;
    const frequency = formData.get("frequency") as string;
    const duration = formData.get("duration") as string;
    const notes = formData.get("notes") as string;
    const brandChoice = formData.get("brandChoice") as string;

    if (!file || !medicationName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert file to base64 for storage
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    // Store prescription in database
    const { data, error } = await supabase
      .from("prescriptions")
      .insert([
        {
          patient_id: user.id,
          medication_name: medicationName,
          dosage,
          quantity,
          frequency,
          duration,
          notes,
          brand_choice: brandChoice,
          file_data: base64,
          file_name: file.name,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, prescription: data?.[0] });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
