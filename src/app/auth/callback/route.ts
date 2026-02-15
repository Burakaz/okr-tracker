import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * Validates that a redirect path is safe (relative, no protocol, no double slashes).
 * Prevents open redirect attacks via the `next` query parameter.
 */
function sanitizeRedirectPath(path: string): string {
  // Must start with / and not contain protocol indicators or double slashes
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("://") ||
    path.includes("\\")
  ) {
    return "/dashboard";
  }
  return path;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeRedirectPath(searchParams.get("next") ?? "/dashboard");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const serviceClient = await createServiceClient();

      // Check if user exists
      const { data: existingUser } = await serviceClient
        .from("profiles")
        .select("id, status")
        .eq("id", data.user.id)
        .single();

      if (existingUser?.status === "suspended" || existingUser?.status === "inactive") {
        logger.warn("Login attempt by suspended/inactive user", {
          userId: data.user.id,
          status: existingUser.status,
        });
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/auth/login?error=suspended`);
      }

      // Check if it's the first user (becomes super_admin)
      // Note: The trigger creates a profile on auth signup, so count will be 1 for the first user
      const { count } = await serviceClient
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const isFirstUser = !existingUser && (count === 0 || count === 1);

      // Always update avatar_url from OAuth provider on each login
      const newAvatarUrl = data.user.user_metadata.avatar_url ||
                           data.user.user_metadata.picture ||
                           null;

      const { error: upsertError } = await serviceClient.from("profiles").upsert(
        {
          id: data.user.id,
          email: data.user.email!.toLowerCase(),
          name:
            data.user.user_metadata.full_name ||
            data.user.user_metadata.name ||
            data.user.email!.split("@")[0],
          avatar_url: newAvatarUrl,
          role: isFirstUser ? "super_admin" : existingUser ? undefined : "employee",
          status: "active",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
          ignoreDuplicates: false,
        }
      );

      if (upsertError) {
        logger.error("Profile upsert failed during auth callback", {
          userId: data.user.id,
          error: upsertError.message,
        });
      }

      logger.audit("auth.login", {
        userId: data.user.id,
        isFirstUser,
        isNewUser: !existingUser,
      });

      return NextResponse.redirect(`${origin}${next}`);
    }

    if (error) {
      logger.error("Auth code exchange failed", {
        error: error.message,
      });
    }
  }

  // Auth failed
  logger.warn("Auth callback failed - no code or session exchange error");
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
