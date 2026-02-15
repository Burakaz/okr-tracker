/**
 * Request Timing Utility for API Routes
 *
 * Wraps Next.js route handlers to automatically:
 * - Measure total request duration
 * - Log request start/finish with the structured logger
 * - Add X-Response-Time and X-Request-Id headers
 * - Flag slow requests (> 2 seconds)
 *
 * Usage:
 *   import { withTiming } from '@/lib/request-timing';
 *
 *   export const GET = withTiming(async (request, context) => {
 *     // your handler logic
 *     return NextResponse.json({ data });
 *   });
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger, generateRequestId, type LogContext } from './logger';

type RouteParams = { params: Promise<Record<string, string>> };

type RouteHandler = (
  request: NextRequest,
  context: RouteParams,
) => Promise<NextResponse> | NextResponse;

/**
 * Extract user ID from the request if auth cookie pattern is present.
 * This is a best-effort, non-intrusive check -- it does NOT perform auth validation.
 */
function extractPathFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname;
  } catch {
    return 'unknown';
  }
}

/**
 * Wraps a route handler with request timing, logging, and response headers.
 */
export function withTiming(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context: RouteParams) => {
    const requestId = generateRequestId();
    const method = request.method;
    const path = extractPathFromUrl(request.url);

    const reqLog = logger.request(method, path, { requestId });

    try {
      const response = await handler(request, context);
      const durationMs = Date.now() - reqLog.startTime;

      // Attach timing and request ID headers
      response.headers.set('X-Response-Time', `${durationMs}ms`);
      response.headers.set('X-Request-Id', requestId);

      reqLog.finish(response.status);
      return response;
    } catch (error) {
      const durationMs = Date.now() - reqLog.startTime;
      const errorContext: LogContext = {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        durationMs,
      };

      logger.error(`Unhandled error in ${method} ${path}`, errorContext);

      const errorResponse = NextResponse.json(
        { error: 'Interner Serverfehler' },
        { status: 500 }
      );
      errorResponse.headers.set('X-Response-Time', `${durationMs}ms`);
      errorResponse.headers.set('X-Request-Id', requestId);

      reqLog.finish(500, errorContext);
      return errorResponse;
    }
  };
}
