# Supabase Setup (CousinExpress MVP)

## 1) Environment variables

Ensure `.env.local` has:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_ADMIN_EMAIL=your-admin-email@example.com
```

## 2) Create tables and policies

Open your Supabase project SQL Editor and run:

- `supabase/migrations/202604131405_init_cousinexpress.sql`
- `supabase/migrations/202604131620_strict_auth_and_role_dashboards.sql`

This creates:

- `profiles`
- `trips`
- `orders`
- `payment_proofs`
- `escrow_transactions`
- `reviews`

It also creates:

- enums for roles/statuses
- RLS policies
- auto `updated_at` triggers
- trigger to auto-create a `profiles` row after Auth sign-up
- phone verification profile fields and admin-aware policies
- `disputes` and `withdraw_requests` tables for admin/traveler workflows

## 3) Verify auth profile creation

1. Sign up a new user in the app with phone OTP.
2. In Supabase Table Editor:
   - `auth.users` should include the user
   - `public.profiles` should include a matching `id` row
   - `phone_e164` and `phone_verified` should be populated

## 4) Role dashboards

- Buyer routes: `/buyer/orders`, `/buyer/wallet`
- Traveler routes: `/traveler/trips`, `/traveler/jobs`, `/traveler/earnings`
- Admin routes: `/admin/users`, `/admin/disputes`

Admin access checks:

- fixed email match via `NEXT_PUBLIC_ADMIN_EMAIL`
- or profile flag `profiles.is_admin = true`

## 5) Notes

- Login/sign-up credentials are stored in Supabase Auth (`auth.users`).
- App data is stored in `public` tables above.
- Phone OTP is now the required auth flow in the frontend.
- You can tighten policies further by moving admin email checks to server-side JWT custom claims.
