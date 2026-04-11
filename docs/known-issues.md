# Known Issues

## Must Fix Before Pilot

- `AUTH_SECRET` cannot remain on the local fallback value. Replace it in `.env` before pilot access is shared.
- The current workspace still reports the pilot database as unreachable at the configured `DATABASE_URL`, so `/reports/pilot` cannot complete live validation until connectivity is restored.

## Known Gaps Accepted For Controlled Pilot

- Notification delivery is currently in-app only. WhatsApp, SMS, and email remain future provider integrations.
- Payout proof uses a placeholder URL or acknowledgment field instead of real file upload storage.
- Pilot QA is still driven by manual walkthroughs plus the `/reports/pilot` readiness board. Full browser automation is not in place yet.

## Watch Closely During Pilot

- Failed notification delivery entries in the notification log.
- Any readiness failures reported under installment balances, payout validity, duplicate references, or missing audit logs.
- Operators skipping confirmation steps during auction finalization or payout status changes.
- Any role landing page, navigation item, or action button that appears for a role but still redirects due to a permission mismatch.
- Browser print output differences between desktop and mobile for export-safe views.

## Post-Pilot Follow-Ups

- Add automated smoke tests for seeded demo users and guarded flows.
- Add real external notification channels.
- Add attachment storage for payout proof and acknowledgments.
- Add richer approval history for payout and auction decisions.
