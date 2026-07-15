"""SEC-101 retest: Trust+ +100 credits bonus MUST be awarded exactly once
under concurrent KYC verifies. Fix uses atomic find_one_and_update.
"""
from __future__ import annotations
import os
import random
import string
import threading
import requests
import pytest
from pymongo import MongoClient


def _get_credits(wallet_json: dict) -> int:
    """Wallet response is {wallet: {credits: N, ...}, transactions: [...]} or flat."""
    if isinstance(wallet_json, dict):
        if "wallet" in wallet_json and isinstance(wallet_json["wallet"], dict):
            return int(wallet_json["wallet"].get("credits", 0))
        return int(wallet_json.get("credits", wallet_json.get("balance", 0)))
    return 0

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")
ADMIN_PHONE = "9039791530"


def _rand_phone(prefix: str = "6") -> str:
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
def db():
    return MongoClient(MONGO_URL)[DB_NAME]


# ============================================================ SEC-101 CONCURRENCY
class TestSec101Concurrency:
    def test_concurrent_pan_verify_awards_bonus_exactly_once(self, db):
        # Fresh user
        phone = _rand_phone("6")
        tok, u = _login(phone, name="SEC101 Concurrent", extra_roles=["customer"])
        h = {"Authorization": f"Bearer {tok}"}
        user_id = u.get("id") or u.get("_id")
        assert user_id, u

        # Baseline wallet
        r0 = requests.get(f"{BASE}/api/v1/wallet/me", headers=h, timeout=15).json()
        bal_before = _get_credits(r0)
        # Welcome bonus should be 50
        assert bal_before == 50, f"Expected welcome bonus 50, got {bal_before}"

        # 1st doc: aadhaar (sequential, gets doc_count=1, no trust+ yet)
        r1 = requests.post(f"{BASE}/api/v1/kyc/aadhaar/verify",
                           json={"aadhaar_number": "123456789012", "doc_url": "/uploads/a.jpg"},
                           headers=h, timeout=15)
        assert r1.status_code == 200, r1.text

        # trust-plus/me should show is_trusted_plus=false
        s1 = requests.get(f"{BASE}/api/v1/kyc/trust-plus/me", headers=h, timeout=15).json()
        assert s1["verified_doc_count"] == 1, s1
        assert s1["is_trusted_plus"] is False, s1
        assert s1["bonus_awarded"] is False, s1

        r_bal1 = requests.get(f"{BASE}/api/v1/wallet/me", headers=h, timeout=15).json()
        assert _get_credits(r_bal1) == 50, r_bal1

        # Fire 5 CONCURRENT PAN verify requests using threads
        results = []
        errors = []

        def _submit_pan(idx):
            try:
                rr = requests.post(
                    f"{BASE}/api/v1/kyc/pan/verify",
                    json={"pan_number": "ABCDE1234F", "doc_url": f"/uploads/p{idx}.jpg"},
                    headers=h,
                    timeout=30,
                )
                results.append((idx, rr.status_code, rr.text[:200]))
            except Exception as e:
                errors.append((idx, str(e)))

        threads = [threading.Thread(target=_submit_pan, args=(i,)) for i in range(5)]
        # Start together
        for t in threads:
            t.start()
        for t in threads:
            t.join(timeout=60)

        print(f"\nConcurrent results: {results}")
        print(f"Errors: {errors}")

        # At least 1 must have succeeded (200); rest may be 200/400/429 depending on rate limits
        success_count = sum(1 for _i, sc, _t in results if sc == 200)
        assert success_count >= 1, f"No successful PAN verify: {results}"

        # After all concurrent calls: verify EXACTLY ONE trust_plus_bonus wallet transaction row
        tx_count = db.wallet_transactions.count_documents({
            "user_id": user_id,
            "reason": "trust_plus_bonus",
        })
        assert tx_count == 1, f"Expected exactly 1 trust_plus_bonus tx, got {tx_count}"

        # Wallet balance = 50 (welcome) + 100 (trust+) = 150
        r_bal = requests.get(f"{BASE}/api/v1/wallet/me", headers=h, timeout=15).json()
        bal_after = _get_credits(r_bal)
        assert bal_after == 150, f"Expected 150 credits, got {bal_after}. Balance breakdown: {r_bal}"

        # trust-plus/me → is_trusted_plus:true, bonus_awarded:true
        s2 = requests.get(f"{BASE}/api/v1/kyc/trust-plus/me", headers=h, timeout=15).json()
        assert s2["is_trusted_plus"] is True, s2
        assert s2["bonus_awarded"] is True, s2


