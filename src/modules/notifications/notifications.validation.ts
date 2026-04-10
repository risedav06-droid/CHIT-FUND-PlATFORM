import { z } from "zod";

export const markNotificationReadSchema = z.object({
  notificationId: z.string().uuid("Select a valid notification."),
});

export type MarkNotificationReadInput = z.infer<
  typeof markNotificationReadSchema
>;
