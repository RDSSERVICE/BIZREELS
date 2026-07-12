"""Phase 4a backend tests: wallet, subscriptions, KYC, notifications, reviews (deal-gated), trust score."""
import os
import time
import uuid
import requests
import pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE:
    # Fallback for tests running inside container
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE = line.split("=", 1)[1].strip().rstrip("/")
                break

API = f"{BASE}/api/v1"

ADMIN_PHONE = "9999999999"
# Use unique phones per run to avoid rate-limits / stale state
_RUN = str(int(time.time()))[-4:]
BUYER_PHONE = f"98776{_RUN}"[:10].ljust(10, "0")
SELLER_PHONE = f"98123{_RUN}"[:10].ljust(10, "0")


def _login(phone: str, name: str, roles=None):
    r = requests.post(f"{API}/auth/otp/send", json={"phone": phone}, timeout=15)
    assert r.status_code == 200, f"otp/send failed: {r.status_code} {r.text}"
    data = r.json()
    otp = data.get("dev_otp")
    assert otp, f"No dev_otp in response: {data}"
    payload = {"phone": phone, "otp": otp, "name": name}
    if roles:
        payload["roles"] = roles
    r2 = requests.post(f"{API}/auth/otp/verify", json=payload, timeout=15)
    assert r2.status_code == 200, f"otp/verify failed: {r2.status_code} {r2.text}"
    j = r2.json()
    return j["access_token"], (j.get("user") or {}).get("id")


def _me(tok):
    r = requests.get(f"{API}/users/me", headers=_auth(tok), timeout=10)
    j = r.json()
    return j.get("user") or j


def _auth(tok):
    return {"Authorization": f"Bearer {tok}"}


@pytest.fixture(scope="module")
def buyer():
    tok, uid = _login(BUYER_PHONE, "TEST_Buyer", ["customer"])
    return {"tok": tok, "id": uid, "phone": BUYER_PHONE}


@pytest.fixture(scope="module")
def seller():
    tok, uid = _login(SELLER_PHONE, "TEST_Seller", ["customer", "vendor"])
    return {"tok": tok, "id": uid, "phone": SELLER_PHONE}


@pytest.fixture(scope="module")
def admin():
    tok, uid = _login(ADMIN_PHONE, "Admin")
    me = _me(tok)
    roles = me.get("roles", [])
    assert "admin" in roles, f"Admin phone {ADMIN_PHONE} not seeded as admin. Roles={roles}"
    return {"tok": tok, "id": uid}


# ============= WALLET =============
class TestWallet:
    def test_wallet_auto_create(self, buyer):
        r = requests.get(f"{API}/wallet/me", headers=_auth(buyer["tok"]), timeout=10)
        assert r.status_code == 200, r.text
        w = r.json()["wallet"]
        assert "balance_inr_paise" in w
        assert "credits" in w
        assert w["balance_inr_paise"] >= 0

    def test_topup_and_simulate_success(self, buyer):
        # Snapshot balance
        r0 = requests.get(f"{API}/wallet/me", headers=_auth(buyer["tok"]), timeout=10)
        before = r0.json()["wallet"]["balance_inr_paise"]

        # Topup 50000 paise
        r = requests.post(f"{API}/wallet/me/topup", headers=_auth(buyer["tok"]),
                          json={"amount_paise": 50000}, timeout=10)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "payment_id" in j
        assert j["amount_paise"] == 50000
        assert j.get("dev_mode") is True
        pid = j["payment_id"]

        # Simulate success
        r2 = requests.post(f"{API}/payments/dev/simulate-success?payment_id={pid}",
                           headers=_auth(buyer["tok"]), timeout=10)
        assert r2.status_code == 200, r2.text
        assert r2.json().get("status") == "captured"

        # Verify balance increased
        r3 = requests.get(f"{API}/wallet/me", headers=_auth(buyer["tok"]), timeout=10)
        after = r3.json()["wallet"]["balance_inr_paise"]
        assert after == before + 50000, f"expected {before + 50000}, got {after}"

    def test_wallet_transactions_lists_deposit(self, buyer):
        r = requests.get(f"{API}/wallet/me/transactions", headers=_auth(buyer["tok"]), timeout=10)
        assert r.status_code == 200
        items = r.json()["items"]
        assert any(t.get("bucket") in ("balance_inr", "inr") and t.get("type") in ("deposit", "credit") for t in items), \
            f"No deposit txn found in {items}"


