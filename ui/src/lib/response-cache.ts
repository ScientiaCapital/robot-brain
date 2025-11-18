// Response Cache
// LRU cache for API responses with TTL support

interface CacheEntry {
  value: string;
  timestamp: number;
}

class ResponseCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private ttlMs: number;
  private hits = 0;
  private misses = 0;

  constructor(maxSize: number = 100, ttlMs: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  /**
   * Generate a cache key from request parameters
   */
  generateKey(params: Record<string, unknown>): string {
    return JSON.stringify(params);
  }

  /**
   * Get a value from the cache
   */
  get(key: string): string | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value;
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: string): void {
    // Enforce max size with LRU eviction
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; hits: number; misses: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0
    };
  }
}

// Singleton instance
export const responseCache = new ResponseCache();

/**
 * Log cache performance metrics
 */
export function logCachePerformance(): void {
  const stats = responseCache.getStats();
  console.log(`[Cache] Size: ${stats.size}, Hits: ${stats.hits}, Misses: ${stats.misses}, Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`);
}
