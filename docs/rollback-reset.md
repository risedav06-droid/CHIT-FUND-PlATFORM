# Rollback And Reset

## Safe Reset For Local Development

Use this only when you want to reset app state around your Supabase test project.

1. Stop writes to the app.
2. Export any data you need from Supabase first.
3. Re-run the SQL in `supabase/schema.sql` if you need to recreate tables and policies.

## Environment Rollback

- Re-check `.env.local` before restarting.
- Confirm the Supabase project URL and publishable key are correct.
- Re-check `AUTH_SECRET` if you are using any local server-side signing helpers.

## After Reset

- Run `npm run lint`.
- Run `npm run build`.
- Run `npm run dev`.
