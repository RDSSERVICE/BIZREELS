"""Backend tests for Phase 0 Auth (MSG91 OTP + JWT + multi-role users)."""
import os
import time
import hashlib
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
API = f"{BASE_URL}/api"
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

# Test phones
FRESH_PHONE = "9876500123"
ADMIN_PHONE = "9999999999"


@pytest.fixture(scope="session")
def db():
    return MongoClient(MONGO_URL)[DB_NAME]


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


def _cleanup_phone(db, phone):
    db.otp_requests.delete_many({"phone": phone})
    user = db.users.find_one({"phone": phone})
    if user and phone == FRESH_PHONE:
        db.refresh_tokens.delete_many({"user_id": str(user["_id"])})
        db.users.delete_one({"_id": user["_id"]})


# ---------- Health & OpenAPI ----------
def test_health(s):
    r = s.get(f"{API}/health")
    assert r.status_code == 200
    j = r.json()
    assert j["status"] == "ok"
    assert j["otp_dev_mode"] is True


def test_openapi(s):
    r = s.get(f"{API}/openapi.json")
    assert r.status_code == 200
    paths = r.json()["paths"]
    for p in ["/api/v1/auth/otp/send", "/api/v1/auth/otp/verify", "/api/v1/auth/refresh",
              "/api/v1/auth/logout", "/api/v1/users/me", "/api/v1/users/me/switch-role",
              "/api/v1/users/me/add-role"]:
        assert p in paths, f"missing {p}"


# ---------- SEC-001: dev_otp gated ----------
def test_send_otp_returns_dev_otp(s, db):
    _cleanup_phone(db, FRESH_PHONE)
    r = s.post(f"{API}/v1/auth/otp/send", json={"phone": FRESH_PHONE})
    assert r.status_code == 200, r.text
    j = r.json()
    assert j.get("dev_mode") is True
    assert "dev_otp" in j and len(j["dev_otp"]) == 6
    assert j["expires_in_seconds"] == 300


def test_invalid_phone_rejected(s):
    r = s.post(f"{API}/v1/auth/otp/send", json={"phone": "1234567890"})
    assert r.status_code == 400


# ---------- Admin seed ----------
def test_admin_seeded(db):
    admin = db.users.find_one({"phone": ADMIN_PHONE})
    assert admin is not None
    assert "admin" in admin["roles"]
    assert "customer" in admin["roles"]


# ---------- OTP verify + JWT flow ----------
@pytest.fixture(scope="module")
def fresh_login():
    """Full signup flow returning tokens + user."""
    db = MongoClient(MONGO_URL)[DB_NAME]
    _cleanup_phone(db, FRESH_PHONE)
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/v1/auth/otp/send", json={"phone": FRESH_PHONE})
    assert r.status_code == 200
    otp = r.json()["dev_otp"]
    r2 = s.post(f"{API}/v1/auth/otp/verify",
                json={"phone": FRESH_PHONE, "otp": otp, "name": "Priya Test", "roles": ["customer", "vendor"]})
    assert r2.status_code == 200, r2.text
    return r2.json()


def test_verify_returns_tokens_and_user(fresh_login):
    assert "access_token" in fresh_login
    assert "refresh_token" in fresh_login
    u = fresh_login["user"]
    assert u["phone"] == FRESH_PHONE
    assert u["name"] == "Priya Test"
    assert set(u["roles"]) == {"customer", "vendor"}
    assert u["current_role"] == "customer"


