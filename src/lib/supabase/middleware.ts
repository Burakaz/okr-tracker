import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

interface CookieToSet {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            const enhancedOptions = {
              ...options,
              maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
              sameSite: 'lax' as const,
              secure: process.env.NODE_ENV === 'production',
            };
            supabaseResponse.cookies.set(name, value, enhancedOptions);
          });
        },
      },
    }
  );

  // Refresh the session - do not remove this
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const protectedPaths = [
    "/dashboard",
    "/admin",
    "/api/okrs",
    "/api/audit",
    "/api/career",
  ];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Block suspended users from API routes
  const isApiPath = request.nextUrl.pathname.startsWith("/api/");
  if (isApiPath && isProtectedPath && user) {
    const supabaseService = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: profile } = await supabaseService
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .single();

    if (profile && profile.status !== "active") {
      return NextResponse.json(
        { error: "Account suspended" },
        { status: 403 }
      );
    }
  }

  // Redirect authenticated users away from auth pages and root
  const isSignoutRoute = request.nextUrl.pathname === "/auth/signout";
  if (user && !isSignoutRoute && (request.nextUrl.pathname.startsWith("/auth") || request.nextUrl.pathname === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
