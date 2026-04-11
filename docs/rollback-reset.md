# Rollback And Reset

## Safe Reset For Local Or Disposable Pilot Data

Use this only for a local database or a disposable pilot environment.

```powershell
npx prisma migrate reset --force
npx prisma generate
npm run seed:demo
```

## Safer Pilot Rollback

Use this flow when the pilot database contains records you may need to inspect first.

1. Stop writes to the app.
2. Back up the pilot database.
3. Export any required reports or ledgers.
4. Review `/reports/pilot` and `/notifications` for the latest operator state.
5. Decide whether you need a full reset or a targeted data correction.
6. If the issue is connectivity-related, restore database reachability before attempting app-side validation again.

## Targeted Recovery

- Incorrect payment: add a corrective payment or restore from backup. Do not delete rows directly unless you also reconcile audit expectations.
- Incorrect auction finalization: restore from backup if pilot policy does not allow manual DB repair.
- Incorrect payout transition: restore from backup or correct through approved admin repair steps with audit review.

## Environment Rollback

- Re-check `DATABASE_URL` before restarting.
- Ensure the database server referenced by `DATABASE_URL` is actually running before reopening the app.
- Re-check `AUTH_SECRET` before restarting.
- If `AUTH_SECRET` changed, expect all users to sign in again.
- Re-run `npx prisma generate` after any schema or environment update.

## After Reset Or Rollback

- Run `npm run lint`.
- Run `npm run build`.
- Run `npm run seed:demo` if demo access is required again.
- Open `/reports/pilot` and confirm no fail states remain.
