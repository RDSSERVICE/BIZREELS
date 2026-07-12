"""Phase 5 wrap-up tests — admin nudge scan + dev-backdate endpoints."""
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
ADMIN_PHONE = "9999999999"
_RUN = str(int(time.time()))[-4:]


def _auth(tok):
    return {"Authorization": f"Bearer {tok}"}


def _fresh_phone(prefix: str) -> str:
    return f"{prefix}{_RUN}{int(time.time_ns()) % 10000:04d}"[:10].ljust(10, "0")


def _login(phone, name, roles=None):
    r = requests.post(f"{API}/auth/otp/send", json={"phone": phone}, timeout=15)
    assert r.status_code == 200, r.text
    otp = r.json().get("dev_otp")
    payload = {"phone": phone, "otp": otp, "name": name}
    if roles: payload["roles"] = roles
    r2 = requests.post(f"{API}/auth/otp/verify", json=payload, timeout=15)
    assert r2.status_code == 200, r2.text
    return r2.json()["access_token"], r2.json()["user"]["id"]


@pytest.fixture(scope="module")
def admin():
    tok, uid = _login(ADMIN_PHONE, "Admin")
    return {"tok": tok, "id": uid}


@pytest.fixture(scope="module")
def vendor():
    phone = _fresh_phone("9878")
    tok, uid = _login(phone, f"TEST_NudgeVendor_{_RUN}", ["customer", "vendor"])
    return {"tok": tok, "id": uid, "phone": phone}


class TestNudgeAdminEndpoints:
    listing_id = None

    def test_openapi_endpoint_count_at_least_125(self):
        r = requests.get(f"{BASE}/api/openapi.json", timeout=10)
        assert r.status_code == 200
        d = r.json()
        count = sum(1 for p, meths in d["paths"].items() for m in meths if m in ("get","post","put","patch","delete"))
        assert count >= 125, f"expected ≥125 endpoints, got {count}"
        assert "/api/v1/admin/nudge/scan" in d["paths"]
        assert "/api/v1/admin/listings/{listing_id}/dev-backdate" in d["paths"]
        assert "/api/v1/vendor/analytics/overview" in d["paths"]
        assert "/api/v1/users/me/referrals/" in d["paths"]
        assert "/api/v1/users/me/onboarding-checklist" in d["paths"]

    def test_nudge_scan_non_admin_403(self, vendor):
        r = requests.post(f"{API}/admin/nudge/scan", headers=_auth(vendor["tok"]), timeout=10)
        assert r.status_code == 403

    def test_backdate_non_admin_403(self, vendor):
        # Any id — 403 should fire before validation
        r = requests.post(f"{API}/admin/listings/000000000000000000000001/dev-backdate",
                          headers=_auth(vendor["tok"]), timeout=10)
        assert r.status_code == 403

    def test_setup_listing_and_backdate(self, vendor, admin):
        # Create a fresh listing
        rc = requests.get(f"{API}/categories/", timeout=10)
        cats = rc.json()
        cats_list = cats.get("items") if isinstance(cats, dict) else cats
        cat_id = cats_list[0]["id"]
        r = requests.post(f"{API}/listings/?become_vendor=true", headers=_auth(vendor["tok"]), json={
            "type": "new_product", "title": f"TEST_NudgeFlow_{_RUN}",
            "description": "phase5 wrap", "category_id": cat_id, "price": 750.0,
            "stock": 3, "images": [],
            "location": {"area": "Indiranagar", "city": "Bengaluru", "pincode": "560038"},
        }, timeout=15)
        assert r.status_code == 200
        TestNudgeAdminEndpoints.listing_id = r.json()["id"]

        # Admin backdates it by 35 days
        r2 = requests.post(
            f"{API}/admin/listings/{TestNudgeAdminEndpoints.listing_id}/dev-backdate?days=35",
            headers=_auth(admin["tok"]), timeout=10,
        )
        assert r2.status_code == 200, r2.text
        j = r2.json()
        assert j["ok"] is True
        assert j["backdated_days"] == 35

    def test_nudge_scan_hits_backdated_listing(self, vendor, admin):
        # Snapshot vendor's unread notifications
        rn = requests.get(f"{API}/notifications/me/unread-count",
                           headers=_auth(vendor["tok"]), timeout=10)
        before = rn.json()["count"]

        r = requests.post(f"{API}/admin/nudge/scan", headers=_auth(admin["tok"]), timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["ok"] is True
        assert j["nudged_count"] >= 1, f"expected ≥1 nudge, got {j}"
        assert j["min_age_days"] == 30
        assert j["cooldown_days"] == 7

        # Vendor should now have a `boost_nudge` notification
        rn_list = requests.get(f"{API}/notifications/me", headers=_auth(vendor["tok"]), timeout=10)
        items = rn_list.json().get("items", [])
        nudges = [n for n in items if n.get("type") == "boost_nudge"]
        assert nudges, f"no boost_nudge notif found among: {[n.get('type') for n in items]}"
        # action_url points to /listing/<slug>?open_boost=1
        assert "open_boost=1" in nudges[0].get("action_url", ""), nudges[0]

        rn_after = requests.get(f"{API}/notifications/me/unread-count",
                                 headers=_auth(vendor["tok"]), timeout=10)
        assert rn_after.json()["count"] > before

    def test_nudge_scan_cooldown_idempotent(self, admin):
        # Running immediately again should nudge zero (7-day cooldown)
        r = requests.post(f"{API}/admin/nudge/scan", headers=_auth(admin["tok"]), timeout=15)
        assert r.status_code == 200
        assert r.json()["nudged_count"] == 0, "cooldown should suppress a rerun"

    def test_backdate_invalid_days_clamped(self, admin):
        # days=0 → clamps to 1
        r = requests.post(
            f"{API}/admin/listings/{TestNudgeAdminEndpoints.listing_id}/dev-backdate?days=0",
            headers=_auth(admin["tok"]), timeout=10,
        )
        assert r.status_code == 200
        assert r.json()["backdated_days"] == 1

    def test_backdate_unknown_listing_404(self, admin):
        r = requests.post(
            f"{API}/admin/listings/000000000000000000000000/dev-backdate",
            headers=_auth(admin["tok"]), timeout=10,
        )
        assert r.status_code == 404

    def test_backdate_bad_id_400(self, admin):
        r = requests.post(
            f"{API}/admin/listings/not-an-oid/dev-backdate",
            headers=_auth(admin["tok"]), timeout=10,
        )
        assert r.status_code == 400
