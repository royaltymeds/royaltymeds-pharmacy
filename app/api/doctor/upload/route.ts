import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * POST /api/doctor/upload
 * Upload a prescription file for doctor submissions
 * Uses service role key to bypass RLS
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClientForApi(request);

    // Get authenticated doctor
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

    // Verify user is a doctor using service role client
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const { data: userData, error: roleError } = await adminClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (roleError || userData?.role !== "doctor") {
      return NextResponse.json(
        { error: "Only doctors can access this endpoint" },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Upload file to Supabase Storage
    const fileName = `doctor/${user.id}/${Date.now()}-${file.name}`;
    const bytes = await file.arrayBuffer();
    
    const { error: uploadError } = await supabase.storage
      .from("royaltymeds_storage")
      .upload(fileName, bytes, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("royaltymeds_storage")
      .getPublicUrl(fileName);

    const fileUrl = urlData.publicUrl;

    return NextResponse.json({ 
      success: true, 
      file_url: fileUrl,
      file_name: file.name
    });
  } catch (error) {
    console.error("Doctor upload error:", error);
    return NextResponse.json(
      { error: "Upload failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
