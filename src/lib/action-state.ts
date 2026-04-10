import type { Route } from "next";

export type FeedbackStatus = "success" | "error";

export type PageFeedback = {
  status?: FeedbackStatus;
  message?: string;
};

export function buildFeedbackHref(
  pathname: string,
  status: FeedbackStatus,
  message: string,
) {
  const params = new URLSearchParams({
    status,
    message,
  });

  return `${pathname}?${params.toString()}` as Route;
}

export function readFeedback(
  searchParams: Record<string, string | string[] | undefined>,
): PageFeedback {
  const statusValue = searchParams.status;
  const messageValue = searchParams.message;

  const status =
    typeof statusValue === "string" &&
    (statusValue === "success" || statusValue === "error")
      ? statusValue
      : undefined;

  const message =
    typeof messageValue === "string" && messageValue.length > 0
      ? messageValue
      : undefined;

  return { status, message };
}
