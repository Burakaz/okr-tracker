import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Adds standard CORS headers to a NextResponse.
 * Restricts to same-origin only (no cross-origin API access needed).
 *
 * SECURITY: Previously set to "*" which allowed any website to make
 * authenticated cross-origin requests to the API, enabling CSRF-like
 * attacks where a malicious site could read OKR data from logged-in users.
 */
export function withCorsHeaders(response: NextResponse): NextResponse {
  // Do NOT set Access-Control-Allow-Origin — same-origin requests work
  // without it, and omitting it blocks cross-origin requests entirely.
  // If cross-origin access is ever needed, restrict to specific trusted origins:
  //   const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL];
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

/**
 * Adds rate limiting informational headers.
 * NOTE: This is a soft signal only. Actual rate limiting
 * should be enforced at the infrastructure level (e.g., Vercel, Cloudflare).
 */
export function withRateLimitHeaders(
  response: NextResponse,
  limit: number = 100,
  remaining: number = 99,
  resetSeconds: number = 60
): NextResponse {
  response.headers.set("X-RateLimit-Limit", String(limit));
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set(
    "X-RateLimit-Reset",
    String(Math.floor(Date.now() / 1000) + resetSeconds)
  );
  return response;
}

/**
 * Creates a standard CORS preflight response for OPTIONS requests.
 */
export function handleCorsPreflightResponse(): NextResponse {
  return withCorsHeaders(
    new NextResponse(null, { status: 204 })
  );
}

/**
 * Ensures the user has a profile with an organization_id.
 * Self-healing: creates profile/org if missing.
 * Returns { organization_id, role } or null on failure.
 */
export async function ensureProfileWithOrg(
  serviceClient: SupabaseClient,
  userId: string,
  userEmail?: string,
  userName?: string,
  avatarUrl?: string
): Promise<{ organization_id: string; role: string } | null> {
  // 1. Try to get existing profile
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("organization_id, role")
    .eq("id", userId)
    .single();

  if (profile?.organization_id) {
    return { organization_id: profile.organization_id, role: profile.role };
  }

  // 2. Get or create default organization
  let orgId: string | null = null;
  const { data: defaultOrg } = await serviceClient
    .from("organizations")
    .select("id")
    .eq("slug", "admkrs")
    .single();

  if (defaultOrg) {
    orgId = defaultOrg.id;
  } else {
    const { data: newOrg } = await serviceClient
      .from("organizations")
      .insert({ name: "ADMKRS", slug: "admkrs" })
      .select("id")
      .single();
    orgId = newOrg?.id ?? null;
  }

  if (!orgId) return null;

  // 3. Upsert profile with organization
  if (profile && !profile.organization_id) {
    // Profile exists but missing org — just update
    const { data: updated } = await serviceClient
      .from("profiles")
      .update({ organization_id: orgId })
      .eq("id", userId)
      .select("organization_id, role")
      .single();
    return updated ? { organization_id: updated.organization_id, role: updated.role } : null;
  }

  // Profile doesn't exist at all — create it
  const { data: newProfile } = await serviceClient
    .from("profiles")
    .upsert({
      id: userId,
      email: userEmail || "",
      name: userName || userEmail?.split("@")[0] || "",
      avatar_url: avatarUrl || "",
      organization_id: orgId,
      role: "employee",
      status: "active",
    })
    .select("organization_id, role")
    .single();

  return newProfile ? { organization_id: newProfile.organization_id, role: newProfile.role } : null;
}
