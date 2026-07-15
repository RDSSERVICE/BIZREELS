"""Phase 7e — Admin OTP + Identity KYC (4-type) + Soft-block on /proposals tests."""
import os
import random
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://emergent-india-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_PHONE = "9039791530"


def _otp_login(phone: str):
    """Send + verify OTP; return (token, user)."""
    s = requests.Session()
    r = s.post(f"{API}/v1/auth/otp/send", json={"phone": phone}, timeout=15)
    if r.status_code == 429:
        pytest.skip(f"OTP rate-limited for {phone}: {r.text}")
    assert r.status_code == 200, r.text
    body = r.json()
    dev_otp = body.get("dev_otp")
    assert dev_otp, f"dev_otp not echoed for {phone}: {body}"
    r2 = s.post(f"{API}/v1/auth/otp/verify", json={"phone": phone, "otp": dev_otp}, timeout=15)
    assert r2.status_code == 200, r2.text
    data = r2.json()
    return data["access_token"], data["user"], dev_otp


@pytest.fixture(scope="module")
def admin_ctx():
    token, user, dev_otp = _otp_login(ADMIN_PHONE)
    return {"token": token, "user": user, "dev_otp": dev_otp}


@pytest.fixture(scope="module")
def admin_headers(admin_ctx):
    return {"Authorization": f"Bearer {admin_ctx['token']}"}


# =============================================================================
# CHANGE 1b/1c — Admin OTP echoes dev_otp, user has admin role
# =============================================================================
class TestAdminOtp:
    def test_admin_phone_login_returns_admin_role(self, admin_ctx):
        assert "admin" in admin_ctx["user"].get("roles", [])
        assert admin_ctx["dev_otp"], "dev_otp missing"

    def test_fresh_non_admin_login_no_admin_role(self):
        # Random 10-digit phone starting with 6/7/8/9 → fresh user, no admin
        rand_phone = "6" + str(random.randint(100000000, 999999999))
        try:
            token, user, _ = _otp_login(rand_phone)
        except Exception as e:
            pytest.skip(f"could not create fresh user: {e}")
        assert "admin" not in (user.get("roles") or [])


