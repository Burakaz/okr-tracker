import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// Force dynamic rendering so health checks are never cached
export const dynamic = 'force-dynamic';

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail';
  message?: string;
  durationMs?: number;
}

const HEALTH_TIMEOUT_MS = 4500; // Keep total under 5s Vercel function limit

/**
 * Check that required environment variables are set.
 */
function checkEnvVars(): HealthCheck {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    return {
      name: 'env_vars',
      status: 'fail',
      message: `Missing: ${missing.join(', ')}`,
    };
  }

  return {
    name: 'env_vars',
    status: 'pass',
  };
}

/**
 * Check Supabase connectivity with a lightweight query.
 */
async function checkSupabase(): Promise<HealthCheck> {
  const start = Date.now();

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        name: 'supabase',
        status: 'fail',
        message: 'Supabase credentials not configured',
      };
    }

    const client = createSupabaseClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Use a simple RPC or raw query to check connectivity
    // We query the profiles table with a limit of 0 just to verify the connection
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

    const { error } = await client
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .limit(0);

    clearTimeout(timeout);

    const durationMs = Date.now() - start;

    if (error) {
      return {
        name: 'supabase',
        status: 'fail',
        message: `Query failed: ${error.message}`,
        durationMs,
      };
    }

    return {
      name: 'supabase',
      status: 'pass',
      durationMs,
    };
  } catch (err) {
    return {
      name: 'supabase',
      status: 'fail',
      message: err instanceof Error ? err.message : 'Unknown error',
      durationMs: Date.now() - start,
    };
  }
}

export async function GET() {
  const start = Date.now();

  try {
    const checks: HealthCheck[] = [];

    // Run checks
    checks.push(checkEnvVars());
    checks.push(await checkSupabase());

    const allPassed = checks.every((c) => c.status === 'pass');
    const totalDurationMs = Date.now() - start;

    const response = {
      status: allPassed ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      durationMs: totalDurationMs,
      version: process.env.APP_VERSION || '0.1.0',
      checks,
    };

    if (!allPassed) {
      logger.warn('Health check failed', {
        checks: checks.filter((c) => c.status === 'fail').map((c) => c.name).join(', '),
        durationMs: totalDurationMs,
      });
    }

    return NextResponse.json(response, {
      status: allPassed ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Response-Time': `${totalDurationMs}ms`,
      },
    });
  } catch (error) {
    const durationMs = Date.now() - start;
    logger.error('Health check endpoint error', {
      error: error instanceof Error ? error.message : String(error),
      durationMs,
    });

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        durationMs,
        checks: [{ name: 'system', status: 'fail', message: 'Internal error' }],
      },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}
