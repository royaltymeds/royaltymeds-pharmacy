import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/prescriptions
 * Fetch all prescriptions for admin
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

    // Create an admin client that bypasses RLS using service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user is admin
    const { data: userData, error: userError2 } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError2 || userData?.role !== "admin") {
      return NextResponse.json(
        { error: "Access denied - admin only" },
        { status: 403 }
      );
    }

    // Fetch all prescriptions with patient info
    const { data: prescriptions, error: prescriptionsError } = await supabaseAdmin
      .from("prescriptions")
      .select("*, users!patient_id(user_profiles(full_name))")
      .order("created_at", { ascending: false });

    if (prescriptionsError) {
      console.error("Error fetching prescriptions:", prescriptionsError);
      return NextResponse.json(
        { error: "Error fetching prescriptions", details: prescriptionsError },
        { status: 500 }
      );
    }

    // Generate signed URLs for prescription files
    const prescriptionsWithSignedUrls = await Promise.all(
      (prescriptions || []).map(async (prescription) => {
        if (!prescription.file_url) return prescription;

        try {
          // Extract file path from storage URL
          const filePath =
            prescription.file_url.split(
              "storage/v1/object/public/royaltymeds_storage/"
            )[1] || prescription.file_url;

          // Generate signed URL with 1-hour expiration
          const { data: signedUrl } = await supabaseAdmin.storage
            .from("royaltymeds_storage")
            .createSignedUrl(filePath, 3600);

          return {
            ...prescription,
            file_url: signedUrl?.signedUrl || null,
          };
        } catch (error) {
          console.error("Error generating signed URL:", error);
          return { ...prescription, file_url: null };
        }
      })
    );

    return NextResponse.json({
      prescriptions: prescriptionsWithSignedUrls,
    });
  } catch (error) {
    console.error("Admin prescriptions fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
