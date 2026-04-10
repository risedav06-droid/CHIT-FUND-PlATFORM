import type { Route } from "next";
import Link from "next/link";

import { FormFeedback } from "@/components/ui/form-feedback";
import { PageEmptyState } from "@/components/ui/page-empty-state";
import { readFeedback } from "@/lib/action-state";
import { formatDateTime } from "@/lib/dates";
import { canAccessPermission, isStaffRole } from "@/modules/auth/auth.permissions";
import { authService } from "@/modules/auth/auth.service";
import {
  generateOperationalNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/modules/notifications/notifications.actions";
import { notificationsService } from "@/modules/notifications/notifications.service";

type NotificationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const session = await authService.requireAuthenticatedSession("/notifications");
  const [feedback, center] = await Promise.all([
    readFeedback(await searchParams),
    notificationsService.getNotificationCenter(session),
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-[1.75rem] border border-border bg-surface p-6 shadow-[0_20px_70px_-50px_rgba(31,27,23,0.5)]">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-medium text-brand">Notification center</p>
            <h1 className="mt-3 text-3xl font-semibold text-foreground">
              In-app reminders and event history
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
              Due reminders, overdue nudges, auction milestones, and payout
              updates are stored here with a delivery history for the pilot.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <form action={markAllNotificationsReadAction}>
              <button
                type="submit"
                className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition hover:border-brand hover:text-brand"
              >
                Mark all read
              </button>
            </form>
            {canAccessPermission(session.user.role, "manage_notifications") ? (
              <form action={generateOperationalNotificationsAction}>
                <button
                  type="submit"
                  className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:opacity-95"
                >
                  Generate reminders
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </section>

      <FormFeedback {...feedback} />

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Your notifications</h2>
              <p className="mt-2 text-sm text-muted">
                {center.unreadCount} unread notification(s)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {center.notifications.length === 0 ? (
              <PageEmptyState
                title="No notifications"
                description="Event notifications and reminders will appear here."
              />
            ) : (
              center.notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-[1.5rem] border border-border bg-surface/40 p-4"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{notification.title}</p>
                        {!notification.readAt ? (
                          <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
                            Unread
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-7 text-muted">
                        {notification.message}
                      </p>
                      <p className="mt-3 text-xs text-muted">
                        {formatStatus(notification.type)} |{" "}
                        {formatDateTime(notification.createdAt)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {notification.linkHref ? (
                        <Link
                          href={notification.linkHref as Route}
                          className="rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground transition hover:border-brand hover:text-brand"
                        >
                          Open
                        </Link>
                      ) : null}
                      {!notification.readAt ? (
                        <form action={markNotificationReadAction}>
                          <input
                            type="hidden"
                            name="notificationId"
                            value={notification.id}
                          />
                          <button
                            type="submit"
                            className="rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground transition hover:border-brand hover:text-brand"
                          >
                            Mark read
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">Notification log</h2>
          <p className="mt-2 text-sm text-muted">
            {isStaffRole(session.user.role)
              ? "Recent delivery attempts across the pilot notification channels."
              : "Recent delivery details for your in-app notifications."}
          </p>

          <div className="mt-6 space-y-4">
            {center.deliveryLog.length === 0 ? (
              <PageEmptyState
                title="No delivery log"
                description="Delivery attempts will be shown here once events are generated."
              />
            ) : (
              center.deliveryLog.map((delivery) => (
                <div
                  key={delivery.id}
                  className="rounded-2xl border border-border bg-surface/40 p-4"
                >
                  <p className="font-medium text-foreground">
                    {delivery.notification.title}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    {formatStatus(delivery.channel)} | {formatStatus(delivery.status)} |{" "}
                    {formatDateTime(delivery.attemptedAt)}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {delivery.providerKey} | {delivery.responseCode ?? "No response code"}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
