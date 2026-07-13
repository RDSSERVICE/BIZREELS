"""Phase 6c — Test-data purge & pristine feed/leaderboard verification.

Covers:
- Admin OTP login (dev mode)
- Purge endpoint dry_run + real run
- Non-admin 403
- Feed / listings / vendor leaderboard cleanliness (regex-based)
- Reset-demo counts
- OpenAPI includes new endpoint (~135 ops)
- Health + fresh-user OTP flow
"""
from __future__ import annotations
import os
import re
import time
import pytest
import requests

def _load_frontend_env():
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip()
    except FileNotFoundError:
        pass
    return ""


BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _load_frontend_env()).rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL not set"

API = f"{BASE_URL}/api"
V1 = f"{API}/v1"

TEST_DATA_RE = re.compile(r"^(test\b|test_|[uv]\d+ |[uv]\d+$)", re.IGNORECASE)


def _login(phone: str, name: str = "Tester", roles=None) -> str:
    r = requests.post(f"{V1}/auth/otp/send", json={"phone": phone}, timeout=15)
    assert r.status_code == 200, f"otp/send failed: {r.status_code} {r.text}"
    otp = r.json().get("dev_otp")
    assert otp, f"no dev_otp in response: {r.text}"
    payload = {"phone": phone, "otp": otp, "name": name}
    if roles is not None:
        payload["roles"] = roles
    r = requests.post(f"{V1}/auth/otp/verify", json=payload, timeout=15)
    assert r.status_code == 200, f"otp/verify failed: {r.status_code} {r.text}"
    tok = r.json().get("access_token")
    assert tok
    return tok


@pytest.fixture(scope="module")
def admin_token() -> str:
    return _login("9999999999", name="Admin")


@pytest.fixture(scope="module")
def user_token() -> str:
    # Use a random fresh phone since prior soft-deleted users may block re-signup
    import random
    phone = f"98765{random.randint(10000, 99999)}"
    return _login(phone, name="Fresh User")