# =============================================================================
# CHANGE 2c — Onboarding checklist is 3 steps
# =============================================================================
class TestOnboardingChecklist:
    def test_checklist_has_3_steps(self, admin_headers):
        r = requests.get(f"{API}/v1/users/me/onboarding-checklist", headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        keys = [s["key"] for s in data["steps"]]
        assert set(keys) >= {"profile_pic", "city", "verification"}, keys
        # exactly 3
        assert len(keys) == 3, f"Expected 3 steps, got: {keys}"


# =============================================================================
# CHANGE 3a — 4-type KYC endpoints
# =============================================================================
class TestKycEndpoints:
    def test_aadhaar_valid_approves(self, admin_headers):
        r = requests.post(
            f"{API}/v1/kyc/aadhaar/verify",
            json={"aadhaar_number": "123456789012", "doc_url": "https://example.com/a.jpg"},
            headers=admin_headers, timeout=15,
        )
        # Might hit rate-limit if run multiple times same day
        if r.status_code == 429:
            pytest.skip("Aadhaar daily rate-limit hit")
        assert r.status_code == 200, r.text
        assert r.json().get("status") == "approved"

    def test_pan_invalid_400(self, admin_headers):
        r = requests.post(
            f"{API}/v1/kyc/pan/verify",
            json={"pan_number": "INVALID99", "doc_url": "https://example.com/p.jpg"},
            headers=admin_headers, timeout=15,
        )
        assert r.status_code in (400, 422), r.text

    def test_pan_valid_approves(self, admin_headers):
        r = requests.post(
            f"{API}/v1/kyc/pan/verify",
            json={"pan_number": "ABCDE1234F", "doc_url": "https://example.com/p.jpg"},
            headers=admin_headers, timeout=15,
        )
        if r.status_code == 429:
            pytest.skip("PAN rate-limit hit")
        assert r.status_code == 200, r.text
        assert r.json().get("status") == "approved"

    def test_gst_valid_approves(self, admin_headers):
        # 15-char GSTIN format: 2 digits (state) + 5 letters + 4 digits + 1 letter + 1 alnum + Z + 1 alnum
        r = requests.post(
            f"{API}/v1/kyc/gst/verify",
            json={"gst_number": "22ABCDE1234F1Z5", "doc_url": "https://example.com/g.jpg"},
            headers=admin_headers, timeout=15,
        )
        if r.status_code == 429:
            pytest.skip("GST rate-limit hit")
        assert r.status_code == 200, r.text
        assert r.json().get("status") == "approved"

    def test_bank_valid_approves(self, admin_headers):
        r = requests.post(
            f"{API}/v1/kyc/bank/verify",
            json={
                "account_number": "1234567890",
                "ifsc": "HDFC0001234",
                "holder_name": "Manoj Test",
                "bank_name": "HDFC",
                "doc_url": "https://example.com/b.jpg",
            },
            headers=admin_headers, timeout=15,
        )
        if r.status_code == 429:
            pytest.skip("Bank rate-limit hit")
        assert r.status_code == 200, r.text
        assert r.json().get("status") == "approved"

    def test_status_summary_all_verified(self, admin_headers):
        r = requests.get(f"{API}/v1/kyc/me/status", headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("has_verified_identity") is True
        docs = data.get("docs") or {}
        # verify masking + bank privacy
        for t in ("aadhaar", "pan", "gst", "bank"):
            assert t in docs, f"missing {t} in docs"
            assert docs[t].get("status") == "approved"
            assert docs[t].get("doc_number_masked"), f"{t} not masked"
        bank_add = docs["bank"].get("additional_data") or {}
        assert "ifsc_last4" in bank_add, "bank additional_data.ifsc_last4 missing"
        assert "account_number" not in bank_add, "bank additional_data.account_number should NOT be exposed"


# =============================================================================
# CHANGE 3d — Soft-block on POST /proposals for unverified users
# =============================================================================
class TestProposalSoftBlock:
    """
    Create a fresh unverified user, attempt POST /proposals (expect 403 with identity message),
    submit any KYC doc, retry (should no longer 403 with identity message).
    """
    def test_unverified_proposal_blocked_then_verified_ok(self):
        rand_phone = "8" + str(random.randint(100000000, 999999999))
        try:
            token, user, _ = _otp_login(rand_phone)
        except Exception as e:
            pytest.skip(f"could not create fresh user: {e}")
        headers = {"Authorization": f"Bearer {token}"}

        # Ensure vendor role exists (add if not) — needed to attempt proposal POST
        # Fresh users are customer-only by default; try switch/add role
        requests.post(f"{API}/v1/users/me/add-role", json={"role": "vendor"}, headers=headers, timeout=15)

        # Attempt POST /proposals/ — need requirement_id; use random uuid, backend should
        # reject with 403 for identity BEFORE checking requirement existence.
        body = {
            "requirement_id": "nonexistent-req-id",
            "price": 100.0,
            "message": "test",
        }
        r = requests.post(f"{API}/v1/proposals/", json=body, headers=headers, timeout=15)
        # Expect 403 with identity-verification message
        assert r.status_code == 403, f"expected 403 got {r.status_code}: {r.text}"
        detail = (r.json().get("detail") or "").lower()
        assert "identity" in detail or "verify" in detail, f"unexpected detail: {detail}"

        # Now submit ANY KYC doc (aadhaar)
        r2 = requests.post(
            f"{API}/v1/kyc/aadhaar/verify",
            json={"aadhaar_number": "111122223333", "doc_url": "https://example.com/x.jpg"},
            headers=headers, timeout=15,
        )
        if r2.status_code == 429:
            pytest.skip("aadhaar rate-limit hit on fresh user")
        assert r2.status_code == 200, r2.text

        # Retry proposal POST — should NOT be 403 identity anymore
        r3 = requests.post(f"{API}/v1/proposals/", json=body, headers=headers, timeout=15)
        # Accept anything except 403 identity block. 404 (requirement not found) or 422 is fine.
        if r3.status_code == 403:
            detail3 = (r3.json().get("detail") or "").lower()
            assert "identity" not in detail3 and "verify" not in detail3, f"still identity-blocked: {detail3}"


# =============================================================================
# REGRESSION — health + ops count
# =============================================================================
class TestRegression:
    def test_health(self):
        r = requests.get(f"{API}/health", timeout=10)
        assert r.status_code == 200
        assert r.json().get("status") == "ok"

    def test_openapi_ops_165(self):
        r = requests.get(f"{API}/openapi.json", timeout=15)
        assert r.status_code == 200
        paths = r.json()["paths"]
        count = 0
        for _p, methods in paths.items():
            for m in methods:
                if m.lower() in ("get", "post", "put", "delete", "patch"):
                    count += 1
        assert count == 165, f"Expected 165 ops, got {count}"

    def test_legacy_dev_admin_token_login(self):
        token = "j0XOw7fmnW8-WDX59eZP4dkIQyxmGS5g7yroYUGKRRnXt-_3qQZtiQ8AyK2otlqN"
        r = requests.post(f"{API}/v1/auth/dev/admin-login", json={"token": token}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data
        assert "admin" in (data.get("user") or {}).get("roles", [])
