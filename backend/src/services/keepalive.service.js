const http = require('http');
const https = require('https');
const logger = require('../utils/logger');

let keepAliveInterval = null;
let lastPingTime = null;
let pingCount = 0;
let lastPingStatus = 'idle';

const getTargetUrl = () => {
  return (
    process.env.KEEP_ALIVE_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    'https://api.bizreels.in/api/v1/health'
  );
};

/**
 * Starts automatic 30-second self-ping keep-alive loop to prevent Render from sleeping.
 */
const startKeepAlive = (intervalMs = 30000) => {
  if (keepAliveInterval) return;

  const targetUrl = getTargetUrl();
  logger.info(`Render Keep-Alive active: self-pinging ${targetUrl} every ${intervalMs / 1000}s`, {
    service: 'keepalive',
  });

  const ping = () => {
    try {
      const target = getTargetUrl();
      const url = new URL(target);
      const requester = url.protocol === 'https:' ? https : http;

      const req = requester.get(target, { timeout: 10000 }, (res) => {
        pingCount++;
        lastPingTime = new Date().toISOString();
        lastPingStatus = res.statusCode === 200 ? 'success' : `HTTP ${res.statusCode}`;
      });

      req.on('error', (err) => {
        lastPingStatus = `Error: ${err.message}`;
      });

      req.on('timeout', () => {
        req.destroy();
        lastPingStatus = 'Timeout (10s)';
      });
    } catch (err) {
      lastPingStatus = `Error: ${err.message}`;
    }
  };

  // Run initial ping after 5 seconds
  setTimeout(ping, 5000);

  keepAliveInterval = setInterval(ping, intervalMs);
};

const stopKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
};

const getKeepAliveStatus = () => {
  return {
    active: !!keepAliveInterval,
    pingCount,
    lastPingTime,
    lastPingStatus,
    intervalSeconds: 30,
    targetUrl: getTargetUrl(),
  };
};

module.exports = {
  startKeepAlive,
  stopKeepAlive,
  getKeepAliveStatus,
};
