const analyticsRepository = require('../repositories/analyticsRepository');
const logger = require('../utils/logger');

/**
 * AnalyticsService
 * Tracks reel views, listing clicks, searches, and conversions.
 */
class AnalyticsService {
  async trackEvent({ type, userId, targetId, queryText, metadata }) {
    try {
      const event = await analyticsRepository.logEvent({
        type,
        userId,
        targetId,
        queryText,
        metadata,
      });
      return event;
    } catch (err) {
      logger.error('Failed to log analytics metric:', err);
      // Fail silently to prevent interrupting user actions
      return null;
    }
  }

  async getMetricsSummary({ type, targetId, startDate, endDate }) {
    return analyticsRepository.fetchEventSummary({ type, targetId, startDate, endDate });
  }
}

module.exports = new AnalyticsService();
