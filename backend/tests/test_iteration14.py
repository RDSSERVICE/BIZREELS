"""Iteration 14: dev-admin-login regression, role-activity, cart lifecycle, more-from-vendor, OpenAPI."""
import os
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://emergent-india-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api/v1"
DEV_TOKEN = "bpb7GbNwdH924677L_QfV0nzAxXfNxpQYscX453c35sXhUvgV_Zr8hchw-Mm-nQ8"


@pytest.fixture(scope="module")
def admin_headers():
    r = requests.post(f"{API}/auth/dev/admin-login", json={"token": DEV_TOKEN}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    tok = data.get("access_token") or data.get("token")
    assert tok, f"No token in {data}"
    return {"Authorization": f"Bearer {tok}"}


@pytest.fixture(scope="module")
def sample_listing():
    r = requests.get(f"{API}/listings/?limit=1", timeout=15)
    assert r.status_code == 200
    items = r.json().get("items", [])
    assert items, "No listings seeded"
    return items[0]


# ---- Dev admin login regression ----
def test_dev_admin_login_returns_jwt(admin_headers):
    assert admin_headers["Authorization"].startswith("Bearer ")


def test_dev_admin_login_bad_token():
    r = requests.post(f"{API}/auth/dev/admin-login", json={"token": "wrongtoken12345"}, timeout=15)
    assert r.status_code in (400, 401, 403), f"Expected auth-fail, got {r.status_code}: {r.text}"


# ---- Role activity ----
def test_role_activity(admin_headers):
    r = requests.get(f"{API}/users/me/role-activity", headers=admin_headers, timeout=15)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "current_role" in j
    assert "roles" in j
    assert isinstance(j["roles"], list)


# ---- Cart lifecycle ----
def test_cart_empty_initial(admin_headers):
    r = requests.get(f"{API}/cart/me", headers=admin_headers, timeout=15)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "items" in j and "groups" in j
    # Clear it if not empty from prior runs
    if j.get("total_items", 0) > 0:
        for it in j["items"]:
            requests.delete(f"{API}/cart/me/items/{it['listing_id']}", headers=admin_headers, timeout=15)


def test_cart_add_update_delete(admin_headers, sample_listing):
    lid = sample_listing["id"]
    # Add x2
    r = requests.post(f"{API}/cart/me/add", headers=admin_headers,
                      json={"listing_id": lid, "quantity": 2}, timeout=15)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["total_items"] == 2
    assert len(j["groups"]) >= 1
    assert "vendor" in j["groups"][0]

    # Patch to 5
    r = requests.patch(f"{API}/cart/me/items/{lid}", headers=admin_headers, json={"quantity": 5}, timeout=15)
    assert r.status_code == 200, r.text
    assert r.json()["total_items"] == 5

    # Delete
    r = requests.delete(f"{API}/cart/me/items/{lid}", headers=admin_headers, timeout=15)
    assert r.status_code == 200
    assert r.json()["total_items"] == 0


def test_cart_checkout(admin_headers, sample_listing):
    lid = sample_listing["id"]
    requests.post(f"{API}/cart/me/add", headers=admin_headers,
                  json={"listing_id": lid, "quantity": 1}, timeout=15)
    r = requests.post(f"{API}/cart/me/checkout", headers=admin_headers, timeout=20)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j.get("ok") is True
    assert len(j.get("deals", [])) >= 1
    assert j["deals"][0].get("deal_id")

    # Cart should be empty now
    r2 = requests.get(f"{API}/cart/me", headers=admin_headers, timeout=15)
    assert r2.json()["total_items"] == 0


def test_cart_checkout_empty_400(admin_headers):
    # Ensure empty
    r0 = requests.get(f"{API}/cart/me", headers=admin_headers, timeout=15)
    for it in r0.json().get("items", []):
        requests.delete(f"{API}/cart/me/items/{it['listing_id']}", headers=admin_headers, timeout=15)
    r = requests.post(f"{API}/cart/me/checkout", headers=admin_headers, timeout=15)
    assert r.status_code == 400


# ---- Cart auth guard ----
def test_cart_requires_auth():
    r = requests.get(f"{API}/cart/me", timeout=15)
    assert r.status_code in (401, 403)


# ---- More-from-vendor ----
def test_more_from_vendor(sample_listing):
    vid = sample_listing.get("vendor_id")
    assert vid
    r = requests.get(f"{API}/listings/vendor/{vid}/related", timeout=15)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "items" in j
    assert isinstance(j["items"], list)


def test_more_from_vendor_invalid_id():
    r = requests.get(f"{API}/listings/vendor/notanid/related", timeout=15)
    assert r.status_code == 400


# ---- OpenAPI ----
def test_openapi_new_routes():
    r = requests.get(f"{BASE}/api/openapi.json", timeout=15)
    assert r.status_code == 200
    paths = r.json().get("paths", {})
    required = [
        "/api/v1/cart/me",
        "/api/v1/cart/me/add",
        "/api/v1/cart/me/items/{listing_id}",
        "/api/v1/cart/me/checkout",
        "/api/v1/listings/vendor/{vendor_id}/related",
        "/api/v1/users/me/role-activity",
        "/api/v1/auth/dev/admin-login",
    ]
    missing = [p for p in required if p not in paths]
    assert not missing, f"Missing OpenAPI paths: {missing}"
    # Total ops count
    total = sum(len(v) for v in paths.values())
    assert total >= 140, f"Total ops={total}, expected ~151"


# ---- Regression: Google session-exchange 401 on invalid session ----
def test_google_session_exchange_invalid():
    r = requests.post(f"{API}/auth/google/session-exchange", json={"session_id": "invalid-session-xxxxxxx"}, timeout=15)
    assert r.status_code in (400, 401), f"Expected auth-fail, got {r.status_code}: {r.text}"
