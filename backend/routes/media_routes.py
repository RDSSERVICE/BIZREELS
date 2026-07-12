"""Media routes: signed upload params + backend proxy upload (dev fallback)."""
from __future__ import annotations
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from middleware.auth_middleware import require_auth
from services import cloudinary_service

router = APIRouter(prefix="/v1/media", tags=["media"])


class SignBody(BaseModel):
    folder: str = "listings/misc"
    resource_type: str = "image"  # image | video


@router.post("/sign")
async def sign(body: SignBody, user=Depends(require_auth)):
    try:
        return cloudinary_service.sign_upload(body.folder, body.resource_type)
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.post("/upload")
async def upload_proxy(
    file: UploadFile = File(...),
    folder: str = Form("listings/misc"),
    resource_type: str = Form("image"),
    user=Depends(require_auth),
):
    """Backend proxy upload — used automatically in dev mode. Also handles real
    Cloudinary uploads when the frontend doesn't want to talk to Cloudinary directly."""
    try:
        data = await file.read()
        return await cloudinary_service.upload_file(
            data, file.filename or "upload", file.content_type or "application/octet-stream",
            folder, resource_type,
        )
    except cloudinary_service.CloudinaryConfigError as e:
        raise HTTPException(503, str(e))
    except ValueError as e:
        raise HTTPException(400, str(e))
