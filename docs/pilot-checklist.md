# Pilot Checklist

## Before Pilot Start

- Set a real `AUTH_SECRET` in `.env`. Do not use the local fallback secret.
- Confirm `DATABASE_URL` points to the pilot database.
- Confirm the database server referenced by `DATABASE_URL` is running and reachable from the app environment.
- Run `npx prisma generate`.
- Run `npm run seed:demo`.
- Run `npm run lint`.
- Run `npm run build`.
- Open `/reports/pilot` and review all fail and warn states.
- If `/reports/pilot` shows `Pilot database is unreachable`, stop and restore database connectivity before continuing.

## Account And Permission QA

- Log in as `pilot.superadmin@chitflow.local`.
- Log in as `pilot.organizer@chitflow.local`.
- Log in as `pilot.agent@chitflow.local`.
- Log in as `pilot.member@chitflow.local`.
- Confirm the member login lands on its own member record and cannot access another member record.
- Confirm the agent login does not see or access the auctions or reports workspace.
- Confirm only organizer and super admin can create chit groups.
- Confirm only organizer, super admin, and agent can record payments.
- Confirm only organizer and super admin can finalize auctions.
- Confirm only organizer and super admin can approve or mark payouts paid.

## Operational Flow QA

- Record a valid installment payment from `/collections`.
- Confirm collection totals update on `/dashboard`, `/reports`, and `/exports/collections`.
- Confirm the member detail and chit group detail pages reflect the new receipt.
- Create or open an auction cycle from `/auctions`.
- Record at least one bid and finalize the cycle.
- Confirm the finalization creates a pending payout.
- Approve the payout, then mark it paid with a valid method and reference.
- Confirm member detail, chit group detail, auction detail, notifications, reports, exports, and `/reports/pilot` all reflect the changes.

## Notifications QA

- Open `/notifications`.
- Generate reminders as organizer or super admin.
- Confirm due, overdue, and auction reminders appear.
- Confirm auction result notifications appear after finalization.
- Confirm payout status notifications appear after approval, payment, or rejection.
- Confirm the delivery log has no unexpected failures.

## Export And Print QA

- Open `/exports/member-ledger`.
- Open `/exports/group-ledger`.
- Open `/exports/overdue`.
- Open `/exports/collections`.
- Open `/exports/auction-summary`.
- Open `/exports/payout-register`.
- Use the browser print preview for each view and confirm headers, rows, and date filters render cleanly.

## Mobile QA

- Check `/dashboard` on a narrow viewport.
- Check `/collections` on a narrow viewport.
- Check `/auctions/[cycleId]` on a narrow viewport.
- Check `/members/[memberId]` on a narrow viewport.
- Check `/exports/*` on a narrow viewport and confirm wide tables can still be reviewed before print.
- Confirm the mobile nav exposes all route items.
- Confirm sticky submit actions stay reachable above the mobile nav.
- Confirm long cards and tables remain readable without clipped actions or overlapping text.

## Sign-Off

- No fail states remain on `/reports/pilot`.
- `AUTH_SECRET` is set to a real value and the pilot database is reachable.
- All must-fix items from `docs/known-issues.md` are resolved or formally accepted.
- Pilot organizer confirms daily operations can be completed without Excel or paper.
