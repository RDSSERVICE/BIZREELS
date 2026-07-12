"""Phase 4a hardening tests — validates the 8 must-fix items:
  1. is_subscribed_verified + verified_badge on /users/me
  2. Public GET /users/:id
  3. Listing reviews notify listing owner
  4. Trust score breakdown includes subs + verified_purchase_count + listing-review-aware avg_rating
  5. Signup +50 bonus credits
  6. Duplicate subscribe = extend expires_at (no 409)
  7. Subscribe response ultimately exposes subscription.id (via simulate-success)
  8. Admin KYC reject accepts JSON body AND query param `?reason=`
"""
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
    # 10-digit starting 6-9, with a distinctive prefix
    return f"{prefix}{_RUN}{int(time.time_ns()) % 10000:04d}"[:10].ljust(10, "0")


def _login(phone, name, roles=None):
    r = requests.post(f"{API}/auth/otp/send", json={"phone": phone}, timeout=15)
    assert r.status_code == 200, f"otp/send {r.status_code} {r.text}"
    otp = r.json().get("dev_otp")
    assert otp
    payload = {"phone": phone, "otp": otp, "name": name}
    if roles:
        payload["roles"] = roles
    r2 = requests.post(f"{API}/auth/otp/verify", json=payload, timeout=15)
    assert r2.status_code == 200, r2.text
    j = r2.json()
    return j["access_token"], (j.get("user") or {}).get("id")


def _me(tok):
    r = requests.get(f"{API}/users/me", headers=_auth(tok), timeout=10)
    assert r.status_code == 200, r.text
    return r.json()["user"]


@pytest.fixture(scope="module")
def fresh_user():
    phone = _fresh_phone("9866")
    tok, uid = _login(phone, "TEST_Fresh_Hardening")
    return {"tok": tok, "id": uid, "phone": phone}


@pytest.fixture(scope="module")
def vendor_user():
    phone = _fresh_phone("9877")
    tok, uid = _login(phone, "TEST_Vendor_Hardening", ["customer", "vendor"])
    return {"tok": tok, "id": uid, "phone": phone}


@pytest.fixture(scope="module")
def admin_user():
    tok, uid = _login(ADMIN_PHONE, "Admin")
    return {"tok": tok, "id": uid}


# ============ Fix 5: Signup +50 credits ============
class TestSignupBonus:
    def test_new_user_wallet_has_50_credits(self, fresh_user):
        r = requests.get(f"{API}/wallet/me", headers=_auth(fresh_user["tok"]), timeout=10)
        assert r.status_code == 200, r.text
        w = r.json()["wallet"]
        assert w["credits"] >= 50, f"expected >=50 signup credits, got {w['credits']}"
        # Check the txn is present with signup ref_type
        r2 = requests.get(f"{API}/wallet/me/transactions", headers=_auth(fresh_user["tok"]), timeout=10)
        items = r2.json()["items"]
        assert any(t.get("ref_type") == "signup" and t.get("amount") == 50 for t in items), \
            f"no signup +50 credit txn found: {items}"


# ============ Fix 1: /users/me exposes is_subscribed_verified + verified_badge ============
class TestUsersMeFields:
    def test_me_has_new_fields(self, fresh_user):
        me = _me(fresh_user["tok"])
        for key in ("is_subscribed_verified", "verified_badge", "rating_avg", "rating_count", "trust_score"):
            assert key in me, f"/users/me missing key '{key}': {me.keys()}"
        assert me["is_subscribed_verified"] is False
        assert me["verified_badge"] is False


# ============ Fix 2: Public GET /users/:id ============
class TestPublicUserEndpoint:
    def test_public_profile_returns_safe_fields(self, vendor_user):
        # No auth needed
        r = requests.get(f"{API}/users/{vendor_user['id']}", timeout=10)
        assert r.status_code == 200, r.text
        j = r.json()
        for k in ("id", "name", "roles", "profile_pic", "kyc_status",
                  "is_subscribed_verified", "verified_badge",
                  "rating_avg", "rating_count", "followers_count",
                  "trust_score_tier", "created_at"):
            assert k in j, f"missing '{k}' in public profile: {j.keys()}"
        # PII must NOT leak
        for k in ("phone", "email", "dob", "gender"):
            assert k not in j, f"PII '{k}' leaked in public profile: {j}"

    def test_public_profile_404_for_bad_id(self):
        r = requests.get(f"{API}/users/000000000000000000000000", timeout=10)
        assert r.status_code == 404

    def test_public_profile_400_for_invalid_id(self):
        r = requests.get(f"{API}/users/not-an-oid", timeout=10)
        assert r.status_code == 400


