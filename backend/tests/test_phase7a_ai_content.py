"""Phase 7a — AI-powered listing content generation tests.

Covers:
- OpenAPI operation count + presence of AI endpoints.
- POST /v1/ai/generate-listing-content (200 + shape) as admin(+vendor).
- 403 for non-vendor customer.
- 429 after 10 requests per hour per user.
- POST /v1/ai/improve-description (tone=hindi_mix).
- Listing create/read with short_description, features, variants (persistence).
- Backwards-compat: create without new fields still returns null/[].
- GET/PATCH /v1/admin/settings/integrations includes ai_content block.
- POST /v1/admin/settings/integrations/test?integration=ai_content returns 200.
- Regression: purge-test-data still works; OTP send/verify still works.
"""
from __future__ import annotations

import json
import os
import random
import tempfile
import time
import pytest
import requests
from filelock import FileLock

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://emergent-india-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_PHONE = "9999999999"
LONG_TIMEOUT = 45  # AI endpoints hit gpt-5.4 → 3–10s typical
_ADMIN_CACHE = os.path.join(tempfile.gettempdir(), "phase7a_admin_token.json")


# ---------- shared helpers ----------

def _rand_phone() -> str:
    # Always a 10-digit phone starting with 9
    return f"9{random.randint(100000000, 999999999)}"


def _send_verify(phone: str, name: str, roles: list[str] | None = None,
                 retries: int = 3) -> dict:
    last_err = None
    for _ in range(retries):
        r = requests.post(f"{API}/v1/auth/otp/send", json={"phone": phone}, timeout=15)
        if r.status_code != 200:
            last_err = f"otp/send {r.status_code}: {r.text}"
            time.sleep(0.5)
            continue
        otp = r.json().get("dev_otp")
        if not otp:
            last_err = f"no dev_otp: {r.text}"
            time.sleep(0.5)
            continue
        body = {"phone": phone, "otp": otp, "name": name}
        if roles:
            body["roles"] = roles
        r = requests.post(f"{API}/v1/auth/otp/verify", json=body, timeout=15)
        if r.status_code == 200:
            return r.json()
        last_err = f"otp/verify {r.status_code}: {r.text}"
        time.sleep(0.5)
    raise AssertionError(f"login flow failed for {phone}: {last_err}")


# ---------- fixtures ----------