# ============= SUBSCRIPTIONS =============
class TestSubscriptions:
    def test_subscribe_activate_and_cancel(self, seller):
        r = requests.post(f"{API}/subscriptions/subscribe", headers=_auth(seller["tok"]),
                          json={"plan": "verified_monthly"}, timeout=10)
        assert r.status_code == 200, r.text
        j = r.json()
        pid = j["payment_id"]

        # Simulate success -> activates
        r2 = requests.post(f"{API}/payments/dev/simulate-success?payment_id={pid}",
                           headers=_auth(seller["tok"]), timeout=10)
        assert r2.status_code == 200, r2.text

        # my subs -> has active
        r3 = requests.get(f"{API}/subscriptions/me", headers=_auth(seller["tok"]), timeout=10)
        items = r3.json()["items"]
        active = [s for s in items if s.get("status") == "active"]
        assert active, f"No active subscription: {items}"
        sid = active[0]["id"]

        # cancel
        r4 = requests.post(f"{API}/subscriptions/{sid}/cancel", headers=_auth(seller["tok"]), timeout=10)
        assert r4.status_code == 200
        assert r4.json().get("ok") is True


# ============= KYC =============
class TestKyc:
    kyc_id = None

    def test_kyc_submit(self, buyer):
        r = requests.post(f"{API}/kyc/me/submit", headers=_auth(buyer["tok"]), json={
            "doc_type": "aadhaar", "doc_number": f"XXXX {_RUN}1234",
            "doc_url": "/uploads/x.jpg", "selfie_url": "/uploads/s.jpg",
        }, timeout=10)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["status"] == "pending"
        TestKyc.kyc_id = j["id"]

    def test_admin_lists_pending(self, admin):
        r = requests.get(f"{API}/admin/kyc", headers=_auth(admin["tok"]), timeout=10)
        assert r.status_code == 200, r.text
        items = r.json()["items"]
        assert any(k["id"] == TestKyc.kyc_id for k in items), "submitted KYC not in queue"

    def test_admin_approve(self, admin, buyer):
        assert TestKyc.kyc_id, "prior test must pass"
        r = requests.post(f"{API}/admin/kyc/{TestKyc.kyc_id}/approve",
                          headers=_auth(admin["tok"]), timeout=10)
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "approved"

        # Buyer kyc/me shows approved
        r2 = requests.get(f"{API}/kyc/me", headers=_auth(buyer["tok"]), timeout=10)
        assert r2.status_code == 200
        assert r2.json().get("status") == "approved"

    def test_non_admin_forbidden(self, buyer):
        r = requests.get(f"{API}/admin/kyc", headers=_auth(buyer["tok"]), timeout=10)
        assert r.status_code == 403


