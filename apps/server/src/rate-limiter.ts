/**
 * In-memory sliding window rate limiter to prevent spamming and DoS on socket endpoints.
 */
export class RateLimiter {
  private requestLog: Map<string, number[]> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private cleanupIntervalMs: number = 60_000) {
    this.cleanupInterval = setInterval(() => this.cleanup(), this.cleanupIntervalMs);
    // Unref so it does not keep Node.js event loop alive in test environments
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Check whether an action by the given identifier is permitted under rate limits.
   */
  public isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = this.requestLog.get(key) || [];
    const windowStart = now - windowMs;

    // Filter out timestamps outside the sliding window
    const recent = timestamps.filter((t) => t > windowStart);

    if (recent.length >= maxRequests) {
      this.requestLog.set(key, recent);
      return false;
    }

    recent.push(now);
    this.requestLog.set(key, recent);
    return true;
  }

  /**
   * Reset rate limit counts for a key (e.g. when a client disconnects).
   */
  public reset(key: string): void {
    this.requestLog.delete(key);
  }

  /**
   * Periodically remove old entries to prevent unbounded memory growth.
   */
  public cleanup(): void {
    const now = Date.now();
    const maxRetainWindow = 60_000;
    for (const [key, timestamps] of this.requestLog.entries()) {
      const valid = timestamps.filter((t) => t > now - maxRetainWindow);
      if (valid.length === 0) {
        this.requestLog.delete(key);
      } else {
        this.requestLog.set(key, valid);
      }
    }
  }

  /**
   * Destroy the rate limiter instance.
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.requestLog.clear();
  }
}
