const twilio = require('twilio');
const https = require('https');
const logger = require('../utils/logger');

let cachedClient = null;
let cachedSid = null;
let cachedToken = null;

// Persistent HTTPS agent with keep-alive to avoid repetitive TLS handshakes
const keepAliveAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 20,
  keepAliveMsecs: 30000,
  timeout: 10000,
});

/**
 * Returns a pooled singleton Twilio client instance.
 * Reuses existing HTTPS connections with keep-alive, preventing TLS re-negotiation latency
 * and avoiding blocking module requires on the event loop during user requests.
 */
function getTwilioClient(accountSid, authToken) {
  if (!accountSid || !authToken) {
    return null;
  }

  if (cachedClient && cachedSid === accountSid && cachedToken === authToken) {
    return cachedClient;
  }

  try {
    const httpClient = new twilio.RequestClient({
      keepAlive: true,
      agent: keepAliveAgent,
      timeout: 10000, // 10s strict timeout to prevent hung requests
    });

    cachedClient = twilio(accountSid, authToken, { httpClient });
    cachedSid = accountSid;
    cachedToken = authToken;
    return cachedClient;
  } catch (err) {
    logger.error('Failed to initialize singleton Twilio client:', { error: err.message });
    throw err;
  }
}

module.exports = {
  getTwilioClient,
};