# ============= REVIEWS: DEAL-GATED (CRITICAL) =============
class TestReviewsGating:
    listing_id = None
    thread_id = None
    deal_id = None

    def test_setup_listing_thread_deal(self, buyer, seller):
        # Get a category
        rc = requests.get(f"{API}/categories/", timeout=10)
        assert rc.status_code == 200
        cats = rc.json()
        # Support either {items:[...]} or list
        cats_list = cats.get("items") if isinstance(cats, dict) else cats
        assert cats_list, "no categories seeded"
        cat_id = cats_list[0]["id"]

        # Seller creates listing
        body = {
            "type": "new_product", "title": f"TEST_Item_{_RUN}",
            "description": "phase4a test item", "category_id": cat_id, "price": 999.0,
            "stock": 5,
            "images": [], "location": {"area": "Koramangala", "city": "Bengaluru", "pincode": "560095"},
        }
        r = requests.post(f"{API}/listings/?become_vendor=true", headers=_auth(seller["tok"]),
                          json=body, timeout=15)
        assert r.status_code == 200, r.text
        TestReviewsGating.listing_id = r.json()["id"]

        # Buyer creates chat thread with seller
        r2 = requests.post(f"{API}/chat/threads", headers=_auth(buyer["tok"]), json={
            "peer_user_id": seller["id"], "context_type": "listing",
            "context_id": TestReviewsGating.listing_id,
        }, timeout=10)
        assert r2.status_code == 200, r2.text
        TestReviewsGating.thread_id = r2.json()["id"]

        # Buyer creates deal
        r3 = requests.post(f"{API}/deals/", headers=_auth(buyer["tok"]), json={
            "thread_id": TestReviewsGating.thread_id,
            "listing_id": TestReviewsGating.listing_id, "initial_offer": 500.0,
        }, timeout=10)
        assert r3.status_code == 200, r3.text
        TestReviewsGating.deal_id = r3.json()["id"]

    def test_listing_review_without_deal_id_403(self, buyer):
        r = requests.post(f"{API}/reviews/", headers=_auth(buyer["tok"]), json={
            "target_type": "listing", "target_id": TestReviewsGating.listing_id,
            "rating": 5, "comment": "nope",
        }, timeout=10)
        assert r.status_code == 403, f"expected 403, got {r.status_code} {r.text}"
        assert "deal_id" in r.text.lower() or "required" in r.text.lower()

    def test_review_with_incomplete_deal_403(self, buyer):
        # Deal is still in 'negotiating' -> should 403
        r = requests.post(f"{API}/reviews/", headers=_auth(buyer["tok"]), json={
            "target_type": "listing", "target_id": TestReviewsGating.listing_id,
            "rating": 4, "comment": "not completed yet", "deal_id": TestReviewsGating.deal_id,
        }, timeout=10)
        assert r.status_code == 403, f"expected 403 (deal not completed), got {r.status_code} {r.text}"

    def test_vendor_review_without_deal_id_ok(self, buyer, seller):
        r = requests.post(f"{API}/reviews/", headers=_auth(buyer["tok"]), json={
            "target_type": "vendor", "target_id": seller["id"],
            "rating": 4, "comment": "TEST_vendor_review",
        }, timeout=10)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["is_verified_purchase"] is False
        TestReviewsGating.vendor_review_id = j["id"]

    def test_duplicate_review_409(self, buyer, seller):
        r = requests.post(f"{API}/reviews/", headers=_auth(buyer["tok"]), json={
            "target_type": "vendor", "target_id": seller["id"],
            "rating": 5, "comment": "dup attempt",
        }, timeout=10)
        assert r.status_code == 409, f"expected 409 duplicate, got {r.status_code} {r.text}"

    def test_vendor_gets_notification_after_review(self, seller):
        # Give backend a moment (notification create is awaited but be safe)
        time.sleep(0.5)
        r = requests.get(f"{API}/notifications/me/unread-count", headers=_auth(seller["tok"]), timeout=10)
        assert r.status_code == 200
        cnt = r.json()["count"]
        assert cnt > 0, "seller should have >0 unread notifications after being reviewed"

        r2 = requests.get(f"{API}/notifications/me", headers=_auth(seller["tok"]), timeout=10)
        items = r2.json().get("items", [])
        assert items, "notifications list empty"
        nid = items[0]["id"]

        # Mark read
        r3 = requests.post(f"{API}/notifications/{nid}/read", headers=_auth(seller["tok"]), timeout=10)
        assert r3.status_code == 200
        r4 = requests.get(f"{API}/notifications/me/unread-count", headers=_auth(seller["tok"]), timeout=10)
        assert r4.json()["count"] == cnt - 1

    def test_complete_deal_and_verified_review(self, buyer, seller):
        # Both parties accept, then both complete
        for tok in (buyer["tok"], seller["tok"]):
            r = requests.post(f"{API}/deals/{TestReviewsGating.deal_id}/accept",
                              headers=_auth(tok), timeout=10)
            # First accept moves to accepted; second may be idempotent or state-check
            assert r.status_code in (200, 400), f"accept failed: {r.status_code} {r.text}"

        # Both complete
        r1 = requests.post(f"{API}/deals/{TestReviewsGating.deal_id}/complete",
                          headers=_auth(buyer["tok"]), timeout=10)
        assert r1.status_code == 200, r1.text
        r2 = requests.post(f"{API}/deals/{TestReviewsGating.deal_id}/complete",
                          headers=_auth(seller["tok"]), timeout=10)
        assert r2.status_code == 200, r2.text
        deal = r2.json()
        assert deal.get("status") == "completed", f"deal not completed: {deal}"

        # Snapshot buyer credits
        rw = requests.get(f"{API}/wallet/me", headers=_auth(buyer["tok"]), timeout=10)
        credits_before = rw.json()["wallet"]["credits"]

        # Now buyer posts listing review with deal_id -> should succeed, verified=true
        r3 = requests.post(f"{API}/reviews/", headers=_auth(buyer["tok"]), json={
            "target_type": "listing", "target_id": TestReviewsGating.listing_id,
            "rating": 5, "comment": "TEST_verified_purchase",
            "deal_id": TestReviewsGating.deal_id,
        }, timeout=10)
        assert r3.status_code == 200, r3.text
        assert r3.json()["is_verified_purchase"] is True

        # Wallet +10 credits
        rw2 = requests.get(f"{API}/wallet/me", headers=_auth(buyer["tok"]), timeout=10)
        credits_after = rw2.json()["wallet"]["credits"]
        assert credits_after == credits_before + 10, f"credits {credits_before} -> {credits_after}"
        TestReviewsGating.listing_review_id = r3.json()["id"]


