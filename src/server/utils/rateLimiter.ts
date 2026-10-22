import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export class MemoryRateLimiter {
  private hits: Map<string, RateLimitRecord> = new Map();
  private windowMs: number;
  private maxRequests: number;
  private prefix: string;

  constructor(windowMs: number, maxRequests: number, prefix: string = '') {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.prefix = prefix;

    // Periodic cleanup of expired records every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.hits.entries()) {
        if (record.resetTime < now) {
          this.hits.delete(key);
        }
      }
    }, 5 * 60 * 1000).unref();
  }

  public check(ip: string): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
    const key = `${this.prefix}:${ip}`;
    const now = Date.now();
    const record = this.hits.get(key);

    if (!record || record.resetTime < now) {
      this.hits.set(key, { count: 1, resetTime: now + this.windowMs });
      return { allowed: true, remaining: this.maxRequests - 1, retryAfterSeconds: 0 };
    }

    if (record.count >= this.maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    record.count++;
    return {
      allowed: true,
      remaining: this.maxRequests - record.count,
      retryAfterSeconds: 0,
    };
  }

  public middleware(errorMessage: string = 'Upload limit reached. Please try again later.') {
    return (req: Request, res: Response, next: NextFunction): void => {
      const ip =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
        req.socket.remoteAddress ||
        '127.0.0.1';

      const result = this.check(ip);

      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, result.remaining));

      if (!result.allowed) {
        res.setHeader('Retry-After', result.retryAfterSeconds);
        res.status(429).json({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: errorMessage,
          retryAfter: result.retryAfterSeconds,
        });
        return;
      }

      next();
    };
  }
}

// Configurable instances
const uploadLimit = Number(process.env.UPLOAD_RATE_LIMIT) || 30;
export const uploadRateLimiter = new MemoryRateLimiter(60 * 60 * 1000, uploadLimit, 'upload');
export const deleteRateLimiter = new MemoryRateLimiter(15 * 60 * 1000, 50, 'delete');
export const generalRateLimiter = new MemoryRateLimiter(60 * 1000, 120, 'api');
