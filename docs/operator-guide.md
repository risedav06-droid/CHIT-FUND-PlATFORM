# Operator Guide

## Roles

- `SUPER_ADMIN`: full pilot access.
- `ORGANIZER`: daily operating owner for groups, auctions, payouts, notifications, reports, and exports.
- `AGENT`: member and collection workflows only.
- `MEMBER`: self-service record and notifications only.

## Daily Start

- Log in.
- Confirm the app can reach the pilot database before starting operations. If `/reports/pilot` cannot load, stop and fix connectivity first.
- Confirm pilot auth is using the real `AUTH_SECRET` configuration before sharing access outside the local team.
- Review `/dashboard` for due today, overdue today, pending payouts, upcoming auctions, risky groups, and recent activity.
- Review `/notifications` for reminder backlog or failures.
- Review `/reports/pilot` for any new fail or warn state before starting collection work.

## Collections

- Open `/collections`.
- Select the pending installment.
- Record the received amount, mode, date, and reference where required.
- Reference numbers are normalized, so enter the real bank, UPI, cheque, or online receipt number only once.
- Use remarks for receipt context when the transaction may need later review.
- Confirm the success banner appears before moving to the next receipt.
- Confirm the new receipt appears on the dashboard, reports, exports, and the related member and group views.

## Auctions

- Open `/auctions`.
- Create or open the cycle for the target chit group.
- Check eligible and ineligible tickets before accepting bids.
- Record manual bids.
- Finalize only after confirming the winning ticket, discount amount, and notes.
- Use the finalization confirmation checkbox as a stop-and-review step.
- Before leaving the cycle page, confirm the pending payout, audit entry, and auction result notification are visible.

## Payouts

- Open the payout section on the auction cycle detail page.
- Move `PENDING` to `APPROVED` only after review.
- Move `APPROVED` to `PAID` only when payment is actually completed.
- Enter method, paid date, and reference where required.
- Use rejection only with a clear rejection reason.
- Treat the confirmation checkbox as a final review gate before saving the payout status.
- After every payout update, confirm the status change appears in notifications and the audit trail.

## Reports And Exports

- Open `/reports` for the working summaries.
- Use `/exports/*` views for print-safe sharing or handoff.
- Use date filters before printing collections or overdue exports.

## End Of Day

- Confirm all recorded payments appear on `/dashboard`, `/reports`, and the relevant member or chit group detail pages.
- Review `/notifications` for any failed deliveries.
- Review `/reports/pilot` for new warnings or failures.
- If any permission denied banner appears unexpectedly, stop and confirm the user role before continuing.