def test_get_me_with_access_token(fresh_login):
    tok = fresh_login["access_token"]
    r = requests.get(f"{API}/v1/users/me", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 200
    assert r.json()["user"]["phone"] == FRESH_PHONE


def test_get_me_without_token():
    r = requests.get(f"{API}/v1/users/me")
    assert r.status_code == 401


# ---------- Duplicate phone login returns same user ----------
def test_duplicate_phone_returns_same_user(fresh_login, s):
    orig_id = fresh_login["user"]["id"]
    r = s.post(f"{API}/v1/auth/otp/send", json={"phone": FRESH_PHONE})
    otp = r.json()["dev_otp"]
    r2 = s.post(f"{API}/v1/auth/otp/verify",
                json={"phone": FRESH_PHONE, "otp": otp})
    assert r2.status_code == 200
    assert r2.json()["user"]["id"] == orig_id


# ---------- Invalid OTP + attempts ----------
def test_invalid_otp_attempts(s, db):
    phone = "9876500456"
    _cleanup_phone(db, phone)
    r = s.post(f"{API}/v1/auth/otp/send", json={"phone": phone})
    assert r.status_code == 200
    # 5 bad attempts
    for i in range(5):
        rr = s.post(f"{API}/v1/auth/otp/verify", json={"phone": phone, "otp": "000000"})
        assert rr.status_code == 400
    # 6th should be 429
    rr = s.post(f"{API}/v1/auth/otp/verify", json={"phone": phone, "otp": "000000"})
    assert rr.status_code == 429
    _cleanup_phone(db, phone)


# ---------- OTP hash stored (not plaintext) ----------
def test_otp_stored_as_hash(s, db):
    phone = "9876500789"
    _cleanup_phone(db, phone)
    r = s.post(f"{API}/v1/auth/otp/send", json={"phone": phone})
    otp = r.json()["dev_otp"]
    rec = db.otp_requests.find_one({"phone": phone, "verified": False})
    assert rec is not None
    assert rec["otp_hash"] == hashlib.sha256(otp.encode()).hexdigest()
    assert "otp" not in rec or rec.get("otp") != otp
    _cleanup_phone(db, phone)


# ---------- New OTP invalidates previous ----------
def test_new_otp_invalidates_previous(s, db):
    phone = "9876511111"
    _cleanup_phone(db, phone)
    r1 = s.post(f"{API}/v1/auth/otp/send", json={"phone": phone})
    otp1 = r1.json()["dev_otp"]
    r2 = s.post(f"{API}/v1/auth/otp/send", json={"phone": phone})
    otp2 = r2.json()["dev_otp"]
    # old OTP should fail (only 1 pending record)
    rr = s.post(f"{API}/v1/auth/otp/verify", json={"phone": phone, "otp": otp1})
    # If otp1 == otp2 by chance, this would pass. But they're 6-digit random.
    if otp1 != otp2:
        assert rr.status_code == 400
    _cleanup_phone(db, phone)


# ---------- Rate limit ----------
def test_rate_limit_otp_send(s, db):
    phone = "9876522222"
    _cleanup_phone(db, phone)
    codes = []
    for _ in range(4):
        r = s.post(f"{API}/v1/auth/otp/send", json={"phone": phone})
        codes.append(r.status_code)
    assert codes[:3] == [200, 200, 200]
    assert codes[3] == 429
    _cleanup_phone(db, phone)


# ---------- SEC-003: refresh rotation + reuse detection ----------
def test_refresh_rotation_and_reuse_detection(s, db):
    phone = "9876533333"
    _cleanup_phone(db, phone)
    r = s.post(f"{API}/v1/auth/otp/send", json={"phone": phone})
    otp = r.json()["dev_otp"]
    r2 = s.post(f"{API}/v1/auth/otp/verify", json={"phone": phone, "otp": otp, "name": "R"})
    tokens = r2.json()
    old_refresh = tokens["refresh_token"]

    # Rotate: refresh returns NEW refresh_token
    r3 = s.post(f"{API}/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert r3.status_code == 200
    j3 = r3.json()
    assert "refresh_token" in j3
    assert "access_token" in j3
    new_refresh = j3["refresh_token"]
    assert new_refresh != old_refresh

    # Reuse OLD -> 401 with "reuse detected"
    r4 = s.post(f"{API}/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert r4.status_code == 401
    assert "reuse" in r4.json().get("detail", "").lower()

    # After reuse: family burn -> NEW refresh also invalid
    r5 = s.post(f"{API}/v1/auth/refresh", json={"refresh_token": new_refresh})
    assert r5.status_code == 401

    _cleanup_phone(db, phone)


# ---------- Logout revokes refresh ----------
def test_logout_revokes_refresh(s, db):
    phone = "9876544444"
    _cleanup_phone(db, phone)
    r = s.post(f"{API}/v1/auth/otp/send", json={"phone": phone})
    otp = r.json()["dev_otp"]
    r2 = s.post(f"{API}/v1/auth/otp/verify", json={"phone": phone, "otp": otp})
    rt = r2.json()["refresh_token"]
    r3 = s.post(f"{API}/v1/auth/logout", json={"refresh_token": rt})
    assert r3.status_code == 200
    r4 = s.post(f"{API}/v1/auth/refresh", json={"refresh_token": rt})
    assert r4.status_code == 401
    _cleanup_phone(db, phone)


# ---------- Role management ----------
def test_add_role_rejects_admin(fresh_login):
    tok = fresh_login["access_token"]
    r = requests.post(f"{API}/v1/users/me/add-role",
                      json={"role": "admin"},
                      headers={"Authorization": f"Bearer {tok}"})
    # pydantic Literal on route may allow admin but service rejects with 400
    assert r.status_code == 400


def test_add_role_creator(fresh_login):
    tok = fresh_login["access_token"]
    r = requests.post(f"{API}/v1/users/me/add-role",
                      json={"role": "creator"},
                      headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 200
    assert "creator" in r.json()["user"]["roles"]


def test_switch_role(fresh_login):
    tok = fresh_login["access_token"]
    r = requests.post(f"{API}/v1/users/me/switch-role",
                      json={"role": "vendor"},
                      headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 200
    assert r.json()["user"]["current_role"] == "vendor"


def test_switch_role_not_owned(fresh_login, db):
    # Ensure user doesn't have some role temporarily — use admin (not in user's roles)
    tok = fresh_login["access_token"]
    r = requests.post(f"{API}/v1/users/me/switch-role",
                      json={"role": "admin"},
                      headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 400


def test_patch_profile(fresh_login):
    tok = fresh_login["access_token"]
    r = requests.patch(f"{API}/v1/users/me",
                       json={"name": "Priya Updated", "gender": "female"},
                       headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 200
    u = r.json()["user"]
    assert u["name"] == "Priya Updated"
    assert u["gender"] == "female"


def test_patch_profile_invalid_current_role(fresh_login):
    tok = fresh_login["access_token"]
    r = requests.patch(f"{API}/v1/users/me",
                       json={"current_role": "admin"},
                       headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 400


# ---------- Mongo indexes ----------
def test_mongo_indexes(db):
    otp_idx = db.otp_requests.index_information()
    rt_idx = db.refresh_tokens.index_information()
    users_idx = db.users.index_information()

    # TTL
    ttl_otp = [v for v in otp_idx.values() if v.get("expireAfterSeconds") == 0]
    assert any("expires_at" in str(v.get("key")) for v in ttl_otp)
    ttl_rt = [v for v in rt_idx.values() if v.get("expireAfterSeconds") == 0]
    assert any("expires_at" in str(v.get("key")) for v in ttl_rt)
    # unique phone
    phone_idx = [v for v in users_idx.values() if v.get("key") == [("phone", 1)]]
    assert phone_idx and phone_idx[0].get("unique") is True
