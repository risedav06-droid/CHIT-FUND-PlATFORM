# Pilot Checklist

## Before Pilot Start

- Confirm `.env.local` contains the correct Supabase project URL and publishable key.
- Run the SQL in `supabase/schema.sql` from the Supabase SQL Editor.
- Enable Phone Auth in Supabase before testing organiser login.
- Run `npm run lint`.
- Run `npm run build`.
- Open the organiser dashboard and member token portal to confirm the app boots cleanly.

## Core Flow QA

- Request an OTP from `/login`.
- Verify the code and confirm the organiser lands on `/dashboard`.
- Open `/chit-groups` and confirm only organiser-owned groups appear.
- Open a group detail page and its auction screen.
- Open `/member/[token]` with a valid invite token and confirm the member dashboard loads.

## Sign-Off

- Supabase auth is enabled.
- The SQL schema has been applied successfully.
- Organiser login works.
- Member token access works.
- The dashboard, chit groups, auction page, and member portal all load without errors.
