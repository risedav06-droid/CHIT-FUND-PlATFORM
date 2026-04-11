import type { Route } from "next";
import Link from "next/link";

import { PageEmptyState } from "@/components/ui/page-empty-state";
import { PageErrorState } from "@/components/ui/page-error-state";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";
import { authService } from "@/modules/auth/auth.service";
import { formatAuthRoleLabel } from "@/modules/auth/auth.permissions";
import {
  describePilotReadinessError,
  pilotService,
  type PilotReadinessStatus,
} from "@/modules/pilot/pilot.service";

function statusClasses(status: PilotReadinessStatus) {
  switch (status) {
    case "fail":
      return "border-rose-200 bg-rose-50 text-rose-900";
    case "warn":
      return "border-amber-200 bg-amber-50 text-amber-900";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }
}

function statusLabel(status: PilotReadinessStatus) {
  switch (status) {
    case "fail":
      return "Fail";
    case "warn":
      return "Warn";
    default:
      return "Pass";
  }
}

export default async function PilotReadinessPage() {
  await authService.requirePermission("view_reports", "/reports/pilot");
  const readinessResult = await pilotService
    .getPilotReadiness()
    .then((readiness) => ({ ok: true as const, readiness }))
    .catch((error: unknown) => ({ ok: false as const, error }));

  if (!readinessResult.ok) {
    const errorSummary = describePilotReadinessError(readinessResult.error);

    return (
      <div className="space-y-8">
        <section className="rounded-[1.75rem] border border-border bg-surface p-6">
          <Link href="/reports" className="text-sm font-medium text-brand">
            Back to reports
          </Link>
          <h1 className="mt-6 text-3xl font-semibold text-foreground">
            Pilot readiness
          </h1>
        </section>
        <PageErrorState
          title={errorSummary.title}
          description={errorSummary.description}
        />
        <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-semibold text-amber-950">Next steps</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-amber-900">
            {errorSummary.nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          {readinessResult.error instanceof Error ? (
            <p className="mt-4 text-sm text-amber-900">
              Raw error: {readinessResult.error.message}
            </p>
          ) : null}
        </section>
      </div>
    );
  }

  const { readiness } = readinessResult;

  return (
    <div className="space-y-8">
      <section className="rounded-[1.75rem] border border-border bg-surface p-6">
        <Link href="/reports" className="text-sm font-medium text-brand">
          Back to reports
        </Link>
        <div className="mt-6 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-brand">Pilot readiness</p>
            <h1 className="mt-3 text-3xl font-semibold text-foreground">
              Controlled pilot verification board
            </h1>
            <p className="mt-3 text-sm leading-7 text-muted">
              This board verifies seeded access, route and action guard coverage,
              notifications, exports, and key data integrity rules before a
              controlled pilot run.
            </p>
          </div>
          <span
            className={cn(
              "w-fit rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em]",
              statusClasses(readiness.summary.overallStatus),
            )}
          >
            {statusLabel(readiness.summary.overallStatus)}
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Passing checks"
          value={readiness.summary.passes}
          hint="Automated readiness signals"
        />
        <StatCard
          label="Warnings"
          value={readiness.summary.warnings}
          hint="Needs follow-up before pilot"
        />
        <StatCard
          label="Failures"
          value={readiness.summary.failures}
          hint="Must-fix blockers"
        />
        <StatCard
          label="Manual QA targets"
          value={readiness.manualQaTargets.length}
          hint="Mobile, exports, and role walkthroughs"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">
            Environment checks
          </h2>
          <div className="mt-6 space-y-4">
            {readiness.environmentChecks.map((check) => (
              <div
                key={check.key}
                className={cn(
                  "rounded-2xl border p-4",
                  statusClasses(check.status),
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold">{check.label}</p>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                    {statusLabel(check.status)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7">{check.detail}</p>
                {check.items && check.items.length > 0 ? (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                    {check.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">Seeded demo access</h2>
          <div className="mt-6 space-y-4">
            {readiness.demoAccounts.map((account) => (
              <div
                key={account.email}
                className={cn(
                  "rounded-2xl border p-4",
                  statusClasses(account.status),
                )}
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-semibold">{account.label}</p>
                    <p className="mt-1 text-sm">{account.email}</p>
                  </div>
                  <div className="text-sm font-medium">
                    {formatAuthRoleLabel(account.role)}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7">{account.detail}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.16em]">
                  Expected landing: {account.expectedPath}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">Data integrity</h2>
          <div className="mt-6 space-y-4">
            {readiness.dataIntegrityChecks.map((check) => (
              <div
                key={check.key}
                className={cn(
                  "rounded-2xl border p-4",
                  statusClasses(check.status),
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold">{check.label}</p>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                    {statusLabel(check.status)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7">{check.detail}</p>
                {check.items && check.items.length > 0 ? (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                    {check.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">
            Notifications and reminder health
          </h2>
          <div className="mt-6 space-y-4">
            {readiness.notificationChecks.map((check) => (
              <div
                key={check.key}
                className={cn(
                  "rounded-2xl border p-4",
                  statusClasses(check.status),
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold">{check.label}</p>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                    {statusLabel(check.status)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7">{check.detail}</p>
                {check.items && check.items.length > 0 ? (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                    {check.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">Protected routes</h2>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
            <table className="min-w-[760px] divide-y divide-border text-sm">
              <thead className="bg-surface-strong/50 text-left text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Route</th>
                  <th className="px-4 py-3 font-medium">Allowed roles</th>
                  <th className="px-4 py-3 font-medium">Pilot note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {readiness.protectedRoutes.map((route) => (
                  <tr key={route.path}>
                    <td className="px-4 py-4 font-medium text-foreground">
                      {route.label}
                      <div className="text-xs text-muted">{route.path}</div>
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {route.allowedRoles.map((role) => formatAuthRoleLabel(role)).join(", ")}
                    </td>
                    <td className="px-4 py-4 text-muted">{route.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">Action guard matrix</h2>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
            <table className="min-w-[760px] divide-y divide-border text-sm">
              <thead className="bg-surface-strong/50 text-left text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Allowed roles</th>
                  <th className="px-4 py-3 font-medium">Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {readiness.permissionMatrix.map((permission) => (
                  <tr key={permission.permission}>
                    <td className="px-4 py-4 font-medium text-foreground">
                      {permission.label}
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {permission.allowedRoles
                        .map((role) => formatAuthRoleLabel(role))
                        .join(", ")}
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {permission.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="rounded-[1.75rem] border border-border bg-white p-6">
        <h2 className="text-xl font-semibold text-foreground">Manual pilot QA targets</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {readiness.manualQaTargets.map((target) => (
            <Link
              key={target.href}
              href={target.href as Route}
              className="rounded-2xl border border-border bg-surface/40 p-4 transition hover:border-brand"
            >
              <p className="font-semibold text-foreground">{target.label}</p>
              <p className="mt-2 text-sm leading-7 text-muted">{target.note}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-brand">
                Open {target.href}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">Unresolved issues</h2>
          <div className="mt-6">
            {readiness.unresolvedIssues.length === 0 ? (
              <PageEmptyState
                title="No unresolved issues"
                description="All automated readiness checks are currently passing."
              />
            ) : (
              <ul className="list-disc space-y-3 pl-5 text-sm text-muted">
                {readiness.unresolvedIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            )}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">Must-fix before pilot</h2>
          <div className="mt-6">
            {readiness.mustFixBeforePilot.length === 0 ? (
              <PageEmptyState
                title="No blockers"
                description="No automated blocker is currently preventing a controlled pilot."
              />
            ) : (
              <ul className="list-disc space-y-3 pl-5 text-sm text-muted">
                {readiness.mustFixBeforePilot.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">Safe for pilot</h2>
          <ul className="mt-6 list-disc space-y-3 pl-5 text-sm text-muted">
            {readiness.safeForPilot.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">Post-pilot roadmap</h2>
          <ul className="mt-6 list-disc space-y-3 pl-5 text-sm text-muted">
            {readiness.postPilotRoadmap.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
