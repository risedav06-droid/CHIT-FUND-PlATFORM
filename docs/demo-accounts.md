# Demo Accounts

## Default Password

- `DEMO_PASSWORD` from `.env`, if set.
- Otherwise the seed script uses `Pilot@12345`.

## Before Login

- Set a real `AUTH_SECRET` in `.env` before sharing pilot access.
- Ensure the database server referenced by `DATABASE_URL` is running.
- Ensure `npm run seed:demo` has completed successfully for the current environment.
- If `AUTH_SECRET` changes, existing sessions are invalidated and users must log in again.

## Accounts

- `pilot.superadmin@chitflow.local`
  Role: `SUPER_ADMIN`
  Landing: `/dashboard`

- `pilot.organizer@chitflow.local`
  Role: `ORGANIZER`
  Landing: `/dashboard`

- `pilot.agent@chitflow.local`
  Role: `AGENT`
  Landing: `/dashboard`

- `pilot.member@chitflow.local`
  Role: `MEMBER`
  Landing: own `/members/[memberId]`

## Permission Summary

- `SUPER_ADMIN`: full pilot access.
- `ORGANIZER`: full operational access except super-admin-only governance outside current pilot scope.
- `AGENT`: can record payments and work collection flows, but cannot create chit groups, finalize auctions, approve payouts, or access the auctions or reports workspace.
- `MEMBER`: can access only own record, own dashboard, and own notifications.

## Seed Notes

- The member demo user is linked to an existing active member when possible.
- If no eligible member exists, the seed creates a demo member record.
- Seeded users receive a welcome notification in the notification center.
