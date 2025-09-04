// utils/rate-limit.js
// Simple in-memory rate limiter (use Redis in production)
const attempts = new Map();

export function rateLimit(options = {}) {
    const { interval = 60000, uniqueTokenPerInterval = 500 } = options;

    return {
        async check(limit, token) {
            const now = Date.now();
            const windowStart = now - interval;

            // Clean old entries
            for (const [key, value] of attempts.entries()) {
                if (value.lastAttempt < windowStart) {
                    attempts.delete(key);
                }
            }

            // Check if we exceed the limit
            if (attempts.size >= uniqueTokenPerInterval) {
                throw new Error('Rate limit exceeded');
            }

            const tokenAttempts = attempts.get(token) || { count: 0, lastAttempt: now };

            // Reset counter if outside the window
            if (tokenAttempts.lastAttempt < windowStart) {
                tokenAttempts.count = 0;
            }

            tokenAttempts.count++;
            tokenAttempts.lastAttempt = now;

            attempts.set(token, tokenAttempts);

            if (tokenAttempts.count > limit) {
                throw new Error(`Rate limit exceeded: ${tokenAttempts.count}/${limit}`);
            }

            return tokenAttempts;
        }
    };
}

// For production, use this Redis-based version instead:
/*
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export function rateLimit(options = {}) {
  const { interval = 60000, uniqueTokenPerInterval = 500 } = options;

  return {
    async check(limit, token) {
      const key = `rate_limit:${token}`;
      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, Math.ceil(interval / 1000));
      }
      
      if (current > limit) {
        throw new Error(`Rate limit exceeded: ${current}/${limit}`);
      }
      
      return { count: current };
    }
  };
}
*/