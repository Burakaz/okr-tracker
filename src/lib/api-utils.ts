import { NextResponse } from "next/server";

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
