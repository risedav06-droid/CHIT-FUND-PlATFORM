export function parseDateInput(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function startOfUtcDay(value: Date | string) {
  const date = new Date(value);

  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function addMonthsAtUtcDay(
  baseDate: Date,
  monthOffset: number,
  preferredDay = baseDate.getUTCDate(),
) {
  const year = baseDate.getUTCFullYear();
  const month = baseDate.getUTCMonth() + monthOffset;
  const lastDayOfTargetMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const safeDay = Math.min(preferredDay, lastDayOfTargetMonth);

  return new Date(Date.UTC(year, month, safeDay));
}

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function differenceInUtcDays(from: Date | string, to: Date | string) {
  const fromDate = startOfUtcDay(from);
  const toDate = startOfUtcDay(to);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.max(
    0,
    Math.floor((toDate.getTime() - fromDate.getTime()) / millisecondsPerDay),
  );
}

export function getUtcMonthRange(referenceDate = new Date()) {
  const year = referenceDate.getUTCFullYear();
  const month = referenceDate.getUTCMonth();

  return {
    start: new Date(Date.UTC(year, month, 1)),
    end: new Date(Date.UTC(year, month + 1, 1)),
  };
}
