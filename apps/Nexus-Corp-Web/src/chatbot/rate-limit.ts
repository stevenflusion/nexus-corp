interface RateLimitOptions {
  maxRequests: number
  windowMs: number
}

interface RateLimitBucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, RateLimitBucket>()

export const checkRateLimit = (
  key: string,
  { maxRequests, windowMs }: RateLimitOptions
) => {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    })

    return {
      limited: false,
      remaining: Math.max(maxRequests - 1, 0),
      resetAt: now + windowMs,
    }
  }

  if (bucket.count >= maxRequests) {
    return {
      limited: true,
      remaining: 0,
      resetAt: bucket.resetAt,
    }
  }

  bucket.count += 1

  return {
    limited: false,
    remaining: Math.max(maxRequests - bucket.count, 0),
    resetAt: bucket.resetAt,
  }
}
