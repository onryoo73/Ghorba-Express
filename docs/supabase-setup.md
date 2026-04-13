# Supabase Setup (CousinExpress MVP)

## 1) Environment variables

Ensure `.env.local` has:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_ADMIN_EMAIL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 2) Create tables and policies

Open your Supabase project SQL Editor and run:

- `supabase/migrations/202604131405_init_cousinexpress.sql`
- `supabase/migrations/202604132000_backend_ops.sql`
- `supabase/migrations/202604132130_chat.sql`

This creates:

- `profiles`
- `trips`
- `orders`
- `payment_proofs`
- `escrow_transactions`
- `reviews`
- `disputes`
- `notifications`
- `audit_logs`
- `chat_threads`
- `chat_messages`

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

## 5) Backend API routes (Next.js)

These server routes now exist:

- `POST /api/orders`
- `POST /api/orders/accept`
- `POST /api/orders/mark-in-transit`
- `POST /api/orders/confirm-delivery`
- `POST /api/escrow/release` (admin)
- `POST /api/escrow/refund` (admin)
- `GET|PATCH /api/admin/disputes` (admin)
- `GET /api/admin/users` (admin)
- `POST /api/chat/threads`
- `GET|POST /api/chat/messages`

For authenticated calls, pass the Supabase access token:

```http
Authorization: Bearer <supabase_access_token>
```
