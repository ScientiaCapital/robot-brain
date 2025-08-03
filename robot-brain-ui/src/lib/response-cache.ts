// Simple in-memory cache for API responses
interface CacheEntry {
  data: any;
  timestamp: number;
  hits: number;
}

class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxAge: number = 5 * 60 * 1000; // 5 minutes default
  private maxSize: number = 100; // Maximum number of entries

  constructor(maxAge?: number, maxSize?: number) {
    if (maxAge) this.maxAge = maxAge;
    if (maxSize) this.maxSize = maxSize;
  }

  // Generate cache key from request parameters
  generateKey(params: Record<string, any>): string {
    return JSON.stringify(params, Object.keys(params).sort());
  }

  // Get cached response
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count
    entry.hits++;
    return entry.data;
  }

  // Set cache entry
  set(key: string, data: any): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.findOldestEntry();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0
    });
  }

  // Find oldest entry for LRU eviction
  private findOldestEntry(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  // Clear all cache entries
  clear(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getStats(): { size: number; hits: number; entries: string[] } {
    let totalHits = 0;
    const entries: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      totalHits += entry.hits;
      entries.push(key);
    }

    return {
      size: this.cache.size,
      hits: totalHits,
      entries
    };
  }
}

// Create a singleton instance
export const responseCache = new ResponseCache();

// Utility function to log cache performance
export function logCachePerformance(): void {
  const stats = responseCache.getStats();
  console.log('[Cache Performance]', {
    size: stats.size,
    totalHits: stats.hits,
    hitRate: stats.size > 0 ? (stats.hits / stats.size).toFixed(2) : '0'
  });
}