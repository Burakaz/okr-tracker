import { createServiceClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { cookies } from "next/headers";

const DEMO_EMAIL = "demo@admkrs.com";
const DEMO_NAME = "Demo User";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  // P0-FIX: Demo mode must be explicitly enabled via environment variable
  if (process.env.ENABLE_DEMO_MODE !== "true") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const cookieStore = await cookies();

  // Collect cookies that Supabase sets during verifyOtp
  const pendingCookies: { name: string; value: string; options?: Record<string, unknown> }[] = [];

  try {
    const serviceClient = await createServiceClient();

    // Create a Supabase client that captures cookies into our array
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach((c) => pendingCookies.push(c));
          },
        },
      }
    );

    // Check if demo user exists in auth
    const { data: userList } = await serviceClient.auth.admin.listUsers();
    let demoUser = userList?.users?.find((u) => u.email === DEMO_EMAIL);

    // Create demo user if not exists
    if (!demoUser) {
      const { data: created, error: createError } =
        await serviceClient.auth.admin.createUser({
          email: DEMO_EMAIL,
          email_confirm: true,
          user_metadata: { full_name: DEMO_NAME },
        });

      if (createError || !created.user) {
        logger.error("Demo user creation failed", { error: createError?.message });
        return NextResponse.redirect(`${origin}/auth/login?error=demo_failed`);
      }
      demoUser = created.user;

      // Ensure profile + org exist
      const { data: org } = await serviceClient
        .from("organizations")
        .select("id")
        .limit(1)
        .single();

      if (org) {
        await serviceClient.from("profiles").upsert({
          id: demoUser.id,
          email: DEMO_EMAIL,
          name: DEMO_NAME,
          role: "super_admin",
          status: "active",
          organization_id: org.id,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });
      }
    }

    // Generate magic link token via admin API
    const { data: linkData, error: linkError } =
      await serviceClient.auth.admin.generateLink({
        type: "magiclink",
        email: DEMO_EMAIL,
      });

    if (linkError || !linkData?.properties?.hashed_token) {
      logger.error("Demo magic link generation failed", {
        error: linkError?.message,
      });
      return NextResponse.redirect(`${origin}/auth/login?error=demo_failed`);
    }

    // Exchange token for session — this triggers setAll with session cookies
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: "magiclink",
    });

    if (verifyError) {
      logger.error("Demo OTP verification failed", {
        error: verifyError.message,
      });
      return NextResponse.redirect(`${origin}/auth/login?error=demo_failed`);
    }

    // Build redirect response with session cookies attached
    const redirectUrl = new URL("/dashboard", origin);
    const response = NextResponse.redirect(redirectUrl);

    for (const { name, value, options } of pendingCookies) {
      response.cookies.set(name, value, {
        ...options,
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
      });
    }

    logger.audit("auth.demo_login", { userId: demoUser!.id });
    return response;
  } catch (err) {
    logger.error("Demo login unexpected error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.redirect(`${origin}/auth/login?error=demo_failed`);
  }
}
