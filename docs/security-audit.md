# Row-Level Security Audit

Project: Local Merchant Services & Appointment Booking
Branch: exam/services-booking-eval
Migration under test: supabase/migrations/20261029140000_exam_services_persistence.sql

## Method

- RLS is enabled on all five tables (profiles, service_categories, services, service_category_mappings, bookings), so the default is deny.
- Tests ran in the Supabase SQL Editor inside one PL/pgSQL block. Each role was simulated with `set local role anon` or `set local role authenticated` plus `request.jwt.claims` carrying the user's `sub`.
- The block ends with an intentional `raise exception` that prints the results and rolls back all test writes, so the sample data is unchanged.
- Test data: Provider A (a real auth user with a `provider` profile) owns 3 approved services and 1 draft. Provider B is a second user id with no services. One seed booking was inserted beforehand.
- Admin checks ran with the SQL Editor's elevated privileges, which bypass RLS (equivalent to the server-side service role).

## Authorization test matrix

| # | Role | Action | Expected | Actual | Result |
|---|---|---|---|---|---|
| 1 | Anonymous | SELECT services | Approved only (3) | 3 rows | PASS |
| 2 | Anonymous | SELECT draft services | Denied (0) | 0 rows | PASS (denied) |
| 3 | Client (anon) | INSERT booking | Allowed | 1 row inserted | PASS |
| 4 | Client (anon) | SELECT bookings | Denied (0) | 0 rows | PASS (denied) |
| 5 | Provider B | UPDATE Provider A's draft service | Denied (0 rows) | 0 rows | PASS (denied) |
| 6 | Provider B | SELECT bookings for other provider's services | Denied (0) | 0 rows | PASS (denied) |
| 7 | Provider A | UPDATE own draft service | Allowed | 1 row | PASS |
| 8 | Provider A | UPDATE own approved (live) service | Denied (0 rows) | 0 rows | PASS (denied) |
| 9 | Provider A | UPDATE own draft to status 'approved' (self-approve) | Denied | RLS policy violation on "services" | PASS (denied) |
| 10 | Provider A | SELECT bookings for own services | Allowed | 2 rows | PASS |
| 11 | Provider A | is_admin() | false | false | PASS |
| 12 | Admin (elevated) | Read all services and bookings | Allowed | 4 services, 2 bookings | PASS |

## Raw output (Supabase SQL Editor)

```
AUDIT RESULTS:
Anon: services visible = 3 (expect 3, approved only)
Anon: draft services visible = 0 (expect 0)
Anon/Client: booking insert rows = 1 (expect 1)
Anon/Client: bookings visible = 0 (expect 0)
Provider B: update A's draft rows = 0 (expect 0)
Provider B: bookings visible = 0 (expect 0)
Provider A: update own draft rows = 1 (expect 1)
Provider A: update own APPROVED rows = 0 (expect 0)
Provider A: self-approve DENIED: new row violates row-level security policy for table "services"
Provider A: bookings for own services = 2 (expect 1 or more)
Provider A: is_admin() = f (expect false)
Admin (elevated): all services = 4 (expect 4)
Admin (elevated): all bookings = 2 (expect 2 or more)
```

## API-level checks (curl against the Next.js route handlers)

| Request | Expected | Actual | Result |
|---|---|---|---|
| GET /api/services (no login) | 200, approved services only | 200, `[]` before seeding; 3 cards after seeding | PASS |
| POST /api/services with extra key `status` | 400, structured error | 400, `Unrecognized key: "status"` | PASS |
| POST /api/services valid body, not logged in | 401 | 401 `Unauthorized` | PASS |

## Findings

- Providers cannot approve their own listings: the UPDATE policy's WITH CHECK allows only draft, pending or suspended.
- Providers cannot edit live (approved) listings: the UPDATE and DELETE policies require status draft or suspended.
- Bookings are write-only for the public: anyone can INSERT, but only the owning provider and admins can SELECT.
- The service role key is read only in `src/lib/supabaseServer.ts`, which imports `server-only` and uses no `NEXT_PUBLIC_` prefix.
- Limitation: the admin role was tested with elevated SQL execution. The `is_admin()` policy path for a real admin user (profiles.role = 'admin') was not exercised separately.