# ============ Fix 6 + 7: Subscribe -> extend on duplicate, subscription.id ============
class TestSubscribeExtend:
    def test_first_subscribe_activates(self, vendor_user):
        r = requests.post(f"{API}/subscriptions/subscribe", headers=_auth(vendor_user["tok"]),
                          json={"plan": "verified_monthly"}, timeout=10)
        assert r.status_code == 200
        pid = r.json()["payment_id"]
        r2 = requests.post(f"{API}/payments/dev/simulate-success?payment_id={pid}",
                           headers=_auth(vendor_user["tok"]), timeout=10)
        assert r2.status_code == 200, r2.text
        # Fix 7: response should include subscription with id
        j = r2.json()
        assert "subscription" in j, f"simulate-success missing subscription: {j.keys()}"
        assert j["subscription"].get("id"), f"subscription.id missing: {j['subscription']}"
        assert j["subscription"]["status"] == "active"

    def test_users_me_reflects_subscription(self, vendor_user):
        me = _me(vendor_user["tok"])
        assert me["is_subscribed_verified"] is True
        # verified_badge is only true when kyc is approved too
        assert me["verified_badge"] is False  # no KYC yet

    def test_duplicate_subscribe_extends_no_409(self, vendor_user):
        # Snapshot expires_at
        r_before = requests.get(f"{API}/subscriptions/me", headers=_auth(vendor_user["tok"]), timeout=10)
        subs_before = r_before.json()["items"]
        active_before = next((s for s in subs_before if s["status"] == "active" and s["plan"] == "verified_monthly"), None)
        assert active_before, "expected an active verified_monthly sub"
        expiry_before = active_before["expires_at"]

        # Subscribe again to same plan
        r = requests.post(f"{API}/subscriptions/subscribe", headers=_auth(vendor_user["tok"]),
                          json={"plan": "verified_monthly"}, timeout=10)
        assert r.status_code == 200, r.text
        pid = r.json()["payment_id"]

        r2 = requests.post(f"{API}/payments/dev/simulate-success?payment_id={pid}",
                           headers=_auth(vendor_user["tok"]), timeout=10)
        assert r2.status_code == 200, r2.text
        # Should have subscription in response (same id as before — extended)
        j = r2.json()
        assert "subscription" in j
        assert j["subscription"]["id"] == active_before["id"], \
            f"expected same sub id (extend), got new one. before={active_before['id']} after={j['subscription']['id']}"
        expiry_after = j["subscription"]["expires_at"]
        assert expiry_after > expiry_before, f"expiry should extend: {expiry_before} -> {expiry_after}"

        # my subs still has 1 active sub of that plan (no duplicate row)
        r3 = requests.get(f"{API}/subscriptions/me", headers=_auth(vendor_user["tok"]), timeout=10)
        actives = [s for s in r3.json()["items"] if s["status"] == "active" and s["plan"] == "verified_monthly"]
        assert len(actives) == 1, f"expected exactly 1 active verified_monthly sub, got {len(actives)}"


