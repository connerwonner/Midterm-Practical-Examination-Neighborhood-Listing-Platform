# Requirements: Local Merchant Services & Appointment Booking

## Story 1: Merchant submits service drafts (Scope: Medium)
As an authenticated local service provider, I want to submit service listing drafts (e.g., plumbing, home staging, inspection) with hourly rates so that clients can book appointments once verified by administrators.

**Acceptance criteria**
- **Given** an authenticated merchant, **when** they submit a service offering payload, **then** the service is saved with `status = 'draft'` and linked to the provider's `auth.uid()`.
- **Given** a payload with extra keys or `hourly_rate < 0`, **when** it is submitted, **then** the API returns HTTP 400 with structured error details.

**Traceability**
- Migration: `supabase/migrations/20261029140000_exam_services_persistence.sql` (services table, provider RLS policies)
- Route handler: `src/app/api/services/route.ts` (POST)
- Data contract: `src/schemas/service.ts`

## Story 2: Resident browses approved services and requests a booking (Scope: Medium)
As a neighborhood resident, I want to view approved services categorized by neighborhood district and request an appointment booking without viewing bookings or contact information submitted by other clients.

**Acceptance criteria**
- **Given** an anonymous visitor, **when** querying service offerings, **then** only records with `status = 'approved'` and active coverage zones are returned.
- **Given** any visitor, **when** they insert a booking, **then** it is stored; **when** they select from bookings, **then** zero rows are returned.

**Traceability**
- Migration: `supabase/migrations/20261029140000_exam_services_persistence.sql` (public read policies, bookings insert policy)
- Route handler: `src/app/api/services/route.ts` (GET)
- UI: `src/components/ServiceCard.tsx`

## Story 3: Platform admin oversight (Scope: Large)
As a platform administrator, I want unrestricted oversight to approve service listings, deactivate bad actors, and audit all client bookings.

**Acceptance criteria**
- **Given** a user whose `profiles.role = 'admin'`, **when** they update any service status or select from bookings, **then** the operation succeeds.
- **Given** a non-admin user, **when** they attempt to approve a service, **then** the operation is denied by RLS.

**Traceability**
- Migration: `supabase/migrations/20261029140000_exam_services_persistence.sql` (`is_admin()` function and admin policies)
- Server client: `src/lib/supabaseServer.ts` (service role, server only)
