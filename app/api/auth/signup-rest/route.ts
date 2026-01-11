import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log("[signup-rest API] ========== SIGNUP (ADMIN) ENDPOINT CALLED ==========");
    console.log("[signup-rest API] Request body:", { email, password });

    if (!email || !password) {
      console.warn("[signup-rest API] Missing email or password");
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      console.error("[signup-rest API] Service role key is missing");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    console.log("[signup-rest API] URL:", supabaseUrl);
    console.log("[signup-rest API] Using SERVICE ROLE KEY for admin user creation");

    // Use Supabase Admin API to create a CONFIRMED user
    // This endpoint creates users that are immediately confirmed
    const adminUrl = `${supabaseUrl}/auth/v1/admin/users`;
    
    console.log("[signup-rest API] Calling admin endpoint:", adminUrl);

    const adminResponse = await fetch(adminUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true, // AUTO-CONFIRM THE EMAIL
        user_metadata: {
          role: "patient",
        },
      }),
    });

    const adminData = await adminResponse.json();
    console.log("[signup-rest API] Admin response status:", adminResponse.status);
    console.log("[signup-rest API] Admin response:", JSON.stringify(adminData, null, 2));

    if (!adminResponse.ok) {
      console.error("[signup-rest API] Admin API error:", adminData);
      return NextResponse.json(
        { error: adminData.error_description || adminData.message || "Failed to create user" },
        { status: adminResponse.status }
      );
    }

    // The admin API returns user object at top level (not nested)
    const userId = adminData.id;
    console.log("[signup-rest API] CONFIRMED user created successfully:", userId);
    console.log("[signup-rest API] Email confirmed status:", adminData.email_confirmed_at);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: adminData.email,
        confirmed: !!adminData.email_confirmed_at,
      },
    });
  } catch (error) {
    console.error("[signup-rest API] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