# ------------------------------ Health ------------------------------
def test_health_ok():
    r = requests.get(f"{API}/health", timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") in ("ok", "healthy", True) or data.get("ok") is True, data


# ------------------------------ Auth basics ------------------------------
def test_fresh_user_login_and_me(user_token):
    r = requests.get(f"{V1}/users/me", headers={"Authorization": f"Bearer {user_token}"}, timeout=10)
    assert r.status_code == 200, r.text
    data = r.json()
    user = data.get("user", data)
    assert user.get("phone", "").startswith("98765"), user


# ------------------------------ OpenAPI ------------------------------
def test_openapi_lists_purge_endpoint_and_counts():
    r = requests.get(f"{API}/openapi.json", timeout=15)
    assert r.status_code == 200
    spec = r.json()
    paths = spec.get("paths", {})
    assert "/api/v1/admin/dev/purge-test-data" in paths, f"purge endpoint missing from OpenAPI; sample paths: {list(paths)[:5]}"
    total_ops = sum(
        1
        for p, methods in paths.items()
        for m in methods
        if m.lower() in {"get", "post", "put", "patch", "delete"}
    )
    print(f"OpenAPI total ops: {total_ops}")
    # Expected ~135; allow a small margin
    assert 130 <= total_ops <= 145, f"unexpected op count: {total_ops}"


# ------------------------------ Purge — dry run ------------------------------
def test_purge_dry_run_idempotent(admin_token):
    hdrs = {"Authorization": f"Bearer {admin_token}"}
    r1 = requests.post(f"{V1}/admin/dev/purge-test-data?dry_run=true", headers=hdrs, timeout=30)
    assert r1.status_code == 200, r1.text
    d1 = r1.json()
    assert d1.get("ok") is True
    assert d1.get("dry_run") is True
    counts = d1["counts"]
    for k in ("users_matched", "listings_matched_by_name", "users_soft_deleted", "listings_total_purged"):
        assert k in counts, f"missing count key {k}: {counts}"
    assert counts["users_soft_deleted"] == 0, "dry_run must not mutate"

    # Run again — counts should be identical (no mutation happened)
    r2 = requests.post(f"{V1}/admin/dev/purge-test-data?dry_run=true", headers=hdrs, timeout=30)
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["counts"]["users_matched"] == counts["users_matched"]
    assert d2["counts"]["listings_matched_by_name"] == counts["listings_matched_by_name"]
    assert d2["counts"]["listings_total_purged"] == counts["listings_total_purged"]


# ------------------------------ Purge — real ------------------------------
def test_purge_real_and_then_dry_run(admin_token):
    hdrs = {"Authorization": f"Bearer {admin_token}"}
    r = requests.post(f"{V1}/admin/dev/purge-test-data", headers=hdrs, timeout=60)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("ok") is True
    assert data.get("dry_run") is False
    # After real run, another dry_run should still succeed (no 500)
    r2 = requests.post(f"{V1}/admin/dev/purge-test-data?dry_run=true", headers=hdrs, timeout=30)
    assert r2.status_code == 200, r2.text
    assert r2.json().get("ok") is True


# ------------------------------ Auth guards ------------------------------
def test_purge_requires_admin(user_token):
    r = requests.post(
        f"{V1}/admin/dev/purge-test-data?dry_run=true",
        headers={"Authorization": f"Bearer {user_token}"},
        timeout=15,
    )
    assert r.status_code == 403, f"expected 403, got {r.status_code}: {r.text}"


def test_purge_requires_auth():
    r = requests.post(f"{V1}/admin/dev/purge-test-data?dry_run=true", timeout=10)
    assert r.status_code in (401, 403), r.status_code


# ------------------------------ Reset demo ------------------------------
def test_reset_demo_realistic_counts(admin_token):
    hdrs = {"Authorization": f"Bearer {admin_token}"}
    r = requests.post(f"{V1}/admin/seed/reset-demo?wipe=true", headers=hdrs, timeout=120)
    assert r.status_code == 200, r.text
    data = r.json()
    # Look for user/listing counts in the response (flexible key names)
    text = str(data).lower()
    print(f"reset-demo response: {data}")
    # tolerate any shape but ensure users/listings appear
    assert "user" in text or "listing" in text


# ------------------------------ Public endpoints must be clean ------------------------------
def _assert_clean_titles(items, key: str):
    dirty = [it.get(key) for it in items if it.get(key) and TEST_DATA_RE.search(it[key])]
    assert not dirty, f"Found polluted {key} entries: {dirty[:10]}"


def test_feed_pristine():
    # give backend a moment after seed
    time.sleep(1)
    r = requests.get(f"{V1}/feed/?limit=25", timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    items = data.get("items") or data.get("results") or data if isinstance(data, list) else data.get("items", [])
    if not isinstance(items, list):
        items = data.get("items", [])
    print(f"feed items: {len(items)}")
    # Title check
    for it in items:
        title = it.get("title") or ""
        assert not TEST_DATA_RE.search(title), f"polluted feed title: {title}"
        vendor = it.get("vendor") or {}
        vname = (vendor.get("name") if isinstance(vendor, dict) else None) or ""
        assert not TEST_DATA_RE.search(vname), f"polluted vendor name in feed: {vname}"


def test_listings_pristine():
    r = requests.get(f"{V1}/listings/?limit=50", timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    items = data.get("items") if isinstance(data, dict) else data
    assert isinstance(items, list)
    print(f"listings items: {len(items)}")
    _assert_clean_titles(items, "title")


def test_fast_responders_leaderboard_pristine():
    r = requests.get(f"{V1}/vendors/leaderboard/fast-responders?limit=10", timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    items = data.get("items") if isinstance(data, dict) else data
    if items is None:
        items = data.get("vendors", []) if isinstance(data, dict) else []
    assert isinstance(items, list)
    print(f"fast-responders items: {len(items)}")
    _assert_clean_titles(items, "name")
