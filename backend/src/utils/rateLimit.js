const store = new Map();

const checkAndRecord = (key, limit, windowSeconds) => {
  const now = Date.now() / 1000;
  if (!store.has(key)) {
    store.set(key, []);
  }

  const times = store.get(key);
  const cutoff = now - windowSeconds;

  // Remove timestamps outside window
  while (times.length > 0 && times[0] < cutoff) {
    times.shift();
  }

  if (times.length >= limit) {
    const resetIn = Math.max(1, Math.ceil(windowSeconds - (now - times[0])));
    return { allowed: false, remaining: resetIn };
  }

  times.push(now);
  return { allowed: true, remaining: limit - times.length };
};

module.exports = {
  checkAndRecord,
};