# ============ Fix 3: Listing reviews notify listing owner ============
class TestListingReviewNotify:
    listing_id = None
    deal_id = None

    def test_setup_and_verified_listing_review(self, fresh_user, vendor_user):
        # Create a category-based listing owned by vendor_user
        rc = requests.get(f"{API}/categories/", timeout=10)
        cats = rc.json()
        cats_list = cats.get("items") if isinstance(cats, dict) else cats
        cat_id = cats_list[0]["id"]
        body = {
            "type": "new_product", "title": f"TEST_Notify_{_RUN}",
            "description": "hardening test", "category_id": cat_id, "price": 199.0,
            "stock": 10, "images": [],
            "location": {"area": "Indiranagar", "city": "Bengaluru", "pincode": "560038"},
        }
        r = requests.post(f"{API}/listings/?become_vendor=true",
                          headers=_auth(vendor_user["tok"]), json=body, timeout=15)
        assert r.status_code == 200, r.text
        TestListingReviewNotify.listing_id = r.json()["id"]

        # buyer(fresh_user) creates thread + deal, both accept, both complete
        r2 = requests.post(f"{API}/chat/threads", headers=_auth(fresh_user["tok"]), json={
            "peer_user_id": vendor_user["id"], "context_type": "listing",
            "context_id": TestListingReviewNotify.listing_id,
        }, timeout=10)
        assert r2.status_code == 200
        thread_id = r2.json()["id"]

        r3 = requests.post(f"{API}/deals/", headers=_auth(fresh_user["tok"]), json={
            "thread_id": thread_id, "listing_id": TestListingReviewNotify.listing_id,
            "initial_offer": 150.0,
        }, timeout=10)
        assert r3.status_code == 200, r3.text
        TestListingReviewNotify.deal_id = r3.json()["id"]

        # accept + complete flow
        for tok in (fresh_user["tok"], vendor_user["tok"]):
            requests.post(f"{API}/deals/{TestListingReviewNotify.deal_id}/accept",
                          headers=_auth(tok), timeout=10)
        for tok in (fresh_user["tok"], vendor_user["tok"]):
            requests.post(f"{API}/deals/{TestListingReviewNotify.deal_id}/complete",
                          headers=_auth(tok), timeout=10)

        # Snapshot vendor unread count
        rn_before = requests.get(f"{API}/notifications/me/unread-count",
                                  headers=_auth(vendor_user["tok"]), timeout=10)
        vendor_unread_before = rn_before.json()["count"]

        # Buyer posts a listing review
        r4 = requests.post(f"{API}/reviews/", headers=_auth(fresh_user["tok"]), json={
            "target_type": "listing", "target_id": TestListingReviewNotify.listing_id,
            "rating": 5, "comment": "TEST_listing_review_notify",
            "deal_id": TestListingReviewNotify.deal_id,
        }, timeout=10)
        assert r4.status_code == 200, r4.text
        assert r4.json()["is_verified_purchase"] is True

        # Fix 3: vendor should get a NEW notification
        time.sleep(0.3)
        rn_after = requests.get(f"{API}/notifications/me/unread-count",
                                 headers=_auth(vendor_user["tok"]), timeout=10)
        vendor_unread_after = rn_after.json()["count"]
        assert vendor_unread_after > vendor_unread_before, \
            f"vendor unread should increase after listing review. {vendor_unread_before} -> {vendor_unread_after}"

        # Notification carries listing review context
        rn_list = requests.get(f"{API}/notifications/me?is_read=false",
                                headers=_auth(vendor_user["tok"]), timeout=10)
        items = rn_list.json().get("items", [])
        assert any("listing" in (n.get("title") or "").lower() or "review" in (n.get("title") or "").lower()
                   for n in items), f"no listing-review notif found in {items}"


# ============ Fix 4: Trust score breakdown has subs + verified_purchase_count + listing reviews ============
class TestTrustScoreBreakdown:
    def test_breakdown_has_new_keys(self, vendor_user):
        r = requests.get(f"{API}/users/{vendor_user['id']}/trust-score", timeout=10)
        assert r.status_code == 200
        j = r.json()
        bd = j["breakdown"]
        for k in ("subs_pts", "is_subscribed_verified", "verified_purchase_count", "total_reviews"):
            assert k in bd, f"trust breakdown missing '{k}': {bd.keys()}"
        # Vendor is subscribed so subs_pts should be 5
        assert bd["is_subscribed_verified"] is True
        assert bd["subs_pts"] == 5

    def test_listing_review_included_in_avg_rating(self, vendor_user):
        r = requests.get(f"{API}/users/{vendor_user['id']}/trust-score", timeout=10)
        j = r.json()
        # There should be at least 1 listing review from the previous test class
        assert j["breakdown"]["total_reviews"] >= 1
        assert j["breakdown"]["verified_purchase_count"] >= 1


# ============ Fix 8: Admin KYC reject accepts both JSON body and query param ============
class TestKycRejectBackwardCompat:
    def test_reject_via_query_param(self, admin_user, fresh_user):
        # Submit KYC as fresh_user
        r = requests.post(f"{API}/kyc/me/submit", headers=_auth(fresh_user["tok"]), json={
            "doc_type": "pan", "doc_number": f"TESTPAN{_RUN}",
            "doc_url": "/uploads/pan.jpg", "selfie_url": "/uploads/selfie.jpg",
        }, timeout=10)
        assert r.status_code == 200, r.text
        kid = r.json()["id"]

        # Reject via query param (backward compat)
        r2 = requests.post(f"{API}/admin/kyc/{kid}/reject?reason=blurry+doc",
                           headers=_auth(admin_user["tok"]), timeout=10)
        assert r2.status_code == 200, r2.text
        assert r2.json()["status"] == "rejected"

    def test_reject_via_json_body(self, admin_user, fresh_user):
        # Resubmit KYC
        r = requests.post(f"{API}/kyc/me/submit", headers=_auth(fresh_user["tok"]), json={
            "doc_type": "aadhaar", "doc_number": f"XXXX{_RUN}9999",
            "doc_url": "/uploads/aad.jpg", "selfie_url": "/uploads/sf.jpg",
        }, timeout=10)
        assert r.status_code == 200, r.text
        kid = r.json()["id"]
        r2 = requests.post(f"{API}/admin/kyc/{kid}/reject",
                           headers=_auth(admin_user["tok"]), json={"reason": "info mismatch"},
                           timeout=10)
        assert r2.status_code == 200, r2.text
        assert r2.json()["status"] == "rejected"
