/**
 * Circuit Breaker with Exponential / Tiered Backoff (5 min, 15 min, 30 min)
 * for External Verification Services (e.g. Sandbox API)
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.name = options.name || 'ExternalService';
    this.failureThreshold = options.failureThreshold || 3; // Number of failures before tripping OPEN

    // 3 retry cooldown intervals: 5 min, 15 min, 30 min
    this.cooldownScheduleMs = options.cooldownScheduleMs || [
      5 * 60 * 1000,   // Tier 1: 5 minutes (300,000 ms)
      15 * 60 * 1000,  // Tier 2: 15 minutes (900,000 ms)
      30 * 60 * 1000   // Tier 3: 30 minutes (1,800,000 ms)
    ];

    this.maxRetries = options.maxRetries !== undefined ? options.maxRetries : 1; // Immediate transient retries
    this.retryDelayMs = options.retryDelayMs || 1000;

    // States: 'CLOSED', 'OPEN', 'HALF_OPEN'
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.consecutiveTrips = 0;
    this.nextAttemptTime = null;
    this.lastError = null;
    this.lastStateChange = Date.now();
  }

  /**
   * Check if circuit allows execution
   */
  canExecute() {
    const now = Date.now();
    if (this.state === 'CLOSED') {
      return true;
    }

    if (this.state === 'OPEN') {
      if (this.nextAttemptTime && now >= this.nextAttemptTime) {
        this.state = 'HALF_OPEN';
        this.lastStateChange = now;
        console.log(`[CircuitBreaker:${this.name}] Cooldown elapsed. Transitioned to HALF_OPEN to probe provider health...`);
        return true;
      }
      return false;
    }

    if (this.state === 'HALF_OPEN') {
      return true;
    }

    return true;
  }

  /**
   * Calculate tiered backoff cooldown duration: 5 min, 15 min, 30 min
   */
  getCooldownDuration() {
    const index = Math.max(0, this.consecutiveTrips - 1);
    const scheduleLength = this.cooldownScheduleMs.length;
    const clampedIndex = Math.min(index, scheduleLength - 1);
    return this.cooldownScheduleMs[clampedIndex];
  }

  /**
   * Get remaining wait time in minutes and seconds
   */
  getRemainingWait() {
    if (!this.nextAttemptTime) return { minutes: 0, seconds: 0, formatted: '' };
    const remainingMs = Math.max(0, this.nextAttemptTime - Date.now());
    const minutes = Math.ceil(remainingMs / (60 * 1000));
    const seconds = Math.ceil(remainingMs / 1000);
    const formatted = minutes > 1 ? `${minutes} minutes` : `${seconds} seconds`;
    return { minutes, seconds, formatted };
  }

  /**
   * Record a successful execution
   */
  recordSuccess() {
    if (this.state !== 'CLOSED' || this.failureCount > 0) {
      console.log(`[CircuitBreaker:${this.name}] Request succeeded. Resetting circuit to CLOSED.`);
    }
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.consecutiveTrips = 0;
    this.nextAttemptTime = null;
    this.lastError = null;
    this.lastStateChange = Date.now();
  }

  /**
   * Record a failure and trip circuit if threshold exceeded or credit/service error
   */
  recordFailure(error) {
    this.failureCount++;
    this.lastError = error;

    const errMsg = (error?.message || '').toLowerCase();
    const status = error?.status || error?.response?.status;
    const isCreditOrAuthError = status === 403 || status === 402 || errMsg.includes('insufficient credits') || errMsg.includes('credits');
    const isServerError = status >= 500 || status === 429 || error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT';

    // If out of credits or threshold exceeded, trip OPEN to tiered cooldown (5 min -> 15 min -> 30 min)
    if (isCreditOrAuthError || this.failureCount >= this.failureThreshold || this.state === 'HALF_OPEN') {
      this.consecutiveTrips++;
      const cooldownMs = this.getCooldownDuration();
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + cooldownMs;
      this.lastStateChange = Date.now();

      const cooldownMins = Math.round(cooldownMs / (60 * 1000));
      console.warn(
        `[CircuitBreaker:${this.name}] Tripped to OPEN (Tier ${Math.min(this.consecutiveTrips, 3)}/3: cooldown ${cooldownMins} min). Cause: ${error?.message || 'Failure threshold reached'}`
      );
    }
  }

  /**
   * Sleep helper with jitter for retry backoff
   */
  async sleep(ms) {
    const jitter = Math.floor(Math.random() * 200);
    return new Promise(resolve => setTimeout(resolve, ms + jitter));
  }

  /**
   * Is the error transient / retryable immediately?
   */
  isRetryable(error) {
    const status = error?.status || error?.response?.status;
    // Do NOT retry 400 (bad user input), 401/403 (insufficient credits/auth), 404, 422
    if (status === 400 || status === 401 || status === 402 || status === 403 || status === 404 || status === 422) {
      return false;
    }
    const errMsg = (error?.message || '').toLowerCase();
    if (errMsg.includes('insufficient credits') || errMsg.includes('invalid pan') || errMsg.includes('invalid aadhaar')) {
      return false;
    }
    return true; // Network errors, 5xx, timeouts, 429 are retryable
  }

  /**
   * Execute an async action wrapped in circuit breaker and exponential retry
   */
  async execute(action) {
    if (!this.canExecute()) {
      const { minutes, formatted } = this.getRemainingWait();
      const waitMsg = formatted ? ` Please try again in about ${formatted}.` : ' Kindly try again after some time.';
      const unavailableError = new Error(`Identity verification service is temporarily unavailable.${waitMsg}`);
      unavailableError.status = 503;
      unavailableError.circuitOpen = true;
      unavailableError.retryAfterMinutes = minutes;
      throw unavailableError;
    }

    let lastAttemptError = null;
    const maxAttempts = 1 + this.maxRetries;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await action();
        this.recordSuccess();
        return result;
      } catch (err) {
        lastAttemptError = err;

        // If error is not retryable or this was our last attempt, break loop
        if (!this.isRetryable(err) || attempt === maxAttempts - 1) {
          break;
        }

        const delay = this.retryDelayMs * Math.pow(2, attempt);
        console.warn(`[CircuitBreaker:${this.name}] Transient error: ${err.message}. Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    this.recordFailure(lastAttemptError);
    throw lastAttemptError;
  }
}

module.exports = CircuitBreaker;
