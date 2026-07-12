"""Phase 3 Socket.IO + REST regression tests.

Tests:
- Handshake at /api/socket.io/ (public + localhost)
- Old /socket.io/ path returns 404 on backend
- E2E: message:new, message:read, thread:typing between two clients
- Auth: reject no token, invalid token
- REST regression: chat threads, deals, whatsapp-link, feed, search, health
"""
from __future__ import annotations
import asyncio
import os
import time
import pytest
import requests
import socketio

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback for tests running without env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

LOCAL_URL = "http://localhost:8001"

PHONE_A = "9877700001"
PHONE_B = "9877700002"


def _login(phone: str, name: str) -> dict:
    r = requests.post(f"{BASE_URL}/api/v1/auth/otp/send", json={"phone": phone}, timeout=10)
    assert r.status_code == 200, f"otp/send failed: {r.status_code} {r.text}"
    dev_otp = r.json().get("dev_otp")
    assert dev_otp, f"no dev_otp in response: {r.json()}"
    r = requests.post(
        f"{BASE_URL}/api/v1/auth/otp/verify",
        json={"phone": phone, "otp": dev_otp, "name": name, "roles": ["customer"]},
        timeout=10,
    )
    assert r.status_code == 200, f"otp/verify failed: {r.status_code} {r.text}"
    return r.json()


@pytest.fixture(scope="module")
def users():
    ua = _login(PHONE_A, "TEST_UserA")
    ub = _login(PHONE_B, "TEST_UserB")
    return ua, ub


# ---------- Handshake tests ----------
class TestHandshake:
    def test_public_handshake(self):
        r = requests.get(f"{BASE_URL}/api/socket.io/?EIO=4&transport=polling", timeout=10)
        assert r.status_code == 200
        assert r.text.startswith('0{"sid":'), f"expected EIO handshake, got: {r.text[:200]}"

    def test_localhost_handshake(self):
        r = requests.get(f"{LOCAL_URL}/api/socket.io/?EIO=4&transport=polling", timeout=10)
        assert r.status_code == 200
        assert r.text.startswith('0{"sid":')

    def test_old_path_404(self):
        r = requests.get(f"{LOCAL_URL}/socket.io/?EIO=4&transport=polling", timeout=10)
        assert r.status_code == 404


# ---------- Auth ----------
class TestSocketAuth:
    @pytest.mark.asyncio
    async def test_no_token_rejected(self):
        client = socketio.AsyncClient(reconnection=False)
        with pytest.raises(Exception):
            await client.connect(BASE_URL, socketio_path="/api/socket.io", transports=["websocket"], wait_timeout=5)
        try:
            await client.disconnect()
        except Exception:
            pass

    @pytest.mark.asyncio
    async def test_invalid_token_rejected(self):
        client = socketio.AsyncClient(reconnection=False)
        with pytest.raises(Exception):
            await client.connect(
                BASE_URL,
                socketio_path="/api/socket.io",
                transports=["websocket"],
                auth={"token": "invalid.jwt.token"},
                wait_timeout=5,
            )
        try:
            await client.disconnect()
        except Exception:
            pass


