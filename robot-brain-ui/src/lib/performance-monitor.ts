// Performance monitoring utilities

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    avgResponseTime: number;
    totalRequests: number;
    errorRate: number;
    cacheHitRate: number;
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics: number = 1000;
  private timers: Map<string, number> = new Map();

  // Start a timer
  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  // End a timer and record the metric
  endTimer(name: string, tags?: Record<string, string>): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer '${name}' was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    this.recordMetric(name, duration, tags);
    return duration;
  }

  // Record a metric
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags
    };

    this.metrics.push(metric);

    // Prevent memory leak by limiting stored metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  // Get metrics for a specific time range
  getMetrics(name?: string, startTime?: number, endTime?: number): PerformanceMetric[] {
    let filtered = this.metrics;

    if (name) {
      filtered = filtered.filter(m => m.name === name);
    }

    if (startTime) {
      filtered = filtered.filter(m => m.timestamp >= startTime);
    }

    if (endTime) {
      filtered = filtered.filter(m => m.timestamp <= endTime);
    }

    return filtered;
  }

  // Generate a performance report
  generateReport(timeWindowMs: number = 60000): PerformanceReport {
    const now = Date.now();
    const recentMetrics = this.getMetrics(undefined, now - timeWindowMs, now);

    // Calculate average response time
    const responseMetrics = recentMetrics.filter(m => m.name.includes('response'));
    const avgResponseTime = responseMetrics.length > 0
      ? responseMetrics.reduce((sum, m) => sum + m.value, 0) / responseMetrics.length
      : 0;

    // Count total requests
    const totalRequests = recentMetrics.filter(m => m.name.includes('request')).length;

    // Calculate error rate
    const errorMetrics = recentMetrics.filter(m => m.tags?.error === 'true');
    const errorRate = totalRequests > 0 ? errorMetrics.length / totalRequests : 0;

    // Calculate cache hit rate
    const cacheHits = recentMetrics.filter(m => m.tags?.cacheHit === 'true').length;
    const cacheAttempts = recentMetrics.filter(m => m.name.includes('cache')).length;
    const cacheHitRate = cacheAttempts > 0 ? cacheHits / cacheAttempts : 0;

    return {
      metrics: recentMetrics,
      summary: {
        avgResponseTime,
        totalRequests,
        errorRate,
        cacheHitRate
      }
    };
  }

  // Clear all metrics
  clear(): void {
    this.metrics = [];
    this.timers.clear();
  }

  // Log performance summary to console
  logSummary(): void {
    const report = this.generateReport();
    console.log('[Performance Summary]', {
      avgResponseTime: `${report.summary.avgResponseTime.toFixed(2)}ms`,
      totalRequests: report.summary.totalRequests,
      errorRate: `${(report.summary.errorRate * 100).toFixed(2)}%`,
      cacheHitRate: `${(report.summary.cacheHitRate * 100).toFixed(2)}%`
    });
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility to measure async function performance
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  performanceMonitor.startTimer(name);
  
  try {
    const result = await fn();
    performanceMonitor.endTimer(name, { ...tags, success: 'true' });
    return result;
  } catch (error) {
    performanceMonitor.endTimer(name, { ...tags, error: 'true' });
    throw error;
  }
}

// Utility to measure sync function performance
export function measureSync<T>(
  name: string,
  fn: () => T,
  tags?: Record<string, string>
): T {
  performanceMonitor.startTimer(name);
  
  try {
    const result = fn();
    performanceMonitor.endTimer(name, { ...tags, success: 'true' });
    return result;
  } catch (error) {
    performanceMonitor.endTimer(name, { ...tags, error: 'true' });
    throw error;
  }
}