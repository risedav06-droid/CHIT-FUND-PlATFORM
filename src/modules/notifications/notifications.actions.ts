'use server';

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildFeedbackHref } from "@/lib/action-state";
import { formDataToObject } from "@/lib/form-data";
import { authService } from "@/modules/auth/auth.service";
import { notificationsService } from "@/modules/notifications/notifications.service";
import { markNotificationReadSchema } from "@/modules/notifications/notifications.validation";

const notificationsPath = "/notifications";

export async function markNotificationReadAction(formData: FormData) {
  const session = await authService.requireAuthenticatedSession(notificationsPath);
  const parsed = markNotificationReadSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirect(
      buildFeedbackHref(
        notificationsPath,
        "error",
        parsed.error.issues[0]?.message ?? "Unable to update notification.",
      ),
    );
  }

  await notificationsService.markNotificationRead(
    parsed.data.notificationId,
    session.user.id,
  );

  revalidatePath(notificationsPath);
  redirect(buildFeedbackHref(notificationsPath, "success", "Notification marked as read."));
}

export async function markAllNotificationsReadAction() {
  const session = await authService.requireAuthenticatedSession(notificationsPath);
  await notificationsService.markAllNotificationsRead(session.user.id);

  revalidatePath(notificationsPath);
  redirect(buildFeedbackHref(notificationsPath, "success", "All notifications marked as read."));
}

export async function generateOperationalNotificationsAction() {
  const session = await authService.requireActionPermission(
    "manage_notifications",
    notificationsPath,
  );

  try {
    const result = await notificationsService.generateOperationalNotifications(
      session,
    );

    revalidatePath(notificationsPath);
    revalidatePath("/dashboard");
    redirect(
      buildFeedbackHref(
        notificationsPath,
        "success",
        `${result.createdCount} notifications generated for due, overdue, and auction reminders.`,
      ),
    );
  } catch (error) {
    redirect(
      buildFeedbackHref(
        notificationsPath,
        "error",
        error instanceof Error
          ? error.message
          : "Unable to generate notifications.",
      ),
    );
  }
}
