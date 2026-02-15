# OKR Tracker - Incident Response Playbook

## General Incident Response Process

1. **Detect** - Alert fires or user reports issue
2. **Acknowledge** - Confirm the incident and assess severity
3. **Diagnose** - Follow the relevant playbook below
4. **Fix** - Apply the appropriate remediation
5. **Verify** - Confirm the fix resolves the issue
6. **Post-mortem** - Document root cause and preventive measures

---

## Playbook 1: Login Not Working

### Symptoms
- Users see "auth_failed" error on the login page
- Users are redirected back to `/auth/login?error=auth_failed` after clicking "Sign in with Google"
- Users report "suspended" error message
- OAuth consent screen does not appear

### Diagnosis Steps

1. **Check Supabase Auth service status**
   - Visit: `https://status.supabase.com`
   - Check Supabase Dashboard > Authentication > Users for recent sign-in attempts

2. **Check Google OAuth configuration**
   - Supabase Dashboard > Authentication > Providers > Google
   - Verify Client ID and Client Secret are set and not expired
   - Google Cloud Console > APIs & Services > Credentials
   - Verify the OAuth consent screen is published (not in "Testing" mode)

3. **Check callback URL configuration**
   - Supabase Dashboard > Authentication > URL Configuration
   - Verify Site URL: `https://okr-tracker-roan.vercel.app`
   - Verify Redirect URLs include: `https://okr-tracker-roan.vercel.app/auth/callback`
   - Also check for any preview deployment URLs if applicable

4. **Check application logs**
   - Vercel Dashboard > Deployments > Functions > Runtime Logs
   - Filter for: `auth.login` or `Auth code exchange failed`
   - Look for `auth callback failed` warning messages

5. **Check for suspended users**
   - Filter logs for: `Login attempt by suspended/inactive user`
   - Query Supabase: `SELECT id, email, status FROM profiles WHERE status != 'active'`

### Fix

| Root Cause | Fix |
|-----------|-----|
| Supabase Auth outage | Wait for resolution; monitor status page |
| Google OAuth credentials expired | Regenerate in Google Cloud Console, update in Supabase |
| Incorrect callback URL | Add correct URL in Supabase Auth settings |
| User suspended | Update user status in profiles table: `UPDATE profiles SET status = 'active' WHERE id = '<user_id>'` |
| OAuth consent screen in "Testing" | Publish the OAuth consent screen in Google Cloud Console |

### Verification
- Clear browser cookies for the app domain
- Attempt a fresh login with Google
- Check Vercel logs for successful `auth.login` audit events
- Confirm the user lands on `/dashboard` after login

---

## Playbook 2: Dashboard Shows Blank

### Symptoms
- User logs in successfully but sees a blank/empty dashboard
- OKRs are not loading
- Browser console shows 401, 403, or 500 errors on API calls
- Loading spinners that never resolve

### Diagnosis Steps

1. **Check browser network tab**
   - Open DevTools > Network
   - Look at responses from `/api/okrs` and `/api/auth/me`
   - Note the status codes and error messages

2. **Check if user has a profile**
   ```sql
   SELECT * FROM profiles WHERE id = '<user_id>';
   ```
   - Verify `organization_id` is set (not NULL)
   - Verify `status` = 'active'

3. **Check RLS policies**
   ```sql
   -- List all RLS policies on the okrs table
   SELECT * FROM pg_policies WHERE tablename = 'okrs';

   -- Test if user can query their own OKRs
   SELECT count(*) FROM okrs WHERE user_id = '<user_id>';
   ```

4. **Check Vercel function logs**
   - Filter for the user's ID in structured logs
   - Look for `Profile not found` or `Keine Organisation zugewiesen` errors

5. **Check middleware**
   - Verify `/src/middleware.ts` is not blocking the request
   - Check if session cookies are being set correctly

### Fix

| Root Cause | Fix |
|-----------|-----|
| Missing profile | The auth callback trigger should create it; check `src/app/auth/callback/route.ts` logs for upsert errors |
| No organization_id | Assign org: `UPDATE profiles SET organization_id = '<org_id>' WHERE id = '<user_id>'` |
| RLS blocking queries | Service client is used for data queries, so RLS should not apply; check if `SUPABASE_SERVICE_ROLE_KEY` env var is set |
| Expired session | User should log out and log back in |
| Missing env variables | Check Vercel > Settings > Environment Variables for all Supabase keys |

### Verification
- Hit `/api/health` to verify Supabase connectivity
- Hit `/api/auth/me` to verify user profile loads
- Hit `/api/okrs` to verify OKR data loads
- Refresh the dashboard page

---

## Playbook 3: Supabase High Latency

### Symptoms
- API responses taking > 2 seconds (slow request warnings in logs)
- Dashboard feels sluggish
- Health check shows high `durationMs` on the supabase check
- Users report timeouts

### Diagnosis Steps

1. **Check Supabase Dashboard**
   - Database > Reports > Database Health
   - Check CPU, Memory, I/O metrics
   - Query Performance tab for slow queries

2. **Check connection pool**
   ```sql
   -- Current active connections
   SELECT count(*) FROM pg_stat_activity;

   -- Connections by state
   SELECT state, count(*) FROM pg_stat_activity GROUP BY state;

   -- Long-running queries
   SELECT pid, now() - pg_stat_activity.query_start AS duration, query
   FROM pg_stat_activity
   WHERE state = 'active' AND now() - query_start > interval '5 seconds'
   ORDER BY duration DESC;
   ```

