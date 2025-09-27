// Request throttling and caching utilities
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class RequestThrottler {
  private cache = new Map<string, CacheEntry>();
  private requestQueue = new Map<string, Promise<any>>();
  private rateLimits = new Map<string, { count: number; resetTime: number }>();

  // Rate limits per API (requests per minute)
  private readonly RATE_LIMITS = {
    openai: { requests: 20, window: 60000 }, // 20 requests per minute
    enhanced_ai: { requests: 20, window: 60000 }, // 20 requests per minute (same as OpenAI)
    google_calendar: { requests: 100, window: 60000 }, // 100 requests per minute
    internal: { requests: 200, window: 60000 }, // 200 requests per minute
  };

  async throttle<T>(
    key: string,
    apiType: keyof typeof RequestThrottler.prototype.RATE_LIMITS,
    requestFn: () => Promise<T>,
    ttl: number = 300000 // 5 minutes default cache
  ): Promise<T> {
    // Check cache first
    const cached = this.getFromCache(key);
    if (cached) {
      console.log(`Cache hit for ${key}`);
      return cached;
    }

    // Check if request is already in progress
    if (this.requestQueue.has(key)) {
      console.log(`Request already in progress for ${key}, waiting...`);
      return this.requestQueue.get(key)!;
    }

    // Check rate limit
    await this.checkRateLimit(apiType);

    // Execute request
    const requestPromise = this.executeRequest(key, requestFn, ttl);
    this.requestQueue.set(key, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.requestQueue.delete(key);
    }
  }

  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private async checkRateLimit(apiType: keyof typeof RequestThrottler.prototype.RATE_LIMITS): Promise<void> {
    const limit = this.RATE_LIMITS[apiType];
    const now = Date.now();
    const current = this.rateLimits.get(apiType) || { count: 0, resetTime: now + limit.window };

    // Reset counter if window has passed
    if (now > current.resetTime) {
      current.count = 0;
      current.resetTime = now + limit.window;
    }

    // Check if we've hit the limit
    if (current.count >= limit.requests) {
      const waitTime = current.resetTime - now;
      console.log(`Rate limit reached for ${apiType}, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      current.count = 0;
      current.resetTime = now + limit.window;
    }

    current.count++;
    this.rateLimits.set(apiType, current);
  }

  private async executeRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    try {
      console.log(`Executing request for ${key}`);
      const result = await requestFn();
      this.setCache(key, result, ttl);
      return result;
    } catch (error) {
      console.error(`Request failed for ${key}:`, error);
      throw error;
    }
  }

  // Clear cache for specific key or all
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const requestThrottler = new RequestThrottler();
