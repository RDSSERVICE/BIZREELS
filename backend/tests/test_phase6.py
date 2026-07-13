"""Phase 6a tests — seed endpoint, fast-responder leaderboard, PWA files."""
import os
import time
import requests
import pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE = line.split("=", 1)[1].strip().rstrip("/")
                break
API = f"{BASE}/api/v1"
ADMIN_PHONE = _admin_phone()
_RUN = str(int(time.time()))[-4:]



def _admin_phone():
    try:
        p = open("/app/memory/admin_phone.txt").read().strip().splitlines()[-1].strip()
        if p.isdigit() and len(p) == 10: return p
    except Exception: pass
    return _admin_phone()

def _admin_otp_from_logs(phone):
    import subprocess, re as _re
    try:
        log = subprocess.check_output(["tail", "-n", "300", "/var/log/supervisor/backend.err.log"], text=True)
        m = _re.findall(rf"Admin OTP for {phone}: (\d{{6}})", log)
        return m[-1] if m else None
    except Exception: return None
def _auth(tok):
    return {"Authorization": f"Bearer {tok}"}


def _fresh_phone(prefix: str) -> str:
    return f"{prefix}{_RUN}{int(time.time_ns()) % 10000:04d}"[:10].ljust(10, "0")


def _login(phone, name, roles=None):
    r = requests.post(f"{API}/auth/otp/send", json={"phone": phone}, timeout=15)
    assert r.status_code == 200, r.text
    otp = r.json().get("dev_otp") or _admin_otp_from_logs(phone)
    payload = {"phone": phone, "otp": otp, "name": name}
    if roles: payload["roles"] = roles
    r2 = requests.post(f"{API}/auth/otp/verify", json=payload, timeout=15)
    assert r2.status_code == 200, r2.text
    return r2.json()["access_token"], r2.json()["user"]["id"]


@pytest.fixture(scope="module")
def admin():
    tok, uid = _login(ADMIN_PHONE, "Admin")
    return {"tok": tok, "id": uid}


class TestSeedEndpoint:
    def test_openapi_has_seed_and_leaderboard(self):
        d = requests.get(f"{BASE}/api/openapi.json", timeout=10).json()
        assert "/api/v1/admin/seed/reset-demo" in d["paths"]
        assert "/api/v1/vendors/leaderboard/fast-responders" in d["paths"]

    def test_seed_non_admin_403(self):
        phone = _fresh_phone("9788")
        tok, _ = _login(phone, f"TEST_SeedGate_{_RUN}")
        r = requests.post(f"{API}/admin/seed/reset-demo?wipe=true", headers=_auth(tok), timeout=15)
        assert r.status_code == 403

    def test_admin_seed_wipe_and_populate(self, admin):
        r = requests.post(f"{API}/admin/seed/reset-demo?wipe=true",
                          headers=_auth(admin["tok"]), timeout=60)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["ok"] is True
        assert j["listings"] >= 60, f"expected ≥60 seeded listings, got {j}"
        assert j["users"] >= 40
        assert j["reviews"] >= 30
        assert j["wallets"] >= 40

    def test_public_listings_reflects_seed(self):
        # Give the seed a moment
        r = requests.get(f"{API}/listings/?limit=5", timeout=10)
        assert r.status_code == 200
        items = r.json().get("items", [])
        assert len(items) == 5

    def test_admin_analytics_shows_data(self, admin):
        r = requests.get(f"{API}/admin/analytics/overview", headers=_auth(admin["tok"]), timeout=10)
        assert r.status_code == 200
        j = r.json()
        assert j["total_users"] >= 40
        assert j["total_listings"] >= 60


class TestFastResponderLeaderboard:
    def test_public_leaderboard_works(self):
        r = requests.get(f"{API}/vendors/leaderboard/fast-responders?limit=5", timeout=10)
        assert r.status_code == 200
        j = r.json()
        assert "items" in j
        # Seed produces ~12 vendors with response data
        assert len(j["items"]) >= 1, f"expected fast responders, got {j}"
        for v in j["items"]:
            for k in ("id", "name", "city", "avg_response_time_seconds",
                      "chat_response_rate", "trust_score", "trust_score_tier"):
                assert k in v, f"missing {k}"
            assert v["chat_response_rate"] >= 0.7

    def test_leaderboard_sorted_by_speed(self):
        r = requests.get(f"{API}/vendors/leaderboard/fast-responders?limit=10", timeout=10)
        items = r.json()["items"]
        if len(items) >= 2:
            for i in range(len(items) - 1):
                assert items[i]["avg_response_time_seconds"] <= items[i+1]["avg_response_time_seconds"]

    def test_leaderboard_city_filter(self):
        r = requests.get(f"{API}/vendors/leaderboard/fast-responders?city=Mumbai&limit=5", timeout=10)
        assert r.status_code == 200
        j = r.json()
        assert j["city"] == "Mumbai"
        for v in j["items"]:
            assert v.get("city", "").lower() == "mumbai"


class TestPwa:
    def test_manifest_json(self):
        r = requests.get(f"{BASE}/manifest.json", timeout=10)
        assert r.status_code == 200
        j = r.json()
        assert j["name"] == "Emergent — Local Social Commerce"
        assert j["short_name"] == "Emergent"
        assert j["display"] == "standalone"
        assert j["theme_color"] == "#7c3aed"
        assert len(j["icons"]) >= 2

    def test_service_worker_served(self):
        r = requests.get(f"{BASE}/service-worker.js", timeout=10)
        assert r.status_code == 200
        assert "APP_SHELL" in r.text or "cache" in r.text.lower()

    def test_offline_page(self):
        r = requests.get(f"{BASE}/offline.html", timeout=10)
        assert r.status_code == 200
        assert "offline" in r.text.lower()


class TestRegression:
    def test_health(self):
        assert requests.get(f"{BASE}/api/health", timeout=10).status_code == 200