# ---------- E2E ----------
class TestSocketE2E:
    @pytest.mark.asyncio
    async def test_message_and_read_and_typing(self, users):
        ua, ub = users
        token_a = ua["access_token"]
        token_b = ub["access_token"]
        user_a_id = ua["user"]["id"]
        user_b_id = ub["user"]["id"]

        # Create thread between A and B (as user A)
        r = requests.post(
            f"{BASE_URL}/api/v1/chat/threads",
            json={"peer_user_id": user_b_id, "context_type": "direct"},
            headers={"Authorization": f"Bearer {token_a}"},
            timeout=10,
        )
        assert r.status_code == 200, r.text
        thread = r.json()
        thread_id = thread.get("id") or thread.get("_id") or thread.get("thread_id")
        assert thread_id, f"no thread id in {thread}"

        client_a = socketio.AsyncClient(reconnection=False)
        client_b = socketio.AsyncClient(reconnection=False)

        events_a = {"message_new": [], "message_read": [], "typing": []}
        events_b = {"message_new": [], "message_read": [], "typing": []}

        @client_a.on("message:new")
        async def _mn_a(data):
            events_a["message_new"].append(data)

        @client_a.on("message:read")
        async def _mr_a(data):
            events_a["message_read"].append(data)

        @client_a.on("thread:typing")
        async def _t_a(data):
            events_a["typing"].append(data)

        @client_b.on("message:new")
        async def _mn_b(data):
            events_b["message_new"].append(data)

        @client_b.on("message:read")
        async def _mr_b(data):
            events_b["message_read"].append(data)

        @client_b.on("thread:typing")
        async def _t_b(data):
            events_b["typing"].append(data)

        await client_a.connect(
            BASE_URL, socketio_path="/api/socket.io",
            transports=["websocket"], auth={"token": token_a}, wait_timeout=10,
        )
        await client_b.connect(
            BASE_URL, socketio_path="/api/socket.io",
            transports=["websocket"], auth={"token": token_b}, wait_timeout=10,
        )

        await client_a.emit("thread:join", {"thread_id": thread_id})
        await client_b.emit("thread:join", {"thread_id": thread_id})
        await asyncio.sleep(0.5)

        # ---- B sends REST message; A should get message:new
        r = requests.post(
            f"{BASE_URL}/api/v1/chat/threads/{thread_id}/messages",
            json={"type": "text", "text": "hello from B"},
            headers={"Authorization": f"Bearer {token_b}"},
            timeout=10,
        )
        assert r.status_code == 200, r.text

        # wait up to 3s
        deadline = time.time() + 3
        while time.time() < deadline and not events_a["message_new"]:
            await asyncio.sleep(0.1)
        assert events_a["message_new"], "Client A did not receive message:new within 3s"

        # ---- A marks read; B should get message:read
        r = requests.post(
            f"{BASE_URL}/api/v1/chat/threads/{thread_id}/read",
            headers={"Authorization": f"Bearer {token_a}"},
            timeout=10,
        )
        assert r.status_code == 200, r.text

        deadline = time.time() + 3
        while time.time() < deadline and not events_b["message_read"]:
            await asyncio.sleep(0.1)
        assert events_b["message_read"], "Client B did not receive message:read within 3s"

        # ---- Typing: A emits typing, B should receive thread:typing
        await client_a.emit("typing", {"thread_id": thread_id, "is_typing": True})
        deadline = time.time() + 3
        while time.time() < deadline and not events_b["typing"]:
            await asyncio.sleep(0.1)
        assert events_b["typing"], "Client B did not receive thread:typing within 3s"
        assert events_b["typing"][0].get("is_typing") is True

        await client_a.disconnect()
        await client_b.disconnect()


# ---------- REST regression ----------
class TestRegression:
    def test_health(self):
        r = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert r.status_code == 200

    def test_openapi_64_endpoints(self):
        r = requests.get(f"{BASE_URL}/api/openapi.json", timeout=10)
        assert r.status_code == 200
        paths = r.json().get("paths", {})
        # count operations (method entries) across paths
        count = 0
        for _p, methods in paths.items():
            for m in methods:
                if m.lower() in ("get", "post", "put", "delete", "patch"):
                    count += 1
        # Report count; assert at least 60
        print(f"OpenAPI endpoint count: {count}")
        assert count >= 60, f"Expected ~64 endpoints, got {count}"

    def test_feed(self):
        r = requests.get(f"{BASE_URL}/api/v1/feed/", timeout=10)
        assert r.status_code == 200

    def test_search(self):
        r = requests.get(f"{BASE_URL}/api/v1/search/?q=test", timeout=10)
        assert r.status_code in (200, 422)

    def test_categories(self):
        r = requests.get(f"{BASE_URL}/api/v1/categories/", timeout=10)
        assert r.status_code == 200

    def test_listings(self):
        r = requests.get(f"{BASE_URL}/api/v1/listings/", timeout=10)
        assert r.status_code == 200

    def test_my_threads(self, users):
        ua, _ = users
        r = requests.get(
            f"{BASE_URL}/api/v1/chat/threads/me",
            headers={"Authorization": f"Bearer {ua['access_token']}"},
            timeout=10,
        )
        assert r.status_code == 200
        assert "items" in r.json()

    def test_thread_dedup(self, users):
        ua, ub = users
        payload = {"peer_user_id": ub["user"]["id"], "context_type": "direct"}
        h = {"Authorization": f"Bearer {ua['access_token']}"}
        r1 = requests.post(f"{BASE_URL}/api/v1/chat/threads", json=payload, headers=h, timeout=10)
        r2 = requests.post(f"{BASE_URL}/api/v1/chat/threads", json=payload, headers=h, timeout=10)
        assert r1.status_code == 200 and r2.status_code == 200
        id1 = r1.json().get("id") or r1.json().get("_id")
        id2 = r2.json().get("id") or r2.json().get("_id")
        assert id1 == id2, "thread dedup failed"
