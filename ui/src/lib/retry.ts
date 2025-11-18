// Retry Utility with Exponential Backoff
// Provides graceful degradation for network and API operations

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

const defaultOptions: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const delay = baseDelay * Math.pow(2, attempt);
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * delay * 0.1;
  return Math.min(delay + jitter, maxDelay);
}

/**
 * Retry an async operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries, baseDelayMs, maxDelayMs } = {
    ...defaultOptions,
    ...options,
  };

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        break;
      }

      // Call retry callback if provided
      options.onRetry?.(attempt + 1, lastError);

      // Calculate and wait for backoff delay
      const delay = calculateDelay(attempt, baseDelayMs, maxDelayMs);
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Fetch with automatic retry on network errors
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(url, init);

    // Retry on server errors (5xx)
    if (response.status >= 500) {
      throw new Error(`Server error: ${response.status}`);
    }

    return response;
  }, options);
}

/**
 * Create a circuit breaker for a service
 */
export function createCircuitBreaker(threshold: number = 5, resetTimeMs: number = 30000) {
  let failures = 0;
  let lastFailure = 0;
  let isOpen = false;

  return {
    async execute<T>(operation: () => Promise<T>): Promise<T> {
      // Check if circuit should reset
      if (isOpen && Date.now() - lastFailure > resetTimeMs) {
        isOpen = false;
        failures = 0;
      }

      if (isOpen) {
        throw new Error('Circuit breaker is open');
      }

      try {
        const result = await operation();
        failures = 0; // Reset on success
        return result;
      } catch (error) {
        failures++;
        lastFailure = Date.now();

        if (failures >= threshold) {
          isOpen = true;
        }

        throw error;
      }
    },

    getState() {
      return { isOpen, failures, lastFailure };
    },

    reset() {
      isOpen = false;
      failures = 0;
      lastFailure = 0;
    }
  };
}
