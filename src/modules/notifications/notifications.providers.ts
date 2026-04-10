import type { Prisma } from "@/generated/prisma/client";

type NotificationProviderResult = {
  status: "SENT" | "FAILED" | "SKIPPED";
  deliveredAt?: Date;
  responseCode?: string;
  errorMessage?: string;
  responseBody?: Prisma.InputJsonValue;
};

export type NotificationProviderInput = {
  title: string;
  message: string;
  recipientLabel: string;
};

export type NotificationProvider = {
  key: string;
  channel: "IN_APP" | "WHATSAPP" | "SMS" | "EMAIL";
  deliver(input: NotificationProviderInput): Promise<NotificationProviderResult>;
};

const inAppProvider: NotificationProvider = {
  key: "in-app",
  channel: "IN_APP",
  async deliver() {
    return {
      status: "SENT",
      deliveredAt: new Date(),
      responseCode: "IN_APP_CREATED",
    };
  },
};

function createSkippedProvider(
  key: string,
  channel: "WHATSAPP" | "SMS" | "EMAIL",
): NotificationProvider {
  return {
    key,
    channel,
    async deliver() {
      return {
        status: "SKIPPED",
        responseCode: "NOT_CONFIGURED",
      };
    },
  };
}

export const notificationProviders = {
  inApp: inAppProvider,
  whatsapp: createSkippedProvider("whatsapp-placeholder", "WHATSAPP"),
  sms: createSkippedProvider("sms-placeholder", "SMS"),
  email: createSkippedProvider("email-placeholder", "EMAIL"),
};
