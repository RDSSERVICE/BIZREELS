"""In-memory sliding-window rate limiter for OTP send endpoint."""
import time
from collections import defaultdict, deque
from threading import Lock

_STORE: dict[str, deque] = defaultdict(deque)
_LOCK = Lock()


def check_and_record(key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
    """Return (allowed, remaining). If allowed=False, remaining is seconds until reset."""
    now = time.time()
    with _LOCK:
        dq = _STORE[key]
        cutoff = now - window_seconds
        while dq and dq[0] < cutoff:
            dq.popleft()
        if len(dq) >= limit:
            reset_in = int(window_seconds - (now - dq[0])) + 1
            return False, reset_in
        dq.append(now)
        return True, limit - len(dq)
