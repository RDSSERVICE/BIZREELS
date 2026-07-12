"""JWT auth + RBAC dependencies for FastAPI routes."""
from __future__ import annotations
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

from utils.jwt_utils import decode_access_token
from services.user_service import get_user_by_id

bearer_scheme = HTTPBearer(auto_error=False)


async def require_auth(
    request: Request,
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
):
    if creds is None or creds.scheme.lower() != "bearer":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    try:
        payload = decode_access_token(creds.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Access token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid access token")

    if payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Wrong token type")

    user = await get_user_by_id(payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found or disabled")

    request.state.user = user
    return user


def require_roles(*roles: str):
    async def _dep(user=Depends(require_auth)):
        if not set(roles).intersection(user.roles):
            raise HTTPException(status.HTTP_403_FORBIDDEN, f"Requires role: {roles}")
        return user

    return _dep
