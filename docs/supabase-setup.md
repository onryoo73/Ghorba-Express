# Supabase Setup (CousinExpress MVP)

## 1) Environment variables

Ensure `.env.local` has:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 2) Create tables and policies

Open your Supabase project SQL Editor and run:

- `supabase/migrations/202604131405_init_cousinexpress.sql`

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

## 3) Verify auth profile creation

1. Sign up a new user in the app.
2. In Supabase Table Editor:
   - `auth.users` should include the user
   - `public.profiles` should include a matching `id` row

## 4) Notes

- Login/sign-up credentials are stored in Supabase Auth (`auth.users`).
- App data is stored in `public` tables above.
- Current policies are MVP-friendly and can be tightened later for admin workflows/disputes.
