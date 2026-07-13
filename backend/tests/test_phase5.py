"""Phase 5 tests — Vendor Analytics, Boost & Bump nudge, Response-time tracking,
Onboarding checklist, Referral system, WhatsApp tracking, Trust score wiring.
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


def _login(phone, name, roles=None, referral_code=None):
    r = requests.post(f"{API}/auth/otp/send", json={"phone": phone}, timeout=15)
    assert r.status_code == 200, r.text
    otp = r.json().get("dev_otp") or _admin_otp_from_logs(phone)
    payload = {"phone": phone, "otp": otp, "name": name}
    if roles:
        payload["roles"] = roles
    if referral_code:
        payload["referral_code"] = referral_code
    r2 = requests.post(f"{API}/auth/otp/verify", json=payload, timeout=15)
    assert r2.status_code == 200, r2.text
    j = r2.json()
    return j["access_token"], (j.get("user") or {}).get("id")


def _create_listing(vendor_tok, title, price=999.0):
    rc = requests.get(f"{API}/categories/", timeout=10)
    cats = rc.json()
    cats_list = cats.get("items") if isinstance(cats, dict) else cats
    cat_id = cats_list[0]["id"]
    body = {
        "type": "new_product", "title": title, "description": "phase5 test",
        "category_id": cat_id, "price": price, "stock": 5, "images": [],
        "location": {"area": "Indiranagar", "city": "Bengaluru", "pincode": "560038"},
    }
    r = requests.post(f"{API}/listings/?become_vendor=true", headers=_auth(vendor_tok), json=body, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()


# ============ REFERRAL SYSTEM ============
class TestReferral:
    referrer_code = None
    referrer_id = None
    referrer_tok = None
    referred_id = None
    referred_tok = None

    def test_referral_code_generated_on_signup(self):
        phone = _fresh_phone("9788")
        tok, uid = _login(phone, f"TEST_Referrer_{_RUN}")
        r = requests.get(f"{API}/users/me", headers=_auth(tok), timeout=10)
        me = r.json()["user"]
        assert me.get("referral_code"), f"referral_code missing on /users/me: {me}"
        TestReferral.referrer_code = me["referral_code"]
        TestReferral.referrer_id = uid
        TestReferral.referrer_tok = tok

    def test_referral_summary_empty_initially(self):
        r = requests.get(f"{API}/users/me/referrals/", headers=_auth(TestReferral.referrer_tok), timeout=10)
        assert r.status_code == 200
        j = r.json()
        assert j["referral_code"] == TestReferral.referrer_code
        assert j["summary"]["total"] == 0

    def test_referred_user_signup_with_code(self):
        phone = _fresh_phone("9789")
        # Signup with referral code
        tok, uid = _login(phone, f"TEST_Referred_{_RUN}", ["customer", "vendor"], referral_code=TestReferral.referrer_code)
        TestReferral.referred_tok = tok
        TestReferral.referred_id = uid
        # Referrer summary should now show pending=1
        r = requests.get(f"{API}/users/me/referrals/", headers=_auth(TestReferral.referrer_tok), timeout=10)
        s = r.json()["summary"]
        assert s["pending"] == 1, f"expected 1 pending referral, got {s}"

    def test_referral_credits_on_first_listing(self):
        # Snapshot referrer wallet
        r0 = requests.get(f"{API}/wallet/me", headers=_auth(TestReferral.referrer_tok), timeout=10)
        before_referrer = r0.json()["wallet"]["credits"]
        r0b = requests.get(f"{API}/wallet/me", headers=_auth(TestReferral.referred_tok), timeout=10)
        before_referred = r0b.json()["wallet"]["credits"]

        # Referred posts first listing
        _create_listing(TestReferral.referred_tok, f"TEST_Ref_Trigger_{_RUN}")
        time.sleep(0.5)  # async

        # Both wallets should have grown
        r1 = requests.get(f"{API}/wallet/me", headers=_auth(TestReferral.referrer_tok), timeout=10)
        after_referrer = r1.json()["wallet"]["credits"]
        r1b = requests.get(f"{API}/wallet/me", headers=_auth(TestReferral.referred_tok), timeout=10)
        after_referred = r1b.json()["wallet"]["credits"]

        assert after_referrer >= before_referrer + 200, f"referrer: {before_referrer} → {after_referrer}"
        assert after_referred >= before_referred + 100, f"referred: {before_referred} → {after_referred}"

        # Summary shows credited=1, pending=0
        r2 = requests.get(f"{API}/users/me/referrals/", headers=_auth(TestReferral.referrer_tok), timeout=10)
        s = r2.json()["summary"]
        assert s["credited"] == 1
        assert s["pending"] == 0
        assert s["credits_earned"] == 200


# ============ VENDOR ANALYTICS ============
class TestVendorAnalytics:
    vendor_tok = None
    vendor_id = None
    listing_id = None
    listing_slug = None
    buyer_tok = None

    def test_setup(self):
        vphone = _fresh_phone("9855")
        vtok, vid = _login(vphone, f"TEST_Analyt_V_{_RUN}", ["customer", "vendor"])
        bphone = _fresh_phone("9846")
        btok, _ = _login(bphone, f"TEST_Analyt_B_{_RUN}")
        li = _create_listing(vtok, f"TEST_Analytics_{_RUN}", price=333.0)
        TestVendorAnalytics.vendor_tok = vtok
        TestVendorAnalytics.vendor_id = vid
        TestVendorAnalytics.listing_id = li["id"]
        TestVendorAnalytics.listing_slug = li["slug"]
        TestVendorAnalytics.buyer_tok = btok

    def test_view_event_emitted(self):
        # Hit the listing detail — increments views + emits event
        r = requests.get(f"{API}/listings/{TestVendorAnalytics.listing_slug}", timeout=10)
        assert r.status_code == 200
        # 2 more views
        requests.get(f"{API}/listings/{TestVendorAnalytics.listing_slug}", timeout=10)
        requests.get(f"{API}/listings/{TestVendorAnalytics.listing_slug}", timeout=10)
        time.sleep(0.4)
        # Analytics overview should reflect
        r2 = requests.get(f"{API}/vendor/analytics/overview?range=30d",
                          headers=_auth(TestVendorAnalytics.vendor_tok), timeout=10)
        assert r2.status_code == 200, r2.text
        j = r2.json()
        assert j["kpis"]["views"] >= 3, f"views not tracked: {j['kpis']}"
        assert j["kpis"]["listings_total"] >= 1

    def test_chat_start_and_wa_click_events(self):
        # Buyer starts a chat thread on the listing
        r = requests.post(f"{API}/chat/threads", headers=_auth(TestVendorAnalytics.buyer_tok), json={
            "peer_user_id": TestVendorAnalytics.vendor_id, "context_type": "listing",
            "context_id": TestVendorAnalytics.listing_id,
        }, timeout=10)
        assert r.status_code == 200, r.text
        # Track a wa_click (anon path)
        r2 = requests.post(f"{API}/listings/{TestVendorAnalytics.listing_id}/track",
                           json={"event": "wa_click"}, timeout=10)
        assert r2.status_code == 200
        # Track a share via authed user
        r3 = requests.post(f"{API}/listings/{TestVendorAnalytics.listing_id}/track",
                           headers=_auth(TestVendorAnalytics.buyer_tok),
                           json={"event": "share"}, timeout=10)
        assert r3.status_code == 200
        time.sleep(0.4)

        ov = requests.get(f"{API}/vendor/analytics/overview?range=30d",
                          headers=_auth(TestVendorAnalytics.vendor_tok), timeout=10).json()
        assert ov["kpis"]["chats_started"] >= 1
        assert ov["kpis"]["unique_chatters"] >= 1
        assert ov["kpis"]["wa_clicks"] >= 1
        assert ov["kpis"]["shares"] >= 1

    def test_per_listing(self):
        r = requests.get(f"{API}/vendor/analytics/listings?range=30d&sort=views&limit=5",
                         headers=_auth(TestVendorAnalytics.vendor_tok), timeout=10)
        assert r.status_code == 200
        items = r.json()["items"]
        assert any(x["listing_id"] == TestVendorAnalytics.listing_id and x["views"] >= 3 for x in items), items

    def test_timeseries(self):
        r = requests.get(f"{API}/vendor/analytics/timeseries?range=7d&metric=views",
                         headers=_auth(TestVendorAnalytics.vendor_tok), timeout=10)
        assert r.status_code == 200
        j = r.json()
        assert j["metric"] == "views"
        # 7 days = 8 buckets (inclusive of today)
        assert len(j["items"]) >= 7

    def test_conversion_math(self):
        ov = requests.get(f"{API}/vendor/analytics/overview?range=30d",
                          headers=_auth(TestVendorAnalytics.vendor_tok), timeout=10).json()
        v = ov["kpis"]["views"]; c = ov["kpis"]["chats_started"]
        if v > 0:
            assert ov["conversion"]["view_to_chat_pct"] == round(c / v * 100, 1)

    def test_non_vendor_blocked(self):
        r = requests.get(f"{API}/vendor/analytics/overview",
                         headers=_auth(TestVendorAnalytics.buyer_tok), timeout=10)
        assert r.status_code == 403


# ============ RESPONSE TIME TRACKING ============
class TestResponseTime:
    def test_first_reply_updates_stats(self):
        vphone = _fresh_phone("9788")
        vtok, vid = _login(vphone, f"TEST_RT_V_{_RUN}", ["customer", "vendor"])
        bphone = _fresh_phone("9866")
        btok, bid = _login(bphone, f"TEST_RT_B_{_RUN}")
        li = _create_listing(vtok, f"TEST_RT_{_RUN}")

        # Buyer creates a thread + sends a message
        r = requests.post(f"{API}/chat/threads", headers=_auth(btok), json={
            "peer_user_id": vid, "context_type": "listing", "context_id": li["id"],
        }, timeout=10)
        thread_id = r.json()["id"]
        r2 = requests.post(f"{API}/chat/threads/{thread_id}/messages", headers=_auth(btok),
                           json={"type": "text", "text": "Hi, is this available?"}, timeout=10)
        assert r2.status_code == 200

        # Vendor snapshot BEFORE first reply
        r_pre = requests.get(f"{API}/users/me", headers=_auth(vtok), timeout=10)
        me_pre = r_pre.json()["user"]
        assert me_pre.get("total_conversations_responded", 0) == 0 or me_pre.get("total_conversations_responded") is None or me_pre.get("chat_response_rate") == 0.0

        # Vendor replies (first reply)
        r3 = requests.post(f"{API}/chat/threads/{thread_id}/messages", headers=_auth(vtok),
                           json={"type": "text", "text": "Yes it is available"}, timeout=10)
        assert r3.status_code == 200
        time.sleep(0.6)

        # Vendor stats should now include a response
        r_post = requests.get(f"{API}/users/me", headers=_auth(vtok), timeout=10)
        me = r_post.json()["user"]
        assert me.get("chat_response_rate", 0.0) > 0.0, f"response_rate should update: {me}"
        assert me.get("avg_response_time_seconds") is not None

        # Trust score should reflect subs_pts / chat_pts breakdown includes this rate
        r_ts = requests.get(f"{API}/users/{vid}/trust-score", timeout=10)
        assert r_ts.status_code == 200
        bd = r_ts.json()["breakdown"]
        assert bd["chat_response_rate"] > 0.0

    def test_public_vendor_shows_response_time(self):
        vphone = _fresh_phone("9799")
        vtok, vid = _login(vphone, f"TEST_RT_Pub_{_RUN}", ["customer", "vendor"])
        li = _create_listing(vtok, f"TEST_RT_Pub_{_RUN}")
        bphone = _fresh_phone("9877")
        btok, _ = _login(bphone, f"TEST_RT_Pub_B_{_RUN}")

        r = requests.post(f"{API}/chat/threads", headers=_auth(btok), json={
            "peer_user_id": vid, "context_type": "listing", "context_id": li["id"],
        }, timeout=10)
        thread_id = r.json()["id"]
        requests.post(f"{API}/chat/threads/{thread_id}/messages", headers=_auth(btok),
                      json={"type": "text", "text": "hello"}, timeout=10)
        requests.post(f"{API}/chat/threads/{thread_id}/messages", headers=_auth(vtok),
                      json={"type": "text", "text": "hi"}, timeout=10)
        time.sleep(0.6)

        r2 = requests.get(f"{API}/vendors/{vid}", timeout=10)
        assert r2.status_code == 200
        v = r2.json()
        assert "avg_response_time_seconds" in v
        assert v["avg_response_time_seconds"] is not None


# ============ ONBOARDING CHECKLIST ============
class TestOnboarding:
    def test_initial_state_zero(self):
        phone = _fresh_phone("9822")
        tok, uid = _login(phone, f"TEST_OB_{_RUN}")
        r = requests.get(f"{API}/users/me/onboarding-checklist", headers=_auth(tok), timeout=10)
        assert r.status_code == 200
        j = r.json()
        assert j["completed"] == 0
        assert j["total"] == 5
        assert j["all_done"] is False
        assert j["reward_granted"] is False
        assert j["reward_credits"] == 30

    def test_partial_progress(self):
        phone = _fresh_phone("9833")
        tok, uid = _login(phone, f"TEST_OB_Partial_{_RUN}", ["customer", "vendor"])
        # Set profile pic + city + create listing → 3/5
        requests.patch(f"{API}/users/me", headers=_auth(tok), json={
            "profile_pic": "/uploads/pic.jpg", "city": "Bengaluru",
        }, timeout=10)
        _create_listing(tok, f"TEST_OB_L_{_RUN}")
        r = requests.get(f"{API}/users/me/onboarding-checklist", headers=_auth(tok), timeout=10)
        j = r.json()
        assert j["completed"] == 3, f"expected 3/5, got {j}"
        assert j["reward_granted"] is False
        # Check specific steps
        done_keys = {s["key"] for s in j["steps"] if s["done"]}
        assert "profile_pic" in done_keys and "city" in done_keys and "listing" in done_keys


# ============ BOOST NUDGE ============
class TestNudge:
    def test_nudge_scan_no_error(self):
        """Runs the nudge scan directly. Skipped when the test process doesn't have
        backend env (MONGO_URL) — the scan still runs at server startup daily loop."""
        import os
        if not os.environ.get("MONGO_URL"):
            pytest.skip("MONGO_URL not set in test env — nudge loop runs in server process")
        import sys
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
        from services import nudge_service
        import asyncio
        result = asyncio.new_event_loop().run_until_complete(nudge_service.nudge_once())
        assert isinstance(result, int)


# ============ REGRESSION ============
class TestRegression:
    def test_health(self):
        assert requests.get(f"{BASE}/api/health", timeout=10).status_code == 200

    def test_users_me_all_phase_keys(self):
        phone = _fresh_phone("9755")
        tok, _ = _login(phone, f"TEST_Reg_{_RUN}")
        me = requests.get(f"{API}/users/me", headers=_auth(tok), timeout=10).json()["user"]
        for k in ("is_subscribed_verified", "verified_badge", "rating_avg", "trust_score",
                  "referral_code", "avg_response_time_seconds", "chat_response_rate"):
            assert k in me, f"missing {k} on /users/me"
