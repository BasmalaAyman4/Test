// utils/rate-limit.js
// Enhanced in-memory rate limiter with cleanup and performance optimizations
const attempts = new Map();
const cleanupInterval = 5 * 60 * 1000; // Cleanup every 5 minutes

// Automatic cleanup to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of attempts.entries()) {
        if (value.lastAttempt < now - (60 * 60 * 1000)) { // Remove entries older than 1 hour
            attempts.delete(key);
        }
    }
}, cleanupInterval);

export function rateLimit(options = {}) {
    const { interval = 60000, uniqueTokenPerInterval = 500 } = options;

    return {
        async check(limit, token) {
            const now = Date.now();
            const windowStart = now - interval;

            // Efficient cleanup: only clean entries that are accessed
            const tokenAttempts = attempts.get(token);
            if (tokenAttempts && tokenAttempts.lastAttempt < windowStart) {
                attempts.delete(token);
            }

            // Check if we exceed the global limit (with better performance)
            if (attempts.size >= uniqueTokenPerInterval) {
                // Perform cleanup only when needed
                let cleaned = 0;
                for (const [key, value] of attempts.entries()) {
                    if (value.lastAttempt < windowStart) {
                        attempts.delete(key);
                        cleaned++;
                        if (cleaned > 100) break; // Limit cleanup to prevent blocking
                    }
                }
                
                if (attempts.size >= uniqueTokenPerInterval) {
                    throw new Error('Rate limit exceeded: too many unique tokens');
                }
            }

            const currentAttempts = attempts.get(token) || { 
                count: 0, 
                lastAttempt: now,
                windowStart: now
            };

            // Reset counter if outside the window
            if (currentAttempts.lastAttempt < windowStart) {
                currentAttempts.count = 0;
                currentAttempts.windowStart = now;
            }

            currentAttempts.count++;
            currentAttempts.lastAttempt = now;

            attempts.set(token, currentAttempts);

            if (currentAttempts.count > limit) {
                const resetTime = currentAttempts.windowStart + interval;
                throw new Error(`Rate limit exceeded: ${currentAttempts.count}/${limit}. Reset at: ${new Date(resetTime).toISOString()}`);
            }

            return {
                count: currentAttempts.count,
                remaining: limit - currentAttempts.count,
                resetTime: currentAttempts.windowStart + interval
            };
        },

        // Method to get current status without incrementing
        getStatus(token) {
            const now = Date.now();
            const tokenAttempts = attempts.get(token);
            
            if (!tokenAttempts) {
                return { count: 0, remaining: limit, resetTime: now + interval };
            }

            const windowStart = now - interval;
            if (tokenAttempts.lastAttempt < windowStart) {
                return { count: 0, remaining: limit, resetTime: now + interval };
            }

            return {
                count: tokenAttempts.count,
                remaining: Math.max(0, limit - tokenAttempts.count),
                resetTime: tokenAttempts.windowStart + interval
            };
        }
    };
}