# ============================================================ REGRESSION 1: single-request award
class TestRegressionSingleAward:
    def test_sequential_award_still_works(self, db):
        phone = _rand_phone("6")
        tok, u = _login(phone, name="SEC101 Sequential", extra_roles=["customer"])
        h = {"Authorization": f"Bearer {tok}"}
        user_id = u.get("id") or u.get("_id")

        r0 = requests.get(f"{BASE}/api/v1/wallet/me", headers=h, timeout=15).json()
        assert _get_credits(r0) == 50

        # Aadhaar
        r1 = requests.post(f"{BASE}/api/v1/kyc/aadhaar/verify",
                           json={"aadhaar_number": "111122223333", "doc_url": "/uploads/a.jpg"},
                           headers=h, timeout=15)
        assert r1.status_code == 200, r1.text

        s1 = requests.get(f"{BASE}/api/v1/kyc/trust-plus/me", headers=h, timeout=15).json()
        assert s1["bonus_awarded"] is False

        # PAN
        r2 = requests.post(f"{BASE}/api/v1/kyc/pan/verify",
                           json={"pan_number": "ABCDE1234F", "doc_url": "/uploads/p.jpg"},
                           headers=h, timeout=15)
        assert r2.status_code == 200, r2.text

        s2 = requests.get(f"{BASE}/api/v1/kyc/trust-plus/me", headers=h, timeout=15).json()
        assert s2["is_trusted_plus"] is True
        assert s2["bonus_awarded"] is True

        r_bal = requests.get(f"{BASE}/api/v1/wallet/me", headers=h, timeout=15).json()
        assert _get_credits(r_bal) == 150, r_bal

        # Exactly 1 trust_plus_bonus tx
        tx = db.wallet_transactions.count_documents({"user_id": user_id, "reason": "trust_plus_bonus"})
        assert tx == 1, f"expected 1, got {tx}"

        # Regression 2: 3rd doc → no additional credit
        r3 = requests.post(f"{BASE}/api/v1/kyc/gst/verify",
                           json={"gst_number": "27ABCDE1234F1Z5", "doc_url": "/uploads/g.jpg"},
                           headers=h, timeout=15)
        assert r3.status_code == 200, r3.text
        r_bal2 = requests.get(f"{BASE}/api/v1/wallet/me", headers=h, timeout=15).json()
        assert _get_credits(r_bal2) == 150, r_bal2
        tx2 = db.wallet_transactions.count_documents({"user_id": user_id, "reason": "trust_plus_bonus"})
        assert tx2 == 1, f"expected 1 after 3rd doc, got {tx2}"


# ============================================================ REGRESSION 3: E2E health
class TestRegressionE2E:
    def test_health(self):
        r = requests.get(f"{BASE}/api/health", timeout=15)
        assert r.status_code == 200
        assert r.json().get("status") == "ok"

    def test_openapi_ops_count(self):
        r = requests.get(f"{BASE}/api/openapi.json", timeout=15)
        assert r.status_code == 200
        spec = r.json()
        ops = sum(1 for _p, methods in spec["paths"].items() for _m in methods)
        assert ops == 176, f"Expected 176 ops, got {ops}"

    def test_admin_login_and_dashboard(self):
        tok, _u = _login(ADMIN_PHONE, name="Admin")
        h = {"Authorization": f"Bearer {tok}"}
        r = requests.get(f"{BASE}/api/v1/kyc/trust-plus/me", headers=h, timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert j["is_trusted_plus"] is True


# ============================================================ SECURITY: admin-only 403
class TestSecurityAdminOnly:
    @pytest.fixture(scope="class")
    def user_headers(self):
        tok, _u = _login(_rand_phone("7"), name="NonAdmin", extra_roles=["customer"])
        return {"Authorization": f"Bearer {tok}"}

    def test_non_admin_set_global_rate_403(self, user_headers):
        r = requests.post(f"{BASE}/api/v1/admin/commissions/rate/global",
                          json={"rate": 0.06}, headers=user_headers, timeout=15)
        assert r.status_code == 403, r.text

    def test_non_admin_audit_log_403(self, user_headers):
        r = requests.get(f"{BASE}/api/v1/admin/audit-log", headers=user_headers, timeout=15)
        assert r.status_code == 403, r.text

    def test_non_admin_all_admin_plus_endpoints_403(self, user_headers):
        # 9 admin_plus endpoints
        paths_gets = [
            "/admin/transactions",
            "/admin/transactions.csv",
            "/admin/orders",
            "/admin/commissions",
            "/admin/commissions/summary",
            "/admin/audit-log",
        ]
        for p in paths_gets:
            r = requests.get(f"{BASE}/api/v1{p}", headers=user_headers, timeout=15)
            assert r.status_code == 403, f"{p} → {r.status_code}"

        # POST endpoints
        r = requests.post(f"{BASE}/api/v1/admin/commissions/rate/category",
                          json={"category_id": "x", "rate": 0.1},
                          headers=user_headers, timeout=15)
        assert r.status_code == 403, r.text

        r = requests.post(f"{BASE}/api/v1/admin/commissions/foo/mark-paid",
                          headers=user_headers, timeout=15)
        assert r.status_code == 403, r.text
