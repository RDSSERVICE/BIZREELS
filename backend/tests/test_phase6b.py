"""Phase 6b tests — reels populated in seed, TEST_ exclusion, 404 route.
Assumes the seed has been run at least once (auto-seed on startup handles this).
"""
import os, requests, pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE = line.split("=", 1)[1].strip().rstrip("/")
                break
API = f"{BASE}/api/v1"


class TestReelsAndPollution:
    def test_reels_feed_ge_15(self):
        r = requests.get(f"{API}/feed/reels?limit=30", timeout=15)
        assert r.status_code == 200
        items = r.json().get("items", [])
        assert len(items) >= 15, f"expected ≥15 reels in feed, got {len(items)}"
        # Each has a real reel URL
        assert all(x.get("reel", {}).get("url") for x in items), "some reels missing url"

    def test_public_listings_excludes_test_prefixed_titles(self):
        r = requests.get(f"{API}/listings/?limit=100", timeout=10)
        items = r.json().get("items", [])
        polluted = [x["title"] for x in items if x["title"].startswith("TEST_")]
        assert polluted == [], f"TEST_* leaked into public listings: {polluted[:5]}"

    def test_feed_excludes_test_prefixed_titles(self):
        r = requests.get(f"{API}/feed?limit=100", timeout=10)
        items = r.json().get("items", [])
        polluted = [x.get("title") for x in items if (x.get("title") or "").startswith("TEST_")]
        assert polluted == [], f"TEST_* leaked into feed: {polluted[:5]}"

    def test_404_route_serves_html(self):
        r = requests.get(f"{BASE}/some/random/path/that/does/not/exist", timeout=10)
        # SPA — index.html served with 200. React router shows NotFound page.
        assert r.status_code == 200
        assert "<div id=\"root\">" in r.text or "<html" in r.text.lower()
