# OKR Tracker - Monitoring & Observability Guide

## Overview

This document describes the monitoring, alerting, and observability setup for the OKR Tracker application deployed on Vercel with a Supabase backend (project `bgvpbssmnyrwhcjhuutq`, Frankfurt region, Pro Plan).

---

## Health Check Endpoint

**URL:** `GET /api/health`

Returns structured JSON with connectivity and configuration checks.

- **200** = All checks pass (healthy)
- **503** = One or more checks fail (unhealthy)

Use this for uptime monitoring services (e.g., Better Uptime, Checkly, Pingdom).

**Recommended check interval:** Every 60 seconds.

---

## Version Endpoint

**URL:** `GET /api/version`

Returns current app version, git commit SHA, branch, environment, and Vercel region. Useful for verifying which deployment is active after a release.

---

## Key Metrics to Watch

### Application Metrics

| Metric | Source | Alert Threshold |
|--------|--------|----------------|
| Error rate (5xx) | Vercel Logs | > 1% of requests over 5 min |
| API latency p50 | Vercel Logs (X-Response-Time) | > 500ms |
| API latency p95 | Vercel Logs (X-Response-Time) | > 2000ms |
| API latency p99 | Vercel Logs (X-Response-Time) | > 5000ms |
| Auth success rate | Structured logs (auth.login events) | < 95% over 15 min |
| Health check failures | /api/health | Any failure |
| Slow requests (> 2s) | Structured logs (slow request warnings) | > 5 per 5 min |

### Supabase Metrics

| Metric | Source | Alert Threshold |
|--------|--------|----------------|
| Database CPU usage | Supabase Dashboard | > 80% sustained for 5 min |
| Active connections | Supabase Dashboard | > 80% of pool limit |
| Disk usage | Supabase Dashboard | > 80% of plan limit |
| Auth requests/min | Supabase Dashboard | Sudden spike (> 3x normal) |
| API response time | Supabase Dashboard | p95 > 500ms |
| Failed auth attempts | Supabase Auth Logs | > 20 per minute |
| RLS policy evaluation time | Supabase Logs | > 100ms per query |

---

## Structured Logging

All API routes emit structured JSON logs in production with the following fields:

```json
{
  "timestamp": "2025-01-15T10:30:45.123Z",
  "level": "info",
  "message": "GET /api/okrs 200 145ms",
  "service": "okr-tracker",
  "context": {
    "requestId": "req_m5abc123_x7y8z9",
    "userId": "uuid-here",
    "method": "GET",
    "path": "/api/okrs",
    "statusCode": 200,
    "durationMs": 145
  }
}
```

### Log Levels

- **debug**: Development-only verbose output
- **info**: Normal operations (request start/finish, successful actions)
- **warn**: Non-fatal issues (rate limiting, auth failures, slow requests)
- **error**: Failures requiring attention (DB errors, unhandled exceptions)
- **audit**: Business-critical events (login, OKR create/update/delete)

### Searching Logs in Vercel

Filter by structured fields:

- All errors: `level":"error"`
- Specific request: `req_m5abc123`
- User activity: `userId":"<uuid>`
- Slow requests: `Slow request detected`
- Auth events: `auth.login`
- Audit trail: `level":"audit"`

---

## Vercel Analytics Integration

### Setup

1. Go to Vercel Dashboard > Project > Analytics
2. Enable Web Analytics (automatic with Next.js)
3. Enable Speed Insights for Core Web Vitals

### Key Vercel Dashboards

- **Functions**: Monitor serverless function invocations, duration, errors
- **Runtime Logs**: View structured JSON logs from API routes
- **Web Analytics**: Page views, unique visitors, geography
- **Speed Insights**: LCP, FID, CLS, TTFB metrics

### Vercel Log Drains (Recommended)

Set up log drains to forward structured logs to a dedicated logging service:

- Datadog: `vercel integrations add datadog`
- Axiom: Native Vercel integration
- Betterstack: `vercel integrations add betterstack`

---

## Supabase Monitoring Dashboard

### Direct Links

- **Dashboard**: `https://supabase.com/dashboard/project/bgvpbssmnyrwhcjhuutq`
- **Database Health**: `https://supabase.com/dashboard/project/bgvpbssmnyrwhcjhuutq/reports/database`
- **Auth Logs**: `https://supabase.com/dashboard/project/bgvpbssmnyrwhcjhuutq/auth/users`
- **API Logs**: `https://supabase.com/dashboard/project/bgvpbssmnyrwhcjhuutq/logs/edge-logs`
- **Query Performance**: `https://supabase.com/dashboard/project/bgvpbssmnyrwhcjhuutq/database/query-performance`

### Key Database Queries for Monitoring

```sql
-- Active connections count
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Slow queries (> 1 second)
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- RLS policy count per table
SELECT schemaname, tablename, count(*)
FROM pg_policies
GROUP BY schemaname, tablename;
```

---

## Alert Configuration

### Critical (Page On-Call)

- Health check returns 503 for > 2 minutes
- Error rate > 5% for > 3 minutes
- Supabase connection failures
- Auth callback errors > 10/minute

### Warning (Slack Notification)

- API p95 latency > 2 seconds
- Slow request warnings > 10/hour
- Database CPU > 70% for 10 minutes
- Disk usage > 70%

### Informational (Daily Digest)

- Total request count trend
- Auth login count trend
- OKR creation/update counts
- Audit log volume

---

## Request Tracing

Every API request receives a unique `requestId` (format: `req_<timestamp36>_<random>`) that is:

1. Included in all log entries for that request
2. Returned in the `X-Request-Id` response header
3. Available for end-to-end request tracing

Response timing is returned via the `X-Response-Time` header (e.g., `145ms`).

---

## Uptime Monitoring Setup

### Recommended Services

1. **Better Uptime / Betterstack** (recommended for Vercel)
   - Monitor: `https://okr-tracker-roan.vercel.app/api/health`
   - Check interval: 60 seconds
   - Expected status: 200
   - Timeout: 10 seconds
   - Alert: Email + Slack

2. **Checkly** (for synthetic monitoring)
   - API check on `/api/health`
   - Browser check on `/auth/login` page load
   - Multi-region checks from EU (Frankfurt)

3. **Vercel Monitoring** (built-in)
   - Function errors alerts
   - Deployment notifications
