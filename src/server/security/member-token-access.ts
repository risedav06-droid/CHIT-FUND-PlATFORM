import "server-only";

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 60;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const globalStore = globalThis as typeof globalThis & {
  __chitmateMemberTokenRateLimit?: Map<string, RateLimitEntry>;
};

function getStore() {
  if (!globalStore.__chitmateMemberTokenRateLimit) {
    globalStore.__chitmateMemberTokenRateLimit = new Map();
  }

  return globalStore.__chitmateMemberTokenRateLimit;
}

export function getRequestIp(forwardedForHeader: string | null) {
  return forwardedForHeader?.split(",")[0]?.trim() || "unknown";
}

export function enforceMemberTokenRateLimit(ipAddress: string) {
  const now = Date.now();
  const store = getStore();
  const current = store.get(ipAddress);

  if (!current || current.resetAt <= now) {
    store.set(ipAddress, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });

    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      resetAt: now + WINDOW_MS,
    };
  }

  if (current.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
    };
  }

  current.count += 1;
  store.set(ipAddress, current);

  return {
    allowed: true,
    remaining: MAX_REQUESTS - current.count,
    resetAt: current.resetAt,
  };
}
