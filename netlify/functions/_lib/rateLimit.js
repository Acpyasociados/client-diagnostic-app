/**
 * Rate limiting utilities for ACP Diagnostic System
 * Prevents spam, brute force, and abuse by limiting request frequency
 */

import { getStore } from '@netlify/blobs';

/**
 * Check if an identifier (IP or email) has exceeded rate limit
 *
 * Parameters:
 *   identifier: 'ip:192.168.1.1' or 'email:user@example.com'
 *   endpoint: 'get-advisor-cases' or 'flow-create-payment'
 *   maxRequests: 100 (allow this many)
 *   windowMs: 3600000 (per this many milliseconds - 1 hour)
 *
 * Returns: {
 *   allowed: true/false,
 *   remaining: number of requests left,
 *   resetAt: timestamp when window resets,
 *   error: error message if not allowed
 * }
 */
export async function checkRateLimit(identifier, endpoint, maxRequests, windowMs) {
  try {
    const rateLimitStore = getStore('rate-limits');

    // Create key: "ip:192.168.1.1:get-advisor-cases"
    const key = `${identifier}:${endpoint}`;
    const now = Date.now();

    // Get current request log for this identifier+endpoint
    let data = await rateLimitStore.get(key);
    let timestamps = [];

    if (data) {
      try {
        timestamps = JSON.parse(data);
      } catch (e) {
        console.error('Error parsing rate limit data:', e.message);
        timestamps = [];
      }
    }

    // Remove expired timestamps (older than the window)
    timestamps = timestamps.filter(ts => now - ts < windowMs);

    // Check if limit exceeded
    if (timestamps.length >= maxRequests) {
      const oldestRequest = Math.min(...timestamps);
      const resetAt = oldestRequest + windowMs;

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        requestsSoFar: timestamps.length,
        error: `Rate limit exceeded. Maximum ${maxRequests} requests per ${Math.round(windowMs / 1000)} seconds. Try again at ${new Date(resetAt).toISOString()}`
      };
    }

    // Add current timestamp
    timestamps.push(now);

    // Save updated timestamps
    await rateLimitStore.set(key, JSON.stringify(timestamps));

    // Calculate reset time
    const resetAt = timestamps[0] + windowMs;

    return {
      allowed: true,
      remaining: maxRequests - timestamps.length,
      resetAt,
      requestsSoFar: timestamps.length,
      error: null
    };

  } catch (error) {
    console.error('Rate limit check error:', error.message);
    // On error, allow request (don't block due to storage errors)
    return {
      allowed: true,
      remaining: maxRequests,
      error: null
    };
  }
}

/**
 * Get rate limit status for an identifier
 */
export async function getRateLimitStatus(identifier, endpoint) {
  try {
    const rateLimitStore = getStore('rate-limits');
    const key = `${identifier}:${endpoint}`;

    const data = await rateLimitStore.get(key);
    if (!data) {
      return { requests_so_far: 0, oldest_request: null, status: 'No requests recorded' };
    }

    const timestamps = JSON.parse(data);
    return {
      requests_so_far: timestamps.length,
      oldest_request: timestamps.length > 0 ? new Date(timestamps[0]).toISOString() : null,
      newest_request: timestamps.length > 0 ? new Date(timestamps[timestamps.length - 1]).toISOString() : null
    };

  } catch (error) {
    console.error('Error getting rate limit status:', error.message);
    return { error: error.message };
  }
}

/**
 * Reset rate limit for an identifier (admin function)
 */
export async function resetRateLimit(identifier, endpoint = null) {
  try {
    const rateLimitStore = getStore('rate-limits');

    if (endpoint) {
      // Reset specific endpoint
      const key = `${identifier}:${endpoint}`;
      await rateLimitStore.set(key, JSON.stringify([]));
      return { success: true, message: `Rate limit reset for ${key}` };
    } else {
      // Reset all endpoints for identifier (would need to list all keys with this identifier prefix)
      // For now, just return instruction
      return { success: false, message: 'Specify endpoint to reset, or implement list-by-prefix' };
    }

  } catch (error) {
    console.error('Error resetting rate limit:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Common rate limit configurations
 */
export const RATE_LIMIT_CONFIGS = {
  // Form submission: max 5 per day per IP
  FORM_SUBMISSION: {
    maxRequests: 5,
    windowMs: 24 * 60 * 60 * 1000  // 24 hours
  },

  // Get advisor cases: max 100 per hour per IP
  ADVISOR_CASES_LIST: {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000  // 1 hour
  },

  // Case notes: max 10 per hour per advisor
  CASE_NOTES: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000  // 1 hour
  },

  // Case details: max 200 per hour per IP
  CASE_DETAILS: {
    maxRequests: 200,
    windowMs: 60 * 60 * 1000  // 1 hour
  },

  // API endpoints (general): max 1000 per hour per IP
  GENERAL_API: {
    maxRequests: 1000,
    windowMs: 60 * 60 * 1000  // 1 hour
  },

  // Questionnaire submission: max 1 per 24 hours per email
  QUESTIONNAIRE_SUBMIT: {
    maxRequests: 1,
    windowMs: 24 * 60 * 60 * 1000  // 24 hours
  },

  // Payment callback: max 10 per minute per IP (webhook retries)
  PAYMENT_WEBHOOK: {
    maxRequests: 10,
    windowMs: 60 * 1000  // 1 minute
  }
};

/**
 * Helper to get IP address from request headers
 * Handles proxies and load balancers
 */
export function getClientIP(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first
    return forwarded.split(',')[0].trim();
  }

  const clientIP = req.headers?.['x-client-ip'];
  if (clientIP) return clientIP;

  const realIP = req.headers?.['x-real-ip'];
  if (realIP) return realIP;

  // Fallback - try to get from req.ip or similar
  return req.ip || 'unknown';
}

/**
 * Cleanup old rate limit entries (older than windowMs)
 * This prevents the rate-limits store from growing infinitely
 */
export async function cleanupRateLimits() {
  try {
    const rateLimitStore = getStore('rate-limits');
    const now = Date.now();
    let cleanedCount = 0;

    const { blobs } = await rateLimitStore.list();

    for (const blob of blobs) {
      const data = await rateLimitStore.get(blob.key);
      if (data) {
        try {
          let timestamps = JSON.parse(data);
          // Find the largest window we need to keep
          const maxWindow = 24 * 60 * 60 * 1000;  // 24 hours
          const filtered = timestamps.filter(ts => now - ts < maxWindow);

          if (filtered.length !== timestamps.length) {
            if (filtered.length === 0) {
              // Delete empty entries
              await rateLimitStore.set(blob.key, JSON.stringify([]));
            } else {
              await rateLimitStore.set(blob.key, JSON.stringify(filtered));
            }
            cleanedCount++;
          }
        } catch (e) {
          console.error('Error processing rate limit entry:', blob.key);
        }
      }
    }

    console.log(`Rate limit cleanup: processed ${cleanedCount} entries`);
    return { success: true, cleaned: cleanedCount };

  } catch (error) {
    console.error('Error during rate limit cleanup:', error.message);
    return { success: false, error: error.message };
  }
}