@pytest.fixture(scope="session")
def admin_token(tmp_path_factory, worker_id) -> str:
    """Cross-worker cached admin token. First worker logs in, others read the file."""
    lock = FileLock(_ADMIN_CACHE + ".lock")
    with lock:
        if os.path.exists(_ADMIN_CACHE):
            try:
                with open(_ADMIN_CACHE) as f:
                    cached = json.load(f)
                if cached.get("access_token"):
                    # Quick liveness check
                    r = requests.get(f"{API}/v1/users/me",
                                     headers={"Authorization": f"Bearer {cached['access_token']}"},
                                     timeout=10)
                    if r.status_code == 200:
                        return cached["access_token"]
            except Exception:
                pass
        data = _send_verify(ADMIN_PHONE, "Admin")
        with open(_ADMIN_CACHE, "w") as f:
            json.dump({"access_token": data["access_token"]}, f)
        return data["access_token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token: str) -> dict:
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def customer_token() -> str:
    """A fresh customer (no vendor role)."""
    phone = _rand_phone()
    data = _send_verify(phone, "TEST_Customer")
    return data["access_token"]


@pytest.fixture(scope="module")
def vendor_bundle(admin_headers) -> dict:
    """A fresh user we upgrade to vendor by creating a listing with become_vendor=true."""
    phone = _rand_phone()
    data = _send_verify(phone, "TEST_Vendor")
    return {"token": data["access_token"], "user_id": data["user"]["id"], "phone": phone}


@pytest.fixture(scope="module")
def category_id() -> str:
    r = requests.get(f"{API}/v1/categories/", timeout=15)
    assert r.status_code == 200, r.text
    items = r.json() if isinstance(r.json(), list) else r.json().get("items") or []
    # pick first leaf (no children) or top-level with valid id
    assert items, "No categories seeded"
    return items[0]["id"]


# ---------- 1. OpenAPI ----------

class TestOpenAPI:
    def test_openapi_has_ai_endpoints_and_count(self):
        r = requests.get(f"{API}/openapi.json", timeout=15)
        assert r.status_code == 200
        spec = r.json()
        paths = spec.get("paths", {})
        assert "/api/v1/ai/generate-listing-content" in paths, "AI generate route missing from OpenAPI"
        assert "/api/v1/ai/improve-description" in paths, "AI improve route missing from OpenAPI"
        op_count = sum(
            1 for p in paths.values() for m in p if m.lower() in
            ("get", "post", "put", "patch", "delete")
        )
        # target ~140; allow +/-10 wiggle
        assert 130 <= op_count <= 155, f"unexpected operation count: {op_count}"


# ---------- 2. AI generate ----------

class TestAIGenerate:
    def test_generate_ok_shape(self, admin_headers, category_id):
        body = {
            "title": "Kolhapuri Chappals for Men - Handmade Leather",
            "type": "new_product",
            "category_id": category_id,
            "hints": "brown, sizes 7-11",
        }
        r = requests.post(f"{API}/v1/ai/generate-listing-content",
                          headers=admin_headers, json=body, timeout=LONG_TIMEOUT)
        assert r.status_code == 200, f"AI generate returned {r.status_code}: {r.text[:400]}"
        payload = r.json()
        # If budget exceeded, main agent said ok:false + error is acceptable.
        assert "ok" in payload
        assert "meta" in payload
        meta = payload["meta"]
        assert "latency_ms" in meta and isinstance(meta["latency_ms"], int)
        assert "model_used" in meta
        assert "provider" in meta
        gen = payload.get("generated") or {}
        # Structural keys must always be present (empty fallback still emits them)
        for key in ("description", "tags", "features", "variants"):
            assert key in gen, f"generated missing key {key}"
        if payload["ok"]:
            assert isinstance(gen["description"], str) and len(gen["description"]) > 0
            assert isinstance(gen["tags"], list)
            assert isinstance(gen["features"], list)
            assert isinstance(gen["variants"], list)
            assert "suggested_price_range_inr" in gen
        else:
            # Acceptable: budget exceeded etc.
            pytest.skip(f"LLM returned ok:false — acceptable per PRD: {payload.get('error')}")

    def test_generate_non_vendor_403(self, customer_token, category_id):
        headers = {"Authorization": f"Bearer {customer_token}", "Content-Type": "application/json"}
        body = {"title": "Some New Product Title", "type": "new_product",
                "category_id": category_id, "hints": "x"}
        r = requests.post(f"{API}/v1/ai/generate-listing-content",
                          headers=headers, json=body, timeout=LONG_TIMEOUT)
        assert r.status_code == 403, f"expected 403 for non-vendor, got {r.status_code}: {r.text[:200]}"


# ---------- 3. AI improve ----------

class TestAIImprove:
    def test_improve_hindi_mix(self, admin_headers):
        body = {
            "title": "Handmade Kolhapuri Chappals",
            "current_description": "These are handmade leather chappals made in Kolhapur. Durable and stylish.",
            "tone": "hindi_mix",
        }
        r = requests.post(f"{API}/v1/ai/improve-description",
                          headers=admin_headers, json=body, timeout=LONG_TIMEOUT)
        assert r.status_code == 200, f"improve returned {r.status_code}: {r.text[:400]}"
        payload = r.json()
        assert "ok" in payload
        assert "description" in payload
        assert "meta" in payload
        if not payload["ok"]:
            pytest.skip(f"LLM returned ok:false (acceptable): {payload.get('error')}")
        assert isinstance(payload["description"], str) and len(payload["description"]) > 0


# ---------- 4. Rate limit — 11th call → 429 ----------

class TestAIRateLimit:
    def test_11th_request_429(self, category_id):
        """Uses a dedicated fresh admin session so it doesn't consume the shared admin quota.

        Since the AI rate-limit is 10/hr per user_id (in-memory sliding window),
        we spin up a fresh vendor and hammer 11 calls. First 10 succeed (may be
        ok:false due to budget → still 200), 11th must be 429.
        """
        # fresh vendor
        phone = _rand_phone()
        data = _send_verify(phone, "TEST_RLVendor")
        # upgrade to vendor via add-role
        headers = {"Authorization": f"Bearer {data['access_token']}",
                   "Content-Type": "application/json"}
        r = requests.post(f"{API}/v1/users/me/add-role",
                          headers=headers, json={"role": "vendor"}, timeout=15)
        assert r.status_code == 200, f"add-role failed: {r.status_code} {r.text[:200]}"

        body = {"title": "Quick Rate Limit Test Product",
                "type": "new_product", "category_id": category_id, "hints": "n/a"}

        status_codes: list[int] = []
        for _ in range(10):
            r = requests.post(f"{API}/v1/ai/generate-listing-content",
                              headers=headers, json=body, timeout=LONG_TIMEOUT)
            status_codes.append(r.status_code)
            # allow ok:false + 200
            assert r.status_code in (200,), f"unexpected code during warmup {r.status_code}: {r.text[:200]}"

        # 11th → 429
        r = requests.post(f"{API}/v1/ai/generate-listing-content",
                          headers=headers, json=body, timeout=10)
        assert r.status_code == 429, f"expected 429 on 11th, got {r.status_code}: {r.text[:200]}"
        assert "try again" in r.text.lower() or "rate limit" in r.text.lower() or "retry" in r.text.lower()


# ---------- 5. Listing create/read w/ Phase-7a fields ----------

class TestListingFields:
    def test_create_with_new_fields_persists(self, vendor_bundle, category_id):
        headers = {"Authorization": f"Bearer {vendor_bundle['token']}",
                   "Content-Type": "application/json"}
        body = {
            "type": "new_product",
            "title": f"TEST_Kolhapuri Chappals {int(time.time())}",
            "description": "Genuine handcrafted leather chappals.",
            "category_id": category_id,
            "price": 1499,
            "stock": 25,
            "location": {"area": "MG Road", "city": "Bengaluru", "pincode": "560001"},
            "short_description": "Handmade brown leather chappals",
            "features": ["Genuine leather", "Handcrafted in Kolhapur", "Available in 5 sizes"],
            "variants": [
                {"name": "Size", "type": "size", "options": ["7", "8", "9", "10", "11"]},
                {"name": "Color", "type": "color", "options": ["Brown", "Tan"]},
            ],
            "tags": ["chappals", "leather", "handmade"],
        }
        r = requests.post(f"{API}/v1/listings/?become_vendor=true",
                          headers=headers, json=body, timeout=20)
        assert r.status_code == 200, f"create failed: {r.status_code} {r.text[:400]}"
        data = r.json()
        assert data.get("short_description") == "Handmade brown leather chappals"
        assert data.get("features") == body["features"]
        assert isinstance(data.get("variants"), list) and len(data["variants"]) == 2
        assert data["variants"][0]["name"] == "Size"
        assert data["variants"][0]["type"] == "size"
        assert data["variants"][0]["options"] == ["7", "8", "9", "10", "11"]

        slug = data.get("slug")
        assert slug
        # Verify GET by slug returns the same fields
        r = requests.get(f"{API}/v1/listings/{slug}", timeout=15)
        assert r.status_code == 200, r.text
        got = r.json()
        assert got["short_description"] == "Handmade brown leather chappals"
        assert got["features"] == body["features"]
        assert len(got["variants"]) == 2
        assert got["variants"][1]["name"] == "Color"

    def test_create_without_new_fields_backcompat(self, vendor_bundle, category_id):
        headers = {"Authorization": f"Bearer {vendor_bundle['token']}",
                   "Content-Type": "application/json"}
        body = {
            "type": "new_product",
            "title": f"TEST_Simple Product {int(time.time())}",
            "description": "no extras",
            "category_id": category_id,
            "price": 199,
            "stock": 5,
            "location": {"area": "Koregaon Park", "city": "Pune", "pincode": "411001"},
        }
        r = requests.post(f"{API}/v1/listings/?become_vendor=true",
                          headers=headers, json=body, timeout=20)
        assert r.status_code == 200, f"backcompat create failed: {r.status_code} {r.text[:400]}"
        data = r.json()
        # short_description should be null-ish; features/variants should be empty lists
        assert data.get("short_description") in (None, "", ), \
            f"expected null/empty short_description, got {data.get('short_description')!r}"
        assert data.get("features") == []
        assert data.get("variants") == []


# ---------- 6. Admin settings integrations (ai_content) ----------

class TestAdminSettings:
    def test_get_includes_ai_content(self, admin_headers):
        r = requests.get(f"{API}/v1/admin/settings/integrations",
                         headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "ai_content" in j, f"ai_content block missing: {list(j.keys())}"
        block = j["ai_content"]
        for k in ("provider", "model", "enabled"):
            assert k in block, f"ai_content missing {k}: {block}"

    def test_patch_ai_content_persists(self, admin_headers):
        # Read current
        r = requests.get(f"{API}/v1/admin/settings/integrations",
                         headers=admin_headers, timeout=15)
        r.raise_for_status()
        # Patch with masked api_key — should preserve existing
        patch = {"ai_content": {
            "provider": "openai",
            "model": "gpt-5.4-mini",
            "enabled": True,
            "api_key": "****XXXX",
        }}
        r = requests.patch(f"{API}/v1/admin/settings/integrations",
                           headers=admin_headers, json=patch, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["ai_content"]["provider"] == "openai"
        assert j["ai_content"]["model"] == "gpt-5.4-mini"
        assert j["ai_content"]["enabled"] is True
        # Re-fetch to confirm persistence
        r = requests.get(f"{API}/v1/admin/settings/integrations",
                         headers=admin_headers, timeout=15)
        j2 = r.json()
        assert j2["ai_content"]["model"] == "gpt-5.4-mini"

        # Reset to gpt-5.4 to not break other suites
        requests.patch(f"{API}/v1/admin/settings/integrations",
                       headers=admin_headers,
                       json={"ai_content": {"provider": "openai", "model": "gpt-5.4", "enabled": True}},
                       timeout=15)

    def test_test_integration_ai_content_200(self, admin_headers):
        r = requests.post(f"{API}/v1/admin/settings/integrations/test?integration=ai_content",
                          headers=admin_headers, timeout=LONG_TIMEOUT)
        assert r.status_code == 200, f"test integration failed: {r.status_code} {r.text[:400]}"
        j = r.json()
        assert j.get("integration") == "ai_content"
        assert "ok" in j
        # ok:true or ok:false both acceptable — must have error field if false
        if j["ok"] is False:
            assert "error" in j and j["error"], f"ok=false but no error field: {j}"


# ---------- 7. Regressions ----------

class TestRegressions:
    def test_purge_still_works(self, admin_headers):
        r = requests.post(f"{API}/v1/admin/dev/purge-test-data?dry_run=true",
                          headers=admin_headers, timeout=30)
        assert r.status_code == 200, f"purge dry_run failed: {r.status_code} {r.text[:400]}"
        j = r.json()
        assert "ok" in j or "counts" in j or "would_delete" in j, f"unexpected purge response: {j}"

    def test_otp_send_verify_regression(self):
        phone = _rand_phone()
        r = requests.post(f"{API}/v1/auth/otp/send", json={"phone": phone}, timeout=15)
        assert r.status_code == 200
        otp = r.json().get("dev_otp")
        assert otp
        r = requests.post(f"{API}/v1/auth/otp/verify",
                          json={"phone": phone, "otp": otp, "name": "TEST_Regression"},
                          timeout=15)
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_feed_excludes_test_data(self):
        r = requests.get(f"{API}/v1/feed?limit=25", timeout=15)
        assert r.status_code == 200
        items = r.json().get("items") or []
        # Feed currently filters case-sensitive `^TEST_` prefix only.
        for it in items:
            title = it.get("title") or ""
            assert not title.startswith("TEST_"), f"TEST_ data leaked into /feed: {title}"