3. **Check for slow queries**
   ```sql
   -- Top 10 slowest queries by mean execution time
   SELECT query, calls, mean_exec_time, total_exec_time
   FROM pg_stat_statements
   WHERE mean_exec_time > 100
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

4. **Check RLS policy complexity**
   ```sql
   -- Count policies per table
   SELECT tablename, count(*) FROM pg_policies GROUP BY tablename ORDER BY count DESC;

   -- Check if any policies involve subqueries
   SELECT tablename, policyname, qual FROM pg_policies WHERE qual LIKE '%SELECT%';
   ```

5. **Check table sizes and index usage**
   ```sql
   -- Large tables
   SELECT relname, n_live_tup, pg_size_pretty(pg_total_relation_size(relid))
   FROM pg_stat_user_tables
   ORDER BY n_live_tup DESC;

   -- Missing indexes (sequential scans on large tables)
   SELECT relname, seq_scan, idx_scan
   FROM pg_stat_user_tables
   WHERE seq_scan > idx_scan AND n_live_tup > 1000;
   ```

### Fix

| Root Cause | Fix |
|-----------|-----|
| Connection pool exhaustion | Check for connection leaks; consider upgrading Supabase plan |
| Slow query on okrs table | Add missing indexes; optimize the query |
| Complex RLS policies | Simplify RLS; the app uses service role client so RLS should be bypassed |
| Large table scans | Add appropriate indexes: `CREATE INDEX idx_okrs_user_quarter ON okrs(user_id, quarter)` |
| Database under-provisioned | Upgrade Supabase compute add-on |
| Long-running transactions | Identify and terminate: `SELECT pg_terminate_backend(<pid>)` |

### Verification
- Check `/api/health` response time (should be < 200ms)
- Monitor X-Response-Time headers on API calls
- Check structured logs for absence of slow request warnings
- Verify Supabase Dashboard shows normal CPU/memory

---

## Playbook 4: API 500 Errors

### Symptoms
- Users see "Interner Serverfehler" error messages
- Vercel function logs show 500 status codes
- Multiple routes returning errors simultaneously

### Diagnosis Steps

1. **Check Vercel function logs**
   - Vercel Dashboard > Deployments > Functions
   - Filter for `"level":"error"` in Runtime Logs
   - Note the `requestId` for detailed tracing
   - Look at the `error` and `stack` fields in the structured logs

2. **Check if errors are isolated or widespread**
   - Single route? Check that specific route handler
   - All routes? Likely a Supabase connectivity issue
   - Only authenticated routes? Check auth/session handling

3. **Check Supabase service status**
   - `https://status.supabase.com`
   - Try `/api/health` to isolate Supabase vs app issues

4. **Check environment variables**
   - Vercel Dashboard > Settings > Environment Variables
   - Verify all required vars are set:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
   - Check if a recent deployment accidentally removed env vars

5. **Check for code deployment issues**
   - Hit `/api/version` to see which commit is deployed
   - Compare with the expected commit on the main branch
   - Check if a recent deployment introduced regressions

### Fix

| Root Cause | Fix |
|-----------|-----|
| Supabase outage | Monitor status page; the health endpoint will return 503 |
| Missing env variables | Re-add in Vercel dashboard and redeploy |
| Code regression | Rollback via Vercel: Deployments > Previous > Promote to Production |
| Database schema mismatch | Check if a migration was missed; run pending migrations |
| Rate limiting from Supabase | Check Supabase plan limits; upgrade if needed |
| Unhandled exception in route | Fix the bug using the stack trace from structured logs |

### Verification
- `/api/health` returns 200
- `/api/version` shows the correct commit
- Test the failing routes manually
- Check structured logs show info-level (not error) responses
- Monitor for 5 minutes for recurring errors

---

## Playbook 5: Data Inconsistency

### Symptoms
- OKR progress not updating after check-in
- Key results showing stale values
- Audit logs missing entries

### Diagnosis Steps

1. **Check database triggers**
   ```sql
   -- List all triggers on relevant tables
   SELECT trigger_name, event_manipulation, action_statement
   FROM information_schema.triggers
   WHERE event_object_table IN ('okrs', 'key_results', 'okr_checkins');
   ```

2. **Check for failed audit log writes**
   - Search structured logs for `logOKRCreate`, `logCheckinCreate` errors
   - Audit writes are non-blocking (`.catch(() => {})`), so failures are silent

3. **Verify key result calculations**
   ```sql
   -- Check if KR progress matches expected values
   SELECT kr.id, kr.title, kr.start_value, kr.current_value, kr.target_value, kr.progress
   FROM key_results kr
   WHERE kr.okr_id = '<okr_id>';

   -- Check OKR progress vs KR average
   SELECT o.id, o.progress,
          avg(kr.progress) as calculated_progress
   FROM okrs o
   JOIN key_results kr ON kr.okr_id = o.id
   WHERE o.id = '<okr_id>'
   GROUP BY o.id, o.progress;
   ```

### Fix

| Root Cause | Fix |
|-----------|-----|
| Trigger not firing | Recreate the trigger; check for `DISABLE TRIGGER` statements |
| Progress calculation wrong | Manually recalculate and update the OKR progress |
| Audit log insert failing | Check `okr_audit_logs` table permissions and schema |

### Verification
- Perform a test check-in and verify progress updates
- Query the database directly to confirm values match the UI
- Check audit logs for the test check-in entry

---

## Emergency Contacts and Links

| Resource | Link |
|----------|------|
| Vercel Dashboard | `https://vercel.com/dashboard` |
| Supabase Dashboard | `https://supabase.com/dashboard/project/bgvpbssmnyrwhcjhuutq` |
| Supabase Status | `https://status.supabase.com` |
| Vercel Status | `https://www.vercel-status.com` |
| App Health Check | `https://okr-tracker-roan.vercel.app/api/health` |
| App Version | `https://okr-tracker-roan.vercel.app/api/version` |
| Google Cloud Console | `https://console.cloud.google.com` |