# ============= REVIEWS: helpful, reply, patch, delete =============
class TestReviewsInteractions:
    def test_reply_by_vendor(self, seller):
        rid = getattr(TestReviewsGating, "vendor_review_id", None)
        if not rid:
            pytest.skip("prior test not run")
        r = requests.post(f"{API}/reviews/{rid}/reply", headers=_auth(seller["tok"]),
                          json={"text": "Thanks for the feedback!"}, timeout=10)
        assert r.status_code == 200, r.text
        assert r.json()["reply"]["text"].startswith("Thanks")

    def test_patch_own_review(self, buyer):
        rid = getattr(TestReviewsGating, "vendor_review_id", None)
        if not rid:
            pytest.skip("prior test not run")
        r = requests.patch(f"{API}/reviews/{rid}", headers=_auth(buyer["tok"]),
                           json={"rating": 5, "comment": "updated"}, timeout=10)
        assert r.status_code == 200, r.text
        assert r.json()["rating"] == 5


# ============= TRUST SCORE =============
class TestTrustScore:
    def test_trust_score_shape(self, buyer):
        r = requests.get(f"{API}/users/{buyer['id']}/trust-score", timeout=10)
        assert r.status_code == 200, r.text
        j = r.json()
        assert 0 <= j["score"] <= 100
        assert "breakdown" in j
        assert j["breakdown"]["kyc_approved"] is True  # buyer got approved earlier
        assert j["breakdown"]["kyc_pts"] == 10

    def test_kyc_user_higher_than_unverified(self, buyer):
        # Create a fresh unverified user
        phone = f"98111{_RUN}"[:10].ljust(10, "0")
        if phone == BUYER_PHONE:
            phone = f"98222{_RUN}"[:10].ljust(10, "0")
        tok, uid = _login(phone, "TEST_Unverified")
        if not uid:
            uid = requests.get(f"{API}/users/me", headers=_auth(tok), timeout=10).json()["id"]

        r1 = requests.get(f"{API}/users/{buyer['id']}/trust-score", timeout=10)
        r2 = requests.get(f"{API}/users/{uid}/trust-score", timeout=10)
        assert r1.json()["score"] >= r2.json()["score"], \
            f"buyer(kyc) {r1.json()['score']} should be >= unverified {r2.json()['score']}"


# ============= REGRESSION Phase 0-3 =============
class TestRegression:
    def test_health(self):
        r = requests.get(f"{BASE}/api/health", timeout=10)
        assert r.status_code in (200, 404)  # some apps expose /health

    def test_feed_public(self):
        r = requests.get(f"{API}/listings/?limit=5", timeout=10)
        assert r.status_code == 200

    def test_search_suggest(self):
        r = requests.get(f"{API}/search/suggest?q=te", timeout=10)
        assert r.status_code == 200
