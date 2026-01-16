import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const allCookies = request.cookies.getAll();
  const authCookies = allCookies.filter(c => c.name.includes('sb-') || c.name.includes('auth'));
  
  return NextResponse.json({
    allCookies: allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + "..." })),
    authCookies: authCookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + "..." })),
    cookieCount: allCookies.length,
  });
}
