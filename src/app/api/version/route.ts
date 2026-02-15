import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const versionInfo = {
    app: 'okr-tracker',
    version: process.env.APP_VERSION || '0.1.0',
    buildTime: process.env.BUILD_TIME || null,
    gitCommit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT || null,
    gitBranch: process.env.VERCEL_GIT_COMMIT_REF || process.env.GIT_BRANCH || null,
    environment: process.env.NODE_ENV || 'unknown',
    region: process.env.VERCEL_REGION || null,
    runtime: 'nodejs',
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(versionInfo, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
