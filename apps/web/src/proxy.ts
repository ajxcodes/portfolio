import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  // Redirect root /admin path to /admin/dashboard
  if (request.nextUrl.pathname === "/admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // 1. Bypass authentication completely in local development or if keys are missing
  const bypassAuth =
    process.env.LOCAL_DEV_BYPASS_AUTH === "true" ||
    process.env.NEXT_PUBLIC_LOCAL_DEV_BYPASS_AUTH === "true" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (bypassAuth) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // 2. Initialize Supabase Server Client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === "/admin/login";
  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");

  // 3. Routing guards
  if (isAdminPath && !isLoginPage) {
    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // Authorization: Verify user email matches white-listed ADMIN_EMAIL configuration
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && user.email !== adminEmail) {
      // Clear cookies by signing out
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL("/admin/login?error=Unauthorized", request.url)
      );
    }
  }

  if (isLoginPage && user) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || user.email === adminEmail) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
