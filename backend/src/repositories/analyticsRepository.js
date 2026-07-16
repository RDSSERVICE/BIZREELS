const Analytics = require('../models/Analytics');

/**
 * AnalyticsRepository
 * Handles writing and aggregating traffic metrics events.
 */
class AnalyticsRepository {
  async logEvent(eventData) {
    return Analytics.create(eventData);
  }

  async fetchEventSummary({ type, targetId, startDate, endDate }) {
    const match = {};
    if (type) match.type = type;
    if (targetId) match.targetId = targetId;

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    return Analytics.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$type',
          totalCount: { $sum: 1 },
        },
      },
    ]);
  }
}

module.exports = new AnalyticsRepository();
