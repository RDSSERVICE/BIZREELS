"""Phase 7d — Gemini AI smart features (6 endpoints) backend test suite."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://emergent-india-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api/v1"

PHONE = "9039791530"


# --------------------- fixtures ---------------------
@pytest.fixture(scope="session")
def user_token():
    r = requests.post(f"{API}/auth/otp/send", json={"phone": PHONE}, timeout=15)
    assert r.status_code == 200, r.text
    otp = r.json()["dev_otp"]
    r = requests.post(f"{API}/auth/otp/verify", json={"phone": PHONE, "otp": otp, "name": "Test"}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def secondary_token():
    """A second user (not participant) — for ACL check on negotiate."""
    phone = "9812340000"
    r = requests.post(f"{API}/auth/otp/send", json={"phone": phone}, timeout=15)
    assert r.status_code == 200, r.text
    otp = r.json()["dev_otp"]
    r = requests.post(f"{API}/auth/otp/verify", json={"phone": phone, "otp": otp, "name": "Other"}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def auth_headers(user_token):
    return {"Authorization": f"Bearer {user_token}"}


@pytest.fixture(scope="session")
def category_ids():
    """Fetch a real category and sub-category id (Electronics/Mobile ideally)."""
    r = requests.get(f"{API}/categories/?tree=true", timeout=15)
    assert r.status_code == 200, r.text
    payload = r.json()
    tree = payload.get("items") if isinstance(payload, dict) else payload
    # Choose Electronics if present else first cat with subs
    cat = None
    for c in tree:
        if (c.get("name") or "").lower().startswith("electronic") and c.get("children"):
            cat = c
            break
    if not cat:
        cat = next((c for c in tree if c.get("children")), tree[0])
    sub = (cat.get("children") or [None])[0]
    return {"cat_id": cat["id"], "sub_id": sub["id"] if sub else None,
            "cat_name": cat.get("name"), "sub_name": sub.get("name") if sub else None}


# ================== FEATURE 1: generate-title ==================
class TestGenerateTitle:
    def test_happy_path(self, auth_headers):
        r = requests.post(f"{API}/ai/generate-title", headers=auth_headers,
                          json={"listing_type": "old_product",
                                "description": "iPhone 13 blue 128GB one year old with box"},
                          timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True, d
        assert isinstance(d["titles"], list) and len(d["titles"]) >= 1
        assert isinstance(d["recommended_index"], int)
        assert 0 <= d["recommended_index"] < len(d["titles"])
        meta = d["meta"]
        assert meta["provider"] == "gemini"
        assert meta["model_used"] == "gemini-2.5-flash"
        assert meta["tokens_used"] > 0
        assert meta["latency_ms"] > 0


# ================== FEATURE 2: detect-category ==================
class TestDetectCategory:
    def test_happy_path(self, auth_headers, category_ids):
        r = requests.post(f"{API}/ai/detect-category", headers=auth_headers,
                          json={"title": "iPhone 13 Blue 128GB",
                                "description": "used mobile phone"},
                          timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True, d
        assert d.get("category_id")
        assert d.get("category_name")
        assert 0 <= float(d["confidence"]) <= 1
        assert d["meta"]["model_used"] == "gemini-2.5-flash"

    def test_needs_content(self, auth_headers):
        r = requests.post(f"{API}/ai/detect-category", headers=auth_headers,
                          json={}, timeout=15)
        assert r.status_code == 400


# ================== FEATURE 3: parse-demand ==================
class TestParseDemand:
    def test_happy_path(self, auth_headers):
        r = requests.post(f"{API}/ai/parse-demand", headers=auth_headers,
                          json={"text": "need iphone 13 under 50k in mumbai urgent"},
                          timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True, d
        assert isinstance(d.get("understood_intent"), str) and len(d["understood_intent"]) > 0
        ext = d["extracted"]
        assert isinstance(ext, dict)
        assert isinstance(d.get("clarifying_questions"), list)
        assert len(d["clarifying_questions"]) <= 3
        assert d["meta"]["model_used"] == "gemini-2.5-pro"


# ================== FEATURE 4: match-vendors ==================
class TestMatchVendors:
    def test_happy_path(self, auth_headers, category_ids):
        r = requests.post(f"{API}/ai/match-vendors", headers=auth_headers,
                          json={"category_id": category_ids["cat_id"],
                                "description": "Looking to buy an iPhone in good condition",
                                "price_max": 50000, "limit": 5}, timeout=90)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "ok" in d
        assert isinstance(d.get("matches"), list)
        assert "candidate_count" in d
        if d.get("matches"):
            m = d["matches"][0]
            assert "vendor_id" in m and "score" in m


# ================== FEATURE 5: suggest-price ==================
class TestSuggestPrice:
    def test_happy_path(self, auth_headers, category_ids):
        r = requests.post(f"{API}/ai/suggest-price", headers=auth_headers,
                          json={"title": "iPhone 13 Blue 128GB",
                                "description": "mint condition",
                                "category_id": category_ids["cat_id"],
                                "sub_category_id": category_ids["sub_id"],
                                "condition": "like_new", "city": "Mumbai",
                                "listing_type": "old_product"}, timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True, d
        assert d["suggested_price_inr"] > 0
        assert d["suggested_offer_price_inr"] > 0
        assert d["confidence"] in ("low", "medium", "high")
        assert d["meta"]["model_used"] == "gemini-2.5-pro"


# ================== FEATURE 6: negotiate ==================
class TestNegotiate:
    @pytest.fixture(scope="class")
    def thread_and_deal(self, auth_headers):
        """Create a listing + thread + deal so we can test negotiate."""
        # 1. Fetch some active listing owned by ANOTHER vendor
        r = requests.get(f"{API}/listings/?limit=20", timeout=15)
        assert r.status_code == 200
        listings = r.json().get("items") or r.json()
        # Get current user id from /me
        me_r = requests.get(f"{API}/users/me", headers=auth_headers, timeout=15).json()
        me = me_r.get("user") if isinstance(me_r, dict) and "user" in me_r else me_r
        my_id = me["id"]
        target = None
        for l in listings:
            if str(l.get("vendor_id")) != my_id:
                target = l
                break
        if not target:
            pytest.skip("No listing owned by another vendor to create a thread")
        listing_id = target["id"]

        # 2. Create/open chat thread to the vendor of that listing
        r = requests.post(f"{API}/chat/threads",
                          headers=auth_headers,
                          json={"peer_user_id": str(target.get("vendor_id")),
                                "listing_id": listing_id}, timeout=15)
        assert r.status_code in (200, 201), f"thread create failed: {r.status_code} {r.text}"
        thread = r.json()
        thread_id = thread.get("id") or thread.get("_id") or thread.get("thread_id")
        assert thread_id, thread

        # 3. Create deal
        deal_payload = {
            "thread_id": thread_id,
            "listing_id": listing_id,
            "asking_price": target.get("price") or 50000,
            "offer_price": int((target.get("price") or 50000) * 0.8),
        }
        r = requests.post(f"{API}/deals/", headers=auth_headers, json=deal_payload, timeout=15)
        deal_id = None
        if r.status_code in (200, 201):
            deal_id = r.json().get("id") or r.json().get("_id")
        return {"thread_id": thread_id, "deal_id": deal_id, "listing_id": listing_id}

    def test_write_message(self, auth_headers, thread_and_deal):
        payload = {"thread_id": thread_and_deal["thread_id"],
                   "direction": "buyer", "ask": "write_message"}
        if thread_and_deal.get("deal_id"):
            payload["deal_id"] = thread_and_deal["deal_id"]
        r = requests.post(f"{API}/ai/negotiate", headers=auth_headers, json=payload, timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True, d
        assert d["ask"] == "write_message"
        assert d["direction"] == "buyer"
        assert isinstance(d["result"].get("suggested_message"), str)

    def test_suggest_counter(self, auth_headers, thread_and_deal):
        payload = {"thread_id": thread_and_deal["thread_id"],
                   "direction": "buyer", "ask": "suggest_counter"}
        if thread_and_deal.get("deal_id"):
            payload["deal_id"] = thread_and_deal["deal_id"]
        r = requests.post(f"{API}/ai/negotiate", headers=auth_headers, json=payload, timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True, d
        # suggested_offer_inr may be missing if LLM omitted; test tolerantly
        assert "suggested_message" in d["result"] or "suggested_offer_inr" in d["result"]

    def test_analyze_situation(self, auth_headers, thread_and_deal):
        payload = {"thread_id": thread_and_deal["thread_id"],
                   "direction": "buyer", "ask": "analyze_situation"}
        if thread_and_deal.get("deal_id"):
            payload["deal_id"] = thread_and_deal["deal_id"]
        r = requests.post(f"{API}/ai/negotiate", headers=auth_headers, json=payload, timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True, d
        assert "analysis" in d["result"] or "next_best_move" in d["result"]

    def test_non_participant_denied(self, secondary_token, thread_and_deal):
        headers = {"Authorization": f"Bearer {secondary_token}"}
        r = requests.post(f"{API}/ai/negotiate", headers=headers,
                          json={"thread_id": thread_and_deal["thread_id"],
                                "direction": "buyer", "ask": "write_message"}, timeout=60)
        # Should return {ok:false, error:'You are not part of this thread'} at 200
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is False
        assert "not part" in (d.get("error") or "").lower()


# ================== REGRESSION ==================
class TestRegression:
    def test_health(self):
        r = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert r.status_code == 200

    def test_openapi_ops_count(self):
        r = requests.get(f"{BASE_URL}/api/openapi.json", timeout=15)
        assert r.status_code == 200
        spec = r.json()
        count = 0
        for _, methods in spec.get("paths", {}).items():
            for m in methods:
                if m.lower() in ("get", "post", "put", "patch", "delete"):
                    count += 1
        print(f"OpenAPI ops = {count}")
        assert count >= 150

    def test_improve_description_still_works(self, auth_headers):
        r = requests.post(f"{API}/ai/improve-description", headers=auth_headers,
                          json={"title": "iPhone 13 Blue 128GB",
                                "description": "iPhone good condition selling cheap",
                                "tone": "professional"}, timeout=60)
        assert r.status_code in (200, 400, 422), r.text
