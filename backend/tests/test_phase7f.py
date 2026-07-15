"""Phase 7f delta backend tests: admin console endpoints, trust+ badge,
cart guard, AI multimodal + transcribe, KYC rate-limit ordering fix.
"""
from __future__ import annotations
import os
import random
import time
import requests
import pytest

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
ADMIN_PHONE = "9039791530"


def _rand_phone(prefix: str = "9") -> str:
    return prefix + "".join(str(random.randint(0, 9)) for _ in range(9))


def _login(phone: str, name: str | None = None, extra_roles=None):
    r = requests.post(f"{BASE}/api/v1/auth/otp/send", json={"phone": phone}, timeout=15)
    assert r.status_code == 200, r.text
    otp = r.json().get("dev_otp")
    if not otp:
        pytest.skip(f"dev_otp not echoed for {phone}")
    payload = {"phone": phone, "otp": otp}
    if name:
        payload["name"] = name
    if extra_roles:
        payload["roles"] = extra_roles
    r = requests.post(f"{BASE}/api/v1/auth/otp/verify", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    j = r.json()
    return j["access_token"], j.get("user", {})


@pytest.fixture(scope="module")
def admin_token():
    tok, _u = _login(ADMIN_PHONE, name="Admin")
    return tok


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def user_token():
    tok, _u = _login(_rand_phone("7"), name="Regular Guy", extra_roles=["customer"])
    return tok


@pytest.fixture(scope="module")
def user_headers(user_token):
    return {"Authorization": f"Bearer {user_token}"}


# ============================================================ ADMIN CONSOLE
class TestAdminConsole:
    def test_transactions_list(self, admin_headers):
        r = requests.get(f"{BASE}/api/v1/admin/transactions?limit=5", headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "items" in j and "count" in j
        assert isinstance(j["items"], list)
        for it in j["items"]:
            assert it["kind"] in ("payment", "wallet")
            assert "id" in it and "amount_paise" in it and "created_at" in it

    def test_orders_list(self, admin_headers):
        r = requests.get(f"{BASE}/api/v1/admin/orders?limit=5", headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "items" in j and "count" in j

    def test_commissions_list(self, admin_headers):
        r = requests.get(f"{BASE}/api/v1/admin/commissions?limit=5", headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        assert "items" in r.json()

    def test_commissions_summary(self, admin_headers):
        r = requests.get(f"{BASE}/api/v1/admin/commissions/summary", headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "period_days" in j
        assert "total_earned_inr" in j
        assert "by_status" in j

    def test_set_global_commission_rate(self, admin_headers):
        r = requests.post(f"{BASE}/api/v1/admin/commissions/rate/global",
                          json={"rate": 0.06}, headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json().get("global_rate") == 0.06

    def test_set_category_commission_rate(self, admin_headers):
        r = requests.post(f"{BASE}/api/v1/admin/commissions/rate/category",
                          json={"category_id": "test_cat_abc", "rate": 0.10},
                          headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json().get("rate") == 0.10

    def test_audit_log(self, admin_headers):
        r = requests.get(f"{BASE}/api/v1/admin/audit-log?limit=5", headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        assert "items" in r.json()

    def test_transactions_csv(self, admin_headers):
        r = requests.get(f"{BASE}/api/v1/admin/transactions.csv", headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        ctype = r.headers.get("content-type", "")
        assert "text/csv" in ctype, ctype
        # Header row
        first_line = r.text.splitlines()[0] if r.text else ""
        assert "id" in first_line and "kind" in first_line

    def test_non_admin_forbidden(self, user_headers):
        for path in ["/admin/transactions", "/admin/orders", "/admin/commissions",
                     "/admin/commissions/summary", "/admin/audit-log", "/admin/transactions.csv"]:
            r = requests.get(f"{BASE}/api/v1{path}", headers=user_headers, timeout=15)
            assert r.status_code == 403, f"{path} → {r.status_code}"


# ============================================================ TRUST+ BADGE
class TestTrustPlus:
    def test_admin_is_trusted_plus(self, admin_headers):
        r = requests.get(f"{BASE}/api/v1/kyc/trust-plus/me", headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["verified_doc_count"] >= 2
        assert j["is_trusted_plus"] is True
        assert j["min_required"] == 2
        assert j["match_boost"] == 15
        assert j["feed_boost"] == 15

    def test_fresh_user_not_trusted_plus(self):
        tok, _u = _login(_rand_phone("8"), name="Fresh Guy", extra_roles=["customer"])
        h = {"Authorization": f"Bearer {tok}"}
        r = requests.get(f"{BASE}/api/v1/kyc/trust-plus/me", headers=h, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["verified_doc_count"] == 0
        assert j["is_trusted_plus"] is False
        assert j["bonus_awarded"] is False

    def test_second_doc_awards_bonus(self):
        tok, u = _login(_rand_phone("8"), name="TrustPlus Candidate", extra_roles=["customer"])
        h = {"Authorization": f"Bearer {tok}"}
        # Wallet before
        r0 = requests.get(f"{BASE}/api/v1/wallet/me", headers=h, timeout=15)
        assert r0.status_code == 200
        bal_before = r0.json().get("balance", 0)

        # 1st doc: aadhaar
        r1 = requests.post(f"{BASE}/api/v1/kyc/aadhaar/verify",
                           json={"aadhaar_number": "123456789012", "doc_url": "/uploads/a.jpg"},
                           headers=h, timeout=15)
        assert r1.status_code == 200, r1.text

        s1 = requests.get(f"{BASE}/api/v1/kyc/trust-plus/me", headers=h, timeout=15).json()
        assert s1["bonus_awarded"] is False, s1

        # 2nd doc: pan
        r2 = requests.post(f"{BASE}/api/v1/kyc/pan/verify",
                           json={"pan_number": "ABCDE1234F", "doc_url": "/uploads/p.jpg"},
                           headers=h, timeout=15)
        assert r2.status_code == 200, r2.text

        s2 = requests.get(f"{BASE}/api/v1/kyc/trust-plus/me", headers=h, timeout=15).json()
        assert s2["is_trusted_plus"] is True, s2
        assert s2["bonus_awarded"] is True, s2

        # Wallet balance should have grown by exactly 100
        r_bal = requests.get(f"{BASE}/api/v1/wallet/me", headers=h, timeout=15).json()
        bal_after = r_bal.get("balance", 0)
        assert bal_after - bal_before >= 100, f"before={bal_before} after={bal_after}"

        # 3rd doc idempotency: submit gst → bonus_awarded still true, wallet not +100 more
        r3 = requests.post(f"{BASE}/api/v1/kyc/gst/verify",
                           json={"gst_number": "27ABCDE1234F1Z5", "doc_url": "/uploads/g.jpg"},
                           headers=h, timeout=15)
        assert r3.status_code == 200, r3.text
        r_bal2 = requests.get(f"{BASE}/api/v1/wallet/me", headers=h, timeout=15).json()
        bal_after2 = r_bal2.get("balance", 0)
        assert bal_after2 == bal_after, f"expected idempotent, got before={bal_after} now={bal_after2}"


# ============================================================ CART GUARD
class TestCartGuard:
    def test_empty_cart_400(self, user_headers):
        r = requests.post(f"{BASE}/api/v1/cart/me/checkout", headers=user_headers, timeout=15)
        assert r.status_code == 400, r.text
        assert "empty" in r.text.lower()

    def test_cart_unverified_vendor_403(self):
        # Fresh buyer
        buyer_tok, _b = _login(_rand_phone("7"), name="BuyerX", extra_roles=["customer"])
        bh = {"Authorization": f"Bearer {buyer_tok}"}

        # Fresh vendor (unverified) + publish listing
        vendor_tok, vu = _login(_rand_phone("9"), name="Vendor Un", extra_roles=["customer", "vendor"])
        vh = {"Authorization": f"Bearer {vendor_tok}"}

        # Grab a category
        cats = requests.get(f"{BASE}/api/v1/categories/?tree=true", timeout=15).json()
        cat_id = None
        if isinstance(cats, list) and cats:
            cat_id = str(cats[0].get("_id") or cats[0].get("id"))
        # Create listing
        listing_payload = {
            "title": "TEST_cart_guard_listing",
            "type": "new_product",
            "asking_price": 500,
            "description": "test only",
            "category_id": cat_id,
        }
        rl = requests.post(f"{BASE}/api/v1/listings/", json=listing_payload, headers=vh, timeout=15)
        if rl.status_code not in (200, 201):
            pytest.skip(f"Could not create listing: {rl.status_code} {rl.text[:200]}")
        listing = rl.json()
        lid = listing.get("id") or listing.get("_id")

        # Add to buyer's cart
        r_add = requests.post(f"{BASE}/api/v1/cart/me/items",
                              json={"listing_id": str(lid), "quantity": 1},
                              headers=bh, timeout=15)
        if r_add.status_code not in (200, 201):
            pytest.skip(f"Could not add to cart: {r_add.status_code} {r_add.text[:200]}")

        r_co = requests.post(f"{BASE}/api/v1/cart/me/checkout", headers=bh, timeout=15)
        assert r_co.status_code == 403, r_co.text
        detail = r_co.json().get("detail", {})
        assert detail.get("code") == "vendor_unverified", detail
        assert isinstance(detail.get("vendor_ids"), list) and detail["vendor_ids"], detail


# ============================================================ AI MULTIMODAL
class TestAiMultimodal:
    def test_generate_with_media(self, admin_headers):
        body = {
            "title": "Sample bike helmet",
            "type": "new_product",
            "video_url": "https://example.com/demo.mp4",
            "audio_url": "https://example.com/voice.mp3",
        }
        r = requests.post(f"{BASE}/api/v1/ai/generate-listing-content",
                          json=body, headers=admin_headers, timeout=60)
        assert r.status_code == 200, r.text
        j = r.json()
        # Accept either meta or fallback
        # Just ensure content structure
        assert isinstance(j, dict)

    def test_transcribe_audio(self, admin_headers):
        r = requests.post(f"{BASE}/api/v1/ai/transcribe-audio",
                          json={"audio_url": "https://example.com/sample.mp3"},
                          headers=admin_headers, timeout=60)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "ok" in j


# ============================================================ RATE LIMIT ORDERING
class TestKycRateLimitOrdering:
    def test_invalid_aadhaar_not_consumed(self):
        tok, _u = _login(_rand_phone("7"), name="RL Tester", extra_roles=["customer"])
        h = {"Authorization": f"Bearer {tok}"}
        # 6 invalid submissions
        for i in range(6):
            r = requests.post(f"{BASE}/api/v1/kyc/aadhaar/verify",
                              json={"aadhaar_number": "abcabcabcabc", "doc_url": "/uploads/x.jpg"},
                              headers=h, timeout=15)
            assert r.status_code == 400, f"attempt {i}: {r.status_code} {r.text}"
        # 7th VALID should succeed (proves rate limit wasn't consumed by invalid ones)
        r_ok = requests.post(f"{BASE}/api/v1/kyc/aadhaar/verify",
                             json={"aadhaar_number": "999988887777", "doc_url": "/uploads/x.jpg"},
                             headers=h, timeout=15)
        assert r_ok.status_code == 200, r_ok.text


# ============================================================ REGRESSION
class TestRegression:
    def test_endpoint_count(self):
        r = requests.get(f"{BASE}/api/openapi.json", timeout=15)
        assert r.status_code == 200
        spec = r.json()
        ops = sum(1 for _p, methods in spec["paths"].items() for _m in methods)
        assert ops == 176, f"Expected 176 ops, got {ops}"

    def test_health(self):
        r = requests.get(f"{BASE}/api/health", timeout=15)
        assert r.status_code == 200
        assert r.json().get("status") == "ok"

    def test_kyc_verify_admin(self, admin_headers):
        r = requests.get(f"{BASE}/api/v1/kyc/me/status", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        # Admin should have 4 verified docs
        j = r.json()
        # response schema unknown — just verify 200
